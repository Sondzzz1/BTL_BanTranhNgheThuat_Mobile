using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class TaiKhoanRepository : ITaiKhoanRepository
{
    private readonly string _connectionString;

    public TaiKhoanRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<TaiKhoan?> GetByTenDangNhap(string tenDangNhap)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenDangNhap", tenDangNhap);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new TaiKhoan
            {
                MaTaiKhoan = reader.GetInt32(reader.GetOrdinal("MaTaiKhoan")),
                TenDangNhap = reader.GetString(reader.GetOrdinal("TenDangNhap")),
                MatKhau = reader.GetString(reader.GetOrdinal("MatKhau")),
                VaiTro = reader.GetByte(reader.GetOrdinal("VaiTro")),
                TrangThai = reader.GetBoolean(reader.GetOrdinal("TrangThai"))
            };
        }
        return null;
    }

    public async Task<TaiKhoan?> GetById(int maTaiKhoan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TaiKhoan WHERE MaTaiKhoan = @MaTaiKhoan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new TaiKhoan
            {
                MaTaiKhoan = reader.GetInt32(reader.GetOrdinal("MaTaiKhoan")),
                TenDangNhap = reader.GetString(reader.GetOrdinal("TenDangNhap")),
                MatKhau = reader.GetString(reader.GetOrdinal("MatKhau")),
                VaiTro = reader.GetByte(reader.GetOrdinal("VaiTro")),
                TrangThai = reader.GetBoolean(reader.GetOrdinal("TrangThai"))
            };
        }
        return null;
    }

    public async Task<int> Create(TaiKhoan taiKhoan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, TrangThai) 
                      VALUES (@TenDangNhap, @MatKhau, @VaiTro, @TrangThai);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenDangNhap", taiKhoan.TenDangNhap);
        command.Parameters.AddWithValue("@MatKhau", taiKhoan.MatKhau);
        command.Parameters.AddWithValue("@VaiTro", taiKhoan.VaiTro);
        command.Parameters.AddWithValue("@TrangThai", taiKhoan.TrangThai);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(TaiKhoan taiKhoan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE TaiKhoan 
                      SET TenDangNhap = @TenDangNhap, 
                          MatKhau = @MatKhau, 
                          VaiTro = @VaiTro, 
                          TrangThai = @TrangThai
                      WHERE MaTaiKhoan = @MaTaiKhoan";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", taiKhoan.MaTaiKhoan);
        command.Parameters.AddWithValue("@TenDangNhap", taiKhoan.TenDangNhap);
        command.Parameters.AddWithValue("@MatKhau", taiKhoan.MatKhau);
        command.Parameters.AddWithValue("@VaiTro", taiKhoan.VaiTro);
        command.Parameters.AddWithValue("@TrangThai", taiKhoan.TrangThai);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> CheckTenDangNhapExists(string tenDangNhap)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT COUNT(1) FROM TaiKhoan WHERE TenDangNhap = @TenDangNhap";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TenDangNhap", tenDangNhap);

        var count = (int)(await command.ExecuteScalarAsync() ?? 0);
        return count > 0;
    }
}
