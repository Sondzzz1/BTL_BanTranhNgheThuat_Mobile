using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using System.Text;

namespace DoAn2_BackEnd.DAL;

public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;

    // Xác minh hồ sơ nguồn gốc phục vụ chứng nhận/quyền sở hữu sau bán, không phải
    // điều kiện để ẩn một tác phẩm đã được Admin duyệt. Marketplace chỉ loại trừ
    // tác phẩm khi hồ sơ bản quyền đã bị chặn bán một cách rõ ràng.
    private const string SellableCopyrightPredicate = @"
        AND NOT EXISTS (
            SELECT 1 FROM BanQuyen b
            WHERE b.MaTacPham=tp.MaTacPham
              AND ISNULL(b.BiChanBan, 0)=1)";

    public TacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<TacPham>> GetAll()
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        return list;
    }

    public async Task<TacPham?> GetById(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToTacPham(reader);
        }
        return null;
    }

    public async Task<List<TacPham>> GetByHoaSi(int maHoaSi)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaHoaSi = @MaHoaSi ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        return list;
    }

    public async Task<List<TacPham>> GetByDanhMuc(int maDanhMuc)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaDanhMuc = @MaDanhMuc ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        return list;
    }

    public Task<List<TacPham>> GetMarketplaceAll() =>
        QueryList(@"SELECT tp.* FROM TacPham tp
                    WHERE tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + SellableCopyrightPredicate +
                  " ORDER BY tp.NgayTao DESC");

    public Task<List<TacPham>> GetMarketplaceBestSelling(int top) => QueryList(
        @"SELECT TOP (@Top) tp.*
          FROM TacPham tp
          OUTER APPLY (
              SELECT SUM(CASE WHEN ct.SoLuong > ISNULL(ct.SoLuongDaHoan, 0)
                              THEN ct.SoLuong - ISNULL(ct.SoLuongDaHoan, 0) ELSE 0 END) AS SoLuongBan
              FROM ChiTietDonHang ct
              INNER JOIN DonHang dh ON dh.MaDonHang = ct.MaDonHang AND dh.TrangThai = 3
              WHERE ct.MaTacPham = tp.MaTacPham
          ) sales
          WHERE tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai = 1 " + SellableCopyrightPredicate + @"
          ORDER BY ISNULL(sales.SoLuongBan, 0) DESC, tp.NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@Top", Math.Clamp(top, 1, 20));
        });

    public async Task<TacPham?> GetMarketplaceById(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"SELECT tp.* FROM TacPham tp
                      WHERE tp.MaTacPham=@MaTacPham AND tp.MaYeuCauVeTranh IS NULL
                        AND tp.TrangThai=1 " + SellableCopyrightPredicate;
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapToTacPham(reader) : null;
    }

    public Task<List<TacPham>> GetMarketplaceByArtist(int maHoaSi) => QueryList(
        @"SELECT tp.* FROM TacPham tp
          WHERE tp.MaHoaSi=@MaHoaSi AND tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + SellableCopyrightPredicate + @"
          ORDER BY NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        });

    public Task<List<TacPham>> GetMarketplaceByCategory(int maDanhMuc) => QueryList(
        @"SELECT tp.* FROM TacPham tp
          WHERE tp.MaDanhMuc=@MaDanhMuc AND tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + SellableCopyrightPredicate + @"
          ORDER BY NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);
        });

    /// <summary>
    /// Danh sách nội bộ cho Admin. Khác với marketplace: bao gồm cả tranh
    /// chờ duyệt/ẩn/từ chối, nhưng không trộn các tác phẩm tạo từ yêu cầu đặt vẽ.
    /// Phân trang và bộ lọc được thực hiện ở cơ sở dữ liệu.
    /// </summary>
    public async Task<(List<TacPham> Items, int TotalItems)> GetAdminPage(AdminArtworkQuery query)
    {
        var where = new StringBuilder(" WHERE tp.MaYeuCauVeTranh IS NULL");

        if (!string.IsNullOrWhiteSpace(query.Keyword))
            where.Append(" AND (tp.TenTacPham LIKE @Keyword OR hs.TenHoaSi LIKE @Keyword OR dm.TenDanhMuc LIKE @Keyword)");
        if (query.MaHoaSi.HasValue)
            where.Append(" AND tp.MaHoaSi=@MaHoaSi");
        if (query.MaDanhMuc.HasValue)
            where.Append(" AND tp.MaDanhMuc=@MaDanhMuc");
        if (query.TrangThai.HasValue)
            where.Append(" AND tp.TrangThai=@TrangThai");
        if (query.LaTacPhamDocBan.HasValue)
            where.Append(" AND tp.LaTacPhamDocBan=@LaTacPhamDocBan");

        switch (query.TonKho?.Trim().ToLowerInvariant())
        {
            case "con_hang":
                where.Append(" AND tp.SoLuong > 0");
                break;
            case "sap_het":
                where.Append(" AND tp.SoLuong BETWEEN 1 AND 3");
                break;
            case "het_hang":
                where.Append(" AND tp.SoLuong <= 0");
                break;
        }

        var orderBy = query.SapXep?.Trim().ToLowerInvariant() switch
        {
            "oldest" => "tp.NgayTao ASC, tp.MaTacPham ASC",
            "price_asc" => "tp.Gia ASC, tp.MaTacPham DESC",
            "price_desc" => "tp.Gia DESC, tp.MaTacPham DESC",
            "stock_asc" => "tp.SoLuong ASC, tp.MaTacPham DESC",
            "stock_desc" => "tp.SoLuong DESC, tp.MaTacPham DESC",
            "artist" => "hs.TenHoaSi ASC, tp.NgayTao DESC, tp.MaTacPham DESC",
            _ => "tp.NgayTao DESC, tp.MaTacPham DESC"
        };

        const string from = @"
            FROM TacPham tp
            INNER JOIN HoaSi hs ON hs.MaHoaSi=tp.MaHoaSi
            LEFT JOIN DanhMuc dm ON dm.MaDanhMuc=tp.MaDanhMuc";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var countCommand = new SqlCommand("SELECT COUNT(*)" + from + where, connection);
        AddAdminQueryParameters(countCommand, query);
        var totalItems = Convert.ToInt32(await countCommand.ExecuteScalarAsync());

        using var pageCommand = new SqlCommand(
            "SELECT tp.*" + from + where + " ORDER BY " + orderBy + " OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", connection);
        AddAdminQueryParameters(pageCommand, query);
        pageCommand.Parameters.AddWithValue("@Offset", (query.Page - 1) * query.PageSize);
        pageCommand.Parameters.AddWithValue("@PageSize", query.PageSize);

        var items = new List<TacPham>();
        using var reader = await pageCommand.ExecuteReaderAsync();
        while (await reader.ReadAsync()) items.Add(MapToTacPham(reader));
        return (items, totalItems);
    }

    public async Task<int> Create(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO TacPham (TenTacPham, MaHoaSi, MaDanhMuc, Gia, SoLuong, SoLuongBanDau, MoTa, HinhAnh, ChatLieu, ChatLieuKhung, KichThuoc, TrangThai, NgayTao, LyDo,LaTacPhamDocBan,LoaiTacPham,TacGiaGoc,MaTacPhamGoc,MoTaNguonGoc)
                      VALUES (@TenTacPham, @MaHoaSi, @MaDanhMuc, @Gia, @SoLuong, @SoLuongBanDau, @MoTa, @HinhAnh, @ChatLieu, @ChatLieuKhung, @KichThuoc, @TrangThai, @NgayTao, @LyDo,@LaTacPhamDocBan,@LoaiTacPham,@TacGiaGoc,@MaTacPhamGoc,@MoTaNguonGoc);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@SoLuongBanDau", (object?)tacPham.SoLuongBanDau ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@NgayTao", tacPham.NgayTao);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);
        command.Parameters.AddWithValue("@LaTacPhamDocBan", tacPham.LaTacPhamDocBan);
        command.Parameters.AddWithValue("@LoaiTacPham", tacPham.LoaiTacPham);
        command.Parameters.AddWithValue("@TacGiaGoc", (object?)tacPham.TacGiaGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaTacPhamGoc", (object?)tacPham.MaTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTaNguonGoc", (object?)tacPham.MoTaNguonGoc ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE TacPham 
                      SET TenTacPham = @TenTacPham, 
                          MaDanhMuc = @MaDanhMuc, 
                          Gia = @Gia, 
                          SoLuong = @SoLuong, 
                          MoTa = @MoTa, 
                          HinhAnh = @HinhAnh, 
                          ChatLieu = @ChatLieu,
                          ChatLieuKhung = @ChatLieuKhung,
                          KichThuoc = @KichThuoc,
                          TrangThai = @TrangThai,
                          LyDo = @LyDo
                      WHERE MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateWithArtistNotification(TacPham tacPham, ThongBao thongBao)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try
        {
            const string accountSql = @"
                SELECT h.MaTaiKhoan FROM TacPham t WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
                WHERE t.MaTacPham=@MaTacPham AND t.MaHoaSi=@MaHoaSi AND t.MaYeuCauVeTranh IS NULL;";
            await using var account = new SqlCommand(accountSql, connection, transaction);
            account.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
            account.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
            var accountIdValue = await account.ExecuteScalarAsync();
            if (accountIdValue is null || accountIdValue == DBNull.Value)
                throw new InvalidOperationException("Không tìm được tài khoản chủ sở hữu tác phẩm");

            const string updateSql = @"UPDATE TacPham
                SET TenTacPham=@TenTacPham,MaDanhMuc=@MaDanhMuc,Gia=@Gia,SoLuong=@SoLuong,
                    MoTa=@MoTa,HinhAnh=@HinhAnh,ChatLieu=@ChatLieu,ChatLieuKhung=@ChatLieuKhung,
                    KichThuoc=@KichThuoc,TrangThai=@TrangThai,LyDo=@LyDo
                WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi AND MaYeuCauVeTranh IS NULL;";
            await using var update = new SqlCommand(updateSql, connection, transaction);
            AddUpdateParameters(update, tacPham);
            if (await update.ExecuteNonQueryAsync() != 1)
                throw new InvalidOperationException("Tác phẩm đã thay đổi hoặc không còn tồn tại");

            thongBao.MaTaiKhoan = Convert.ToInt32(accountIdValue);
            await ThongBaoSql.InsertAsync(connection, transaction, thongBao);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> Delete(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM TacPham WHERE MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> HasDeliveredOrders(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"SELECT COUNT(1) 
                      FROM ChiTietDonHang ct 
                      JOIN DonHang d ON ct.MaDonHang = d.MaDonHang 
                      WHERE ct.MaTacPham = @MaTacPham AND d.TrangThai = 3"; // 3 is DaGiao

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var count = await command.ExecuteScalarAsync();
        return Convert.ToInt32(count) > 0;
    }

    private async Task<List<TacPham>> QueryList(string query, Action<SqlCommand>? configure = null)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var command = new SqlCommand(query, connection);
        configure?.Invoke(command);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) list.Add(MapToTacPham(reader));
        return list;
    }

    private static void AddUpdateParameters(SqlCommand command, TacPham tacPham)
    {
        command.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
        command.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);
    }

    private static void AddAdminQueryParameters(SqlCommand command, AdminArtworkQuery query)
    {
        if (!string.IsNullOrWhiteSpace(query.Keyword))
            command.Parameters.AddWithValue("@Keyword", "%" + query.Keyword.Trim() + "%");
        if (query.MaHoaSi.HasValue)
            command.Parameters.AddWithValue("@MaHoaSi", query.MaHoaSi.Value);
        if (query.MaDanhMuc.HasValue)
            command.Parameters.AddWithValue("@MaDanhMuc", query.MaDanhMuc.Value);
        if (query.TrangThai.HasValue)
            command.Parameters.AddWithValue("@TrangThai", query.TrangThai.Value);
        if (query.LaTacPhamDocBan.HasValue)
            command.Parameters.AddWithValue("@LaTacPhamDocBan", query.LaTacPhamDocBan.Value);
    }

    private TacPham MapToTacPham(SqlDataReader reader)
    {
        return new TacPham
        {
            MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
            TenTacPham = reader.GetString(reader.GetOrdinal("TenTacPham")),
            MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            MaDanhMuc = reader.IsDBNull(reader.GetOrdinal("MaDanhMuc")) 
                ? null 
                : reader.GetInt32(reader.GetOrdinal("MaDanhMuc")),
            Gia = reader.GetDecimal(reader.GetOrdinal("Gia")),
            SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong")),
            MoTa = reader.IsDBNull(reader.GetOrdinal("MoTa")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("MoTa")),
            HinhAnh = reader.IsDBNull(reader.GetOrdinal("HinhAnh")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("HinhAnh")),
            ChatLieu = reader.IsDBNull(reader.GetOrdinal("ChatLieu")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("ChatLieu")),
            ChatLieuKhung = reader.IsDBNull(reader.GetOrdinal("ChatLieuKhung")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("ChatLieuKhung")),
            KichThuoc = reader.IsDBNull(reader.GetOrdinal("KichThuoc")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("KichThuoc")),
            TrangThai = reader.GetByte(reader.GetOrdinal("TrangThai")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            LyDo = HasColumn(reader, "LyDo") && !reader.IsDBNull(reader.GetOrdinal("LyDo"))
                ? reader.GetString(reader.GetOrdinal("LyDo"))
                : null,
            LoaiTacPham = HasColumn(reader, "LoaiTacPham") && !reader.IsDBNull(reader.GetOrdinal("LoaiTacPham"))
                ? reader.GetByte(reader.GetOrdinal("LoaiTacPham"))
                : (byte)0,
            TacGiaGoc = HasColumn(reader, "TacGiaGoc") && !reader.IsDBNull(reader.GetOrdinal("TacGiaGoc"))
                ? reader.GetString(reader.GetOrdinal("TacGiaGoc"))
                : null,
            MaTacPhamGoc = HasColumn(reader, "MaTacPhamGoc") && !reader.IsDBNull(reader.GetOrdinal("MaTacPhamGoc"))
                ? reader.GetInt32(reader.GetOrdinal("MaTacPhamGoc"))
                : null,
            MaYeuCauVeTranh = HasColumn(reader, "MaYeuCauVeTranh") && !reader.IsDBNull(reader.GetOrdinal("MaYeuCauVeTranh"))
                ? reader.GetInt32(reader.GetOrdinal("MaYeuCauVeTranh"))
                : null,
            MoTaNguonGoc = HasColumn(reader, "MoTaNguonGoc") && !reader.IsDBNull(reader.GetOrdinal("MoTaNguonGoc"))
                ? reader.GetString(reader.GetOrdinal("MoTaNguonGoc"))
                : null,
            LaTacPhamDocBan = HasColumn(reader, "LaTacPhamDocBan") && !reader.IsDBNull(reader.GetOrdinal("LaTacPhamDocBan"))
                && reader.GetBoolean(reader.GetOrdinal("LaTacPhamDocBan")),
            SoLuongBanDau = HasColumn(reader, "SoLuongBanDau") && !reader.IsDBNull(reader.GetOrdinal("SoLuongBanDau"))
                ? reader.GetInt32(reader.GetOrdinal("SoLuongBanDau"))
                : null
        };
    }

    private static bool HasColumn(SqlDataReader reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}
