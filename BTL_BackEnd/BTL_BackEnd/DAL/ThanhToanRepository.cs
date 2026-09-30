using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class ThanhToanRepository : IThanhToanRepository
{
    private readonly string _connectionString;

    public ThanhToanRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<ThanhToan?> GetByDonHang(int maDonHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ThanhToan WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToThanhToan(reader);
        }
        return null;
    }

    public async Task<ThanhToan?> GetById(int maThanhToan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ThanhToan WHERE MaThanhToan = @MaThanhToan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaThanhToan", maThanhToan);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToThanhToan(reader);
        }
        return null;
    }

    public async Task<List<ThanhToan>> GetAll()
    {
        var result = new List<ThanhToan>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string query = "SELECT * FROM ThanhToan ORDER BY MaThanhToan DESC";
        await using var command = new SqlCommand(query, connection);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapToThanhToan(reader));
        return result;
    }

    public async Task<int> Create(ThanhToan thanhToan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ThanhToan (MaDonHang, PhuongThuc, TrangThai, NgayThanhToan, MaGiaoDich)
                      VALUES (@MaDonHang, @PhuongThuc, @TrangThai, @NgayThanhToan, @MaGiaoDich);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", thanhToan.MaDonHang);
        command.Parameters.AddWithValue("@PhuongThuc", thanhToan.PhuongThuc);
        command.Parameters.AddWithValue("@TrangThai", thanhToan.TrangThai);
        command.Parameters.AddWithValue("@NgayThanhToan", (object?)thanhToan.NgayThanhToan ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaGiaoDich", (object?)thanhToan.MaGiaoDich ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(ThanhToan thanhToan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE ThanhToan 
                      SET TrangThai = @TrangThai, 
                          NgayThanhToan = @NgayThanhToan, 
                          MaGiaoDich = @MaGiaoDich
                      WHERE MaThanhToan = @MaThanhToan";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaThanhToan", thanhToan.MaThanhToan);
        command.Parameters.AddWithValue("@TrangThai", thanhToan.TrangThai);
        command.Parameters.AddWithValue("@NgayThanhToan", (object?)thanhToan.NgayThanhToan ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaGiaoDich", (object?)thanhToan.MaGiaoDich ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> ConfirmBankTransfer(int maThanhToan, int maTaiKhoan, string? maGiaoDich)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string query = @"
            UPDATE ThanhToan
            SET TrangThai='DaThanhToan',NgayThanhToan=GETDATE(),NguoiXacNhan=@NguoiXacNhan,
                MaGiaoDich=COALESCE(@MaGiaoDich,MaGiaoDich)
            WHERE MaThanhToan=@MaThanhToan AND PhuongThuc='BankTransfer' AND TrangThai='ChoThanhToan';";
        await using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaThanhToan", maThanhToan);
        command.Parameters.AddWithValue("@NguoiXacNhan", maTaiKhoan);
        command.Parameters.AddWithValue("@MaGiaoDich", (object?)maGiaoDich ?? DBNull.Value);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    private ThanhToan MapToThanhToan(SqlDataReader reader)
    {
        return new ThanhToan
        {
            MaThanhToan = reader.GetInt32(reader.GetOrdinal("MaThanhToan")),
            MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
            PhuongThuc = reader.GetString(reader.GetOrdinal("PhuongThuc")),
            TrangThai = reader.GetString(reader.GetOrdinal("TrangThai")),
            NgayThanhToan = reader.IsDBNull(reader.GetOrdinal("NgayThanhToan")) 
                ? null 
                : reader.GetDateTime(reader.GetOrdinal("NgayThanhToan")),
            MaGiaoDich = reader.IsDBNull(reader.GetOrdinal("MaGiaoDich")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("MaGiaoDich")),
            NguoiXacNhan = HasColumn(reader, "NguoiXacNhan") && !reader.IsDBNull(reader.GetOrdinal("NguoiXacNhan"))
                ? reader.GetInt32(reader.GetOrdinal("NguoiXacNhan"))
                : null
        };
    }

    private static bool HasColumn(SqlDataReader reader, string name)
    {
        for (var index = 0; index < reader.FieldCount; index++)
            if (reader.GetName(index).Equals(name, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
