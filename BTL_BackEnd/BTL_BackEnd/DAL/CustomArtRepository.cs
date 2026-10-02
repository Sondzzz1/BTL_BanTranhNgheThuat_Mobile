using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class CustomArtRepository : ICustomArtRepository
{
    private readonly string _connectionString;
    private readonly CopyrightOptions _copyrightOptions;

    private const string SelectRequest = @"
        SELECT y.*,
               n.Ten AS TenKhachHang,
               h.TenHoaSi AS TenHoaSiThucHien,
               (SELECT COUNT(1) FROM TienDoVeTranh p WHERE p.MaYeuCau = y.MaYeuCau) AS SoLuongTienDo,
               (SELECT TOP (1) t.MaTacPham FROM TacPham t WHERE t.MaYeuCauVeTranh = y.MaYeuCau ORDER BY t.MaTacPham DESC) AS MaTacPhamKetQua
        FROM YeuCauVeTranh y
        LEFT JOIN NguoiDung n ON n.MaNguoiDung = y.MaKhachHang
        LEFT JOIN HoaSi h ON h.MaHoaSi = y.MaHoaSi";

    public CustomArtRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
        _copyrightOptions = CopyrightOptions.From(configuration);
    }

    public async Task<CustomArtRequest> CreateRequest(
        int maKhachHang,
        TaoYeuCauTranhRequest request,
        CustomArtStatus initialStatus,
        PermissionUsageStatus? permissionStatus)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string query = @"
            INSERT INTO YeuCauVeTranh
                (MaKhachHang, TieuDe, LoaiTranh, KichThuoc, ChuDe, MauSac, PhongCach, ChatLieu,
                 MoTa, AnhThamKhao, [Type], ReferenceArtworkId, ReferenceArtworkName,
                 ReferenceArtistName, ReferenceImageUrl, NguonTacPhamGoc, TinhTrangQuyenSuDung,
                 DaXacNhanQuyenTaiLieu, MoTaQuyenSuDung, BangChungQuyenSuDung,
                 TienDatCoc, GiaDuKien, TrangThai, NgayTao, NgayCapNhat, NgayHoanThanhDuKien)
            OUTPUT INSERTED.MaYeuCau
            VALUES
                (@MaKhachHang, @TieuDe, @LoaiTranh, @KichThuoc, @ChuDe, @MauSac, @PhongCach, @ChatLieu,
                 @MoTa, @AnhThamKhao, @Type, @ReferenceArtworkId, @ReferenceArtworkName,
                 @ReferenceArtistName, @ReferenceImageUrl, @NguonTacPhamGoc, @TinhTrangQuyenSuDung,
                 @DaXacNhanQuyenTaiLieu, @MoTaQuyenSuDung, @BangChungQuyenSuDung,
                 0, @GiaDuKien, @TrangThai, GETDATE(), GETDATE(), @NgayHoanThanhDuKien);";

        await using var command = new SqlCommand(query, connection);
        AddRequestParameters(command, maKhachHang, request, initialStatus, permissionStatus);
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        return await GetById(id) ?? throw new InvalidOperationException("Không thể đọc yêu cầu vừa tạo");
    }

    public Task<List<CustomArtRequest>> GetByCustomer(int maKhachHang) => QueryRequests(
        SelectRequest + " WHERE y.MaKhachHang = @MaKhachHang ORDER BY y.NgayTao DESC",
        command => command.Parameters.AddWithValue("@MaKhachHang", maKhachHang));

    public Task<List<CustomArtRequest>> GetForAdmin(CustomArtType? type = null, CustomArtStatus? status = null)
    {
        var filters = new List<string>();
        if (type.HasValue) filters.Add("y.[Type] = @Type");
        if (status.HasValue) filters.Add("y.TrangThai = @TrangThai");
        var sql = SelectRequest + (filters.Count > 0 ? " WHERE " + string.Join(" AND ", filters) : string.Empty) + " ORDER BY y.NgayTao DESC";
        return QueryRequests(sql, command =>
        {
            if (type.HasValue) command.Parameters.AddWithValue("@Type", (int)type.Value);
            if (status.HasValue) command.Parameters.AddWithValue("@TrangThai", (int)status.Value);
        });
    }

    public Task<List<CustomArtRequest>> GetForArtist(int maHoaSi) => QueryRequests(
        SelectRequest + @"
        WHERE y.TrangThai = @Approved
           OR y.MaHoaSi = @MaHoaSi
        ORDER BY y.NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@Approved", (int)CustomArtStatus.PendingArtist);
            command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        });

    public async Task<CustomArtRequest?> GetById(int maYeuCau)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(SelectRequest + " WHERE y.MaYeuCau = @MaYeuCau", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? Map(reader) : null;
    }

    public async Task<bool> UpdateByCustomer(
        int maYeuCau,
        int maKhachHang,
        CapNhatYeuCauTranhRequest request,
        CustomArtStatus status,
        PermissionUsageStatus? permissionStatus)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET TieuDe=@TieuDe, LoaiTranh=@LoaiTranh, KichThuoc=@KichThuoc, ChuDe=@ChuDe,
                MauSac=@MauSac, PhongCach=@PhongCach, ChatLieu=@ChatLieu, MoTa=@MoTa,
                [Type]=@Type, ReferenceArtworkId=@ReferenceArtworkId,
                ReferenceArtworkName=@ReferenceArtworkName, ReferenceArtistName=@ReferenceArtistName,
                ReferenceImageUrl=COALESCE(@ReferenceImageUrl, ReferenceImageUrl),
                AnhThamKhao=COALESCE(@AnhThamKhao, AnhThamKhao), NguonTacPhamGoc=@NguonTacPhamGoc,
                TinhTrangQuyenSuDung=@TinhTrangQuyenSuDung,
                DaXacNhanQuyenTaiLieu=@DaXacNhanQuyenTaiLieu,
                MoTaQuyenSuDung=@MoTaQuyenSuDung,
                BangChungQuyenSuDung=COALESCE(@BangChungQuyenSuDung, BangChungQuyenSuDung),
                GiaDuKien=@GiaDuKien, NgayHoanThanhDuKien=@NgayHoanThanhDuKien,
                TrangThai=@TrangThai, GhiChuKiemDuyet=NULL, NguoiKiemDuyet=NULL,
                NgayKiemDuyet=NULL, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
              AND TrangThai NOT IN (@Completed, @Rejected, @Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        AddRequestParameters(command, maKhachHang, request, status, permissionStatus);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> CancelByCustomer(int maYeuCau, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh SET TrangThai=@Cancelled, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
              AND TrangThai NOT IN (@Completed, @Rejected, @Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> AssignRequest(int maYeuCau, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET MaHoaSi=@MaHoaSi, TrangThai=@Accepted, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi IS NULL AND TrangThai=@Approved;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@Accepted", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Approved", (int)CustomArtStatus.PendingArtist);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> ReviewRequest(int maYeuCau, int maTaiKhoan, CustomArtStatus status, string? note)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh
            SET TrangThai=@TrangThai, GhiChuKiemDuyet=@GhiChu,
                NguoiKiemDuyet=@NguoiKiemDuyet, NgayKiemDuyet=GETDATE(), NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi IS NULL
              AND TrangThai IN (@Pending, @WaitingPermission);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@GhiChu", (object?)note ?? DBNull.Value);
        command.Parameters.AddWithValue("@NguoiKiemDuyet", maTaiKhoan);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@Pending", (int)CustomArtStatus.Submitted);
        command.Parameters.AddWithValue("@WaitingPermission", (int)CustomArtStatus.WaitingPermission);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> UpdateArtistStatus(int maYeuCau, int maHoaSi, CustomArtStatus status)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"
            UPDATE YeuCauVeTranh SET TrangThai=@TrangThai, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi
              AND TrangThai IN (@CustomerAccepted, @DepositPaid);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        command.Parameters.AddWithValue("@DepositPaid", (int)CustomArtStatus.DepositPaid);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<int?> CompleteRequest(int maYeuCau, int maHoaSi, HoanThanhYeuCauRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try
        {
            const string selectSql = @"
                SELECT y.*,
                       q.GiaBaoGia AS GiaTacPham,
                       existing.MaTacPham AS ExistingArtworkId,
                       validSource.MaTacPham AS ValidSourceArtworkId
                FROM YeuCauVeTranh y WITH (UPDLOCK, HOLDLOCK)
                OUTER APPLY (
                    SELECT TOP (1) b.GiaBaoGia
                    FROM BaoGiaVeTranh b WITH (UPDLOCK, HOLDLOCK)
                    WHERE b.MaYeuCau=y.MaYeuCau AND b.IsActive=1
                      AND b.TrangThai=N'CustomerAccepted'
                    ORDER BY b.MaBaoGia DESC
                ) q
                OUTER APPLY (
                    SELECT TOP (1) t.MaTacPham
                    FROM TacPham t WITH (UPDLOCK, HOLDLOCK)
                    WHERE t.MaYeuCauVeTranh=y.MaYeuCau
                    ORDER BY t.MaTacPham
                ) existing
                OUTER APPLY (
                    SELECT TOP (1) source.MaTacPham
                    FROM TacPham source
                    WHERE source.MaTacPham=y.ReferenceArtworkId
                      AND source.MaYeuCauVeTranh IS NULL
                ) validSource
                WHERE y.MaYeuCau=@MaYeuCau AND y.MaHoaSi=@MaHoaSi
                  AND EXISTS (
                      SELECT 1 FROM TienDoVeTranh p
                      WHERE p.MaYeuCau=y.MaYeuCau
                        AND UPPER(ISNULL(p.TrangThai, N'')) <> N'COMPLETED'
                  );";
            await using var select = new SqlCommand(selectSql, connection, transaction);
            select.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            select.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

            CustomArtType type;
            CustomArtStatus currentStatus;
            string title;
            string? description;
            string? material;
            string? size;
            string? originalAuthor;
            string? sourceDescription;
            int? sourceArtworkId;
            decimal price;
            int? existingArtworkId;

            await using (var reader = await select.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) return null;
                type = ParseCustomArtType(reader.GetInt32(reader.GetOrdinal("Type")));
                currentStatus = (CustomArtStatus)reader.GetInt32(reader.GetOrdinal("TrangThai"));
                title = reader.GetString(reader.GetOrdinal("TieuDe"));
                description = GetNullableString(reader, "MoTa");
                material = GetNullableString(reader, "ChatLieu");
                size = GetNullableString(reader, "KichThuoc");
                originalAuthor = GetNullableString(reader, "ReferenceArtistName");
                sourceDescription = GetNullableString(reader, "NguonTacPhamGoc");
                sourceArtworkId = reader.IsDBNull(reader.GetOrdinal("ValidSourceArtworkId")) ? null : reader.GetInt32(reader.GetOrdinal("ValidSourceArtworkId"));
                if (reader.IsDBNull(reader.GetOrdinal("GiaTacPham")))
                    throw new ArgumentException("Không thể hoàn thành yêu cầu vì chưa có báo giá được Customer chấp nhận");
                price = reader.GetDecimal(reader.GetOrdinal("GiaTacPham"));
                existingArtworkId = reader.IsDBNull(reader.GetOrdinal("ExistingArtworkId")) ? null : reader.GetInt32(reader.GetOrdinal("ExistingArtworkId"));
            }

            if (currentStatus is not (CustomArtStatus.InProgress or CustomArtStatus.PreviewSent or CustomArtStatus.RevisionRequested))
            {
                await transaction.RollbackAsync();
                return null;
            }

            const string insertFinalProgressSql = @"
                INSERT INTO TienDoVeTranh
                    (MaYeuCau, TieuDe, MoTa, AnhPreview, TrangThai, NgayTao)
                VALUES
                    (@MaYeuCau, N'Tác phẩm hoàn thiện', @GhiChuHoanThien, @AnhPreview, N'COMPLETED', GETDATE());";
            await using var insertFinalProgress = new SqlCommand(insertFinalProgressSql, connection, transaction);
            insertFinalProgress.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            insertFinalProgress.Parameters.AddWithValue("@GhiChuHoanThien",
                string.IsNullOrWhiteSpace(request.GhiChuHoanThien)
                    ? "Tác phẩm đã được hoàn thiện."
                    : request.GhiChuHoanThien.Trim());
            insertFinalProgress.Parameters.AddWithValue("@AnhPreview", request.HinhAnhTacPham!);
            await insertFinalProgress.ExecuteNonQueryAsync();

            var artworkType = type switch
            {
                CustomArtType.BasedOnArtwork or CustomArtType.Reproduction => (byte)3,
                CustomArtType.PersonalReference => (byte)4,
                _ => (byte)1
            };
            if (type is not (CustomArtType.BasedOnArtwork or CustomArtType.Reproduction))
                sourceArtworkId = null;

            var artworkName = string.IsNullOrWhiteSpace(request.TenTacPhamMoi)
                ? title
                : request.TenTacPhamMoi.Trim();
            var originDescription = string.IsNullOrWhiteSpace(request.MoTaNguonGoc)
                ? sourceDescription
                : request.MoTaNguonGoc.Trim();

            var artworkId = existingArtworkId;
            if (!artworkId.HasValue)
            {
                const string insertArtworkSql = @"
                    INSERT INTO TacPham
                        (TenTacPham, MaHoaSi, MaDanhMuc, Gia, SoLuong, SoLuongBanDau, MoTa, HinhAnh, ChatLieu,
                         ChatLieuKhung, KichThuoc, TrangThai, NgayTao, LyDo, LoaiTacPham,
                         TacGiaGoc, MaTacPhamGoc, MaYeuCauVeTranh, MoTaNguonGoc)
                    OUTPUT INSERTED.MaTacPham
                    VALUES
                        (@TenTacPham, @MaHoaSi, NULL, @Gia, 0, 1, @MoTa, @HinhAnh, @ChatLieu,
                         NULL, @KichThuoc, @HiddenStatus, GETDATE(), NULL, @LoaiTacPham,
                         @TacGiaGoc, @MaTacPhamGoc, @MaYeuCau, @MoTaNguonGoc);";
                await using var insertArtwork = new SqlCommand(insertArtworkSql, connection, transaction);
                insertArtwork.Parameters.AddWithValue("@TenTacPham", artworkName);
                insertArtwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
                insertArtwork.Parameters.AddWithValue("@Gia", price);
                insertArtwork.Parameters.AddWithValue("@MoTa", (object?)description ?? DBNull.Value);
                insertArtwork.Parameters.AddWithValue("@HinhAnh", request.HinhAnhTacPham!);
                insertArtwork.Parameters.AddWithValue("@ChatLieu", (object?)material ?? DBNull.Value);
                insertArtwork.Parameters.AddWithValue("@KichThuoc", (object?)size ?? DBNull.Value);
                insertArtwork.Parameters.AddWithValue("@HiddenStatus", TacPhamStatus.Hidden);
                insertArtwork.Parameters.AddWithValue("@LoaiTacPham", artworkType);
                insertArtwork.Parameters.AddWithValue("@TacGiaGoc", (object?)originalAuthor ?? DBNull.Value);
                insertArtwork.Parameters.AddWithValue("@MaTacPhamGoc", (object?)sourceArtworkId ?? DBNull.Value);
                insertArtwork.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
                insertArtwork.Parameters.AddWithValue("@MoTaNguonGoc", (object?)originDescription ?? DBNull.Value);
                artworkId = Convert.ToInt32(await insertArtwork.ExecuteScalarAsync());
            }
            else
            {
                const string updateArtworkSql = @"
                    UPDATE TacPham
                    SET TenTacPham=@TenTacPham,
                        MaHoaSi=@MaHoaSi,
                        Gia=@Gia,
                        SoLuong=0,
                        MoTa=@MoTa,
                        HinhAnh=@HinhAnh,
                        ChatLieu=@ChatLieu,
                        KichThuoc=@KichThuoc,
                        TrangThai=@HiddenStatus,
                        LyDo=NULL,
                        LoaiTacPham=@LoaiTacPham,
                        TacGiaGoc=@TacGiaGoc,
                        MaTacPhamGoc=@MaTacPhamGoc,
                        MaYeuCauVeTranh=@MaYeuCau,
                        MoTaNguonGoc=@MoTaNguonGoc
                    WHERE MaTacPham=@MaTacPham AND MaYeuCauVeTranh=@MaYeuCau;";
                await using var updateArtwork = new SqlCommand(updateArtworkSql, connection, transaction);
                updateArtwork.Parameters.AddWithValue("@MaTacPham", artworkId.Value);
                updateArtwork.Parameters.AddWithValue("@TenTacPham", artworkName);
                updateArtwork.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
                updateArtwork.Parameters.AddWithValue("@Gia", price);
                updateArtwork.Parameters.AddWithValue("@MoTa", (object?)description ?? DBNull.Value);
                updateArtwork.Parameters.AddWithValue("@HinhAnh", request.HinhAnhTacPham!);
                updateArtwork.Parameters.AddWithValue("@ChatLieu", (object?)material ?? DBNull.Value);
                updateArtwork.Parameters.AddWithValue("@KichThuoc", (object?)size ?? DBNull.Value);
                updateArtwork.Parameters.AddWithValue("@HiddenStatus", TacPhamStatus.Hidden);
                updateArtwork.Parameters.AddWithValue("@LoaiTacPham", artworkType);
                updateArtwork.Parameters.AddWithValue("@TacGiaGoc", (object?)originalAuthor ?? DBNull.Value);
                updateArtwork.Parameters.AddWithValue("@MaTacPhamGoc", (object?)sourceArtworkId ?? DBNull.Value);
                updateArtwork.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
                updateArtwork.Parameters.AddWithValue("@MoTaNguonGoc", (object?)originDescription ?? DBNull.Value);
                if (await updateArtwork.ExecuteNonQueryAsync() != 1)
                    throw new InvalidOperationException("Không thể cập nhật tác phẩm nội bộ của yêu cầu");
            }

            const string completeSql = @"
                UPDATE YeuCauVeTranh SET TrangThai=@Completed, NgayCapNhat=GETDATE()
                WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi
                  AND TrangThai IN (@InProgress,@PreviewSent,@RevisionRequested);";
            await using var complete = new SqlCommand(completeSql, connection, transaction);
            complete.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
            complete.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
            complete.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
            complete.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
            complete.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            complete.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
            if (await complete.ExecuteNonQueryAsync() != 1)
            {
                await transaction.RollbackAsync();
                return null;
            }

            await transaction.CommitAsync();
            return artworkId.Value;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<CustomArtQuote> CreateQuote(BaoGiaTranhRequest request, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string sql = @"
            IF NOT EXISTS (SELECT 1 FROM YeuCauVeTranh WITH (UPDLOCK,HOLDLOCK)
                           WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi AND TrangThai IN (@Assigned,@Quoted))
                THROW 50010, N'Bạn không phụ trách yêu cầu này.', 1;
            UPDATE BaoGiaVeTranh SET IsActive=0
            WHERE MaYeuCau=@MaYeuCau AND IsActive=1;
            INSERT INTO BaoGiaVeTranh
                (MaYeuCau, MaHoaSi, GiaBaoGia, ThoiGianHoanThanh, GhiChu, IsActive, NgayTao, TrangThai)
            OUTPUT INSERTED.MaBaoGia
            VALUES (@MaYeuCau, @MaHoaSi, @GiaBaoGia, @ThoiGianHoanThanh, @GhiChu, 1, GETDATE(), N'PendingCustomerApproval');";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@Assigned", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        command.Parameters.AddWithValue("@GiaBaoGia", request.GiaBaoGia);
        command.Parameters.AddWithValue("@ThoiGianHoanThanh", request.ThoiGianHoanThanh);
        command.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        await using var update = new SqlCommand(@"UPDATE YeuCauVeTranh SET TrangThai=@Quoted,NgayCapNhat=GETDATE()
                                                  WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi;", connection, transaction);
        update.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        update.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        update.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        await update.ExecuteNonQueryAsync();
        await transaction.CommitAsync();
        return await GetQuoteById(id) ?? new CustomArtQuote
        {
            MaBaoGia = id,
            MaYeuCau = request.MaYeuCau,
            MaHoaSi = maHoaSi,
            GiaBaoGia = request.GiaBaoGia,
            ThoiGianHoanThanh = request.ThoiGianHoanThanh
        };
    }

    public async Task<CustomArtQuote?> GetQuoteById(int maBaoGia)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand("SELECT * FROM BaoGiaVeTranh WHERE MaBaoGia=@MaBaoGia", connection);
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapQuote(reader) : null;
    }

    public async Task<CustomArtQuote?> GetLatestQuoteByRequest(int maYeuCau)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT TOP (1) * FROM BaoGiaVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau
                                                   ORDER BY IsActive DESC, MaBaoGia DESC", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapQuote(reader) : null;
    }

    public async Task<bool> ConfirmQuote(int maBaoGia, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string sql = @"
            UPDATE b SET b.TrangThai=N'CustomerAccepted'
            OUTPUT INSERTED.MaYeuCau
            FROM BaoGiaVeTranh b WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN YeuCauVeTranh y WITH (UPDLOCK,HOLDLOCK) ON y.MaYeuCau=b.MaYeuCau
            WHERE b.MaBaoGia=@MaBaoGia AND b.IsActive=1
              AND b.TrangThai=N'PendingCustomerApproval'
              AND y.MaKhachHang=@MaKhachHang AND y.TrangThai=@Quoted;";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        var requestIdValue = await command.ExecuteScalarAsync();
        if (requestIdValue == null)
        {
            await transaction.RollbackAsync();
            return false;
        }
        var requestId = Convert.ToInt32(requestIdValue);
        await using var update = new SqlCommand(@"UPDATE YeuCauVeTranh SET TrangThai=@CustomerAccepted,NgayCapNhat=GETDATE()
                                                  WHERE MaYeuCau=@MaYeuCau AND TrangThai=@Quoted;", connection, transaction);
        update.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        update.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        update.Parameters.AddWithValue("@MaYeuCau", requestId);
        if (await update.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }
        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> CreateDeposit(int maYeuCau, int maKhachHang, decimal soTien)
    {
        return await CreatePayment(maYeuCau, maKhachHang, new TaoThanhToanCustomArtRequest
        {
            SoTien = soTien,
            LoaiThanhToan = "DatCoc",
            PhuongThuc = "ChuyenKhoan"
        }) != null;
    }

    public async Task<int?> CreatePayment(int maYeuCau, int maKhachHang, TaoThanhToanCustomArtRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            if (!string.IsNullOrWhiteSpace(request.KhoaChongTrung))
            {
                await using var existing = new SqlCommand(@"
                    SELECT MaThanhToan,SoTien,LoaiThanhToan,PhuongThuc
                    FROM ThanhToanYeuCau WITH (UPDLOCK,HOLDLOCK)
                    WHERE MaYeuCau=@RequestId AND IdempotencyKey=@IdempotencyKey;", connection, transaction);
                existing.Parameters.AddWithValue("@RequestId", maYeuCau);
                existing.Parameters.AddWithValue("@IdempotencyKey", request.KhoaChongTrung);
                await using var existingReader = await existing.ExecuteReaderAsync();
                if (await existingReader.ReadAsync())
                {
                    var existingId = existingReader.GetInt32(0);
                    var samePayload = existingReader.GetDecimal(1) == request.SoTien
                        && string.Equals(existingReader.GetString(2), request.LoaiThanhToan, StringComparison.Ordinal)
                        && string.Equals(existingReader.GetString(3), request.PhuongThuc, StringComparison.Ordinal);
                    await existingReader.CloseAsync();
                    if (!samePayload)
                        throw new InvalidOperationException("Khóa chống trùng đã được dùng với nội dung thanh toán khác");
                    await transaction.CommitAsync();
                    return existingId;
                }
            }

            await using var check = new SqlCommand(@"
                SELECT q.GiaBaoGia,
                       ISNULL((SELECT SUM(p.SoTien) FROM ThanhToanYeuCau p WITH (UPDLOCK,HOLDLOCK)
                               WHERE p.MaYeuCau=y.MaYeuCau AND p.TrangThai IN (N'Pending',N'Completed')),0)
                FROM YeuCauVeTranh y WITH (UPDLOCK,HOLDLOCK)
                OUTER APPLY (SELECT TOP (1) GiaBaoGia FROM BaoGiaVeTranh
                             WHERE MaYeuCau=y.MaYeuCau AND IsActive=1 AND TrangThai=N'CustomerAccepted'
                             ORDER BY MaBaoGia DESC) q
                WHERE y.MaYeuCau=@RequestId AND y.MaKhachHang=@CustomerId
                  AND y.TrangThai NOT IN (@Rejected,@Cancelled);", connection, transaction);
            check.Parameters.AddWithValue("@RequestId", maYeuCau);
            check.Parameters.AddWithValue("@CustomerId", maKhachHang);
            check.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
            check.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
            await using var reader = await check.ExecuteReaderAsync();
            if (!await reader.ReadAsync() || reader.IsDBNull(0)) return null;
            var quote = reader.GetDecimal(0);
            var alreadyRegistered = reader.GetDecimal(1);
            await reader.CloseAsync();
            if (alreadyRegistered + request.SoTien > quote)
                throw new InvalidOperationException("Tổng các khoản thanh toán vượt quá giá báo giá đã chấp nhận");

            await using var insert = new SqlCommand(@"
                INSERT INTO ThanhToanYeuCau
                    (MaYeuCau,LoaiThanhToan,SoTien,PhuongThuc,TrangThai,NgayThanhToan,MaGiaoDich,GhiChu,IdempotencyKey)
                OUTPUT INSERTED.MaThanhToan
                VALUES(@RequestId,@PaymentType,@Amount,@Method,N'Pending',SYSUTCDATETIME(),@TransactionCode,@Note,@IdempotencyKey);",
                connection, transaction);
            insert.Parameters.AddWithValue("@RequestId", maYeuCau);
            insert.Parameters.AddWithValue("@PaymentType", request.LoaiThanhToan);
            insert.Parameters.AddWithValue("@Amount", request.SoTien);
            insert.Parameters.AddWithValue("@Method", request.PhuongThuc);
            insert.Parameters.AddWithValue("@TransactionCode", (object?)request.MaGiaoDich ?? DBNull.Value);
            insert.Parameters.AddWithValue("@Note", (object?)request.GhiChu ?? DBNull.Value);
            insert.Parameters.AddWithValue("@IdempotencyKey", (object?)request.KhoaChongTrung ?? DBNull.Value);
            var paymentId = Convert.ToInt32(await insert.ExecuteScalarAsync());
            await AuditLogSql.InsertAsync(connection, transaction, "ThanhToanYeuCau", paymentId,
                "PAYMENT_REGISTERED", null, null, after: $"Request={maYeuCau};Amount={request.SoTien};Status=Pending");
            await transaction.CommitAsync();
            return paymentId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> ConfirmPayment(int maThanhToan, int maTaiKhoan, XacNhanThanhToanCustomArtRequest request)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using (var check = new SqlCommand(@"
                SELECT TrangThai,MaGiaoDich FROM ThanhToanYeuCau WITH (UPDLOCK,HOLDLOCK)
                WHERE MaThanhToan=@PaymentId;", connection, transaction))
            {
                check.Parameters.AddWithValue("@PaymentId", maThanhToan);
                await using var reader = await check.ExecuteReaderAsync();
                if (!await reader.ReadAsync()) return false;
                var status = reader.GetString(0);
                var existingTransactionCode = reader.IsDBNull(1) ? null : reader.GetString(1);
                if (status == "Completed")
                {
                    var sameRequest = string.Equals(existingTransactionCode, request.MaGiaoDich, StringComparison.OrdinalIgnoreCase);
                    await reader.CloseAsync();
                    if (sameRequest) { await transaction.CommitAsync(); return true; }
                    throw new InvalidOperationException("Khoản thanh toán đã được xác nhận bằng mã giao dịch khác");
                }
                if (status != "Pending") return false;
            }

            await using (var duplicate = new SqlCommand(@"
                SELECT COUNT_BIG(*) FROM ThanhToanYeuCau WITH (UPDLOCK,HOLDLOCK)
                WHERE MaThanhToan<>@PaymentId AND TrangThai=N'Completed' AND MaGiaoDich=@TransactionCode;",
                connection, transaction))
            {
                duplicate.Parameters.AddWithValue("@PaymentId", maThanhToan);
                duplicate.Parameters.AddWithValue("@TransactionCode", request.MaGiaoDich);
                if (Convert.ToInt64(await duplicate.ExecuteScalarAsync()) != 0)
                    throw new InvalidOperationException("Mã giao dịch đã được dùng để xác nhận khoản thanh toán khác");
            }

            await using var update = new SqlCommand(@"
                UPDATE ThanhToanYeuCau SET TrangThai=N'Completed',MaGiaoDich=@TransactionCode,
                    NguoiXacNhan=@Actor,NgayXacNhan=SYSUTCDATETIME(),NgayThanhToan=SYSUTCDATETIME(),GhiChu=@Note
                OUTPUT INSERTED.MaYeuCau
                WHERE MaThanhToan=@PaymentId AND TrangThai=N'Pending';", connection, transaction);
            update.Parameters.AddWithValue("@TransactionCode", request.MaGiaoDich);
            update.Parameters.AddWithValue("@Actor", maTaiKhoan);
            update.Parameters.AddWithValue("@Note", (object?)request.GhiChu ?? DBNull.Value);
            update.Parameters.AddWithValue("@PaymentId", maThanhToan);
            var requestIdValue = await update.ExecuteScalarAsync();
            if (requestIdValue == null || requestIdValue == DBNull.Value) return false;
            var requestId = Convert.ToInt32(requestIdValue);

            await using var updateRequest = new SqlCommand(@"
                UPDATE y SET TienDatCoc=paid.TotalPaid,
                    TrangThai=CASE WHEN y.TrangThai=@CustomerAccepted THEN @DepositPaid ELSE y.TrangThai END,
                    NgayCapNhat=SYSUTCDATETIME()
                FROM YeuCauVeTranh y
                CROSS APPLY (SELECT ISNULL(SUM(SoTien),0) AS TotalPaid FROM ThanhToanYeuCau
                             WHERE MaYeuCau=y.MaYeuCau AND TrangThai=N'Completed') paid
                WHERE y.MaYeuCau=@RequestId;", connection, transaction);
            updateRequest.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
            updateRequest.Parameters.AddWithValue("@DepositPaid", (int)CustomArtStatus.DepositPaid);
            updateRequest.Parameters.AddWithValue("@RequestId", requestId);
            await updateRequest.ExecuteNonQueryAsync();
            await AuditLogSql.InsertAsync(connection, transaction, "ThanhToanYeuCau", maThanhToan,
                "PAYMENT_CONFIRMED", maTaiKhoan, 0, after: $"Request={requestId};Transaction={request.MaGiaoDich}");
            await OwnershipCertificateSql.TryIssueForCustomArtAsync(
                connection, transaction, requestId, maTaiKhoan, _copyrightOptions.CertificateHashKey);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> ConfirmHandover(int maYeuCau, int maKhachHang, int maTaiKhoan, string? note)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using (var check = new SqlCommand(@"
                SELECT TrangThai,TrangThaiBanGiao FROM YeuCauVeTranh WITH (UPDLOCK,HOLDLOCK)
                WHERE MaYeuCau=@RequestId AND MaKhachHang=@CustomerId;", connection, transaction))
            {
                check.Parameters.AddWithValue("@RequestId", maYeuCau);
                check.Parameters.AddWithValue("@CustomerId", maKhachHang);
                await using var reader = await check.ExecuteReaderAsync();
                if (!await reader.ReadAsync()) return false;
                var status = reader.GetInt32(0);
                var handover = reader.GetByte(1);
                if (status != (int)CustomArtStatus.Completed) return false;
                if (handover == 1)
                {
                    await reader.CloseAsync();
                    await transaction.CommitAsync();
                    return true;
                }
            }

            await using var update = new SqlCommand(@"
                UPDATE YeuCauVeTranh SET TrangThaiBanGiao=1,NgayBanGiao=SYSUTCDATETIME(),
                    NguoiXacNhanBanGiao=@Actor,GhiChuBanGiao=@Note,NgayCapNhat=SYSUTCDATETIME()
                WHERE MaYeuCau=@RequestId AND MaKhachHang=@CustomerId AND TrangThai=@Completed
                  AND TrangThaiBanGiao=0;", connection, transaction);
            update.Parameters.AddWithValue("@Actor", maTaiKhoan);
            update.Parameters.AddWithValue("@Note", (object?)note ?? DBNull.Value);
            update.Parameters.AddWithValue("@RequestId", maYeuCau);
            update.Parameters.AddWithValue("@CustomerId", maKhachHang);
            update.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
            if (await update.ExecuteNonQueryAsync() != 1) return false;
            await AuditLogSql.InsertAsync(connection, transaction, "YeuCauVeTranh", maYeuCau,
                "PHYSICAL_HANDOVER_CONFIRMED", maTaiKhoan, 1, after: "TrangThaiBanGiao=1", reason: note);
            await OwnershipCertificateSql.TryIssueForCustomArtAsync(
                connection, transaction, maYeuCau, maTaiKhoan, _copyrightOptions.CertificateHashKey);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<CustomArtPayment>> GetPaymentsByRequest(int maYeuCau)
    {
        var result = new List<CustomArtPayment>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT MaThanhToan,MaYeuCau,LoaiThanhToan,SoTien,PhuongThuc,TrangThai,NgayThanhToan,
                   MaGiaoDich,NguoiXacNhan,NgayXacNhan,GhiChu
            FROM ThanhToanYeuCau WHERE MaYeuCau=@RequestId ORDER BY MaThanhToan;", connection);
        command.Parameters.AddWithValue("@RequestId", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new CustomArtPayment
        {
            MaThanhToan = reader.GetInt32(0), MaYeuCau = reader.GetInt32(1),
            LoaiThanhToan = reader.GetString(2), SoTien = reader.GetDecimal(3), PhuongThuc = reader.GetString(4),
            TrangThai = reader.GetString(5), NgayThanhToan = reader.GetDateTime(6),
            MaGiaoDich = reader.IsDBNull(7) ? null : reader.GetString(7),
            NguoiXacNhan = reader.IsDBNull(8) ? null : reader.GetInt32(8),
            NgayXacNhan = reader.IsDBNull(9) ? null : reader.GetDateTime(9),
            GhiChu = reader.IsDBNull(10) ? null : reader.GetString(10)
        });
        return result;
    }

    public async Task<bool> CreateProgress(TaoTienDoRequest request, int maHoaSi)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        const string insert = @"
            INSERT INTO TienDoVeTranh (MaYeuCau, TieuDe, MoTa, AnhPreview, TrangThai, NgayTao)
            SELECT @MaYeuCau, @TieuDe, @MoTa, @AnhPreview, @ProgressStatus, GETDATE()
            WHERE EXISTS (SELECT 1 FROM YeuCauVeTranh
                          WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi
                            AND TrangThai IN (@InProgress,@PreviewSent,@RevisionRequested));";
        await using var command = new SqlCommand(insert, connection, transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe);
        command.Parameters.AddWithValue("@MoTa", request.MoTa);
        command.Parameters.AddWithValue("@AnhPreview", (object?)request.AnhPreview ?? DBNull.Value);
        command.Parameters.AddWithValue("@ProgressStatus", request.TrangThai);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        if (await command.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }
        const string update = "UPDATE YeuCauVeTranh SET TrangThai=@TrangThai, NgayCapNhat=GETDATE() WHERE MaYeuCau=@MaYeuCau AND MaHoaSi=@MaHoaSi";
        await using var updateCommand = new SqlCommand(update, connection, transaction);
        updateCommand.Parameters.AddWithValue("@TrangThai", request.TrangThai.Equals("PreviewSent", StringComparison.OrdinalIgnoreCase) ? (int)CustomArtStatus.PreviewSent : (int)CustomArtStatus.InProgress);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        updateCommand.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        await updateCommand.ExecuteNonQueryAsync();
        await transaction.CommitAsync();
        return true;
    }

    public async Task<List<CustomArtProgress>> GetProgressByRequest(int maYeuCau)
    {
        var result = new List<CustomArtProgress>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT * FROM TienDoVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau ORDER BY NgayTao,MaTienDo", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapProgress(reader));
        return result;
    }

    public async Task<CustomArtProgress?> GetProgressById(int maYeuCau, int maTienDo)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"SELECT * FROM TienDoVeTranh
                                                   WHERE MaYeuCau=@MaYeuCau AND MaTienDo=@MaTienDo", connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaTienDo", maTienDo);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapProgress(reader) : null;
    }

    public async Task<bool> CreateFeedback(TaoPhanHoiRequest request, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        const string sql = @"
            INSERT INTO PhanHoiVeTranh (MaYeuCau, MaKhachHang, MaHoaSi, NoiDung, LoaiPhanHoi, NgayTao)
            SELECT y.MaYeuCau, y.MaKhachHang, y.MaHoaSi, @NoiDung, @LoaiPhanHoi, GETDATE()
            FROM YeuCauVeTranh y
            WHERE y.MaYeuCau=@MaYeuCau AND y.MaKhachHang=@MaKhachHang AND y.MaHoaSi IS NOT NULL;";
        await using var command = new SqlCommand(sql, connection, (SqlTransaction)transaction);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@NoiDung", request.NoiDung);
        command.Parameters.AddWithValue("@LoaiPhanHoi", request.LoaiPhanHoi);
        if (await command.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }

        const string update = @"
            UPDATE YeuCauVeTranh
            SET TrangThai=@RevisionRequested, NgayCapNhat=GETDATE()
            WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang;";
        await using var updateCommand = new SqlCommand(update, connection, (SqlTransaction)transaction);
        updateCommand.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        updateCommand.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        if (await updateCommand.ExecuteNonQueryAsync() != 1)
        {
            await transaction.RollbackAsync();
            return false;
        }

        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> ConfirmComplete(int maYeuCau, int maKhachHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string sql = @"UPDATE YeuCauVeTranh SET TrangThai=@Completed, NgayCapNhat=GETDATE()
                             WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND TrangThai IN (@InProgress,@PreviewSent,@RevisionRequested);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> UpdateStoredFilePath(int maYeuCau, int maKhachHang, string fileKind, string storedPath)
    {
        var column = fileKind switch
        {
            "reference" => "AnhThamKhao",
            "source" => "ReferenceImageUrl",
            "evidence" => "BangChungQuyenSuDung",
            _ => throw new ArgumentException("Loại tệp không hợp lệ")
        };
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var sql = $@"UPDATE YeuCauVeTranh
                     SET [{column}]=@StoredPath,
                         TrangThai=CASE
                             WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork)
                                 THEN CASE WHEN TinhTrangQuyenSuDung=@Unsure THEN @WaitingPermission ELSE @Pending END
                             ELSE TrangThai
                         END,
                         GhiChuKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE GhiChuKiemDuyet END,
                         NguoiKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE NguoiKiemDuyet END,
                         NgayKiemDuyet=CASE WHEN [Type] IN (@ExistingArtwork,@LegacyExistingArtwork) THEN NULL ELSE NgayKiemDuyet END,
                         NgayCapNhat=GETDATE()
                     WHERE MaYeuCau=@MaYeuCau AND MaKhachHang=@MaKhachHang AND MaHoaSi IS NULL
                       AND TrangThai NOT IN (@Completed,@Rejected,@Cancelled);";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@StoredPath", storedPath);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@Completed", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@Rejected", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@Cancelled", (int)CustomArtStatus.Cancelled);
        command.Parameters.AddWithValue("@ExistingArtwork", (int)CustomArtType.BasedOnArtwork);
        command.Parameters.AddWithValue("@LegacyExistingArtwork", (int)CustomArtType.Reproduction);
        command.Parameters.AddWithValue("@Unsure", (int)PermissionUsageStatus.Unsure);
        command.Parameters.AddWithValue("@WaitingPermission", (int)CustomArtStatus.WaitingPermission);
        command.Parameters.AddWithValue("@Pending", (int)CustomArtStatus.Submitted);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    private async Task<List<CustomArtRequest>> QueryRequests(string sql, Action<SqlCommand>? configure)
    {
        var result = new List<CustomArtRequest>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        configure?.Invoke(command);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(Map(reader));
        return result;
    }

    private static void AddRequestParameters(SqlCommand command, int maKhachHang, TaoYeuCauTranhRequest request, CustomArtStatus status, PermissionUsageStatus? permissionStatus)
    {
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe.Trim());
        command.Parameters.AddWithValue("@LoaiTranh", request.LoaiTranh.Trim());
        command.Parameters.AddWithValue("@KichThuoc", request.KichThuoc.Trim());
        command.Parameters.AddWithValue("@ChuDe", Db(request.ChuDe));
        command.Parameters.AddWithValue("@MauSac", Db(request.MauSac));
        command.Parameters.AddWithValue("@PhongCach", Db(request.PhongCach));
        command.Parameters.AddWithValue("@ChatLieu", Db(request.ChatLieu));
        command.Parameters.AddWithValue("@MoTa", Db(request.MoTa));
        command.Parameters.AddWithValue("@AnhThamKhao", Db(request.AnhThamKhao));
        command.Parameters.AddWithValue("@Type", (int)ParseCustomArtType(request.Type));
        command.Parameters.AddWithValue("@ReferenceArtworkId", (object?)request.ReferenceArtworkId ?? DBNull.Value);
        command.Parameters.AddWithValue("@ReferenceArtworkName", Db(request.ReferenceArtworkName));
        command.Parameters.AddWithValue("@ReferenceArtistName", Db(request.ReferenceArtistName));
        command.Parameters.AddWithValue("@ReferenceImageUrl", Db(request.ReferenceImageUrl));
        command.Parameters.AddWithValue("@NguonTacPhamGoc", Db(request.NguonTacPhamGoc));
        command.Parameters.AddWithValue("@TinhTrangQuyenSuDung", permissionStatus.HasValue ? (byte)permissionStatus.Value : DBNull.Value);
        command.Parameters.AddWithValue("@DaXacNhanQuyenTaiLieu", request.DaXacNhanQuyenTaiLieu);
        command.Parameters.AddWithValue("@MoTaQuyenSuDung", Db(request.MoTaQuyenSuDung));
        command.Parameters.AddWithValue("@BangChungQuyenSuDung", Db(request.BangChungQuyenSuDung));
        command.Parameters.AddWithValue("@GiaDuKien", request.GiaDuKien);
        command.Parameters.AddWithValue("@TrangThai", (int)status);
        command.Parameters.AddWithValue("@NgayHoanThanhDuKien", (object?)request.NgayHoanThanhDuKien ?? DBNull.Value);
    }

    private static void AddActiveStatusParameters(SqlCommand command)
    {
        command.Parameters.AddWithValue("@Accepted", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@Quoted", (int)CustomArtStatus.Quoted);
        command.Parameters.AddWithValue("@CustomerAccepted", (int)CustomArtStatus.CustomerAccepted);
        command.Parameters.AddWithValue("@DepositPaid", (int)CustomArtStatus.DepositPaid);
        command.Parameters.AddWithValue("@InProgress", (int)CustomArtStatus.InProgress);
        command.Parameters.AddWithValue("@PreviewSent", (int)CustomArtStatus.PreviewSent);
        command.Parameters.AddWithValue("@RevisionRequested", (int)CustomArtStatus.RevisionRequested);
    }

    private static bool IsActiveArtistStatus(CustomArtStatus status) => status is
        CustomArtStatus.Assigned or CustomArtStatus.Quoted or CustomArtStatus.CustomerAccepted or
        CustomArtStatus.DepositPaid or CustomArtStatus.InProgress or CustomArtStatus.PreviewSent or
        CustomArtStatus.RevisionRequested;

    private static object Db(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    private static CustomArtRequest Map(SqlDataReader reader) => new()
    {
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        MaKhachHang = reader.GetInt32(reader.GetOrdinal("MaKhachHang")),
        MaHoaSi = GetNullableInt(reader, "MaHoaSi"),
        TieuDe = GetNullableString(reader, "TieuDe") ?? string.Empty,
        LoaiTranh = GetNullableString(reader, "LoaiTranh") ?? string.Empty,
        KichThuoc = GetNullableString(reader, "KichThuoc") ?? string.Empty,
        ChuDe = GetNullableString(reader, "ChuDe") ?? string.Empty,
        MauSac = GetNullableString(reader, "MauSac") ?? string.Empty,
        PhongCach = GetNullableString(reader, "PhongCach") ?? string.Empty,
        ChatLieu = GetNullableString(reader, "ChatLieu") ?? string.Empty,
        MoTa = GetNullableString(reader, "MoTa"),
        AnhThamKhao = GetNullableString(reader, "AnhThamKhao"),
        Type = ParseCustomArtType(reader.GetInt32(reader.GetOrdinal("Type"))),
        ReferenceArtworkId = GetNullableInt(reader, "ReferenceArtworkId"),
        ReferenceArtworkName = GetNullableString(reader, "ReferenceArtworkName"),
        ReferenceArtistName = GetNullableString(reader, "ReferenceArtistName"),
        ReferenceImageUrl = GetNullableString(reader, "ReferenceImageUrl"),
        NguonTacPhamGoc = GetNullableString(reader, "NguonTacPhamGoc"),
        TinhTrangQuyenSuDung = GetNullableByte(reader, "TinhTrangQuyenSuDung") is byte permission ? (PermissionUsageStatus)permission : null,
        DaXacNhanQuyenTaiLieu = !reader.IsDBNull(reader.GetOrdinal("DaXacNhanQuyenTaiLieu")) && reader.GetBoolean(reader.GetOrdinal("DaXacNhanQuyenTaiLieu")),
        MoTaQuyenSuDung = GetNullableString(reader, "MoTaQuyenSuDung"),
        BangChungQuyenSuDung = GetNullableString(reader, "BangChungQuyenSuDung"),
        GhiChuKiemDuyet = GetNullableString(reader, "GhiChuKiemDuyet"),
        NguoiKiemDuyet = GetNullableInt(reader, "NguoiKiemDuyet"),
        NgayKiemDuyet = GetNullableDateTime(reader, "NgayKiemDuyet"),
        TienDatCoc = reader.GetDecimal(reader.GetOrdinal("TienDatCoc")),
        GiaDuKien = reader.GetDecimal(reader.GetOrdinal("GiaDuKien")),
        TrangThai = (CustomArtStatus)reader.GetInt32(reader.GetOrdinal("TrangThai")),
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
        NgayCapNhat = GetNullableDateTime(reader, "NgayCapNhat"),
        NgayHoanThanhDuKien = GetNullableDateTime(reader, "NgayHoanThanhDuKien"),
        TenKhachHang = GetNullableString(reader, "TenKhachHang"),
        TenHoaSiThucHien = GetNullableString(reader, "TenHoaSiThucHien"),
        MaTacPhamKetQua = GetNullableInt(reader, "MaTacPhamKetQua"),
        SoLuongTienDo = reader.GetInt32(reader.GetOrdinal("SoLuongTienDo")),
        TrangThaiBanGiao = GetNullableByte(reader, "TrangThaiBanGiao") ?? 0,
        NgayBanGiao = GetNullableDateTime(reader, "NgayBanGiao"),
        NguoiXacNhanBanGiao = GetNullableInt(reader, "NguoiXacNhanBanGiao"),
        GhiChuBanGiao = GetNullableString(reader, "GhiChuBanGiao")
    };

    private static CustomArtQuote MapQuote(SqlDataReader reader) => new()
    {
        MaBaoGia = reader.GetInt32(reader.GetOrdinal("MaBaoGia")),
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
        GiaBaoGia = reader.GetDecimal(reader.GetOrdinal("GiaBaoGia")),
        ThoiGianHoanThanh = GetNullableString(reader, "ThoiGianHoanThanh") ?? string.Empty,
        GhiChu = GetNullableString(reader, "GhiChu"),
        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
        TrangThai = GetNullableString(reader, "TrangThai") ?? "PendingCustomerApproval"
    };

    private static CustomArtProgress MapProgress(SqlDataReader reader) => new()
    {
        MaTienDo = reader.GetInt32(reader.GetOrdinal("MaTienDo")),
        MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
        TieuDe = GetNullableString(reader, "TieuDe") ?? string.Empty,
        MoTa = GetNullableString(reader, "MoTa") ?? string.Empty,
        AnhPreview = GetNullableString(reader, "AnhPreview"),
        TrangThai = GetNullableString(reader, "TrangThai") ?? "InProgress",
        NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao"))
    };

    private static CustomArtType ParseCustomArtType(string? type) => type?.Trim().ToUpperInvariant() switch
    {
        "ORIGINAL" or "ORIGINAL_COMMISSION" => CustomArtType.Original,
        "BASEDONARTWORK" or "EXISTING_ARTWORK" => CustomArtType.BasedOnArtwork,
        "REPRODUCTION" => CustomArtType.Reproduction,
        "PERSONALREFERENCE" or "PERSONAL_REFERENCE" => CustomArtType.PersonalReference,
        _ => CustomArtType.Original
    };

    private static CustomArtType ParseCustomArtType(int type) => Enum.IsDefined(typeof(CustomArtType), type)
        ? (CustomArtType)type
        : CustomArtType.Original;

    private static string? GetNullableString(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetString(reader.GetOrdinal(column)) : null;

    private static int? GetNullableInt(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetInt32(reader.GetOrdinal(column)) : null;

    private static byte? GetNullableByte(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetByte(reader.GetOrdinal(column)) : null;

    private static DateTime? GetNullableDateTime(SqlDataReader reader, string column) =>
        HasColumn(reader, column) && !reader.IsDBNull(reader.GetOrdinal(column)) ? reader.GetDateTime(reader.GetOrdinal(column)) : null;

    private static bool HasColumn(SqlDataReader reader, string column) =>
        Enumerable.Range(0, reader.FieldCount).Any(i => reader.GetName(i).Equals(column, StringComparison.OrdinalIgnoreCase));
}
