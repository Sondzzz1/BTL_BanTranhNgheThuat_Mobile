# TÓM TẮT THAY ĐỔI V1.2 - YÊU CẦU

**Ngày:** 2026-09-28

---

## CÁC THAY ĐỔI QUAN TRỌNG

### 1. Ràng buộc Unique có điều kiện (B1)
**Vị trí:** Mục 1.3 Schema SQL, Mục 9 Migration

**Thay đổi:**
```sql
-- KHÔNG làm như thế này trong CREATE TABLE:
CONSTRAINT UQ_LichSuSoHuu_Current UNIQUE (MaTacPham) WHERE TrangThai = 1

-- MÀ phải tách ra thành CREATE UNIQUE INDEX:
CREATE UNIQUE NONCLUSTERED INDEX UQ_LichSuSoHuu_Current 
ON LichSuSoHuu(MaTacPham) WHERE TrangThai = 1;

CREATE UNIQUE NONCLUSTERED INDEX UQ_ChungNhan_LichSuSoHuu_Active 
ON ChungNhan(MaLichSuSoHuu) WHERE TrangThai = 1;
```

**Thêm mới:**
```sql
-- Unique không điều kiện cho BanQuyen
ALTER TABLE BanQuyen ADD CONSTRAINT UQ_BanQuyen_TacPham UNIQUE (MaTacPham);

-- Chống chuyển sở hữu hai lần cho cùng đơn hàng
CREATE UNIQUE NONCLUSTERED INDEX UQ_LichSuSoHuu_DonHang_TacPham
ON LichSuSoHuu(MaDonHang, MaTacPham) 
WHERE MaDonHang IS NOT NULL AND TrangThai <> 3; -- REVERSED
```

---

### 2. Migration xử lý tác phẩm trong nhiều đơn (B2)
**Vị trí:** Mục 9.2

**Vấn đề:** 
- TacPham có cột `SoLuong` (`Models/TacPham.cs` line 11)
- Một tác phẩm có thể bán nhiều lần (SoLuong > 1) hoặc sai sót dữ liệu

**Giải pháp:** Dùng ROW_NUMBER()
```sql
-- Bước 3: Tạo LichSuSoHuu CURRENT cho người mua (xử lý trùng lặp)
WITH RankedOrders AS (
    SELECT 
        ct.MaTacPham,
        d.MaNguoiDung,
        d.MaDonHang,
        d.NgayDat,
        ROW_NUMBER() OVER (PARTITION BY ct.MaTacPham ORDER BY d.NgayDat DESC) AS RowNum
    FROM ChiTietDonHang ct
    JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
    WHERE d.TrangThai = 3
)
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, ...)
SELECT 
    MaTacPham,
    MaNguoiDung,
    NULL as MaHoaSi,
    NgayDat as NgayNhan,
    ...
    CASE WHEN RowNum = 1 THEN 1 ELSE 2 END as TrangThai -- 1=CURRENT, 2=TRANSFERRED
FROM RankedOrders;
```

**Ghi chú quan trọng:**
- ⚠️ Dữ liệu cũ sử dụng `GETDATE()` (giờ địa phương)
- ✅ Dữ liệu mới (sau deploy) sử dụng `GETUTCDATE()` (giờ UTC)
- Migration script phải chạy một lần duy nhất, không được chạy lại

---

### 3. FR-O03: "Tối đa 1" Certificate ACTIVE (B3)
**Vị trí:** FR-O03, NFR-C03

**Thay đổi:**
- Đổi "đúng 1" → **"tối đa 1"** Certificate ACTIVE
- Vì chưa có RESALE, chủ trước luôn là họa sĩ
- Họa sĩ **KHÔNG nhận chứng nhận** (họ không mua tranh, họ là tác giả)
- Khi đảo ngược (hoàn tiền):
  - ✅ Thu hồi Certificate của người mua (TrangThai = REVOKED)
  - ❌ KHÔNG cấp lại Certificate cho họa sĩ
  - ❌ KHÔNG khôi phục Certificate SUPERSEDED (chỉ áp dụng khi có RESALE)

**Lý do:**
- Giai đoạn 1 chỉ có luồng: Họa sĩ → Khách hàng
- Họa sĩ là tác giả, không cần chứng nhận sở hữu
- Phần khôi phục SUPERSEDED để dành cho tương lai khi có RESALE

---

### 4. Tranh chấp: Thêm TrangThaiTruocTranhChap (B4)
**Vị trí:** Mục 1.3 Schema, FR-C04, Bảng 6.2

**Schema mới:**
```sql
ALTER TABLE BanQuyen ADD TrangThaiTruocTranhChap TINYINT NULL;
```

**Luồng mới:**
1. Khi Admin chuyển TranhChap từ OPEN → UNDER_REVIEW:
   - Lưu `BanQuyen.TrangThaiTruocTranhChap = BanQuyen.TrangThai` (hiện tại)
   - Chuyển `BanQuyen.TrangThai = DISPUTED`
   
2. Khi Admin giải quyết:
   - **DISMISSED:** Khôi phục `BanQuyen.TrangThai = TrangThaiTruocTranhChap`
   - **RESOLVED "không căn cứ":** Khôi phục về trạng thái trước
   - **RESOLVED "vi phạm":** Chuyển `BanQuyen.TrangThai = REJECTED`

**Quy tắc đặc biệt:**
- ❌ **Tuyệt đối KHÔNG** cho LEGACY thành VERIFIED qua tranh chấp
- ✅ LEGACY bị tranh chấp → DISPUTED → Chỉ có thể về LEGACY hoặc REJECTED
- ✅ PENDING/VERIFIED → DISPUTED → Có thể về trạng thái trước hoặc REJECTED

**Bảng KhoaKhieuNai (mới):**
```sql
CREATE TABLE KhoaKhieuNai (
    MaKhoa INT PRIMARY KEY IDENTITY(1,1),
    MaNguoiDung INT NOT NULL,
    KhoaDen DATETIME NOT NULL, -- Khóa đến ngày này
    LyDo NVARCHAR(500) NOT NULL,
    MaAdmin INT NULL, -- Admin khóa
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_KhoaKhieuNai_NguoiDung FOREIGN KEY (MaNguoiDung) 
        REFERENCES NguoiDung(MaNguoiDung)
);
```

**Endpoints mới:**
- POST `/api/admin/dispute/lock-user` - Khóa khả năng khiếu nại
- POST `/api/admin/dispute/unlock-user` - Gỡ khóa

---

### 5. FR-C01: KHÔNG tự tạo BanQuyen khi tạo tác phẩm (B5)
**Vị trí:** FR-C01, Mục 5.1, Task INT02

**Thay đổi:**
- ❌ Xóa logic tự động tạo BanQuyen PENDING khi tạo tác phẩm
- ✅ Tác phẩm chưa có BanQuyen = **"Chưa khai báo bản quyền"**
- ✅ BanQuyen chỉ được tạo khi họa sĩ chủ động khai báo kèm tối thiểu 2 bằng chứng
- ✅ Vẫn tạo LichSuSoHuu CREATION khi tạo tác phẩm

**Điều kiện bán mới:**
```
TacPham.TrangThai = 1 (Đã duyệt nội dung)
VÀ EXISTS (SELECT 1 FROM BanQuyen WHERE MaTacPham = t.MaTacPham)
VÀ BanQuyen.TrangThai IN (2, 5) -- VERIFIED hoặc LEGACY
```

**Lý do:**
- Tránh tạo rác dữ liệu (nhiều tác phẩm không bao giờ khai báo bản quyền)
- Bắt buộc họa sĩ cung cấp bằng chứng ngay từ đầu

---

### 6. Điều kiện bán: Kiểm tra server-side đầy đủ (B6)
**Vị trí:** Mục 5.2, Tasks mới

**Kiểm tra tại các điểm:**
1. **Danh sách sản phẩm:** WHERE clause
2. **Chi tiết sản phẩm:** Trả về cờ `CoTheMua: bool`
3. **Thêm giỏ hàng:** Kiểm tra + trả lỗi nếu không được bán
4. **Tạo đơn hàng:** Kiểm tra lại toàn bộ giỏ hàng
5. **Thanh toán:** Kiểm tra lần cuối trước khi charge

**Xử lý đơn hàng đang xử lý khi BanQuyen → DISPUTED:**
- ❌ **Xóa logic:** "Tự động hủy đơn chưa thanh toán"
- ✅ **Logic mới:** 
  - Chặn thanh toán (check trước khi charge)
  - Thông báo Admin qua màn hình "Đơn hàng bị chặn"
  - Admin xem xét thủ công: Hủy hoặc Cho phép thanh toán

**Lý do:**
- Tránh tự động hủy đơn của khách hàng thiện chí
- Admin có quyền quyết định từng trường hợp

---

### 7. Hook chuyển sở hữu: Idempotent + Màn hình đối soát (B7)
**Vị trí:** Task INT01, FR-O02

**Idempotent design:**
- Dựa vào unique index: `UQ_LichSuSoHuu_DonHang_TacPham`
- Nếu đã có bản ghi với (MaDonHang, MaTacPham): Bỏ qua (không lỗi)
- Dùng `INSERT IGNORE` hoặc check EXISTS trước

**Xử lý lỗi:**
```csharp
try {
    await _ownershipBusiness.TransferOwnershipOnOrderCompletedAsync(donHangId);
} catch (Exception ex) {
    _logger.LogError(ex, $"Failed to transfer ownership for order {donHangId}");
    // GHI THONGBAO cho Admin
    await _notificationBusiness.SendAsync(
        adminTaiKhoanId, 
        "DonHangLoi", 
        $"Đơn hàng {donHangId} không tạo được lịch sử sở hữu", 
        $"/admin/ownership/reconciliation?donHangId={donHangId}"
    );
    // KHÔNG throw, không rollback đơn hàng
}
```

**Màn hình Admin mới:** `/admin/ownership/reconciliation`
- Truy vấn đối soát:
```sql
SELECT d.MaDonHang, d.NgayDat, d.MaNguoiDung, nd.Ten
FROM DonHang d
JOIN NguoiDung nd ON d.MaNguoiDung = nd.MaNguoiDung
WHERE d.TrangThai = 3 -- Đã giao
  AND NOT EXISTS (
      SELECT 1 FROM LichSuSoHuu ls
      WHERE ls.MaDonHang = d.MaDonHang
  )
ORDER BY d.NgayDat DESC;
```
- Nút "Tạo lại ownership" cho từng đơn

**Chặn bán lần hai tác phẩm ORIGINAL:**
- Khi thêm vào giỏ hàng/tạo đơn:
```sql
-- Kiểm tra tác phẩm ORIGINAL đã bán chưa
SELECT COUNT(1) 
FROM LichSuSoHuu ls
WHERE ls.MaTacPham = @MaTacPham
  AND ls.LoaiChuyenGiao = 1 -- SALE
  AND ls.TrangThai = 2 -- TRANSFERRED (đã bán rồi)
```
- Nếu > 0: Trả lỗi "Tác phẩm đã được bán"

---

### 8. Tích hợp hoàn tiền (INT05) (B8)
**Vị trí:** Task INT05 (mới)

**Hook điểm:**

**File:** `BTL_BackEnd/BTL_BackEnd/DAL/HoanTraRepository.cs` line 265
```csharp
public async Task<bool> CapNhatTrangThai(int maYeuCau, string trangThai)
```

**Tích hợp:**
```csharp
// Trong HoanTraBusiness.cs
public async Task<bool> CapNhatTrangThai(int maYeuCau, string trangThai)
{
    var success = await _hoanTraRepo.CapNhatTrangThai(maYeuCau, trangThai);
    
    if (success && trangThai == "DA_HOAN_TIEN")
    {
        // Lấy thông tin yêu cầu
        var yeuCau = await _hoanTraRepo.GetById(maYeuCau);
        
        // Hook: Đảo ngược ownership
        try {
            await _ownershipBusiness.ReverseOwnershipOnRefundAsync(
                yeuCau.MaDonHang, 
                JwtHelper.GetMaTaiKhoan(User).Value
            );
        } catch (Exception ex) {
            // Log error, thông báo Admin
            _logger.LogError(ex, $"Failed to reverse ownership for refund {maYeuCau}");
        }
    }
    
    return success;
}
```

**Endpoint Admin bổ sung:**
- POST `/api/admin/ownership/reverse` - Đảo ngược thủ công (khi auto fail)

---

### 9. ChungNhan.HienThiChuSoHuu (B9)
**Vị trí:** Schema ChungNhan, API endpoints

**Schema:**
```sql
ALTER TABLE ChungNhan ADD HienThiChuSoHuu BIT NOT NULL DEFAULT 0;
```

**Endpoints:**
- PUT `/api/certificate/{certificateCode}/toggle-public-display`
  - Body: `{ hienThi: true/false }`
  - Authorization: Chỉ chủ sở hữu hiện tại
  
**Logic verify công khai:**
```csharp
if (certificate.HienThiChuSoHuu) {
    response.ChuSoHuu = GetFullOwnerName(certificate);
} else {
    response.ChuSoHuu = MaskName(GetFullOwnerName(certificate)); // N*** V***
}
```

---

### 10. Verify công khai: Tính lại HMAC (B10)
**Vị trí:** FR-CE05, CertificateService.VerifyPublicAsync

**Logic:**
```csharp
public async Task<PublicCertificateVerificationResponse> VerifyPublicAsync(string certificateCode)
{
    var cert = await _repo.GetByCertificateCode(certificateCode);
    if (cert == null) return new() { IsValid = false, TrangThai = "NOT_FOUND" };
    
    // TÍNH LẠI HMAC
    var data = $"{cert.MaTacPham}|{cert.MaTacGia}|{cert.MaChuSoHuu}|{cert.MaLichSuSoHuu}|{cert.NgayCap:O}|{cert.CertificateCode}";
    var computedHash = _hmacHelper.ComputeHmac(data);
    
    // KIỂM TRA TOÀN VẸN
    if (computedHash != cert.ContentHash)
    {
        // GHI AUDIT LOG
        await _auditLogBusiness.LogAsync(new() {
            TenDoiTuong = "ChungNhan",
            MaDoiTuong = cert.MaChungNhan,
            HanhDong = "XacMinhKhongToanVen",
            LyDo = $"HMAC không khớp. Expected: {computedHash}, Got: {cert.ContentHash}"
        });
        
        // THÔNG BÁO ADMIN
        await _notificationBusiness.SendToAllAdmins(
            "BaoMat",
            "Phát hiện chứng nhận không toàn vẹn",
            $"Certificate {certificateCode} có dấu hiệu bị giả mạo"
        );
        
        return new() {
            IsValid = false,
            TrangThai = "TAMPERED",
            ThongBao = "Chứng nhận không toàn vẹn, vui lòng liên hệ hỗ trợ"
        };
    }
    
    // Tiếp tục logic verify bình thường...
}
```

---

### 11. Bảo mật cấu hình (B11)
**Vị trí:** appsettings.json, Program.cs

**CertificateHashKey:**
```json
// appsettings.example.json (commit vào git)
{
  "Copyright": {
    "CertificateHashKey": "YOUR_SECRET_KEY_HERE_REPLACE_ME"
  }
}

// appsettings.json (KHÔNG commit)
{
  "Copyright": {
    "CertificateHashKey": "a3f8b2c1e9d4f7a6b5c8e1d2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
  }
}
```

**Hoặc dùng User Secrets (.NET):**
```bash
dotnet user-secrets set "Copyright:CertificateHashKey" "a3f8b2c1..."
```

**ForwardedHeaders:**
```csharp
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    
    // CHỈ ĐỊNH proxy servers (bảo mật)
    options.KnownProxies.Add(IPAddress.Parse("10.0.0.100")); // Proxy server IP
    // Hoặc:
    options.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});
```

**Nhật ký chỉ-thêm:**

**Tùy chọn 1: DENY permission (khuyến nghị)**
```sql
-- Tạo user riêng cho ứng dụng
CREATE USER AppUser WITHOUT LOGIN;
GRANT SELECT, INSERT ON NhatKyHeThong TO AppUser;
DENY UPDATE, DELETE ON NhatKyHeThong TO AppUser;
```

**Tùy chọn 2: Trigger INSTEAD OF**
```sql
CREATE TRIGGER TR_NhatKyHeThong_PreventModify
ON NhatKyHeThong
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    RAISERROR('Không được sửa hoặc xóa nhật ký', 16, 1);
    ROLLBACK TRANSACTION;
END;
```

**Ghi nhật ký trong transaction:**
```csharp
using var transaction = await connection.BeginTransactionAsync();
try {
    // Thao tác nghiệp vụ
    await UpdateBanQuyen(..., transaction);
    
    // Ghi nhật ký TRONG CÙNG transaction
    await _auditLogRepo.LogAsync(..., transaction);
    
    await transaction.CommitAsync();
} catch {
    await transaction.RollbackAsync();
    throw;
}
```

---

### 12. Sửa "TraanhChap" → "TranhChap" (B12)
**Vị trí:** Toàn bộ tài liệu

**Danh sách cần sửa:**
- FR-AL01: Bảng hành động ghi nhật ký
- Tên entity: `TranhChapBanQuyen` (không phải `TraanhChapBanQuyen`)
- DTO names trong tasks.md: `TranhChapResponse`, `TranhChapDetailResponse`
- Tên bảng trong mọi query SQL

---

### 13. Thống nhất đường dẫn API (B13)
**Vị trí:** Design.md section 3, Ma trận phân quyền

**API endpoints chuẩn:**
- Verify công khai: `/api/public/certificate/verify/{code}` ✅
- Evidence (Artist): `/api/artist/copyright/evidence/{id}/file` ✅
- Evidence (Admin): `/api/admin/copyright/evidence/{id}/file` ✅

**Ma trận phân quyền - Sửa:**
- ❌ Bỏ dòng: "Họa sĩ xem chứng nhận 'mình sở hữu'"
- ✅ Lý do: Họa sĩ là tác giả, không phải chủ sở hữu. Quyền xem chứng nhận dựa vào `LichSuSoHuu.MaNguoiDung`, không phải `BanQuyen.MaTacGia`

---

### 14. PDF: On-demand, Font tiếng Việt (B14)
**Vị trí:** FR-CE01, Design.md Template PDF

**Thay đổi:**
- ❌ Không lưu file PDF vào disk
- ✅ Tạo PDF on-demand từ dữ liệu DB khi user request
- ✅ Return PDF dạng stream: `return File(pdfBytes, "application/pdf", $"{certificateCode}.pdf")`

**Font tiếng Việt:**
```csharp
// Nhúng font vào project
.DefaultTextStyle(x => x.FontFamily("Arial Unicode MS") // Hoặc "Times New Roman"
```

**Hoặc dùng built-in fonts hỗ trợ Unicode:**
- QuestPDF mặc định hỗ trợ: Arial, Times New Roman, Courier New với Unicode

**License QuestPDF:**
- ⚠️ **Community License:** FREE cho dự án < $1M revenue/năm
- ⚠️ **Professional License:** $249/developer/năm nếu > $1M revenue
- ✅ **Kiểm tra:** Đọc license tại https://www.questpdf.com/license/

**Thư viện:**
- ✅ QuestPDF (PDF generation)
- ✅ QRCoder (QR code)
- ❌ KHÔNG thêm thư viện khác

---

### 15. tasks.md: Đếm lại, Realistic targets (B15)
**Vị trí:** tasks.md - Tổng kết, Test tasks

**Thay đổi:**
- ✅ Đếm lại đúng số task sau khi thêm/bỏ
- ✅ Phân loại lại P0/P1/P2
- ❌ Bỏ: "Test repository với in-memory DB" → Dùng test DB thật
- ❌ Bỏ: "100% coverage" → Đổi thành "70% coverage cho logic nghiệp vụ"
- ⏸️ Chuyển "giai đoạn sau":
  - E2E tests (P2 → không bắt buộc)
  - SignalR real-time notifications
  - Export CSV cho audit log

---

### 16. Design.md cần cập nhật (B16)
**Vị trí:** design.md

**Cần cập nhật:**
- Schema SQL với:
  - `BanQuyen.TrangThaiTruocTranhChap`
  - `ChungNhan.HienThiChuSoHuu`
  - Bảng `KhoaKhieuNai`
  - Unique indexes đúng syntax
- API endpoints:
  - Dispute lock/unlock
  - Certificate toggle public display
  - Ownership reconciliation
  - Admin reverse ownership
- DTO:
  - Thêm fields mới
- Business logic:
  - Verify HMAC
  - Idempotent transfer
  - Handle multiple orders

---

**Kết thúc tóm tắt v1.2**
