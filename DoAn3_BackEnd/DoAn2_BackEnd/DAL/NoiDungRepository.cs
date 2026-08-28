using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class NoiDungRepository : INoiDungRepository
{
    private readonly string _connectionString;

    public NoiDungRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<NoiDung>> GetAll(string? loai = null)
    {
        var list = new List<NoiDung>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NoiDung";
        if (!string.IsNullOrEmpty(loai))
        {
            query += " WHERE Loai = @Loai";
        }

        using var command = new SqlCommand(query, connection);
        if (!string.IsNullOrEmpty(loai))
        {
            command.Parameters.AddWithValue("@Loai", loai);
        }

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapReaderToNoiDung(reader));
        }
        return list;
    }

    public async Task<NoiDung?> GetById(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NoiDung WHERE MaNoiDung = @MaNoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNoiDung", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapReaderToNoiDung(reader);
        }
        return null;
    }

    public async Task<List<NoiDung>> GetByTacPham(int maTacPham)
    {
        var list = new List<NoiDung>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM NoiDung WHERE MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapReaderToNoiDung(reader));
        }
        return list;
    }

    public async Task<int> Create(NoiDung noiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO NoiDung (MaTacPham, TieuDe, NoiDung, Loai, NgayCapNhat, TrangThai)
                      VALUES (@MaTacPham, @TieuDe, @NoiDung, @Loai, @NgayCapNhat, @TrangThai);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", noiDung.MaTacPham);
        command.Parameters.AddWithValue("@TieuDe", noiDung.TieuDe);
        command.Parameters.AddWithValue("@NoiDung", (object?)noiDung.NoiDungText ?? DBNull.Value);
        command.Parameters.AddWithValue("@Loai", noiDung.Loai);
        command.Parameters.AddWithValue("@NgayCapNhat", noiDung.NgayCapNhat);
        command.Parameters.AddWithValue("@TrangThai", noiDung.TrangThai);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(NoiDung noiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE NoiDung 
                      SET MaTacPham = @MaTacPham,
                          TieuDe = @TieuDe, 
                          NoiDung = @NoiDung,
                          Loai = @Loai,
                          NgayCapNhat = @NgayCapNhat,
                          TrangThai = @TrangThai
                      WHERE MaNoiDung = @MaNoiDung";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNoiDung", noiDung.MaNoiDung);
        command.Parameters.AddWithValue("@MaTacPham", noiDung.MaTacPham);
        command.Parameters.AddWithValue("@TieuDe", noiDung.TieuDe);
        command.Parameters.AddWithValue("@NoiDung", (object?)noiDung.NoiDungText ?? DBNull.Value);
        command.Parameters.AddWithValue("@Loai", noiDung.Loai);
        command.Parameters.AddWithValue("@NgayCapNhat", noiDung.NgayCapNhat);
        command.Parameters.AddWithValue("@TrangThai", noiDung.TrangThai);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM NoiDung WHERE MaNoiDung = @MaNoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNoiDung", id);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    private NoiDung MapReaderToNoiDung(SqlDataReader reader)
    {
        return new NoiDung
        {
            MaNoiDung = reader.GetInt32(reader.GetOrdinal("MaNoiDung")),
            MaTacPham = reader.IsDBNull(reader.GetOrdinal("MaTacPham")) ? 0 : reader.GetInt32(reader.GetOrdinal("MaTacPham")),
            TieuDe = reader.GetString(reader.GetOrdinal("TieuDe")),
            NoiDungText = reader.IsDBNull(reader.GetOrdinal("NoiDung")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("NoiDung")),
            Loai = reader.IsDBNull(reader.GetOrdinal("Loai")) ? "MoTa" : reader.GetString(reader.GetOrdinal("Loai")),
            NgayCapNhat = reader.IsDBNull(reader.GetOrdinal("NgayCapNhat")) ? DateTime.Now : reader.GetDateTime(reader.GetOrdinal("NgayCapNhat")),
            TrangThai = reader.IsDBNull(reader.GetOrdinal("TrangThai")) ? false : Convert.ToBoolean(reader["TrangThai"])
        };
    }
}
