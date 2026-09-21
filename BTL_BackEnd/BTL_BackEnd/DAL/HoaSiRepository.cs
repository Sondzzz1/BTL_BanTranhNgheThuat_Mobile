using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class HoaSiRepository : IHoaSiRepository
{
    private readonly string _connectionString;

    public HoaSiRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<HoaSi>> GetAll()
    {
        var list = new List<HoaSi>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM HoaSi";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToHoaSi(reader));
        }
        return list;
    }

    public async Task<HoaSi?> GetById(int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM HoaSi WHERE MaHoaSi = @MaHoaSi";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToHoaSi(reader);
        }
        return null;
    }

    public async Task<HoaSi?> GetByMaTaiKhoan(int maTaiKhoan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM HoaSi WHERE MaTaiKhoan = @MaTaiKhoan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToHoaSi(reader);
        }
        return null;
    }

    public async Task<int> Create(HoaSi hoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO HoaSi (MaTaiKhoan, TenHoaSi, Email, DienThoai, DiaChi, TieuSu, AnhDaiDien)
                      VALUES (@MaTaiKhoan, @TenHoaSi, @Email, @DienThoai, @DiaChi, @TieuSu, @AnhDaiDien);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", (object?)hoaSi.MaTaiKhoan ?? DBNull.Value);
        command.Parameters.AddWithValue("@TenHoaSi", hoaSi.TenHoaSi);
        command.Parameters.AddWithValue("@Email", (object?)hoaSi.Email ?? DBNull.Value);
        command.Parameters.AddWithValue("@DienThoai", (object?)hoaSi.DienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChi", (object?)hoaSi.DiaChi ?? DBNull.Value);
        command.Parameters.AddWithValue("@TieuSu", (object?)hoaSi.TieuSu ?? DBNull.Value);
        command.Parameters.AddWithValue("@AnhDaiDien", (object?)hoaSi.AnhDaiDien ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(HoaSi hoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE HoaSi 
                      SET TenHoaSi = @TenHoaSi, 
                          Email = @Email,
                          DienThoai = @DienThoai,
                          DiaChi = @DiaChi,
                          TieuSu = @TieuSu, 
                          AnhDaiDien = @AnhDaiDien
                      WHERE MaHoaSi = @MaHoaSi";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", hoaSi.MaHoaSi);
        command.Parameters.AddWithValue("@TenHoaSi", hoaSi.TenHoaSi);
        command.Parameters.AddWithValue("@Email", (object?)hoaSi.Email ?? DBNull.Value);
        command.Parameters.AddWithValue("@DienThoai", (object?)hoaSi.DienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChi", (object?)hoaSi.DiaChi ?? DBNull.Value);
        command.Parameters.AddWithValue("@TieuSu", (object?)hoaSi.TieuSu ?? DBNull.Value);
        command.Parameters.AddWithValue("@AnhDaiDien", (object?)hoaSi.AnhDaiDien ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM HoaSi WHERE MaHoaSi = @MaHoaSi";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    private HoaSi MapToHoaSi(SqlDataReader reader)
    {
        return new HoaSi
        {
            MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            MaTaiKhoan = reader.IsDBNull(reader.GetOrdinal("MaTaiKhoan")) 
                ? null 
                : reader.GetInt32(reader.GetOrdinal("MaTaiKhoan")),
            TenHoaSi = reader.GetString(reader.GetOrdinal("TenHoaSi")),
            Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
            DienThoai = reader.IsDBNull(reader.GetOrdinal("DienThoai")) ? null : reader.GetString(reader.GetOrdinal("DienThoai")),
            DiaChi = reader.IsDBNull(reader.GetOrdinal("DiaChi")) ? null : reader.GetString(reader.GetOrdinal("DiaChi")),
            AnhDaiDien = reader.IsDBNull(reader.GetOrdinal("AnhDaiDien")) ? null : reader.GetString(reader.GetOrdinal("AnhDaiDien")),
            TieuSu = reader.IsDBNull(reader.GetOrdinal("TieuSu")) ? null : reader.GetString(reader.GetOrdinal("TieuSu")),
            ChuyenMon = reader.IsDBNull(reader.GetOrdinal("ChuyenMon")) ? null : reader.GetString(reader.GetOrdinal("ChuyenMon")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            TrangThai = reader.GetBoolean(reader.GetOrdinal("TrangThai"))
        };
    }
}
