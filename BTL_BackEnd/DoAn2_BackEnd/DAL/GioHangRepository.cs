using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class GioHangRepository : IGioHangRepository
{
    private readonly string _connectionString;

    public GioHangRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<GioHang?> GetByNguoiDung(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM GioHang WHERE MaNguoiDung = @MaNguoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new GioHang
            {
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung"))
            };
        }
        return null;
    }

    public async Task<int> CreateGioHang(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO GioHang (MaNguoiDung) VALUES (@MaNguoiDung);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<ChiTietGioHang>> GetChiTiet(int maGioHang)
    {
        var list = new List<ChiTietGioHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            });
        }
        return list;
    }

    public async Task<ChiTietGioHang?> GetChiTietByTacPham(int maGioHang, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang AND MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            };
        }
        return null;
    }

    public async Task<ChiTietGioHang?> GetChiTietById(int maChiTietGH)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaChiTietGH = @MaChiTietGH";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", maChiTietGH);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            };
        }
        return null;
    }

    public async Task<int> AddChiTiet(ChiTietGioHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ChiTietGioHang (MaGioHang, MaTacPham, SoLuong)
                      VALUES (@MaGioHang, @MaTacPham, @SoLuong);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", chiTiet.MaGioHang);
        command.Parameters.AddWithValue("@MaTacPham", chiTiet.MaTacPham);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateChiTiet(ChiTietGioHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE ChiTietGioHang 
                      SET SoLuong = @SoLuong 
                      WHERE MaChiTietGH = @MaChiTietGH";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", chiTiet.MaChiTietGH);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteChiTiet(int maChiTietGH)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM ChiTietGioHang WHERE MaChiTietGH = @MaChiTietGH";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", maChiTietGH);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> ClearGioHang(int maGioHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }
}
