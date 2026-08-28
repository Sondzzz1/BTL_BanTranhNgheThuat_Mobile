-- Migration: Tạo bảng Yêu Thích
-- Ngày: 22/05/2026
-- Mô tả: Lưu danh sách tác phẩm yêu thích của người dùng

USE HeThongBanTranh;
GO

-- Kiểm tra và xóa bảng cũ nếu tồn tại
IF OBJECT_ID('dbo.YeuThich', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.YeuThich;
    PRINT 'Đã xóa bảng YeuThich cũ';
END
GO

-- Tạo bảng YeuThich
CREATE TABLE YeuThich (
    MaYeuThich INT PRIMARY KEY IDENTITY(1,1),
    MaNguoiDung INT NOT NULL,
    MaTacPham INT NOT NULL,
    NgayThem DATETIME NOT NULL DEFAULT GETDATE(),
    GhiChu NVARCHAR(500),
    
    -- Foreign Keys
    CONSTRAINT FK_YeuThich_NguoiDung FOREIGN KEY (MaNguoiDung) 
        REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE,
    CONSTRAINT FK_YeuThich_TacPham FOREIGN KEY (MaTacPham) 
        REFERENCES TacPham(MaTacPham) ON DELETE CASCADE,
    
    -- Unique constraint: Mỗi user chỉ có thể yêu thích 1 tác phẩm 1 lần
    CONSTRAINT UQ_YeuThich_NguoiDung_TacPham UNIQUE(MaNguoiDung, MaTacPham)
);
GO

-- Tạo indexes để tăng tốc query
CREATE INDEX IX_YeuThich_NguoiDung ON YeuThich(MaNguoiDung);
CREATE INDEX IX_YeuThich_TacPham ON YeuThich(MaTacPham);
CREATE INDEX IX_YeuThich_NgayThem ON YeuThich(NgayThem DESC);
GO

PRINT 'Đã tạo bảng YeuThich thành công!';
GO

-- Insert dữ liệu mẫu (optional)
-- Giả sử MaNguoiDung = 1 (user test), MaTacPham = 1, 2, 3
INSERT INTO YeuThich (MaNguoiDung, MaTacPham, NgayThem, GhiChu)
VALUES 
    (1, 1, GETDATE(), N'Tranh đẹp, muốn mua sau'),
    (1, 2, GETDATE(), N'Phong cách độc đáo'),
    (1, 3, GETDATE(), NULL);
GO

PRINT 'Đã thêm dữ liệu mẫu!';
GO

-- Kiểm tra kết quả
SELECT * FROM YeuThich;
GO
