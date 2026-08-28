# CẤU TRÚC CƠ SỞ DỮ LIỆU - HỆ THỐNG BÁN TRANH

**Database Name:** HeThongBanTranh  
**Server:** DUYSONW\SQLEXPRESS  
**Ngày cập nhật:** 30/05/2026

---

## 📊 TỔNG QUAN

Hệ thống gồm **15 bảng** chính:

1. **TaiKhoan** - Quản lý tài khoản đăng nhập
2. **NguoiDung** - Thông tin người dùng/khách hàng
3. **HoaSi** - Thông tin họa sĩ
4. **DanhMuc** - Danh mục tác phẩm
5. **TacPham** - Tác phẩm nghệ thuật
6. **TacPhamChinhSua** - Lưu chỉnh sửa tác phẩm chờ duyệt
7. **ChiTietTacPham** - Nội dung chi tiết tác phẩm
8. **BaiViet** - Bài viết/tin tức của họa sĩ
9. **GioHang** - Giỏ hàng
10. **ChiTietGioHang** - Chi tiết giỏ hàng
11. **DonHang** - Đơn hàng
12. **ChiTietDonHang** - Chi tiết đơn hàng
13. **YeuThich** - Danh sách yêu thích
14. **HoaDonBan** - Hóa đơn bán hàng
15. **ThanhToan** - Thông tin thanh toán

---

## 📋 CHI TIẾT CÁC BẢNG

### 1. TaiKhoan
**Mô tả:** Quản lý tài khoản đăng nhập của hệ thống

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaTaiKhoan | INT | PRIMARY KEY, IDENTITY | Mã tài khoản (tự tăng) |
| TenDangNhap | NVARCHAR(50) | NOT NULL, UNIQUE | Tên đăng nhập |
| MatKhau | NVARCHAR(255) | NOT NULL | Mật khẩu (đã mã hóa BCrypt) |
| VaiTro | TINYINT | NOT NULL | 0=Admin, 1=NguoiDung, 2=HoaSi |
| TrangThai | BIT | NOT NULL, DEFAULT 1 | 1=Hoạt động, 0=Khóa |

**Indexes:**
- PRIMARY KEY: MaTaiKhoan
- UNIQUE: TenDangNhap

---

### 2. NguoiDung
**Mô tả:** Thông tin người dùng/khách hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaNguoiDung | INT | PRIMARY KEY, IDENTITY | Mã người dùng |
| MaTaiKhoan | INT | FOREIGN KEY → TaiKhoan | Liên kết tài khoản |
| Ten | NVARCHAR(100) | NOT NULL | Họ tên |
| DiaChi | NVARCHAR(255) | NULL | Địa chỉ |
| DienThoai | NVARCHAR(15) | NULL | Số điện thoại |
| Email | NVARCHAR(100) | NULL | Email |
| TrangThai | BIT | NOT NULL, DEFAULT 1 | 1=Hoạt động, 0=Khóa |

**Relationships:**
- MaTaiKhoan → TaiKhoan(MaTaiKhoan)

---

### 3. HoaSi
**Mô tả:** Thông tin họa sĩ

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaHoaSi | INT | PRIMARY KEY, IDENTITY | Mã họa sĩ |
| MaTaiKhoan | INT | FOREIGN KEY → TaiKhoan | Liên kết tài khoản |
| TenHoaSi | NVARCHAR(100) | NOT NULL | Tên họa sĩ |
| Email | NVARCHAR(100) | NULL | Email |
| DienThoai | NVARCHAR(15) | NULL | Số điện thoại |
| DiaChi | NVARCHAR(255) | NULL | Địa chỉ |
| AnhDaiDien | NVARCHAR(500) | NULL | URL ảnh đại diện |
| TieuSu | NVARCHAR(MAX) | NULL | Tiểu sử họa sĩ |
| ChuyenMon | NVARCHAR(255) | NULL | Chuyên môn |
| NgayTao | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày tạo |
| TrangThai | BIT | NOT NULL, DEFAULT 1 | 1=Hoạt động, 0=Khóa |

**Relationships:**
- MaTaiKhoan → TaiKhoan(MaTaiKhoan)

---

### 4. DanhMuc
**Mô tả:** Danh mục phân loại tác phẩm

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaDanhMuc | INT | PRIMARY KEY, IDENTITY | Mã danh mục |
| TenDanhMuc | NVARCHAR(100) | NOT NULL | Tên danh mục (VD: Tranh Sơn Dầu) |
| MoTa | NVARCHAR(500) | NULL | Mô tả danh mục |

**Ví dụ dữ liệu:**
- Tranh Sơn Dầu
- Tranh Sơn Mài
- Tranh Cổ Điển
- Tranh Đương Đại

---

### 5. TacPham
**Mô tả:** Tác phẩm nghệ thuật

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaTacPham | INT | PRIMARY KEY, IDENTITY | Mã tác phẩm |
| TenTacPham | NVARCHAR(200) | NOT NULL | Tên tác phẩm |
| MaHoaSi | INT | FOREIGN KEY → HoaSi | Họa sĩ sáng tác |
| MaDanhMuc | INT | FOREIGN KEY → DanhMuc | Danh mục |
| Gia | DECIMAL(18,2) | NOT NULL | Giá bán (VNĐ) |
| SoLuong | INT | NOT NULL, DEFAULT 1 | Số lượng còn |
| MoTa | NVARCHAR(MAX) | NULL | Mô tả tác phẩm |
| HinhAnh | NVARCHAR(500) | NULL | URL hình ảnh chính |
| ChatLieu | NVARCHAR(100) | NULL | Chất liệu (VD: Sơn dầu trên toan) |
| ChatLieuKhung | NVARCHAR(100) | NULL | Chất liệu khung (VD: Gỗ sồi) |
| KichThuoc | NVARCHAR(50) | NULL | Kích thước (VD: 60x80cm) |
| TrangThai | TINYINT | NOT NULL, DEFAULT 0 | Trạng thái (xem bên dưới) |
| NgayTao | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày tạo |
| LyDo | NVARCHAR(500) | NULL | Lý do từ chối (nếu TrangThai=3) |

**Trạng thái (TrangThai):**
- `0` = Chờ duyệt (Pending)
- `1` = Đang bán (Approved/Active)
- `2` = Ẩn (Hidden - họa sĩ tạm ẩn)
- `3` = Từ chối (Rejected - admin từ chối)
- `99` = Đã xóa (Deleted - soft delete)

**Relationships:**
- MaHoaSi → HoaSi(MaHoaSi)
- MaDanhMuc → DanhMuc(MaDanhMuc)

---

### 6. TacPhamChinhSua
**Mô tả:** Lưu nội dung chỉnh sửa tác phẩm đang chờ admin duyệt

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaChinhSua | INT | PRIMARY KEY, IDENTITY | Mã chỉnh sửa |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm được chỉnh sửa |
| TenTacPham | NVARCHAR(200) | NOT NULL | Tên mới |
| MaDanhMuc | INT | NULL | Danh mục mới |
| Gia | DECIMAL(18,2) | NOT NULL | Giá mới |
| SoLuong | INT | NOT NULL | Số lượng mới |
| MoTa | NVARCHAR(MAX) | NULL | Mô tả mới |
| HinhAnh | NVARCHAR(500) | NULL | Hình ảnh mới |
| KichThuoc | NVARCHAR(50) | NULL | Kích thước mới |
| ChatLieu | NVARCHAR(100) | NULL | Chất liệu mới |
| ChatLieuKhung | NVARCHAR(100) | NULL | Chất liệu khung mới |
| NgayChinhSua | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày chỉnh sửa |
| TrangThai | TINYINT | NOT NULL, DEFAULT 0 | 0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối |
| LyDo | NVARCHAR(500) | NULL | Lý do từ chối |

**Relationships:**
- MaTacPham → TacPham(MaTacPham)

**Lưu ý:** Khi họa sĩ sửa tác phẩm đang bán (TrangThai=1), thay đổi được lưu vào bảng này để admin duyệt. Tác phẩm gốc không thay đổi cho đến khi admin duyệt.

---

### 7. ChiTietTacPham
**Mô tả:** Nội dung chi tiết mở rộng của tác phẩm

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaChiTiet | INT | PRIMARY KEY, IDENTITY | Mã chi tiết |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm |
| CauChuyenSangTac | NVARCHAR(MAX) | NULL | Câu chuyện sáng tác |
| YNghiaNghiThuat | NVARCHAR(MAX) | NULL | Ý nghĩa nghệ thuật |
| KyThuatThucHien | NVARCHAR(MAX) | NULL | Kỹ thuật thực hiện |
| CamHungSangTao | NVARCHAR(MAX) | NULL | Cảm hứng sáng tạo |
| ThongTinBosung | NVARCHAR(MAX) | NULL | Thông tin bổ sung |
| KichThuoc | NVARCHAR(50) | NULL | Kích thước chi tiết |
| ChatLieu | NVARCHAR(100) | NULL | Chất liệu chi tiết |
| ChatLieuKhung | NVARCHAR(100) | NULL | Chất liệu khung chi tiết |
| NamSangTac | INT | NULL | Năm sáng tác |
| DiaDiemSangTac | NVARCHAR(200) | NULL | Địa điểm sáng tác |
| HinhAnh1 | NVARCHAR(500) | NULL | URL hình ảnh bổ sung 1 |
| HinhAnh2 | NVARCHAR(500) | NULL | URL hình ảnh bổ sung 2 |
| HinhAnh3 | NVARCHAR(500) | NULL | URL hình ảnh bổ sung 3 |
| HinhAnh4 | NVARCHAR(500) | NULL | URL hình ảnh bổ sung 4 |
| TrangThai | TINYINT | NOT NULL, DEFAULT 0 | 0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối |
| LyDoTuChoi | NVARCHAR(500) | NULL | Lý do từ chối |
| NgayTao | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày tạo |
| NgayCapNhat | DATETIME | NULL | Ngày cập nhật |
| NgayDuyet | DATETIME | NULL | Ngày duyệt |
| MaNguoiDuyet | INT | NULL | Người duyệt (admin) |

**Relationships:**
- MaTacPham → TacPham(MaTacPham)

---

### 8. BaiViet
**Mô tả:** Bài viết/tin tức do họa sĩ đăng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaBaiViet | INT | PRIMARY KEY, IDENTITY | Mã bài viết |
| TieuDe | NVARCHAR(200) | NOT NULL | Tiêu đề bài viết |
| NoiDung | NVARCHAR(MAX) | NULL | Nội dung bài viết |
| MaHoaSi | INT | FOREIGN KEY → HoaSi | Họa sĩ viết |
| NgayDang | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày đăng |
| TrangThai | TINYINT | NOT NULL, DEFAULT 0 | Trạng thái (xem bên dưới) |
| LyDo | NVARCHAR(500) | NULL | Lý do từ chối |
| AnhTieuDe | NVARCHAR(500) | NULL | URL ảnh tiêu đề |

**Trạng thái (TrangThai):**
- `0` = Draft (Nháp)
- `1` = Pending (Chờ duyệt)
- `2` = Published (Đã xuất bản)
- `3` = Rejected (Từ chối)
- `4` = Archived (Lưu trữ)

**Relationships:**
- MaHoaSi → HoaSi(MaHoaSi)

---

### 9. GioHang
**Mô tả:** Giỏ hàng của người dùng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaGioHang | INT | PRIMARY KEY, IDENTITY | Mã giỏ hàng |
| MaNguoiDung | INT | FOREIGN KEY → NguoiDung | Người dùng sở hữu |

**Relationships:**
- MaNguoiDung → NguoiDung(MaNguoiDung)

**Lưu ý:** Mỗi người dùng có 1 giỏ hàng duy nhất

---

### 10. ChiTietGioHang
**Mô tả:** Chi tiết sản phẩm trong giỏ hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaChiTietGH | INT | PRIMARY KEY, IDENTITY | Mã chi tiết giỏ hàng |
| MaGioHang | INT | FOREIGN KEY → GioHang | Giỏ hàng |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm |
| SoLuong | INT | NOT NULL, DEFAULT 1 | Số lượng |

**Relationships:**
- MaGioHang → GioHang(MaGioHang)
- MaTacPham → TacPham(MaTacPham)

---

### 11. DonHang
**Mô tả:** Đơn hàng của khách hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaDonHang | INT | PRIMARY KEY, IDENTITY | Mã đơn hàng |
| MaNguoiDung | INT | FOREIGN KEY → NguoiDung | Người đặt hàng |
| NgayDat | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày đặt hàng |
| TongTien | DECIMAL(18,2) | NOT NULL | Tổng tiền đơn hàng |
| TenNguoiNhan | NVARCHAR(100) | NULL | Tên người nhận |
| SoDienThoai | NVARCHAR(15) | NULL | Số điện thoại người nhận |
| DiaChiGiao | NVARCHAR(500) | NULL | Địa chỉ giao hàng |
| TrangThai | TINYINT | NOT NULL, DEFAULT 0 | Trạng thái (xem bên dưới) |
| LyDoHuy | NVARCHAR(500) | NULL | Lý do hủy đơn |

**Trạng thái (TrangThai):**
- `0` = Chờ xác nhận (Pending)
- `1` = Đã xác nhận (Confirmed)
- `2` = Đang giao (Shipping)
- `3` = Đã giao (Delivered/Success)
- `4` = Đang hủy (Canceling - chờ admin duyệt)
- `5` = Đã hủy (Canceled)

**Relationships:**
- MaNguoiDung → NguoiDung(MaNguoiDung)

---

### 12. ChiTietDonHang
**Mô tả:** Chi tiết sản phẩm trong đơn hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaChiTietDH | INT | PRIMARY KEY, IDENTITY | Mã chi tiết đơn hàng |
| MaDonHang | INT | FOREIGN KEY → DonHang | Đơn hàng |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm |
| SoLuong | INT | NOT NULL | Số lượng mua |
| DonGia | DECIMAL(18,2) | NOT NULL | Đơn giá tại thời điểm mua |

**Relationships:**
- MaDonHang → DonHang(MaDonHang)
- MaTacPham → TacPham(MaTacPham)

**Lưu ý:** DonGia lưu giá tại thời điểm mua để tránh thay đổi khi giá tác phẩm thay đổi sau này

---

### 13. YeuThich
**Mô tả:** Danh sách tác phẩm yêu thích của người dùng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaYeuThich | INT | PRIMARY KEY, IDENTITY | Mã yêu thích |
| MaNguoiDung | INT | FOREIGN KEY → NguoiDung | Người dùng |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm yêu thích |
| NgayThem | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày thêm vào danh sách |
| GhiChu | NVARCHAR(500) | NULL | Ghi chú cá nhân |

**Relationships:**
- MaNguoiDung → NguoiDung(MaNguoiDung)
- MaTacPham → TacPham(MaTacPham)

**Indexes:**
- UNIQUE: (MaNguoiDung, MaTacPham) - Mỗi người chỉ yêu thích 1 tác phẩm 1 lần

---

### 14. HoaDonBan
**Mô tả:** Hóa đơn bán hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaHoaDon | INT | PRIMARY KEY, IDENTITY | Mã hóa đơn |
| MaDonHang | INT | FOREIGN KEY → DonHang | Đơn hàng |
| MaNguoiDung | INT | FOREIGN KEY → NguoiDung | Người mua |
| NgayXuatHD | DATETIME | NOT NULL, DEFAULT GETDATE() | Ngày xuất hóa đơn |
| TongTienHang | DECIMAL(18,2) | NOT NULL | Tổng tiền hàng |
| TenNguoiMua | NVARCHAR(100) | NULL | Tên người mua |
| DiaChiNguoiMua | NVARCHAR(500) | NULL | Địa chỉ người mua |
| SoDienThoaiNguoiMua | NVARCHAR(15) | NULL | SĐT người mua |
| GhiChu | NVARCHAR(500) | NULL | Ghi chú |
| TrangThai | NVARCHAR(20) | NOT NULL, DEFAULT 'HopLe' | HopLe, DaHuy |

**Relationships:**
- MaDonHang → DonHang(MaDonHang)
- MaNguoiDung → NguoiDung(MaNguoiDung)

---

### 15. ChiTietHoaDonBan
**Mô tả:** Chi tiết sản phẩm trong hóa đơn

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaChiTietHD | INT | PRIMARY KEY, IDENTITY | Mã chi tiết hóa đơn |
| MaHoaDon | INT | FOREIGN KEY → HoaDonBan | Hóa đơn |
| MaTacPham | INT | FOREIGN KEY → TacPham | Tác phẩm |
| SoLuong | INT | NOT NULL | Số lượng |
| DonGia | DECIMAL(18,2) | NOT NULL | Đơn giá |
| ThanhTien | DECIMAL(18,2) | COMPUTED | = SoLuong * DonGia |

**Relationships:**
- MaHoaDon → HoaDonBan(MaHoaDon)
- MaTacPham → TacPham(MaTacPham)

---

### 16. ThanhToan
**Mô tả:** Thông tin thanh toán đơn hàng

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---------|--------------|-----------|-------|
| MaThanhToan | INT | PRIMARY KEY, IDENTITY | Mã thanh toán |
| MaDonHang | INT | FOREIGN KEY → DonHang | Đơn hàng |
| PhuongThuc | NVARCHAR(50) | NOT NULL | COD, BankTransfer, Momo, VNPay |
| TrangThai | NVARCHAR(20) | NOT NULL, DEFAULT 'ChoThanhToan' | Trạng thái (xem bên dưới) |
| NgayThanhToan | DATETIME | NULL | Ngày thanh toán thực tế |
| MaGiaoDich | NVARCHAR(100) | NULL | Mã giao dịch từ cổng thanh toán |

**Trạng thái (TrangThai):**
- `ChoThanhToan` = Chờ thanh toán
- `DaThanhToan` = Đã thanh toán
- `ThatBai` = Thanh toán thất bại
- `HoanTien` = Đã hoàn tiền

**Relationships:**
- MaDonHang → DonHang(MaDonHang)

---

## 🔗 QUAN HỆ GIỮA CÁC BẢNG

### Sơ đồ quan hệ chính:

```
TaiKhoan (1) ----< (N) NguoiDung
TaiKhoan (1) ----< (N) HoaSi

HoaSi (1) ----< (N) TacPham
HoaSi (1) ----< (N) BaiViet

DanhMuc (1) ----< (N) TacPham

TacPham (1) ----< (1) TacPhamChinhSua
TacPham (1) ----< (1) ChiTietTacPham
TacPham (1) ----< (N) ChiTietGioHang
TacPham (1) ----< (N) ChiTietDonHang
TacPham (1) ----< (N) YeuThich

NguoiDung (1) ----< (1) GioHang
NguoiDung (1) ----< (N) DonHang
NguoiDung (1) ----< (N) YeuThich

GioHang (1) ----< (N) ChiTietGioHang

DonHang (1) ----< (N) ChiTietDonHang
DonHang (1) ----< (1) ThanhToan
DonHang (1) ----< (1) HoaDonBan

HoaDonBan (1) ----< (N) ChiTietHoaDonBan
```

---

## 📊 THỐNG KÊ

| Loại | Số lượng |
|------|----------|
| Tổng số bảng | 16 |
| Bảng chính | 11 |
| Bảng chi tiết | 5 |
| Bảng quan hệ | 3 |
| Foreign Keys | 20+ |
| Indexes | 16+ |

---

## 🔐 BẢO MẬT & RÀNG BUỘC

### 1. Ràng buộc khóa ngoại (Foreign Keys)
- Tất cả các khóa ngoại đều có ON DELETE CASCADE hoặc NO ACTION
- Đảm bảo tính toàn vẹn dữ liệu

### 2. Ràng buộc duy nhất (Unique Constraints)
- `TaiKhoan.TenDangNhap` - Không trùng tên đăng nhập
- `(YeuThich.MaNguoiDung, YeuThich.MaTacPham)` - Không yêu thích trùng

### 3. Ràng buộc kiểm tra (Check Constraints)
- `TaiKhoan.VaiTro IN (0, 1, 2)`
- `TacPham.TrangThai IN (0, 1, 2, 3, 99)`
- `DonHang.TrangThai IN (0, 1, 2, 3, 4, 5)`
- `Gia >= 0`
- `SoLuong >= 0`

### 4. Mã hóa
- Mật khẩu: BCrypt (độ phức tạp 10)
- Token: JWT với secret key

---

## 📝 GHI CHÚ QUAN TRỌNG

### 1. Soft Delete
- Bảng `TacPham` sử dụng soft delete với `TrangThai = 99`
- Không xóa hẳn để giữ lịch sử đơn hàng

### 2. Workflow duyệt tác phẩm
```
Tạo mới → TrangThai = 0 (Chờ duyệt)
    ↓
Admin duyệt → TrangThai = 1 (Đang bán)
    ↓
Họa sĩ sửa → Lưu vào TacPhamChinhSua (TrangThai = 0)
    ↓
Admin duyệt chỉnh sửa → Cập nhật TacPham
```

### 3. Workflow đơn hàng
```
Tạo đơn → TrangThai = 0 (Chờ xác nhận)
    ↓
Admin xác nhận → TrangThai = 1 (Đã xác nhận)
    ↓
Đang giao → TrangThai = 2 (Đang giao)
    ↓
Hoàn thành → TrangThai = 3 (Đã giao)
```

### 4. Tính toán doanh thu
- Chỉ tính đơn hàng có `TrangThai = 3` (Đã giao)
- Doanh thu họa sĩ = Tổng tiền các tác phẩm của họa sĩ trong đơn hàng đã giao

---

## 🛠️ MIGRATION FILES

Các file migration quan trọng:
1. `Database_Setup_With_SampleData.sql` - Tạo database và dữ liệu mẫu
2. `Migration_TacPhamChinhSua.sql` - Thêm bảng TacPhamChinhSua
3. `Migration_YeuThich.sql` - Thêm bảng YeuThich

---

**Tài liệu này được tạo tự động từ Models**  
**Ngày cập nhật:** 30/05/2026  
**Phiên bản:** 2.0
