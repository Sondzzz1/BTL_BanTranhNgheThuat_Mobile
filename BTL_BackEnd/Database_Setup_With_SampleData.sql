-- ================================================================
-- HE THONG BAN TRANH - SETUP DATABASE WITH SAMPLE DATA
-- ================================================================

-- Tạo database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HeThongBanTranh')
BEGIN
    CREATE DATABASE HeThongBanTranh;
END
GO

USE HeThongBanTranh;
GO

-- ================================================================
-- DROP TABLES (Nếu cần reset)
-- ================================================================
/*
DROP TABLE IF EXISTS ChiTietGioHang;
DROP TABLE IF EXISTS GioHang;
DROP TABLE IF EXISTS HoaDonBan;
DROP TABLE IF EXISTS ThanhToan;
DROP TABLE IF EXISTS NoiDung;
DROP TABLE IF EXISTS BaiViet;
DROP TABLE IF EXISTS TacPham;
DROP TABLE IF EXISTS DanhMuc;
DROP TABLE IF EXISTS HoaSi;
DROP TABLE IF EXISTS NguoiDung;
DROP TABLE IF EXISTS TaiKhoan;
*/

-- ================================================================
-- 1. TAI KHOAN
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaiKhoan')
BEGIN
    CREATE TABLE TaiKhoan (
        MaTaiKhoan  INT           IDENTITY(1,1) PRIMARY KEY,
        TenDangNhap NVARCHAR(50)  NOT NULL UNIQUE,
        MatKhau     NVARCHAR(255) NOT NULL,
        VaiTro      TINYINT       NOT NULL CHECK (VaiTro IN (0,1,2)), -- 0=Admin, 1=NguoiDung, 2=HoaSi
        NgayTao     DATETIME      NOT NULL DEFAULT GETDATE(),
        TrangThai   BIT           NOT NULL DEFAULT 1
    );
END
GO

-- ================================================================
-- 2. NGUOI DUNG (Khách hàng)
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NguoiDung')
BEGIN
    CREATE TABLE NguoiDung (
        MaNguoiDung INT           IDENTITY(1,1) PRIMARY KEY,
        MaTaiKhoan  INT           NOT NULL,
        Ten         NVARCHAR(100) NOT NULL,
        Email       NVARCHAR(100),
        DienThoai   NVARCHAR(20),
        DiaChi      NVARCHAR(255),
        Avatar      NVARCHAR(500),
        NgayTao     DATETIME      NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
    );
END
GO

-- ================================================================
-- 3. HOA SI
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HoaSi')
BEGIN
    CREATE TABLE HoaSi (
        MaHoaSi    INT           IDENTITY(1,1) PRIMARY KEY,
        MaTaiKhoan INT           NOT NULL,
        TenHoaSi   NVARCHAR(100) NOT NULL,
        Email      NVARCHAR(100),
        DienThoai  NVARCHAR(20),
        DiaChi     NVARCHAR(255),
        Avatar     NVARCHAR(500),
        TieuSu     NVARCHAR(MAX),
        ChuyenMon  NVARCHAR(255),
        NgayTao    DATETIME      NOT NULL DEFAULT GETDATE(),
        TrangThai  BIT           NOT NULL DEFAULT 1,
        FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan)
    );
END
GO

-- ================================================================
-- 4. DANH MUC
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DanhMuc')
BEGIN
    CREATE TABLE DanhMuc (
        MaDanhMuc  INT           IDENTITY(1,1) PRIMARY KEY,
        TenDanhMuc NVARCHAR(100) NOT NULL,
        MoTa       NVARCHAR(500),
        NgayTao    DATETIME      NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ================================================================
-- 5. TAC PHAM
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TacPham')
BEGIN
    CREATE TABLE TacPham (
        MaTacPham   INT            IDENTITY(1,1) PRIMARY KEY,
        MaHoaSi     INT            NOT NULL,
        MaDanhMuc   INT            NOT NULL,
        TenTacPham  NVARCHAR(200)  NOT NULL,
        MoTa        NVARCHAR(MAX),
        Gia         DECIMAL(18,2)  NOT NULL,
        HinhAnh     NVARCHAR(500),
        SoLuong     INT            NOT NULL DEFAULT 1,
        TrangThai   TINYINT        NOT NULL DEFAULT 0, -- 0=Chờ duyệt, 1=Đang bán, 2=Ẩn, 3=Từ chối
        NgayTao     DATETIME       NOT NULL DEFAULT GETDATE(),
        LuotXem     INT            NOT NULL DEFAULT 0,
        LyDo        NVARCHAR(MAX)  NULL,
        FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi),
        FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
    );
END
GO

-- ================================================================
-- 6. BAI VIET
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BaiViet')
BEGIN
    CREATE TABLE BaiViet (
        MaBaiViet  INT           IDENTITY(1,1) PRIMARY KEY,
        MaHoaSi    INT           NOT NULL,
        TieuDe     NVARCHAR(200) NOT NULL,
        NoiDung    NVARCHAR(MAX),
        HinhAnh    NVARCHAR(500),
        NgayTao    DATETIME      NOT NULL DEFAULT GETDATE(),
        LuotXem    INT           NOT NULL DEFAULT 0,
        TrangThai  TINYINT       NOT NULL DEFAULT 0, -- 0=Draft, 1=Pending, 2=Published, 3=Rejected, 4=Archived
        LyDo        NVARCHAR(MAX) NULL,
        FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi)
    );
END
GO

-- ================================================================
-- 7. GIO HANG
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GioHang')
BEGIN
    CREATE TABLE GioHang (
        MaGioHang   INT      IDENTITY(1,1) PRIMARY KEY,
        MaNguoiDung INT      NOT NULL,
        NgayTao     DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung)
    );
END
GO

-- ================================================================
-- 8. CHI TIET GIO HANG
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChiTietGioHang')
BEGIN
    CREATE TABLE ChiTietGioHang (
        MaChiTiet  INT           IDENTITY(1,1) PRIMARY KEY,
        MaGioHang  INT           NOT NULL,
        MaTacPham  INT           NOT NULL,
        SoLuong    INT           NOT NULL DEFAULT 1,
        Gia        DECIMAL(18,2) NOT NULL,
        NgayThem   DATETIME      NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (MaGioHang) REFERENCES GioHang(MaGioHang),
        FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham)
    );
END
GO

-- ================================================================
-- 9. HOA DON BAN (Don Hang)
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HoaDonBan')
BEGIN
    CREATE TABLE HoaDonBan (
        MaHoaDon      INT            IDENTITY(1,1) PRIMARY KEY,
        MaNguoiDung   INT            NOT NULL,
        MaTacPham     INT            NOT NULL,
        SoLuong       INT            NOT NULL,
        DonGia        DECIMAL(18,2)  NOT NULL,
        ThanhTien     DECIMAL(18,2)  NOT NULL,
        NgayDat       DATETIME       NOT NULL DEFAULT GETDATE(),
        TrangThai     TINYINT        NOT NULL DEFAULT 0, -- 0=Chờ xác nhận, 1=Đã xác nhận, 2=Đang giao, 3=Đã giao, 4=Hoàn thành, 5=Đã hủy
        DiaChiGiao    NVARCHAR(500),
        GhiChu        NVARCHAR(500),
        FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
        FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham)
    );
END
GO

-- ================================================================
-- 10. THANH TOAN
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ThanhToan')
BEGIN
    CREATE TABLE ThanhToan (
        MaThanhToan      INT            IDENTITY(1,1) PRIMARY KEY,
        MaHoaDon         INT            NOT NULL,
        PhuongThuc       NVARCHAR(50)   NOT NULL, -- COD, Banking, Momo, etc.
        SoTien           DECIMAL(18,2)  NOT NULL,
        NgayThanhToan    DATETIME       NOT NULL DEFAULT GETDATE(),
        TrangThai        BIT            NOT NULL DEFAULT 0, -- 0=Chưa thanh toán, 1=Đã thanh toán
        MaGiaoDich       NVARCHAR(100),
        FOREIGN KEY (MaHoaDon) REFERENCES HoaDonBan(MaHoaDon)
    );
END
GO

-- ================================================================
-- INSERT SAMPLE DATA
-- ================================================================

-- 1. Tài khoản mẫu (Mật khẩu đã hash bằng BCrypt: "123456")
-- Hash của "123456": $2a$11$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-- Lưu ý: Bạn cần đăng ký qua API để có mật khẩu đúng hash

-- Admin
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, NgayTao, TrangThai)
VALUES 
('admin', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, GETDATE(), 1);

-- Người dùng
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, NgayTao, TrangThai)
VALUES 
('khachhang1', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, GETDATE(), 1),
('khachhang2', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, GETDATE(), 1),
('khachhang3', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, GETDATE(), 1);

-- Họa sĩ
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro, NgayTao, TrangThai)
VALUES 
('hoasi1', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, GETDATE(), 1),
('hoasi2', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, GETDATE(), 1),
('hoasi3', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, GETDATE(), 1);

GO

-- 2. Người dùng
INSERT INTO NguoiDung (MaTaiKhoan, Ten, Email, DienThoai, DiaChi, NgayTao)
VALUES 
(2, N'Nguyễn Văn A', 'nguyenvana@gmail.com', '0901234567', N'123 Lê Lợi, Q1, TP.HCM', GETDATE()),
(3, N'Trần Thị B', 'tranthib@gmail.com', '0902345678', N'456 Nguyễn Huệ, Q1, TP.HCM', GETDATE()),
(4, N'Lê Văn C', 'levanc@gmail.com', '0903456789', N'789 Trần Hưng Đạo, Q5, TP.HCM', GETDATE());

GO

-- 3. Họa sĩ
INSERT INTO HoaSi (MaTaiKhoan, TenHoaSi, Email, DienThoai, DiaChi, TieuSu, ChuyenMon, NgayTao, TrangThai)
VALUES 
(5, N'Họa Sĩ Nguyễn Minh', 'nguyenminh@art.com', '0911111111', N'Hà Nội', 
 N'Họa sĩ với 10 năm kinh nghiệm trong lĩnh vực tranh sơn dầu', N'Tranh sơn dầu, phong cảnh', GETDATE(), 1),
(6, N'Họa Sĩ Trần Hương', 'tranhương@art.com', '0922222222', N'Đà Nẵng', 
 N'Chuyên về tranh chân dung và tranh trừu tượng', N'Chân dung, trừu tượng', GETDATE(), 1),
(7, N'Họa Sĩ Lê Phong', 'lephong@art.com', '0933333333', N'TP.HCM', 
 N'Nghệ sĩ trẻ với phong cách hiện đại', N'Tranh hiện đại, digital art', GETDATE(), 1);

GO

-- 4. Danh mục
INSERT INTO DanhMuc (TenDanhMuc, MoTa, NgayTao)
VALUES 
(N'Tranh Sơn Dầu', N'Các tác phẩm tranh sơn dầu nghệ thuật', GETDATE()),
(N'Tranh Phong Cảnh', N'Tranh vẽ phong cảnh thiên nhiên', GETDATE()),
(N'Tranh Chân Dung', N'Tranh vẽ chân dung con người', GETDATE()),
(N'Tranh Trừu Tượng', N'Nghệ thuật trừu tượng hiện đại', GETDATE()),
(N'Tranh Tĩnh Vật', N'Tranh vẽ tĩnh vật', GETDATE()),
(N'Tranh Đương Đại', N'Nghệ thuật đương đại', GETDATE());

GO

-- 5. Tác phẩm
INSERT INTO TacPham (MaHoaSi, MaDanhMuc, TenTacPham, MoTa, Gia, HinhAnh, SoLuong, TrangThai, NgayTao, LuotXem)
VALUES 
-- Họa sĩ 1
(1, 1, N'Hoàng Hôn Trên Biển', N'Bức tranh sơn dầu mô tả cảnh hoàng hôn tuyệt đẹp trên biển', 5000000, 'hoang-hon-bien.jpg', 1, 1, GETDATE(), 150),
(1, 2, N'Núi Rừng Tây Bắc', N'Phong cảnh núi rừng hùng vĩ miền Tây Bắc', 7000000, 'nui-rung-tay-bac.jpg', 1, 1, GETDATE(), 200),
(1, 5, N'Bình Hoa Hồng', N'Tĩnh vật bình hoa hồng đỏ', 3000000, 'binh-hoa-hong.jpg', 2, 1, GETDATE(), 80),

-- Họa sĩ 2
(2, 3, N'Chân Dung Cô Gái', N'Chân dung cô gái với ánh mắt sâu thẳm', 8000000, 'chan-dung-co-gai.jpg', 1, 1, GETDATE(), 300),
(2, 4, N'Sắc Màu Trừu Tượng', N'Tác phẩm trừu tượng với sắc màu rực rỡ', 6000000, 'sac-mau-truu-tuong.jpg', 1, 1, GETDATE(), 180),
(2, 4, N'Không Gian Vô Tận', N'Tranh trừu tượng về không gian', 9000000, 'khong-gian-vo-tan.jpg', 1, 1, GETDATE(), 220),

-- Họa sĩ 3
(3, 6, N'Thành Phố Đêm', N'Cảnh thành phố về đêm với ánh đèn lung linh', 4500000, 'thanh-pho-dem.jpg', 2, 1, GETDATE(), 250),
(3, 6, N'Digital Dreams', N'Tác phẩm digital art hiện đại', 3500000, 'digital-dreams.jpg', 3, 1, GETDATE(), 190),
(3, 2, N'Cánh Đồng Lúa Chín', N'Phong cảnh cánh đồng lúa chín vàng', 5500000, 'canh-dong-lua.jpg', 1, 1, GETDATE(), 170);

GO

-- 6. Bài viết
INSERT INTO BaiViet (MaHoaSi, TieuDe, NoiDung, HinhAnh, NgayTao, LuotXem, TrangThai, LyDo)
VALUES 
(1, N'Nghệ Thuật Sơn Dầu - Hành Trình Sáng Tạo', 
 N'Chia sẻ về hành trình sáng tạo nghệ thuật sơn dầu của tôi...', 
 'bai-viet-1.jpg', GETDATE(), 500, 2, NULL),
(2, N'Bí Quyết Vẽ Chân Dung Chân Thực', 
 N'Những kỹ thuật và bí quyết để vẽ chân dung chân thực...', 
 'bai-viet-2.jpg', GETDATE(), 450, 2, NULL),
(3, N'Digital Art - Xu Hướng Mới Của Nghệ Thuật', 
 N'Khám phá thế giới digital art và những công cụ hiện đại...', 
 'bai-viet-3.jpg', GETDATE(), 600, 2, NULL);

GO

-- 7. Giỏ hàng
INSERT INTO GioHang (MaNguoiDung, NgayTao)
VALUES 
(1, GETDATE()),
(2, GETDATE()),
(3, GETDATE());

GO

-- 8. Chi tiết giỏ hàng
INSERT INTO ChiTietGioHang (MaGioHang, MaTacPham, SoLuong, Gia, NgayThem)
VALUES 
(1, 1, 1, 5000000, GETDATE()),
(1, 4, 1, 8000000, GETDATE()),
(2, 7, 1, 4500000, GETDATE());

GO

-- 9. Hóa đơn bán (Đơn hàng)
INSERT INTO HoaDonBan (MaNguoiDung, MaTacPham, SoLuong, DonGia, ThanhTien, NgayDat, TrangThai, DiaChiGiao, GhiChu)
VALUES 
-- Đơn hàng đã hoàn thành
(1, 2, 1, 7000000, 7000000, DATEADD(DAY, -10, GETDATE()), 4, N'123 Lê Lợi, Q1, TP.HCM', N'Giao giờ hành chính'),
(2, 5, 1, 6000000, 6000000, DATEADD(DAY, -8, GETDATE()), 4, N'456 Nguyễn Huệ, Q1, TP.HCM', N''),
-- Đơn hàng đang xử lý
(1, 3, 1, 3000000, 3000000, DATEADD(DAY, -3, GETDATE()), 1, N'123 Lê Lợi, Q1, TP.HCM', N''),
(3, 6, 1, 9000000, 9000000, DATEADD(DAY, -2, GETDATE()), 2, N'789 Trần Hưng Đạo, Q5, TP.HCM', N'Gọi trước khi giao'),
-- Đơn hàng mới
(2, 8, 1, 3500000, 3500000, DATEADD(DAY, -1, GETDATE()), 0, N'456 Nguyễn Huệ, Q1, TP.HCM', N'');

GO

-- 10. Thanh toán
INSERT INTO ThanhToan (MaHoaDon, PhuongThuc, SoTien, NgayThanhToan, TrangThai, MaGiaoDich)
VALUES 
(1, N'Banking', 7000000, DATEADD(DAY, -10, GETDATE()), 1, 'TXN001'),
(2, N'Momo', 6000000, DATEADD(DAY, -8, GETDATE()), 1, 'TXN002'),
(3, N'COD', 3000000, DATEADD(DAY, -3, GETDATE()), 0, NULL),
(4, N'Banking', 9000000, DATEADD(DAY, -2, GETDATE()), 1, 'TXN003'),
(5, N'COD', 3500000, DATEADD(DAY, -1, GETDATE()), 0, NULL);

GO

-- ================================================================
-- QUERIES FOR TESTING
-- ================================================================

-- Kiểm tra dữ liệu
SELECT 'TaiKhoan' AS TableName, COUNT(*) AS RecordCount FROM TaiKhoan
UNION ALL
SELECT 'NguoiDung', COUNT(*) FROM NguoiDung
UNION ALL
SELECT 'HoaSi', COUNT(*) FROM HoaSi
UNION ALL
SELECT 'DanhMuc', COUNT(*) FROM DanhMuc
UNION ALL
SELECT 'TacPham', COUNT(*) FROM TacPham
UNION ALL
SELECT 'BaiViet', COUNT(*) FROM BaiViet
UNION ALL
SELECT 'GioHang', COUNT(*) FROM GioHang
UNION ALL
SELECT 'ChiTietGioHang', COUNT(*) FROM ChiTietGioHang
UNION ALL
SELECT 'HoaDonBan', COUNT(*) FROM HoaDonBan
UNION ALL
SELECT 'ThanhToan', COUNT(*) FROM ThanhToan;

GO

-- ================================================================
-- USEFUL QUERIES
-- ================================================================

-- Xem tất cả tài khoản
SELECT 
    tk.MaTaiKhoan,
    tk.TenDangNhap,
    tk.VaiTro,
    CASE tk.VaiTro 
        WHEN 0 THEN N'Admin'
        WHEN 1 THEN N'Người Dùng'
        WHEN 2 THEN N'Họa Sĩ'
    END AS TenVaiTro,
    tk.TrangThai,
    tk.NgayTao
FROM TaiKhoan tk
ORDER BY tk.MaTaiKhoan;

GO

-- Xem tác phẩm với thông tin họa sĩ
SELECT 
    tp.MaTacPham,
    tp.TenTacPham,
    hs.TenHoaSi,
    dm.TenDanhMuc,
    tp.Gia,
    tp.SoLuong,
    tp.LuotXem,
    CASE tp.TrangThai
        WHEN 1 THEN N'Đang bán'
        WHEN 2 THEN N'Hết hàng'
        WHEN 3 THEN N'Ngừng bán'
    END AS TrangThai
FROM TacPham tp
JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
JOIN DanhMuc dm ON tp.MaDanhMuc = dm.MaDanhMuc
ORDER BY tp.NgayTao DESC;

GO

-- Xem đơn hàng với thông tin chi tiết
SELECT 
    hd.MaHoaDon,
    nd.Ten AS TenKhachHang,
    tp.TenTacPham,
    hs.TenHoaSi,
    hd.SoLuong,
    hd.ThanhTien,
    hd.NgayDat,
    CASE hd.TrangThai
        WHEN 0 THEN N'Chờ xác nhận'
        WHEN 1 THEN N'Đã xác nhận'
        WHEN 2 THEN N'Đang giao'
        WHEN 3 THEN N'Đã giao'
        WHEN 4 THEN N'Hoàn thành'
        WHEN 5 THEN N'Đã hủy'
    END AS TrangThai
FROM HoaDonBan hd
JOIN NguoiDung nd ON hd.MaNguoiDung = nd.MaNguoiDung
JOIN TacPham tp ON hd.MaTacPham = tp.MaTacPham
JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
ORDER BY hd.NgayDat DESC;

GO

-- Thống kê doanh thu theo họa sĩ
SELECT 
    hs.MaHoaSi,
    hs.TenHoaSi,
    COUNT(hd.MaHoaDon) AS SoDonHang,
    SUM(hd.ThanhTien) AS TongDoanhThu,
    AVG(hd.ThanhTien) AS DoanhThuTrungBinh
FROM HoaSi hs
LEFT JOIN TacPham tp ON hs.MaHoaSi = tp.MaHoaSi
LEFT JOIN HoaDonBan hd ON tp.MaTacPham = hd.MaTacPham AND hd.TrangThai = 4
GROUP BY hs.MaHoaSi, hs.TenHoaSi
ORDER BY TongDoanhThu DESC;

GO

PRINT N'✅ Database setup completed successfully!';
PRINT N'';
PRINT N'📊 Sample Data Summary:';
PRINT N'   - 1 Admin account';
PRINT N'   - 3 Customer accounts';
PRINT N'   - 3 Artist accounts';
PRINT N'   - 6 Categories';
PRINT N'   - 9 Artworks';
PRINT N'   - 3 Blog posts';
PRINT N'   - 5 Orders';
PRINT N'';
PRINT N'🔑 Login Credentials (Password: 123456):';
PRINT N'   Admin:     admin / 123456';
PRINT N'   Customer:  khachhang1 / 123456';
PRINT N'   Artist:    hoasi1 / 123456';
PRINT N'';
PRINT N'⚠️  Note: Passwords are BCrypt hashed. Use API to register new accounts.';
