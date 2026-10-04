/*
  Tối ưu danh sách quản lý tác phẩm của Admin.
  Không thay đổi dữ liệu; chỉ tạo chỉ mục nếu chưa tồn tại.
*/
IF COL_LENGTH(N'dbo.TacPham', N'MaYeuCauVeTranh') IS NOT NULL
   AND COL_LENGTH(N'dbo.TacPham', N'LaTacPhamDocBan') IS NOT NULL
   AND NOT EXISTS
   (
       SELECT 1
       FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.TacPham')
         AND name = N'IX_TacPham_AdminManagement'
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_TacPham_AdminManagement
        ON dbo.TacPham
        (
            MaYeuCauVeTranh,
            MaHoaSi,
            MaDanhMuc,
            TrangThai,
            LaTacPhamDocBan,
            NgayTao DESC
        )
        INCLUDE (Gia, SoLuong);
END
GO
