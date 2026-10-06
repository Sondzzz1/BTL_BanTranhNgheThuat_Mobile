-- ==========================================================================
-- Migration 012: Hoàn thiện schema HoaDonBan / ChiTietHoaDonBan
-- Mục đích: Bổ sung cột còn thiếu, ràng buộc UNIQUE trên MaDonHang,
--           đảm bảo bảng tồn tại nếu DB cũ chưa tạo.
-- ==========================================================================

-- 1. Đảm bảo bảng HoaDonBan tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('HoaDonBan') AND type = 'U')
BEGIN
    CREATE TABLE HoaDonBan (
        MaHoaDon          INT IDENTITY(1,1) PRIMARY KEY,
        MaDonHang         INT NOT NULL,
        MaNguoiDung       INT NOT NULL,
        NgayXuatHD        DATETIME NOT NULL DEFAULT GETDATE(),
        TongTienHang      DECIMAL(18,2) NOT NULL,
        TenNguoiMua       NVARCHAR(200) NULL,
        DiaChiNguoiMua    NVARCHAR(500) NULL,
        SoDienThoaiNguoiMua NVARCHAR(20) NULL,
        Email             NVARCHAR(200) NULL,
        PhuongThucThanhToan NVARCHAR(50) NULL,
        TrangThaiThanhToan  NVARCHAR(50) NULL,
        GhiChu            NVARCHAR(MAX) NULL,
        TrangThai         NVARCHAR(20) NOT NULL DEFAULT 'HopLe',
        FOREIGN KEY (MaDonHang)   REFERENCES DonHang(MaDonHang),
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT UQ_HoaDonBan_MaDonHang UNIQUE (MaDonHang)
    );
END
GO

-- 2. Bổ sung cột thiếu cho HoaDonBan (nếu bảng đã tồn tại từ trước)
IF COL_LENGTH('HoaDonBan', 'Email') IS NULL
    ALTER TABLE HoaDonBan ADD Email NVARCHAR(200) NULL;
GO

IF COL_LENGTH('HoaDonBan', 'PhuongThucThanhToan') IS NULL
    ALTER TABLE HoaDonBan ADD PhuongThucThanhToan NVARCHAR(50) NULL;
GO

IF COL_LENGTH('HoaDonBan', 'TrangThaiThanhToan') IS NULL
    ALTER TABLE HoaDonBan ADD TrangThaiThanhToan NVARCHAR(50) NULL;
GO

-- 3. Ràng buộc UNIQUE MaDonHang (1 đơn chỉ có 1 hóa đơn)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('HoaDonBan')
      AND is_unique = 1
      AND EXISTS (
          SELECT 1 FROM sys.index_columns ic
          INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
          WHERE ic.object_id = sys.indexes.object_id AND ic.index_id = sys.indexes.index_id AND c.name = 'MaDonHang'
      )
)
BEGIN
    CREATE UNIQUE INDEX UQ_HoaDonBan_MaDonHang ON HoaDonBan(MaDonHang);
END
GO

-- 4. Đảm bảo bảng ChiTietHoaDonBan tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('ChiTietHoaDonBan') AND type = 'U')
BEGIN
    CREATE TABLE ChiTietHoaDonBan (
        MaChiTietHD   INT IDENTITY(1,1) PRIMARY KEY,
        MaHoaDon      INT NOT NULL,
        MaTacPham     INT NOT NULL,
        TenTacPham    NVARCHAR(500) NULL,
        SoLuong       INT NOT NULL,
        DonGia        DECIMAL(18,2) NOT NULL,
        ThanhTien     DECIMAL(18,2) NOT NULL DEFAULT 0,
        FOREIGN KEY (MaHoaDon)  REFERENCES HoaDonBan(MaHoaDon),
        FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham)
    );
END
GO

-- 5. Bổ sung cột thiếu cho ChiTietHoaDonBan
IF COL_LENGTH('ChiTietHoaDonBan', 'TenTacPham') IS NULL
    ALTER TABLE ChiTietHoaDonBan ADD TenTacPham NVARCHAR(500) NULL;
GO

IF COL_LENGTH('ChiTietHoaDonBan', 'ThanhTien') IS NULL
    ALTER TABLE ChiTietHoaDonBan ADD ThanhTien DECIMAL(18,2) NOT NULL DEFAULT 0;
GO
