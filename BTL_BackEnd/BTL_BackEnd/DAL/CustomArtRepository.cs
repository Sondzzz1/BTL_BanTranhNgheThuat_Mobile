using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class CustomArtRepository : ICustomArtRepository
{
    private readonly string _connectionString;

    private const string SelectRequest = @"
        SELECT y.*,
               n.Ten AS TenKhachHang,
               h.TenHoaSi AS TenHoaSiThucHien,
               (SELECT TOP (1) t.MaTacPham FROM TacPham t WHERE t.MaYeuCauVeTranh = y.MaYeuCau ORDER BY t.MaTacPham DESC) AS MaTacPhamKetQua
        FROM YeuCauVeTranh y
        LEFT JOIN NguoiDung n ON n.MaNguoiDung = y.MaKhachHang
        LEFT JOIN HoaSi h ON h.MaHoaSi = y.MaHoaSi";

    public CustomArtRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<CustomArtRequest> CreateRequest(
        int maKhachHang,
        TaoYeuCauTranhRequest request,
        CustomArtStatus initialStatus,
        PermissionUsageStatus? permissionStatus)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string query = @"
            INSERT INTO YeuCauVeTranh
                (MaKhachHang, TieuDe, LoaiTranh, KichThuoc, ChuDe, MauSac, PhongCach, ChatLieu,
                 MoTa, AnhThamKhao, [Type], ReferenceArtworkId, ReferenceArtworkName,
                 ReferenceArtistName, ReferenceImageUrl, NguonTacPhamGoc, TinhTrangQuyenSuDung,
                 DaXacNhanQuyenTaiLieu, MoTaQuyenSuDung, BangChungQuyenSuDung,
                 TienDatCoc, GiaDuKien, TrangThai, NgayTao, NgayCapNhat, NgayHoanThanhDuKien)
            OUTPUT INSERTED.MaYeuCau
            VALUES
                (@MaKhachHang, @TieuDe, @LoaiTranh, @KichThuoc, @ChuDe, @MauSac, @PhongCach, @ChatLieu,
                 @MoTa, @AnhThamKhao, @Type, @ReferenceArtworkId, @ReferenceArtworkName,
                 @ReferenceArtistName, @ReferenceImageUrl, @NguonTacPhamGoc, @TinhTrangQuyenSuDung,
                 @DaXacNhanQuyenTaiLieu, @MoTaQuyenSuDung, @BangChungQuyenSuDung,
                 0, @GiaDuKien, @TrangThai, GETDATE(), GETDATE(), @NgayHoanThanhDuKien);";

        await using var command = new SqlCommand(query, connection);
        AddRequestParameters(command, maKhachHang, request, initialStatus, permissionStatus);
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        return await GetById(id) ?? throw new InvalidOperationException("Không thể đọc yêu cầu vừa tạo");
    }

    public Task<List<CustomArtRequest>> GetByCustomer(int maKhachHang) => QueryRequests(
        SelectRequest + " WHERE y.MaKhachHang = @MaKhachHang ORDER BY y.NgayTao DESC",
        command => command.Parameters.AddWithValue("@MaKhachHang", maKhachHang));

    public Task<List<CustomArtRequest>> GetForAdmin(CustomArtType? type = null, CustomArtStatus? status = null)
    {
        var filters = new List<string>();
        if (type.HasValue) filters.Add("y.[Type] = @Type");
        if (status.HasValue) filters.Add("y.TrangThai = @TrangThai");
        var sql = SelectRequest + (filters.Count > 0 ? " WHERE " + string.Join(" AND ", filters) : string.Empty) + " ORDER BY y.NgayTao DESC";
        return QueryRequests(sql, command =>
        {
            if (type.HasValue) command.Parameters.AddWithValue("@Type", (int)type.Value);
            if (status.HasValue) command.Parameters.AddWithValue("@TrangThai", (int)status.Value);
        });
    }

    public Task<List<CustomArtRequest>> GetForArtist(int maHoaSi) => QueryRequests(
        SelectRequest + @"
        WHERE y.TrangThai = @Approved
           OR y.MaHoaSi = @MaHoaSi
        ORDER BY y.NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@Approved", (int)CustomArtStatus.PendingArtist);
            command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        });

    public async Task<CustomArtRequest?> GetById(int maYeuCau)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(SelectRequest + " WHERE y.MaYeuCau = @MaYeuCau", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    public async Task<bool> UpdateByCustomer(
        int maYeuCau,
        int maKhachHang,
        CapNhatYeuCauTranhRequest request,
        CustomArtStatus status,
        PermissionUsageStatus? permissionStatus)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET TieuDe=@TieuDe, LoaiTranh=@LoaiTranh, KichThuoc=@KichThuoc, ChuDe=@ChuDe,
                MauSac=@MauSac, PhongCach=@PhongCach, ChatLieu=@ChatLieu, MoTa=@MoTa,
                [Type]=@Type, ReferenceArtworkId=@ReferenceArtworkId,
                ReferenceArtworkName=@ReferenceArtworkName, ReferenceArtistName=@ReferenceArtistName,
                ReferenceImageUrl=COALESCE(@ReferenceImageUrl, ReferenceImageUrl),
                AnhThamKhao=COALESCE(@AnhThamKhao, AnhThamKhao), NguonTacPhamGoc=@NguonTacPhamGoc,
                TinhTrangQuyenSuDung=@TinhTrangQuyenSuDung,
                DaXacNhanQuyenTaiLieu=@DaXacNhanQuyenTaiLieu,
                MoTaQuyenSuDung=@MoTaQuyenSuDung,
                BangChungQuyenSuDung=COALESCE(@BangChungQuyenSuDung, BangChungQuyenSuDung),
                GiaDuKien=@GiaDuKien, NgayHoanThanhDuKien=@NgayHoanThanhDuKien,
                TrangThai=@TrangThai, GhiChuKiemDuyet=NULL, NguoiKiemDuyet=NULL,
                NgayKiemDuyet=NULL, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
              AND TrangThai NOT IN (@Completed, @Rejected, @Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        AddRequestParameters(command, maKhachHang, request, status, permissionStatus);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> CancelByCustomer(int maYeuCau, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh SET TrangThai=@Cancelled, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
              AND TrangThai NOT IN (@Completed, @Rejected, @Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> AssignRequest(int maYeuCau, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET MaHoaSi=@MaHoaSi, TrangThai=@Accepted, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi IS NULL AND TrangThai=@Approved;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@Accepted", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Approved", (int)CustomArtStatus.PendingArtist);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> ReviewRequest(int maYeuCau, int maTaiKhoan, CustomArtStatus status, string? note)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET TrangThai=@TrangThai, GhiChuKiemDuyet=@GhiChu,
                NguoiKiemDuyet=@NguoiKiemDuyet, NgayKiemDuyet=GETDATE(), NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi IS NULL
              AND TrangThai IN (@Pending, @WaitingPermission);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@GhiChu", (object?)note ?? DBNull.Value);
        command.Parameters.AddWithValue("@NguoiKiemDuyet", maTaiKhoan);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@Pending", (int)CustomArtStatus.Submitted);
        command.Parameters.AddWithValue("@WaitingPermission", (int)CustomArtStatus.WaitingPermission);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> UpdateArtistStatus(int maYeuCau, int maHoaSi, CustomArtStatus status)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh SET TrangThai=@TrangThai, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi
              AND TrangThai IN (@CustomerAccepted, @DepositPaid);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        command.Parameters.AddWithValue("@DepositPaid", (int)CustomArtStatus.DepositPaid);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<int?> CompleteRequest(int maYeuCau, int maHoaSi, HoanThanhYeuCauRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try
        {
            const string selectSql = @"
                SELECT y.*,
                       COALESCE((SELECT TOP (1) b.GiaBaoGia FROM BaoGiaVeTranh b
                                 WHERE b.MaYeuCau=y.MaYeuCau AND b.IsActive=1 ORDER BY b.MaBaoGia DESC), y.GiaDuKien, 0) AS GiaTacPham,
                       (SELECT TOP (1) t.MaTacPham FROM TacPham t WHERE t.MaYeuCauVeTranh=y.MaYeuCau ORDER BY t.MaTacPham DESC) AS ExistingArtworkId
                FROM YeuCauVeTranh y WITH (UPDLOCK, HOLDLOCK)
                WHERE y.MaYeuCau=@MaYeuCau AND y.MaHoaSi=@MaHoaSi;";
            await using var select = new SqlCommand(selectSql, connection, transaction);
            select.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            select.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

            CustomArtType type;
            CustomArtStatus currentStatus;
            string title;
            string? description;
            string? material;
            string? size;
            string? originalAuthor;
            string? sourceDescription;
            int? sourceArtworkId;
            decimal price;
            int? existingArtworkId;

            await using (var reader = await select.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) return null;
                type = ParseCustomArtType(reader.GetInt32(reader.GetOrdinal("Type")));
                currentStatus = (CustomArtStatus)reader.GetInt32(reader.GetOrdinal("TrangThai"));
                title = reader.GetString(reader.GetOrdinal("TieuDe"));
                description = GetNullableString(reader, "MoTa");
                material = GetNullableString(reader, "ChatLieu");
                size = GetNullableString(reader, "KichThuoc");
                originalAuthor = GetNullableString(reader, "ReferenceArtistName");
                sourceDescription = GetNullableString(reader, "NguonTacPhamGoc");
                sourceArtworkId = reader.IsDBNull(reader.GetOrdinal("ReferenceArtworkId")) ? null : reader.GetInt32(reader.GetOrdinal("ReferenceArtworkId"));
                price = reader.GetDecimal(reader.GetOrdinal("GiaTacPham"));
                existingArtworkId = reader.IsDBNull(reader.GetOrdinal("ExistingArtworkId")) ? null : reader.GetInt32(reader.GetOrdinal("ExistingArtworkId"));
            }

            if (existingArtworkId.HasValue)
            {
                await transaction.CommitAsync();
                return existingArtworkId.Value;
            }

            if (currentStatus is not (CustomArtStatus.InProgress or CustomArtStatus.PreviewSent or CustomArtStatus.RevisionRequested))
            {
                await transaction.RollbackAsync();
                return null;
            }

            var artworkType = type switch
            {
                CustomArtType.BasedOnArtwork or CustomArtType.Reproduction => (byte)3,
                CustomArtType.PersonalReference => (byte)4,
                _ => (byte)1
            };

            const string insertArtworkSql = @"
                INSERT INTO TacPham
                    (TenTacPham, MaHoaSi, MaDanhMuc, Gia, SoLuong, MoTa, HinhAnh, ChatLieu,
                     ChatLieuKhung, KichThuoc, TrangThai, NgayTao, LyDo, LoaiTacPham,
                     TacGiaGoc, MaTacPhamGoc, MaYeuCauVeTranh, MoTaNguonGoc)
                OUTPUT INSERTED.MaTacPham
                VALUES
                    (@TenTacPham, @MaHoaSi, NULL, @Gia, 1, @MoTa, @HinhAnh, @ChatLieu,
                     NULL, @KichThuoc, 0, GETDATE(), NULL, @LoaiTacPham,
                     @TacGiaGoc, @MaTacPhamGoc, @MaYeuCau, @MoTaNguonGoc);";
            await using var insertArtwork = new SqlCommand(insertArtworkSql, connection, transaction);
            insertArtwork.Parameters.AddWithValue("@TenTacPham", string.IsNullOrWhiteSpace(request.TenTacPhamMoi) ? title : request.TenTacPhamMoi.Trim());
            insertArtwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            insertArtwork.Parameters.AddWithValue("@Gia", price);
            insertArtwork.Parameters.AddWithValue("@MoTa", (object?)description ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@HinhAnh", (object?)request.HinhAnhTacPham ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@ChatLieu", (object?)material ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@KichThuoc", (object?)size ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@LoaiTacPham", artworkType);
            insertArtwork.Parameters.AddWithValue("@TacGiaGoc", (object?)originalAuthor ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@MaTacPhamGoc", (object?)sourceArtworkId ?? DBNull.Value);
            insertArtwork.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            insertArtwork.Parameters.AddWithValue("@MoTaNguonGoc", (object?)(request.MoTaNguonGoc ?? sourceDescription) ?? DBNull.Value);
            var artworkId = Convert.ToInt32(await insertArtwork.ExecuteScalarAsync());

            const string completeSql = @"
                UPDATE YeuCauVeTranh SET TrangThai=@Completed, NgayCapNhat=GETDATE()
                WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi;";
            await using var complete = new SqlCommand(completeSql, connection, transaction);
            complete.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
            complete.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            complete.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            await complete.ExecuteNonQueryAsync();

            await transaction.CommitAsync();
            return artworkId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<CustomArtQuote> CreateQuote(BaoGiaTranhRequest request, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string sql = @"
            IF NOT EXISTS (SELECT 1 FROM YeuCauVeTranh WITH (UPDLOCK,HOLDLOCK)
                           WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi AND TrangThai IN (@Assigned,@Quoted))
                THROW 50010, N'Bạn không phụ trách yêu cầu này.', 1;
            UPDATE BaoGiaVeTranh SET IsActive=0
            WHERE MaYeuCau=@MaYeuCau AND IsActive=1;
            INSERT INTO BaoGiaVeTranh
                (MaYeuCau, MaHoaSi, GiaBaoGia, ThoiGianHoanThanh, GhiChu, IsActive, NgayTao, TrangThai)
            OUTPUT INSERTED.MaBaoGia
            VALUES (@MaYeuCau, @MaHoaSi, @GiaBaoGia, @ThoiGianHoanThanh, @GhiChu, 1, GETDATE(), N'PendingCustomerApproval');";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@Assigned", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        command.Parameters.AddWithValue("@GiaBaoGia", request.GiaBaoGia);
        command.Parameters.AddWithValue("@ThoiGianHoanThanh", request.ThoiGianHoanThanh);
        command.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        await using var update = new SqlCommand(@"UPDATE YeuCauVeTranh SET TrangThai=@Quoted,NgayCapNhat=GETDATE()
                                                  WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi;", connection, transaction);
        update.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        update.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        update.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        await update.ExecuteNonQueryAsync();
        await transaction.CommitAsync();
        return await GetQuoteById(id) ?? new CustomArtQuote
        {
            MaBaoGia = id,
            MaYeuCau = request.MaYeuCau,
            MaHoaSi = maHoaSi,
            GiaBaoGia = request.GiaBaoGia,
            ThoiGianHoanThanh = request.ThoiGianHoanThanh
        };
    }

    public async Task<CustomArtQuote?> GetQuoteById(int maBaoGia)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand("SELECT * FROM BaoGiaVeTranh WHERE MaBaoGia=@MaBaoGia", connection);
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapQuote(reader) : null;
    }

    public async Task<CustomArtQuote?> GetLatestQuoteByRequest(int maYeuCau)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT TOP (1) * FROM BaoGiaVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau
                                                   ORDER BY IsActive DESC, MaBaoGia DESC", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapQuote(reader) : null;
    }

    public async Task<bool> ConfirmQuote(int maBaoGia, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string sql = @"
            UPDATE b SET b.TrangThai=N'CustomerAccepted'
            OUTPUT INSERTED.MaYeuCau
            FROM BaoGiaVeTranh b WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN YeuCauVeTranh y WITH (UPDLOCK,HOLDLOCK) ON y.MaYeuCau=b.MaYeuCau
            WHERE b.MaBaoGia=@MaBaoGia AND b.IsActive=1
              AND b.TrangThai=N'PendingCustomerApproval'
              AND y.MaKhachHang=@MaKhachHang AND y.TrangThai=@Quoted;";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        var requestIdValue = await command.ExecuteScalarAsync();
        if (requestIdValue == null)
        {
            await transaction.RollbackAsync();
            return false;
        }
        var requestId = Convert.ToInt32(requestIdValue);
        await using var update = new SqlCommand(@"UPDATE YeuCauVeTranh SET TrangThai=@CustomerAccepted,NgayCapNhat=GETDATE()
                                                  WHERE MaYeuCau=@MaYeuCau AND TrangThai=@Quoted;", connection, transaction);
        update.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        update.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        update.Parameters.AddWithValue("@MaYeuCau", requestId);
        if (await update.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }
        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> CreateDeposit(int maYeuCau, int maKhachHang, decimal soTien)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string validate = @"SELECT COUNT(1) FROM YeuCauVeTranh WITH (UPDLOCK)
                                  WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang
                                    AND TrangThai=@CustomerAccepted";
        await using var check = new SqlCommand(validate, connection, transaction);
        check.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        check.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        check.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        if (Convert.ToInt32(await check.ExecuteScalarAsync()) != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }
        const string insert = @"INSERT INTO ThanhToanYeuCau (MaYeuCau, LoaiThanhToan, SoTien, PhuongThuc, TrangThai, NgayThanhToan)
                                VALUES (@MaYeuCau, N'DatCoc', @SoTien, N'ChuyenKhoan', N'Completed', GETDATE());
                                UPDATE YeuCauVeTranh SET TienDatCoc=@SoTien, TrangThai=@TrangThai, NgayCapNhat=GETDATE() WHERE MaYeuCau=@MaYeuCau;";
        await using var command = new SqlCommand(insert, connection, transaction);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@SoTien", soTien);
        command.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.DepositPaid);
        await command.ExecuteNonQueryAsync();
        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> CreateProgress(TaoTienDoRequest request, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string insert = @"
            INSERT INTO TienDoVeTranh (MaYeuCau, TieuDe, MoTa, AnhPreview, TrangThai, NgayTao)
            SELECT @MaYeuCau, @TieuDe, @MoTa, @AnhPreview, @ProgressStatus, GETDATE()
            WHERE EXISTS (SELECT 1 FROM YeuCauVeTranh
                          WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi
                            AND TrangThai IN (@InProgress,@PreviewSent,@RevisionRequested));";
        await using var command = new SqlCommand(insert, connection, transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe);
        command.Parameters.AddWithValue("@MoTa", request.MoTa);
        command.Parameters.AddWithValue("@AnhPreview", (object?)request.AnhPreview ?? DBNull.Value);
        command.Parameters.AddWithValue("@ProgressStatus", request.TrangThai);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        if (await command.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }
        const string update = "UPDATE YeuCauVeTranh SET TrangThai=@TrangThai, NgayCapNhat=GETDATE() WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi";
        await using var updateCommand = new SqlCommand(update, connection, transaction);
        updateCommand.Parameters.AddWithValue("@TrangThai", request.TrangThai.Equals("PreviewSent", StringComparison.OrdinalIgnoreCase) ? (int)CustomArtStatus.PreviewSent : (int)CustomArtStatus.InProgress);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        updateCommand.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        await updateCommand.ExecuteNonQueryAsync();
        await transaction.CommitAsync();
        return true;
    }

    public async Task<List<CustomArtProgress>> GetProgressByRequest(int maYeuCau)
    {
        var result = new List<CustomArtProgress>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT * FROM TienDoVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau ORDER BY NgayTao,MaTienDo", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapProgress(reader));
        return result;
    }

    public async Task<CustomArtProgress?> GetProgressById(int maYeuCau, int maTienDo)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT * FROM TienDoVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau AND MaTienDo=@MaTienDo", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaTienDo", maTienDo);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapProgress(reader) : null;
    }

    public async Task<bool> CreateFeedback(TaoPhanHoiRequest request, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        const string sql = @"
            INSERT INTO PhanHoiVeTranh (MaYeuCau, MaKhachHang, MaHoaSi, NoiDung, LoaiPhanHoi, NgayTao)
            SELECT y.MaYeuCau, y.MaKhachHang, y.MaHoaSi, @NoiDung, @LoaiPhanHoi, GETDATE()
            FROM YeuCauVeTranh y
            WHERE y.MaYeuCau=@MaYeuCau AND y.MaKhachHang=@MaKhachHang AND y.MaHoaSi IS NOT NULL;";
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@NoiDung", request.NoiDung);
        command.Parameters.AddWithValue("@LoaiPhanHoi", request.LoaiPhanHoi);
        if (await command.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }

        const string update = @"
            UPDATE YeuCauVeTranh
            SET TrangThai=@RevisionRequested, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang;";
        await using var updateCommand = new SqlCommand(update, connection, (SqlTransaction)transaction);
        updateCommand.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        updateCommand.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        if (await updateCommand.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }

        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> ConfirmComplete(int maYeuCau, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"UPDATE YeuCauVeTranh SET TrangThai=@Completed, NgayCapNhat=GETDATE()
                             WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND TrangThai IN (@InProgress,@PreviewSent,@RevisionRequested);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> UpdateStoredFilePath(int maYeuCau, int maKhachHang, string fileKind, string storedPath)
    {
        var column = fileKind switch
        {
            "reference" => "AnhThamKhao",
            "source" => "ReferenceImageUrl",
            "evidence" => "BangChungQuyenSuDung",
            _ => throw new ArgumentException("Loại tệp không hợp lệ")
        };
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = $@"UPDATE YeuCauVeTranh
                     SET [{column}]=@StoredPath,
                         TrangThai=CASE
                             WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork)
                                 THEN CASE WHEN TinhTrangQuyenSuDung=@Unsure THEN @WaitingPermission ELSE @Pending END
                             ELSE TrangThai
                         END,
                         GhiChuKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE GhiChuKiemDuyet END,
                         NguoiKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE NguoiKiemDuyet END,
                         NgayKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE NgayKiemDuyet END,
                         NgayCapNhat=GETDATE()
                     WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
                       AND TrangThai NOT IN (@Completed,@Rejected,@Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@StoredPath", storedPath);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        command.Parameters.AddWithValue("@ExistingArtwork", (int)CustomArtType.BasedOnArtwork);
        command.Parameters.AddWithValue("@LegacyExistingArtwork", (int)CustomArtType.Reproduction);
        command.Parameters.AddWithValue("@Unsure", (int)PermissionUsageStatus.Unsure);
        command.Parameters.AddWithValue("@WaitingPermission", (int)CustomArtStatus.WaitingPermission);
        command.Parameters.AddWithValue("@Pending", (int)CustomArtStatus.Submitted);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    private async Task<List<CustomArtRequest>> QueryRequests(string sql, Action<SqlCommand>? configure)
    {
        var result = new List<CustomArtRequest>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        configure?.Invoke(command);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(Map(reader));
        return result;
    }

    private static void AddRequestParameters(SqlCommand command, int maKhachHang, TaoYeuCauTranhRequest request, CustomArtStatus status, PermissionUsageStatus? permissionStatus)
    {
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe.Trim());
        command.Parameters.AddWithValue("@LoaiTranh", request.LoaiTranh.Trim());
        command.Parameters.AddWithValue("@KichThuoc", request.KichThuoc.Trim());
        command.Parameters.AddWithValue("@ChuDe", Db(request.ChuDe));
        command.Parameters.AddWithValue("@MauSac", Db(request.MauSac));
        command.Parameters.AddWithValue("@PhongCach", Db(request.PhongCach));
        command.Parameters.AddWithValue("@ChatLieu", Db(request.ChatLieu));
        command.Parameters.AddWithValue("@MoTa", Db(request.MoTa));
        command.Parameters.AddWithValue("@AnhThamKhao", Db(request.AnhThamKhao));
        command.Parameters.AddWithValue("@Type", (int)ParseCustomArtType(request.Type));
        command.Parameters.AddWithValue("@ReferenceArtworkId", (object?)request.ReferenceArtworkId ?? DBNull.Value);
        command.Parameters.AddWithValue("@ReferenceArtworkName", Db(request.ReferenceArtworkName));
        command.Parameters.AddWithValue("@ReferenceArtistName", Db(request.ReferenceArtistName));
        command.Parameters.AddWithValue("@ReferenceImageUrl", Db(request.ReferenceImageUrl));
        command.Parameters.AddWithValue("@NguonTacPhamGoc", Db(request.NguonTacPhamGoc));
        command.Parameters.AddWithValue("@TinhTrangQuyenSuDung", permissionStatus.HasValue ? (byte)permissionStatus.Value : DBNull.Value);
        command.Parameters.AddWithValue("@DaXacNhanQuyenTaiLieu", request.DaXacNhanQuyenTaiLieu);
        command.Parameters.AddWithValue("@MoTaQuyenSuDung", Db(request.MoTaQuyenSuDung));
        command.Parameters.AddWithValue("@BangChungQuyenSuDung", Db(request.BangChungQuyenSuDung));
        command.Parameters.AddWithValue("@GiaDuKien", request.GiaDuKien);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@NgayHoanThanhDuKien", (object?)request.NgayHoanThanhDuKien ?? DBNull.Value);
    }

    private static void AddActiveStatusParameters(SqlCommand command)
    {
        command.Parameters.AddWithValue("@Accepted", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        command.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        command.Parameters.AddWithValue("@DepositPaid", (int)CustomArtStatus.DepositPaid);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
    }

    private static bool IsActiveArtistStatus(CustomArtStatus status) => status is
        CustomArtStatus.Assigned or CustomArtStatus.Quoted or CustomArtStatus.CustomerAccepted or
        CustomArtStatus.DepositPaid or CustomArtStatus.InProgress or CustomArtStatus.PreviewSent or
        CustomArtStatus.RevisionRequested;

    private static object Db(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    private static CustomArtRequest Map(SqlDataReader reader) => new()
    {
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        MaKhachHang = reader.GetInt32(reader.GetOrdinal("MaKhachHang")),
        MaHoaSi = GetNullableInt(reader, "MaHoaSi"),
        TieuDe = GetNullableString(reader, "TieuDe") ?? string.Empty,
        LoaiTranh = GetNullableString(reader, "LoaiTranh") ?? string.Empty,
        KichThuoc = GetNullableString(reader, "KichThuoc") ?? string.Empty,
        ChuDe = GetNullableString(reader, "ChuDe") ?? string.Empty,
        MauSac = GetNullableString(reader, "MauSac") ?? string.Empty,
        PhongCach = GetNullableString(reader, "PhongCach") ?? string.Empty,
        ChatLieu = GetNullableString(reader, "ChatLieu") ?? string.Empty,
        MoTa = GetNullableString(reader, "MoTa"),
        AnhThamKhao = GetNullableString(reader, "AnhThamKhao"),
        Type = ParseCustomArtType(reader.GetInt32(reader.GetOrdinal("Type"))),
        ReferenceArtworkId = GetNullableInt(reader, "ReferenceArtworkId"),
        ReferenceArtworkName = GetNullableString(reader, "ReferenceArtworkName"),
        ReferenceArtistName = GetNullableString(reader, "ReferenceArtistName"),
        ReferenceImageUrl = GetNullableString(reader, "ReferenceImageUrl"),
        NguonTacPhamGoc = GetNullableString(reader, "NguonTacPhamGoc"),
        TinhTrangQuyenSuDung = GetNullableByte(reader, "TinhTrangQuyenSuDung") is byte permission ? (PermissionUsageStatus)permission : null,
        DaXacNhanQuyenTaiLieu = !reader.IsDBNull(reader.GetOrdinal("DaXacNhanQuyenTaiLieu")) && reader.GetBoolean(reader.GetOrdinal("DaXacNhanQuyenTaiLieu")),
        MoTaQuyenSuDung = GetNullableString(reader, "MoTaQuyenSuDung"),
        BangChungQuyenSuDung = GetNullableString(reader, "BangChungQuyenSuDung"),
        GhiChuKiemDuyet = GetNullableString(reader, "GhiChuKiemDuyet"),
        NguoiKiemDuyet = GetNullableInt(reader, "NguoiKiemDuyet"),
        NgayKiemDuyet = GetNullableDateTime(reader, "NgayKiemDuyet"),
        TienDatCoc = reader.GetDecimal(reader.GetOrdinal("TienDatCoc")),
        GiaDuKien = reader.GetDecimal(reader.GetOrdinal("GiaDuKien")),
        TrangThai = (CustomArtStatus)reader.GetInt32(reader.GetOrdinal("TrangThai")),
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
        NgayCapNhat = GetNullableDateTime(reader, "NgayCapNhat"),
        NgayHoanThanhDuKien = GetNullableDateTime(reader, "NgayHoanThanhDuKien"),
        TenKhachHang = GetNullableString(reader, "TenKhachHang"),
        TenHoaSiThucHien = GetNullableString(reader, "TenHoaSiThucHien"),
        MaTacPhamKetQua = GetNullableInt(reader, "MaTacPhamKetQua")
    };

    private static CustomArtQuote MapQuote(SqlDataReader reader) => new()
    {
        MaBaoGia = reader.GetInt32(reader.GetOrdinal("MaBaoGia")),
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
        GiaBaoGia = reader.GetDecimal(reader.GetOrdinal("GiaBaoGia")),
        ThoiGianHoanThanh = GetNullableString(reader, "ThoiGianHoanThanh") ?? string.Empty,
        GhiChu = GetNullableString(reader, "GhiChu"),
        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
        TrangThai = GetNullableString(reader, "TrangThai") ?? "PendingCustomerApproval"
    };

    private static CustomArtProgress MapProgress(SqlDataReader reader) => new()
    {
        MaTienDo = reader.GetInt32(reader.GetOrdinal("MaTienDo")),
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        TieuDe = GetNullableString(reader, "TieuDe") ?? string.Empty,
        MoTa = GetNullableString(reader, "MoTa") ?? string.Empty,
        AnhPreview = GetNullableString(reader, "AnhPreview"),
        TrangThai = GetNullableString(reader, "TrangThai") ?? "InProgress",
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao"))
    };

    private static CustomArtType ParseCustomArtType(string? type) => type?.Trim().ToUpperInvariant() switch
    {
        "ORIGINAL" or "ORIGINAL_COMMISSION" => CustomArtType.Original,
        "BASEDONARTWORK" or "EXISTING_ARTWORK" => CustomArtType.BasedOnArtwork,
        "REPRODUCTION" => CustomArtType.Reproduction,
        "PERSONALREFERENCE" or "PERSONAL_REFERENCE" => CustomArtType.PersonalReference,
        _ => CustomArtType.Original
    };

    private static CustomArtType ParseCustomArtType(int type) => Enum.IsDefined(typeof(CustomArtType), type)
        ? (CustomArtType)type
        : CustomArtType.Original;

    private static string? GetNullableString(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetString(reader.GetOrdinal(column)) : null;

    private static int? GetNullableInt(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetInt32(reader.GetOrdinal(column)) : null;

    private static byte? GetNullableByte(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetByte(reader.GetOrdinal(column)) : null;

    private static DateTime? GetNullableDateTime(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetDateTime(reader.GetOrdinal(column)) : null;

    private static bool HasColumn(SqlDataReader reader, string column) =>
        Enumerable.Range(0, reader.FieldCount).Any(i => reader.GetName(i).Equals(column, StringComparison.OrdinalIgnoreCase));
}
