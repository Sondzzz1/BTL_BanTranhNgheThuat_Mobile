# DANH SÁCH TASKS - MODULE QUẢN LÝ BẢN QUYỀN

**Phiên bản:** 1.0  
**Ngày tạo:** 2026-09-28  
**Dự án:** Hệ thống bán tranh nghệ thuật trực tuyến

---

## TỔNG QUAN

Danh sách task được sắp xếp theo thứ tự: **Domain → Infrastructure/Migration → Application → API → Frontend → Test**

**Ước lượng tổng:** ~40-50 ngày làm việc (1-2 developer)

---

## GIAI ĐOẠN 1: DOMAIN MODELS (3-4 ngày)

### TASK-D01: Tạo Entity Models
**Ưu tiên:** P0 (Cao nhất)  
**Ước lượng:** 1 ngày  
**Dependencies:** Không

**Mô tả:** Tạo các class Models trong `BTL_BackEnd/BTL_BackEnd/Models/`

**Công việc:**
- [ ] `BanQuyen.cs`: 12 properties
- [ ] `BangChungBanQuyen.cs`: 8 properties
- [ ] `LichSuSoHuu.cs`: 10 properties (lưu ý: MaNguoiDung, MaHoaSi nullable)
- [ ] `ChungNhan.cs`: 11 properties
- [ ] `TranhChapBanQuyen.cs`: 14 properties
- [ ] `NhatKyHeThong.cs`: 11 properties
- [ ] `CertificatePendingQueue.cs`: 8 properties
- [ ] `ThongBao.cs`: 8 properties
- [ ] Thêm properties vào `TacPham.cs`: LoaiTacPham, MaTacPhamGoc, SoBanIn, TongSoBan

**Verification:**
- Build thành công không lỗi
- Tất cả properties có data annotation phù hợp

---

### TASK-D02: Tạo Constants và Enums
**Ưu tiên:** P0  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-D01

**Mô tả:** Tạo file `BTL_BackEnd/BTL_BackEnd/Constants/CopyrightConstants.cs`

**Công việc:**
- [ ] `BanQuyenStatus`: PENDING=0, NEED_INFO=1, VERIFIED=2, REJECTED=3, DISPUTED=4, LEGACY=5
- [ ] `LichSuSoHuuStatus`: CURRENT=1, TRANSFERRED=2, REVERSED=3
- [ ] `LoaiChuyenGiao`: CREATION=0, SALE=1, RESALE=2
- [ ] `ChungNhanStatus`: ACTIVE=1, SUPERSEDED=2, REVOKED=3, EXPIRED=4
- [ ] `TranhChapStatus`: OPEN=0, UNDER_REVIEW=1, RESOLVED=2, DISMISSED=3
- [ ] `LoaiTacPham`: ORIGINAL=0, REPRODUCTION=1, DERIVATIVE=2
- [ ] Method `GetStatusText()` cho mỗi enum

**Verification:**
- Tất cả giá trị match với requirements.md
- Unit test cho GetStatusText methods

---

### TASK-D03: Tạo DTO Classes
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-D01

**Mô tả:** Tạo thư mục `BTL_BackEnd/BTL_BackEnd/DTOs/Copyright/`

**Công việc:**
- [ ] Request DTOs (11 classes):
  - DeclareCopyrightRequest, UpdateCopyrightRequest
  - VerifyCopyrightRequest, RejectCopyrightRequest, RequestInfoRequest
  - ReportDisputeRequest, RespondDisputeRequest, ReviewDisputeRequest, DismissDisputeRequest, ResolveDisputeRequest
  - RevokeCertificateRequest
- [ ] Response DTOs (14 classes):
  - BanQuyenResponse, BanQuyenDetailResponse, BangChungResponse
  - TraanhChapResponse, TraanhChapDetailResponse
  - ChungNhanResponse, ChungNhanDetailResponse, PublicCertificateVerificationResponse, CertificatePendingResponse
  - LichSuSoHuuResponse
  - NhatKyResponse
  - ThongBaoResponse
  - UploadEvidenceResponse
  - PagedResult<T> (generic)

**Verification:**
- Tất cả DTO có Data Annotations (Required, EmailAddress, MaxLength, etc.)
- DTOs match với design.md section 4

---

### TASK-D04: Tạo Helper Classes
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-D01

**Mô tả:** Tạo thư mục `BTL_BackEnd/BTL_BackEnd/Helpers/Copyright/`

**Công việc:**
- [ ] `HmacHashHelper.cs`: HMAC-SHA256 hashing
- [ ] `CertificateCodeGenerator.cs`: Sinh COA-YYYY-XXXXXXXXXXXX
- [ ] `FileHelper.cs`: Kiểm tra MIME type thật, validate file size
- [ ] `OwnerHelper.cs`: Get owner name từ MaNguoiDung hoặc MaHoaSi
- [ ] `MaskingHelper.cs`: Che tên một phần (N*** V***)

**Verification:**
- Unit test cho mỗi helper class
- HMAC test với key mẫu
- Certificate code unique constraint

---

## GIAI ĐOẠN 2: INFRASTRUCTURE & MIGRATION (4-5 ngày)

### TASK-I01: Tạo Migration Scripts
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-D01

**Mô tả:** Tạo SQL migration scripts

**Công việc:**
- [ ] `SQL/Migrations/001_CreateCopyrightTables.sql`: Tạo 8 bảng mới
- [ ] `SQL/Migrations/002_AlterTacPhamTable.sql`: Thêm 4 cột vào TacPham
- [ ] `SQL/Migrations/003_MigrateLegacyData.sql`: Migrate BanQuyen LEGACY
- [ ] `SQL/Migrations/004_MigrateLichSuSoHuu.sql`: Migrate ownership từ đơn cũ
- [ ] `SQL/Migrations/999_Rollback.sql`: Rollback script

**Verification:**
- Chạy migration thành công trên DB test
- Kiểm tra constraints (CHECK, UNIQUE, FK)
- Verify data đã migrate đúng

---

### TASK-I02: Tạo Repository Layer
**Ưu tiên:** P0  
**Ước lượng:** 2.5 ngày  
**Dependencies:** TASK-D01, TASK-I01

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/DAL/` repositories

**Công việc:**
- [ ] `BanQuyenRepository.cs`: GetAll, GetById, GetByTacPham, Insert, Update, UpdateStatus
- [ ] `BangChungRepository.cs`: GetByBanQuyen, Insert, Delete
- [ ] `LichSuSoHuuRepository.cs`: GetByTacPham, GetCurrent, Insert, UpdateStatus, GetByOwner
- [ ] `ChungNhanRepository.cs`: GetByCertificateCode, GetByLichSuSoHuu, Insert, UpdateStatus, Revoke
- [ ] `TranhChapRepository.cs`: GetAll, GetById, GetByBanQuyen, Insert, Update, UpdateStatus
- [ ] `NhatKyRepository.cs`: Insert, GetByFilters
- [ ] `CertificateQueueRepository.cs`: GetPending, Insert, Update, Delete
- [ ] `ThongBaoRepository.cs`: Insert, GetByTaiKhoan, MarkRead, GetUnreadCount

**Lưu ý:**
- Dùng ADO.NET với SqlConnection (không dùng EF Core)
- Tất cả method async
- Proper error handling và logging
- DateTime.UtcNow cho timestamp

**Verification:**
- Unit test với DB in-memory hoặc test DB
- Kiểm tra SQL injection safe
- Test transaction rollback

---

### TASK-I03: File Storage Service
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-D04

**Mô tả:** Tạo service lưu trữ file

**Công việc:**
- [ ] `Services/FileStorageService.cs`:
  - SaveEvidenceFile(file): Lưu với GUID filename
  - GetEvidenceFile(id): Trả file stream
  - DeleteEvidenceFile(id): Xóa file
  - ValidateMimeType(file): Kiểm tra MIME thật
  - GenerateFileName(): GUID + extension
- [ ] Tạo thư mục trong appsettings: EvidencePath, CertificatePdfPath, CertificateQrPath
- [ ] Middleware bảo vệ: Không cho truy cập trực tiếp qua URL

**Verification:**
- Upload file test
- Kiểm tra MIME validation (đổi .jpg thành .exe vẫn bị reject)
- Test delete file

---

## GIAI ĐOẠN 3: APPLICATION / BUSINESS LOGIC (8-10 ngày)

### TASK-A01: Copyright Service
**Ưu tiên:** P0  
**Ước lượng:** 2.5 ngày  
**Dependencies:** TASK-I02

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/CopyrightBusiness.cs`

**Công việc:**
- [ ] `DeclareAsync`: Khai báo bản quyền, validation, ghi audit log
- [ ] `GetDetailAsync`: Chi tiết bản quyền, kiểm tra quyền truy cập
- [ ] `GetListAsync`: Danh sách có phân trang, filter
- [ ] `UpdateAsync`: Cập nhật (chỉ PENDING/NEED_INFO/REJECTED)
- [ ] `VerifyAsync`: Admin xác minh, gửi thông báo
- [ ] `RejectAsync`: Admin từ chối (lý do bắt buộc)
- [ ] `RequestInfoAsync`: Admin yêu cầu bổ sung
- [ ] `UploadEvidenceAsync`: Upload 2-10 file, 5MB/file, MIME check
- [ ] `GetEvidenceFileAsync`: Kiểm tra quyền sở hữu
- [ ] `DeleteEvidenceAsync`: Xóa bằng chứng

**Quy tắc nghiệp vụ:**
- Một TacPham chỉ có một BanQuyen
- Chỉ họa sĩ sở hữu mới được khai báo/sửa
- Mọi thao tác ghi NhatKyHeThong
- Gửi ThongBao khi status thay đổi

**Verification:**
- Unit test cho mỗi method
- Test case: Họa sĩ khác không sửa được bản quyền của họa sĩ A
- Test case: Không upload quá 10 file

---

### TASK-A02: Dispute Service
**Ưu tiên:** P0  
**Ước lượng:** 2 ngày  
**Dependencies:** TASK-I02, TASK-A01

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/DisputeBusiness.cs`

**Công việc:**
- [ ] `ReportAsync`: Tạo khiếu nại (kiểm tra limit 3/tháng), trạng thái OPEN
- [ ] `GetDetailAsync`: Chi tiết tranh chấp, kiểm tra quyền
- [ ] `GetListAsync`: Danh sách tranh chấp (filter theo role)
- [ ] `RespondAsync`: Họa sĩ phản hồi (kiểm tra deadline 7 ngày)
- [ ] `ReviewAsync`: Admin chuyển UNDER_REVIEW, ẩn tác phẩm, chuyển BanQuyen → DISPUTED
- [ ] `DismissAsync`: Admin bác bỏ
- [ ] `ResolveAsync`: Admin giải quyết, cập nhật BanQuyen

**Quy tắc nghiệp vụ:**
- OPEN không ẩn tác phẩm
- Chỉ UNDER_REVIEW mới ẩn
- Họa sĩ phản hồi trong 7 ngày
- Ghi đầy đủ audit log

**Verification:**
- Test case: User vượt quá 3 khiếu nại/tháng
- Test case: Họa sĩ phản hồi sau 7 ngày
- Test case: Ẩn tác phẩm khi UNDER_REVIEW

---

### TASK-A03: Certificate Service
**Ưu tiên:** P0  
**Ước lượng:** 3 ngày  
**Dependencies:** TASK-I02, TASK-I03

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/CertificateBusiness.cs`

**Công việc:**
- [ ] `IssueCertificateAsync`:
  - Kiểm tra BanQuyen.TrangThai = VERIFIED
  - Sinh CertificateCode
  - Tính HMAC-SHA256 hash
  - Sinh QR code (QRCoder library)
  - Tạo PDF (QuestPDF)
  - Nếu lỗi: Ghi vào CertificatePendingQueue
- [ ] `GetDetailAsync`: Chi tiết chứng nhận
- [ ] `GetMyCertificatesAsync`: Danh sách của tôi
- [ ] `VerifyPublicAsync`: Xác minh công khai (che tên)
- [ ] `GetPdfAsync`: Tải PDF
- [ ] `RevokeAsync`: Thu hồi chứng nhận
- [ ] `GetPendingQueueAsync`: Danh sách chứng nhận chưa cấp
- [ ] `RetryIssueAsync`: Thử lại cấp chứng nhận
- [ ] `ManualIssueAsync`: Cấp thủ công

**Dependencies thư viện:**
- `QuestPDF` (PDF generation)
- `QRCoder` (QR code)

**Verification:**
- Test PDF generation
- Test QR code scan
- Test HMAC hash consistency
- Test idempotency (gọi lại không tạo duplicate)

---

### TASK-A04: Ownership Service
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-I02, TASK-A03

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/OwnershipBusiness.cs`

**Công việc:**
- [ ] `CreateInitialOwnershipAsync`: Tạo ownership ban đầu cho họa sĩ (CREATION)
- [ ] `TransferOwnershipOnOrderCompletedAsync`:
  - Hook vào DonHang.TrangThai = 3
  - Cập nhật ownership cũ: TRANSFERRED
  - Tạo ownership mới: CURRENT
  - Gọi IssueCertificateAsync
  - Dùng transaction
- [ ] `ReverseOwnershipOnRefundAsync`:
  - Kiểm tra TrangThai = CURRENT
  - Đảo ngược ownership
  - Revoke certificate hiện tại, khôi phục certificate cũ
- [ ] `GetArtworkHistoryAsync`: Lịch sử sở hữu (kiểm tra quyền)

**Quy tắc nghiệp vụ:**
- Một tác phẩm chỉ có một CURRENT
- Chỉ đảo ngược khi CURRENT
- Dùng transaction cho tất cả thao tác

**Verification:**
- Test transaction rollback khi lỗi
- Test unique constraint CURRENT
- Test reverse khi không phải CURRENT

---

### TASK-A05: Notification Service
**Ưu tiên:** P1  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-I02

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/NotificationBusiness.cs`

**Công việc:**
- [ ] `SendAsync`: Tạo thông báo mới
- [ ] `GetMyNotificationsAsync`: Danh sách thông báo
- [ ] `GetUnreadCountAsync`: Số lượng chưa đọc
- [ ] `MarkAsReadAsync`: Đánh dấu đã đọc
- [ ] `MarkAllAsReadAsync`: Đánh dấu tất cả

**Verification:**
- Test send notification
- Test mark as read

---

### TASK-A06: Audit Log Service
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-I02

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/BLL/AuditLogBusiness.cs`

**Công việc:**
- [ ] `LogAsync`: Ghi nhật ký (lấy IP từ HttpContext)
- [ ] `GetByFiltersAsync`: Lấy nhật ký với filter

**Verification:**
- Test ghi nhật ký
- Test filter nhật ký

---

### TASK-A07: Background Service - Certificate Retry
**Ưu tiên:** P1  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-A03

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/Services/CertificateRetryService.cs`

**Công việc:**
- [ ] BackgroundService kế thừa từ `BackgroundService`
- [ ] `ExecuteAsync`: Chạy mỗi 5 phút
- [ ] Đọc từ CertificatePendingQueue (TrangThai = PENDING AND SoLanThu < 3)
- [ ] Thử cấp certificate
- [ ] Nếu thành công: Xóa/Complete queue
- [ ] Nếu thất bại: Tăng SoLanThu, set LanThuTiepTheo
- [ ] Nếu SoLanThu >= 3: TrangThai = FAILED, gửi thông báo Admin

**Đăng ký:** `builder.Services.AddHostedService<CertificateRetryService>();` trong Program.cs

**Verification:**
- Test retry logic
- Test max retry = 3
- Test notification khi failed

---

## GIAI ĐOẠN 4: API CONTROLLERS (5-6 ngày)

### TASK-API01: Copyright Controller (Artist)
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-A01

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/Controllers/Artist/CopyrightController.cs`

**Công việc:**
- [ ] POST /api/artist/copyright/declare
- [ ] GET /api/artist/copyright/my-copyrights
- [ ] GET /api/artist/copyright/{id}
- [ ] PUT /api/artist/copyright/{id}
- [ ] POST /api/artist/copyright/{id}/upload-evidence (multipart/form-data)
- [ ] GET /api/artist/copyright/evidence/{id}/file
- [ ] DELETE /api/artist/copyright/evidence/{id}

**Authorization:** `[Authorize(Roles = "HoaSi")]`

**Verification:**
- Swagger test
- Postman collection
- Test authorization

---

### TASK-API02: Copyright Controller (Admin)
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-A01

**Mô tả:** Tạo `BTL_BackEnd/BTL_BackEnd/Controllers/Admin/CopyrightController.cs`

**Công việc:**
- [ ] GET /api/admin/copyright
- [ ] GET /api/admin/copyright/{id}
- [ ] POST /api/admin/copyright/{id}/verify
- [ ] POST /api/admin/copyright/{id}/reject
- [ ] POST /api/admin/copyright/{id}/request-info
- [ ] GET /api/admin/copyright/evidence/{id}/file

**Authorization:** `[Authorize(Roles = "Admin")]`

**Verification:**
- Test verify flow
- Test reject flow với lý do bắt buộc

---

### TASK-API03: Dispute Controllers
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-A02

**Mô tả:** Tạo controllers:
- `BTL_BackEnd/BTL_BackEnd/Controllers/DisputeController.cs` (User)
- `BTL_BackEnd/BTL_BackEnd/Controllers/Artist/DisputeController.cs` (Artist)
- `BTL_BackEnd/BTL_BackEnd/Controllers/Admin/DisputeController.cs` (Admin)

**Công việc:**
- [ ] POST /api/dispute/report (User)
- [ ] GET /api/dispute/my-disputes (User)
- [ ] GET /api/artist/dispute/artwork-disputes (Artist)
- [ ] POST /api/artist/dispute/{id}/respond (Artist)
- [ ] GET /api/admin/dispute (Admin)
- [ ] GET /api/admin/dispute/{id} (Admin)
- [ ] POST /api/admin/dispute/{id}/review (Admin)
- [ ] POST /api/admin/dispute/{id}/dismiss (Admin)
- [ ] POST /api/admin/dispute/{id}/resolve (Admin)

**Verification:**
- Test dispute workflow end-to-end
- Test 3 khiếu nại/tháng limit
- Test 7 ngày phản hồi

---

### TASK-API04: Certificate Controllers
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-A03

**Mô tả:** Tạo controllers:
- `BTL_BackEnd/BTL_BackEnd/Controllers/CertificateController.cs` (User)
- `BTL_BackEnd/BTL_BackEnd/Controllers/Public/CertificateController.cs` (Public)
- `BTL_BackEnd/BTL_BackEnd/Controllers/Admin/CertificateController.cs` (Admin)

**Công việc:**
- [ ] GET /api/certificate/my-certificates (User)
- [ ] GET /api/certificate/{code} (User)
- [ ] GET /api/certificate/{code}/pdf (User)
- [ ] GET /api/public/certificate/verify/{code} (Public, rate limit)
- [ ] GET /api/admin/certificate (Admin)
- [ ] POST /api/admin/certificate/{id}/revoke (Admin)
- [ ] GET /api/admin/certificate/pending (Admin)
- [ ] POST /api/admin/certificate/pending/{id}/retry (Admin)
- [ ] POST /api/admin/certificate/pending/{id}/manual-issue (Admin)

**Rate Limiting:**
- Cấu hình ForwardedHeaders trong Program.cs
- Áp dụng rate limit cho verify endpoint

**Verification:**
- Test public verification
- Test rate limit (gọi > 20 requests trong 5 phút)
- Test PDF download

---

### TASK-API05: Other Controllers
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-A04, TASK-A05, TASK-A06

**Mô tả:** Tạo các controllers còn lại:
- `OwnershipController.cs`
- `NotificationController.cs`
- `AuditLogController.cs`

**Công việc:**
- [ ] GET /api/ownership/artwork/{id}/history
- [ ] GET /api/admin/ownership
- [ ] GET /api/notification/my-notifications
- [ ] GET /api/notification/unread-count
- [ ] POST /api/notification/{id}/mark-read
- [ ] POST /api/notification/mark-all-read
- [ ] GET /api/admin/audit-log
- [ ] GET /api/audit-log/my-activities

**Verification:**
- Test ownership history
- Test notification flow

---

## GIAI ĐOẠN 5: TÍCH HỢP VÀO HỆ THỐNG (2-3 ngày)

### TASK-INT01: Hook vào DonHang Service
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-A04

**Mô tả:** Tích hợp vào luồng đơn hàng hiện có

**Công việc:**
- [ ] Tìm nơi cập nhật DonHang.TrangThai = 3
- [ ] Thêm gọi `OwnershipBusiness.TransferOwnershipOnOrderCompletedAsync(donHangId)`
- [ ] Wrap trong try-catch, nếu lỗi: Log error, không rollback đơn hàng
- [ ] Test với đơn hàng có nhiều tác phẩm

**Verification:**
- Tạo đơn hàng test
- Đánh dấu đã giao
- Kiểm tra LichSuSoHuu và ChungNhan được tạo

---

### TASK-INT02: Hook vào TacPham Service
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-A01, TASK-A04

**Mô tả:** Tích hợp vào luồng tạo tác phẩm

**Công việc:**
- [ ] Tìm nơi tạo TacPham mới
- [ ] Sau khi tạo thành công:
  - Tạo BanQuyen với TrangThai = PENDING (nếu là tác phẩm mới sau deploy)
  - Tạo LichSuSoHuu CREATION cho họa sĩ
- [ ] Test với tác phẩm mới

**Verification:**
- Tạo tác phẩm mới
- Kiểm tra BanQuyen PENDING
- Kiểm tra LichSuSoHuu CREATION

---

### TASK-INT03: Điều kiện bán tác phẩm
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-A01

**Mô tả:** Cập nhật logic hiển thị và bán tác phẩm

**Công việc:**
- [ ] Tìm query lấy danh sách tác phẩm
- [ ] Thêm JOIN với BanQuyen
- [ ] Thêm điều kiện WHERE:
  - `TacPham.TrangThai = 1` (Đã duyệt nội dung)
  - `BanQuyen.TrangThai IN (2, 5)` (VERIFIED hoặc LEGACY)
- [ ] API trả về thêm field: `BanQuyenTrangThai`, `IsLegacy`
- [ ] Test với tác phẩm PENDING (không hiển thị)
- [ ] Test với tác phẩm DISPUTED (không hiển thị)
- [ ] Test với tác phẩm LEGACY (hiển thị + badge)

**Verification:**
- Tác phẩm PENDING không xuất hiện trong danh sách
- Tác phẩm DISPUTED không mua được

---

### TASK-INT04: Cấu hình appsettings
**Ưu tiên:** P0  
**Ước lượng:** 0.5 ngày  
**Dependencies:** Không

**Mô tả:** Cấu hình trong `appsettings.json`

**Công việc:**
- [ ] Thêm section "Copyright" với:
  - BaseUrl
  - CertificateHashKey (generate secure key)
  - EvidencePath, CertificatePdfPath, CertificateQrPath
  - MaxEvidenceFileSize, MinEvidenceFiles, MaxEvidenceFiles
  - AllowedEvidenceMimeTypes
  - DisputeLimitPerMonth, DisputeResponseDays
  - CertificateRetryIntervalMinutes, CertificateMaxRetries
- [ ] Thêm section "RateLimiting"
- [ ] Tạo thư mục lưu file trên server

**Verification:**
- Config load thành công
- Thư mục đã tạo

---

## GIAI ĐOẠN 6: FRONTEND (8-10 ngày)

### TASK-FE01: Admin - Quản lý bản quyền
**Ưu tiên:** P0  
**Ước lượng:** 2 ngày  
**Dependencies:** TASK-API02

**Mô tả:** Tạo trang `/admin/copyright`

**Công việc:**
- [ ] Danh sách bản quyền (table, filter, search, phân trang)
- [ ] Chi tiết bản quyền (modal hoặc trang riêng)
- [ ] Xem bằng chứng (image viewer, PDF viewer)
- [ ] Nút Xác minh, Từ chối, Yêu cầu bổ sung
- [ ] Form nhập lý do (khi reject/request-info)

**UI Components:**
- Table component
- Filter dropdown (PENDING, NEED_INFO, VERIFIED, etc.)
- Modal xác nhận
- Image carousel cho bằng chứng

**Verification:**
- Xác minh bản quyền thành công
- Từ chối với lý do bắt buộc
- Hiển thị đầy đủ bằng chứng

---

### TASK-FE02: Admin - Quản lý tranh chấp
**Ưu tiên:** P0  
**Ước lượng:** 2 ngày  
**Dependencies:** TASK-API03

**Mô tả:** Tạo trang `/admin/copyright/disputes`

**Công việc:**
- [ ] Danh sách tranh chấp (filter OPEN, UNDER_REVIEW, RESOLVED, DISMISSED)
- [ ] Chi tiết tranh chấp (khiếu nại, phản hồi họa sĩ, bằng chứng)
- [ ] Lọc sơ bộ: OPEN → UNDER_REVIEW hoặc DISMISSED
- [ ] Giải quyết: UNDER_REVIEW → RESOLVED (Hợp lệ/Không hợp lệ)
- [ ] Form nhập kết quả

**Verification:**
- Chuyển OPEN → UNDER_REVIEW → ẩn tác phẩm
- Chuyển UNDER_REVIEW → RESOLVED → mở lại tác phẩm

---

### TASK-FE03: Admin - Chứng nhận chưa cấp
**Ưu tiên:** P1  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-API04

**Mô tả:** Tạo trang `/admin/certificates/pending`

**Công việc:**
- [ ] Danh sách chứng nhận chưa cấp (từ CertificatePendingQueue)
- [ ] Hiển thị: Tác phẩm, Chủ sở hữu, Số lần thử, Lỗi
- [ ] Nút "Thử lại" và "Cấp thủ công"
- [ ] Refresh tự động (hoặc nút refresh)

**Verification:**
- Hiển thị chứng nhận failed
- Thử lại thành công

---

### TASK-FE04: Admin - Quản lý chứng nhận & Nhật ký
**Ưu tiên:** P1  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-API04, TASK-API05

**Mô tả:** Tạo các trang:
- `/admin/certificates`: Danh sách chứng nhận
- `/admin/copyright/audit-logs`: Nhật ký hệ thống

**Công việc:**
- [ ] Trang Quản lý chứng nhận:
  - Danh sách, filter, search theo CertificateCode
  - Nút Thu hồi chứng nhận
  - Form nhập lý do thu hồi
- [ ] Trang Nhật ký:
  - Danh sách với filter: Đối tượng, Hành động, Người thực hiện, Thời gian
  - Export CSV (tùy chọn)

**Verification:**
- Thu hồi chứng nhận thành công
- Xem nhật ký theo filter

---

### TASK-FE05: Họa sĩ - Quản lý bản quyền
**Ưu tiên:** P0  
**Ước lượng:** 2 ngày  
**Dependencies:** TASK-API01

**Mô tả:** Tạo trang `/artist/copyright`

**Công việc:**
- [ ] Danh sách bản quyền của tôi (filter theo trạng thái)
- [ ] Form khai báo bản quyền (cho tác phẩm chưa có)
- [ ] Upload bằng chứng (drag & drop, 2-10 files)
- [ ] Sửa bản quyền (chỉ khi PENDING, NEED_INFO, REJECTED)
- [ ] Xem lý do từ chối/yêu cầu bổ sung
- [ ] Chuyển LEGACY → PENDING (nút tự nguyện xác minh)

**UI Components:**
- File uploader (drag & drop)
- Form validation
- Badge trạng thái

**Verification:**
- Khai báo bản quyền mới
- Upload bằng chứng (min 2, max 10)
- Sửa khi PENDING

---

### TASK-FE06: Họa sĩ - Phản hồi tranh chấp
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-API03

**Mô tả:** Tạo trang `/artist/disputes`

**Công việc:**
- [ ] Danh sách tranh chấp liên quan tác phẩm của tôi
- [ ] Chi tiết tranh chấp (lý do khiếu nại, bằng chứng)
- [ ] Form phản hồi (trong 7 ngày)
- [ ] Upload bằng chứng phản hồi
- [ ] Hiển thị countdown "Còn X ngày để phản hồi"

**Verification:**
- Phản hồi trong 7 ngày
- Phản hồi sau 7 ngày (warning)

---

### TASK-FE07: User - Xem chứng nhận & Khiếu nại
**Ưu tiên:** P0  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-API03, TASK-API04

**Mô tả:** Tạo các trang:
- `/my-certificates`: Danh sách chứng nhận của tôi
- `/certificate/{code}`: Chi tiết chứng nhận
- `/dispute/report`: Báo cáo vi phạm bản quyền

**Công việc:**
- [ ] Danh sách chứng nhận (trong "Đơn hàng của tôi")
- [ ] Chi tiết chứng nhận (hiển thị đầy đủ thông tin, QR code)
- [ ] Nút "Tải PDF"
- [ ] Form báo cáo vi phạm:
  - Chọn tác phẩm
  - Nhập lý do
  - Upload bằng chứng (tùy chọn)
  - Thông tin liên hệ
- [ ] Danh sách khiếu nại của tôi

**Verification:**
- Tải PDF chứng nhận
- Gửi khiếu nại (max 3/tháng)

---

### TASK-FE08: Public - Xác minh chứng nhận
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-API04

**Mô tả:** Tạo trang `/verify/certificate/{code}`

**Công việc:**
- [ ] Trang xác minh công khai (không cần đăng nhập)
- [ ] Nhập mã chứng nhận hoặc quét QR
- [ ] Hiển thị kết quả:
  - ✅ Hợp lệ: Thông tin tác phẩm, tác giả, chủ sở hữu (che tên), ngày cấp
  - ⚠️ Đã thay thế: Thông báo
  - ❌ Đã thu hồi: Ngày thu hồi (không hiển thị lý do chi tiết)
  - ❌ Không tìm thấy
- [ ] Responsive (hiển thị tốt trên mobile)

**Verification:**
- Quét QR code từ PDF
- Verify chứng nhận ACTIVE
- Verify chứng nhận REVOKED

---

### TASK-FE09: Thông báo trong ứng dụng
**Ưu tiên:** P1  
**Ước lượng:** 1 ngày  
**Dependencies:** TASK-API05

**Mô tả:** Tích hợp thông báo vào header

**Công việc:**
- [ ] Icon thông báo với badge số lượng chưa đọc
- [ ] Dropdown danh sách thông báo
- [ ] Đánh dấu đã đọc
- [ ] Link đến trang chi tiết
- [ ] Trang `/notifications`: Danh sách đầy đủ

**Verification:**
- Badge hiển thị số lượng đúng
- Click thông báo → chuyển trang
- Đánh dấu đã đọc

---

### TASK-FE10: Badge LEGACY trên trang tác phẩm
**Ưu tiên:** P0  
**Ước lượng:** 0.5 ngày  
**Dependencies:** TASK-INT03

**Mô tả:** Hiển thị badge cho tác phẩm LEGACY

**Công việc:**
- [ ] Thêm badge "Dữ liệu cũ - chưa xác minh bản quyền" trên trang chi tiết tác phẩm
- [ ] Tooltip giải thích
- [ ] Thông báo trong giỏ hàng: "Tác phẩm này không có chứng nhận bản quyền"
- [ ] Thông báo trong lịch sử đơn hàng: "Chứng nhận không khả dụng (tác phẩm chưa xác minh)"

**Verification:**
- Badge hiển thị cho tác phẩm LEGACY
- Không hiển thị cho tác phẩm VERIFIED

---

## GIAI ĐOẠN 7: TESTING & QA (4-5 ngày)

### TASK-T01: Unit Tests
**Ưu tiên:** P1  
**Ước lượng:** 2 ngày  
**Dependencies:** Tất cả tasks Application

**Mô tả:** Viết unit tests

**Công việc:**
- [ ] Helper classes: 100% coverage
- [ ] Services: Core business logic tests
- [ ] Repository: Mock DB tests
- [ ] Controllers: Mock service tests

**Framework:** xUnit hoặc NUnit

**Verification:**
- Test coverage >= 70%

---

### TASK-T02: Integration Tests
**Ưu tiên:** P1  
**Ước lượng:** 1.5 ngày  
**Dependencies:** TASK-API01, TASK-API02, TASK-API03, TASK-API04

**Mô tả:** Viết integration tests

**Công việc:**
- [ ] Test end-to-end workflows:
  - Họa sĩ khai báo → Admin xác minh → Người dùng mua → Cấp chứng nhận
  - User khiếu nại → Admin xem xét → Họa sĩ phản hồi → Admin giải quyết
  - Đơn hàng hoàn tất → Transfer ownership → Issue certificate
- [ ] Test với test database

**Verification:**
- Tất cả workflows chạy thành công

---

### TASK-T03: E2E Tests (Frontend)
**Ưu tiên:** P2 (Tùy chọn)  
**Ước lượng:** 1.5 ngày  
**Dependencies:** Tất cả tasks Frontend

**Mô tả:** Viết E2E tests cho UI

**Framework:** Playwright hoặc Cypress

**Công việc:**
- [ ] Admin verify copyright flow
- [ ] Artist declare copyright flow
- [ ] User purchase and certificate flow
- [ ] Dispute flow

**Verification:**
- Smoke tests pass

---

## GIAI ĐOẠN 8: DOCUMENTATION & DEPLOYMENT (2 ngày)

### TASK-DOC01: API Documentation
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** Tất cả tasks API

**Mô tả:** Hoàn thiện API documentation

**Công việc:**
- [ ] Swagger annotations đầy đủ
- [ ] Postman collection
- [ ] API examples
- [ ] Error codes documentation

---

### TASK-DOC02: User Guide
**Ưu tiên:** P1  
**Ước lượng:** 0.5 ngày  
**Dependencies:** Tất cả tasks Frontend

**Mô tả:** Viết hướng dẫn sử dụng

**Công việc:**
- [ ] Hướng dẫn họa sĩ khai báo bản quyền
- [ ] Hướng dẫn Admin xác minh
- [ ] Hướng dẫn xem chứng nhận
- [ ] FAQ

---

### TASK-DEP01: Deployment Checklist
**Ưu tiên:** P0  
**Ước lượng:** 1 ngày  
**Dependencies:** Tất cả tasks

**Mô tả:** Chuẩn bị deploy

**Công việc:**
- [ ] Backup database
- [ ] Chạy migration scripts
- [ ] Tạo thư mục lưu file trên server
- [ ] Cấu hình appsettings.Production.json
- [ ] Generate CertificateHashKey production
- [ ] Test migration với dữ liệu production
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Smoke test production
- [ ] Monitor logs 24h đầu

**Rollback Plan:**
- [ ] Backup trước khi deploy
- [ ] Rollback script SQL
- [ ] Rollback code

---

## TỔNG KẾT

**Tổng số tasks:** 49 tasks  
**Ước lượng tổng:** 40-50 ngày làm việc  
**Team size khuyến nghị:** 2 developers + 1 tester

**Thứ tự ưu tiên:**
1. **P0 (Critical):** 35 tasks - Bắt buộc cho MVP
2. **P1 (High):** 12 tasks - Quan trọng nhưng có thể delay
3. **P2 (Medium):** 2 tasks - Tùy chọn

**Dependencies Diagram (Simplified):**
```
Domain Models (D01-D04)
    ↓
Infrastructure (I01-I03)
    ↓
Application Logic (A01-A07) ← có thể song song
    ↓
API Controllers (API01-API05) ← có thể song song
    ↓
Integration (INT01-INT04)
    ↓
Frontend (FE01-FE10) ← có thể song song
    ↓
Testing (T01-T03)
    ↓
Documentation & Deployment (DOC01-DEP01)
```

**Rủi ro và Mitigation:**
1. **Rủi ro:** Migration dữ liệu cũ phức tạp
   - **Mitigation:** Test với backup database, có rollback script
2. **Rủi ro:** HMAC key bị lộ
   - **Mitigation:** Lưu trong environment variable, không commit vào git
3. **Rủi ro:** Performance khi tạo PDF/QR
   - **Mitigation:** Background service + queue, không block đơn hàng
4. **Rủi ro:** Unique constraint violation (CURRENT)
   - **Mitigation:** Transaction + proper error handling

---

**Kết thúc tasks.md**
