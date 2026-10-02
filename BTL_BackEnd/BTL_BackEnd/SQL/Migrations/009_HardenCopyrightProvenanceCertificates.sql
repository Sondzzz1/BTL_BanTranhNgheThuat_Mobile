SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

/*
    Migration 009 - harden provenance, exclusive ownership and certificates.

    Safety rules:
    - Does not delete or rename existing objects.
    - Does not backfill legacy ownership/certificates.
    - Does not mark historical artworks VERIFIED or exclusive.
    - Must be reviewed against a database backup before production execution.
*/

IF OBJECT_ID(N'dbo.TacPham', N'U') IS NULL THROW 50901, N'Thiếu bảng dbo.TacPham.', 1;
IF OBJECT_ID(N'dbo.BanQuyen', N'U') IS NULL THROW 50902, N'Thiếu bảng dbo.BanQuyen; chạy migration 004 trước.', 1;
IF OBJECT_ID(N'dbo.BangChungBanQuyen', N'U') IS NULL THROW 50903, N'Thiếu bảng dbo.BangChungBanQuyen; chạy migration 004 trước.', 1;
IF OBJECT_ID(N'dbo.LichSuSoHuu', N'U') IS NULL THROW 50904, N'Thiếu bảng dbo.LichSuSoHuu; chạy migration 004 trước.', 1;
IF OBJECT_ID(N'dbo.ChungNhan', N'U') IS NULL THROW 50905, N'Thiếu bảng dbo.ChungNhan; chạy migration 004 trước.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    -- NULL means the historical initial quantity has not been verified.
    IF COL_LENGTH(N'dbo.TacPham', N'SoLuongBanDau') IS NULL
        ALTER TABLE dbo.TacPham ADD SoLuongBanDau INT NULL;

    IF COL_LENGTH(N'dbo.BanQuyen', N'CanCuSuDung') IS NULL
        ALTER TABLE dbo.BanQuyen ADD CanCuSuDung TINYINT NULL;
    IF COL_LENGTH(N'dbo.BanQuyen', N'NguonThamKhao') IS NULL
        ALTER TABLE dbo.BanQuyen ADD NguonThamKhao NVARCHAR(1000) NULL;
    IF COL_LENGTH(N'dbo.BanQuyen', N'LaDuLieuCu') IS NULL
        ALTER TABLE dbo.BanQuyen ADD LaDuLieuCu BIT NOT NULL
            CONSTRAINT DF_BanQuyen_LaDuLieuCu DEFAULT (0) WITH VALUES;
    IF COL_LENGTH(N'dbo.BanQuyen', N'BiChanBan') IS NULL
        ALTER TABLE dbo.BanQuyen ADD BiChanBan BIT NOT NULL
            CONSTRAINT DF_BanQuyen_BiChanBan DEFAULT (0) WITH VALUES;
    IF COL_LENGTH(N'dbo.BanQuyen', N'NgayThuHoiXacMinh') IS NULL
        ALTER TABLE dbo.BanQuyen ADD NgayThuHoiXacMinh DATETIME2 NULL;
    IF COL_LENGTH(N'dbo.BanQuyen', N'LyDoThuHoiXacMinh') IS NULL
        ALTER TABLE dbo.BanQuyen ADD LyDoThuHoiXacMinh NVARCHAR(1000) NULL;

    IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'MoTa') IS NULL
        ALTER TABLE dbo.BangChungBanQuyen ADD MoTa NVARCHAR(500) NULL;
    IF COL_LENGTH(N'dbo.BangChungBanQuyen', N'Sha256') IS NULL
        ALTER TABLE dbo.BangChungBanQuyen ADD Sha256 CHAR(64) NULL;

    -- EventKey gives every future ownership event a stable idempotency key.
    IF COL_LENGTH(N'dbo.LichSuSoHuu', N'EventKey') IS NULL
        ALTER TABLE dbo.LichSuSoHuu ADD EventKey NVARCHAR(160) NULL;
    IF COL_LENGTH(N'dbo.LichSuSoHuu', N'MaYeuCauVeTranh') IS NULL
        ALTER TABLE dbo.LichSuSoHuu ADD MaYeuCauVeTranh INT NULL;

    IF COL_LENGTH(N'dbo.ChungNhan', N'MaYeuCauVeTranh') IS NULL
        ALTER TABLE dbo.ChungNhan ADD MaYeuCauVeTranh INT NULL;

    IF OBJECT_ID(N'dbo.YeuCauVeTranh', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'TrangThaiBanGiao') IS NULL
            ALTER TABLE dbo.YeuCauVeTranh ADD TrangThaiBanGiao TINYINT NOT NULL
                CONSTRAINT DF_YeuCauVeTranh_TrangThaiBanGiao DEFAULT (0) WITH VALUES;
        IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'NgayBanGiao') IS NULL
            ALTER TABLE dbo.YeuCauVeTranh ADD NgayBanGiao DATETIME2 NULL;
        IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'NguoiXacNhanBanGiao') IS NULL
            ALTER TABLE dbo.YeuCauVeTranh ADD NguoiXacNhanBanGiao INT NULL;
        IF COL_LENGTH(N'dbo.YeuCauVeTranh', N'GhiChuBanGiao') IS NULL
            ALTER TABLE dbo.YeuCauVeTranh ADD GhiChuBanGiao NVARCHAR(1000) NULL;
    END;

    IF OBJECT_ID(N'dbo.ThanhToanYeuCau', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(N'dbo.ThanhToanYeuCau', N'MaGiaoDich') IS NULL
            ALTER TABLE dbo.ThanhToanYeuCau ADD MaGiaoDich NVARCHAR(100) NULL;
        IF COL_LENGTH(N'dbo.ThanhToanYeuCau', N'NguoiXacNhan') IS NULL
            ALTER TABLE dbo.ThanhToanYeuCau ADD NguoiXacNhan INT NULL;
        IF COL_LENGTH(N'dbo.ThanhToanYeuCau', N'NgayXacNhan') IS NULL
            ALTER TABLE dbo.ThanhToanYeuCau ADD NgayXacNhan DATETIME2 NULL;
        IF COL_LENGTH(N'dbo.ThanhToanYeuCau', N'GhiChu') IS NULL
            ALTER TABLE dbo.ThanhToanYeuCau ADD GhiChu NVARCHAR(500) NULL;
        IF COL_LENGTH(N'dbo.ThanhToanYeuCau', N'IdempotencyKey') IS NULL
            ALTER TABLE dbo.ThanhToanYeuCau ADD IdempotencyKey NVARCHAR(100) NULL;
    END;

    IF OBJECT_ID(N'dbo.NhatKyHeThong', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.NhatKyHeThong
        (
            MaNhatKy BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NhatKyHeThong PRIMARY KEY,
            TenDoiTuong NVARCHAR(100) NOT NULL,
            MaDoiTuong INT NOT NULL,
            HanhDong NVARCHAR(100) NOT NULL,
            GiaTriTruoc NVARCHAR(MAX) NULL,
            GiaTriSau NVARCHAR(MAX) NULL,
            NguoiThucHien INT NULL,
            VaiTro TINYINT NULL,
            ThoiGian DATETIME2 NOT NULL CONSTRAINT DF_NhatKyHeThong_ThoiGian DEFAULT (SYSUTCDATETIME()),
            DiaChiIP NVARCHAR(64) NULL,
            LyDo NVARCHAR(1000) NULL,
            ThongTinBoSung NVARCHAR(MAX) NULL
        );
    END;

    -- Dynamic SQL is required here because SQL Server compiles a batch before executing
    -- the ALTER TABLE statements above. Direct references to newly added columns can
    -- otherwise fail with "Invalid column name" on the first run.
    EXEC sys.sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''dbo.LichSuSoHuu'') AND name=N''UX_LichSuSoHuu_EventKey'')
            CREATE UNIQUE INDEX UX_LichSuSoHuu_EventKey ON dbo.LichSuSoHuu(EventKey) WHERE EventKey IS NOT NULL;';

    EXEC sys.sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''dbo.LichSuSoHuu'') AND name=N''UX_LichSuSoHuu_CustomArtTransfer'')
            CREATE UNIQUE INDEX UX_LichSuSoHuu_CustomArtTransfer
                ON dbo.LichSuSoHuu(MaYeuCauVeTranh)
                WHERE MaYeuCauVeTranh IS NOT NULL AND LoaiChuyenGiao=1;';

    EXEC sys.sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''dbo.NhatKyHeThong'') AND name=N''IX_NhatKyHeThong_DoiTuong'')
            CREATE INDEX IX_NhatKyHeThong_DoiTuong
                ON dbo.NhatKyHeThong(TenDoiTuong,MaDoiTuong,ThoiGian DESC);';

    IF OBJECT_ID(N'dbo.ThanhToanYeuCau', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''dbo.ThanhToanYeuCau'') AND name=N''UX_ThanhToanYeuCau_IdempotencyKey'')
               AND NOT EXISTS (SELECT MaYeuCau,IdempotencyKey FROM dbo.ThanhToanYeuCau WHERE IdempotencyKey IS NOT NULL
                               GROUP BY MaYeuCau,IdempotencyKey HAVING COUNT_BIG(*)>1)
                CREATE UNIQUE INDEX UX_ThanhToanYeuCau_IdempotencyKey
                    ON dbo.ThanhToanYeuCau(MaYeuCau,IdempotencyKey) WHERE IdempotencyKey IS NOT NULL;';

    IF OBJECT_ID(N'dbo.ThanhToanYeuCau', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''dbo.ThanhToanYeuCau'') AND name=N''UX_ThanhToanYeuCau_CompletedTransaction'')
               AND NOT EXISTS (SELECT MaGiaoDich FROM dbo.ThanhToanYeuCau
                               WHERE MaGiaoDich IS NOT NULL AND TrangThai=N''Completed''
                               GROUP BY MaGiaoDich HAVING COUNT_BIG(*)>1)
                CREATE UNIQUE INDEX UX_ThanhToanYeuCau_CompletedTransaction
                    ON dbo.ThanhToanYeuCau(MaGiaoDich)
                    WHERE MaGiaoDich IS NOT NULL AND TrangThai=N''Completed'';';

    IF OBJECT_ID(N'dbo.YeuCauVeTranh', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''FK_LichSuSoHuu_YeuCauVeTranh'')
               AND NOT EXISTS (
                   SELECT 1 FROM dbo.LichSuSoHuu l
                   LEFT JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau=l.MaYeuCauVeTranh
                   WHERE l.MaYeuCauVeTranh IS NOT NULL AND y.MaYeuCau IS NULL)
                ALTER TABLE dbo.LichSuSoHuu WITH CHECK ADD CONSTRAINT FK_LichSuSoHuu_YeuCauVeTranh
                    FOREIGN KEY(MaYeuCauVeTranh) REFERENCES dbo.YeuCauVeTranh(MaYeuCau);';

    IF OBJECT_ID(N'dbo.YeuCauVeTranh', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''FK_ChungNhan_YeuCauVeTranh'')
               AND NOT EXISTS (
                   SELECT 1 FROM dbo.ChungNhan c
                   LEFT JOIN dbo.YeuCauVeTranh y ON y.MaYeuCau=c.MaYeuCauVeTranh
                   WHERE c.MaYeuCauVeTranh IS NOT NULL AND y.MaYeuCau IS NULL)
                ALTER TABLE dbo.ChungNhan WITH CHECK ADD CONSTRAINT FK_ChungNhan_YeuCauVeTranh
                    FOREIGN KEY(MaYeuCauVeTranh) REFERENCES dbo.YeuCauVeTranh(MaYeuCau);';

    IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NOT NULL
        EXEC sys.sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''FK_NhatKyHeThong_TaiKhoan'')
               AND NOT EXISTS (
                   SELECT 1 FROM dbo.NhatKyHeThong n
                   LEFT JOIN dbo.TaiKhoan t ON t.MaTaiKhoan=n.NguoiThucHien
                   WHERE n.NguoiThucHien IS NOT NULL AND t.MaTaiKhoan IS NULL)
                ALTER TABLE dbo.NhatKyHeThong WITH CHECK ADD CONSTRAINT FK_NhatKyHeThong_TaiKhoan
                    FOREIGN KEY(NguoiThucHien) REFERENCES dbo.TaiKhoan(MaTaiKhoan);';

    -- Keep the immutable-log protection in the same transaction as the table.
    EXEC sys.sp_executesql N'
        CREATE OR ALTER TRIGGER dbo.TR_NhatKyHeThong_BlockUpdate
        ON dbo.NhatKyHeThong
        INSTEAD OF UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            THROW 50920, N''Nhật ký hệ thống là dữ liệu bất biến và không được cập nhật.'', 1;
        END;';

    EXEC sys.sp_executesql N'
        CREATE OR ALTER TRIGGER dbo.TR_NhatKyHeThong_BlockDelete
        ON dbo.NhatKyHeThong
        INSTEAD OF DELETE
        AS
        BEGIN
            SET NOCOUNT ON;
            THROW 50921, N''Nhật ký hệ thống là dữ liệu bất biến và không được xóa.'', 1;
        END;';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SELECT N'TacPham thiếu SoLuongBanDau' AS AuditName, COUNT_BIG(*) AS IssueCount
FROM dbo.TacPham WHERE SoLuongBanDau IS NULL
UNION ALL
SELECT N'Tác phẩm đánh dấu độc bản nhưng SoLuongBanDau khác 1', COUNT_BIG(*)
FROM dbo.TacPham WHERE ISNULL(LaTacPhamDocBan,0)=1 AND ISNULL(SoLuongBanDau,-1)<>1
UNION ALL
SELECT N'Ownership không có EventKey (dữ liệu cũ)', COUNT_BIG(*)
FROM dbo.LichSuSoHuu WHERE EventKey IS NULL;
GO
