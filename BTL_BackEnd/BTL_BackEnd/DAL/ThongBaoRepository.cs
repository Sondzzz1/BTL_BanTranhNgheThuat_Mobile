using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class ThongBaoRepository : IThongBaoRepository
{
    private readonly string _connectionString;

    public ThongBaoRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<long> Create(ThongBao thongBao)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        return await ThongBaoSql.InsertAsync(connection, null, thongBao);
    }

    public async Task<(List<ThongBao> Items, int Total)> GetByTaiKhoan(int maTaiKhoan, int page, int pageSize)
    {
        const string countSql = "SELECT COUNT(*) FROM ThongBao WHERE MaTaiKhoan=@MaTaiKhoan;";
        const string pageSql = @"
            SELECT MaThongBao,MaTaiKhoan,Loai,TieuDe,NoiDung,LoaiDoiTuong,MaDoiTuong,DuongDan,EventKey,DaDoc,NgayTao,NgayDoc
            FROM ThongBao
            WHERE MaTaiKhoan=@MaTaiKhoan
            ORDER BY NgayTao DESC,MaThongBao DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;";

        var result = new List<ThongBao>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var count = new SqlCommand(countSql, connection);
        count.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync());

        await using var command = new SqlCommand(pageSql, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        command.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
        command.Parameters.AddWithValue("@PageSize", pageSize);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(Map(reader));
        return (result, total);
    }

    public async Task<int> CountUnread(int maTaiKhoan)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(
            "SELECT COUNT(*) FROM ThongBao WHERE MaTaiKhoan=@MaTaiKhoan AND DaDoc=0;", connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<bool> MarkAsRead(long maThongBao, int maTaiKhoan)
    {
        const string sql = @"
            UPDATE ThongBao SET DaDoc=1,NgayDoc=COALESCE(NgayDoc,SYSUTCDATETIME())
            WHERE MaThongBao=@MaThongBao AND MaTaiKhoan=@MaTaiKhoan AND DaDoc=0;";
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaThongBao", maThongBao);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<int> MarkAllAsRead(int maTaiKhoan)
    {
        const string sql = @"
            UPDATE ThongBao SET DaDoc=1,NgayDoc=SYSUTCDATETIME()
            WHERE MaTaiKhoan=@MaTaiKhoan AND DaDoc=0;";
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        return await command.ExecuteNonQueryAsync();
    }

    private static ThongBao Map(SqlDataReader reader) => new()
    {
        MaThongBao = reader.GetInt64(0), MaTaiKhoan = reader.GetInt32(1),
        Loai = reader.GetString(2), TieuDe = reader.GetString(3), NoiDung = reader.GetString(4),
        LoaiDoiTuong = reader.IsDBNull(5) ? null : reader.GetString(5),
        MaDoiTuong = reader.IsDBNull(6) ? null : reader.GetInt32(6),
        DuongDan = reader.IsDBNull(7) ? null : reader.GetString(7),
        EventKey = reader.IsDBNull(8) ? null : reader.GetString(8),
        DaDoc = reader.GetBoolean(9), NgayTao = reader.GetDateTime(10),
        NgayDoc = reader.IsDBNull(11) ? null : reader.GetDateTime(11)
    };
}
