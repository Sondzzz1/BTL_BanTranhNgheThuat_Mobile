using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class DonHangRepository : IDonHangRepository
{
    private readonly string _connectionString;

    public DonHangRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<DonHang>> GetAll()
    {
        var list = new List<DonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang ORDER BY NgayDat DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToDonHang(reader));
        }
        return list;
    }

    public async Task<DonHang?> GetById(int maDonHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToDonHang(reader);
        }
        return null;
    }

    public async Task<List<DonHang>> GetByNguoiDung(int maNguoiDung)
    {
        var list = new List<DonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang WHERE MaNguoiDung = @MaNguoiDung ORDER BY NgayDat DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToDonHang(reader));
        }
        return list;
    }

    public async Task<int> Create(DonHang donHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO DonHang (MaNguoiDung, NgayDat, TongTien, TenNguoiNhan, SoDienThoai, DiaChiGiao, TrangThai, LyDoHuy)
                      VALUES (@MaNguoiDung, @NgayDat, @TongTien, @TenNguoiNhan, @SoDienThoai, @DiaChiGiao, @TrangThai, @LyDoHuy);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", donHang.MaNguoiDung);
        command.Parameters.AddWithValue("@NgayDat", donHang.NgayDat);
        command.Parameters.AddWithValue("@TongTien", donHang.TongTien);
        command.Parameters.AddWithValue("@TenNguoiNhan", (object?)donHang.TenNguoiNhan ?? DBNull.Value);
        command.Parameters.AddWithValue("@SoDienThoai", (object?)donHang.SoDienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChiGiao", (object?)donHang.DiaChiGiao ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", donHang.TrangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)donHang.LyDoHuy ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(DonHang donHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE DonHang 
                      SET TongTien = @TongTien, 
                          TenNguoiNhan = @TenNguoiNhan, 
                          SoDienThoai = @SoDienThoai, 
                          DiaChiGiao = @DiaChiGiao, 
                          TrangThai = @TrangThai,
                          LyDoHuy = @LyDoHuy
                      WHERE MaDonHang = @MaDonHang";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", donHang.MaDonHang);
        command.Parameters.AddWithValue("@TongTien", donHang.TongTien);
        command.Parameters.AddWithValue("@TenNguoiNhan", (object?)donHang.TenNguoiNhan ?? DBNull.Value);
        command.Parameters.AddWithValue("@SoDienThoai", (object?)donHang.SoDienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChiGiao", (object?)donHang.DiaChiGiao ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", donHang.TrangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)donHang.LyDoHuy ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateTrangThai(int maDonHang, byte trangThai, string? lyDoHuy = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE DonHang
                      SET TrangThai=@TrangThai, LyDoHuy=@LyDoHuy,
                          NgayGiao=CASE WHEN @TrangThai=3 AND NgayGiao IS NULL THEN GETDATE() ELSE NgayGiao END
                      WHERE MaDonHang=@MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@TrangThai", trangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)lyDoHuy ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<List<ChiTietDonHang>> GetChiTiet(int maDonHang)
    {
        var list = new List<ChiTietDonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietDonHang
            {
                MaChiTietDH = reader.GetInt32(reader.GetOrdinal("MaChiTietDH")),
                MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong")),
                DonGia = reader.GetDecimal(reader.GetOrdinal("DonGia")),
                SoLuongDaHoan = reader.IsDBNull(reader.GetOrdinal("SoLuongDaHoan")) ? 0 : reader.GetInt32(reader.GetOrdinal("SoLuongDaHoan"))
            });
        }
        return list;
    }

    public async Task<int> CreateChiTiet(ChiTietDonHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ChiTietDonHang (MaDonHang, MaTacPham, SoLuong, DonGia)
                      VALUES (@MaDonHang, @MaTacPham, @SoLuong, @DonGia);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", chiTiet.MaDonHang);
        command.Parameters.AddWithValue("@MaTacPham", chiTiet.MaTacPham);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);
        command.Parameters.AddWithValue("@DonGia", chiTiet.DonGia);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<int> CreateTransactional(int maNguoiDung, TaoDonHangRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);

        try
        {
            var lines = await LoadCheckoutLines(connection, transaction, maNguoiDung, request);
            if (lines.Count == 0)
                throw new ArgumentException(request.Mode == "BUY_NOW" ? "Sản phẩm không tồn tại" : "Giỏ hàng không có sản phẩm được chọn");

            if (lines.Any(x => x.Quantity <= 0))
                throw new ArgumentException("Số lượng phải lớn hơn 0");
            if (lines.Any(x => x.Status != 1))
                throw new BusinessConflictException("Sản phẩm đã ngừng bán hoặc không còn khả dụng");

            var total = lines.Sum(x => x.UnitPrice * x.Quantity);
            const string insertOrderSql = @"
                INSERT INTO DonHang
                    (MaNguoiDung,NgayDat,TongTien,TenNguoiNhan,SoDienThoai,DiaChiGiao,TrangThai,GhiChu,LyDoHuy)
                OUTPUT INSERTED.MaDonHang
                VALUES
                    (@MaNguoiDung,GETDATE(),@TongTien,@TenNguoiNhan,@SoDienThoai,@DiaChiGiao,@TrangThai,@GhiChu,NULL);";
            await using var insertOrder = new SqlCommand(insertOrderSql, connection, transaction);
            insertOrder.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            insertOrder.Parameters.AddWithValue("@TongTien", total);
            insertOrder.Parameters.AddWithValue("@TenNguoiNhan", request.TenNguoiNhan);
            insertOrder.Parameters.AddWithValue("@SoDienThoai", request.SoDienThoai);
            insertOrder.Parameters.AddWithValue("@DiaChiGiao", request.DiaChiGiao);
            insertOrder.Parameters.AddWithValue("@TrangThai", DonHangStatus.ChoXacNhan);
            insertOrder.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
            var orderId = Convert.ToInt32(await insertOrder.ExecuteScalarAsync());

            foreach (var line in lines.OrderBy(x => x.ArtworkId))
            {
                const string insertLineSql = @"
                    INSERT INTO ChiTietDonHang (MaDonHang,MaTacPham,SoLuong,DonGia)
                    VALUES (@MaDonHang,@MaTacPham,@SoLuong,@DonGia);";
                await using var insertLine = new SqlCommand(insertLineSql, connection, transaction);
                insertLine.Parameters.AddWithValue("@MaDonHang", orderId);
                insertLine.Parameters.AddWithValue("@MaTacPham", line.ArtworkId);
                insertLine.Parameters.AddWithValue("@SoLuong", line.Quantity);
                insertLine.Parameters.AddWithValue("@DonGia", line.UnitPrice);
                if (await insertLine.ExecuteNonQueryAsync() != 1)
                    throw new InvalidOperationException("Không thể tạo chi tiết đơn hàng");
            }

            foreach (var line in lines.OrderBy(x => x.ArtworkId))
            {
                const string decreaseStockSql = @"
                    UPDATE TacPham
                    SET SoLuong=SoLuong-@SoLuong
                    WHERE MaTacPham=@MaTacPham AND TrangThai=1 AND SoLuong>=@SoLuong;";
                await using var decreaseStock = new SqlCommand(decreaseStockSql, connection, transaction);
                decreaseStock.Parameters.AddWithValue("@MaTacPham", line.ArtworkId);
                decreaseStock.Parameters.AddWithValue("@SoLuong", line.Quantity);
                if (await decreaseStock.ExecuteNonQueryAsync() != 1)
                    throw new BusinessConflictException("Sản phẩm đã hết hoặc không đủ tồn kho");
            }

            const string insertPaymentSql = @"
                INSERT INTO ThanhToan
                    (MaDonHang,PhuongThuc,TrangThai,NgayThanhToan,MaGiaoDich,NguoiXacNhan)
                VALUES
                    (@MaDonHang,@PhuongThuc,'ChoThanhToan',NULL,NULL,NULL);";
            await using (var insertPayment = new SqlCommand(insertPaymentSql, connection, transaction))
            {
                insertPayment.Parameters.AddWithValue("@MaDonHang", orderId);
                insertPayment.Parameters.AddWithValue("@PhuongThuc", request.PhuongThucThanhToan);
                if (await insertPayment.ExecuteNonQueryAsync() != 1)
                    throw new InvalidOperationException("Không thể tạo thanh toán cho đơn hàng");
            }

            if (request.Mode == "CART")
            {
                var cartLineIds = lines.Select(x => x.CartLineId!.Value).ToList();
                var parameterNames = cartLineIds.Select((_, index) => $"@CartLine{index}").ToArray();
                var deleteSql = $@"
                    DELETE c
                    FROM ChiTietGioHang c
                    INNER JOIN GioHang g ON g.MaGioHang=c.MaGioHang
                    WHERE g.MaNguoiDung=@MaNguoiDung
                      AND c.MaChiTietGH IN ({string.Join(',', parameterNames)});";
                await using var deleteCartLines = new SqlCommand(deleteSql, connection, transaction);
                deleteCartLines.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
                for (var index = 0; index < cartLineIds.Count; index++)
                    deleteCartLines.Parameters.AddWithValue(parameterNames[index], cartLineIds[index]);
                if (await deleteCartLines.ExecuteNonQueryAsync() != cartLineIds.Count)
                    throw new BusinessConflictException("Giỏ hàng đã thay đổi, vui lòng tải lại trước khi thanh toán");
            }

            await transaction.CommitAsync();
            return orderId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RequestCancellation(int maNguoiDung, int maDonHang, string? lyDo)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE DonHang
            SET TrangThai=@YeuCauHuy,LyDoHuy=@LyDo
            WHERE MaDonHang=@MaDonHang AND MaNguoiDung=@MaNguoiDung AND TrangThai=@ChoXacNhan;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@YeuCauHuy", DonHangStatus.YeuCauHuy);
        command.Parameters.AddWithValue("@ChoXacNhan", DonHangStatus.ChoXacNhan);
        command.Parameters.AddWithValue("@LyDo", (object?)lyDo ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> UpdateStatusTransactional(int maDonHang, byte trangThaiMoi, string? ghiChu, int maTaiKhoan)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            const string selectSql = "SELECT TrangThai FROM DonHang WITH (UPDLOCK,HOLDLOCK) WHERE MaDonHang=@MaDonHang;";
            await using var select = new SqlCommand(selectSql, connection, transaction);
            select.Parameters.AddWithValue("@MaDonHang", maDonHang);
            var currentValue = await select.ExecuteScalarAsync();
            if (currentValue == null || currentValue == DBNull.Value)
            {
                await transaction.RollbackAsync();
                return false;
            }

            var current = Convert.ToByte(currentValue);
            if (!IsAllowedTransition(current, trangThaiMoi))
                throw new BusinessConflictException("Chuyển trạng thái đơn hàng không hợp lệ hoặc đơn đã được xử lý");

            const string updateOrderSql = @"
                UPDATE DonHang
                SET TrangThai=@TrangThaiMoi,
                    LyDoHuy=CASE WHEN @TrangThaiMoi=@DaHuy THEN @GhiChu ELSE LyDoHuy END,
                    NgayGiao=CASE WHEN @TrangThaiMoi=@DaGiao AND NgayGiao IS NULL THEN GETDATE() ELSE NgayGiao END
                WHERE MaDonHang=@MaDonHang AND TrangThai=@TrangThaiCu;";
            await using var updateOrder = new SqlCommand(updateOrderSql, connection, transaction);
            updateOrder.Parameters.AddWithValue("@TrangThaiMoi", trangThaiMoi);
            updateOrder.Parameters.AddWithValue("@TrangThaiCu", current);
            updateOrder.Parameters.AddWithValue("@DaHuy", DonHangStatus.DaHuy);
            updateOrder.Parameters.AddWithValue("@DaGiao", DonHangStatus.DaGiao);
            updateOrder.Parameters.AddWithValue("@GhiChu", (object?)ghiChu ?? DBNull.Value);
            updateOrder.Parameters.AddWithValue("@MaDonHang", maDonHang);
            if (await updateOrder.ExecuteNonQueryAsync() != 1)
                throw new BusinessConflictException("Đơn hàng đã được xử lý bởi một yêu cầu khác");

            if (trangThaiMoi == DonHangStatus.DaHuy)
            {
                const string countSql = "SELECT COUNT_BIG(*) FROM ChiTietDonHang WHERE MaDonHang=@MaDonHang;";
                await using var count = new SqlCommand(countSql, connection, transaction);
                count.Parameters.AddWithValue("@MaDonHang", maDonHang);
                var lineCount = Convert.ToInt64(await count.ExecuteScalarAsync());
                if (lineCount == 0)
                    throw new InvalidOperationException("Đơn hàng không có chi tiết để hoàn tồn kho");

                const string restoreSql = @"
                    UPDATE t
                    SET t.SoLuong=t.SoLuong+c.SoLuong
                    FROM TacPham t
                    INNER JOIN ChiTietDonHang c ON c.MaTacPham=t.MaTacPham
                    WHERE c.MaDonHang=@MaDonHang;";
                await using var restore = new SqlCommand(restoreSql, connection, transaction);
                restore.Parameters.AddWithValue("@MaDonHang", maDonHang);
                if (await restore.ExecuteNonQueryAsync() != lineCount)
                    throw new InvalidOperationException("Không thể hoàn lại đầy đủ tồn kho của đơn hàng");

                const string cancelPaymentSql = @"
                    UPDATE ThanhToan
                    SET TrangThai=CASE WHEN TrangThai='DaThanhToan' THEN 'ChoHoanTien' ELSE 'ThatBai' END
                    WHERE MaDonHang=@MaDonHang AND TrangThai IN ('ChoThanhToan','DaThanhToan');";
                await using var cancelPayment = new SqlCommand(cancelPaymentSql, connection, transaction);
                cancelPayment.Parameters.AddWithValue("@MaDonHang", maDonHang);
                await cancelPayment.ExecuteNonQueryAsync();
            }

            if (trangThaiMoi == DonHangStatus.DaGiao)
            {
                const string payCodSql = @"
                    UPDATE ThanhToan
                    SET TrangThai='DaThanhToan',NgayThanhToan=ISNULL(NgayThanhToan,GETDATE()),NguoiXacNhan=@NguoiXacNhan
                    WHERE MaDonHang=@MaDonHang AND PhuongThuc='COD' AND TrangThai='ChoThanhToan';";
                await using var payCod = new SqlCommand(payCodSql, connection, transaction);
                payCod.Parameters.AddWithValue("@NguoiXacNhan", maTaiKhoan);
                payCod.Parameters.AddWithValue("@MaDonHang", maDonHang);
                await payCod.ExecuteNonQueryAsync();

                const string validateCodSql = @"
                    SELECT COUNT_BIG(*) FROM ThanhToan
                    WHERE MaDonHang=@MaDonHang AND (PhuongThuc<>'COD' OR TrangThai='DaThanhToan');";
                await using var validateCod = new SqlCommand(validateCodSql, connection, transaction);
                validateCod.Parameters.AddWithValue("@MaDonHang", maDonHang);
                if (Convert.ToInt64(await validateCod.ExecuteScalarAsync()) != 1)
                    throw new BusinessConflictException("Không thể đồng bộ trạng thái thanh toán COD khi giao hàng");
            }

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static bool IsAllowedTransition(byte current, byte next) => (current, next) switch
    {
        (DonHangStatus.ChoXacNhan, DonHangStatus.DaXacNhan) => true,
        (DonHangStatus.ChoXacNhan, DonHangStatus.DaHuy) => true,
        (DonHangStatus.DaXacNhan, DonHangStatus.DangGiao) => true,
        (DonHangStatus.DaXacNhan, DonHangStatus.DaHuy) => true,
        (DonHangStatus.DangGiao, DonHangStatus.DaGiao) => true,
        (DonHangStatus.YeuCauHuy, DonHangStatus.DaXacNhan) => true,
        (DonHangStatus.YeuCauHuy, DonHangStatus.DaHuy) => true,
        _ => false
    };

    private static async Task<List<CheckoutLine>> LoadCheckoutLines(
        SqlConnection connection,
        SqlTransaction transaction,
        int maNguoiDung,
        TaoDonHangRequest request)
    {
        if (request.Mode == "BUY_NOW")
        {
            const string buyNowSql = @"
                SELECT MaTacPham,Gia,TrangThai
                FROM TacPham WITH (UPDLOCK,HOLDLOCK)
                WHERE MaTacPham=@MaTacPham;";
            await using var command = new SqlCommand(buyNowSql, connection, transaction);
            command.Parameters.AddWithValue("@MaTacPham", request.MaTacPham!.Value);
            await using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return new List<CheckoutLine>();
            return new List<CheckoutLine>
            {
                new(null, reader.GetInt32(0), request.SoLuong!.Value, reader.GetDecimal(1), reader.GetByte(2))
            };
        }

        var requestedIds = request.CartItemIds?.Distinct().ToList() ?? new List<int>();
        var idFilter = string.Empty;
        var parameterNames = Array.Empty<string>();
        if (requestedIds.Count > 0)
        {
            parameterNames = requestedIds.Select((_, index) => $"@CartItem{index}").ToArray();
            idFilter = $" AND c.MaChiTietGH IN ({string.Join(',', parameterNames)})";
        }

        var cartSql = $@"
            SELECT c.MaChiTietGH,c.MaTacPham,c.SoLuong,t.Gia,t.TrangThai
            FROM GioHang g WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN ChiTietGioHang c WITH (UPDLOCK,HOLDLOCK) ON c.MaGioHang=g.MaGioHang
            INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaTacPham=c.MaTacPham
            WHERE g.MaNguoiDung=@MaNguoiDung{idFilter}
            ORDER BY c.MaTacPham;";
        await using var cartCommand = new SqlCommand(cartSql, connection, transaction);
        cartCommand.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        for (var index = 0; index < requestedIds.Count; index++)
            cartCommand.Parameters.AddWithValue(parameterNames[index], requestedIds[index]);

        var result = new List<CheckoutLine>();
        await using (var reader = await cartCommand.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
                result.Add(new CheckoutLine(reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetDecimal(3), reader.GetByte(4)));
        }

        if (requestedIds.Count > 0 && result.Count != requestedIds.Count)
            throw new UnauthorizedAccessException("Một hoặc nhiều dòng giỏ hàng không thuộc tài khoản của bạn");
        return result;
    }

    private sealed record CheckoutLine(int? CartLineId, int ArtworkId, int Quantity, decimal UnitPrice, byte Status);

    private DonHang MapToDonHang(SqlDataReader reader)
    {
        return new DonHang
        {
            MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
            MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung")),
            NgayDat = reader.GetDateTime(reader.GetOrdinal("NgayDat")),
            TongTien = reader.GetDecimal(reader.GetOrdinal("TongTien")),
            TenNguoiNhan = reader.IsDBNull(reader.GetOrdinal("TenNguoiNhan")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("TenNguoiNhan")),
            SoDienThoai = reader.IsDBNull(reader.GetOrdinal("SoDienThoai")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("SoDienThoai")),
            DiaChiGiao = reader.IsDBNull(reader.GetOrdinal("DiaChiGiao")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("DiaChiGiao")),
            GhiChu = HasColumn(reader, "GhiChu") && !reader.IsDBNull(reader.GetOrdinal("GhiChu"))
                ? reader.GetString(reader.GetOrdinal("GhiChu"))
                : null,
            TrangThai = reader.GetByte(reader.GetOrdinal("TrangThai")),
            LyDoHuy = reader.IsDBNull(reader.GetOrdinal("LyDoHuy")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("LyDoHuy")),
            NgayGiao = reader.IsDBNull(reader.GetOrdinal("NgayGiao")) ? null : reader.GetDateTime(reader.GetOrdinal("NgayGiao"))
        };
    }

    private static bool HasColumn(SqlDataReader reader, string name)
    {
        for (var index = 0; index < reader.FieldCount; index++)
            if (reader.GetName(index).Equals(name, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
