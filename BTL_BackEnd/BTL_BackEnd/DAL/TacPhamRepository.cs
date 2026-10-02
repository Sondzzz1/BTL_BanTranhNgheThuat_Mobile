using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;
    private readonly DateTime _copyrightEnforcementStartUtc;

    private const string SellableCopyrightPredicate = @"
        AND ((NOT EXISTS (SELECT 1 FROM BanQuyen b0 WHERE b0.MaTacPham=tp.MaTacPham)
              AND tp.NgayTao<@EnforcementStart)
             OR EXISTS (SELECT 1 FROM BanQuyen b WHERE b.MaTacPham=tp.MaTacPham
                        AND b.BiChanBan=0
                        AND (b.TrangThai=2 OR ((tp.NgayTao<@EnforcementStart OR b.LaDuLieuCu=1)
                             AND b.TrangThai IN (0,1,5)))))";

    public TacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
        _copyrightEnforcementStartUtc = CopyrightOptions.From(configuration).EnforcementStartUtc;
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
                  " ORDER BY tp.NgayTao DESC",
            command => command.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc));

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
            command.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc);
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
        command.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc);
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
            command.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc);
        });

    public Task<List<TacPham>> GetMarketplaceByCategory(int maDanhMuc) => QueryList(
        @"SELECT tp.* FROM TacPham tp
          WHERE tp.MaDanhMuc=@MaDanhMuc AND tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + SellableCopyrightPredicate + @"
          ORDER BY NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);
            command.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc);
        });

    public async Task<int> Create(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO TacPham (TenTacPham, MaHoaSi, MaDanhMuc, Gia, SoLuong, SoLuongBanDau, MoTa, HinhAnh, ChatLieu, ChatLieuKhung, KichThuoc, TrangThai, NgayTao, LyDo,LaTacPhamDocBan,LoaiTacPham,TacGiaGoc,MaTacPhamGoc,MoTaNguonGoc)
                      VALUES (@TenTacPham, @MaHoaSi, @MaDanhMuc, @Gia, @SoLuong, @SoLuong, @MoTa, @HinhAnh, @ChatLieu, @ChatLieuKhung, @KichThuoc, @TrangThai, @NgayTao, @LyDo,@LaTacPhamDocBan,@LoaiTacPham,@TacGiaGoc,@MaTacPhamGoc,@MoTaNguonGoc);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
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
