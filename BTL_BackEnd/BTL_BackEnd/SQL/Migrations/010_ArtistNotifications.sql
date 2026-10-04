/*
    Migration 010 - notification inbox for account-specific workflow messages.
    Run once after migrations 004 and 009.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NULL
    THROW 51001, N'Thiếu bảng dbo.TaiKhoan.', 1;

IF OBJECT_ID(N'dbo.ThongBao', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ThongBao
    (
        MaThongBao BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ThongBao PRIMARY KEY,
        MaTaiKhoan INT NOT NULL,
        Loai NVARCHAR(80) NOT NULL,
        TieuDe NVARCHAR(200) NOT NULL,
        NoiDung NVARCHAR(2000) NOT NULL,
        LoaiDoiTuong NVARCHAR(50) NULL,
        MaDoiTuong INT NULL,
        DuongDan NVARCHAR(500) NULL,
        EventKey NVARCHAR(180) NULL,
        DaDoc BIT NOT NULL CONSTRAINT DF_ThongBao_DaDoc DEFAULT (0),
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_ThongBao_NgayTao DEFAULT (SYSUTCDATETIME()),
        NgayDoc DATETIME2 NULL,
        CONSTRAINT FK_ThongBao_TaiKhoan FOREIGN KEY (MaTaiKhoan) REFERENCES dbo.TaiKhoan(MaTaiKhoan)
    );
END;

/* The migration is safe when an early version of the notification table exists. */
IF COL_LENGTH(N'dbo.ThongBao', N'LoaiDoiTuong') IS NULL
    ALTER TABLE dbo.ThongBao ADD LoaiDoiTuong NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.ThongBao', N'MaDoiTuong') IS NULL
    ALTER TABLE dbo.ThongBao ADD MaDoiTuong INT NULL;
IF COL_LENGTH(N'dbo.ThongBao', N'EventKey') IS NULL
    ALTER TABLE dbo.ThongBao ADD EventKey NVARCHAR(180) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ThongBao') AND name=N'IX_ThongBao_TaiKhoan_DaDoc_NgayTao')
    CREATE INDEX IX_ThongBao_TaiKhoan_DaDoc_NgayTao
        ON dbo.ThongBao(MaTaiKhoan,DaDoc,NgayTao DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ThongBao') AND name=N'IX_ThongBao_TaiKhoan_NgayTao')
    CREATE INDEX IX_ThongBao_TaiKhoan_NgayTao
        ON dbo.ThongBao(MaTaiKhoan,NgayTao DESC,MaThongBao DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ThongBao') AND name=N'UX_ThongBao_EventKey')
    CREATE UNIQUE INDEX UX_ThongBao_EventKey
        ON dbo.ThongBao(EventKey)
        WHERE EventKey IS NOT NULL;
