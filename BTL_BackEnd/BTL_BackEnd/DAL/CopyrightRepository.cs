using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class CopyrightRepository : ICopyrightRepository
{
    private readonly string _connectionString;

    private const string CopyrightSelect = @"
        SELECT b.MaBanQuyen,b.MaTacPham,b.TacGia,b.NgaySangTac,b.NguonGoc,b.MoTa,b.GhiChu,
               b.TrangThai,b.GhiChuKiemDuyet,b.NgayKiemDuyet,b.NgayTao,b.NgayCapNhat,
               t.TenTacPham,t.MaHoaSi,t.LaTacPhamDocBan,h.TenHoaSi
        FROM BanQuyen b
        INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
        INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi";

    public CopyrightRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<int> Create(int maHoaSi, int maTaiKhoan, TaoBanQuyenRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var artwork = new SqlCommand(@"
                SELECT SoLuong FROM TacPham WITH (UPDLOCK,HOLDLOCK)
                WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi;", connection, transaction);
            artwork.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            artwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            var quantityValue = await artwork.ExecuteScalarAsync();
            if (quantityValue == null || quantityValue == DBNull.Value)
                throw new UnauthorizedAccessException("Tác phẩm không thuộc họa sĩ hiện tại");
            if (request.LaTacPhamDocBan && Convert.ToInt32(quantityValue) > 1)
                throw new InvalidOperationException("Tác phẩm có tồn kho lớn hơn 1 không thể đánh dấu là độc bản");

            await using var duplicate = new SqlCommand(
                "SELECT COUNT_BIG(*) FROM BanQuyen WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@MaTacPham;",
                connection, transaction);
            duplicate.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            if (Convert.ToInt64(await duplicate.ExecuteScalarAsync()) > 0)
                throw new InvalidOperationException("Tác phẩm đã có khai báo bản quyền");

            await using var updateArtwork = new SqlCommand(
                "UPDATE TacPham SET LaTacPhamDocBan=@LaTacPhamDocBan WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi;",
                connection, transaction);
            updateArtwork.Parameters.AddWithValue("@LaTacPhamDocBan", request.LaTacPhamDocBan);
            updateArtwork.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            updateArtwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            await updateArtwork.ExecuteNonQueryAsync();

            await using var insert = new SqlCommand(@"
                INSERT INTO BanQuyen
                    (MaTacPham,MaTacGia,MaNguoiGiuQuyen,TacGia,NgaySangTac,NguonGoc,MoTa,GhiChu,
                     TrangThai,NguoiTao,NguoiCapNhat,NgayTao,NgayCapNhat)
                OUTPUT INSERTED.MaBanQuyen
                VALUES
                    (@MaTacPham,@MaHoaSi,@MaHoaSi,@TacGia,@NgaySangTac,@NguonGoc,@MoTa,@GhiChu,
                     @Pending,@MaTaiKhoan,@MaTaiKhoan,SYSDATETIME(),SYSDATETIME());", connection, transaction);
            insert.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            insert.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            insert.Parameters.AddWithValue("@TacGia", request.TacGia);
            insert.Parameters.AddWithValue("@NgaySangTac", Db(request.NgaySangTac?.Date));
            insert.Parameters.AddWithValue("@NguonGoc", request.NguonGoc);
            insert.Parameters.AddWithValue("@MoTa", Db(request.MoTaBanQuyen));
            insert.Parameters.AddWithValue("@GhiChu", Db(request.GhiChu));
            insert.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
            insert.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());
            await transaction.CommitAsync();
            return id;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public Task<BanQuyenResponse?> GetForArtist(int maTacPham, int maHoaSi) =>
        QueryOne(CopyrightSelect + " WHERE b.MaTacPham=@MaTacPham AND t.MaHoaSi=@MaHoaSi", command =>
        {
            command.Parameters.AddWithValue("@MaTacPham", maTacPham);
            command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        });

    public async Task<bool> Update(int maBanQuyen, int maHoaSi, int maTaiKhoan, CapNhatBanQuyenRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE b SET TacGia=@TacGia,NgaySangTac=@NgaySangTac,NguonGoc=@NguonGoc,
                MoTa=@MoTa,GhiChu=@GhiChu,TrangThai=@Pending,GhiChuKiemDuyet=NULL,
                NguoiKiemDuyet=NULL,NgayKiemDuyet=NULL,NguoiCapNhat=@MaTaiKhoan,NgayCapNhat=SYSDATETIME()
            FROM BanQuyen b INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
            WHERE b.MaBanQuyen=@MaBanQuyen AND t.MaHoaSi=@MaHoaSi
              AND b.TrangThai IN (@Pending,@NeedInfo,@Verified,@Rejected);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TacGia", request.TacGia);
        command.Parameters.AddWithValue("@NgaySangTac", Db(request.NgaySangTac?.Date));
        command.Parameters.AddWithValue("@NguonGoc", request.NguonGoc);
        command.Parameters.AddWithValue("@MoTa", Db(request.MoTaBanQuyen));
        command.Parameters.AddWithValue("@GhiChu", Db(request.GhiChu));
        command.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
        command.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
        command.Parameters.AddWithValue("@NeedInfo", CopyrightStatuses.NeedInfo);
        command.Parameters.AddWithValue("@Verified", CopyrightStatuses.Verified);
        command.Parameters.AddWithValue("@Rejected", CopyrightStatuses.Rejected);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<int> AddEvidence(int maBanQuyen, int maHoaSi, int maTaiKhoan, CopyrightEvidenceFile file)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var check = new SqlCommand(@"
                SELECT COUNT_BIG(*) FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
                WHERE b.MaBanQuyen=@MaBanQuyen AND t.MaHoaSi=@MaHoaSi;", connection, transaction);
            check.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
            check.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            if (Convert.ToInt64(await check.ExecuteScalarAsync()) != 1)
                throw new UnauthorizedAccessException("Bạn không có quyền thêm bằng chứng cho khai báo này");

            await using var insert = new SqlCommand(@"
                INSERT INTO BangChungBanQuyen
                    (MaBanQuyen,TenTepGoc,TenTepLuu,DuongDan,LoaiTep,KichThuoc,NgayTao,NguoiTao)
                OUTPUT INSERTED.MaBangChung
                VALUES(@MaBanQuyen,@TenTepGoc,@TenTepLuu,@DuongDan,@LoaiTep,@KichThuoc,SYSDATETIME(),@NguoiTao);",
                connection, transaction);
            insert.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
            insert.Parameters.AddWithValue("@TenTepGoc", file.OriginalName);
            insert.Parameters.AddWithValue("@TenTepLuu", file.StoredName);
            insert.Parameters.AddWithValue("@DuongDan", file.RelativePath);
            insert.Parameters.AddWithValue("@LoaiTep", file.ContentType);
            insert.Parameters.AddWithValue("@KichThuoc", file.Size);
            insert.Parameters.AddWithValue("@NguoiTao", maTaiKhoan);
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());

            await using var reset = new SqlCommand(@"
                UPDATE BanQuyen SET TrangThai=@Pending,GhiChuKiemDuyet=NULL,NguoiKiemDuyet=NULL,
                    NgayKiemDuyet=NULL,NguoiCapNhat=@NguoiTao,NgayCapNhat=SYSDATETIME()
                WHERE MaBanQuyen=@MaBanQuyen AND TrangThai<>@Pending;", connection, transaction);
            reset.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
            reset.Parameters.AddWithValue("@NguoiTao", maTaiKhoan);
            reset.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
            await reset.ExecuteNonQueryAsync();
            await transaction.CommitAsync();
            return id;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(BangChungBanQuyen Evidence, int ArtistId)?> GetEvidence(int maBanQuyen, int maBangChung)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT e.MaBangChung,e.MaBanQuyen,e.TenTepGoc,e.TenTepLuu,e.DuongDan,e.LoaiTep,
                   e.KichThuoc,e.NgayTao,e.NguoiTao,t.MaHoaSi
            FROM BangChungBanQuyen e
            INNER JOIN BanQuyen b ON b.MaBanQuyen=e.MaBanQuyen
            INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
            WHERE e.MaBangChung=@MaBangChung AND e.MaBanQuyen=@MaBanQuyen;", connection);
        command.Parameters.AddWithValue("@MaBangChung", maBangChung);
        command.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return (new BangChungBanQuyen
        {
            MaBangChung = reader.GetInt32(0), MaBanQuyen = reader.GetInt32(1),
            TenTepGoc = reader.GetString(2), TenTepLuu = reader.GetString(3), DuongDan = reader.GetString(4),
            LoaiTep = reader.GetString(5), KichThuoc = reader.GetInt64(6), NgayTao = reader.GetDateTime(7),
            NguoiTao = reader.IsDBNull(8) ? null : reader.GetInt32(8)
        }, reader.GetInt32(9));
    }

    public Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword)
    {
        var filters = new List<string>();
        byte? parsedStatus = ParseStatus(status);
        if (parsedStatus.HasValue) filters.Add("b.TrangThai=@TrangThai");
        if (!string.IsNullOrWhiteSpace(keyword)) filters.Add("(t.TenTacPham LIKE @Keyword OR h.TenHoaSi LIKE @Keyword OR b.TacGia LIKE @Keyword)");
        var sql = CopyrightSelect + (filters.Count > 0 ? " WHERE " + string.Join(" AND ", filters) : string.Empty) + " ORDER BY b.NgayCapNhat DESC";
        return QueryMany(sql, command =>
        {
            if (parsedStatus.HasValue) command.Parameters.AddWithValue("@TrangThai", parsedStatus.Value);
            if (!string.IsNullOrWhiteSpace(keyword)) command.Parameters.AddWithValue("@Keyword", $"%{keyword.Trim()}%");
        });
    }

    public Task<BanQuyenResponse?> GetForAdminById(int maBanQuyen) =>
        QueryOne(CopyrightSelect + " WHERE b.MaBanQuyen=@MaBanQuyen", command => command.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen));

    public async Task<bool> Review(int maBanQuyen, int maTaiKhoan, byte status, string? note)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            UPDATE BanQuyen SET TrangThai=@TrangThai,GhiChuKiemDuyet=@GhiChu,
                NguoiKiemDuyet=@NguoiKiemDuyet,NgayKiemDuyet=SYSDATETIME(),
                NguoiCapNhat=@NguoiKiemDuyet,NgayCapNhat=SYSDATETIME()
            WHERE MaBanQuyen=@MaBanQuyen AND TrangThai=@Pending;", connection);
        command.Parameters.AddWithValue("@TrangThai", status);
        command.Parameters.AddWithValue("@GhiChu", Db(note));
        command.Parameters.AddWithValue("@NguoiKiemDuyet", maTaiKhoan);
        command.Parameters.AddWithValue("@MaBanQuyen", maBanQuyen);
        command.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT TacGia,NgaySangTac,NguonGoc,MoTa,TrangThai FROM BanQuyen WHERE MaTacPham=@MaTacPham;", connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return new BanQuyenCongKhaiResponse();
        var status = reader.GetByte(4);
        return new BanQuyenCongKhaiResponse
        {
            DaKhaiBao = true,
            TrangThai = CopyrightStatuses.ToCode(status),
            TacGia = status == CopyrightStatuses.Verified ? reader["TacGia"] as string : null,
            NgaySangTac = status == CopyrightStatuses.Verified && !reader.IsDBNull(1) ? reader.GetDateTime(1) : null,
            NguonGoc = status == CopyrightStatuses.Verified ? reader["NguonGoc"] as string : null,
            MoTaBanQuyen = status == CopyrightStatuses.Verified ? reader["MoTa"] as string : null
        };
    }

    public Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung) => QueryCertificates(@"
        WHERE l.MaNguoiDung=@MaNguoiDung AND l.TrangThai=@Current AND c.TrangThai=@Active
        ORDER BY c.NgayCap DESC", command =>
    {
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
        command.Parameters.AddWithValue("@Active", CertificateStatuses.Active);
    });

    public async Task<ChungNhanResponse?> GetCertificate(int maChungNhan, int maNguoiDung)
    {
        var list = await QueryCertificates(@"
            WHERE c.MaChungNhan=@MaChungNhan AND l.MaNguoiDung=@MaNguoiDung AND l.TrangThai=@Current", command =>
        {
            command.Parameters.AddWithValue("@MaChungNhan", maChungNhan);
            command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            command.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
        });
        return list.FirstOrDefault();
    }

    private async Task<BanQuyenResponse?> QueryOne(string sql, Action<SqlCommand> configure)
    {
        var values = await QueryMany(sql, configure);
        return values.FirstOrDefault();
    }

    private async Task<List<BanQuyenResponse>> QueryMany(string sql, Action<SqlCommand> configure)
    {
        var result = new List<BanQuyenResponse>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        configure(command);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapCopyright(reader));
        await reader.CloseAsync();
        foreach (var item in result) item.BangChung = await GetEvidenceMetadata(connection, item.MaBanQuyen);
        return result;
    }

    private static async Task<List<BangChungBanQuyenResponse>> GetEvidenceMetadata(SqlConnection connection, int copyrightId)
    {
        var result = new List<BangChungBanQuyenResponse>();
        await using var command = new SqlCommand(@"
            SELECT MaBangChung,TenTepGoc,LoaiTep,KichThuoc,NgayTao
            FROM BangChungBanQuyen WHERE MaBanQuyen=@MaBanQuyen ORDER BY NgayTao DESC;", connection);
        command.Parameters.AddWithValue("@MaBanQuyen", copyrightId);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new BangChungBanQuyenResponse
        {
            MaBangChung = reader.GetInt32(0), TenTepGoc = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
            LoaiTep = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
            KichThuoc = reader.IsDBNull(3) ? 0 : reader.GetInt64(3), NgayTao = reader.GetDateTime(4),
            DuongDanTai = $"/api/ban-quyen/{copyrightId}/bang-chung/{reader.GetInt32(0)}/tep"
        });
        return result;
    }

    private async Task<List<ChungNhanResponse>> QueryCertificates(string whereSql, Action<SqlCommand> configure)
    {
        var result = new List<ChungNhanResponse>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = @"
            SELECT c.MaChungNhan,c.CertificateCode,COALESCE(c.MaTacPham,l.MaTacPham) AS MaTacPham,t.TenTacPham,
                   COALESCE(b.TacGia,h.TenHoaSi) AS TacGia,h.TenHoaSi,n.Ten AS ChuSoHuu,
                   c.NgayCap,c.TrangThai
            FROM ChungNhan c
            INNER JOIN LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu
            INNER JOIN TacPham t ON t.MaTacPham=COALESCE(c.MaTacPham,l.MaTacPham)
            INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
            INNER JOIN NguoiDung n ON n.MaNguoiDung=l.MaNguoiDung
            LEFT JOIN BanQuyen b ON b.MaTacPham=t.MaTacPham " + whereSql;
        await using var command = new SqlCommand(sql, connection);
        configure(command);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new ChungNhanResponse
        {
            MaChungNhan = reader.GetInt32(0), MaChungNhanCongKhai = reader.GetString(1),
            MaTacPham = reader.GetInt32(2), TenTacPham = reader.GetString(3),
            TacGia = reader.IsDBNull(4) ? string.Empty : reader.GetString(4), TenHoaSi = reader.GetString(5),
            ChuSoHuu = reader.GetString(6), NgayCap = reader.GetDateTime(7),
            TrangThai = CertificateStatuses.ToCode(reader.GetByte(8))
        });
        return result;
    }

    private static BanQuyenResponse MapCopyright(SqlDataReader reader)
    {
        var status = reader.GetByte(reader.GetOrdinal("TrangThai"));
        return new BanQuyenResponse
        {
            MaBanQuyen = reader.GetInt32(reader.GetOrdinal("MaBanQuyen")),
            MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
            TenTacPham = reader.GetString(reader.GetOrdinal("TenTacPham")),
            MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            TenHoaSi = reader.GetString(reader.GetOrdinal("TenHoaSi")),
            TacGia = reader["TacGia"] as string ?? string.Empty,
            NgaySangTac = reader["NgaySangTac"] == DBNull.Value ? null : Convert.ToDateTime(reader["NgaySangTac"]),
            NguonGoc = reader["NguonGoc"] as string ?? string.Empty,
            MoTaBanQuyen = reader["MoTa"] as string, GhiChu = reader["GhiChu"] as string,
            TrangThaiSo = status, TrangThai = CopyrightStatuses.ToCode(status),
            GhiChuKiemDuyet = reader["GhiChuKiemDuyet"] as string,
            NgayKiemDuyet = reader["NgayKiemDuyet"] == DBNull.Value ? null : Convert.ToDateTime(reader["NgayKiemDuyet"]),
            LaTacPhamDocBan = Convert.ToBoolean(reader["LaTacPhamDocBan"]),
            NgayTao = Convert.ToDateTime(reader["NgayTao"]), NgayCapNhat = Convert.ToDateTime(reader["NgayCapNhat"])
        };
    }

    private static byte? ParseStatus(string? value) => value?.Trim().ToUpperInvariant() switch
    {
        null or "" => null, "PENDING" => CopyrightStatuses.Pending, "NEED_INFO" => CopyrightStatuses.NeedInfo,
        "VERIFIED" => CopyrightStatuses.Verified, "REJECTED" => CopyrightStatuses.Rejected,
        "DISPUTED" => CopyrightStatuses.Disputed, "LEGACY" => CopyrightStatuses.Legacy,
        _ => throw new ArgumentException("Trạng thái bản quyền không hợp lệ")
    };

    private static object Db(object? value) => value ?? DBNull.Value;
}
