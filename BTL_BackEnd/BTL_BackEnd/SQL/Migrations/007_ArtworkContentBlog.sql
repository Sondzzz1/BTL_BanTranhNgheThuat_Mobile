SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.TacPham', N'U') IS NULL
    THROW 50701, N'Không tìm thấy dbo.TacPham.', 1;
IF OBJECT_ID(N'dbo.BaiViet', N'U') IS NULL
    THROW 50702, N'Không tìm thấy dbo.BaiViet.', 1;

BEGIN TRANSACTION;

/* Blog categories */
IF OBJECT_ID(N'dbo.DanhMucBaiViet', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DanhMucBaiViet
    (
        MaDanhMucBaiViet INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DanhMucBaiViet PRIMARY KEY,
        TenDanhMuc NVARCHAR(150) NOT NULL,
        Slug VARCHAR(120) NOT NULL,
        TrangThai BIT NOT NULL CONSTRAINT DF_DanhMucBaiViet_TrangThai DEFAULT (1),
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_DanhMucBaiViet_NgayTao DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX UX_DanhMucBaiViet_Slug ON dbo.DanhMucBaiViet(Slug);
END;

DECLARE @Categories TABLE(Ten NVARCHAR(150), Slug VARCHAR(120));
INSERT INTO @Categories(Ten, Slug) VALUES
    (N'Triển lãm và sự kiện', 'trien-lam-va-su-kien'),
    (N'Câu chuyện họa sĩ', 'cau-chuyen-hoa-si'),
    (N'Kiến thức nghệ thuật', 'kien-thuc-nghe-thuat'),
    (N'Nghệ thuật và đời sống', 'nghe-thuat-va-doi-song');
INSERT INTO dbo.DanhMucBaiViet(TenDanhMuc, Slug)
SELECT c.Ten, c.Slug FROM @Categories c
WHERE NOT EXISTS (SELECT 1 FROM dbo.DanhMucBaiViet d WHERE d.Slug=c.Slug);

/* Extend BaiViet without replacing legacy columns. NgayDang remains the legacy created date. */
IF COL_LENGTH(N'dbo.BaiViet', N'TomTat') IS NULL ALTER TABLE dbo.BaiViet ADD TomTat NVARCHAR(500) NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'MaDanhMucBaiViet') IS NULL ALTER TABLE dbo.BaiViet ADD MaDanhMucBaiViet INT NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'MaTaiKhoanTacGia') IS NULL ALTER TABLE dbo.BaiViet ADD MaTaiKhoanTacGia INT NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'NgayCapNhat') IS NULL ALTER TABLE dbo.BaiViet ADD NgayCapNhat DATETIME2 NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'NgayXuatBan') IS NULL ALTER TABLE dbo.BaiViet ADD NgayXuatBan DATETIME2 NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'NgayBatDauSuKien') IS NULL ALTER TABLE dbo.BaiViet ADD NgayBatDauSuKien DATETIME2 NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'NgayKetThucSuKien') IS NULL ALTER TABLE dbo.BaiViet ADD NgayKetThucSuKien DATETIME2 NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'DiaDiemSuKien') IS NULL ALTER TABLE dbo.BaiViet ADD DiaDiemSuKien NVARCHAR(500) NULL;
IF COL_LENGTH(N'dbo.BaiViet', N'NguonNoiDung') IS NULL ALTER TABLE dbo.BaiViet ADD NguonNoiDung NVARCHAR(1000) NULL;

/* Existing artist articles retain their author. No fabricated author/category is assigned. */
IF OBJECT_ID(N'dbo.HoaSi', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.HoaSi', N'MaTaiKhoan') IS NOT NULL
BEGIN
    UPDATE b SET MaTaiKhoanTacGia=h.MaTaiKhoan
    FROM dbo.BaiViet b INNER JOIN dbo.HoaSi h ON h.MaHoaSi=b.MaHoaSi
    WHERE b.MaTaiKhoanTacGia IS NULL AND h.MaTaiKhoan IS NOT NULL;
END;
UPDATE dbo.BaiViet SET NgayXuatBan=NgayDang WHERE TrangThai=2 AND NgayXuatBan IS NULL;

/* Allow future Admin-authored posts while preserving MaHoaSi for legacy artist posts. */
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.BaiViet') AND name=N'MaHoaSi' AND is_nullable=0)
    ALTER TABLE dbo.BaiViet ALTER COLUMN MaHoaSi INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BaiViet_DanhMucBaiViet')
   AND NOT EXISTS (SELECT 1 FROM dbo.BaiViet b LEFT JOIN dbo.DanhMucBaiViet d ON d.MaDanhMucBaiViet=b.MaDanhMucBaiViet WHERE b.MaDanhMucBaiViet IS NOT NULL AND d.MaDanhMucBaiViet IS NULL)
    ALTER TABLE dbo.BaiViet WITH CHECK ADD CONSTRAINT FK_BaiViet_DanhMucBaiViet FOREIGN KEY(MaDanhMucBaiViet) REFERENCES dbo.DanhMucBaiViet(MaDanhMucBaiViet);

IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BaiViet_TaiKhoanTacGia')
   AND NOT EXISTS (SELECT 1 FROM dbo.BaiViet b LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=b.MaTaiKhoanTacGia WHERE b.MaTaiKhoanTacGia IS NOT NULL AND t.MaTaiKhoan IS NULL)
    ALTER TABLE dbo.BaiViet WITH CHECK ADD CONSTRAINT FK_BaiViet_TaiKhoanTacGia FOREIGN KEY(MaTaiKhoanTacGia) REFERENCES dbo.TaiKhoan(MaTaiKhoan);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_BaiViet_TrangThai')
   AND NOT EXISTS (SELECT 1 FROM dbo.BaiViet WHERE TrangThai NOT BETWEEN 0 AND 4)
    ALTER TABLE dbo.BaiViet WITH CHECK ADD CONSTRAINT CK_BaiViet_TrangThai CHECK(TrangThai BETWEEN 0 AND 4);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_BaiViet_ThoiGianSuKien')
   AND NOT EXISTS (SELECT 1 FROM dbo.BaiViet WHERE NgayBatDauSuKien IS NOT NULL AND NgayKetThucSuKien IS NOT NULL AND NgayKetThucSuKien < NgayBatDauSuKien)
    ALTER TABLE dbo.BaiViet WITH CHECK ADD CONSTRAINT CK_BaiViet_ThoiGianSuKien CHECK(NgayKetThucSuKien IS NULL OR NgayBatDauSuKien IS NULL OR NgayKetThucSuKien >= NgayBatDauSuKien);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.BaiViet') AND name=N'IX_BaiViet_Public')
    CREATE INDEX IX_BaiViet_Public ON dbo.BaiViet(TrangThai, NgayXuatBan DESC, MaBaiViet DESC) INCLUDE(MaDanhMucBaiViet);

/* Structured body images. Only server-managed relative names should be stored by the new API. */
IF OBJECT_ID(N'dbo.HinhAnhBaiViet', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HinhAnhBaiViet
    (
        MaHinhAnh INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HinhAnhBaiViet PRIMARY KEY,
        MaBaiViet INT NOT NULL,
        DuongDan NVARCHAR(500) NOT NULL,
        ChuThich NVARCHAR(300) NULL,
        ThuTu INT NOT NULL CONSTRAINT DF_HinhAnhBaiViet_ThuTu DEFAULT (0),
        CONSTRAINT FK_HinhAnhBaiViet_BaiViet FOREIGN KEY(MaBaiViet) REFERENCES dbo.BaiViet(MaBaiViet) ON DELETE CASCADE
    );
    CREATE INDEX IX_HinhAnhBaiViet_BaiViet ON dbo.HinhAnhBaiViet(MaBaiViet, ThuTu, MaHinhAnh);
END;

/* Many-to-many blog/artwork relation. */
IF OBJECT_ID(N'dbo.BaiVietTacPham', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BaiVietTacPham
    (
        MaBaiViet INT NOT NULL,
        MaTacPham INT NOT NULL,
        ThuTu INT NOT NULL CONSTRAINT DF_BaiVietTacPham_ThuTu DEFAULT (0),
        CONSTRAINT PK_BaiVietTacPham PRIMARY KEY(MaBaiViet, MaTacPham),
        CONSTRAINT FK_BaiVietTacPham_BaiViet FOREIGN KEY(MaBaiViet) REFERENCES dbo.BaiViet(MaBaiViet) ON DELETE CASCADE,
        CONSTRAINT FK_BaiVietTacPham_TacPham FOREIGN KEY(MaTacPham) REFERENCES dbo.TacPham(MaTacPham)
    );
    CREATE INDEX IX_BaiVietTacPham_TacPham ON dbo.BaiVietTacPham(MaTacPham, MaBaiViet);
END;

/* ChiTietTacPham remains the canonical artwork-content table. Do not merge/delete legacy NoiDung. */
IF OBJECT_ID(N'dbo.ChiTietTacPham', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ChiTietTacPham') AND name=N'UX_ChiTietTacPham_MaTacPham')
       AND NOT EXISTS (SELECT MaTacPham FROM dbo.ChiTietTacPham GROUP BY MaTacPham HAVING COUNT_BIG(*)>1)
        CREATE UNIQUE INDEX UX_ChiTietTacPham_MaTacPham ON dbo.ChiTietTacPham(MaTacPham);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ChiTietTacPham') AND name=N'IX_ChiTietTacPham_TrangThai')
        CREATE INDEX IX_ChiTietTacPham_TrangThai ON dbo.ChiTietTacPham(TrangThai, NgayCapNhat DESC);
END;

COMMIT TRANSACTION;
GO

/* Audit only: never repair ambiguous historical data automatically. */
IF OBJECT_ID(N'dbo.ChiTietTacPham', N'U') IS NOT NULL
BEGIN
    SELECT N'duplicate artwork details' AS AuditName, COUNT_BIG(*) AS IssueCount
    FROM (SELECT MaTacPham FROM dbo.ChiTietTacPham GROUP BY MaTacPham HAVING COUNT_BIG(*)>1) d;
    SELECT N'orphan artwork details' AS AuditName, COUNT_BIG(*) AS IssueCount FROM dbo.ChiTietTacPham c LEFT JOIN dbo.TacPham t ON t.MaTacPham=c.MaTacPham WHERE t.MaTacPham IS NULL;
    SELECT N'invalid artwork detail status' AS AuditName, COUNT_BIG(*) AS IssueCount FROM dbo.ChiTietTacPham WHERE TrangThai NOT IN (0,1,2);
END
ELSE SELECT N'ChiTietTacPham table missing' AS AuditName, CAST(1 AS BIGINT) AS IssueCount;

IF OBJECT_ID(N'dbo.NoiDung', N'U') IS NOT NULL
    SELECT N'orphan legacy content' AS AuditName, COUNT_BIG(*) AS IssueCount FROM dbo.NoiDung n LEFT JOIN dbo.TacPham t ON t.MaTacPham=n.MaTacPham WHERE t.MaTacPham IS NULL;
ELSE SELECT N'legacy NoiDung table missing' AS AuditName, CAST(0 AS BIGINT) AS IssueCount;
SELECT N'blog missing account author', COUNT_BIG(*) FROM dbo.BaiViet WHERE MaTaiKhoanTacGia IS NULL;
SELECT N'published blog missing published date', COUNT_BIG(*) FROM dbo.BaiViet WHERE TrangThai=2 AND NgayXuatBan IS NULL;
SELECT N'invalid blog status', COUNT_BIG(*) FROM dbo.BaiViet WHERE TrangThai NOT BETWEEN 0 AND 4;
SELECT N'invalid event range', COUNT_BIG(*) FROM dbo.BaiViet WHERE NgayBatDauSuKien IS NOT NULL AND NgayKetThucSuKien IS NOT NULL AND NgayKetThucSuKien<NgayBatDauSuKien;
SELECT N'orphan blog artwork link', COUNT_BIG(*) FROM dbo.BaiVietTacPham l LEFT JOIN dbo.BaiViet b ON b.MaBaiViet=l.MaBaiViet LEFT JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE b.MaBaiViet IS NULL OR t.MaTacPham IS NULL;
SELECT N'blog links private commission', COUNT_BIG(*) FROM dbo.BaiVietTacPham l INNER JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE t.MaYeuCauVeTranh IS NOT NULL;
SELECT N'blog links non-public artwork', COUNT_BIG(*) FROM dbo.BaiVietTacPham l INNER JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE t.TrangThai<>1 OR t.MaYeuCauVeTranh IS NOT NULL;
GO
