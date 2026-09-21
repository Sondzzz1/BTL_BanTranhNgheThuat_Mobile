using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class DanhMucRepository : IDanhMucRepository
{
    private readonly string _connectionString;

    public DanhMucRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<DanhMuc>> GetAll()
    {
        var list = new List<DanhMuc>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DanhMuc";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new DanhMuc
            {
                MaDanhMuc = reader.GetInt32(reader.GetOrdinal("MaDanhMuc")),
                TenDanhMuc = reader.GetString(reader.GetOrdinal("TenDanhMuc")),
                MoTa = reader.IsDBNull(reader.GetOrdinal("MoTa")) 
                    ? null 
                    : reader.GetString(reader.GetOrdinal("MoTa"))
            });
        }
        return list;
    }

    public async Task<DanhMuc?> GetById(int maDanhMuc)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DanhMuc WHERE MaDanhMuc = @MaDanhMuc";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new DanhMuc
            {
                MaDanhMuc = reader.GetInt32(reader.GetOrdinal("MaDanhMuc")),
                TenDanhMuc = reader.GetString(reader.GetOrdinal("TenDanhMuc")),
                MoTa = reader.IsDBNull(reader.GetOrdinal("MoTa")) 
                    ? null 
                    : reader.GetString(reader.GetOrdinal("MoTa"))
            };
        }
        return null;
    }

    public async Task<int> Create(DanhMuc danhMuc)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO DanhMuc (TenDanhMuc, MoTa)
                      VALUES (@TenDanhMuc, @MoTa);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenDanhMuc", danhMuc.TenDanhMuc);
        command.Parameters.AddWithValue("@MoTa", (object?)danhMuc.MoTa ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(DanhMuc danhMuc)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE DanhMuc 
                      SET TenDanhMuc = @TenDanhMuc, 
                          MoTa = @MoTa
                      WHERE MaDanhMuc = @MaDanhMuc";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDanhMuc", danhMuc.MaDanhMuc);
        command.Parameters.AddWithValue("@TenDanhMuc", danhMuc.TenDanhMuc);
        command.Parameters.AddWithValue("@MoTa", (object?)danhMuc.MoTa ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int maDanhMuc)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM DanhMuc WHERE MaDanhMuc = @MaDanhMuc";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }
}
