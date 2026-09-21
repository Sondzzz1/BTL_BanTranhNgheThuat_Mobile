using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class ConsultationRepository : IConsultationRepository
{
    private readonly string _connectionString;

    public ConsultationRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<ConsultationBooking> CreateBooking(int maKhachHang, TaoLichTuVanRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO LichTuVan (MaKhachHang, MaHoaSi, MaNhanVien, Ngay, Gio, DiaChi, NhuCau, GhiChu, TrangThai, KetQuaTuVan, NgayTao)
            OUTPUT INSERTED.MaLichTuVan
            VALUES (@MaKhachHang, NULL, NULL, @Ngay, @Gio, @DiaChi, @NhuCau, @GhiChu, @TrangThai, @KetQuaTuVan, GETDATE());";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@Ngay", request.Ngay);
        command.Parameters.AddWithValue("@Gio", request.Gio);
        command.Parameters.AddWithValue("@DiaChi", request.DiaChi);
        command.Parameters.AddWithValue("@NhuCau", request.NhuCau);
        command.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", (int)ConsultationStatus.Submitted);
        command.Parameters.AddWithValue("@KetQuaTuVan", (object?)request.KetQuaTuVan ?? DBNull.Value);

        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        var created = await GetById(id);
        return created ?? new ConsultationBooking { MaLichTuVan = id, MaKhachHang = maKhachHang, Ngay = request.Ngay, Gio = request.Gio, DiaChi = request.DiaChi, NhuCau = request.NhuCau };
    }

    public async Task<List<ConsultationBooking>> GetByCustomer(int maKhachHang)
    {
        var list = new List<ConsultationBooking>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM LichTuVan WHERE MaKhachHang = @MaKhachHang ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(Map(reader));
        }
        return list;
    }

    public async Task<List<ConsultationBooking>> GetAll()
    {
        var list = new List<ConsultationBooking>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM LichTuVan ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(Map(reader));
        }
        return list;
    }

    public async Task<ConsultationBooking?> GetById(int maLichTuVan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM LichTuVan WHERE MaLichTuVan = @MaLichTuVan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaLichTuVan", maLichTuVan);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<bool> AssignArtist(int maLichTuVan, int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE LichTuVan SET MaHoaSi = @MaHoaSi, TrangThai = @TrangThai WHERE MaLichTuVan = @MaLichTuVan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@TrangThai", (int)ConsultationStatus.Confirmed);
        command.Parameters.AddWithValue("@MaLichTuVan", maLichTuVan);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> SaveResult(int maLichTuVan, string ketQuaTuVan)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE LichTuVan SET KetQuaTuVan = @KetQuaTuVan, TrangThai = @TrangThai WHERE MaLichTuVan = @MaLichTuVan";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@KetQuaTuVan", ketQuaTuVan);
        command.Parameters.AddWithValue("@TrangThai", (int)ConsultationStatus.Completed);
        command.Parameters.AddWithValue("@MaLichTuVan", maLichTuVan);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> CreateRecommendation(TaoDeXuatTranhRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO DeXuatTranh (MaLichTuVan, MaTacPham, GiaDeXuat, GhiChu, TrangThai)
            VALUES (@MaLichTuVan, @MaTacPham, @GiaDeXuat, @GhiChu, @TrangThai);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaLichTuVan", request.MaLichTuVan);
        command.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
        command.Parameters.AddWithValue("@GiaDeXuat", request.GiaDeXuat);
        command.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", "Pending");

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> CreateCriteria(ConsultationCriteria criteria)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO TieuChiTuVan (MaLichTuVan, LoaiTieuChi, GiaTri)
            VALUES (@MaLichTuVan, @LoaiTieuChi, @GiaTri);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaLichTuVan", criteria.MaLichTuVan);
        command.Parameters.AddWithValue("@LoaiTieuChi", criteria.LoaiTieuChi);
        command.Parameters.AddWithValue("@GiaTri", criteria.GiaTri);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    private static ConsultationBooking Map(SqlDataReader reader)
    {
        return new ConsultationBooking
        {
            MaLichTuVan = reader.GetInt32(reader.GetOrdinal("MaLichTuVan")),
            MaKhachHang = reader.GetInt32(reader.GetOrdinal("MaKhachHang")),
            MaHoaSi = reader.IsDBNull(reader.GetOrdinal("MaHoaSi")) ? null : reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            MaNhanVien = reader.IsDBNull(reader.GetOrdinal("MaNhanVien")) ? null : reader.GetInt32(reader.GetOrdinal("MaNhanVien")),
            Ngay = reader.GetDateTime(reader.GetOrdinal("Ngay")),
            Gio = reader.GetTimeSpan(reader.GetOrdinal("Gio")),
            DiaChi = reader.IsDBNull(reader.GetOrdinal("DiaChi")) ? string.Empty : reader.GetString(reader.GetOrdinal("DiaChi")),
            NhuCau = reader.IsDBNull(reader.GetOrdinal("NhuCau")) ? string.Empty : reader.GetString(reader.GetOrdinal("NhuCau")),
            GhiChu = reader.IsDBNull(reader.GetOrdinal("GhiChu")) ? null : reader.GetString(reader.GetOrdinal("GhiChu")),
            TrangThai = reader.IsDBNull(reader.GetOrdinal("TrangThai")) ? ConsultationStatus.Submitted : (ConsultationStatus)reader.GetInt32(reader.GetOrdinal("TrangThai")),
            KetQuaTuVan = reader.IsDBNull(reader.GetOrdinal("KetQuaTuVan")) ? null : reader.GetString(reader.GetOrdinal("KetQuaTuVan")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao"))
        };
    }
}
