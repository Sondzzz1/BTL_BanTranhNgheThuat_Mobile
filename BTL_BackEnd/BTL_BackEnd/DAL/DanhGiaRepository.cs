using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class DanhGiaRepository : IDanhGiaRepository
{
    private readonly string _connectionString;
    private const string SelectReview = @"
        SELECT d.MaDanhGia,d.MaTacPham,d.MaNguoiDung,d.SoSao,d.NoiDung,d.HinhAnhDanhGia,d.NgayTao,
               n.Ten AS TenNguoiDung,t.TenTacPham,t.HinhAnh AS HinhAnhTacPham
        FROM DanhGia d
        INNER JOIN NguoiDung n ON n.MaNguoiDung=d.MaNguoiDung
        INNER JOIN TacPham t ON t.MaTacPham=d.MaTacPham";

    public DanhGiaRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public Task<List<DanhGiaResponse>> GetByArtwork(int maTacPham) => Query(
        SelectReview + " WHERE d.MaTacPham=@MaTacPham ORDER BY d.NgayTao DESC,d.MaDanhGia DESC",
        command => command.Parameters.AddWithValue("@MaTacPham", maTacPham));

    public Task<List<DanhGiaResponse>> GetFiveStars() => Query(
        SelectReview + " WHERE d.SoSao=5 ORDER BY d.NgayTao DESC,d.MaDanhGia DESC",
        _ => { });

    public async Task<TongHopDanhGiaResponse> GetSummary(int maTacPham)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            SELECT COUNT_BIG(*) AS TongSoDanhGia,
                   ISNULL(AVG(CAST(SoSao AS DECIMAL(10,2))),0) AS DiemTrungBinh,
                   ISNULL(SUM(CASE WHEN SoSao=1 THEN 1 ELSE 0 END),0) AS Sao1,
                   ISNULL(SUM(CASE WHEN SoSao=2 THEN 1 ELSE 0 END),0) AS Sao2,
                   ISNULL(SUM(CASE WHEN SoSao=3 THEN 1 ELSE 0 END),0) AS Sao3,
                   ISNULL(SUM(CASE WHEN SoSao=4 THEN 1 ELSE 0 END),0) AS Sao4,
                   ISNULL(SUM(CASE WHEN SoSao=5 THEN 1 ELSE 0 END),0) AS Sao5
            FROM DanhGia WHERE MaTacPham=@MaTacPham;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        await using var reader = await command.ExecuteReaderAsync();
        await reader.ReadAsync();
        return new TongHopDanhGiaResponse
        {
            MaTacPham = maTacPham,
            TongSoDanhGia = Convert.ToInt32(reader["TongSoDanhGia"]),
            DiemTrungBinh = Convert.ToDecimal(reader["DiemTrungBinh"]),
            SoLuong1Sao = Convert.ToInt32(reader["Sao1"]),
            SoLuong2Sao = Convert.ToInt32(reader["Sao2"]),
            SoLuong3Sao = Convert.ToInt32(reader["Sao3"]),
            SoLuong4Sao = Convert.ToInt32(reader["Sao4"]),
            SoLuong5Sao = Convert.ToInt32(reader["Sao5"])
        };
    }

    public Task<DanhGiaResponse?> GetById(int maDanhGia) => QueryOne(
        SelectReview + " WHERE d.MaDanhGia=@MaDanhGia",
        command => command.Parameters.AddWithValue("@MaDanhGia", maDanhGia));

    public Task<DanhGiaResponse?> GetByUserAndArtwork(int maNguoiDung, int maTacPham) => QueryOne(
        SelectReview + " WHERE d.MaNguoiDung=@MaNguoiDung AND d.MaTacPham=@MaTacPham",
        command =>
        {
            command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        });

    public async Task<bool> CanCreate(int maNguoiDung, int maTacPham)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        return await HasEligibleOrderLine(connection, null, maNguoiDung, maTacPham);
    }

    public async Task<int> Create(int maNguoiDung, TaoDanhGiaRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            if (!await HasEligibleOrderLine(connection, transaction, maNguoiDung, request.MaTacPham))
                throw new UnauthorizedAccessException("Bạn chỉ có thể đánh giá tác phẩm đã nhận và chưa hoàn trả toàn bộ");

            const string existsSql = @"
                SELECT COUNT_BIG(*) FROM DanhGia WITH (UPDLOCK,HOLDLOCK)
                WHERE MaNguoiDung=@MaNguoiDung AND MaTacPham=@MaTacPham;";
            await using var exists = new SqlCommand(existsSql, connection, transaction);
            exists.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            exists.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            if (Convert.ToInt64(await exists.ExecuteScalarAsync()) > 0)
                throw new BusinessConflictException("Bạn đã đánh giá tác phẩm này");

            const string insertSql = @"
                INSERT INTO DanhGia(MaTacPham,MaNguoiDung,SoSao,NoiDung,HinhAnhDanhGia,NgayTao)
                OUTPUT INSERTED.MaDanhGia
                VALUES(@MaTacPham,@MaNguoiDung,@SoSao,@NoiDung,NULL,GETDATE());";
            await using var insert = new SqlCommand(insertSql, connection, transaction);
            insert.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            insert.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            insert.Parameters.AddWithValue("@SoSao", request.DanhGia);
            insert.Parameters.AddWithValue("@NoiDung", (object?)request.BinhLuan ?? DBNull.Value);
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());
            await transaction.CommitAsync();
            return id;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            await transaction.RollbackAsync();
            throw new BusinessConflictException("Bạn đã đánh giá tác phẩm này");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> Update(int maDanhGia, int maNguoiDung, CapNhatDanhGiaRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE DanhGia SET SoSao=@SoSao,NoiDung=@NoiDung
            WHERE MaDanhGia=@MaDanhGia AND MaNguoiDung=@MaNguoiDung;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@SoSao", request.DanhGia);
        command.Parameters.AddWithValue("@NoiDung", (object?)request.BinhLuan ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaDanhGia", maDanhGia);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> Delete(int maDanhGia, int maNguoiDung)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = "DELETE FROM DanhGia WHERE MaDanhGia=@MaDanhGia AND MaNguoiDung=@MaNguoiDung;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaDanhGia", maDanhGia);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    private static async Task<bool> HasEligibleOrderLine(
        SqlConnection connection,
        SqlTransaction? transaction,
        int maNguoiDung,
        int maTacPham)
    {
        const string sql = @"
            SELECT CASE WHEN EXISTS
            (
                SELECT 1
                FROM DonHang dh WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN ChiTietDonHang ct WITH (UPDLOCK,HOLDLOCK) ON ct.MaDonHang=dh.MaDonHang
                WHERE dh.MaNguoiDung=@MaNguoiDung AND dh.TrangThai=3
                  AND ct.MaTacPham=@MaTacPham
                  AND ct.SoLuong-ISNULL(ct.SoLuongDaHoan,0)>0
            ) THEN 1 ELSE 0 END;";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) == 1;
    }

    private async Task<List<DanhGiaResponse>> Query(string sql, Action<SqlCommand> configure)
    {
        var result = new List<DanhGiaResponse>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        configure(command);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(Map(reader));
        return result;
    }

    private async Task<DanhGiaResponse?> QueryOne(string sql, Action<SqlCommand> configure)
    {
        var result = await Query(sql, configure);
        return result.FirstOrDefault();
    }

    private static DanhGiaResponse Map(SqlDataReader reader) => new()
    {
        MaDanhGia = reader.GetInt32(reader.GetOrdinal("MaDanhGia")),
        MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
        TenTacPham = reader.GetString(reader.GetOrdinal("TenTacPham")),
        HinhAnhTacPham = reader.IsDBNull(reader.GetOrdinal("HinhAnhTacPham")) ? null : reader.GetString(reader.GetOrdinal("HinhAnhTacPham")),
        MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung")),
        TenNguoiDung = reader.GetString(reader.GetOrdinal("TenNguoiDung")),
        DanhGia = reader.GetInt32(reader.GetOrdinal("SoSao")),
        BinhLuan = reader.IsDBNull(reader.GetOrdinal("NoiDung")) ? null : reader.GetString(reader.GetOrdinal("NoiDung")),
        HinhAnhDanhGia = reader.IsDBNull(reader.GetOrdinal("HinhAnhDanhGia")) ? null : reader.GetString(reader.GetOrdinal("HinhAnhDanhGia")),
        NgayDanhGia = reader.GetDateTime(reader.GetOrdinal("NgayTao"))
    };
}
