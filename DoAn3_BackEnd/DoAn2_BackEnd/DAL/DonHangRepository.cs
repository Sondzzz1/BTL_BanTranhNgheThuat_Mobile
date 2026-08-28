using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class DonHangRepository : IDonHangRepository
{
    private readonly string _connectionString;

    public DonHangRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<DonHang>> GetAll()
    {
        var list = new List<DonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang ORDER BY NgayDat DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToDonHang(reader));
        }
        return list;
    }

    public async Task<DonHang?> GetById(int maDonHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToDonHang(reader);
        }
        return null;
    }

    public async Task<List<DonHang>> GetByNguoiDung(int maNguoiDung)
    {
        var list = new List<DonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM DonHang WHERE MaNguoiDung = @MaNguoiDung ORDER BY NgayDat DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToDonHang(reader));
        }
        return list;
    }

    public async Task<int> Create(DonHang donHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO DonHang (MaNguoiDung, NgayDat, TongTien, TenNguoiNhan, SoDienThoai, DiaChiGiao, TrangThai, LyDoHuy)
                      VALUES (@MaNguoiDung, @NgayDat, @TongTien, @TenNguoiNhan, @SoDienThoai, @DiaChiGiao, @TrangThai, @LyDoHuy);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", donHang.MaNguoiDung);
        command.Parameters.AddWithValue("@NgayDat", donHang.NgayDat);
        command.Parameters.AddWithValue("@TongTien", donHang.TongTien);
        command.Parameters.AddWithValue("@TenNguoiNhan", (object?)donHang.TenNguoiNhan ?? DBNull.Value);
        command.Parameters.AddWithValue("@SoDienThoai", (object?)donHang.SoDienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChiGiao", (object?)donHang.DiaChiGiao ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", donHang.TrangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)donHang.LyDoHuy ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> Update(DonHang donHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE DonHang 
                      SET TongTien = @TongTien, 
                          TenNguoiNhan = @TenNguoiNhan, 
                          SoDienThoai = @SoDienThoai, 
                          DiaChiGiao = @DiaChiGiao, 
                          TrangThai = @TrangThai,
                          LyDoHuy = @LyDoHuy
                      WHERE MaDonHang = @MaDonHang";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", donHang.MaDonHang);
        command.Parameters.AddWithValue("@TongTien", donHang.TongTien);
        command.Parameters.AddWithValue("@TenNguoiNhan", (object?)donHang.TenNguoiNhan ?? DBNull.Value);
        command.Parameters.AddWithValue("@SoDienThoai", (object?)donHang.SoDienThoai ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaChiGiao", (object?)donHang.DiaChiGiao ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", donHang.TrangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)donHang.LyDoHuy ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateTrangThai(int maDonHang, byte trangThai, string? lyDoHuy = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "UPDATE DonHang SET TrangThai = @TrangThai, LyDoHuy = @LyDoHuy WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@TrangThai", trangThai);
        command.Parameters.AddWithValue("@LyDoHuy", (object?)lyDoHuy ?? DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<List<ChiTietDonHang>> GetChiTiet(int maDonHang)
    {
        var list = new List<ChiTietDonHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietDonHang WHERE MaDonHang = @MaDonHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietDonHang
            {
                MaChiTietDH = reader.GetInt32(reader.GetOrdinal("MaChiTietDH")),
                MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong")),
                DonGia = reader.GetDecimal(reader.GetOrdinal("DonGia"))
            });
        }
        return list;
    }

    public async Task<int> CreateChiTiet(ChiTietDonHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ChiTietDonHang (MaDonHang, MaTacPham, SoLuong, DonGia)
                      VALUES (@MaDonHang, @MaTacPham, @SoLuong, @DonGia);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", chiTiet.MaDonHang);
        command.Parameters.AddWithValue("@MaTacPham", chiTiet.MaTacPham);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);
        command.Parameters.AddWithValue("@DonGia", chiTiet.DonGia);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    private DonHang MapToDonHang(SqlDataReader reader)
    {
        return new DonHang
        {
            MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
            MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung")),
            NgayDat = reader.GetDateTime(reader.GetOrdinal("NgayDat")),
            TongTien = reader.GetDecimal(reader.GetOrdinal("TongTien")),
            TenNguoiNhan = reader.IsDBNull(reader.GetOrdinal("TenNguoiNhan")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("TenNguoiNhan")),
            SoDienThoai = reader.IsDBNull(reader.GetOrdinal("SoDienThoai")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("SoDienThoai")),
            DiaChiGiao = reader.IsDBNull(reader.GetOrdinal("DiaChiGiao")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("DiaChiGiao")),
            TrangThai = reader.GetByte(reader.GetOrdinal("TrangThai")),
            LyDoHuy = reader.IsDBNull(reader.GetOrdinal("LyDoHuy")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("LyDoHuy"))
        };
    }
}
