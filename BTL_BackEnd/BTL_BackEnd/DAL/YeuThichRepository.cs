using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using System.Data;

namespace DoAn2_BackEnd.DAL;

public class YeuThichRepository : IYeuThichRepository
{
    private readonly string _connectionString;

    public YeuThichRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<YeuThich>> GetByNguoiDung(int maNguoiDung)
    {
        var result = new List<YeuThich>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT MaYeuThich, MaNguoiDung, MaTacPham, NgayThem, GhiChu
            FROM YeuThich
            WHERE MaNguoiDung = @MaNguoiDung
            ORDER BY NgayThem DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new YeuThich
            {
                MaYeuThich = reader.GetInt32(0),
                MaNguoiDung = reader.GetInt32(1),
                MaTacPham = reader.GetInt32(2),
                NgayThem = reader.GetDateTime(3),
                GhiChu = reader.IsDBNull(4) ? null : reader.GetString(4)
            });
        }

        return result;
    }

    public async Task<YeuThich?> GetByNguoiDungAndTacPham(int maNguoiDung, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT MaYeuThich, MaNguoiDung, MaTacPham, NgayThem, GhiChu
            FROM YeuThich
            WHERE MaNguoiDung = @MaNguoiDung AND MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new YeuThich
            {
                MaYeuThich = reader.GetInt32(0),
                MaNguoiDung = reader.GetInt32(1),
                MaTacPham = reader.GetInt32(2),
                NgayThem = reader.GetDateTime(3),
                GhiChu = reader.IsDBNull(4) ? null : reader.GetString(4)
            };
        }

        return null;
    }

    public async Task<bool> Exists(int maNguoiDung, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT COUNT(1)
            FROM YeuThich
            WHERE MaNguoiDung = @MaNguoiDung AND MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var count = (int)(await command.ExecuteScalarAsync() ?? 0);
        return count > 0;
    }

    public async Task<YeuThich> Add(YeuThich yeuThich)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT INTO YeuThich (MaNguoiDung, MaTacPham, NgayThem, GhiChu)
            VALUES (@MaNguoiDung, @MaTacPham, @NgayThem, @GhiChu);
            SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", yeuThich.MaNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", yeuThich.MaTacPham);
        command.Parameters.AddWithValue("@NgayThem", yeuThich.NgayThem);
        command.Parameters.AddWithValue("@GhiChu", (object?)yeuThich.GhiChu ?? DBNull.Value);

        var id = (int)(await command.ExecuteScalarAsync() ?? 0);
        yeuThich.MaYeuThich = id;

        return yeuThich;
    }

    public async Task<bool> Delete(int maNguoiDung, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            DELETE FROM YeuThich
            WHERE MaNguoiDung = @MaNguoiDung AND MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<int> CountByTacPham(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT COUNT(*)
            FROM YeuThich
            WHERE MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        return (int)(await command.ExecuteScalarAsync() ?? 0);
    }
}
