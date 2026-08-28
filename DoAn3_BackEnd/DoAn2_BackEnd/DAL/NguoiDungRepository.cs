using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class NguoiDungRepository : INguoiDungRepository
{
    private readonly string _connectionString;

    public NguoiDungRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<NguoiDung>> GetAll()
    {
        var list = new List<NguoiDung>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NguoiDung";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToNguoiDung(reader));
        }
        return list;
    }

    public async Task<NguoiDung?> GetById(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NguoiDung WHERE MaNguoiDung = @MaNguoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToNguoiDung(reader);
        }
        return null;
    }

    public async Task<NguoiDung?> GetByMaTaiKhoan(int maTaiKhoan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NguoiDung WHERE MaTaiKhoan = @MaTaiKhoan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToNguoiDung(reader);
        }
        return null;
    }

    public async Task<int> Create(NguoiDung nguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO NguoiDung (MaTaiKhoan, Ten, DiaChi, DienThoai, Email)
                      VALUES (@MaTaiKhoan, @Ten, @DiaChi, @DienThoai, @Email);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", (object?)nguoiDung.MaTaiKhoan ?? DBNull.Value);
        command.Parameters.AddWithValue("@Ten", nguoiDung.Ten);
        command.Parameters.AddWithValue("@DiaChi", (object?)nguoiDung.DiaChi ?? DBNull.Value);
        command.Parameters.AddWithValue("@DienThoai", (object?)nguoiDung.DienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@Email", (object?)nguoiDung.Email ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(NguoiDung nguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE NguoiDung 
                      SET Ten = @Ten, 
                          DiaChi = @DiaChi, 
                          DienThoai = @DienThoai, 
                          Email = @Email
                      WHERE MaNguoiDung = @MaNguoiDung";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", nguoiDung.MaNguoiDung);
        command.Parameters.AddWithValue("@Ten", nguoiDung.Ten);
        command.Parameters.AddWithValue("@DiaChi", (object?)nguoiDung.DiaChi ?? DBNull.Value);
        command.Parameters.AddWithValue("@DienThoai", (object?)nguoiDung.DienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@Email", (object?)nguoiDung.Email ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM NguoiDung WHERE MaNguoiDung = @MaNguoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    private NguoiDung MapToNguoiDung(SqlDataReader reader)
    {
        return new NguoiDung
        {
            MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung")),
            MaTaiKhoan = reader.IsDBNull(reader.GetOrdinal("MaTaiKhoan")) 
                ? null 
                : reader.GetInt32(reader.GetOrdinal("MaTaiKhoan")),
            Ten = reader.GetString(reader.GetOrdinal("Ten")),
            DiaChi = reader.IsDBNull(reader.GetOrdinal("DiaChi")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("DiaChi")),
            DienThoai = reader.IsDBNull(reader.GetOrdinal("DienThoai")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("DienThoai")),
            Email = reader.IsDBNull(reader.GetOrdinal("Email")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("Email"))
        };
    }
}
