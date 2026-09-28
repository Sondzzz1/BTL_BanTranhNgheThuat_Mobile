# CẬP NHẬT REQUIREMENTS.MD - CHANGELOG

## Các thay đổi đã áp dụng:

### 1. ✅ FR-O03 (Hoàn tiền) - ĐÃ SỬA
- Chỉ cho đảo ngược khi bản ghi đang CURRENT
- Nếu không CURRENT: Từ chối tự động, ghi log, chuyển Admin xử lý thủ công
- Phải khôi phục hoặc cấp lại Certificate cho chủ cũ
- Đảm bảo luôn có đúng 1 Certificate ACTIVE sau khi đảo ngược

### 2. ✅ FR-O02 (Chuyển sở hữu) - ĐÃ SỬA  
- NgayChuyenGiao = DateTime.UtcNow (không dùng NgayDat)
- Xác nhận TrangThai = 3 là "Đã giao" từ code
- Bỏ RESALE khỏi giai đoạn 1 (hệ thống chưa có chức năng bán lại)
- Chỉ hỗ trợ SALE từ họa sĩ → khách hàng

### 3. ⚠️ Migration dữ liệu - CẦN CẬP NHẬT HOÀN TOÀN
**Các phát hiện từ code:**
- DonHang CÓ MaNguoiDung → Có thể tạo ownership từ đơn cũ
- MaHoaSi KHÔNG PHẢI khóa ngoại đến NguoiDung
- Cần thêm cột OwnerType: 'ARTIST' | 'CUSTOMER'
- Dùng MaChuSoHuu = -1 cho "sở hữu bởi tác giả"

**Chiến lược mới:**
- PHẢI tạo ownership cho đơn đã giao (không bỏ qua)
- Không cấp Certificate cho dữ liệu cũ
- Lưu MaHoaSi trong GhiChu
- Tạo SQL scripts chi tiết trong design.md

### 4. ✅ Chính sách LEGACY - ĐÃ LÀM RÕ
**Người mua tranh LEGACY:**
- KHÔNG có chứng nhận
- Giao diện hiển thị rõ: "Tác phẩm này được mua trước khi có hệ thống chứng nhận"
- Badge cảnh báo trên trang chi tiết tác phẩm
- Trong lịch sử đơn hàng: "Chứng nhận không khả dụng (đơn hàng cũ)"

### 5. ✅ TacPham.TrangThai vs BanQuyen.TrangThai - ĐÃ LÀM RÕ
**Xác nhận từ code:**
```
TacPham.TrangThai:
0 = Chờ duyệt (Pending)
1 = Đã duyệt (Approved) ← CHỈ LOẠI NÀY được bán
3 = Từ chối (Rejected)
99 = Đã xóa (Soft delete)
```

**Tách biệt rõ ràng:**
- TacPham.TrangThai: Kiểm duyệt NỘI DUNG (ảnh, mô tả, giá)
- BanQuyen.TrangThai: Xác minh QUYỀN SỞ HỮU và bằng chứng
- Admin KHÔNG phải duyệt hai lần
- Điều kiện bán: TacPham=1 AND BanQuyen IN (VERIFIED, LEGACY)

### 6. 🔜 Lưu trữ bằng chứng - CẦN BỔ SUNG VÀO DESIGN.MD
**Yêu cầu:**
- Lưu ngoài thư mục public (ví dụ: `/uploads/copyright-evidence/`)
- Kiểm tra MIME type thật (không chỉ extension)
- Truy cập qua API có kiểm tra quyền: `/api/copyright/evidence/{id}/file`
- Đổi tên file: `{MaBanQuyen}_{Timestamp}_{OriginalName}`
- Backup định kỳ
- Giới hạn: 5MB/file, tối đa 10 files/bản quyền

### 7. 🔜 Tranh chấp - CẦN BỔ SUNG VÀO REQUIREMENTS.MD
**Bổ sung luồng:**
1. User gửi khiếu nại → OPEN
2. **Admin lọc sơ bộ** (10% khiếu nại spam/lạm dụng):
   - Nếu rõ ràng lạm dụng: DISMISSED ngay, không ẩn tác phẩm
   - Nếu nghiêm túc: UNDER_REVIEW, thông báo họa sĩ
3. **Họa sĩ phản hồi** (trong 7 ngày):
   - Upload bằng chứng bổ sung
   - Giải thích
4. **Admin xem xét đầy đủ** → RESOLVED hoặc DISMISSED
5. **Giới hạn lạm dụng:**
   - Mỗi user tối đa 3 khiếu nại/tháng
   - Nếu 3 khiếu nại liên tiếp bị DISMISSED → Khóa chức năng khiếu nại 30 ngày

**Chỉ ẩn tác phẩm khi:** Admin chuyển sang UNDER_REVIEW (sau khi lọc sơ bộ)

### 8. ✅ ContentHash - SỬA CÔNG THỨC
**Thay đổi:**
- Từ: SHA256(MaTacPham + MaChuSoHuu + NgayCap + CertificateCode)
- Sang: **HMAC-SHA256** với key bí mật từ appsettings.json
- Dữ liệu băm: `{MaTacPham}|{MaTacGia}|{MaChuSoHuu}|{MaLichSuSoHuu}|{NgayCap:O}|{CertificateCode}`
- Key: `CertificateHashKey` trong appsettings.json

**Lý do:** HMAC an toàn hơn, chống tampering

### 9. 🔜 Sửa chi tiết kỹ thuật - CẦN CẬP NHẬT DESIGN.MD
**a) Chính tả:**
- ~~TraanhChapBanQuyen~~ → `TraanhChapBanQuyen` (giữ nguyên - đúng tiếng Việt)
- Hoặc đổi thành: `ChapBanQuyen` (ngắn gọn hơn)

**b) DateTime:**
- Tất cả timestamp dùng `DateTime.UtcNow` (không dùng `DateTime.Now`)
- Trong SQL: `GETUTCDATE()` thay vì `GETDATE()`
- Khi hiển thị: Convert sang múi giờ địa phương (GMT+7)

**c) URL QR:**
- Lấy từ cấu hình: `BaseUrl` trong appsettings.json
- Format: `{BaseUrl}/verify/certificate/{CertificateCode}`
- Ví dụ: `https://artgallery.com/verify/certificate/COA-2026-A3F8K9P2X7N5`

**d) Thư viện PDF:**
- Đề xuất: **QuestPDF** (miễn phí, mã nguồn mở, hỗ trợ .NET)
- Hoặc: iText7 (có phí), PdfSharpCore
- Template PDF: Thiết kế trong design.md

**e) Cơ chế thử lại cấp Certificate:**
- Nếu thất bại: Ghi vào bảng `CertificatePendingQueue`
- Background job (Hangfire/Quartz.NET) retry mỗi 5 phút
- Tối đa 3 lần
- Sau 3 lần: Thông báo Admin qua dashboard

**f) Màn hình Admin:**
- Trang "Chứng nhận chưa cấp" `/admin/certificates/pending`
- Hiển thị: OwnershipHistory không có Certificate
- Nút "Cấp thủ công"

### 10. ✅ Rate limiting verify - CẬP NHẬT
**Thay đổi:**
- Từ: 10 req/min/IP
- Sang: **20 req/5min/IP** (linh hoạt hơn, tránh false positive)

**Lấy IP thật sau proxy:**
- Đọc từ header: `X-Forwarded-For` hoặc `X-Real-IP`
- Fallback: `HttpContext.Connection.RemoteIpAddress`
- Middleware: `app.UseForwardedHeaders()`

**Cấu hình:**
```csharp
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("verify", opt => {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(5);
        opt.QueueLimit = 0;
    });
});
```

**Áp dụng:**
```csharp
[EnableRateLimiting("verify")]
[HttpGet("api/public/certificates/verify/{code}")]
```

---

## TÓM TẮT: FILE CẦN CẬP NHẬT

### requirements.md (file hiện tại)
- [x] FR-O02: NgayChuyenGiao, bỏ RESALE
- [x] FR-O03: Kiểm tra CURRENT, khôi phục Certificate
- [x] Mục 9: Migration strategy hoàn chỉnh
- [x] Làm rõ TacPham.TrangThai vs BanQuyen.TrangThai
- [ ] **CẦN BỔ SUNG:** FR-C04 chi tiết (tranh chấp có lọc và họa sĩ phản hồi)
- [ ] **CẦN BỔ SUNG:** Chính sách LEGACY hiển thị giao diện
- [ ] **CẦN BỔ SUNG:** Rate limiting verify = 20/5min

### design.md (chưa tạo)
- [ ] Schema SQL đầy đủ với OwnerType
- [ ] API specs với ContentHash = HMAC-SHA256
- [ ] Lưu trữ bằng chứng (folder, MIME check, API protected)
- [ ] DateTime.UtcNow ở mọi nơi
- [ ] BaseUrl từ config
- [ ] Thư viện PDF: QuestPDF
- [ ] Background job retry Certificate
- [ ] Màn hình "Certificates Pending"
- [ ] ForwardedHeaders middleware
- [ ] Template PDF chứng nhận

### tasks.md (chưa tạo)
- [ ] Task chi tiết cho từng file cần tạo/sửa
- [ ] Thứ tự ưu tiên
- [ ] Dependencies giữa các task

---

## CÁC ĐIỂM QUYẾT ĐỊNH CUỐI CÙNG

| Vấn đề | Quyết định |
|--------|-----------|
| Đảo ngược ownership | Chỉ khi CURRENT, nếu không thì Admin xử lý thủ công ✅ |
| Migration đơn cũ | TẠO ownership, KHÔNG cấp Certificate ✅ |
| ContentHash | HMAC-SHA256 với key bí mật ✅ |
| DateTime | Luôn dùng UtcNow ✅ |
| Thư viện PDF | QuestPDF ✅ |
| Rate limiting | 20 req / 5 min ✅ |
| Tranh chấp | Admin lọc trước khi ẩn tác phẩm ✅ |
| Tên bảng | `TraanhChapBanQuyen` (giữ nguyên) ✅ |

---

**Trạng thái:** Requirements.md đã cập nhật một phần, cần hoàn thiện thêm các điểm 6, 7, 9, 10.

**Bước tiếp theo:** 
1. Hoàn thiện requirements.md
2. Tạo design.md chi tiết
3. Tạo tasks.md

Bạn có muốn tôi tiếp tục hoàn thiện requirements.md và tạo design.md không?
