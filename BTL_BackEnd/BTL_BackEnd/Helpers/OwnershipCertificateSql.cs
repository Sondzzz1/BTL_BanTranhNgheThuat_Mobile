using System.Data;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.Helpers;

public static class OwnershipCertificateSql
{
    public static async Task<bool> TryIssueForCustomArtAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        int requestId,
        int actorId,
        string certificateKey)
    {
        await using var check = new SqlCommand(@"
            SELECT y.MaKhachHang,y.MaHoaSi,y.TrangThai,y.TrangThaiBanGiao,
                   t.MaTacPham,t.LaTacPhamDocBan,t.SoLuongBanDau,
                   b.TrangThai,ISNULL(b.LaDuLieuCu,0),ISNULL(b.BiChanBan,0),
                   q.GiaBaoGia,
                   ISNULL((SELECT SUM(p.SoTien) FROM ThanhToanYeuCau p
                           WHERE p.MaYeuCau=y.MaYeuCau AND p.TrangThai=N'Completed'),0)
            FROM YeuCauVeTranh y WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaYeuCauVeTranh=y.MaYeuCau
            LEFT JOIN BanQuyen b WITH (UPDLOCK,HOLDLOCK) ON b.MaTacPham=t.MaTacPham
            OUTER APPLY (SELECT TOP (1) GiaBaoGia FROM BaoGiaVeTranh
                         WHERE MaYeuCau=y.MaYeuCau AND IsActive=1 AND TrangThai=N'CustomerAccepted'
                         ORDER BY MaBaoGia DESC) q
            WHERE y.MaYeuCau=@RequestId;", connection, transaction);
        check.Parameters.AddWithValue("@RequestId", requestId);
        await using var reader = await check.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return false;
        var customerId = reader.GetInt32(0);
        if (reader.IsDBNull(1)) return false;
        var artistId = reader.GetInt32(1);
        var requestStatus = reader.GetInt32(2);
        var handoverStatus = reader.GetByte(3);
        var artworkId = reader.GetInt32(4);
        var exclusive = reader.GetBoolean(5);
        int? initialQuantity = reader.IsDBNull(6) ? null : reader.GetInt32(6);
        byte? copyrightStatus = reader.IsDBNull(7) ? null : reader.GetByte(7);
        var legacy = reader.GetBoolean(8);
        var blocked = reader.GetBoolean(9);
        decimal? quote = reader.IsDBNull(10) ? null : reader.GetDecimal(10);
        var paid = reader.GetDecimal(11);
        await reader.CloseAsync();

        if (!ExclusiveArtworkPolicy.CanIssueIndividualOwnershipCertificate(
                exclusive,
                initialQuantity,
                copyrightStatus == CopyrightStatuses.Verified,
                blocked || copyrightStatus is CopyrightStatuses.Rejected or CopyrightStatuses.Revoked,
                legacy,
                quote.HasValue && paid >= quote.Value,
                requestStatus == 10 && handoverStatus == 1,
                transferredQuantity: 1,
                ownershipOrCertificateAlreadyExists: false))
            return false;
        if (certificateKey.Length < 32)
            throw new InvalidOperationException("Copyright:CertificateHashKey chưa được cấu hình an toàn; không thể cấp chứng nhận");

        var eventKey = $"CUSTOM_ART:{requestId}";
        await using var existing = new SqlCommand(@"
            SELECT TOP (1) l.MaLichSuSoHuu
            FROM LichSuSoHuu l WITH (UPDLOCK,HOLDLOCK)
            WHERE l.EventKey=@EventKey;", connection, transaction);
        existing.Parameters.AddWithValue("@EventKey", eventKey);
        var existingValue = await existing.ExecuteScalarAsync();
        if (existingValue != null && existingValue != DBNull.Value) return true;

        await using (var initial = new SqlCommand(@"
            IF NOT EXISTS (SELECT 1 FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@ArtworkId)
                INSERT INTO LichSuSoHuu
                    (MaTacPham,MaHoaSi,NgayNhan,LoaiChuyenGiao,TrangThai,GhiChu,EventKey,NgayTao)
                VALUES(@ArtworkId,@ArtistId,SYSUTCDATETIME(),0,@Current,
                       N'Quyền sở hữu hiện vật ban đầu của họa sĩ',@CreationKey,SYSUTCDATETIME());",
            connection, transaction))
        {
            initial.Parameters.AddWithValue("@ArtworkId", artworkId);
            initial.Parameters.AddWithValue("@ArtistId", artistId);
            initial.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            initial.Parameters.AddWithValue("@CreationKey", $"CREATION:{artworkId}");
            await initial.ExecuteNonQueryAsync();
        }

        await using (var close = new SqlCommand(@"
            UPDATE LichSuSoHuu SET TrangThai=@Transferred,NgayChuyenGiao=SYSUTCDATETIME()
            WHERE MaTacPham=@ArtworkId AND MaHoaSi=@ArtistId AND TrangThai=@Current;", connection, transaction))
        {
            close.Parameters.AddWithValue("@Transferred", OwnershipStatuses.Transferred);
            close.Parameters.AddWithValue("@ArtworkId", artworkId);
            close.Parameters.AddWithValue("@ArtistId", artistId);
            close.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            if (await close.ExecuteNonQueryAsync() != 1)
                throw new DBConcurrencyException("Quyền sở hữu hiện vật Custom Art đã thay đổi");
        }

        int ownershipId;
        await using (var insert = new SqlCommand(@"
            INSERT INTO LichSuSoHuu
                (MaTacPham,MaNguoiDung,NgayNhan,LoaiChuyenGiao,TrangThai,MaYeuCauVeTranh,GhiChu,EventKey,NgayTao)
            OUTPUT INSERTED.MaLichSuSoHuu
            VALUES(@ArtworkId,@CustomerId,SYSUTCDATETIME(),1,@Current,@RequestId,
                   N'Custom Art: đã thanh toán đủ và xác nhận bàn giao hiện vật',@EventKey,SYSUTCDATETIME());",
            connection, transaction))
        {
            insert.Parameters.AddWithValue("@ArtworkId", artworkId);
            insert.Parameters.AddWithValue("@CustomerId", customerId);
            insert.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            insert.Parameters.AddWithValue("@RequestId", requestId);
            insert.Parameters.AddWithValue("@EventKey", eventKey);
            ownershipId = Convert.ToInt32(await insert.ExecuteScalarAsync());
        }

        var issued = DateTime.UtcNow;
        var code = CertificateIntegrityHelper.CreateCode(issued);
        var hash = CertificateIntegrityHelper.CreateHash(certificateKey, artworkId, customerId, ownershipId, issued, code);
        int certificateId;
        await using (var certificate = new SqlCommand(@"
            INSERT INTO ChungNhan
                (MaLichSuSoHuu,MaTacPham,MaNguoiDung,MaYeuCauVeTranh,CertificateCode,ContentHash,
                 NgayCap,TrangThai,NguoiCap,HienThiChuSoHuu,NgayTao)
            OUTPUT INSERTED.MaChungNhan
            VALUES(@OwnershipId,@ArtworkId,@CustomerId,@RequestId,@Code,@Hash,@Issued,@Active,
                   N'HeThongBanTranh',0,SYSUTCDATETIME());", connection, transaction))
        {
            certificate.Parameters.AddWithValue("@OwnershipId", ownershipId);
            certificate.Parameters.AddWithValue("@ArtworkId", artworkId);
            certificate.Parameters.AddWithValue("@CustomerId", customerId);
            certificate.Parameters.AddWithValue("@RequestId", requestId);
            certificate.Parameters.AddWithValue("@Code", code);
            certificate.Parameters.AddWithValue("@Hash", hash);
            // ContentHash includes the exact issuance timestamp. AddWithValue infers
            // SQL datetime (3.33 ms precision), which would round NgayCap and make
            // an otherwise valid HMAC fail when the certificate is verified later.
            certificate.Parameters.Add("@Issued", SqlDbType.DateTime2).Value = issued;
            certificate.Parameters.AddWithValue("@Active", CertificateStatuses.Active);
            certificateId = Convert.ToInt32(await certificate.ExecuteScalarAsync());
        }

        await AuditLogSql.InsertAsync(connection, transaction, "LichSuSoHuu", ownershipId,
            "CUSTOM_ART_TRANSFER", actorId, null, after: $"Request={requestId};Owner={customerId}");
        await AuditLogSql.InsertAsync(connection, transaction, "ChungNhan", certificateId,
            "ISSUE", actorId, null, after: $"Code={code};CustomArtRequest={requestId}");
        return true;
    }

    /// <summary>
    /// Reconciles the one physical marketplace sale of an artwork after its copyright
    /// dossier becomes verified. This intentionally does not backfill legacy works,
    /// multi-editions, returned lines, or anything that has not both been paid and
    /// delivered.
    /// </summary>
    public static async Task<bool> TryIssueForVerifiedMarketplaceArtworkAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        int artworkId,
        int actorId,
        string certificateKey,
        DateTime enforcementStartUtc)
    {
        var lineIds = new List<int>();
        await using (var command = new SqlCommand(@"
            SELECT c.MaChiTietDH
            FROM TacPham t WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN ChiTietDonHang c WITH (UPDLOCK,HOLDLOCK) ON c.MaTacPham=t.MaTacPham
            INNER JOIN DonHang d WITH (UPDLOCK,HOLDLOCK) ON d.MaDonHang=c.MaDonHang
            WHERE t.MaTacPham=@ArtworkId
              AND t.MaYeuCauVeTranh IS NULL
              AND d.TrangThai=@Delivered
              AND c.SoLuong>ISNULL(c.SoLuongDaHoan,0)
              AND (SELECT CASE WHEN COUNT_BIG(*)=1
                                    AND SUM(CASE WHEN p.TrangThai='DaThanhToan' THEN 1 ELSE 0 END)=1
                               THEN 1 ELSE 0 END
                   FROM ThanhToan p WITH (UPDLOCK,HOLDLOCK)
                   WHERE p.MaDonHang=d.MaDonHang)=1
              AND NOT EXISTS (
                  SELECT 1 FROM YeuCauHoanTra r WITH (UPDLOCK,HOLDLOCK)
                  WHERE r.MaChiTietDH=c.MaChiTietDH
                    AND ISNULL(r.TrangThai,'') NOT IN ('TU_CHOI','DA_HUY'))
            ORDER BY c.MaChiTietDH;", connection, transaction))
        {
            command.Parameters.AddWithValue("@ArtworkId", artworkId);
            command.Parameters.AddWithValue("@Delivered", DonHangStatus.DaGiao);
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync()) lineIds.Add(reader.GetInt32(0));
        }

        if (lineIds.Count == 0) return false;
        if (lineIds.Count != 1)
            throw new BusinessConflictException("Tác phẩm độc bản có nhiều dòng đơn đã giao; không thể cấp chứng nhận tự động");

        return await TryIssueForDeliveredMarketplaceOrderLineAsync(
            connection, transaction, lineIds[0], actorId, certificateKey,
            enforcementStartUtc, reconciledAfterVerification: true, actorRole: 1);
    }

    /// <summary>
    /// Issues the ownership transfer and certificate for one already paid and delivered
    /// marketplace order line. The stable SALE:{lineId} event key and database unique
    /// indexes make this operation idempotent across delivery and late verification.
    /// </summary>
    public static async Task<bool> TryIssueForDeliveredMarketplaceOrderLineAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        int lineId,
        int actorId,
        string certificateKey,
        DateTime enforcementStartUtc,
        bool reconciledAfterVerification,
        byte? actorRole)
    {
        (int CustomerId, int OrderId, int ArtworkId, int Quantity, int ReturnedQuantity,
            int ArtistId, bool Exclusive, int? InitialQuantity, byte? CopyrightStatus,
            bool Legacy, bool Blocked, DateTime ArtworkCreated, byte OrderStatus, bool PaymentValid)? line = null;

        await using (var command = new SqlCommand(@"
            SELECT d.MaNguoiDung,d.MaDonHang,c.MaTacPham,c.SoLuong,ISNULL(c.SoLuongDaHoan,0),
                   t.MaHoaSi,t.LaTacPhamDocBan,t.SoLuongBanDau,b.TrangThai,
                   ISNULL(b.LaDuLieuCu,0),ISNULL(b.BiChanBan,0),t.NgayTao,d.TrangThai,
                   CASE WHEN (SELECT COUNT_BIG(*) FROM ThanhToan p WITH (UPDLOCK,HOLDLOCK)
                              WHERE p.MaDonHang=d.MaDonHang)=1
                              AND EXISTS (SELECT 1 FROM ThanhToan p WITH (UPDLOCK,HOLDLOCK)
                                          WHERE p.MaDonHang=d.MaDonHang AND p.TrangThai='DaThanhToan')
                        THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END
            FROM ChiTietDonHang c WITH (UPDLOCK,HOLDLOCK)
            INNER JOIN DonHang d WITH (UPDLOCK,HOLDLOCK) ON d.MaDonHang=c.MaDonHang
            INNER JOIN TacPham t WITH (UPDLOCK,HOLDLOCK) ON t.MaTacPham=c.MaTacPham
            LEFT JOIN BanQuyen b WITH (UPDLOCK,HOLDLOCK) ON b.MaTacPham=t.MaTacPham
            WHERE c.MaChiTietDH=@LineId AND t.MaYeuCauVeTranh IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM YeuCauHoanTra r WITH (UPDLOCK,HOLDLOCK)
                  WHERE r.MaChiTietDH=c.MaChiTietDH
                    AND ISNULL(r.TrangThai,'') NOT IN ('TU_CHOI','DA_HUY'));", connection, transaction))
        {
            command.Parameters.AddWithValue("@LineId", lineId);
            await using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return false;
            line = (
                reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2), reader.GetInt32(3), reader.GetInt32(4),
                reader.GetInt32(5), reader.GetBoolean(6), reader.IsDBNull(7) ? null : reader.GetInt32(7),
                reader.IsDBNull(8) ? null : reader.GetByte(8), reader.GetBoolean(9), reader.GetBoolean(10),
                reader.GetDateTime(11), reader.GetByte(12), reader.GetBoolean(13));
        }

        var candidate = line.Value;
        if (!candidate.Exclusive) return false;
        if (candidate.Quantity != 1 || candidate.InitialQuantity != 1)
            throw new BusinessConflictException("Dữ liệu độc bản không nhất quán với số lượng ban đầu hoặc số lượng trong đơn");
        if (candidate.Blocked || candidate.CopyrightStatus is CopyrightStatuses.Rejected or CopyrightStatuses.Revoked)
            throw new BusinessConflictException("Tác phẩm đã bị từ chối hoặc thu hồi xác minh nên không thể chuyển sở hữu");
        if (candidate.Legacy || candidate.ArtworkCreated.ToUniversalTime() < enforcementStartUtc) return false;
        if (candidate.CopyrightStatus != CopyrightStatuses.Verified
            || candidate.OrderStatus != DonHangStatus.DaGiao
            || !candidate.PaymentValid
            || candidate.ReturnedQuantity > 0)
            return false;

        var eventKey = $"SALE:{lineId}";
        await using (var existing = new SqlCommand(@"
            SELECT TOP (1) MaLichSuSoHuu
            FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK)
            WHERE EventKey=@EventKey
               OR (MaChiTietDH=@LineId AND LoaiChuyenGiao=1);", connection, transaction))
        {
            existing.Parameters.AddWithValue("@EventKey", eventKey);
            existing.Parameters.AddWithValue("@LineId", lineId);
            var existingValue = await existing.ExecuteScalarAsync();
            if (existingValue != null && existingValue != DBNull.Value) return false;
        }

        if (certificateKey.Length < 32)
            throw new InvalidOperationException("Copyright:CertificateHashKey chưa được cấu hình an toàn; không thể cấp chứng nhận");

        await using (var initial = new SqlCommand(@"
            IF NOT EXISTS (SELECT 1 FROM LichSuSoHuu WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@ArtworkId)
                INSERT INTO LichSuSoHuu
                    (MaTacPham,MaHoaSi,NgayNhan,LoaiChuyenGiao,TrangThai,GhiChu,EventKey,NgayTao)
                VALUES(@ArtworkId,@ArtistId,SYSUTCDATETIME(),0,@Current,
                       N'Quyền sở hữu hiện vật ban đầu của họa sĩ',@CreationKey,SYSUTCDATETIME());",
            connection, transaction))
        {
            initial.Parameters.AddWithValue("@ArtworkId", candidate.ArtworkId);
            initial.Parameters.AddWithValue("@ArtistId", candidate.ArtistId);
            initial.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            initial.Parameters.AddWithValue("@CreationKey", $"CREATION:{candidate.ArtworkId}");
            await initial.ExecuteNonQueryAsync();
        }

        await using (var closeArtist = new SqlCommand(@"
            UPDATE LichSuSoHuu SET TrangThai=@Transferred,NgayChuyenGiao=SYSUTCDATETIME()
            WHERE MaTacPham=@ArtworkId AND MaHoaSi=@ArtistId AND TrangThai=@Current;", connection, transaction))
        {
            closeArtist.Parameters.AddWithValue("@Transferred", OwnershipStatuses.Transferred);
            closeArtist.Parameters.AddWithValue("@ArtworkId", candidate.ArtworkId);
            closeArtist.Parameters.AddWithValue("@ArtistId", candidate.ArtistId);
            closeArtist.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            if (await closeArtist.ExecuteNonQueryAsync() != 1)
                throw new DBConcurrencyException("Không tìm thấy quyền sở hữu hiện vật hiện tại của họa sĩ");
        }

        int ownershipId;
        await using (var insertOwner = new SqlCommand(@"
            INSERT INTO LichSuSoHuu
                (MaTacPham,MaNguoiDung,NgayNhan,LoaiChuyenGiao,TrangThai,MaDonHang,MaChiTietDH,GhiChu,EventKey,NgayTao)
            OUTPUT INSERTED.MaLichSuSoHuu
            VALUES(@ArtworkId,@CustomerId,SYSUTCDATETIME(),1,@Current,@OrderId,@LineId,
                   N'Chuyển sở hữu hiện vật sau thanh toán và bàn giao',@EventKey,SYSUTCDATETIME());", connection, transaction))
        {
            insertOwner.Parameters.AddWithValue("@ArtworkId", candidate.ArtworkId);
            insertOwner.Parameters.AddWithValue("@CustomerId", candidate.CustomerId);
            insertOwner.Parameters.AddWithValue("@Current", OwnershipStatuses.Current);
            insertOwner.Parameters.AddWithValue("@OrderId", candidate.OrderId);
            insertOwner.Parameters.AddWithValue("@LineId", lineId);
            insertOwner.Parameters.AddWithValue("@EventKey", eventKey);
            ownershipId = Convert.ToInt32(await insertOwner.ExecuteScalarAsync());
        }

        var issued = DateTime.UtcNow;
        var code = CertificateIntegrityHelper.CreateCode(issued);
        var hash = CertificateIntegrityHelper.CreateHash(certificateKey, candidate.ArtworkId, candidate.CustomerId, ownershipId, issued, code);
        int certificateId;
        await using (var certificate = new SqlCommand(@"
            INSERT INTO ChungNhan
                (MaLichSuSoHuu,MaTacPham,MaNguoiDung,CertificateCode,ContentHash,NgayCap,TrangThai,NguoiCap,HienThiChuSoHuu,NgayTao)
            OUTPUT INSERTED.MaChungNhan
            VALUES(@OwnershipId,@ArtworkId,@CustomerId,@Code,@Hash,@Issued,@Active,
                   N'HeThongBanTranh',0,SYSUTCDATETIME());", connection, transaction))
        {
            certificate.Parameters.AddWithValue("@OwnershipId", ownershipId);
            certificate.Parameters.AddWithValue("@ArtworkId", candidate.ArtworkId);
            certificate.Parameters.AddWithValue("@CustomerId", candidate.CustomerId);
            certificate.Parameters.AddWithValue("@Code", code);
            certificate.Parameters.AddWithValue("@Hash", hash);
            // Keep the persisted timestamp byte-for-byte compatible with the value
            // that was signed above; see the Custom Art issuance path as well.
            certificate.Parameters.Add("@Issued", SqlDbType.DateTime2).Value = issued;
            certificate.Parameters.AddWithValue("@Active", CertificateStatuses.Active);
            certificateId = Convert.ToInt32(await certificate.ExecuteScalarAsync());
        }

        var ownershipAction = reconciledAfterVerification ? "SALE_TRANSFER_AFTER_VERIFY" : "SALE_TRANSFER";
        var certificateAction = reconciledAfterVerification ? "ISSUE_AFTER_VERIFY" : "ISSUE";
        await AuditLogSql.InsertAsync(connection, transaction, "LichSuSoHuu", ownershipId,
            ownershipAction, actorId, actorRole, after: $"Order={candidate.OrderId};Line={lineId};Owner={candidate.CustomerId}");
        await AuditLogSql.InsertAsync(connection, transaction, "ChungNhan", certificateId,
            certificateAction, actorId, actorRole, after: $"Code={code};Ownership={ownershipId}");
        return true;
    }
}
