using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class ChiTietTacPhamRepository : IChiTietTacPhamRepository
{
    private readonly string _connectionString;

    public ChiTietTacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    // ================================================================
    // HỌA SĨ - TẠO CHI TIẾT
    // ================================================================
    public async Task<int> Create(int maHoaSi, int maTacPham, ChiTietTacPham chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = @"INSERT INTO ChiTietTacPham
            (MaTacPham,CauChuyenSangTac,YNghiaNghiThuat,KyThuatThucHien,CamHungSangTao,ThongTinBosung,
             KichThuoc,ChatLieu,ChatLieuKhung,NamSangTac,DiaDiemSangTac,HinhAnh1,HinhAnh2,HinhAnh3,HinhAnh4,
             TrangThai,LyDoTuChoi,NgayTao,NgayCapNhat,NgayDuyet,MaNguoiDuyet)
            SELECT @MaTacPham,@CauChuyenSangTac,@YNghiaNghiThuat,@KyThuatThucHien,@CamHungSangTao,@ThongTinBosung,
                   @KichThuoc,@ChatLieu,@ChatLieuKhung,@NamSangTac,@DiaDiemSangTac,@HinhAnh1,@HinhAnh2,@HinhAnh3,@HinhAnh4,
                   0,NULL,SYSUTCDATETIME(),NULL,NULL,NULL
            WHERE EXISTS (SELECT 1 FROM TacPham WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi AND MaYeuCauVeTranh IS NULL)
              AND NOT EXISTS (SELECT 1 FROM ChiTietTacPham WHERE MaTacPham=@MaTacPham);
            SELECT CASE WHEN @@ROWCOUNT=1 THEN CAST(SCOPE_IDENTITY() AS INT) ELSE 0 END;";
        using var command = new SqlCommand(sql, connection);

        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        command.Parameters.AddWithValue("@CauChuyenSangTac", (object?)chiTiet.CauChuyenSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@YNghiaNghiThuat", (object?)chiTiet.YNghiaNghiThuat ?? DBNull.Value);
        command.Parameters.AddWithValue("@KyThuatThucHien", (object?)chiTiet.KyThuatThucHien ?? DBNull.Value);
        command.Parameters.AddWithValue("@CamHungSangTao", (object?)chiTiet.CamHungSangTao ?? DBNull.Value);
        command.Parameters.AddWithValue("@ThongTinBosung", (object?)chiTiet.ThongTinBosung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)chiTiet.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)chiTiet.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)chiTiet.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@NamSangTac", (object?)chiTiet.NamSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaDiemSangTac", (object?)chiTiet.DiaDiemSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh1", (object?)chiTiet.HinhAnh1 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh2", (object?)chiTiet.HinhAnh2 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh3", (object?)chiTiet.HinhAnh3 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh4", (object?)chiTiet.HinhAnh4 ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    // ================================================================
    // HỌA SĨ - CẬP NHẬT CHI TIẾT
    // ================================================================
    public async Task<bool> Update(int maHoaSi, int maTacPham, ChiTietTacPham chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = @"UPDATE c SET
            CauChuyenSangTac=@CauChuyenSangTac, YNghiaNghiThuat=@YNghiaNghiThuat,
            KyThuatThucHien=@KyThuatThucHien, CamHungSangTao=@CamHungSangTao,
            ThongTinBosung=@ThongTinBosung, KichThuoc=@KichThuoc, ChatLieu=@ChatLieu,
            ChatLieuKhung=@ChatLieuKhung, NamSangTac=@NamSangTac, DiaDiemSangTac=@DiaDiemSangTac,
            HinhAnh1=@HinhAnh1,HinhAnh2=@HinhAnh2,HinhAnh3=@HinhAnh3,HinhAnh4=@HinhAnh4,
            TrangThai=0,LyDoTuChoi=NULL,NgayCapNhat=SYSUTCDATETIME(),NgayDuyet=NULL,MaNguoiDuyet=NULL
            FROM ChiTietTacPham c INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            WHERE c.MaTacPham=@MaTacPham AND t.MaHoaSi=@MaHoaSi AND t.MaYeuCauVeTranh IS NULL;";
        using var command = new SqlCommand(sql, connection);

        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        command.Parameters.AddWithValue("@CauChuyenSangTac", (object?)chiTiet.CauChuyenSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@YNghiaNghiThuat", (object?)chiTiet.YNghiaNghiThuat ?? DBNull.Value);
        command.Parameters.AddWithValue("@KyThuatThucHien", (object?)chiTiet.KyThuatThucHien ?? DBNull.Value);
        command.Parameters.AddWithValue("@CamHungSangTao", (object?)chiTiet.CamHungSangTao ?? DBNull.Value);
        command.Parameters.AddWithValue("@ThongTinBosung", (object?)chiTiet.ThongTinBosung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)chiTiet.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)chiTiet.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)chiTiet.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@NamSangTac", (object?)chiTiet.NamSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@DiaDiemSangTac", (object?)chiTiet.DiaDiemSangTac ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh1", (object?)chiTiet.HinhAnh1 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh2", (object?)chiTiet.HinhAnh2 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh3", (object?)chiTiet.HinhAnh3 ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh4", (object?)chiTiet.HinhAnh4 ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync() == 1;
    }

    // ================================================================
    // HỌA SĨ - XÓA CHI TIẾT
    // ================================================================
    public async Task<bool> Delete(int maHoaSi, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = @"DELETE c FROM ChiTietTacPham c
            INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            WHERE c.MaTacPham=@MaTacPham AND t.MaHoaSi=@MaHoaSi AND t.MaYeuCauVeTranh IS NULL;";
        using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    // ================================================================
    // LẤY CHI TIẾT THEO MÃ TÁC PHẨM
    // ================================================================
    public async Task<ChiTietTacPham?> GetByMaTacPham(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("sp_LayChiTietTacPham", connection);
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToChiTietTacPham(reader);
        }

        return null;
    }

    // ================================================================
    // ADMIN - LẤY DANH SÁCH CHỜ DUYỆT
    // ================================================================
    public async Task<List<ChiTietTacPham>> GetAllChoDuyet()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("sp_Admin_LayDanhSachChiTietChoDuyet", connection);
        command.CommandType = System.Data.CommandType.StoredProcedure;

        var list = new List<ChiTietTacPham>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToChiTietTacPham(reader));
        }

        return list;
    }

    // ================================================================
    // ADMIN - LẤY TẤT CẢ CHI TIẾT
    // ================================================================
    public async Task<List<ChiTietTacPham>> GetAll(int trangThai = -1)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("sp_Admin_LayTatCaChiTietTacPham", connection);
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@TrangThai", trangThai);

        var list = new List<ChiTietTacPham>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToChiTietTacPham(reader));
        }

        return list;
    }

    // ================================================================
    // ADMIN - DUYỆT CHI TIẾT
    // ================================================================
    public async Task<bool> Duyet(int maTacPham, int maNguoiDuyet, bool pheDuyet, string? lyDoTuChoi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = @"UPDATE c SET TrangThai=@TrangThai,
            LyDoTuChoi=@LyDoTuChoi,NgayDuyet=SYSUTCDATETIME(),MaNguoiDuyet=@MaNguoiDuyet
            FROM ChiTietTacPham c INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            WHERE c.MaTacPham=@MaTacPham AND c.TrangThai=0 AND t.MaYeuCauVeTranh IS NULL;";
        using var command = new SqlCommand(sql, connection);

        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        command.Parameters.AddWithValue("@MaNguoiDuyet", maNguoiDuyet);
        command.Parameters.AddWithValue("@TrangThai", pheDuyet ? 1 : 2);
        command.Parameters.AddWithValue("@LyDoTuChoi", (object?)lyDoTuChoi ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync() == 1;
    }

    // ================================================================
    // PUBLIC - LẤY CHI TIẾT CÔNG KHAI (ĐÃ DUYỆT)
    // ================================================================
    public async Task<ChiTietTacPham?> GetCongKhai(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("sp_LayChiTietTacPhamCongKhai", connection);
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToChiTietTacPham(reader);
        }

        return null;
    }

    // ================================================================
    // HELPER - MAP DATA
    // ================================================================
    private ChiTietTacPham MapToChiTietTacPham(SqlDataReader reader)
    {
        return new ChiTietTacPham
        {
            MaChiTiet = reader.GetInt32(reader.GetOrdinal("MaChiTiet")),
            MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
            CauChuyenSangTac = reader.IsDBNull(reader.GetOrdinal("CauChuyenSangTac")) ? null : reader.GetString(reader.GetOrdinal("CauChuyenSangTac")),
            YNghiaNghiThuat = reader.IsDBNull(reader.GetOrdinal("YNghiaNghiThuat")) ? null : reader.GetString(reader.GetOrdinal("YNghiaNghiThuat")),
            KyThuatThucHien = reader.IsDBNull(reader.GetOrdinal("KyThuatThucHien")) ? null : reader.GetString(reader.GetOrdinal("KyThuatThucHien")),
            CamHungSangTao = reader.IsDBNull(reader.GetOrdinal("CamHungSangTao")) ? null : reader.GetString(reader.GetOrdinal("CamHungSangTao")),
            ThongTinBosung = reader.IsDBNull(reader.GetOrdinal("ThongTinBosung")) ? null : reader.GetString(reader.GetOrdinal("ThongTinBosung")),
            KichThuoc = reader.IsDBNull(reader.GetOrdinal("KichThuoc")) ? null : reader.GetString(reader.GetOrdinal("KichThuoc")),
            ChatLieu = reader.IsDBNull(reader.GetOrdinal("ChatLieu")) ? null : reader.GetString(reader.GetOrdinal("ChatLieu")),
            ChatLieuKhung = reader.IsDBNull(reader.GetOrdinal("ChatLieuKhung")) ? null : reader.GetString(reader.GetOrdinal("ChatLieuKhung")),
            NamSangTac = reader.IsDBNull(reader.GetOrdinal("NamSangTac")) ? null : reader.GetInt32(reader.GetOrdinal("NamSangTac")),
            DiaDiemSangTac = reader.IsDBNull(reader.GetOrdinal("DiaDiemSangTac")) ? null : reader.GetString(reader.GetOrdinal("DiaDiemSangTac")),
            HinhAnh1 = reader.IsDBNull(reader.GetOrdinal("HinhAnh1")) ? null : reader.GetString(reader.GetOrdinal("HinhAnh1")),
            HinhAnh2 = reader.IsDBNull(reader.GetOrdinal("HinhAnh2")) ? null : reader.GetString(reader.GetOrdinal("HinhAnh2")),
            HinhAnh3 = reader.IsDBNull(reader.GetOrdinal("HinhAnh3")) ? null : reader.GetString(reader.GetOrdinal("HinhAnh3")),
            HinhAnh4 = reader.IsDBNull(reader.GetOrdinal("HinhAnh4")) ? null : reader.GetString(reader.GetOrdinal("HinhAnh4")),
            TrangThai = reader.GetByte(reader.GetOrdinal("TrangThai")),
            LyDoTuChoi = reader.IsDBNull(reader.GetOrdinal("LyDoTuChoi")) ? null : reader.GetString(reader.GetOrdinal("LyDoTuChoi")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            NgayCapNhat = reader.IsDBNull(reader.GetOrdinal("NgayCapNhat")) ? null : reader.GetDateTime(reader.GetOrdinal("NgayCapNhat")),
            NgayDuyet = reader.IsDBNull(reader.GetOrdinal("NgayDuyet")) ? null : reader.GetDateTime(reader.GetOrdinal("NgayDuyet")),
            MaNguoiDuyet = reader.IsDBNull(reader.GetOrdinal("MaNguoiDuyet")) ? null : reader.GetInt32(reader.GetOrdinal("MaNguoiDuyet"))
        };
    }
}
