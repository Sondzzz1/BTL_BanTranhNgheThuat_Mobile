using System.Data;
using System.Text.Json;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public partial class CopyrightRepository : ICopyrightRepository
{
    private readonly string _connectionString;
    private readonly CopyrightOptions _options;

    private const string CopyrightSelect = @"
        SELECT b.MaBanQuyen,b.MaTacPham,b.TacGia,b.NgaySangTac,b.NguonGoc,b.MoTa,b.GhiChu,
               b.TrangThai,b.GhiChuKiemDuyet,b.NgayKiemDuyet,b.NgayTao,b.NgayCapNhat,
               b.CanCuSuDung,b.NguonThamKhao,b.SoDangKy,b.LaDuLieuCu,b.BiChanBan,
               b.NgayThuHoiXacMinh,b.LyDoThuHoiXacMinh,
               t.TenTacPham,t.MaHoaSi,t.LaTacPhamDocBan,t.SoLuongBanDau,t.SoLuong,
               t.LoaiTacPham,t.TacGiaGoc,t.MaTacPhamGoc,t.MoTaNguonGoc,h.TenHoaSi
        FROM BanQuyen b
        INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
        INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi";

    public CopyrightRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
        _options = CopyrightOptions.From(configuration);
    }

    public async Task<int> Create(int maHoaSi, int maTaiKhoan, TaoBanQuyenRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var artwork = new SqlCommand(@"
                SELECT SoLuong,SoLuongBanDau,NgayTao
                FROM TacPham WITH (UPDLOCK,HOLDLOCK)
                WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi;", connection, transaction);
            artwork.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            artwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            await using var artworkReader = await artwork.ExecuteReaderAsync();
            if (!await artworkReader.ReadAsync())
                throw new UnauthorizedAccessException("Tác phẩm không thuộc họa sĩ hiện tại");
            var stock = artworkReader.GetInt32(0);
            int? initialQuantity = artworkReader.IsDBNull(1) ? null : artworkReader.GetInt32(1);
            var artworkCreated = artworkReader.GetDateTime(2);
            await artworkReader.CloseAsync();

            if (request.LaTacPhamDocBan)
            {
                if (initialQuantity is null)
                {
                    await using var sales = new SqlCommand(
                        "SELECT COUNT_BIG(*) FROM ChiTietDonHang WITH (HOLDLOCK) WHERE MaTacPham=@MaTacPham;",
                        connection, transaction);
                    sales.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
                    var saleCount = Convert.ToInt64(await sales.ExecuteScalarAsync());
                    if (saleCount != 0 || stock != 1)
                        throw new InvalidOperationException("Không đủ dữ liệu để xác nhận tác phẩm cũ là độc bản. Cần đối soát số lượng ban đầu và lịch sử bán hàng");
                    initialQuantity = 1;
                }
                if (initialQuantity != 1)
                    throw new InvalidOperationException("Tác phẩm độc bản phải có số lượng ban đầu bằng 1");
            }

            await using var duplicate = new SqlCommand(
                "SELECT COUNT_BIG(*) FROM BanQuyen WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@MaTacPham;",
                connection, transaction);
            duplicate.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            if (Convert.ToInt64(await duplicate.ExecuteScalarAsync()) > 0)
                throw new InvalidOperationException("Tác phẩm đã có khai báo bản quyền");

            await using var updateArtwork = new SqlCommand(@"
                UPDATE TacPham SET LaTacPhamDocBan=@LaTacPhamDocBan,
                    SoLuongBanDau=COALESCE(SoLuongBanDau,@SoLuongBanDau),LoaiTacPham=@LoaiTacPham,
                    TacGiaGoc=@TacGiaGoc,MaTacPhamGoc=@MaTacPhamGoc,MoTaNguonGoc=@MoTaNguonGoc
                WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi;", connection, transaction);
            updateArtwork.Parameters.AddWithValue("@LaTacPhamDocBan", request.LaTacPhamDocBan);
            updateArtwork.Parameters.AddWithValue("@SoLuongBanDau", Db(initialQuantity));
            AddOriginParameters(updateArtwork, request.LoaiTacPham, request.TacGiaGoc, request.MaTacPhamGoc, request.MoTaNguonGoc);
            updateArtwork.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            updateArtwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            await updateArtwork.ExecuteNonQueryAsync();

            var isLegacy = artworkCreated.ToUniversalTime() < _options.EnforcementStartUtc;
            await using var insert = new SqlCommand(@"
                INSERT INTO BanQuyen
                    (MaTacPham,MaTacGia,MaNguoiGiuQuyen,TacGia,NgaySangTac,NguonGoc,MoTa,GhiChu,
                     CanCuSuDung,NguonThamKhao,SoDangKy,LaDuLieuCu,BiChanBan,
                     TrangThai,NguoiTao,NguoiCapNhat,NgayTao,NgayCapNhat)
                OUTPUT INSERTED.MaBanQuyen
                VALUES
                    (@MaTacPham,@MaHoaSi,@MaHoaSi,@TacGia,@NgaySangTac,@NguonGoc,@MoTa,@GhiChu,
                     @CanCuSuDung,@NguonThamKhao,@SoDangKy,@LaDuLieuCu,0,
                     @Pending,@MaTaiKhoan,@MaTaiKhoan,SYSUTCDATETIME(),SYSUTCDATETIME());", connection, transaction);
            insert.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
            insert.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            AddCopyrightParameters(insert, request.TacGia, request.NgaySangTac, request.NguonGoc,
                request.MoTaBanQuyen, request.GhiChu, request.CanCuSuDung, request.NguonThamKhao, request.SoDangKy);
            insert.Parameters.AddWithValue("@LaDuLieuCu", isLegacy);
            insert.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
            insert.Parameters.AddWithValue("@MaTaiKhoan", maTaiKhoan);
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());
            await AuditLogSql.InsertAsync(connection, transaction, "BanQuyen", id, "CREATE", maTaiKhoan, null,
                after: JsonSerializer.Serialize(new { request.MaTacPham, request.LoaiTacPham, request.LaTacPhamDocBan, isLegacy }));
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
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var check = new SqlCommand(@"
                SELECT b.TrangThai,b.MaTacPham FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
                WHERE b.MaBanQuyen=@Id AND t.MaHoaSi=@Artist;", connection, transaction);
            check.Parameters.AddWithValue("@Id", maBanQuyen);
            check.Parameters.AddWithValue("@Artist", maHoaSi);
            await using var reader = await check.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return false;
            var status = reader.GetByte(0);
            var artworkId = reader.GetInt32(1);
            await reader.CloseAsync();
            if (status is not (CopyrightStatuses.Pending or CopyrightStatuses.NeedInfo or CopyrightStatuses.Rejected or CopyrightStatuses.Legacy))
                throw new InvalidOperationException("Khai báo đã xác minh, đang tranh chấp hoặc đã thu hồi không thể tự sửa");

            await using var updateArtwork = new SqlCommand(@"
                UPDATE TacPham SET LoaiTacPham=@LoaiTacPham,TacGiaGoc=@TacGiaGoc,
                    MaTacPhamGoc=@MaTacPhamGoc,MoTaNguonGoc=@MoTaNguonGoc WHERE MaTacPham=@ArtworkId;",
                connection, transaction);
            AddOriginParameters(updateArtwork, request.LoaiTacPham, request.TacGiaGoc, request.MaTacPhamGoc, request.MoTaNguonGoc);
            updateArtwork.Parameters.AddWithValue("@ArtworkId", artworkId);
            await updateArtwork.ExecuteNonQueryAsync();

            await using var update = new SqlCommand(@"
                UPDATE BanQuyen SET TacGia=@TacGia,NgaySangTac=@NgaySangTac,NguonGoc=@NguonGoc,
                    MoTa=@MoTa,GhiChu=@GhiChu,CanCuSuDung=@CanCuSuDung,NguonThamKhao=@NguonThamKhao,
                    SoDangKy=@SoDangKy,TrangThai=@Pending,GhiChuKiemDuyet=NULL,NguoiKiemDuyet=NULL,
                    NgayKiemDuyet=NULL,NguoiCapNhat=@Actor,NgayCapNhat=SYSUTCDATETIME()
                WHERE MaBanQuyen=@Id;", connection, transaction);
            AddCopyrightParameters(update, request.TacGia, request.NgaySangTac, request.NguonGoc,
                request.MoTaBanQuyen, request.GhiChu, request.CanCuSuDung, request.NguonThamKhao, request.SoDangKy);
            update.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
            update.Parameters.AddWithValue("@Actor", maTaiKhoan);
            update.Parameters.AddWithValue("@Id", maBanQuyen);
            await update.ExecuteNonQueryAsync();
            await AuditLogSql.InsertAsync(connection, transaction, "BanQuyen", maBanQuyen, "UPDATE", maTaiKhoan, null,
                before: JsonSerializer.Serialize(new { status }), after: JsonSerializer.Serialize(new { status = CopyrightStatuses.Pending }));
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<int> AddEvidence(int maBanQuyen, int maHoaSi, int maTaiKhoan, CopyrightEvidenceFile file)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var check = new SqlCommand(@"
                SELECT b.TrangThai,(SELECT COUNT_BIG(*) FROM BangChungBanQuyen e WHERE e.MaBanQuyen=b.MaBanQuyen)
                FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK) INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
                WHERE b.MaBanQuyen=@Id AND t.MaHoaSi=@Artist;", connection, transaction);
            check.Parameters.AddWithValue("@Id", maBanQuyen);
            check.Parameters.AddWithValue("@Artist", maHoaSi);
            await using var reader = await check.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) throw new UnauthorizedAccessException("Bạn không có quyền thêm bằng chứng cho khai báo này");
            var status = reader.GetByte(0);
            var evidenceCount = reader.GetInt64(1);
            await reader.CloseAsync();
            if (status is not (CopyrightStatuses.Pending or CopyrightStatuses.NeedInfo or CopyrightStatuses.Rejected or CopyrightStatuses.Legacy))
                throw new InvalidOperationException("Không thể thay đổi bằng chứng của hồ sơ đã xác minh, tranh chấp hoặc thu hồi");
            if (evidenceCount >= 10) throw new InvalidOperationException("Mỗi hồ sơ được tải tối đa 10 bằng chứng");

            await using var insert = new SqlCommand(@"
                INSERT INTO BangChungBanQuyen
                    (MaBanQuyen,TenTepGoc,TenTepLuu,DuongDan,LoaiTep,KichThuoc,MoTa,Sha256,NgayTao,NguoiTao)
                OUTPUT INSERTED.MaBangChung
                VALUES(@Id,@Original,@Stored,@Path,@Type,@Size,@Description,@Hash,SYSUTCDATETIME(),@Actor);",
                connection, transaction);
            insert.Parameters.AddWithValue("@Id", maBanQuyen);
            insert.Parameters.AddWithValue("@Original", file.OriginalName);
            insert.Parameters.AddWithValue("@Stored", file.StoredName);
            insert.Parameters.AddWithValue("@Path", file.RelativePath);
            insert.Parameters.AddWithValue("@Type", file.ContentType);
            insert.Parameters.AddWithValue("@Size", file.Size);
            insert.Parameters.AddWithValue("@Description", Db(file.Description));
            insert.Parameters.AddWithValue("@Hash", file.Sha256);
            insert.Parameters.AddWithValue("@Actor", maTaiKhoan);
            var id = Convert.ToInt32(await insert.ExecuteScalarAsync());
            if (status is CopyrightStatuses.NeedInfo or CopyrightStatuses.Rejected or CopyrightStatuses.Legacy)
            {
                await using var reset = new SqlCommand(@"
                    UPDATE BanQuyen SET TrangThai=@Pending,GhiChuKiemDuyet=NULL,NguoiKiemDuyet=NULL,
                        NgayKiemDuyet=NULL,NguoiCapNhat=@Actor,NgayCapNhat=SYSUTCDATETIME() WHERE MaBanQuyen=@Id;",
                    connection, transaction);
                reset.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
                reset.Parameters.AddWithValue("@Actor", maTaiKhoan);
                reset.Parameters.AddWithValue("@Id", maBanQuyen);
                await reset.ExecuteNonQueryAsync();
            }
            await AuditLogSql.InsertAsync(connection, transaction, "BangChungBanQuyen", id, "ADD", maTaiKhoan, null,
                after: JsonSerializer.Serialize(new { maBanQuyen, file.OriginalName, file.Size, file.Sha256 }));
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
        await using var command = EvidenceCommand(connection, null, maBanQuyen, maBangChung, null);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? (MapEvidence(reader), reader.GetInt32(9)) : null;
    }

    public async Task<BangChungBanQuyen?> DeleteEvidence(int maBanQuyen, int maBangChung, int maHoaSi, int maTaiKhoan)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var command = EvidenceCommand(connection, transaction, maBanQuyen, maBangChung, maHoaSi);
            await using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;
            var evidence = MapEvidence(reader);
            var status = reader.GetByte(12);
            await reader.CloseAsync();
            if (status is not (CopyrightStatuses.Pending or CopyrightStatuses.NeedInfo or CopyrightStatuses.Rejected))
                throw new InvalidOperationException("Không thể xóa bằng chứng của hồ sơ đã xác minh, tranh chấp hoặc thu hồi");
            await using var delete = new SqlCommand("DELETE FROM BangChungBanQuyen WHERE MaBangChung=@EvidenceId;", connection, transaction);
            delete.Parameters.AddWithValue("@EvidenceId", maBangChung);
            await delete.ExecuteNonQueryAsync();
            await AuditLogSql.InsertAsync(connection, transaction, "BangChungBanQuyen", maBangChung, "DELETE", maTaiKhoan, null,
                before: JsonSerializer.Serialize(new { maBanQuyen, evidence.TenTepGoc, evidence.Sha256 }));
            await transaction.CommitAsync();
            return evidence;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static SqlCommand EvidenceCommand(SqlConnection connection, SqlTransaction? transaction,
        int copyrightId, int evidenceId, int? artistId)
    {
        var command = new SqlCommand(@"
            SELECT e.MaBangChung,e.MaBanQuyen,e.TenTepGoc,e.TenTepLuu,e.DuongDan,e.LoaiTep,
                   e.KichThuoc,e.NgayTao,e.NguoiTao,t.MaHoaSi,e.MoTa,e.Sha256,b.TrangThai
            FROM BangChungBanQuyen e
            INNER JOIN BanQuyen b ON b.MaBanQuyen=e.MaBanQuyen
            INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
            WHERE e.MaBangChung=@EvidenceId AND e.MaBanQuyen=@CopyrightId
              AND (@ArtistId IS NULL OR t.MaHoaSi=@ArtistId);", connection, transaction);
        command.Parameters.AddWithValue("@EvidenceId", evidenceId);
        command.Parameters.AddWithValue("@CopyrightId", copyrightId);
        command.Parameters.AddWithValue("@ArtistId", Db(artistId));
        return command;
    }

    private static BangChungBanQuyen MapEvidence(SqlDataReader reader) => new()
    {
        MaBangChung = reader.GetInt32(0), MaBanQuyen = reader.GetInt32(1),
        TenTepGoc = reader.GetString(2), TenTepLuu = reader.GetString(3), DuongDan = reader.GetString(4),
        LoaiTep = reader.GetString(5), KichThuoc = reader.GetInt64(6), NgayTao = reader.GetDateTime(7),
        NguoiTao = reader.IsDBNull(8) ? null : reader.GetInt32(8),
        MoTa = reader.IsDBNull(10) ? null : reader.GetString(10), Sha256 = reader.IsDBNull(11) ? null : reader.GetString(11)
    };

    private static void AddCopyrightParameters(SqlCommand command, string author, DateTime? created,
        string origin, string? description, string? note, byte? usageBasis, string? sourceReference, string? registrationNumber)
    {
        command.Parameters.AddWithValue("@TacGia", author);
        command.Parameters.AddWithValue("@NgaySangTac", Db(created?.Date));
        command.Parameters.AddWithValue("@NguonGoc", origin);
        command.Parameters.AddWithValue("@MoTa", Db(description));
        command.Parameters.AddWithValue("@GhiChu", Db(note));
        command.Parameters.AddWithValue("@CanCuSuDung", Db(usageBasis));
        command.Parameters.AddWithValue("@NguonThamKhao", Db(sourceReference));
        command.Parameters.AddWithValue("@SoDangKy", Db(registrationNumber));
    }

    private static void AddOriginParameters(SqlCommand command, byte artworkType, string? originalAuthor,
        int? originalArtworkId, string? originDescription)
    {
        command.Parameters.AddWithValue("@LoaiTacPham", artworkType);
        command.Parameters.AddWithValue("@TacGiaGoc", Db(originalAuthor));
        command.Parameters.AddWithValue("@MaTacPhamGoc", Db(originalArtworkId));
        command.Parameters.AddWithValue("@MoTaNguonGoc", Db(originDescription));
    }

    private static object Db(object? value) => value ?? DBNull.Value;
}
