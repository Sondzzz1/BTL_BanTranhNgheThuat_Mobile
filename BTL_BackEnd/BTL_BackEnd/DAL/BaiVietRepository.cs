using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class BaiVietRepository : IBaiVietRepository
{
    private readonly string _connectionString;

    public BaiVietRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<BaiViet>> GetAll()
    {
        var list = new List<BaiViet>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM BaiViet ORDER BY NgayDang DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToBaiViet(reader));
        }
        return list;
    }

    public async Task<List<BaiViet>> GetByHoaSi(int maHoaSi)
    {
        var list = new List<BaiViet>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM BaiViet WHERE MaHoaSi = @MaHoaSi ORDER BY NgayDang DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToBaiViet(reader));
        }
        return list;
    }

    public async Task<BaiViet?> GetById(int maBaiViet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM BaiViet WHERE MaBaiViet = @MaBaiViet";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaBaiViet", maBaiViet);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToBaiViet(reader);
        }
        return null;
    }

    public async Task<int> Create(BaiViet baiViet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO BaiViet (TieuDe, NoiDung, MaHoaSi, NgayDang, TrangThai, LyDo, AnhTieuDe)
                      VALUES (@TieuDe, @NoiDung, @MaHoaSi, @NgayDang, @TrangThai, @LyDo, @AnhTieuDe);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TieuDe", baiViet.TieuDe);
        command.Parameters.AddWithValue("@NoiDung", (object?)baiViet.NoiDung ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaHoaSi", baiViet.MaHoaSi);
        command.Parameters.AddWithValue("@NgayDang", baiViet.NgayDang);
        command.Parameters.AddWithValue("@TrangThai", baiViet.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)baiViet.LyDo ?? DBNull.Value);
        command.Parameters.AddWithValue("@AnhTieuDe", (object?)baiViet.AnhTieuDe ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(BaiViet baiViet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE BaiViet 
                      SET TieuDe = @TieuDe, 
                          NoiDung = @NoiDung,
                          TrangThai = @TrangThai,
                          LyDo = @LyDo,
                          AnhTieuDe = @AnhTieuDe
                      WHERE MaBaiViet = @MaBaiViet";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaBaiViet", baiViet.MaBaiViet);
        command.Parameters.AddWithValue("@TieuDe", baiViet.TieuDe);
        command.Parameters.AddWithValue("@NoiDung", (object?)baiViet.NoiDung ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", baiViet.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)baiViet.LyDo ?? DBNull.Value);
        command.Parameters.AddWithValue("@AnhTieuDe", (object?)baiViet.AnhTieuDe ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> Delete(int maBaiViet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM BaiViet WHERE MaBaiViet = @MaBaiViet";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaBaiViet", maBaiViet);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    private BaiViet MapToBaiViet(SqlDataReader reader)
    {
        return new BaiViet
        {
            MaBaiViet = reader.GetInt32(reader.GetOrdinal("MaBaiViet")),
            TieuDe = reader.GetString(reader.GetOrdinal("TieuDe")),
            NoiDung = reader.IsDBNull(reader.GetOrdinal("NoiDung")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("NoiDung")),
            MaHoaSi = reader.IsDBNull(reader.GetOrdinal("MaHoaSi")) ? 0 : reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            NgayDang = reader.IsDBNull(reader.GetOrdinal("NgayDang")) ? DateTime.Now : reader.GetDateTime(reader.GetOrdinal("NgayDang")),
            TrangThai = reader.IsDBNull(reader.GetOrdinal("TrangThai")) ? (byte)0 : Convert.ToByte(reader["TrangThai"]),
            // Kiểm tra cột LyDo có tồn tại trong DB không trước khi đọc
            LyDo = HasColumn(reader, "LyDo") && !reader.IsDBNull(reader.GetOrdinal("LyDo"))
                ? reader.GetString(reader.GetOrdinal("LyDo"))
                : null,
            AnhTieuDe = HasColumn(reader, "AnhTieuDe") && !reader.IsDBNull(reader.GetOrdinal("AnhTieuDe"))
                ? reader.GetString(reader.GetOrdinal("AnhTieuDe"))
                : null
        };
    }

    // Helper: kiểm tra cột có tồn tại trong kết quả truy vấn không
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
