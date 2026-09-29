SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.TacPham', N'U') IS NULL THROW 50040, N'Không tìm thấy bảng dbo.TacPham.', 1;
IF OBJECT_ID(N'dbo.HoaSi', N'U') IS NULL THROW 50041, N'Không tìm thấy bảng dbo.HoaSi.', 1;
IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NULL THROW 50042, N'Không tìm thấy bảng dbo.NguoiDung.', 1;

IF OBJECT_ID(N'dbo.BanQuyen', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BanQuyen
    (
        MaBanQuyen INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BanQuyen PRIMARY KEY,
        MaTacPham INT NOT NULL,
        MaTacGia INT NULL,
        MaNguoiGiuQuyen INT NULL,
        TacGia NVARCHAR(255) NULL,
        NgaySangTac DATE NULL,
        NguonGoc NVARCHAR(1000) NULL,
        MoTa NVARCHAR(MAX) NULL,
        GhiChu NVARCHAR(1000) NULL,
        TrangThai TINYINT NOT NULL CONSTRAINT DF_BanQuyen_TrangThai DEFAULT (0),
        TrangThaiTruocTranhChap TINYINT NULL,
        SoDangKy NVARCHAR(100) NULL,
        LyDo NVARCHAR(1000) NULL,
        GhiChuKiemDuyet NVARCHAR(1000) NULL,
        NguoiKiemDuyet INT NULL,
        NgayKiemDuyet DATETIME2 NULL,
        NguoiTao INT NULL,
        NguoiCapNhat INT NULL,
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_BanQuyen_NgayTao DEFAULT (SYSDATETIME()),
        NgayCapNhat DATETIME2 NOT NULL CONSTRAINT DF_BanQuyen_NgayCapNhat DEFAULT (SYSDATETIME())
    );
END;

IF OBJECT_ID(N'dbo.BangChungBanQuyen', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BangChungBanQuyen
    (
        MaBangChung INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BangChungBanQuyen PRIMARY KEY,
        MaBanQuyen INT NOT NULL,
        TenTepGoc NVARCHAR(255) NOT NULL,
        TenTepLuu NVARCHAR(255) NOT NULL,
        DuongDan NVARCHAR(1000) NOT NULL,
        LoaiTep NVARCHAR(100) NOT NULL,
        KichThuoc BIGINT NOT NULL,
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_BangChungBanQuyen_NgayTao DEFAULT (SYSDATETIME()),
        NguoiTao INT NULL
    );
END;

IF OBJECT_ID(N'dbo.LichSuSoHuu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LichSuSoHuu
    (
        MaLichSuSoHuu INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LichSuSoHuu PRIMARY KEY,
        MaTacPham INT NOT NULL,
        MaNguoiDung INT NULL,
        MaHoaSi INT NULL,
        NgayNhan DATETIME2 NOT NULL,
        NgayChuyenGiao DATETIME2 NULL,
        LoaiChuyenGiao TINYINT NOT NULL,
        TrangThai TINYINT NOT NULL,
        MaDonHang INT NULL,
        MaChiTietDH INT NULL,
        MaYeuCauHoanTra INT NULL,
        GhiChu NVARCHAR(1000) NULL,
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_LichSuSoHuu_NgayTao DEFAULT (SYSDATETIME())
    );
END;

IF OBJECT_ID(N'dbo.ChungNhan', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChungNhan
    (
        MaChungNhan INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ChungNhan PRIMARY KEY,
        MaLichSuSoHuu INT NOT NULL,
        MaTacPham INT NULL,
        MaNguoiDung INT NULL,
        CertificateCode NVARCHAR(80) NOT NULL,
        ContentHash NVARCHAR(255) NULL,
        NgayCap DATETIME2 NOT NULL,
        TrangThai TINYINT NOT NULL,
        NguoiCap NVARCHAR(255) NULL,
        NgayThuHoi DATETIME2 NULL,
        LyDoThuHoi NVARCHAR(1000) NULL,
        DuongDanPDF NVARCHAR(1000) NULL,
        DuongDanQR NVARCHAR(1000) NULL,
        HienThiChuSoHuu BIT NOT NULL CONSTRAINT DF_ChungNhan_HienThiChuSoHuu DEFAULT (0),
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_ChungNhan_NgayTao DEFAULT (SYSDATETIME())
    );
END;

IF COL_LENGTH(N'dbo.TacPham', N'LaTacPhamDocBan') IS NULL
    ALTER TABLE dbo.TacPham ADD LaTacPhamDocBan BIT NOT NULL
        CONSTRAINT DF_TacPham_LaTacPhamDocBan DEFAULT (0) WITH VALUES;

IF COL_LENGTH(N'dbo.BanQuyen', N'MaTacGia') IS NULL ALTER TABLE dbo.BanQuyen ADD MaTacGia INT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'MaNguoiGiuQuyen') IS NULL ALTER TABLE dbo.BanQuyen ADD MaNguoiGiuQuyen INT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'TacGia') IS NULL ALTER TABLE dbo.BanQuyen ADD TacGia NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NgaySangTac') IS NULL ALTER TABLE dbo.BanQuyen ADD NgaySangTac DATE NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NguonGoc') IS NULL ALTER TABLE dbo.BanQuyen ADD NguonGoc NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'MoTa') IS NULL ALTER TABLE dbo.BanQuyen ADD MoTa NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'GhiChu') IS NULL ALTER TABLE dbo.BanQuyen ADD GhiChu NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'TrangThai') IS NULL ALTER TABLE dbo.BanQuyen ADD TrangThai TINYINT NOT NULL CONSTRAINT DF_BanQuyen_TrangThai_Migration DEFAULT (0) WITH VALUES;
IF COL_LENGTH(N'dbo.BanQuyen', N'TrangThaiTruocTranhChap') IS NULL ALTER TABLE dbo.BanQuyen ADD TrangThaiTruocTranhChap TINYINT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'SoDangKy') IS NULL ALTER TABLE dbo.BanQuyen ADD SoDangKy NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'LyDo') IS NULL ALTER TABLE dbo.BanQuyen ADD LyDo NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'GhiChuKiemDuyet') IS NULL ALTER TABLE dbo.BanQuyen ADD GhiChuKiemDuyet NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NguoiKiemDuyet') IS NULL ALTER TABLE dbo.BanQuyen ADD NguoiKiemDuyet INT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NgayKiemDuyet') IS NULL ALTER TABLE dbo.BanQuyen ADD NgayKiemDuyet DATETIME2 NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NguoiTao') IS NULL ALTER TABLE dbo.BanQuyen ADD NguoiTao INT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NguoiCapNhat') IS NULL ALTER TABLE dbo.BanQuyen ADD NguoiCapNhat INT NULL;
IF COL_LENGTH(N'dbo.BanQuyen', N'NgayTao') IS NULL ALTER TABLE dbo.BanQuyen ADD NgayTao DATETIME2 NOT NULL CONSTRAINT DF_BanQuyen_NgayTao_Migration DEFAULT (SYSDATETIME()) WITH VALUES;
IF COL_LENGTH(N'dbo.BanQuyen', N'NgayCapNhat') IS NULL ALTER TABLE dbo.BanQuyen ADD NgayCapNhat DATETIME2 NOT NULL CONSTRAINT DF_BanQuyen_NgayCapNhat_Migration DEFAULT (SYSDATETIME()) WITH VALUES;

IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'TenTepGoc') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD TenTepGoc NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'TenTepLuu') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD TenTepLuu NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'DuongDan') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD DuongDan NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'LoaiTep') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD LoaiTep NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'KichThuoc') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD KichThuoc BIGINT NULL;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'NgayTao') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD NgayTao DATETIME2 NOT NULL CONSTRAINT DF_BangChungBanQuyen_NgayTao_Migration DEFAULT (SYSDATETIME()) WITH VALUES;
IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'NguoiTao') IS NULL ALTER TABLE dbo.BangChungBanQuyen ADD NguoiTao INT NULL;

IF COL_LENGTH(N'dbo.LichSuSoHuu', N'MaChiTietDH') IS NULL ALTER TABLE dbo.LichSuSoHuu ADD MaChiTietDH INT NULL;
IF COL_LENGTH(N'dbo.LichSuSoHuu', N'MaYeuCauHoanTra') IS NULL ALTER TABLE dbo.LichSuSoHuu ADD MaYeuCauHoanTra INT NULL;
IF COL_LENGTH(N'dbo.LichSuSoHuu', N'GhiChu') IS NULL ALTER TABLE dbo.LichSuSoHuu ADD GhiChu NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.LichSuSoHuu', N'NgayTao') IS NULL ALTER TABLE dbo.LichSuSoHuu ADD NgayTao DATETIME2 NOT NULL CONSTRAINT DF_LichSuSoHuu_NgayTao_Migration DEFAULT (SYSDATETIME()) WITH VALUES;

IF COL_LENGTH(N'dbo.ChungNhan', N'MaTacPham') IS NULL ALTER TABLE dbo.ChungNhan ADD MaTacPham INT NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'MaNguoiDung') IS NULL ALTER TABLE dbo.ChungNhan ADD MaNguoiDung INT NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'ContentHash') IS NULL ALTER TABLE dbo.ChungNhan ADD ContentHash NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'NgayThuHoi') IS NULL ALTER TABLE dbo.ChungNhan ADD NgayThuHoi DATETIME2 NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'LyDoThuHoi') IS NULL ALTER TABLE dbo.ChungNhan ADD LyDoThuHoi NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'DuongDanPDF') IS NULL ALTER TABLE dbo.ChungNhan ADD DuongDanPDF NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'DuongDanQR') IS NULL ALTER TABLE dbo.ChungNhan ADD DuongDanQR NVARCHAR(1000) NULL;
IF COL_LENGTH(N'dbo.ChungNhan', N'HienThiChuSoHuu') IS NULL ALTER TABLE dbo.ChungNhan ADD HienThiChuSoHuu BIT NOT NULL CONSTRAINT DF_ChungNhan_HienThiChuSoHuu_Migration DEFAULT (0) WITH VALUES;
IF COL_LENGTH(N'dbo.ChungNhan', N'NgayTao') IS NULL ALTER TABLE dbo.ChungNhan ADD NgayTao DATETIME2 NOT NULL CONSTRAINT DF_ChungNhan_NgayTao_Migration DEFAULT (SYSDATETIME()) WITH VALUES;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.BanQuyen') AND name=N'UX_BanQuyen_MaTacPham')
       AND NOT EXISTS (SELECT MaTacPham FROM dbo.BanQuyen GROUP BY MaTacPham HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_BanQuyen_MaTacPham ON dbo.BanQuyen(MaTacPham);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.BanQuyen') AND name=N'IX_BanQuyen_TrangThai_NgayTao')
        CREATE INDEX IX_BanQuyen_TrangThai_NgayTao ON dbo.BanQuyen(TrangThai, NgayTao DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.BangChungBanQuyen') AND name=N'IX_BangChungBanQuyen_MaBanQuyen')
        CREATE INDEX IX_BangChungBanQuyen_MaBanQuyen ON dbo.BangChungBanQuyen(MaBanQuyen, NgayTao DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LichSuSoHuu') AND name=N'IX_LichSuSoHuu_MaTacPham')
        CREATE INDEX IX_LichSuSoHuu_MaTacPham ON dbo.LichSuSoHuu(MaTacPham, NgayNhan DESC);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LichSuSoHuu') AND name=N'UX_LichSuSoHuu_Current')
       AND NOT EXISTS (SELECT MaTacPham FROM dbo.LichSuSoHuu WHERE TrangThai=1 GROUP BY MaTacPham HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_LichSuSoHuu_Current ON dbo.LichSuSoHuu(MaTacPham) WHERE TrangThai=1;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LichSuSoHuu') AND name=N'UX_LichSuSoHuu_SaleLine')
       AND NOT EXISTS (SELECT MaChiTietDH FROM dbo.LichSuSoHuu WHERE MaChiTietDH IS NOT NULL AND LoaiChuyenGiao=1 GROUP BY MaChiTietDH HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_LichSuSoHuu_SaleLine ON dbo.LichSuSoHuu(MaChiTietDH) WHERE MaChiTietDH IS NOT NULL AND LoaiChuyenGiao=1;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LichSuSoHuu') AND name=N'UX_LichSuSoHuu_Return')
       AND NOT EXISTS (SELECT MaYeuCauHoanTra FROM dbo.LichSuSoHuu WHERE MaYeuCauHoanTra IS NOT NULL AND LoaiChuyenGiao=3 GROUP BY MaYeuCauHoanTra HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_LichSuSoHuu_Return ON dbo.LichSuSoHuu(MaYeuCauHoanTra) WHERE MaYeuCauHoanTra IS NOT NULL AND LoaiChuyenGiao=3;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ChungNhan') AND name=N'UX_ChungNhan_CertificateCode')
       AND NOT EXISTS (SELECT CertificateCode FROM dbo.ChungNhan GROUP BY CertificateCode HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_ChungNhan_CertificateCode ON dbo.ChungNhan(CertificateCode);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ChungNhan') AND name=N'UX_ChungNhan_Ownership')
       AND NOT EXISTS (SELECT MaLichSuSoHuu FROM dbo.ChungNhan GROUP BY MaLichSuSoHuu HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_ChungNhan_Ownership ON dbo.ChungNhan(MaLichSuSoHuu);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ChungNhan') AND name=N'UX_ChungNhan_ActiveArtwork')
       AND NOT EXISTS (SELECT MaTacPham FROM dbo.ChungNhan WHERE TrangThai=1 AND MaTacPham IS NOT NULL GROUP BY MaTacPham HAVING COUNT_BIG(*) > 1)
        CREATE UNIQUE INDEX UX_ChungNhan_ActiveArtwork ON dbo.ChungNhan(MaTacPham) WHERE TrangThai=1 AND MaTacPham IS NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.LichSuSoHuu') AND name=N'CK_LichSuSoHuu_OneOwnerType')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu WHERE (MaNguoiDung IS NULL AND MaHoaSi IS NULL) OR (MaNguoiDung IS NOT NULL AND MaHoaSi IS NOT NULL))
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT CK_LichSuSoHuu_OneOwnerType
            CHECK ((MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL));

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BanQuyen_TacPham')
       AND NOT EXISTS (SELECT 1 FROM dbo.BanQuyen b LEFT JOIN dbo.TacPham t ON t.MaTacPham=b.MaTacPham WHERE t.MaTacPham IS NULL)
        ALTER TABLE dbo.BanQuyen WITH CHECK ADD CONSTRAINT FK_BanQuyen_TacPham FOREIGN KEY(MaTacPham) REFERENCES dbo.TacPham(MaTacPham);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BangChungBanQuyen_BanQuyen')
       AND NOT EXISTS (SELECT 1 FROM dbo.BangChungBanQuyen e LEFT JOIN dbo.BanQuyen b ON b.MaBanQuyen=e.MaBanQuyen WHERE b.MaBanQuyen IS NULL)
        ALTER TABLE dbo.BangChungBanQuyen WITH CHECK ADD CONSTRAINT FK_BangChungBanQuyen_BanQuyen FOREIGN KEY(MaBanQuyen) REFERENCES dbo.BanQuyen(MaBanQuyen);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_TacPham')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE t.MaTacPham IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_TacPham FOREIGN KEY(MaTacPham) REFERENCES dbo.TacPham(MaTacPham);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_NguoiDung')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung=l.MaNguoiDung WHERE l.MaNguoiDung IS NOT NULL AND n.MaNguoiDung IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_NguoiDung FOREIGN KEY(MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_HoaSi')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.HoaSi h ON h.MaHoaSi=l.MaHoaSi WHERE l.MaHoaSi IS NOT NULL AND h.MaHoaSi IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_HoaSi FOREIGN KEY(MaHoaSi) REFERENCES dbo.HoaSi(MaHoaSi);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_ChungNhan_LichSuSoHuu')
       AND NOT EXISTS (SELECT 1 FROM dbo.ChungNhan c LEFT JOIN dbo.LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu WHERE l.MaLichSuSoHuu IS NULL)
        ALTER TABLE dbo.ChungNhan WITH CHECK ADD CONSTRAINT FK_ChungNhan_LichSuSoHuu FOREIGN KEY(MaLichSuSoHuu) REFERENCES dbo.LichSuSoHuu(MaLichSuSoHuu);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_ChungNhan_TacPham')
       AND NOT EXISTS (SELECT 1 FROM dbo.ChungNhan c LEFT JOIN dbo.TacPham t ON t.MaTacPham=c.MaTacPham WHERE c.MaTacPham IS NOT NULL AND t.MaTacPham IS NULL)
        ALTER TABLE dbo.ChungNhan WITH CHECK ADD CONSTRAINT FK_ChungNhan_TacPham FOREIGN KEY(MaTacPham) REFERENCES dbo.TacPham(MaTacPham);
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_ChungNhan_NguoiDung')
       AND NOT EXISTS (SELECT 1 FROM dbo.ChungNhan c LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung=c.MaNguoiDung WHERE c.MaNguoiDung IS NOT NULL AND n.MaNguoiDung IS NULL)
        ALTER TABLE dbo.ChungNhan WITH CHECK ADD CONSTRAINT FK_ChungNhan_NguoiDung FOREIGN KEY(MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung);

    IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BanQuyen_NguoiKiemDuyet')
           AND NOT EXISTS (SELECT 1 FROM dbo.BanQuyen b LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=b.NguoiKiemDuyet WHERE b.NguoiKiemDuyet IS NOT NULL AND t.MaTaiKhoan IS NULL)
            ALTER TABLE dbo.BanQuyen WITH CHECK ADD CONSTRAINT FK_BanQuyen_NguoiKiemDuyet FOREIGN KEY(NguoiKiemDuyet) REFERENCES dbo.TaiKhoan(MaTaiKhoan);
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_BangChungBanQuyen_NguoiTao')
           AND NOT EXISTS (SELECT 1 FROM dbo.BangChungBanQuyen e LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=e.NguoiTao WHERE e.NguoiTao IS NOT NULL AND t.MaTaiKhoan IS NULL)
            ALTER TABLE dbo.BangChungBanQuyen WITH CHECK ADD CONSTRAINT FK_BangChungBanQuyen_NguoiTao FOREIGN KEY(NguoiTao) REFERENCES dbo.TaiKhoan(MaTaiKhoan);
    END;

    IF OBJECT_ID(N'dbo.DonHang', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_DonHang')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.DonHang d ON d.MaDonHang=l.MaDonHang WHERE l.MaDonHang IS NOT NULL AND d.MaDonHang IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_DonHang FOREIGN KEY(MaDonHang) REFERENCES dbo.DonHang(MaDonHang);
    IF OBJECT_ID(N'dbo.ChiTietDonHang', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_ChiTietDonHang')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.ChiTietDonHang c ON c.MaChiTietDH=l.MaChiTietDH WHERE l.MaChiTietDH IS NOT NULL AND c.MaChiTietDH IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_ChiTietDonHang FOREIGN KEY(MaChiTietDH) REFERENCES dbo.ChiTietDonHang(MaChiTietDH);
    IF OBJECT_ID(N'dbo.YeuCauHoanTra', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_LichSuSoHuu_YeuCauHoanTra')
       AND NOT EXISTS (SELECT 1 FROM dbo.LichSuSoHuu l LEFT JOIN dbo.YeuCauHoanTra y ON y.MaYeuCau=l.MaYeuCauHoanTra WHERE l.MaYeuCauHoanTra IS NOT NULL AND y.MaYeuCau IS NULL)
        ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_YeuCauHoanTra FOREIGN KEY(MaYeuCauHoanTra) REFERENCES dbo.YeuCauHoanTra(MaYeuCau);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SELECT N'BanQuyen mồ côi TacPham' AS KiemTra, COUNT_BIG(*) AS SoBanGhi
FROM dbo.BanQuyen b LEFT JOIN dbo.TacPham t ON t.MaTacPham=b.MaTacPham WHERE t.MaTacPham IS NULL
UNION ALL
SELECT N'BangChung mồ côi BanQuyen', COUNT_BIG(*)
FROM dbo.BangChungBanQuyen e LEFT JOIN dbo.BanQuyen b ON b.MaBanQuyen=e.MaBanQuyen WHERE b.MaBanQuyen IS NULL
UNION ALL
SELECT N'Ownership mồ côi TacPham', COUNT_BIG(*)
FROM dbo.LichSuSoHuu l LEFT JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE t.MaTacPham IS NULL
UNION ALL
SELECT N'Tác phẩm có nhiều owner CURRENT', COUNT_BIG(*)
FROM (SELECT MaTacPham FROM dbo.LichSuSoHuu WHERE TrangThai=1 GROUP BY MaTacPham HAVING COUNT_BIG(*)>1) x
UNION ALL
SELECT N'Tác phẩm có nhiều certificate ACTIVE', COUNT_BIG(*)
FROM (SELECT MaTacPham FROM dbo.ChungNhan WHERE TrangThai=1 AND MaTacPham IS NOT NULL GROUP BY MaTacPham HAVING COUNT_BIG(*)>1) x
UNION ALL
SELECT N'Certificate mồ côi ownership', COUNT_BIG(*)
FROM dbo.ChungNhan c LEFT JOIN dbo.LichSuSoHuu l ON l.MaLichSuSoHuu=c.MaLichSuSoHuu WHERE l.MaLichSuSoHuu IS NULL
UNION ALL
SELECT N'Ownership gắn tác phẩm không độc bản', COUNT_BIG(*)
FROM dbo.LichSuSoHuu l INNER JOIN dbo.TacPham t ON t.MaTacPham=l.MaTacPham WHERE ISNULL(t.LaTacPhamDocBan,0)=0;
GO
