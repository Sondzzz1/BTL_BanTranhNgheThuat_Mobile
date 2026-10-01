SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.TacPham', N'U') IS NULL
    THROW 50001, N'Không tìm thấy bảng dbo.TacPham.', 1;
IF OBJECT_ID(N'dbo.YeuCauVeTranh', N'U') IS NULL
    THROW 50002, N'Không tìm thấy bảng dbo.YeuCauVeTranh.', 1;
IF COL_LENGTH(N'dbo.TacPham', N'MaYeuCauVeTranh') IS NULL
    THROW 50003, N'Thiếu cột dbo.TacPham.MaYeuCauVeTranh; hãy chạy migration custom-art trước.', 1;

PRINT N'=== PRE-MIGRATION COMMISSION AUDIT ===';

SELECT N'duplicate MaYeuCauVeTranh' AS AuditName, COUNT(*) AS IssueCount
FROM (
    SELECT MaYeuCauVeTranh
    FROM dbo.TacPham
    WHERE MaYeuCauVeTranh IS NOT NULL
    GROUP BY MaYeuCauVeTranh
    HAVING COUNT_BIG(*) > 1
) d;

SELECT N'orphan MaYeuCauVeTranh' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.TacPham t
LEFT JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau=t.MaYeuCauVeTranh
WHERE t.MaYeuCauVeTranh IS NOT NULL AND y.MaYeuCau IS NULL;

BEGIN TRANSACTION;

-- TrangThai=2 đã được source hiện tại định nghĩa là "Ẩn (ngừng bán tạm thời)".
-- Đây chỉ là trạng thái phòng vệ; dấu hiệu commission chính thức vẫn là MaYeuCauVeTranh IS NOT NULL.
UPDATE t
SET t.SoLuong=0,
    t.TrangThai=2,
    t.LoaiTacPham=CASE y.[Type]
        WHEN 0 THEN 1
        WHEN 1 THEN 3
        WHEN 2 THEN 3
        WHEN 3 THEN 4
        ELSE t.LoaiTacPham
    END
FROM dbo.TacPham t
INNER JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau=t.MaYeuCauVeTranh
WHERE t.MaYeuCauVeTranh IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ChiTietGioHang c WHERE c.MaTacPham=t.MaTacPham)
  AND NOT EXISTS (SELECT 1 FROM dbo.ChiTietDonHang d WHERE d.MaTacPham=t.MaTacPham);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id=OBJECT_ID(N'dbo.TacPham')
      AND name=N'UX_TacPham_MaYeuCauVeTranh'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.TacPham
        WHERE MaYeuCauVeTranh IS NOT NULL
        GROUP BY MaYeuCauVeTranh
        HAVING COUNT_BIG(*) > 1
    )
    BEGIN
        CREATE UNIQUE INDEX UX_TacPham_MaYeuCauVeTranh
            ON dbo.TacPham(MaYeuCauVeTranh)
            WHERE MaYeuCauVeTranh IS NOT NULL;
        PRINT N'Created UX_TacPham_MaYeuCauVeTranh.';
    END
    ELSE
        PRINT N'SKIPPED UX_TacPham_MaYeuCauVeTranh: duplicate request links must be resolved manually.';
END
ELSE
    PRINT N'UX_TacPham_MaYeuCauVeTranh already exists.';

COMMIT TRANSACTION;
GO

PRINT N'=== POST-MIGRATION COMMISSION AUDIT ===';

SELECT t.MaTacPham, t.MaYeuCauVeTranh, t.TrangThai, t.SoLuong, t.LoaiTacPham,
       t.MaHoaSi, t.Gia, t.MaTacPhamGoc, t.TacGiaGoc
FROM dbo.TacPham t
WHERE t.MaTacPham IN (15,16,17,18)
ORDER BY t.MaTacPham;

SELECT N'commission public (TrangThai=1)' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.TacPham WHERE MaYeuCauVeTranh IS NOT NULL AND TrangThai=1;

SELECT N'commission SoLuong > 0' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.TacPham WHERE MaYeuCauVeTranh IS NOT NULL AND SoLuong>0;

SELECT N'duplicate MaYeuCauVeTranh' AS AuditName, COUNT(*) AS IssueCount
FROM (
    SELECT MaYeuCauVeTranh
    FROM dbo.TacPham
    WHERE MaYeuCauVeTranh IS NOT NULL
    GROUP BY MaYeuCauVeTranh
    HAVING COUNT_BIG(*) > 1
) d;

SELECT N'orphan MaYeuCauVeTranh' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.TacPham t
LEFT JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau=t.MaYeuCauVeTranh
WHERE t.MaYeuCauVeTranh IS NOT NULL AND y.MaYeuCau IS NULL;

SELECT N'completed request missing TacPham' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.YeuCauVeTranh y
WHERE y.TrangThai=10
  AND NOT EXISTS (SELECT 1 FROM dbo.TacPham t WHERE t.MaYeuCauVeTranh=y.MaYeuCau);

SELECT N'existing-artwork missing origin' AS AuditName, COUNT(*) AS IssueCount
FROM dbo.YeuCauVeTranh y
INNER JOIN dbo.TacPham t ON t.MaYeuCauVeTranh=y.MaYeuCau
WHERE y.[Type] IN (1,2)
  AND t.MaTacPhamGoc IS NULL
  AND NULLIF(LTRIM(RTRIM(ISNULL(t.TacGiaGoc,N''))),N'') IS NULL;
GO
