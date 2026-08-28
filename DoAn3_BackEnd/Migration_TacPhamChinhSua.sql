-- ================================================================
-- MIGRATION: Thêm bảng TacPhamChinhSua để lưu nội dung chỉnh sửa chờ duyệt
-- ================================================================

USE HeThongBanTranh;
GO

-- Tạo bảng TacPhamChinhSua
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TacPhamChinhSua')
BEGIN
    CREATE TABLE TacPhamChinhSua (
        MaChinhSua      INT             IDENTITY(1,1) PRIMARY KEY,
        MaTacPham       INT             NOT NULL,
        TenTacPham      NVARCHAR(255)   NOT NULL,
        MaDanhMuc       INT             NULL,
        Gia             DECIMAL(18,2)   NOT NULL,
        SoLuong         INT             NOT NULL,
        MoTa            NVARCHAR(MAX)   NULL,
        HinhAnh         NVARCHAR(500)   NULL,
        KichThuoc       NVARCHAR(100)   NULL,
        ChatLieu        NVARCHAR(255)   NULL,
        ChatLieuKhung   NVARCHAR(255)   NULL,
        NgayChinhSua    DATETIME        NOT NULL DEFAULT GETDATE(),
        TrangThai       TINYINT         NOT NULL DEFAULT 0, -- 0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối
        LyDo            NVARCHAR(500)   NULL, -- Lý do từ chối (nếu có)
        FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham) ON DELETE CASCADE,
        FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
    );
    
    PRINT 'Đã tạo bảng TacPhamChinhSua';
END
ELSE
BEGIN
    PRINT 'Bảng TacPhamChinhSua đã tồn tại';
END
GO

-- Tạo index để tăng tốc truy vấn
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TacPhamChinhSua_MaTacPham')
BEGIN
    CREATE INDEX IX_TacPhamChinhSua_MaTacPham ON TacPhamChinhSua(MaTacPham);
    PRINT 'Đã tạo index IX_TacPhamChinhSua_MaTacPham';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TacPhamChinhSua_TrangThai')
BEGIN
    CREATE INDEX IX_TacPhamChinhSua_TrangThai ON TacPhamChinhSua(TrangThai);
    PRINT 'Đã tạo index IX_TacPhamChinhSua_TrangThai';
END
GO

PRINT 'Migration hoàn tất!';
GO
