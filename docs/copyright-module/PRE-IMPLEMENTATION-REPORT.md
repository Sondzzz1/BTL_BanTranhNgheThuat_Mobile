# BÁO CÁO KIỂM TRA TRƯỚC KHI TRIỂN KHAI - MODULE BẢN QUYỀN

**Ngày:** 2026-09-28  
**Người thực hiện:** AI Assistant

---

## A. KẾT QUẢ KIỂM TRA CODE

### A1. Kiến trúc ADO.NET + DAL/BLL ✅

**Xác nhận:**
- ✅ Dự án SỬ DỤNG ADO.NET thuần với SqlConnection
- ✅ Có cấu trúc DAL/BLL/Models/DTO/Helpers/Controllers

**Bằng chứng:**
- **DAL example:** `BTL_BackEnd/BTL_BackEnd/DAL/DonHangRepository.cs`
- **BLL example:** `BTL_BackEnd/BTL_BackEnd/BLL/HoaSiBusiness.cs`
- **Thư mục hiện có:**
  - `/Models/` - Entity models
  - `/DTO/` - Data Transfer Objects (không phải `/DTOs/`)
  - `/Helpers/` - Helper classes
  - `/BLL/` - Business Logic Layer
  - `/DAL/` - Data Access Layer
  - `/DAL/Interfaces/` - Repository interfaces
  - `/BLL/Interfaces/` - Business interfaces

**Lưu ý quan trọng:**
- Thư mục là `DTO` (không có 's'), không phải `DTOs`
- Tất cả Repository dùng ADO.NET với `SqlConnection`, `SqlCommand`, `SqlDataReader`
- Không có EF Core, không có DbContext

---

### A2. Role Names và JWT Claims ✅

**Xác nhận từ code:**

**File:** `BTL_BackEnd/BTL_BackEnd/Controllers/HoaSiController.cs` line 12
```csharp
[Authorize(Roles = "Admin,HoaSi")]
```

**File:** `BTL_BackEnd/BTL_BackEnd/Helpers/JwtHelper.cs` lines 11-43
```csharp
public static int? GetMaTaiKhoan(ClaimsPrincipal user)
{
    var claim = user.FindFirst(ClaimTypes.NameIdentifier);
    if (claim != null && int.TryParse(claim.Value, out int maTaiKhoan))
    {
        return maTaiKhoan;
    }
    return null;
}

public static int? GetMaNguoiDung(ClaimsPrincipal user)
{
    var claim = user.FindFirst("MaNguoiDung");
    // ...
}

public static int? GetMaHoaSi(ClaimsPrincipal user)
{
    var claim = user.FindFirst("MaHoaSi");
    // ...
}

public static byte? GetVaiTro(ClaimsPrincipal user)
{
    var claim = user.FindFirst("VaiTro");
    // ...
}
```

**Kết luận:**
- **Role names:** `"Admin"`, `"HoaSi"`, `"NguoiDung"` (chứ không phải "Artist", "Customer")
- **Lấy MaTaiKhoan:** `JwtHelper.GetMaTaiKhoan(User)` - từ ClaimTypes.NameIdentifier
- **Lấy MaNguoiDung:** `JwtHelper.GetMaNguoiDung(User)` - từ claim "MaNguoiDung"
- **Lấy MaHoaSi:** `JwtHelper.GetMaHoaSi(User)` - từ claim "MaHoaSi"
- **Lấy VaiTro:** `JwtHelper.GetVaiTro(User)` - từ claim "VaiTro" (0=Admin, 1=NguoiDung, 2=HoaSi)

---

### A3. Phiên bản .NET ✅

**Xác nhận từ code:**

**File:** `BTL_BackEnd/BTL_BackEnd/DoAn2_BackEnd.csproj` line 4
```xml
<TargetFramework>net8.0</TargetFramework>
```

**Kết luận:**
- ✅ Dự án dùng **.NET 8.0**
- ✅ **AddRateLimiter** có sẵn (.NET 7+ required) → OK

---

### A4. TacPham.SoLuong và Tác phẩm trong nhiều đơn

**Xác nhận từ code:**

**File:** `BTL_BackEnd/BTL_BackEnd/Models/TacPham.cs` line 11
```csharp
public int SoLuong { get; set; }
```

**Kết luận:**
- ✅ TacPham CÓ cột `SoLuong`
- ⚠️ **Vấn đề tiềm ẩn:** Nếu SoLuong > 1, một tác phẩm có thể nằm trong nhiều đơn đã giao

**SQL Query để kiểm tra** (chưa chạy, cần chạy trên DB production):
```sql
SELECT 
    ct.MaTacPham,
    t.TenTacPham,
    t.SoLuong AS SoLuongTonKho,
    COUNT(DISTINCT d.MaDonHang) AS SoDonHangDaGiao,
    STRING_AGG(CAST(d.MaDonHang AS NVARCHAR), ', ') AS DanhSachDonHang
FROM ChiTietDonHang ct
JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
JOIN TacPham t ON ct.MaTacPham = t.MaTacPham
WHERE d.TrangThai = 3
GROUP BY ct.MaTacPham, t.TenTacPham, t.SoLuong
HAVING COUNT(DISTINCT d.MaDonHang) > 1
ORDER BY SoDonHangDaGiao DESC;
```

**Đề xuất xử lý:**
1. **Nếu SoLuong là tồn kho (nhiều bản copy):**
   - Không áp dụng module bản quyền cho tác phẩm SoLuong > 1
   - Chỉ cho tác phẩm ORIGINAL (LoaiTacPham = 0) với SoLuong = 1
   - Thêm constraint: `CHECK (LoaiTacPham = 0 AND SoLuong = 1)` khi tạo BanQuyen

2. **Nếu SoLuong = 1 luôn (tác phẩm gốc duy nhất):**
   - Migration cần xử lý tác phẩm trong nhiều đơn bằng ROW_NUMBER()
   - Đơn mới nhất là CURRENT, các đơn trước là TRANSFERRED

**Cần xác nhận từ Product Owner:** SoLuong là gì? Tồn kho hay luôn = 1?

---

### A5. Luồng hoàn trả/hoàn tiền hiện có ✅

**Xác nhận từ code:**

**File:** `BTL_BackEnd/BTL_BackEnd/DAL/HoanTraRepository.cs`
- Lines 29-47: `TaoYeuCauHoanTra` - Customer tạo yêu cầu
- Lines 136-148: `XacNhanDaGuiHang` - Customer xác nhận đã gửi hàng về
- Lines 240-263: `DuyetYeuCau` - Admin duyệt hoặc từ chối
- Lines 265-293: `CapNhatTrangThai` - Admin cập nhật trạng thái theo flow
- Lines 295-299: `HoanTat` - Admin hoàn tất

**File:** `BTL_BackEnd/BTL_BackEnd/BLL/HoanTraBusiness.cs` (giả định tồn tại)

**Kết luận:**
- ✅ **CÓ luồng hoàn trả** đầy đủ với các trạng thái:
  - `CHO_DUYET` → `DA_DUYET` → `DANG_HOAN_TRA` → `DA_NHAN_HANG` → `DA_HOAN_TIEN` → `HOAN_TAT`
  - Hoặc: `CHO_DUYET` → `TU_CHOI`
- ✅ Repository có sẵn, chỉ cần tích hợp hook `ReverseOwnershipOnRefundAsync`
- ⚠️ **Lưu ý:** Code hiện tại dùng `GETDATE()` (giờ local), cần đổi thành `GETUTCDATE()`

**Điểm tích hợp:**
- Hook vào sau khi Admin cập nhật trạng thái `DA_HOAN_TIEN`
- Gọi `OwnershipBusiness.ReverseOwnershipOnRefundAsync(maDonHang, adminId)`

---

## B. NHỮNG ĐIỂM CẦN SỬA TRONG TÀI LIỆU

### B1. Ràng buộc unique có điều kiện
- Sửa: Dùng CREATE UNIQUE INDEX ... WHERE thay vì trong CREATE TABLE
- Áp dụng cho:
  - `LichSuSoHuu(MaTacPham) WHERE TrangThai = 1`
  - `ChungNhan(MaLichSuSoHuu) WHERE TrangThai = 1`
  - Thêm: `BanQuyen(MaTacPham)` (unique không điều kiện)
  - Thêm: `LichSuSoHuu(MaDonHang, MaTacPham) WHERE MaDonHang IS NOT NULL AND TrangThai <> 3`

### B2. Migration xử lý tác phẩm trong nhiều đơn
- Dùng ROW_NUMBER() OVER (PARTITION BY MaTacPham ORDER BY NgayDat DESC)
- Đơn mới nhất: CURRENT
- Các đơn trước: TRANSFERRED
- Ghi chú: Dữ liệu cũ dùng giờ local, dữ liệu mới dùng UTC

### B3. FR-O03: Đổi "đúng 1" → "tối đa 1" Certificate ACTIVE
- Không cấp Certificate cho họa sĩ khi đảo ngược (vì chưa có RESALE)
- Chỉ thu hồi Certificate của người mua

### B4. Tranh chấp: Thêm cột TrangThaiTruocTranhChap
- Lưu trạng thái trước khi DISPUTED
- DISMISSED/RESOLVED → khôi phục đúng trạng thái trước
- Không cho LEGACY thành VERIFIED qua tranh chấp
- Thêm bảng KhoaKhieuNai

### B5. FR-C01: Không tự tạo BanQuyen khi tạo tác phẩm
- Tác phẩm chưa có BanQuyen = "Chưa khai báo"
- Chỉ tạo khi họa sĩ khai báo kèm bằng chứng

### B6. Điều kiện bán: Kiểm tra server-side
- Danh sách, chi tiết, thêm giỏ hàng, tạo đơn, thanh toán
- Chặn thanh toán thay vì tự động hủy đơn

### B7. Hook chuyển sở hữu: Idempotent + màn hình đối soát
- Dựa vào unique constraint
- Màn hình Admin "Đơn đã giao chưa có lịch sử sở hữu"
- Chặn bán lần hai tác phẩm ORIGINAL

### B8. Tích hợp hoàn tiền (INT05)
- Hook vào `DA_HOAN_TIEN`
- Endpoint Admin gọi ReverseOwnership

### B9. ChungNhan.HienThiChuSoHuu
- Cột BIT, mặc định 0
- Endpoint để chủ sở hữu bật/tắt

### B10. Verify công khai: Tính lại HMAC
- Kiểm tra toàn vẹn
- Nếu không khớp: "Không toàn vẹn", ghi AuditLog, thông báo Admin

### B11. Bảo mật cấu hình
- CertificateHashKey trong environment variable
- UseForwardedHeaders với KnownProxies
- Nhật ký chỉ-thêm: DENY UPDATE/DELETE hoặc trigger

### B12. Sửa "TraanhChap" → "TranhChap"
- FR-AL01, DTO names trong tasks

### B13. Thống nhất đường dẫn API
- `/api/public/certificate/verify/{code}`
- `/api/artist/copyright/evidence/{id}/file`
- `/api/admin/copyright/evidence/{id}/file`
- Sửa ma trận phân quyền: Họa sĩ KHÔNG xem chứng nhận "mình sở hữu"

### B14. PDF: Tạo on-demand, phông tiếng Việt
- Không lưu file PDF
- Nhúng font hỗ trợ tiếng Việt
- Kiểm tra license QuestPDF
- Chỉ thêm QuestPDF + QRCoder

### B15. tasks.md: Đếm lại, bỏ unrealistic targets
- Đếm đúng số task, P0/P1/P2
- Bỏ test "in-memory", 100% coverage
- Chuyển "giai đoạn sau": E2E, SignalR, CSV export

### B16. Xác nhận design.md
- ✅ Đã tồn tại
- Cần cập nhật theo v1.2

---

## C. QUYẾT ĐỊNH CẦN XÁC NHẬN

### C1. TacPham.SoLuong là gì?
**Câu hỏi:** SoLuong là tồn kho (nhiều bản copy) hay luôn = 1 (tác phẩm gốc duy nhất)?

**Tùy chọn:**
- **A:** SoLuong là tồn kho → Chỉ cho tác phẩm SoLuong = 1 tham gia module bản quyền
- **B:** SoLuong = 1 luôn → Migration xử lý tác phẩm trong nhiều đơn bằng ROW_NUMBER()

**Đề xuất:** Chọn tùy chọn B và xử lý migration cẩn thận

### C2. Có chạy SQL query kiểm tra không?
**SQL query:** (xem A4 phía trên)

**Quyết định:** Có hay không? Nếu có, kết quả ra sao?

---

**Kết thúc báo cáo**
