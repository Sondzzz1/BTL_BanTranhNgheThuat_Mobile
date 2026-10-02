using System.Data;
using System.Text.Json;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class HoanTraRepository : IHoanTraRepository
{
    private readonly string _connectionString;

    private const string SelectReturn = @"
        SELECT y.MaYeuCau, y.MaDonHang, y.MaNguoiDung, y.MaTacPham, y.MaChiTietDH,
               y.SoLuongTra, y.LyDo, y.LyDoKhac, y.MoTa, y.HinhAnh, y.TrangThai,
               y.LyDoTuChoi, y.CoTheBanLai, y.SoTienHoan, y.PhuongThucHoanTien,
               y.TrangThaiHoanTien, y.NgayNhanHang, y.NgayHoanTien, y.NgayTao, y.NgayCapNhat,
               t.TenTacPham, t.HinhAnh AS HinhAnhTacPham,
               c.DonGia AS GiaTacPham, ISNULL(c.SoLuong, 1) AS SoLuong,
               nd.Ten AS TenNguoiDung, nd.Email AS EmailNguoiDung,
               nd.DienThoai AS SoDienThoaiNguoiDung,
               dh.NgayDat AS NgayDatHang, dh.TongTien AS TongTienDonHang
        FROM YeuCauHoanTra y
        LEFT JOIN TacPham t ON t.MaTacPham=y.MaTacPham
        LEFT JOIN NguoiDung nd ON nd.MaNguoiDung=y.MaNguoiDung
        LEFT JOIN DonHang dh ON dh.MaDonHang=y.MaDonHang
        OUTER APPLY
        (
            SELECT TOP (1) d.MaChiTietDH, d.SoLuong, d.DonGia
            FROM ChiTietDonHang d
            WHERE d.MaChiTietDH=y.MaChiTietDH
               OR (y.MaChiTietDH IS NULL AND d.MaDonHang=y.MaDonHang AND d.MaTacPham=y.MaTacPham)
            ORDER BY CASE WHEN d.MaChiTietDH=y.MaChiTietDH THEN 0 ELSE 1 END, d.MaChiTietDH
        ) c";

    public HoanTraRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<bool> LaTranhDatVe(int maNguoiDung, TaoHoanTraRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            SELECT TOP (1) CASE WHEN ISNULL(t.LoaiTacPham,0) IN (1,3,4)
                                      OR t.MaYeuCauVeTranh IS NOT NULL THEN 1 ELSE 0 END
            FROM DonHang d
            INNER JOIN ChiTietDonHang c ON c.MaDonHang=d.MaDonHang
            INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            WHERE d.MaDonHang=@MaDonHang AND d.MaNguoiDung=@MaNguoiDung
              AND ((@MaChiTietDH IS NOT NULL AND c.MaChiTietDH=@MaChiTietDH)
                OR (@MaChiTietDH IS NULL AND c.MaTacPham=@MaTacPham));";
        await using var command = new SqlCommand(sql, connection);
        AddLineIdentityParameters(command, maNguoiDung, request);
        var value = await command.ExecuteScalarAsync();
        return value != null && value != DBNull.Value && Convert.ToInt32(value) == 1;
    }

    public async Task<int> TaoYeuCauHoanTra(int maNguoiDung, TaoHoanTraRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            const string lineSql = @"
                SELECT c.MaChiTietDH, c.MaTacPham, c.SoLuong, c.SoLuongDaHoan,
                       d.TrangThai, d.NgayDat, d.NgayGiao
                FROM DonHang d WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN ChiTietDonHang c WITH (UPDLOCK,HOLDLOCK) ON c.MaDonHang=d.MaDonHang
                WHERE d.MaDonHang=@MaDonHang AND d.MaNguoiDung=@MaNguoiDung
                  AND ((@MaChiTietDH IS NOT NULL AND c.MaChiTietDH=@MaChiTietDH)
                    OR (@MaChiTietDH IS NULL AND c.MaTacPham=@MaTacPham));";
            await using var lineCommand = new SqlCommand(lineSql, connection, transaction);
            AddLineIdentityParameters(lineCommand, maNguoiDung, request);

            var lines = new List<(int Id, int ArtworkId, int Quantity, int Returned, byte OrderStatus, DateTime EligibleFrom)>();
            await using (var reader = await lineCommand.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                    lines.Add((reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetByte(4), reader.IsDBNull(6) ? reader.GetDateTime(5) : reader.GetDateTime(6)));
            }

            if (lines.Count == 0) throw new InvalidOperationException("Dòng sản phẩm không thuộc đơn hàng của bạn");
            if (!request.MaChiTietDH.HasValue && lines.Count != 1)
                throw new InvalidOperationException("Không xác định được dòng đơn hàng; vui lòng gửi MaChiTietDH");
            var line = lines[0];
            if (line.OrderStatus != 3) throw new InvalidOperationException("Đơn hàng chưa được giao nên không thể hoàn trả");
            var days = (DateTime.Now.Date - line.EligibleFrom.Date).TotalDays;
            if (days < 0 || days > 7) throw new InvalidOperationException("Đã quá thời hạn hoàn trả 7 ngày kể từ khi giao hàng");

            const string reservedSql = @"
                SELECT ISNULL(SUM(SoLuongTra),0) FROM YeuCauHoanTra WITH (UPDLOCK,HOLDLOCK)
                WHERE MaChiTietDH=@MaChiTietDH
                  AND TrangThai IN ('CHO_DUYET','DA_DUYET','DANG_HOAN_TRA');";
            await using var reservedCommand = new SqlCommand(reservedSql, connection, transaction);
            reservedCommand.Parameters.AddWithValue("@MaChiTietDH", line.Id);
            var reserved = Convert.ToInt32(await reservedCommand.ExecuteScalarAsync());
            if (request.SoLuongTra > line.Quantity - line.Returned - reserved)
                throw new InvalidOperationException("Số lượng hoàn trả vượt quá số lượng còn có thể hoàn của dòng đơn");

            var imagesJson = request.HinhAnh is { Count: > 0 } ? JsonSerializer.Serialize(request.HinhAnh) : null;
            const string insertSql = @"
                INSERT INTO YeuCauHoanTra
                    (MaDonHang,MaNguoiDung,MaTacPham,MaChiTietDH,SoLuongTra,LyDo,LyDoKhac,MoTa,HinhAnh,TrangThai,NgayTao,NgayCapNhat)
                OUTPUT INSERTED.MaYeuCau
                VALUES (@MaDonHang,@MaNguoiDung,@MaTacPham,@MaChiTietDH,@SoLuongTra,@LyDo,@LyDoKhac,@MoTa,@HinhAnh,'CHO_DUYET',GETDATE(),GETDATE());";
            await using var insert = new SqlCommand(insertSql, connection, transaction);
            insert.Parameters.AddWithValue("@MaDonHang", request.MaDonHang);
            insert.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            insert.Parameters.AddWithValue("@MaTacPham", line.ArtworkId);
            insert.Parameters.AddWithValue("@MaChiTietDH", line.Id);
            insert.Parameters.AddWithValue("@SoLuongTra", request.SoLuongTra);
            insert.Parameters.AddWithValue("@LyDo", request.LyDo);
            insert.Parameters.AddWithValue("@LyDoKhac", Db(request.LyDoKhac));
            insert.Parameters.AddWithValue("@MoTa", Db(request.MoTa));
            insert.Parameters.AddWithValue("@HinhAnh", Db(imagesJson));
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());
            await transaction.CommitAsync();
            return id;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public Task<List<HoanTraSummaryResponse>> GetByNguoiDung(int maNguoiDung) =>
        QuerySummaries(SelectReturn + " WHERE y.MaNguoiDung=@MaNguoiDung ORDER BY y.NgayTao DESC", command => command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung));

    public async Task<HoanTraDetailResponse?> GetById(int maYeuCau, int? maNguoiDung = null)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = SelectReturn + " WHERE y.MaYeuCau=@MaYeuCau" + (maNguoiDung.HasValue ? " AND y.MaNguoiDung=@MaNguoiDung" : string.Empty);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        if (maNguoiDung.HasValue) command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung.Value);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapToDetail(reader) : null;
    }

    public Task<bool> XacNhanDaGuiHang(int maYeuCau, int maNguoiDung) => ExecuteConditional(@"
        UPDATE YeuCauHoanTra SET TrangThai='DANG_HOAN_TRA',NgayCapNhat=GETDATE()
        WHERE MaYeuCau=@MaYeuCau AND MaNguoiDung=@MaNguoiDung AND TrangThai='DA_DUYET';", command =>
    {
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
    });

    public Task<bool> HuyYeuCau(int maYeuCau, int maNguoiDung) => ExecuteConditional(@"
        UPDATE YeuCauHoanTra SET TrangThai='DA_HUY',NgayHuy=GETDATE(),NgayCapNhat=GETDATE()
        WHERE MaYeuCau=@MaYeuCau AND MaNguoiDung=@MaNguoiDung AND TrangThai='CHO_DUYET';", command =>
    {
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
    });

    public async Task<bool> KiemTraDonHangHopLe(int maDonHang, int maNguoiDung, int maTacPham)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"SELECT COUNT_BIG(*) FROM DonHang d INNER JOIN ChiTietDonHang c ON c.MaDonHang=d.MaDonHang
            WHERE d.MaDonHang=@MaDonHang AND d.MaNguoiDung=@MaNguoiDung AND d.TrangThai=3 AND c.MaTacPham=@MaTacPham;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        return Convert.ToInt64(await command.ExecuteScalarAsync()) > 0;
    }

    public async Task<bool> KiemTraDaCoYeuCau(int maDonHang, int maTacPham, int maNguoiDung)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"SELECT COUNT_BIG(*) FROM YeuCauHoanTra WHERE MaDonHang=@MaDonHang AND MaTacPham=@MaTacPham
            AND MaNguoiDung=@MaNguoiDung AND TrangThai IN ('CHO_DUYET','DA_DUYET','DANG_HOAN_TRA');";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        return Convert.ToInt64(await command.ExecuteScalarAsync()) > 0;
    }

    public Task<List<HoanTraSummaryResponse>> GetAll(string? trangThai = null, DateTime? tuNgay = null, DateTime? denNgay = null, string? keyword = null)
    {
        var filters = new List<string>();
        if (!string.IsNullOrWhiteSpace(trangThai)) filters.Add("y.TrangThai=@TrangThai");
        if (tuNgay.HasValue) filters.Add("y.NgayTao>=@TuNgay");
        if (denNgay.HasValue) filters.Add("y.NgayTao<@DenNgay");
        if (!string.IsNullOrWhiteSpace(keyword)) filters.Add("(t.TenTacPham LIKE @Keyword OR nd.Ten LIKE @Keyword OR CONVERT(NVARCHAR(20),y.MaDonHang) LIKE @Keyword)");
        var sql = SelectReturn + (filters.Count > 0 ? " WHERE " + string.Join(" AND ", filters) : string.Empty) + " ORDER BY y.NgayTao DESC";
        return QuerySummaries(sql, command =>
        {
            if (!string.IsNullOrWhiteSpace(trangThai)) command.Parameters.AddWithValue("@TrangThai", trangThai.Trim().ToUpperInvariant());
            if (tuNgay.HasValue) command.Parameters.AddWithValue("@TuNgay", tuNgay.Value.Date);
            if (denNgay.HasValue) command.Parameters.AddWithValue("@DenNgay", denNgay.Value.Date.AddDays(1));
            if (!string.IsNullOrWhiteSpace(keyword)) command.Parameters.AddWithValue("@Keyword", $"%{keyword.Trim()}%");
        });
    }

    public Task<bool> DuyetYeuCau(int maYeuCau, int maTaiKhoan, bool chapNhan, string? lyDoTuChoi = null) => ExecuteConditional(@"
        UPDATE YeuCauHoanTra SET TrangThai=@TrangThai,LyDoTuChoi=@LyDoTuChoi,NguoiDuyet=@NguoiDuyet,
            NgayDuyet=GETDATE(),NgayCapNhat=GETDATE() WHERE MaYeuCau=@MaYeuCau AND TrangThai='CHO_DUYET';", command =>
    {
        command.Parameters.AddWithValue("@TrangThai", chapNhan ? "DA_DUYET" : "TU_CHOI");
        command.Parameters.AddWithValue("@LyDoTuChoi", Db(lyDoTuChoi));
        command.Parameters.AddWithValue("@NguoiDuyet", maTaiKhoan);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
    });

    public Task<bool> CapNhatTrangThai(int maYeuCau, string trangThai)
    {
        var expected = trangThai switch { "DANG_HOAN_TRA" => "DA_DUYET", "HOAN_TAT" => "DA_HOAN_TIEN", _ => null };
        if (expected == null) return Task.FromResult(false);
        return ExecuteConditional(@"UPDATE YeuCauHoanTra SET TrangThai=@TrangThai,NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND TrangThai=@Expected;", command =>
        {
            command.Parameters.AddWithValue("@TrangThai", trangThai);
            command.Parameters.AddWithValue("@Expected", expected);
            command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        });
    }

    public async Task<bool> XacNhanNhanHang(int maYeuCau, int maTaiKhoan, bool coTheBanLai)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            const string selectSql = @"SELECT y.MaChiTietDH,y.MaTacPham,y.MaNguoiDung,y.SoLuongTra,c.SoLuong,c.SoLuongDaHoan,t.MaHoaSi
                FROM YeuCauHoanTra y WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN ChiTietDonHang c WITH (UPDLOCK,HOLDLOCK) ON c.MaChiTietDH=y.MaChiTietDH
                INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaTacPham=y.MaTacPham
                WHERE y.MaYeuCau=@MaYeuCau AND y.TrangThai='DANG_HOAN_TRA';";
            await using var select = new SqlCommand(selectSql, connection, transaction);
            select.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            int returnQuantity, orderedQuantity, alreadyReturned;
            await using (var reader = await select.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) { await transaction.RollbackAsync(); return false; }
                returnQuantity=reader.GetInt32(3); orderedQuantity=reader.GetInt32(4); alreadyReturned=reader.GetInt32(5);
            }
            if (returnQuantity<=0 || alreadyReturned+returnQuantity>orderedQuantity) throw new InvalidOperationException("Số lượng nhận lại không hợp lệ");

            await using var updateReturn = new SqlCommand(@"UPDATE YeuCauHoanTra SET TrangThai='DA_NHAN_HANG',CoTheBanLai=@CoTheBanLai,
                NguoiNhanHang=@NguoiNhanHang,NgayNhanHang=GETDATE(),NgayCapNhat=GETDATE()
                WHERE MaYeuCau=@MaYeuCau AND TrangThai='DANG_HOAN_TRA';",connection,transaction);
            updateReturn.Parameters.AddWithValue("@CoTheBanLai",coTheBanLai); updateReturn.Parameters.AddWithValue("@NguoiNhanHang",maTaiKhoan); updateReturn.Parameters.AddWithValue("@MaYeuCau",maYeuCau);
            if (await updateReturn.ExecuteNonQueryAsync()!=1) throw new DBConcurrencyException("Yêu cầu đã được xử lý");
            await AuditLogSql.InsertAsync(connection,transaction,"YeuCauHoanTra",maYeuCau,"PHYSICAL_RETURN_RECEIVED",maTaiKhoan,0,
                after:$"CoTheBanLai={coTheBanLai};OwnershipUnchanged=true;CertificateUnchanged=true");
            await transaction.CommitAsync();
            return true;
        }
        catch { await transaction.RollbackAsync(); throw; }
    }

    public async Task<bool> XacNhanHoanTien(int maYeuCau, int maTaiKhoan, XacNhanHoanTienRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var select = new SqlCommand(@"SELECT y.MaDonHang,y.SoLuongTra,c.DonGia,d.TongTien,
                       y.MaChiTietDH,y.MaTacPham,y.MaNguoiDung,y.CoTheBanLai,c.SoLuong,c.SoLuongDaHoan,
                       t.MaHoaSi,t.LaTacPhamDocBan,t.SoLuongBanDau
                FROM YeuCauHoanTra y WITH (UPDLOCK,HOLDLOCK) INNER JOIN ChiTietDonHang c ON c.MaChiTietDH=y.MaChiTietDH
                INNER JOIN DonHang d ON d.MaDonHang=y.MaDonHang
                INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaTacPham=y.MaTacPham
                WHERE y.MaYeuCau=@MaYeuCau AND y.TrangThai='DA_NHAN_HANG';",connection,transaction);
            select.Parameters.AddWithValue("@MaYeuCau",maYeuCau);
            int orderId,lineId,artworkId,customerId,returnQuantity,orderedQuantity,alreadyReturned,artistId;
            bool canResell,exclusive;
            int? initialQuantity;
            decimal maximumRefund,orderTotal;
            await using (var reader=await select.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) { await transaction.RollbackAsync(); return false; }
                orderId=reader.GetInt32(0); returnQuantity=reader.GetInt32(1);
                maximumRefund=returnQuantity*reader.GetDecimal(2); orderTotal=reader.GetDecimal(3);
                lineId=reader.GetInt32(4); artworkId=reader.GetInt32(5); customerId=reader.GetInt32(6);
                canResell=!reader.IsDBNull(7)&&reader.GetBoolean(7); orderedQuantity=reader.GetInt32(8);
                alreadyReturned=reader.GetInt32(9); artistId=reader.GetInt32(10); exclusive=reader.GetBoolean(11);
                initialQuantity=reader.IsDBNull(12)?null:reader.GetInt32(12);
            }
            var refundAmount=request.SoTienHoan??maximumRefund;
            if (refundAmount<=0 || refundAmount>maximumRefund) { await transaction.RollbackAsync(); return false; }
            if (exclusive && (initialQuantity!=1 || orderedQuantity!=1 || returnQuantity!=1))
                throw new InvalidOperationException("Dữ liệu hoàn trả độc bản không nhất quán");

            await using var update=new SqlCommand(@"UPDATE YeuCauHoanTra SET TrangThai='DA_HOAN_TIEN',SoTienHoan=@SoTienHoan,
                PhuongThucHoanTien=@PhuongThuc,TrangThaiHoanTien='DA_HOAN_TIEN',NguoiHoanTien=@NguoiHoanTien,
                NgayHoanTien=GETDATE(),NgayCapNhat=GETDATE() WHERE MaYeuCau=@MaYeuCau AND TrangThai='DA_NHAN_HANG';",connection,transaction);
            update.Parameters.AddWithValue("@SoTienHoan",refundAmount); update.Parameters.AddWithValue("@PhuongThuc",request.PhuongThucHoanTien);
            update.Parameters.AddWithValue("@NguoiHoanTien",maTaiKhoan); update.Parameters.AddWithValue("@MaYeuCau",maYeuCau);
            if (await update.ExecuteNonQueryAsync()!=1) { await transaction.RollbackAsync(); return false; }

            await using var updateLine = new SqlCommand(@"UPDATE ChiTietDonHang SET SoLuongDaHoan=SoLuongDaHoan+@SoLuongTra
                WHERE MaChiTietDH=@MaChiTietDH AND SoLuongDaHoan+@SoLuongTra<=SoLuong;",connection,transaction);
            updateLine.Parameters.AddWithValue("@SoLuongTra",returnQuantity); updateLine.Parameters.AddWithValue("@MaChiTietDH",lineId);
            if (await updateLine.ExecuteNonQueryAsync()!=1) throw new InvalidOperationException("Dòng đơn đã được hoàn đủ số lượng");

            if (canResell)
            {
                await using var stock = new SqlCommand("UPDATE TacPham SET SoLuong=SoLuong+@SoLuongTra WHERE MaTacPham=@MaTacPham;",connection,transaction);
                stock.Parameters.AddWithValue("@SoLuongTra",returnQuantity); stock.Parameters.AddWithValue("@MaTacPham",artworkId);
                if (await stock.ExecuteNonQueryAsync()!=1) throw new InvalidOperationException("Không thể cập nhật tồn kho tác phẩm");
            }

            if (exclusive && alreadyReturned+returnQuantity==orderedQuantity)
                await ReverseOwnershipIfAvailable(connection,transaction,artworkId,customerId,artistId,maYeuCau);

            await using var sum=new SqlCommand(@"SELECT ISNULL(SUM(SoTienHoan),0) FROM YeuCauHoanTra
                WHERE MaDonHang=@MaDonHang AND TrangThai IN ('DA_HOAN_TIEN','HOAN_TAT');",connection,transaction);
            sum.Parameters.AddWithValue("@MaDonHang",orderId);
            if (Convert.ToDecimal(await sum.ExecuteScalarAsync())>=orderTotal)
            {
                await using var payment=new SqlCommand("UPDATE ThanhToan SET TrangThai='HoanTien',NgayThanhToan=GETDATE() WHERE MaDonHang=@MaDonHang AND TrangThai<>'HoanTien';",connection,transaction);
                payment.Parameters.AddWithValue("@MaDonHang",orderId); await payment.ExecuteNonQueryAsync();
            }
            await AuditLogSql.InsertAsync(connection,transaction,"YeuCauHoanTra",maYeuCau,"REFUND_COMPLETED",maTaiKhoan,0,
                after:$"Amount={refundAmount};Quantity={returnQuantity};OwnershipReversed={exclusive}");
            await transaction.CommitAsync(); return true;
        }
        catch { await transaction.RollbackAsync(); throw; }
    }

    public Task<bool> HoanTat(int maYeuCau) => CapNhatTrangThai(maYeuCau,"HOAN_TAT");

    private static async Task ReverseOwnershipIfAvailable(SqlConnection connection, SqlTransaction transaction, int artworkId, int customerId, int artistId, int returnId)
    {
        await using var schema=new SqlCommand(@"SELECT CASE WHEN OBJECT_ID(N'dbo.LichSuSoHuu',N'U') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'MaLichSuSoHuu') IS NOT NULL AND COL_LENGTH(N'dbo.LichSuSoHuu',N'MaTacPham') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'MaNguoiDung') IS NOT NULL AND COL_LENGTH(N'dbo.LichSuSoHuu',N'MaHoaSi') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'NgayNhan') IS NOT NULL AND COL_LENGTH(N'dbo.LichSuSoHuu',N'NgayChuyenGiao') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'LoaiChuyenGiao') IS NOT NULL AND COL_LENGTH(N'dbo.LichSuSoHuu',N'TrangThai') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'MaDonHang') IS NOT NULL AND COL_LENGTH(N'dbo.LichSuSoHuu',N'GhiChu') IS NOT NULL
            AND COL_LENGTH(N'dbo.LichSuSoHuu',N'NgayTao') IS NOT NULL THEN 1 ELSE 0 END;",connection,transaction);
        if (Convert.ToInt32(await schema.ExecuteScalarAsync())!=1) return;

        await using var current=new SqlCommand(@"SELECT TOP (1) MaLichSuSoHuu FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK)
            WHERE MaTacPham=@MaTacPham AND MaNguoiDung=@MaNguoiDung AND TrangThai=1 ORDER BY MaLichSuSoHuu DESC;",connection,transaction);
        current.Parameters.AddWithValue("@MaTacPham",artworkId); current.Parameters.AddWithValue("@MaNguoiDung",customerId);
        var currentValue=await current.ExecuteScalarAsync();
        if (currentValue==null || currentValue==DBNull.Value) return;
        var ownershipId=Convert.ToInt32(currentValue);

        await using var close=new SqlCommand(@"UPDATE LichSuSoHuu SET NgayChuyenGiao=GETDATE(),TrangThai=3,
            GhiChu=CONCAT(ISNULL(GhiChu,N''),N' | RETURN #',@MaYeuCau) WHERE MaLichSuSoHuu=@MaLichSuSoHuu AND TrangThai=1;",connection,transaction);
        close.Parameters.AddWithValue("@MaYeuCau",returnId); close.Parameters.AddWithValue("@MaLichSuSoHuu",ownershipId);
        if (await close.ExecuteNonQueryAsync()!=1) throw new DBConcurrencyException("Quyền sở hữu đã thay đổi");

        await using var other=new SqlCommand("SELECT COUNT_BIG(*) FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@MaTacPham AND TrangThai=1;",connection,transaction);
        other.Parameters.AddWithValue("@MaTacPham",artworkId);
        if (Convert.ToInt64(await other.ExecuteScalarAsync())!=0) throw new InvalidOperationException("Tác phẩm đang có owner CURRENT khác");

        await using var insert=new SqlCommand(@"INSERT INTO LichSuSoHuu
            (MaTacPham,MaNguoiDung,MaHoaSi,NgayNhan,NgayChuyenGiao,LoaiChuyenGiao,TrangThai,MaDonHang,MaYeuCauHoanTra,GhiChu,EventKey,NgayTao)
            VALUES (@MaTacPham,NULL,@MaHoaSi,SYSUTCDATETIME(),NULL,3,1,NULL,@MaYeuCau,
                    CONCAT(N'RETURN #',@MaYeuCau),@EventKey,SYSUTCDATETIME());",connection,transaction);
        insert.Parameters.AddWithValue("@MaTacPham",artworkId); insert.Parameters.AddWithValue("@MaHoaSi",artistId); insert.Parameters.AddWithValue("@MaYeuCau",returnId);
        insert.Parameters.AddWithValue("@EventKey",$"RETURN:{returnId}");
        await insert.ExecuteNonQueryAsync();

        await using var certSchema=new SqlCommand(@"SELECT CASE WHEN OBJECT_ID(N'dbo.ChungNhan',N'U') IS NOT NULL
            AND COL_LENGTH(N'dbo.ChungNhan',N'MaLichSuSoHuu') IS NOT NULL AND COL_LENGTH(N'dbo.ChungNhan',N'TrangThai') IS NOT NULL
            AND COL_LENGTH(N'dbo.ChungNhan',N'NgayThuHoi') IS NOT NULL AND COL_LENGTH(N'dbo.ChungNhan',N'LyDoThuHoi') IS NOT NULL THEN 1 ELSE 0 END;",connection,transaction);
        if (Convert.ToInt32(await certSchema.ExecuteScalarAsync())==1)
        {
            await using var revoke=new SqlCommand(@"UPDATE ChungNhan SET TrangThai=3,NgayThuHoi=GETDATE(),
                LyDoThuHoi=CONCAT(N'Hoàn trả tác phẩm #',@MaYeuCau) WHERE MaLichSuSoHuu=@MaLichSuSoHuu AND TrangThai=1;",connection,transaction);
            revoke.Parameters.AddWithValue("@MaYeuCau",returnId); revoke.Parameters.AddWithValue("@MaLichSuSoHuu",ownershipId); await revoke.ExecuteNonQueryAsync();
        }
        await AuditLogSql.InsertAsync(connection,transaction,"LichSuSoHuu",ownershipId,"RETURN_REVERSED",null,null,
            after:$"Return={returnId};Artwork={artworkId};Artist={artistId}");
    }

    private async Task<List<HoanTraSummaryResponse>> QuerySummaries(string sql, Action<SqlCommand> configure)
    {
        var result=new List<HoanTraSummaryResponse>();
        await using var connection=new SqlConnection(_connectionString); await connection.OpenAsync();
        await using var command=new SqlCommand(sql,connection); configure(command);
        await using var reader=await command.ExecuteReaderAsync(); while(await reader.ReadAsync()) result.Add(MapToSummary(reader));
        return result;
    }

    private async Task<bool> ExecuteConditional(string sql, Action<SqlCommand> configure)
    {
        await using var connection=new SqlConnection(_connectionString); await connection.OpenAsync();
        await using var command=new SqlCommand(sql,connection); configure(command); return await command.ExecuteNonQueryAsync()==1;
    }

    private static void AddLineIdentityParameters(SqlCommand command,int userId,TaoHoanTraRequest request)
    {
        command.Parameters.AddWithValue("@MaDonHang",request.MaDonHang); command.Parameters.AddWithValue("@MaNguoiDung",userId);
        command.Parameters.AddWithValue("@MaTacPham",request.MaTacPham); command.Parameters.AddWithValue("@MaChiTietDH",(object?)request.MaChiTietDH??DBNull.Value);
    }

    private static HoanTraSummaryResponse MapToSummary(SqlDataReader r)=>new()
    {
        MaYeuCau=Convert.ToInt32(r["MaYeuCau"]),MaDonHang=Convert.ToInt32(r["MaDonHang"]),MaNguoiDung=Convert.ToInt32(r["MaNguoiDung"]),TenNguoiDung=r["TenNguoiDung"] as string,
        MaTacPham=Convert.ToInt32(r["MaTacPham"]),MaChiTietDH=NullableInt(r,"MaChiTietDH"),TenTacPham=r["TenTacPham"] as string,HinhAnhTacPham=r["HinhAnhTacPham"] as string,
        GiaTacPham=RequiredSnapshotPrice(r),SoLuongTra=NullableInt(r,"SoLuongTra")??Convert.ToInt32(r["SoLuong"]),LyDo=r["LyDo"]?.ToString()??string.Empty,
        LyDoKhac=r["LyDoKhac"] as string,MoTa=r["MoTa"] as string,HinhAnh=MapImages(Convert.ToInt32(r["MaYeuCau"]),r["HinhAnh"] as string),TrangThai=r["TrangThai"]?.ToString()??string.Empty,
        LyDoTuChoi=r["LyDoTuChoi"] as string,CoTheBanLai=NullableBool(r,"CoTheBanLai"),SoTienHoan=NullableDecimal(r,"SoTienHoan"),PhuongThucHoanTien=r["PhuongThucHoanTien"] as string,
        TrangThaiHoanTien=r["TrangThaiHoanTien"] as string,NgayNhanHang=NullableDate(r,"NgayNhanHang"),NgayHoanTien=NullableDate(r,"NgayHoanTien"),NgayTao=Convert.ToDateTime(r["NgayTao"])
    };

    private static HoanTraDetailResponse MapToDetail(SqlDataReader r)=>new()
    {
        MaYeuCau=Convert.ToInt32(r["MaYeuCau"]),MaDonHang=Convert.ToInt32(r["MaDonHang"]),MaNguoiDung=Convert.ToInt32(r["MaNguoiDung"]),TenNguoiDung=r["TenNguoiDung"] as string,
        EmailNguoiDung=r["EmailNguoiDung"] as string,SoDienThoaiNguoiDung=r["SoDienThoaiNguoiDung"] as string,MaTacPham=Convert.ToInt32(r["MaTacPham"]),MaChiTietDH=NullableInt(r,"MaChiTietDH"),
        TenTacPham=r["TenTacPham"] as string,HinhAnhTacPham=r["HinhAnhTacPham"] as string,GiaTacPham=RequiredSnapshotPrice(r),SoLuong=Convert.ToInt32(r["SoLuong"]),
        SoLuongTra=NullableInt(r,"SoLuongTra")??Convert.ToInt32(r["SoLuong"]),LyDo=r["LyDo"]?.ToString()??string.Empty,LyDoKhac=r["LyDoKhac"] as string,MoTa=r["MoTa"] as string,
        HinhAnh=MapImages(Convert.ToInt32(r["MaYeuCau"]),r["HinhAnh"] as string),TrangThai=r["TrangThai"]?.ToString()??string.Empty,LyDoTuChoi=r["LyDoTuChoi"] as string,CoTheBanLai=NullableBool(r,"CoTheBanLai"),
        SoTienHoan=NullableDecimal(r,"SoTienHoan"),PhuongThucHoanTien=r["PhuongThucHoanTien"] as string,TrangThaiHoanTien=r["TrangThaiHoanTien"] as string,
        NgayNhanHang=NullableDate(r,"NgayNhanHang"),NgayHoanTien=NullableDate(r,"NgayHoanTien"),NgayTao=Convert.ToDateTime(r["NgayTao"]),NgayCapNhat=Convert.ToDateTime(r["NgayCapNhat"]),
        NgayDatHang=r["NgayDatHang"]==DBNull.Value?DateTime.MinValue:Convert.ToDateTime(r["NgayDatHang"]),TongTienDonHang=DecimalValue(r,"TongTienDonHang")
    };

    private static List<string> ParseImages(string? json){if(string.IsNullOrWhiteSpace(json))return new();try{return JsonSerializer.Deserialize<List<string>>(json)??new();}catch{return new();}}
    private static List<string> MapImages(int returnId,string? json)=>ParseImages(json)
        .Where(value=>!string.IsNullOrWhiteSpace(value))
        .Select(value=>MapImage(returnId,value.Trim()))
        .ToList();
    private static string MapImage(int returnId,string value)
    {
        if(value.StartsWith("data:image/",StringComparison.OrdinalIgnoreCase)) return value;
        if(value.StartsWith("/api/",StringComparison.OrdinalIgnoreCase)) return value;
        if(Uri.TryCreate(value,UriKind.Absolute,out var uri) &&
           (uri.Scheme==Uri.UriSchemeHttp || uri.Scheme==Uri.UriSchemeHttps)) return value;
        var normalized=value.Replace('\\','/');
        var fileName=normalized.Split('/',StringSplitOptions.RemoveEmptyEntries).LastOrDefault()??normalized;
        return $"/api/hoan-tra/{returnId}/tep/{Uri.EscapeDataString(fileName)}";
    }
    private static object Db(object? value)=>value??DBNull.Value;
    private static int? NullableInt(SqlDataReader r,string n)=>r[n]==DBNull.Value?null:Convert.ToInt32(r[n]);
    private static bool? NullableBool(SqlDataReader r,string n)=>r[n]==DBNull.Value?null:Convert.ToBoolean(r[n]);
    private static decimal? NullableDecimal(SqlDataReader r,string n)=>r[n]==DBNull.Value?null:Convert.ToDecimal(r[n]);
    private static DateTime? NullableDate(SqlDataReader r,string n)=>r[n]==DBNull.Value?null:Convert.ToDateTime(r[n]);
    private static decimal DecimalValue(SqlDataReader r,string n)=>r[n]==DBNull.Value?0:Convert.ToDecimal(r[n]);
    private static decimal RequiredSnapshotPrice(SqlDataReader r)
    {
        if (r["GiaTacPham"] == DBNull.Value)
            throw new InvalidOperationException("Dữ liệu lịch sử thiếu đơn giá snapshot; cần quản trị viên xử lý");
        return Convert.ToDecimal(r["GiaTacPham"]);
    }
}
