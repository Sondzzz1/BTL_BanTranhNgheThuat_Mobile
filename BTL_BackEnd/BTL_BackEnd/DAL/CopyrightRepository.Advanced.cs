using System.Data;
using System.Text.Json;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public partial class CopyrightRepository
{
    public Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword)
    {
        var filters = new List<string>();
        var parsedStatus = ParseStatus(status);
        if (parsedStatus.HasValue) filters.Add("b.TrangThai=@Status");
        if (!string.IsNullOrWhiteSpace(keyword))
            filters.Add("(t.TenTacPham LIKE @Keyword OR h.TenHoaSi LIKE @Keyword OR b.TacGia LIKE @Keyword)");
        var sql = CopyrightSelect + (filters.Count == 0 ? string.Empty : " WHERE " + string.Join(" AND ", filters))
            + " ORDER BY b.NgayCapNhat DESC";
        return QueryMany(sql, command =>
        {
            if (parsedStatus.HasValue) command.Parameters.AddWithValue("@Status", parsedStatus.Value);
            if (!string.IsNullOrWhiteSpace(keyword)) command.Parameters.AddWithValue("@Keyword", $"%{keyword.Trim()}%");
        });
    }

    public Task<BanQuyenResponse?> GetForAdminById(int maBanQuyen) =>
        QueryOne(CopyrightSelect + " WHERE b.MaBanQuyen=@Id", command => command.Parameters.AddWithValue("@Id", maBanQuyen));

    public async Task<bool> VerifyInitialQuantity(
        int maTacPham,
        int maTaiKhoan,
        int soLuongBanDau,
        string canCuXacMinh)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            int currentStock;
            int? currentInitialQuantity;
            bool exclusive;
            await using (var check = new SqlCommand(@"
                SELECT SoLuong,SoLuongBanDau,LaTacPhamDocBan
                FROM TacPham WITH (UPDLOCK,HOLDLOCK)
                WHERE MaTacPham=@ArtworkId;", connection, transaction))
            {
                check.Parameters.AddWithValue("@ArtworkId", maTacPham);
                await using var reader = await check.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                currentStock = reader.GetInt32(0);
                currentInitialQuantity = reader.IsDBNull(1) ? null : reader.GetInt32(1);
                exclusive = reader.GetBoolean(2);
            }

            ExclusiveArtworkPolicy.EnsureAdminInitialQuantityAllowed(
                currentStock,
                soLuongBanDau,
                exclusive);

            if (currentInitialQuantity.HasValue)
            {
                if (currentInitialQuantity.Value != soLuongBanDau)
                    throw new BusinessConflictException(
                        "Số lượng ban đầu đã được ghi nhận và không được ghi đè; cần quy trình hiệu chỉnh dữ liệu riêng");

                // Retry cùng giá trị là idempotent và không tạo thêm sự kiện audit.
                await transaction.CommitAsync();
                return true;
            }

            await using var update = new SqlCommand(@"
                UPDATE TacPham
                SET SoLuongBanDau=@InitialQuantity
                WHERE MaTacPham=@ArtworkId AND SoLuongBanDau IS NULL;", connection, transaction);
            update.Parameters.AddWithValue("@InitialQuantity", soLuongBanDau);
            update.Parameters.AddWithValue("@ArtworkId", maTacPham);
            if (await update.ExecuteNonQueryAsync() != 1)
                throw new DBConcurrencyException("Số lượng ban đầu đã được thay đổi bởi một yêu cầu khác");

            await AuditLogSql.InsertAsync(
                connection,
                transaction,
                "TacPham",
                maTacPham,
                "VERIFY_INITIAL_QUANTITY",
                maTaiKhoan,
                1,
                before: JsonSerializer.Serialize(new
                {
                    soLuongBanDau = (int?)null,
                    soLuongTon = currentStock,
                    laTacPhamDocBan = exclusive
                }),
                after: JsonSerializer.Serialize(new
                {
                    soLuongBanDau,
                    soLuongTon = currentStock,
                    laTacPhamDocBan = exclusive
                }),
                reason: canCuXacMinh);

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> CorrectPublicationDeclaration(
        int maTacPham,
        int maTaiKhoan,
        bool laTacPhamDocBan,
        int soLuongBanDau,
        string canCuXacMinh)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            int currentStock;
            int? currentInitialQuantity;
            bool currentExclusive;
            byte? copyrightStatus;
            await using (var check = new SqlCommand(@"
                SELECT t.SoLuong,t.SoLuongBanDau,t.LaTacPhamDocBan,
                       (SELECT TOP (1) b.TrangThai FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK)
                        WHERE b.MaTacPham=t.MaTacPham ORDER BY b.MaBanQuyen DESC),
                       CASE WHEN EXISTS (SELECT 1 FROM ChiTietDonHang c WITH (UPDLOCK,HOLDLOCK)
                                         WHERE c.MaTacPham=t.MaTacPham)
                                  OR EXISTS (SELECT 1 FROM LichSuSoHuu l WITH (UPDLOCK,HOLDLOCK)
                                             WHERE l.MaTacPham=t.MaTacPham)
                                  OR EXISTS (SELECT 1 FROM ChungNhan cn WITH (UPDLOCK,HOLDLOCK)
                                             WHERE cn.MaTacPham=t.MaTacPham)
                            THEN 1 ELSE 0 END
                FROM TacPham t WITH (UPDLOCK,HOLDLOCK)
                WHERE t.MaTacPham=@ArtworkId AND t.MaYeuCauVeTranh IS NULL;", connection, transaction))
            {
                check.Parameters.AddWithValue("@ArtworkId", maTacPham);
                await using var reader = await check.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return false;
                }
                currentStock = reader.GetInt32(0);
                currentInitialQuantity = reader.IsDBNull(1) ? null : reader.GetInt32(1);
                currentExclusive = reader.GetBoolean(2);
                copyrightStatus = reader.IsDBNull(3) ? null : reader.GetByte(3);
                if (reader.GetInt32(4) == 1)
                    throw new BusinessConflictException(
                        "Không thể hiệu chỉnh loại phát hành vì tác phẩm đã có đơn hàng, lịch sử sở hữu hoặc chứng nhận");
            }

            ExclusiveArtworkPolicy.EnsureAdminInitialQuantityAllowed(currentStock, soLuongBanDau, laTacPhamDocBan);
            if (!laTacPhamDocBan && soLuongBanDau < 2)
                throw new InvalidOperationException("Tranh nhiều bản phải có số lượng ban đầu từ 2 trở lên");

            await using (var update = new SqlCommand(@"
                UPDATE TacPham
                SET LaTacPhamDocBan=@Exclusive,SoLuongBanDau=@InitialQuantity,
                    SoLuong=CASE WHEN @Exclusive=1 THEN 1 ELSE SoLuong END
                WHERE MaTacPham=@ArtworkId;", connection, transaction))
            {
                update.Parameters.AddWithValue("@Exclusive", laTacPhamDocBan);
                update.Parameters.AddWithValue("@InitialQuantity", soLuongBanDau);
                update.Parameters.AddWithValue("@ArtworkId", maTacPham);
                if (await update.ExecuteNonQueryAsync() != 1)
                    throw new DBConcurrencyException("Tác phẩm đã thay đổi trong lúc hiệu chỉnh");
            }

            if (copyrightStatus == CopyrightStatuses.Verified)
            {
                await using var resetReview = new SqlCommand(@"
                    UPDATE BanQuyen
                    SET TrangThai=@Pending,NgayKiemDuyet=NULL,
                        GhiChuKiemDuyet=N'Loại phát hành hoặc số lượng ban đầu đã được Admin hiệu chỉnh; cần xác minh lại hồ sơ.',
                        NguoiCapNhat=@Actor,NgayCapNhat=SYSUTCDATETIME()
                    WHERE MaTacPham=@ArtworkId AND TrangThai=@Verified;", connection, transaction);
                resetReview.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
                resetReview.Parameters.AddWithValue("@Verified", CopyrightStatuses.Verified);
                resetReview.Parameters.AddWithValue("@Actor", maTaiKhoan);
                resetReview.Parameters.AddWithValue("@ArtworkId", maTacPham);
                await resetReview.ExecuteNonQueryAsync();
            }

            await AuditLogSql.InsertAsync(connection, transaction, "TacPham", maTacPham,
                "CORRECT_PUBLICATION_DECLARATION", maTaiKhoan, 1,
                before: JsonSerializer.Serialize(new
                {
                    laTacPhamDocBan = currentExclusive,
                    soLuongBanDau = currentInitialQuantity,
                    soLuongTon = currentStock,
                    banQuyen = copyrightStatus
                }),
                after: JsonSerializer.Serialize(new
                {
                    laTacPhamDocBan,
                    soLuongBanDau,
                    soLuongTon = laTacPhamDocBan ? 1 : currentStock,
                    requiresReverification = copyrightStatus == CopyrightStatuses.Verified
                }),
                reason: canCuXacMinh);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> Review(int maBanQuyen, int maTaiKhoan, byte status, string? note)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var check = new SqlCommand(@"
                SELECT b.TrangThai,b.MaTacPham,b.CanCuSuDung,t.MaHoaSi,t.LaTacPhamDocBan,
                       t.SoLuongBanDau,t.LoaiTacPham,t.TacGiaGoc,t.MaTacPhamGoc,t.MoTaNguonGoc,
                       t.MaYeuCauVeTranh,
                       (SELECT COUNT_BIG(*) FROM BangChungBanQuyen e WHERE e.MaBanQuyen=b.MaBanQuyen),
                       t.TenTacPham,h.MaTaiKhoan,b.NgayCapNhat
                FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaTacPham=b.MaTacPham
                INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
                WHERE b.MaBanQuyen=@Id;", connection, transaction);
            check.Parameters.AddWithValue("@Id", maBanQuyen);
            await using var reader = await check.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return false;
            var oldStatus = reader.GetByte(0);
            var artworkId = reader.GetInt32(1);
            byte? usageBasis = reader.IsDBNull(2) ? null : reader.GetByte(2);
            var artistId = reader.GetInt32(3);
            var exclusive = reader.GetBoolean(4);
            int? initialQuantity = reader.IsDBNull(5) ? null : reader.GetInt32(5);
            var artworkType = reader.GetByte(6);
            var hasOrigin = !reader.IsDBNull(7) || !reader.IsDBNull(8) || !reader.IsDBNull(9);
            int? customArtRequestId = reader.IsDBNull(10) ? null : reader.GetInt32(10);
            var evidenceCount = reader.GetInt64(11);
            var artworkName = reader.GetString(12);
            var artistAccountId = reader.GetInt32(13);
            var reviewRevision = reader.GetDateTime(14);
            await reader.CloseAsync();
            if (oldStatus != CopyrightStatuses.Pending) return false;

            if (status == CopyrightStatuses.Verified)
            {
                if (evidenceCount is < 2 or > 10)
                    throw new InvalidOperationException("Chỉ xác minh hồ sơ có từ 2 đến 10 bằng chứng");
                if (!CopyrightUsageBases.IsValid(usageBasis) || usageBasis == CopyrightUsageBases.Insufficient)
                    throw new InvalidOperationException("Căn cứ sử dụng chưa hợp lệ để xác minh nguồn gốc");
                if (artworkType == 2 && !hasOrigin)
                    throw new InvalidOperationException("Phiên bản vẽ lại phải có tác giả gốc, tác phẩm gốc hoặc mô tả nguồn gốc");
                if (exclusive && initialQuantity != 1)
                    throw new InvalidOperationException("Không thể xác minh độc bản khi số lượng ban đầu chưa được đối soát bằng 1");
            }

            await using var update = new SqlCommand(@"
                UPDATE BanQuyen SET TrangThai=@Status,GhiChuKiemDuyet=@Note,
                    NguoiKiemDuyet=@Actor,NgayKiemDuyet=SYSUTCDATETIME(),NguoiCapNhat=@Actor,
                    NgayCapNhat=SYSUTCDATETIME(),
                    BiChanBan=CASE WHEN @Status=@Verified THEN 0 WHEN @Status=@Rejected THEN 1 ELSE BiChanBan END,
                    NgayThuHoiXacMinh=CASE WHEN @Status=@Verified THEN NULL ELSE NgayThuHoiXacMinh END,
                    LyDoThuHoiXacMinh=CASE WHEN @Status=@Verified THEN NULL ELSE LyDoThuHoiXacMinh END
                WHERE MaBanQuyen=@Id AND TrangThai=@Pending;", connection, transaction);
            update.Parameters.AddWithValue("@Status", status);
            update.Parameters.AddWithValue("@Note", Db(note));
            update.Parameters.AddWithValue("@Actor", maTaiKhoan);
            update.Parameters.AddWithValue("@Id", maBanQuyen);
            update.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
            update.Parameters.AddWithValue("@Verified", CopyrightStatuses.Verified);
            update.Parameters.AddWithValue("@Rejected", CopyrightStatuses.Rejected);
            if (await update.ExecuteNonQueryAsync() != 1) return false;

            if (status == CopyrightStatuses.Verified && exclusive)
            {
                await using var initialOwner = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@ArtworkId)
                        INSERT INTO LichSuSoHuu
                            (MaTacPham,MaHoaSi,NgayNhan,LoaiChuyenGiao,TrangThai,GhiChu,EventKey,NgayTao)
                        VALUES(@ArtworkId,@ArtistId,SYSUTCDATETIME(),0,@Current,
                               N'Quyền sở hữu hiện vật ban đầu của họa sĩ',@EventKey,SYSUTCDATETIME());",
                    connection, transaction);
                initialOwner.Parameters.AddWithValue("@ArtworkId", artworkId);
                initialOwner.Parameters.AddWithValue("@ArtistId", artistId);
                initialOwner.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
                initialOwner.Parameters.AddWithValue("@EventKey", $"CREATION:{artworkId}");
                await initialOwner.ExecuteNonQueryAsync();
            }

            if (status == CopyrightStatuses.Verified)
            {
                if (customArtRequestId.HasValue)
                    await OwnershipCertificateSql.TryIssueForCustomArtAsync(
                        connection, transaction, customArtRequestId.Value, maTaiKhoan, _options.CertificateHashKey);
                else if (exclusive)
                    await OwnershipCertificateSql.TryIssueForVerifiedMarketplaceArtworkAsync(
                        connection, transaction, artworkId, maTaiKhoan, _options.CertificateHashKey,
                        _options.EnforcementStartUtc);
            }

            var isNeedInfo = status == CopyrightStatuses.NeedInfo;
            var notification = new ThongBao
            {
                MaTaiKhoan = artistAccountId,
                Loai = status == CopyrightStatuses.Verified ? "COPYRIGHT_VERIFIED"
                    : isNeedInfo ? "COPYRIGHT_NEED_INFO" : "COPYRIGHT_REJECTED",
                TieuDe = status == CopyrightStatuses.Verified ? "Hồ sơ nguồn gốc đã được xác minh"
                    : isNeedInfo ? "Cần bổ sung hồ sơ bản quyền" : "Hồ sơ bản quyền bị từ chối",
                NoiDung = status == CopyrightStatuses.Verified
                    ? $"Hồ sơ nguồn gốc của tác phẩm “{artworkName}” đã được xác minh."
                    : $"Tác phẩm “{artworkName}”: {note}",
                LoaiDoiTuong = "BanQuyen",
                MaDoiTuong = maBanQuyen,
                DuongDan = $"/artist/artworks/{artworkId}/copyright",
                EventKey = $"COPYRIGHT_REVIEW:{maBanQuyen}:{status}:{reviewRevision.Ticks}"
            };
            await ThongBaoSql.InsertAsync(connection, transaction, notification);

            await AuditLogSql.InsertAsync(connection, transaction, "BanQuyen", maBanQuyen, "REVIEW", maTaiKhoan, 1,
                before: JsonSerializer.Serialize(new { status = oldStatus }),
                after: JsonSerializer.Serialize(new { status }), reason: note);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RevokeVerification(int maBanQuyen, int maTaiKhoan, string reason, bool hideArtwork)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var check = new SqlCommand(@"
                SELECT b.MaTacPham,b.TrangThai,t.TenTacPham,h.MaTaiKhoan,b.NgayCapNhat
                FROM BanQuyen b WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
                INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
                WHERE b.MaBanQuyen=@Id;", connection, transaction);
            check.Parameters.AddWithValue("@Id", maBanQuyen);
            await using var reader = await check.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return false;
            var artworkId = reader.GetInt32(0);
            var oldStatus = reader.GetByte(1);
            var artworkName = reader.GetString(2);
            var artistAccountId = reader.GetInt32(3);
            var reviewRevision = reader.GetDateTime(4);
            await reader.CloseAsync();
            if (oldStatus != CopyrightStatuses.Verified)
                throw new InvalidOperationException("Chỉ được thu hồi hồ sơ đang ở trạng thái đã xác minh");

            await using var update = new SqlCommand(@"
                UPDATE BanQuyen SET TrangThai=@Revoked,BiChanBan=1,NgayThuHoiXacMinh=SYSUTCDATETIME(),
                    LyDoThuHoiXacMinh=@Reason,NguoiCapNhat=@Actor,NgayCapNhat=SYSUTCDATETIME()
                WHERE MaBanQuyen=@Id AND TrangThai=@Verified;
                UPDATE ChungNhan SET TrangThai=@CertificateRevoked,NgayThuHoi=SYSUTCDATETIME(),LyDoThuHoi=@Reason
                WHERE MaTacPham=@ArtworkId AND TrangThai=@CertificateActive;
                UPDATE TacPham SET TrangThai=CASE WHEN @Hide=1 AND TrangThai=1 THEN 2 ELSE TrangThai END
                WHERE MaTacPham=@ArtworkId;", connection, transaction);
            update.Parameters.AddWithValue("@Revoked", CopyrightStatuses.Revoked);
            update.Parameters.AddWithValue("@Reason", reason);
            update.Parameters.AddWithValue("@Actor", maTaiKhoan);
            update.Parameters.AddWithValue("@Id", maBanQuyen);
            update.Parameters.AddWithValue("@Verified", CopyrightStatuses.Verified);
            update.Parameters.AddWithValue("@CertificateRevoked", CertificateStatuses.Revoked);
            update.Parameters.AddWithValue("@CertificateActive", CertificateStatuses.Active);
            update.Parameters.AddWithValue("@ArtworkId", artworkId);
            update.Parameters.AddWithValue("@Hide", hideArtwork);
            await update.ExecuteNonQueryAsync();
            await ThongBaoSql.InsertAsync(connection, transaction, new ThongBao
            {
                MaTaiKhoan = artistAccountId,
                Loai = "COPYRIGHT_REVOKED",
                TieuDe = "Xác minh nguồn gốc đã bị thu hồi",
                NoiDung = $"Tác phẩm “{artworkName}” đã bị thu hồi xác minh. Lý do: {reason}",
                LoaiDoiTuong = "BanQuyen",
                MaDoiTuong = maBanQuyen,
                DuongDan = $"/artist/artworks/{artworkId}/copyright",
                EventKey = $"COPYRIGHT_REVOKE:{maBanQuyen}:{reviewRevision.Ticks}"
            });
            await AuditLogSql.InsertAsync(connection, transaction, "BanQuyen", maBanQuyen,
                "REVOKE_VERIFICATION", maTaiKhoan, 1, reason: reason,
                before: JsonSerializer.Serialize(new { status = oldStatus }),
                after: JsonSerializer.Serialize(new { status = CopyrightStatuses.Revoked, blocked = true, hideArtwork }));
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT b.TacGia,b.NgaySangTac,b.NguonGoc,b.MoTa,b.TrangThai,
                   t.LoaiTacPham,t.TacGiaGoc,h.TenHoaSi,t.MoTaNguonGoc,t.LaTacPhamDocBan,t.SoLuongBanDau
            FROM BanQuyen b INNER JOIN TacPham t ON t.MaTacPham=b.MaTacPham
            INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi WHERE b.MaTacPham=@ArtworkId;", connection);
        command.Parameters.AddWithValue("@ArtworkId", maTacPham);
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return new BanQuyenCongKhaiResponse();
        var status = reader.GetByte(4);
        var verified = status == CopyrightStatuses.Verified;
        return new BanQuyenCongKhaiResponse
        {
            DaKhaiBao = true, TrangThai = CopyrightStatuses.ToCode(status),
            TacGia = verified ? reader["TacGia"] as string : null,
            NgaySangTac = verified && !reader.IsDBNull(1) ? reader.GetDateTime(1) : null,
            NguonGoc = verified ? reader["NguonGoc"] as string : null,
            MoTaBanQuyen = verified ? reader["MoTa"] as string : null,
            LoaiTacPham = verified ? reader.GetByte(5) : null,
            LoaiTacPhamText = verified ? ArtworkTypeNames.Get(reader.GetByte(5)) : null,
            TacGiaGoc = verified && !reader.IsDBNull(6) ? reader.GetString(6) : null,
            HoaSiThucHien = verified ? reader.GetString(7) : null,
            MoTaNguonGoc = verified && !reader.IsDBNull(8) ? reader.GetString(8) : null,
            LaTacPhamDocBan = verified && reader.GetBoolean(9),
            SoLuongBanDau = verified && !reader.IsDBNull(10) ? reader.GetInt32(10) : null
        };
    }

    public Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung) => QueryCertificates(@"
        WHERE l.MaNguoiDung=@OwnerId AND l.TrangThai=@Current ORDER BY c.NgayCap DESC", command =>
    {
        command.Parameters.AddWithValue("@OwnerId", maNguoiDung);
        command.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
    });

    /// <summary>
    /// Returns only delivered marketplace exclusive-order lines belonging to the customer
    /// for which no ownership certificate exists yet. This intentionally has no issuing
    /// side effect: it is a transparent explanation surface for the customer UI.
    /// </summary>
    public async Task<List<ChungNhanChoCapResponse>> GetPendingCertificates(int maNguoiDung)
    {
        var result = new List<ChungNhanChoCapResponse>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT c.MaChiTietDH,d.MaDonHang,c.MaTacPham,t.TenTacPham,t.HinhAnh,d.NgayGiao,
                   c.SoLuong,ISNULL(c.SoLuongDaHoan,0),t.SoLuongBanDau,b.TrangThai,
                   CASE WHEN ISNULL(b.LaDuLieuCu,0)=1 OR t.NgayTao<@EnforcementStartUtc
                        THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END,
                   ISNULL(b.BiChanBan,0),
                   CASE WHEN (SELECT COUNT_BIG(*) FROM ThanhToan p
                              WHERE p.MaDonHang=d.MaDonHang)=1
                              AND EXISTS (SELECT 1 FROM ThanhToan p
                                          WHERE p.MaDonHang=d.MaDonHang AND p.TrangThai='DaThanhToan')
                        THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS DaThanhToanHopLe,
                   CASE WHEN EXISTS (
                       SELECT 1 FROM YeuCauHoanTra r
                       WHERE r.MaChiTietDH=c.MaChiTietDH
                         AND ISNULL(r.TrangThai,'') NOT IN ('TU_CHOI','DA_HUY'))
                        THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS DangCoYeuCauHoanTra
            FROM ChiTietDonHang c
            INNER JOIN DonHang d ON d.MaDonHang=c.MaDonHang
            INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            LEFT JOIN BanQuyen b ON b.MaTacPham=t.MaTacPham
            WHERE d.MaNguoiDung=@CustomerId
              AND d.TrangThai=@Delivered
              AND t.MaYeuCauVeTranh IS NULL
              AND t.LaTacPhamDocBan=1
              AND NOT EXISTS (
                  SELECT 1
                  FROM ChungNhan cn
                  INNER JOIN LichSuSoHuu l ON l.MaLichSuSoHuu=cn.MaLichSuSoHuu
                  WHERE l.MaChiTietDH=c.MaChiTietDH AND l.MaNguoiDung=d.MaNguoiDung)
            ORDER BY d.NgayGiao DESC,c.MaChiTietDH DESC;", connection);
        command.Parameters.AddWithValue("@CustomerId", maNguoiDung);
        command.Parameters.AddWithValue("@Delivered", DonHangStatus.DaGiao);
        command.Parameters.AddWithValue("@EnforcementStartUtc", _options.EnforcementStartUtc);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapPendingCertificate(reader));
        return result;
    }

    public Task<List<ChungNhanResponse>> GetCertificatesForAdmin(string? status, string? keyword)
    {
        var parsedStatus = ParseCertificateStatus(status);
        var normalizedKeyword = string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();
        return QueryCertificates(@"
            WHERE (@Status IS NULL OR c.TrangThai=@Status)
              AND (@Keyword IS NULL OR c.CertificateCode LIKE @Keyword OR t.TenTacPham LIKE @Keyword
                   OR n.Ten LIKE @Keyword OR h.TenHoaSi LIKE @Keyword)
            ORDER BY c.NgayCap DESC", command =>
        {
            command.Parameters.Add("@Status", SqlDbType.TinyInt).Value = Db(parsedStatus);
            command.Parameters.Add("@Keyword", SqlDbType.NVarChar, 300).Value =
                Db(normalizedKeyword == null ? null : $"%{normalizedKeyword}%");
        });
    }

    public async Task<ChungNhanResponse?> GetCertificate(int maChungNhan, int maNguoiDung)
    {
        var values = await QueryCertificates(@"
            WHERE c.MaChungNhan=@Id AND l.MaNguoiDung=@OwnerId AND l.TrangThai=@Current", command =>
        {
            command.Parameters.AddWithValue("@Id", maChungNhan);
            command.Parameters.AddWithValue("@OwnerId", maNguoiDung);
            command.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
        });
        return values.FirstOrDefault();
    }

    public async Task<ChungNhanCongKhaiResponse> VerifyCertificate(string code, string hashKey)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT c.CertificateCode,c.ContentHash,c.NgayCap,c.TrangThai,c.HienThiChuSoHuu,
                   l.MaLichSuSoHuu,l.MaNguoiDung,COALESCE(c.MaTacPham,l.MaTacPham),
                   t.TenTacPham,t.LoaiTacPham,t.TacGiaGoc,h.TenHoaSi,n.Ten
            FROM ChungNhan c INNER JOIN LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu
            INNER JOIN TacPham t ON t.MaTacPham=COALESCE(c.MaTacPham,l.MaTacPham)
            INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi INNER JOIN NguoiDung n ON n.MaNguoiDung=l.MaNguoiDung
            WHERE c.CertificateCode=@Code;", connection);
        command.Parameters.AddWithValue("@Code", code);
        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return new ChungNhanCongKhaiResponse { MaChungNhan = code };
        var issued = DateTime.SpecifyKind(reader.GetDateTime(2), DateTimeKind.Utc);
        var ownerName = reader.GetString(12);
        return new ChungNhanCongKhaiResponse
        {
            TimThay = true,
            ToanVen = CertificateIntegrityHelper.Verify(hashKey, reader.GetInt32(7), reader.GetInt32(6),
                reader.GetInt32(5), issued, reader.GetString(0), reader.IsDBNull(1) ? null : reader.GetString(1)),
            MaChungNhan = reader.GetString(0), TrangThai = CertificateStatuses.ToCode(reader.GetByte(3)),
            TenTacPham = reader.GetString(8), LoaiTacPham = reader.GetByte(9),
            LoaiTacPhamText = ArtworkTypeNames.Get(reader.GetByte(9)),
            TacGiaGoc = reader.IsDBNull(10) ? null : reader.GetString(10), HoaSiThucHien = reader.GetString(11),
            ChuSoHuuHienThi = reader.GetBoolean(4) ? ownerName : CertificateIntegrityHelper.MaskOwner(ownerName),
            NgayCap = issued
        };
    }

    public async Task<bool> RevokeCertificate(int maChungNhan, int maTaiKhoan, string reason)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var command = new SqlCommand(@"
                UPDATE ChungNhan SET TrangThai=@Revoked,NgayThuHoi=SYSUTCDATETIME(),LyDoThuHoi=@Reason
                WHERE MaChungNhan=@Id AND TrangThai=@Active;", connection, transaction);
            command.Parameters.AddWithValue("@Revoked", CertificateStatuses.Revoked);
            command.Parameters.AddWithValue("@Reason", reason);
            command.Parameters.AddWithValue("@Id", maChungNhan);
            command.Parameters.AddWithValue("@Active", CertificateStatuses.Active);
            if (await command.ExecuteNonQueryAsync() != 1) return false;
            await AuditLogSql.InsertAsync(connection, transaction, "ChungNhan", maChungNhan, "REVOKE", maTaiKhoan, 1,
                after: JsonSerializer.Serialize(new { status = CertificateStatuses.Revoked }), reason: reason);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> SetCertificateOwnerVisibility(int maChungNhan, int maNguoiDung, bool visible)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await using var command = new SqlCommand(@"
                UPDATE c SET HienThiChuSoHuu=@Visible FROM ChungNhan c
                INNER JOIN LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu
                WHERE c.MaChungNhan=@Id AND l.MaNguoiDung=@OwnerId AND l.TrangThai=@Current;", connection, transaction);
            command.Parameters.AddWithValue("@Visible", visible);
            command.Parameters.AddWithValue("@Id", maChungNhan);
            command.Parameters.AddWithValue("@OwnerId", maNguoiDung);
            command.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            if (await command.ExecuteNonQueryAsync() != 1) return false;
            await AuditLogSql.InsertAsync(connection, transaction, "ChungNhan", maChungNhan, "SET_OWNER_VISIBILITY", null, null,
                after: JsonSerializer.Serialize(new { visible, ownerId = maNguoiDung }));
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<CopyrightAuditResponse>> GetAuditLogs(string? objectName, int? objectId)
    {
        var result = new List<CopyrightAuditResponse>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(@"
            SELECT TOP (200) n.MaNhatKy,n.TenDoiTuong,n.MaDoiTuong,n.HanhDong,n.GiaTriTruoc,n.GiaTriSau,
                   n.NguoiThucHien,n.ThoiGian,n.LyDo,n.ThongTinBoSung,n.VaiTro,tk.TenDangNhap
            FROM NhatKyHeThong n
            LEFT JOIN TaiKhoan tk ON tk.MaTaiKhoan=n.NguoiThucHien
            WHERE (@ObjectName IS NULL OR n.TenDoiTuong=@ObjectName)
              AND (@ObjectId IS NULL OR n.MaDoiTuong=@ObjectId)
            ORDER BY n.MaNhatKy DESC;", connection);
        command.Parameters.Add("@ObjectName", SqlDbType.NVarChar, 100).Value = Db(objectName);
        command.Parameters.Add("@ObjectId", SqlDbType.Int).Value = Db(objectId);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new CopyrightAuditResponse
        {
            MaNhatKy = reader.GetInt64(0), TenDoiTuong = reader.GetString(1), MaDoiTuong = reader.GetInt32(2),
            HanhDong = reader.GetString(3), GiaTriTruoc = reader.IsDBNull(4) ? null : reader.GetString(4),
            GiaTriSau = reader.IsDBNull(5) ? null : reader.GetString(5),
            NguoiThucHien = reader.IsDBNull(6) ? null : reader.GetInt32(6), ThoiGian = reader.GetDateTime(7),
            LyDo = reader.IsDBNull(8) ? null : reader.GetString(8),
            ThongTinBoSung = reader.IsDBNull(9) ? null : reader.GetString(9),
            VaiTroNguoiThucHien = reader.IsDBNull(10) ? null : reader.GetByte(10),
            TenNguoiThucHien = reader.IsDBNull(11) ? null : reader.GetString(11)
        });
        return result;
    }

    private async Task<BanQuyenResponse?> QueryOne(string sql, Action<SqlCommand> configure) =>
        (await QueryMany(sql, configure)).FirstOrDefault();

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
            SELECT MaBangChung,TenTepGoc,LoaiTep,KichThuoc,NgayTao,MoTa,Sha256
            FROM BangChungBanQuyen WHERE MaBanQuyen=@Id ORDER BY NgayTao DESC;", connection);
        command.Parameters.AddWithValue("@Id", copyrightId);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new BangChungBanQuyenResponse
        {
            MaBangChung = reader.GetInt32(0), TenTepGoc = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
            LoaiTep = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
            KichThuoc = reader.IsDBNull(3) ? 0 : reader.GetInt64(3), NgayTao = reader.GetDateTime(4),
            MoTa = reader.IsDBNull(5) ? null : reader.GetString(5), Sha256 = reader.IsDBNull(6) ? null : reader.GetString(6),
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
            SELECT c.MaChungNhan,c.CertificateCode,COALESCE(c.MaTacPham,l.MaTacPham),t.TenTacPham,
                   COALESCE(b.TacGia,h.TenHoaSi),h.TenHoaSi,n.Ten,c.NgayCap,c.TrangThai,t.LoaiTacPham,t.TacGiaGoc
            FROM ChungNhan c INNER JOIN LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu
            INNER JOIN TacPham t ON t.MaTacPham=COALESCE(c.MaTacPham,l.MaTacPham)
            INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi INNER JOIN NguoiDung n ON n.MaNguoiDung=l.MaNguoiDung
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
            TrangThai = CertificateStatuses.ToCode(reader.GetByte(8)), LoaiTacPham = reader.GetByte(9),
            LoaiTacPhamText = ArtworkTypeNames.Get(reader.GetByte(9)), TacGiaGoc = reader.IsDBNull(10) ? null : reader.GetString(10)
        });
        return result;
    }

    private static BanQuyenResponse MapCopyright(SqlDataReader reader)
    {
        var status = Convert.ToByte(reader["TrangThai"]);
        var type = Convert.ToByte(reader["LoaiTacPham"]);
        byte? usageBasis = reader["CanCuSuDung"] == DBNull.Value ? null : Convert.ToByte(reader["CanCuSuDung"]);
        return new BanQuyenResponse
        {
            MaBanQuyen = Convert.ToInt32(reader["MaBanQuyen"]), MaTacPham = Convert.ToInt32(reader["MaTacPham"]),
            TenTacPham = Convert.ToString(reader["TenTacPham"]) ?? string.Empty, MaHoaSi = Convert.ToInt32(reader["MaHoaSi"]),
            TenHoaSi = Convert.ToString(reader["TenHoaSi"]) ?? string.Empty, TacGia = reader["TacGia"] as string ?? string.Empty,
            NgaySangTac = reader["NgaySangTac"] == DBNull.Value ? null : Convert.ToDateTime(reader["NgaySangTac"]),
            NguonGoc = reader["NguonGoc"] as string ?? string.Empty, MoTaBanQuyen = reader["MoTa"] as string,
            GhiChu = reader["GhiChu"] as string, TrangThaiSo = status, TrangThai = CopyrightStatuses.ToCode(status),
            GhiChuKiemDuyet = reader["GhiChuKiemDuyet"] as string,
            NgayKiemDuyet = reader["NgayKiemDuyet"] == DBNull.Value ? null : Convert.ToDateTime(reader["NgayKiemDuyet"]),
            LaTacPhamDocBan = Convert.ToBoolean(reader["LaTacPhamDocBan"]),
            SoLuongBanDau = reader["SoLuongBanDau"] == DBNull.Value ? null : Convert.ToInt32(reader["SoLuongBanDau"]),
            SoLuongTon = Convert.ToInt32(reader["SoLuong"]), SoDonHang = Convert.ToInt32(reader["SoDonHang"]),
            LoaiTacPham = type, LoaiTacPhamText = ArtworkTypeNames.Get(type),
            TacGiaGoc = reader["TacGiaGoc"] as string,
            MaTacPhamGoc = reader["MaTacPhamGoc"] == DBNull.Value ? null : Convert.ToInt32(reader["MaTacPhamGoc"]),
            MoTaNguonGoc = reader["MoTaNguonGoc"] as string, CanCuSuDungSo = usageBasis,
            CanCuSuDung = CopyrightUsageBases.ToCode(usageBasis), NguonThamKhao = reader["NguonThamKhao"] as string,
            SoDangKy = reader["SoDangKy"] as string, LaDuLieuCu = Convert.ToBoolean(reader["LaDuLieuCu"]),
            BiChanBan = Convert.ToBoolean(reader["BiChanBan"]),
            NgayThuHoiXacMinh = reader["NgayThuHoiXacMinh"] == DBNull.Value ? null : Convert.ToDateTime(reader["NgayThuHoiXacMinh"]),
            LyDoThuHoiXacMinh = reader["LyDoThuHoiXacMinh"] as string,
            NgayTao = Convert.ToDateTime(reader["NgayTao"]), NgayCapNhat = Convert.ToDateTime(reader["NgayCapNhat"])
        };
    }

    private static ChungNhanChoCapResponse MapPendingCertificate(SqlDataReader reader)
    {
        var copyrightStatus = reader.IsDBNull(9) ? (byte?)null : reader.GetByte(9);
        var legacy = reader.GetBoolean(10);
        var blocked = reader.GetBoolean(11);
        var paymentValid = reader.GetBoolean(12);
        var hasOpenReturn = reader.GetBoolean(13);
        var quantity = reader.GetInt32(6);
        var returnedQuantity = reader.GetInt32(7);
        var initialQuantity = reader.IsDBNull(8) ? (int?)null : reader.GetInt32(8);

        var response = new ChungNhanChoCapResponse
        {
            MaChiTietDonHang = reader.GetInt32(0),
            MaDonHang = reader.GetInt32(1),
            MaTacPham = reader.GetInt32(2),
            TenTacPham = reader.GetString(3),
            HinhAnh = reader.IsDBNull(4) ? null : reader.GetString(4),
            NgayGiao = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
            SoLuongTrongDon = quantity,
            SoLuongBanDau = initialQuantity,
            DaThanhToanHopLe = paymentValid,
            DaGiaoThanhCong = true,
            DangCoYeuCauHoanTra = hasOpenReturn,
            TrangThaiBanQuyen = copyrightStatus.HasValue
                ? CopyrightStatuses.ToCode(copyrightStatus.Value)
                : "CHUA_KHAI_BAO"
        };

        // Keep these conditions in the same precedence as issuance: an unresolved return
        // or payment can make a verified artwork ineligible, so it must be shown first.
        if (hasOpenReturn || returnedQuantity > 0)
        {
            response.TrangThaiChungNhan = "RETURN_IN_PROGRESS";
            response.ThongDiep = "Đơn hàng đang có yêu cầu hoàn trả hoặc đã hoàn một phần nên chưa thể cấp chứng nhận.";
        }
        else if (!paymentValid)
        {
            response.TrangThaiChungNhan = "WAITING_PAYMENT_CONFIRMATION";
            response.ThongDiep = "Hệ thống đang chờ xác nhận thanh toán hợp lệ cho đơn hàng này.";
        }
        else if (quantity != 1 || initialQuantity != 1)
        {
            response.TrangThaiChungNhan = "INELIGIBLE_INITIAL_QUANTITY";
            response.ThongDiep = "Chứng nhận sở hữu hiện vật chỉ áp dụng cho tác phẩm độc bản có số lượng ban đầu bằng 1.";
        }
        else if (legacy)
        {
            response.TrangThaiChungNhan = "INELIGIBLE_LEGACY";
            response.ThongDiep = "Tác phẩm thuộc dữ liệu trước khi áp dụng quy trình cấp chứng nhận tự động.";
        }
        else if (!copyrightStatus.HasValue)
        {
            response.TrangThaiChungNhan = "WAITING_COPYRIGHT_DECLARATION";
            response.ThongDiep = "Họa sĩ chưa khai báo hồ sơ nguồn gốc/bản quyền cho tác phẩm; chứng nhận sẽ được cấp sau khi hồ sơ hoàn tất và được xác minh.";
        }
        else if (blocked || copyrightStatus is CopyrightStatuses.Rejected or CopyrightStatuses.Revoked or CopyrightStatuses.Disputed)
        {
            response.TrangThaiChungNhan = "COPYRIGHT_NOT_ELIGIBLE";
            response.ThongDiep = "Hồ sơ nguồn gốc của tác phẩm hiện không đủ điều kiện cấp chứng nhận.";
        }
        else if (copyrightStatus != CopyrightStatuses.Verified)
        {
            response.TrangThaiChungNhan = "WAITING_COPYRIGHT_VERIFICATION";
            response.ThongDiep = "Hồ sơ nguồn gốc đang chờ họa sĩ bổ sung hoặc Admin xác minh; chứng nhận sẽ được cấp tự động khi hồ sơ đạt VERIFIED.";
        }
        else
        {
            response.TrangThaiChungNhan = "ISSUANCE_PENDING";
            response.ThongDiep = "Tác phẩm đã đủ điều kiện; chứng nhận đang được hệ thống hoàn tất.";
            response.DaDuDieuKienCap = true;
        }

        return response;
    }

    private static byte? ParseStatus(string? value) => value?.Trim().ToUpperInvariant() switch
    {
        null or "" => null, "PENDING" => CopyrightStatuses.Pending, "NEED_INFO" => CopyrightStatuses.NeedInfo,
        "VERIFIED" => CopyrightStatuses.Verified, "REJECTED" => CopyrightStatuses.Rejected,
        "DISPUTED" => CopyrightStatuses.Disputed, "LEGACY" => CopyrightStatuses.Legacy,
        "REVOKED" => CopyrightStatuses.Revoked, _ => throw new ArgumentException("Trạng thái bản quyền không hợp lệ")
    };

    private static byte? ParseCertificateStatus(string? value) => value?.Trim().ToUpperInvariant() switch
    {
        null or "" => null, "ACTIVE" => CertificateStatuses.Active,
        "SUPERSEDED" => CertificateStatuses.Superseded, "REVOKED" => CertificateStatuses.Revoked,
        "EXPIRED" => CertificateStatuses.Expired,
        _ => throw new ArgumentException("Trạng thái chứng nhận không hợp lệ")
    };
}
