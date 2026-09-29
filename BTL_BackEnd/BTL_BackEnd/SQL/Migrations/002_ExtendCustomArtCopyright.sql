SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.YeuCauVeTranh', N'U') IS NULL
        THROW 50001, N'Không tìm thấy bảng dbo.YeuCauVeTranh. Hãy chạy schema gốc trước.', 1;

    IF OBJECT_ID(N'dbo.TacPham', N'U') IS NULL
        THROW 50002, N'Không tìm thấy bảng dbo.TacPham.', 1;

    -- Các cột Reference* đã được code hiện tại sử dụng nhưng chưa có trong script schema gốc.
    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'Type') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD [Type] INT NOT NULL
            CONSTRAINT DF_YeuCauVeTranh_Type DEFAULT (0) WITH VALUES;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'ReferenceArtworkId') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD ReferenceArtworkId INT NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'ReferenceArtworkName') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD ReferenceArtworkName NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'ReferenceArtistName') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD ReferenceArtistName NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'ReferenceImageUrl') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD ReferenceImageUrl NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'NguonTacPhamGoc') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD NguonTacPhamGoc NVARCHAR(1000) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'TinhTrangQuyenSuDung') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD TinhTrangQuyenSuDung TINYINT NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'DaXacNhanQuyenTaiLieu') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD DaXacNhanQuyenTaiLieu BIT NOT NULL
            CONSTRAINT DF_YeuCauVeTranh_DaXacNhanQuyenTaiLieu DEFAULT (0) WITH VALUES;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'MoTaQuyenSuDung') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD MoTaQuyenSuDung NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'BangChungQuyenSuDung') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD BangChungQuyenSuDung NVARCHAR(1000) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'GhiChuKiemDuyet') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD GhiChuKiemDuyet NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'NguoiKiemDuyet') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD NguoiKiemDuyet INT NULL;

    IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'NgayKiemDuyet') IS NULL
        ALTER TABLE dbo.YeuCauVeTranh ADD NgayKiemDuyet DATETIME2 NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'LoaiTacPham') IS NULL
        ALTER TABLE dbo.TacPham ADD LoaiTacPham TINYINT NOT NULL
            CONSTRAINT DF_TacPham_LoaiTacPham DEFAULT (0) WITH VALUES;

    IF COL_LENGTH(N'dbo.TacPham', N'TacGiaGoc') IS NULL
        ALTER TABLE dbo.TacPham ADD TacGiaGoc NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'MaTacPhamGoc') IS NULL
        ALTER TABLE dbo.TacPham ADD MaTacPhamGoc INT NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'MaYeuCauVeTranh') IS NULL
        ALTER TABLE dbo.TacPham ADD MaYeuCauVeTranh INT NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'MoTaNguonGoc') IS NULL
        ALTER TABLE dbo.TacPham ADD MoTaNguonGoc NVARCHAR(MAX) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.YeuCauVeTranh') AND name = N'IX_YeuCauVeTranh_TrangThai')
        CREATE INDEX IX_YeuCauVeTranh_TrangThai ON dbo.YeuCauVeTranh(TrangThai);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.YeuCauVeTranh') AND name = N'IX_YeuCauVeTranh_Type')
        CREATE INDEX IX_YeuCauVeTranh_Type ON dbo.YeuCauVeTranh([Type]);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.YeuCauVeTranh') AND name = N'IX_YeuCauVeTranh_MaKhachHang')
        CREATE INDEX IX_YeuCauVeTranh_MaKhachHang ON dbo.YeuCauVeTranh(MaKhachHang);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.YeuCauVeTranh') AND name = N'IX_YeuCauVeTranh_MaHoaSi')
        CREATE INDEX IX_YeuCauVeTranh_MaHoaSi ON dbo.YeuCauVeTranh(MaHoaSi);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.TacPham') AND name = N'IX_TacPham_MaTacPhamGoc')
        CREATE INDEX IX_TacPham_MaTacPhamGoc ON dbo.TacPham(MaTacPhamGoc) WHERE MaTacPhamGoc IS NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.TacPham') AND name = N'IX_TacPham_MaYeuCauVeTranh')
        CREATE INDEX IX_TacPham_MaYeuCauVeTranh ON dbo.TacPham(MaYeuCauVeTranh) WHERE MaYeuCauVeTranh IS NOT NULL;

    -- Chỉ thêm FK khi không có dữ liệu mồ côi; migration không tự xóa/sửa dữ liệu cũ.
    IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_YeuCauVeTranh_NguoiDung')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.YeuCauVeTranh y
           LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung = y.MaKhachHang
           WHERE n.MaNguoiDung IS NULL)
        ALTER TABLE dbo.YeuCauVeTranh WITH CHECK ADD CONSTRAINT FK_YeuCauVeTranh_NguoiDung
            FOREIGN KEY (MaKhachHang) REFERENCES dbo.NguoiDung(MaNguoiDung);

    IF OBJECT_ID(N'dbo.HoaSi', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_YeuCauVeTranh_HoaSi')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.YeuCauVeTranh y
           LEFT JOIN dbo.HoaSi h ON h.MaHoaSi = y.MaHoaSi
           WHERE y.MaHoaSi IS NOT NULL AND h.MaHoaSi IS NULL)
        ALTER TABLE dbo.YeuCauVeTranh WITH CHECK ADD CONSTRAINT FK_YeuCauVeTranh_HoaSi
            FOREIGN KEY (MaHoaSi) REFERENCES dbo.HoaSi(MaHoaSi);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_YeuCauVeTranh_TacPhamGoc')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.YeuCauVeTranh y
           LEFT JOIN dbo.TacPham t ON t.MaTacPham = y.ReferenceArtworkId
           WHERE y.ReferenceArtworkId IS NOT NULL AND t.MaTacPham IS NULL)
        ALTER TABLE dbo.YeuCauVeTranh WITH CHECK ADD CONSTRAINT FK_YeuCauVeTranh_TacPhamGoc
            FOREIGN KEY (ReferenceArtworkId) REFERENCES dbo.TacPham(MaTacPham);

    IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_YeuCauVeTranh_NguoiKiemDuyet')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.YeuCauVeTranh y
           LEFT JOIN dbo.TaiKhoan tk ON tk.MaTaiKhoan = y.NguoiKiemDuyet
           WHERE y.NguoiKiemDuyet IS NOT NULL AND tk.MaTaiKhoan IS NULL)
        ALTER TABLE dbo.YeuCauVeTranh WITH CHECK ADD CONSTRAINT FK_YeuCauVeTranh_NguoiKiemDuyet
            FOREIGN KEY (NguoiKiemDuyet) REFERENCES dbo.TaiKhoan(MaTaiKhoan);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TacPham_TacPhamGoc')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.TacPham t
           LEFT JOIN dbo.TacPham g ON g.MaTacPham = t.MaTacPhamGoc
           WHERE t.MaTacPhamGoc IS NOT NULL AND g.MaTacPham IS NULL)
        ALTER TABLE dbo.TacPham WITH CHECK ADD CONSTRAINT FK_TacPham_TacPhamGoc
            FOREIGN KEY (MaTacPhamGoc) REFERENCES dbo.TacPham(MaTacPham);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TacPham_YeuCauVeTranh')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.TacPham t
           LEFT JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau = t.MaYeuCauVeTranh
           WHERE t.MaYeuCauVeTranh IS NOT NULL AND y.MaYeuCau IS NULL)
        ALTER TABLE dbo.TacPham WITH CHECK ADD CONSTRAINT FK_TacPham_YeuCauVeTranh
            FOREIGN KEY (MaYeuCauVeTranh) REFERENCES dbo.YeuCauVeTranh(MaYeuCau);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Báo cáo dữ liệu mồ côi để quản trị viên xử lý; không tự động chỉnh sửa dữ liệu.
SELECT N'YeuCauVeTranh.MaKhachHang' AS KiemTra, COUNT_BIG(*) AS SoBanGhiMoCoi
FROM dbo.YeuCauVeTranh y
LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung = y.MaKhachHang
WHERE n.MaNguoiDung IS NULL
UNION ALL
SELECT N'YeuCauVeTranh.MaHoaSi', COUNT_BIG(*)
FROM dbo.YeuCauVeTranh y
LEFT JOIN dbo.HoaSi h ON h.MaHoaSi = y.MaHoaSi
WHERE y.MaHoaSi IS NOT NULL AND h.MaHoaSi IS NULL
UNION ALL
SELECT N'YeuCauVeTranh.ReferenceArtworkId', COUNT_BIG(*)
FROM dbo.YeuCauVeTranh y
LEFT JOIN dbo.TacPham t ON t.MaTacPham = y.ReferenceArtworkId
WHERE y.ReferenceArtworkId IS NOT NULL AND t.MaTacPham IS NULL;
