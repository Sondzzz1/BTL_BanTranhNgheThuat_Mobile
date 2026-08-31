using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class TacPhamChinhSuaRepository : ITacPhamChinhSuaRepository
{
    private readonly string _connectionString;

    public TacPhamChinhSuaRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<TacPhamChinhSua?> GetById(int maChinhSua)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT MaChinhSua, MaTacPham, TenTacPham, MaDanhMuc, Gia, SoLuong, 
                   MoTa, HinhAnh, KichThuoc, ChatLieu, ChatLieuKhung, 
                   NgayChinhSua, TrangThai, LyDo
            FROM TacPhamChinhSua
            WHERE MaChinhSua = @MaChinhSua";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChinhSua", maChinhSua);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapFromReader(reader);
        }

        return null;
    }

    public async Task<TacPhamChinhSua?> GetByMaTacPhamChoDuyet(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT MaChinhSua, MaTacPham, TenTacPham, MaDanhMuc, Gia, SoLuong, 
                   MoTa, HinhAnh, KichThuoc, ChatLieu, ChatLieuKhung, 
                   NgayChinhSua, TrangThai, LyDo
            FROM TacPhamChinhSua
            WHERE MaTacPham = @MaTacPham AND TrangThai = 0
            ORDER BY NgayChinhSua DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapFromReader(reader);
        }

        return null;
    }

    public async Task<List<TacPhamChinhSua>> GetAllChoDuyet()
    {
        var list = new List<TacPhamChinhSua>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT MaChinhSua, MaTacPham, TenTacPham, MaDanhMuc, Gia, SoLuong, 
                   MoTa, HinhAnh, KichThuoc, ChatLieu, ChatLieuKhung, 
                   NgayChinhSua, TrangThai, LyDo
            FROM TacPhamChinhSua
            ORDER BY NgayChinhSua DESC";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapFromReader(reader));
        }

        return list;
    }

    public async Task<int> Create(TacPhamChinhSua chinhSua)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT INTO TacPhamChinhSua 
                (MaTacPham, TenTacPham, MaDanhMuc, Gia, SoLuong, MoTa, HinhAnh, 
                 KichThuoc, ChatLieu, ChatLieuKhung, NgayChinhSua, TrangThai, LyDo)
            VALUES 
                (@MaTacPham, @TenTacPham, @MaDanhMuc, @Gia, @SoLuong, @MoTa, @HinhAnh, 
                 @KichThuoc, @ChatLieu, @ChatLieuKhung, @NgayChinhSua, @TrangThai, @LyDo);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";

        using var command = new SqlCommand(query, connection);
        AddParameters(command, chinhSua);

        var result = await command.ExecuteScalarAsync();
        return result != null ? Convert.ToInt32(result) : 0;
    }

    public async Task<bool> Update(TacPhamChinhSua chinhSua)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            UPDATE TacPhamChinhSua
            SET MaTacPham = @MaTacPham,
                TenTacPham = @TenTacPham,
                MaDanhMuc = @MaDanhMuc,
                Gia = @Gia,
                SoLuong = @SoLuong,
                MoTa = @MoTa,
                HinhAnh = @HinhAnh,
                KichThuoc = @KichThuoc,
                ChatLieu = @ChatLieu,
                ChatLieuKhung = @ChatLieuKhung,
                NgayChinhSua = @NgayChinhSua,
                TrangThai = @TrangThai,
                LyDo = @LyDo
            WHERE MaChinhSua = @MaChinhSua";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChinhSua", chinhSua.MaChinhSua);
        AddParameters(command, chinhSua);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int maChinhSua)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM TacPhamChinhSua WHERE MaChinhSua = @MaChinhSua";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChinhSua", maChinhSua);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    private TacPhamChinhSua MapFromReader(SqlDataReader reader)
    {
        return new TacPhamChinhSua
        {
            MaChinhSua = reader.GetInt32(0),
            MaTacPham = reader.GetInt32(1),
            TenTacPham = reader.GetString(2),
            MaDanhMuc = reader.IsDBNull(3) ? null : reader.GetInt32(3),
            Gia = reader.GetDecimal(4),
            SoLuong = reader.GetInt32(5),
            MoTa = reader.IsDBNull(6) ? null : reader.GetString(6),
            HinhAnh = reader.IsDBNull(7) ? null : reader.GetString(7),
            KichThuoc = reader.IsDBNull(8) ? null : reader.GetString(8),
            ChatLieu = reader.IsDBNull(9) ? null : reader.GetString(9),
            ChatLieuKhung = reader.IsDBNull(10) ? null : reader.GetString(10),
            NgayChinhSua = reader.GetDateTime(11),
            TrangThai = reader.GetByte(12),
            LyDo = reader.IsDBNull(13) ? null : reader.GetString(13)
        };
    }

    private void AddParameters(SqlCommand command, TacPhamChinhSua chinhSua)
    {
        command.Parameters.AddWithValue("@MaTacPham", chinhSua.MaTacPham);
        command.Parameters.AddWithValue("@TenTacPham", chinhSua.TenTacPham);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)chinhSua.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", chinhSua.Gia);
        command.Parameters.AddWithValue("@SoLuong", chinhSua.SoLuong);
        command.Parameters.AddWithValue("@MoTa", (object?)chinhSua.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)chinhSua.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)chinhSua.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)chinhSua.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)chinhSua.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@NgayChinhSua", chinhSua.NgayChinhSua);
        command.Parameters.AddWithValue("@TrangThai", chinhSua.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)chinhSua.LyDo ?? DBNull.Value);
    }
}
