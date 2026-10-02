SET NOCOUNT ON;

/*
    READ-ONLY audit for migration 009.
    This script only executes SELECT statements and reads metadata/business data.
    Run against the intended database in SSMS before approving migration 009.
*/

DECLARE @EnforcementStartUtc DATETIME2 = '2026-10-02T00:00:00';

/* 1. Required objects and columns. */
SELECT v.ObjectName,
       CASE WHEN OBJECT_ID(v.ObjectName, N'U') IS NULL THEN 0 ELSE 1 END AS ObjectExists
FROM (VALUES
    (N'dbo.TacPham'), (N'dbo.BanQuyen'), (N'dbo.BangChungBanQuyen'),
    (N'dbo.LichSuSoHuu'), (N'dbo.ChungNhan'), (N'dbo.DonHang'),
    (N'dbo.ChiTietDonHang'), (N'dbo.ThanhToan'), (N'dbo.YeuCauHoanTra'),
    (N'dbo.YeuCauVeTranh'), (N'dbo.ThanhToanYeuCau'), (N'dbo.TaiKhoan')
) v(ObjectName)
ORDER BY v.ObjectName;

SELECT v.ObjectName, v.ColumnName,
       CASE WHEN COL_LENGTH(v.ObjectName, v.ColumnName) IS NULL THEN 0 ELSE 1 END AS ColumnExists
FROM (VALUES
    (N'dbo.TacPham', N'LaTacPhamDocBan'),
    (N'dbo.TacPham', N'SoLuongBanDau'),
    (N'dbo.TacPham', N'MaYeuCauVeTranh'),
    (N'dbo.BanQuyen', N'LaDuLieuCu'),
    (N'dbo.BanQuyen', N'BiChanBan'),
    (N'dbo.LichSuSoHuu', N'EventKey'),
    (N'dbo.LichSuSoHuu', N'MaYeuCauVeTranh'),
    (N'dbo.ChungNhan', N'MaYeuCauVeTranh'),
    (N'dbo.YeuCauVeTranh', N'TrangThaiBanGiao'),
    (N'dbo.ThanhToanYeuCau', N'IdempotencyKey'),
    (N'dbo.ThanhToanYeuCau', N'MaGiaoDich')
) v(ObjectName, ColumnName)
ORDER BY v.ObjectName, v.ColumnName;

/* 2. Critical unique indexes inherited from migrations 004/005 and planned by 009. */
SELECT v.TableName, v.IndexName,
       CASE WHEN i.index_id IS NULL THEN 0 ELSE 1 END AS IndexExists,
       i.is_unique, i.has_filter, i.filter_definition
FROM (VALUES
    (N'BanQuyen', N'UX_BanQuyen_MaTacPham'),
    (N'LichSuSoHuu', N'UX_LichSuSoHuu_Current'),
    (N'LichSuSoHuu', N'UX_LichSuSoHuu_SaleLine'),
    (N'LichSuSoHuu', N'UX_LichSuSoHuu_Return'),
    (N'ChungNhan', N'UX_ChungNhan_CertificateCode'),
    (N'ChungNhan', N'UX_ChungNhan_Ownership'),
    (N'ChungNhan', N'UX_ChungNhan_ActiveArtwork'),
    (N'ThanhToan', N'UX_ThanhToan_MaDonHang'),
    (N'LichSuSoHuu', N'UX_LichSuSoHuu_EventKey'),
    (N'LichSuSoHuu', N'UX_LichSuSoHuu_CustomArtTransfer'),
    (N'ThanhToanYeuCau', N'UX_ThanhToanYeuCau_IdempotencyKey'),
    (N'ThanhToanYeuCau', N'UX_ThanhToanYeuCau_CompletedTransaction')
) v(TableName, IndexName)
LEFT JOIN sys.indexes i
  ON i.object_id=OBJECT_ID(N'dbo.' + v.TableName) AND i.name=v.IndexName
ORDER BY v.TableName, v.IndexName;

/* 3. Duplicate data that can make a required unique index absent or fail. */
SELECT N'BanQuyen duplicate MaTacPham' AS AuditName, b.MaTacPham AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
FROM dbo.BanQuyen b GROUP BY b.MaTacPham HAVING COUNT_BIG(*)>1;

SELECT N'Multiple CURRENT owners' AS AuditName, l.MaTacPham AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
FROM dbo.LichSuSoHuu l WHERE l.TrangThai=1 GROUP BY l.MaTacPham HAVING COUNT_BIG(*)>1;

SELECT N'Duplicate SALE ownership by order line' AS AuditName, l.MaChiTietDH AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
FROM dbo.LichSuSoHuu l WHERE l.MaChiTietDH IS NOT NULL AND l.LoaiChuyenGiao=1
GROUP BY l.MaChiTietDH HAVING COUNT_BIG(*)>1;

SELECT N'Duplicate RETURN ownership by return request' AS AuditName, l.MaYeuCauHoanTra AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
FROM dbo.LichSuSoHuu l WHERE l.MaYeuCauHoanTra IS NOT NULL AND l.LoaiChuyenGiao=3
GROUP BY l.MaYeuCauHoanTra HAVING COUNT_BIG(*)>1;

SELECT N'Duplicate certificate code' AS AuditName, c.CertificateCode AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
FROM dbo.ChungNhan c GROUP BY c.CertificateCode HAVING COUNT_BIG(*)>1;

SELECT N'Duplicate certificate per ownership' AS AuditName, CONVERT(NVARCHAR(100),c.MaLichSuSoHuu) AS BusinessKey,
       COUNT_BIG(*) AS DuplicateCount
FROM dbo.ChungNhan c GROUP BY c.MaLichSuSoHuu HAVING COUNT_BIG(*)>1;

SELECT N'Multiple ACTIVE certificates per artwork' AS AuditName, CONVERT(NVARCHAR(100),c.MaTacPham) AS BusinessKey,
       COUNT_BIG(*) AS DuplicateCount
FROM dbo.ChungNhan c WHERE c.TrangThai=1 AND c.MaTacPham IS NOT NULL
GROUP BY c.MaTacPham HAVING COUNT_BIG(*)>1;

SELECT N'Multiple payments per marketplace order' AS AuditName, CONVERT(NVARCHAR(100),p.MaDonHang) AS BusinessKey,
       COUNT_BIG(*) AS DuplicateCount
FROM dbo.ThanhToan p GROUP BY p.MaDonHang HAVING COUNT_BIG(*)>1;

IF COL_LENGTH(N'dbo.LichSuSoHuu', N'EventKey') IS NOT NULL
    EXEC sys.sp_executesql N'
        SELECT N''Duplicate ownership EventKey'' AS AuditName, EventKey AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
        FROM dbo.LichSuSoHuu WHERE EventKey IS NOT NULL
        GROUP BY EventKey HAVING COUNT_BIG(*)>1;';

IF OBJECT_ID(N'dbo.ThanhToanYeuCau', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ThanhToanYeuCau', N'IdempotencyKey') IS NOT NULL
    EXEC sys.sp_executesql N'
        SELECT N''Duplicate custom-art IdempotencyKey'' AS AuditName,
               CONCAT(MaYeuCau,N'':'',IdempotencyKey) AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
        FROM dbo.ThanhToanYeuCau WHERE IdempotencyKey IS NOT NULL
        GROUP BY MaYeuCau,IdempotencyKey HAVING COUNT_BIG(*)>1;';

IF OBJECT_ID(N'dbo.ThanhToanYeuCau', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ThanhToanYeuCau', N'MaGiaoDich') IS NOT NULL
    EXEC sys.sp_executesql N'
        SELECT N''Duplicate completed custom-art transaction'' AS AuditName,
               MaGiaoDich AS BusinessKey, COUNT_BIG(*) AS DuplicateCount
        FROM dbo.ThanhToanYeuCau WHERE MaGiaoDich IS NOT NULL AND TrangThai=N''Completed''
        GROUP BY MaGiaoDich HAVING COUNT_BIG(*)>1;';

/* 4. Exclusive-art consistency. NULL initial quantity must remain unresolved. */
IF COL_LENGTH(N'dbo.TacPham', N'SoLuongBanDau') IS NULL
    SELECT N'TacPham.SoLuongBanDau has not been added yet (expected before migration 009)' AS AuditNotice;
ELSE
    EXEC sys.sp_executesql N'
        SELECT t.MaTacPham,t.TenTacPham,t.LaTacPhamDocBan,t.SoLuongBanDau,t.SoLuong,
               COUNT_BIG(c.MaChiTietDH) AS HistoricalOrderLineCount
        FROM dbo.TacPham t
        LEFT JOIN dbo.ChiTietDonHang c ON c.MaTacPham=t.MaTacPham
        WHERE t.LaTacPhamDocBan=1 AND (t.SoLuongBanDau IS NULL OR t.SoLuongBanDau<>1 OR t.SoLuong<0 OR t.SoLuong>1)
        GROUP BY t.MaTacPham,t.TenTacPham,t.LaTacPhamDocBan,t.SoLuongBanDau,t.SoLuong
        ORDER BY t.MaTacPham;

        SELECT t.MaTacPham,t.TenTacPham,t.SoLuong,t.SoLuongBanDau,
               COUNT_BIG(c.MaChiTietDH) AS HistoricalOrderLineCount
        FROM dbo.TacPham t
        LEFT JOIN dbo.ChiTietDonHang c ON c.MaTacPham=t.MaTacPham
        WHERE t.SoLuongBanDau IS NULL AND t.SoLuong=1
        GROUP BY t.MaTacPham,t.TenTacPham,t.SoLuong,t.SoLuongBanDau
        ORDER BY HistoricalOrderLineCount DESC,t.MaTacPham;';

/* 5. Payment/delivery synchronization. DonHang.TrangThai=3 means DaGiao. */
SELECT d.MaDonHang,d.TrangThai,d.NgayGiao,COUNT_BIG(p.MaThanhToan) AS PaymentRowCount,
       SUM(CASE WHEN p.TrangThai=N'DaThanhToan' THEN 1 ELSE 0 END) AS PaidRowCount
FROM dbo.DonHang d
LEFT JOIN dbo.ThanhToan p ON p.MaDonHang=d.MaDonHang
WHERE d.TrangThai=3
GROUP BY d.MaDonHang,d.TrangThai,d.NgayGiao
HAVING COUNT_BIG(p.MaThanhToan)<>1 OR SUM(CASE WHEN p.TrangThai=N'DaThanhToan' THEN 1 ELSE 0 END)<>1;

SELECT p.PhuongThuc,p.TrangThai,COUNT_BIG(*) AS RowCount
FROM dbo.ThanhToan p
GROUP BY p.PhuongThuc,p.TrangThai
ORDER BY p.PhuongThuc,p.TrangThai;

SELECT d.MaDonHang,d.TrangThai,p.MaThanhToan,p.PhuongThuc,p.TrangThai AS TrangThaiThanhToan,p.NgayThanhToan
FROM dbo.DonHang d INNER JOIN dbo.ThanhToan p ON p.MaDonHang=d.MaDonHang
WHERE p.TrangThai=N'DaThanhToan' AND d.TrangThai<>3
ORDER BY d.MaDonHang;

/* 6. LEGACY boundary and blocked states. Includes a 12-hour boundary window for timezone review. */
SELECT t.MaTacPham,t.NgayTao,b.MaBanQuyen,b.TrangThai
FROM dbo.TacPham t LEFT JOIN dbo.BanQuyen b ON b.MaTacPham=t.MaTacPham
WHERE t.NgayTao>=DATEADD(HOUR,-12,@EnforcementStartUtc)
  AND t.NgayTao< DATEADD(HOUR, 12,@EnforcementStartUtc)
ORDER BY t.NgayTao,t.MaTacPham;

IF COL_LENGTH(N'dbo.BanQuyen', N'LaDuLieuCu') IS NOT NULL
   AND COL_LENGTH(N'dbo.BanQuyen', N'BiChanBan') IS NOT NULL
    EXEC sys.sp_executesql N'
        SELECT b.MaBanQuyen,b.MaTacPham,b.TrangThai,b.LaDuLieuCu,b.BiChanBan,t.NgayTao,t.TrangThai AS TrangThaiTacPham
        FROM dbo.BanQuyen b INNER JOIN dbo.TacPham t ON t.MaTacPham=b.MaTacPham
        WHERE b.TrangThai IN (3,5,6) OR b.LaDuLieuCu=1 OR b.BiChanBan=1
        ORDER BY b.MaTacPham;';

SELECT DISTINCT d.MaDonHang,c.MaTacPham,b.TrangThai AS TrangThaiBanQuyen
FROM dbo.DonHang d
INNER JOIN dbo.ChiTietDonHang c ON c.MaDonHang=d.MaDonHang
INNER JOIN dbo.BanQuyen b ON b.MaTacPham=c.MaTacPham
WHERE d.TrangThai=3 AND b.TrangThai IN (3,6)
ORDER BY d.MaDonHang,c.MaTacPham;

/* 7. Return/refund cases. These queries do not decide whether a partial refund meant the item was retained. */
SELECT y.MaYeuCau,y.MaDonHang,y.MaChiTietDH,y.MaTacPham,y.TrangThai,y.SoLuongTra,
       y.SoTienHoan,y.NgayNhanHang,y.NgayHoanTien,y.TrangThaiHoanTien
FROM dbo.YeuCauHoanTra y
WHERE y.TrangThai IN (N'DA_NHAN_HANG',N'DA_HOAN_TIEN',N'HOAN_TAT')
ORDER BY y.MaYeuCau;

SELECT y.MaYeuCau,y.MaDonHang,y.MaTacPham,y.TrangThai,y.NgayNhanHang,y.SoTienHoan,
       y.SoLuongTra,c.DonGia,(ISNULL(y.SoLuongTra,0)*c.DonGia) AS MaximumLineRefund
FROM dbo.YeuCauHoanTra y
INNER JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH=y.MaChiTietDH
WHERE y.TrangThai IN (N'DA_HOAN_TIEN',N'HOAN_TAT')
  AND (y.NgayNhanHang IS NULL OR y.SoTienHoan < ISNULL(y.SoLuongTra,0)*c.DonGia)
ORDER BY y.MaYeuCau;

SELECT y.MaYeuCau,y.MaTacPham,y.TrangThai,y.NgayNhanHang,y.NgayHoanTien,
       SUM(CASE WHEN l.TrangThai=1 AND l.MaNguoiDung=y.MaNguoiDung THEN 1 ELSE 0 END) AS CustomerCurrentRows,
       SUM(CASE WHEN l.LoaiChuyenGiao=3 AND l.MaYeuCauHoanTra=y.MaYeuCau THEN 1 ELSE 0 END) AS ReturnOwnershipRows
FROM dbo.YeuCauHoanTra y
LEFT JOIN dbo.LichSuSoHuu l ON l.MaTacPham=y.MaTacPham
WHERE y.TrangThai IN (N'DA_HOAN_TIEN',N'HOAN_TAT')
GROUP BY y.MaYeuCau,y.MaTacPham,y.TrangThai,y.NgayNhanHang,y.NgayHoanTien
ORDER BY y.MaYeuCau;

/* 8. Orphans and certificate state. */
SELECT N'Ownership orphan artwork' AS AuditName,COUNT_BIG(*) AS IssueCount
FROM dbo.LichSuSoHuu l LEFT JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE t.MaTacPham IS NULL
UNION ALL
SELECT N'Certificate orphan ownership',COUNT_BIG(*)
FROM dbo.ChungNhan c LEFT JOIN dbo.LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu WHERE l.MaLichSuSoHuu IS NULL
UNION ALL
SELECT N'Ownership on non-exclusive artwork',COUNT_BIG(*)
FROM dbo.LichSuSoHuu l INNER JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE ISNULL(t.LaTacPhamDocBan,0)=0;

SELECT c.MaChungNhan,c.CertificateCode,c.MaTacPham,c.MaLichSuSoHuu,c.TrangThai,
       c.NgayThuHoi,c.LyDoThuHoi,l.TrangThai AS TrangThaiSoHuu
FROM dbo.ChungNhan c INNER JOIN dbo.LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu
WHERE (c.TrangThai=1 AND l.TrangThai<>1) OR (c.TrangThai=3 AND c.NgayThuHoi IS NULL)
ORDER BY c.MaChungNhan;
