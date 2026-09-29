SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.YeuCauHoanTra', N'U') IS NULL
    THROW 50020, N'Không tìm thấy bảng dbo.YeuCauHoanTra.', 1;
IF OBJECT_ID(N'dbo.DonHang', N'U') IS NULL
    THROW 50021, N'Không tìm thấy bảng dbo.DonHang.', 1;
IF OBJECT_ID(N'dbo.ChiTietDonHang', N'U') IS NULL
    THROW 50022, N'Không tìm thấy bảng dbo.ChiTietDonHang.', 1;

-- Batch riêng để các batch sau có thể tham chiếu cột vừa thêm trên mọi phiên bản SQL Server.
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'MaChiTietDH') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD MaChiTietDH INT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'SoLuongTra') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD SoLuongTra INT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'CoTheBanLai') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD CoTheBanLai BIT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'SoTienHoan') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD SoTienHoan DECIMAL(18,2) NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'PhuongThucHoanTien') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD PhuongThucHoanTien NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'TrangThaiHoanTien') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD TrangThaiHoanTien NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NgayHoanTien') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NgayHoanTien DATETIME2 NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NguoiDuyet') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NguoiDuyet INT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NgayDuyet') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NgayDuyet DATETIME2 NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NguoiNhanHang') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NguoiNhanHang INT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NgayNhanHang') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NgayNhanHang DATETIME2 NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NguoiHoanTien') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NguoiHoanTien INT NULL;
IF COL_LENGTH(N'dbo.YeuCauHoanTra', N'NgayHuy') IS NULL
    ALTER TABLE dbo.YeuCauHoanTra ADD NgayHuy DATETIME2 NULL;

IF COL_LENGTH(N'dbo.ChiTietDonHang', N'SoLuongDaHoan') IS NULL
    ALTER TABLE dbo.ChiTietDonHang ADD SoLuongDaHoan INT NOT NULL
        CONSTRAINT DF_ChiTietDonHang_SoLuongDaHoan DEFAULT (0) WITH VALUES;

IF COL_LENGTH(N'dbo.DonHang', N'NgayGiao') IS NULL
    ALTER TABLE dbo.DonHang ADD NgayGiao DATETIME2 NULL;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- Chỉ backfill khi (đơn hàng, tác phẩm) ánh xạ chính xác một dòng chi tiết.
    ;WITH UniqueOrderLine AS
    (
        SELECT MaDonHang, MaTacPham, MIN(MaChiTietDH) AS MaChiTietDH, COUNT_BIG(*) AS LineCount
        FROM dbo.ChiTietDonHang
        GROUP BY MaDonHang, MaTacPham
    )
    UPDATE y
       SET y.MaChiTietDH = u.MaChiTietDH
    FROM dbo.YeuCauHoanTra y
    INNER JOIN UniqueOrderLine u
        ON u.MaDonHang = y.MaDonHang AND u.MaTacPham = y.MaTacPham AND u.LineCount = 1
    WHERE y.MaChiTietDH IS NULL;

    UPDATE y
       SET y.SoLuongTra = c.SoLuong
    FROM dbo.YeuCauHoanTra y
    INNER JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH = y.MaChiTietDH
    WHERE y.SoLuongTra IS NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_YeuCauHoanTra_SoLuongTra')
        ALTER TABLE dbo.YeuCauHoanTra WITH CHECK ADD CONSTRAINT CK_YeuCauHoanTra_SoLuongTra
            CHECK (SoLuongTra IS NULL OR SoLuongTra > 0);

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ChiTietDonHang_SoLuongDaHoan')
        ALTER TABLE dbo.ChiTietDonHang WITH CHECK ADD CONSTRAINT CK_ChiTietDonHang_SoLuongDaHoan
            CHECK (SoLuongDaHoan >= 0 AND SoLuongDaHoan <= SoLuong);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.YeuCauHoanTra') AND name=N'IX_YeuCauHoanTra_NguoiDung_NgayTao')
        CREATE INDEX IX_YeuCauHoanTra_NguoiDung_NgayTao ON dbo.YeuCauHoanTra(MaNguoiDung, NgayTao DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.YeuCauHoanTra') AND name=N'IX_YeuCauHoanTra_TrangThai_NgayTao')
        CREATE INDEX IX_YeuCauHoanTra_TrangThai_NgayTao ON dbo.YeuCauHoanTra(TrangThai, NgayTao DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.YeuCauHoanTra') AND name=N'IX_YeuCauHoanTra_ChiTiet_TrangThai')
        CREATE INDEX IX_YeuCauHoanTra_ChiTiet_TrangThai ON dbo.YeuCauHoanTra(MaChiTietDH, TrangThai) WHERE MaChiTietDH IS NOT NULL;

    -- Không tạo FK nếu còn orphan; tuyệt đối không xóa hoặc sửa dữ liệu để ép tạo FK.
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_YeuCauHoanTra_ChiTietDonHang')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.YeuCauHoanTra y
           LEFT JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH=y.MaChiTietDH
           WHERE y.MaChiTietDH IS NOT NULL AND c.MaChiTietDH IS NULL)
        ALTER TABLE dbo.YeuCauHoanTra WITH CHECK ADD CONSTRAINT FK_YeuCauHoanTra_ChiTietDonHang
            FOREIGN KEY (MaChiTietDH) REFERENCES dbo.ChiTietDonHang(MaChiTietDH);

    IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_YeuCauHoanTra_NguoiDuyet')
           AND NOT EXISTS (SELECT 1 FROM dbo.YeuCauHoanTra y LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=y.NguoiDuyet WHERE y.NguoiDuyet IS NOT NULL AND t.MaTaiKhoan IS NULL)
            ALTER TABLE dbo.YeuCauHoanTra WITH CHECK ADD CONSTRAINT FK_YeuCauHoanTra_NguoiDuyet FOREIGN KEY (NguoiDuyet) REFERENCES dbo.TaiKhoan(MaTaiKhoan);
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_YeuCauHoanTra_NguoiNhanHang')
           AND NOT EXISTS (SELECT 1 FROM dbo.YeuCauHoanTra y LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=y.NguoiNhanHang WHERE y.NguoiNhanHang IS NOT NULL AND t.MaTaiKhoan IS NULL)
            ALTER TABLE dbo.YeuCauHoanTra WITH CHECK ADD CONSTRAINT FK_YeuCauHoanTra_NguoiNhanHang FOREIGN KEY (NguoiNhanHang) REFERENCES dbo.TaiKhoan(MaTaiKhoan);
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_YeuCauHoanTra_NguoiHoanTien')
           AND NOT EXISTS (SELECT 1 FROM dbo.YeuCauHoanTra y LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=y.NguoiHoanTien WHERE y.NguoiHoanTien IS NOT NULL AND t.MaTaiKhoan IS NULL)
            ALTER TABLE dbo.YeuCauHoanTra WITH CHECK ADD CONSTRAINT FK_YeuCauHoanTra_NguoiHoanTien FOREIGN KEY (NguoiHoanTien) REFERENCES dbo.TaiKhoan(MaTaiKhoan);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Báo cáo hậu migration; không tự sửa các dòng cần quản trị viên xem xét.
SELECT N'YeuCauHoanTra chưa xác định được MaChiTietDH' AS KiemTra, COUNT_BIG(*) AS SoBanGhi
FROM dbo.YeuCauHoanTra WHERE MaChiTietDH IS NULL
UNION ALL
SELECT N'YeuCauHoanTra có MaChiTietDH mồ côi', COUNT_BIG(*)
FROM dbo.YeuCauHoanTra y
LEFT JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH=y.MaChiTietDH
WHERE y.MaChiTietDH IS NOT NULL AND c.MaChiTietDH IS NULL
UNION ALL
SELECT N'YeuCauHoanTra có số lượng vượt dòng đơn', COUNT_BIG(*)
FROM dbo.YeuCauHoanTra y
INNER JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH=y.MaChiTietDH
WHERE y.SoLuongTra IS NOT NULL AND y.SoLuongTra > c.SoLuong;

IF OBJECT_ID(N'dbo.LichSuSoHuu', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.LichSuSoHuu', N'MaTacPham') IS NOT NULL
   AND COL_LENGTH(N'dbo.LichSuSoHuu', N'TrangThai') IS NOT NULL
    EXEC sys.sp_executesql N'
        SELECT N''Tác phẩm có nhiều owner CURRENT'' AS KiemTra, COUNT_BIG(*) AS SoBanGhi
        FROM (SELECT MaTacPham FROM dbo.LichSuSoHuu WHERE TrangThai=1 GROUP BY MaTacPham HAVING COUNT_BIG(*)>1) d;';
GO
