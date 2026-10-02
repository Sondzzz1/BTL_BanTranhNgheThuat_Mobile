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

        if (requestStatus != 10 || handoverStatus != 1 || !quote.HasValue || paid < quote.Value
            || !exclusive || initialQuantity != 1 || copyrightStatus != CopyrightStatuses.Verified
            || legacy || blocked)
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
            certificate.Parameters.AddWithValue("@Issued", issued);
            certificate.Parameters.AddWithValue("@Active", CertificateStatuses.Active);
            certificateId = Convert.ToInt32(await certificate.ExecuteScalarAsync());
        }

        await AuditLogSql.InsertAsync(connection, transaction, "LichSuSoHuu", ownershipId,
            "CUSTOM_ART_TRANSFER", actorId, null, after: $"Request={requestId};Owner={customerId}");
        await AuditLogSql.InsertAsync(connection, transaction, "ChungNhan", certificateId,
            "ISSUE", actorId, null, after: $"Code={code};CustomArtRequest={requestId}");
        return true;
    }
}
