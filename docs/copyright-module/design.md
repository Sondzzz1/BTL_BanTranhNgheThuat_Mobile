# THIẾT KẾ KỸ THUẬT - MODULE QUẢN LÝ BẢN QUYỀN

**Phiên bản:** 1.0  
**Ngày tạo:** 2026-09-28  
**Dự án:** Hệ thống bán tranh nghệ thuật trực tuyến

---

## MỤC LỤC
1. [Database Schema](#1-database-schema)
2. [ERD Dạng Chữ](#2-erd-dạng-chữ)
3. [API Endpoints](#3-api-endpoints)
4. [DTO Definitions](#4-dto-definitions)
5. [Business Logic](#5-business-logic)
6. [Background Services](#6-background-services)
7. [Cấu hình](#7-cấu-hình)
8. [Migration Scripts](#8-migration-scripts)
9. [Template PDF](#9-template-pdf)
10. [Ma trận phân quyền chi tiết](#10-ma-trận-phân-quyền-chi-tiết)

---

## 1. DATABASE SCHEMA

### 1.1. Bảng BanQuyen (Copyright)
```sql
CREATE TABLE BanQuyen (
    MaBanQuyen INT PRIMARY KEY IDENTITY(1,1),
    MaTacPham INT NOT NULL,
    MaTacGia INT NOT NULL, -- MaHoaSi
    MaNguoiGiuQuyen INT NOT NULL, -- MaHoaSi (người nắm giữ quyền khai thác)
    TrangThai TINYINT NOT NULL DEFAULT 0, -- 0=PENDING, 1=NEED_INFO, 2=VERIFIED, 3=REJECTED, 4=DISPUTED, 5=LEGACY
    NgaySangTac DATE NULL,
    MoTa NVARCHAR(2000) NULL,
    SoDangKy NVARCHAR(100) NULL, -- Số đăng ký bản quyền tại cơ quan nhà nước (nếu có)
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NguoiTao INT NULL, -- MaTaiKhoan
    NguoiCapNhat INT NULL, -- MaTaiKhoan
    LyDo NVARCHAR(500) NULL, -- Lý do từ chối hoặc yêu cầu bổ sung
    
    CONSTRAINT FK_BanQuyen_TacPham FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham),
    CONSTRAINT FK_BanQuyen_TacGia FOREIGN KEY (MaTacGia) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_BanQuyen_NguoiGiuQuyen FOREIGN KEY (MaNguoiGiuQuyen) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT UQ_BanQuyen_TacPham UNIQUE (MaTacPham) -- Một tác phẩm chỉ có một bản quyền
);

CREATE INDEX IX_BanQuyen_TrangThai ON BanQuyen(TrangThai);
CREATE INDEX IX_BanQuyen_TacGia ON BanQuyen(MaTacGia);
```

### 1.2. Bảng BangChungBanQuyen (Copyright Evidence)
```sql
CREATE TABLE BangChungBanQuyen (
    MaBangChung INT PRIMARY KEY IDENTITY(1,1),
    MaBanQuyen INT NOT NULL,
    TenTepGoc NVARCHAR(255) NOT NULL, -- Tên gốc do user upload
    TenTepLuu NVARCHAR(255) NOT NULL, -- GUID.ext (tên file trên server)
    DuongDan NVARCHAR(500) NOT NULL, -- Relative path: /uploads/copyright-evidence/GUID.ext
    LoaiTep NVARCHAR(50) NOT NULL, -- MIME type: image/jpeg, image/png, application/pdf
    KichThuoc BIGINT NOT NULL, -- Bytes
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NguoiTao INT NULL, -- MaTaiKhoan
    
    CONSTRAINT FK_BangChung_BanQuyen FOREIGN KEY (MaBanQuyen) REFERENCES BanQuyen(MaBanQuyen) ON DELETE CASCADE,
    CONSTRAINT CK_BangChung_KichThuoc CHECK (KichThuoc <= 5242880) -- 5MB
);

CREATE INDEX IX_BangChung_BanQuyen ON BangChungBanQuyen(MaBanQuyen);
```

### 1.3. Bảng LichSuSoHuu (Ownership History)
```sql
CREATE TABLE LichSuSoHuu (
    MaLichSuSoHuu INT PRIMARY KEY IDENTITY(1,1),
    MaTacPham INT NOT NULL,
    MaNguoiDung INT NULL, -- Người dùng (khách hàng)
    MaHoaSi INT NULL, -- Họa sĩ (tác giả)
    NgayNhan DATETIME NOT NULL, -- Ngày nhận sở hữu
    NgayChuyenGiao DATETIME NULL, -- Ngày chuyển giao cho người khác
    LoaiChuyenGiao TINYINT NOT NULL, -- 0=CREATION, 1=SALE, 2=RESALE (giai đoạn sau)
    TrangThai TINYINT NOT NULL, -- 1=CURRENT, 2=TRANSFERRED, 3=REVERSED
    MaDonHang INT NULL, -- Nếu có giao dịch
    GhiChu NVARCHAR(500) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    -- CHECK constraint: đúng một trong hai cột phải NOT NULL
    CONSTRAINT CK_LichSuSoHuu_Owner CHECK (
        (MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR 
        (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL)
    ),
    
    -- Foreign keys
    CONSTRAINT FK_LichSuSoHuu_TacPham FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham),
    CONSTRAINT FK_LichSuSoHuu_NguoiDung FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT FK_LichSuSoHuu_HoaSi FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_LichSuSoHuu_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    
    -- Unique constraint: một tác phẩm chỉ có một CURRENT
    CONSTRAINT UQ_LichSuSoHuu_Current UNIQUE (MaTacPham) WHERE TrangThai = 1
);

CREATE INDEX IX_LichSuSoHuu_TacPham ON LichSuSoHuu(MaTacPham);
CREATE INDEX IX_LichSuSoHuu_NguoiDung ON LichSuSoHuu(MaNguoiDung);
CREATE INDEX IX_LichSuSoHuu_HoaSi ON LichSuSoHuu(MaHoaSi);
CREATE INDEX IX_LichSuSoHuu_DonHang ON LichSuSoHuu(MaDonHang);
```

### 1.4. Bảng ChungNhan (Certificate)
```sql
CREATE TABLE ChungNhan (
    MaChungNhan INT PRIMARY KEY IDENTITY(1,1),
    MaLichSuSoHuu INT NOT NULL,
    CertificateCode NVARCHAR(50) NOT NULL UNIQUE, -- COA-2026-A3F8K9P2X7N5
    ContentHash NVARCHAR(128) NOT NULL, -- HMAC-SHA256 hash
    NgayCap DATETIME NOT NULL,
    TrangThai TINYINT NOT NULL, -- 1=ACTIVE, 2=SUPERSEDED, 3=REVOKED, 4=EXPIRED
    NguoiCap NVARCHAR(100) NULL, -- "Hệ thống tự động" hoặc tên Admin
    NgayThuHoi DATETIME NULL,
    LyDoThuHoi NVARCHAR(500) NULL,
    DuongDanPDF NVARCHAR(500) NULL, -- /certificates/COA-2026-XXXX.pdf
    DuongDanQR NVARCHAR(500) NULL, -- /qrcodes/COA-2026-XXXX.png
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_ChungNhan_LichSuSoHuu FOREIGN KEY (MaLichSuSoHuu) REFERENCES LichSuSoHuu(MaLichSuSoHuu),
    -- Một LichSuSoHuu chỉ có một Certificate ACTIVE
    CONSTRAINT UQ_ChungNhan_LichSuSoHuu_Active UNIQUE (MaLichSuSoHuu) WHERE TrangThai = 1
);

CREATE INDEX IX_ChungNhan_CertificateCode ON ChungNhan(CertificateCode);
CREATE INDEX IX_ChungNhan_LichSuSoHuu ON ChungNhan(MaLichSuSoHuu);
CREATE INDEX IX_ChungNhan_TrangThai ON ChungNhan(TrangThai);
```

### 1.5. Bảng TranhChapBanQuyen (Copyright Dispute)
```sql
CREATE TABLE TranhChapBanQuyen (
    MaTraanhChap INT PRIMARY KEY IDENTITY(1,1),
    MaBanQuyen INT NOT NULL,
    MaNguoiKhieuNai INT NOT NULL, -- MaTaiKhoan
    TenNguoiKhieuNai NVARCHAR(200) NOT NULL,
    EmailLienHe NVARCHAR(200) NOT NULL,
    DienThoaiLienHe NVARCHAR(20) NULL,
    LyDoKhieuNai NVARCHAR(2000) NOT NULL,
    BangChungKhieuNai NVARCHAR(MAX) NULL, -- JSON array các đường dẫn file
    TrangThai TINYINT NOT NULL DEFAULT 0, -- 0=OPEN, 1=UNDER_REVIEW, 2=RESOLVED, 3=DISMISSED
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NULL,
    
    -- Phản hồi từ họa sĩ
    PhanHoiHoaSi NVARCHAR(2000) NULL,
    BangChungPhanHoi NVARCHAR(MAX) NULL, -- JSON array
    NgayPhanHoi DATETIME NULL,
    
    -- Quyết định của Admin
    NguoiXuLy INT NULL, -- MaTaiKhoan (Admin)
    KetQua NVARCHAR(2000) NULL,
    NgayGiaiQuyet DATETIME NULL,
    
    CONSTRAINT FK_TraanhChap_BanQuyen FOREIGN KEY (MaBanQuyen) REFERENCES BanQuyen(MaBanQuyen)
);

CREATE INDEX IX_TraanhChap_BanQuyen ON TranhChapBanQuyen(MaBanQuyen);
CREATE INDEX IX_TraanhChap_NguoiKhieuNai ON TranhChapBanQuyen(MaNguoiKhieuNai);
CREATE INDEX IX_TraanhChap_TrangThai ON TranhChapBanQuyen(TrangThai);
```

### 1.6. Bảng NhatKyHeThong (Audit Log)
```sql
CREATE TABLE NhatKyHeThong (
    MaNhatKy BIGINT PRIMARY KEY IDENTITY(1,1),
    TenDoiTuong NVARCHAR(100) NOT NULL, -- "BanQuyen", "ChungNhan", "LichSuSoHuu", "TranhChapBanQuyen"
    MaDoiTuong INT NOT NULL, -- ID của đối tượng
    HanhDong NVARCHAR(100) NOT NULL, -- "Tao", "Sua", "XacMinh", "TuChoi", "ThuHoi", etc.
    GiaTriTruoc NVARCHAR(MAX) NULL, -- JSON
    GiaTriSau NVARCHAR(MAX) NULL, -- JSON
    NguoiThucHien INT NULL, -- MaTaiKhoan
    VaiTro TINYINT NULL, -- 0=Admin, 1=NguoiDung, 2=HoaSi
    ThoiGian DATETIME NOT NULL DEFAULT GETUTCDATE(),
    DiaChiIP NVARCHAR(50) NULL,
    LyDo NVARCHAR(500) NULL,
    ThongTinBoSung NVARCHAR(MAX) NULL -- JSON cho thông tin thêm
);

CREATE INDEX IX_NhatKy_TenDoiTuong ON NhatKyHeThong(TenDoiTuong);
CREATE INDEX IX_NhatKy_MaDoiTuong ON NhatKyHeThong(MaDoiTuong);
CREATE INDEX IX_NhatKy_NguoiThucHien ON NhatKyHeThong(NguoiThucHien);
CREATE INDEX IX_NhatKy_ThoiGian ON NhatKyHeThong(ThoiGian);
```

### 1.7. Bảng CertificatePendingQueue (Hàng đợi cấp chứng nhận)
```sql
CREATE TABLE CertificatePendingQueue (
    MaQueue INT PRIMARY KEY IDENTITY(1,1),
    MaLichSuSoHuu INT NOT NULL,
    SoLanThu INT NOT NULL DEFAULT 1,
    TrangThai TINYINT NOT NULL DEFAULT 0, -- 0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED
    ThongDiepLoi NVARCHAR(1000) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NULL,
    LanThuTiepTheo DATETIME NOT NULL, -- Thời điểm thử lại
    
    CONSTRAINT FK_Queue_LichSuSoHuu FOREIGN KEY (MaLichSuSoHuu) REFERENCES LichSuSoHuu(MaLichSuSoHuu)
);

CREATE INDEX IX_Queue_TrangThai ON CertificatePendingQueue(TrangThai);
CREATE INDEX IX_Queue_LanThuTiepTheo ON CertificatePendingQueue(LanThuTiepTheo);
```

### 1.8. Bảng ThongBao (In-App Notification)
```sql
CREATE TABLE ThongBao (
    MaThongBao INT PRIMARY KEY IDENTITY(1,1),
    MaTaiKhoan INT NOT NULL,
    LoaiThongBao NVARCHAR(50) NOT NULL, -- "BanQuyen", "TraanhChap", "ChungNhan", "HoanTien"
    TieuDe NVARCHAR(200) NOT NULL,
    NoiDung NVARCHAR(1000) NOT NULL,
    Url NVARCHAR(500) NULL, -- Link đến trang chi tiết
    DaDoc BIT NOT NULL DEFAULT 0,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayDoc DATETIME NULL
);

CREATE INDEX IX_ThongBao_TaiKhoan ON ThongBao(MaTaiKhoan);
CREATE INDEX IX_ThongBao_DaDoc ON ThongBao(DaDoc);
CREATE INDEX IX_ThongBao_NgayTao ON ThongBao(NgayTao);
```

---

## 2. ERD DẠNG CHỮ

```
TacPham (1) ----< (1) BanQuyen
                       |
                       +----< (*) BangChungBanQuyen
                       |
                       +----< (*) TranhChapBanQuyen

TacPham (1) ----< (*) LichSuSoHuu
                       |
                       +---- (0..1) ChungNhan

LichSuSoHuu (*) ----< (1) NguoiDung (nullable)
LichSuSoHuu (*) ----< (1) HoaSi (nullable)
LichSuSoHuu (*) ----< (0..1) DonHang

LichSuSoHuu (1) ----< (0..1) CertificatePendingQueue

TaiKhoan (1) ----< (*) NhatKyHeThong
TaiKhoan (1) ----< (*) ThongBao
```

**Quan hệ chính:**
- `TacPham` ↔ `BanQuyen`: 1-1 (một tác phẩm một bản quyền)
- `BanQuyen` ↔ `BangChungBanQuyen`: 1-N (một bản quyền nhiều bằng chứng, 2-10 file)
- `TacPham` ↔ `LichSuSoHuu`: 1-N (một tác phẩm nhiều lịch sử sở hữu)
- `LichSuSoHuu` ↔ `ChungNhan`: 1-0..1 (một ownership có tối đa một chứng nhận ACTIVE)
- `LichSuSoHuu` ↔ `NguoiDung` / `HoaSi`: N-1 (nullable, CHECK constraint)

---

## 3. API ENDPOINTS

### 3.1. Copyright Management (Quản lý bản quyền)

#### 3.1.1. Họa sĩ
```
POST   /api/artist/copyright/declare
       Body: DeclareCopyrightRequest
       Returns: BanQuyenResponse
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Khai báo bản quyền cho tác phẩm

GET    /api/artist/copyright/my-copyrights
       Query: ?trangThai={int}&page={int}&pageSize={int}
       Returns: PagedResult<BanQuyenResponse>
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Danh sách bản quyền của tôi

GET    /api/artist/copyright/{id}
       Returns: BanQuyenDetailResponse
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Chi tiết bản quyền (chỉ của mình)

PUT    /api/artist/copyright/{id}
       Body: UpdateCopyrightRequest
       Returns: BanQuyenResponse
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Cập nhật bản quyền (chỉ khi PENDING, NEED_INFO, REJECTED)

POST   /api/artist/copyright/{id}/upload-evidence
       Form: multipart/form-data (files[])
       Returns: UploadEvidenceResponse
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Upload bằng chứng (2-10 files, 5MB/file)

GET    /api/artist/copyright/evidence/{id}/file
       Returns: FileStreamResult
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Tải file bằng chứng (chỉ của mình)

DELETE /api/artist/copyright/evidence/{id}
       Returns: NoContent
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Xóa bằng chứng (chỉ khi PENDING, NEED_INFO)
```

#### 3.1.2. Admin
```
GET    /api/admin/copyright
       Query: ?trangThai={int}&page={int}&pageSize={int}&search={string}
       Returns: PagedResult<BanQuyenResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Danh sách tất cả bản quyền

GET    /api/admin/copyright/{id}
       Returns: BanQuyenDetailResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Chi tiết bản quyền

POST   /api/admin/copyright/{id}/verify
       Body: VerifyCopyrightRequest
       Returns: BanQuyenResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Xác minh bản quyền (PENDING → VERIFIED)

POST   /api/admin/copyright/{id}/reject
       Body: RejectCopyrightRequest (lý do bắt buộc)
       Returns: BanQuyenResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Từ chối bản quyền (PENDING → REJECTED)

POST   /api/admin/copyright/{id}/request-info
       Body: RequestInfoRequest (lý do bắt buộc)
       Returns: BanQuyenResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Yêu cầu bổ sung thông tin (PENDING → NEED_INFO)

GET    /api/admin/copyright/evidence/{id}/file
       Returns: FileStreamResult
       Auth: [Authorize(Roles = "Admin")]
       Desc: Tải file bằng chứng (admin xem tất cả)
```

### 3.2. Dispute Management (Quản lý tranh chấp)

```
POST   /api/dispute/report
       Body: ReportDisputeRequest
       Returns: TraanhChapResponse
       Auth: [Authorize]
       Desc: Gửi khiếu nại vi phạm bản quyền (tối đa 3/tháng)

GET    /api/dispute/my-disputes
       Query: ?page={int}&pageSize={int}
       Returns: PagedResult<TraanhChapResponse>
       Auth: [Authorize]
       Desc: Danh sách khiếu nại của tôi

GET    /api/artist/dispute/artwork-disputes
       Query: ?page={int}&pageSize={int}
       Returns: PagedResult<TraanhChapResponse>
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Tranh chấp liên quan tác phẩm của tôi

POST   /api/artist/dispute/{id}/respond
       Body: RespondDisputeRequest
       Returns: TraanhChapResponse
       Auth: [Authorize(Roles = "HoaSi")]
       Desc: Phản hồi tranh chấp (trong 7 ngày)

GET    /api/admin/dispute
       Query: ?trangThai={int}&page={int}&pageSize={int}
       Returns: PagedResult<TraanhChapResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Danh sách tất cả tranh chấp

GET    /api/admin/dispute/{id}
       Returns: TraanhChapDetailResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Chi tiết tranh chấp

POST   /api/admin/dispute/{id}/review
       Body: ReviewDisputeRequest
       Returns: TraanhChapResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Chuyển sang xem xét (OPEN → UNDER_REVIEW, ẩn tác phẩm)

POST   /api/admin/dispute/{id}/dismiss
       Body: DismissDisputeRequest (lý do)
       Returns: TraanhChapResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Bác bỏ khiếu nại (OPEN/UNDER_REVIEW → DISMISSED)

POST   /api/admin/dispute/{id}/resolve
       Body: ResolveDisputeRequest (kết quả, lý do)
       Returns: TraanhChapResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Giải quyết tranh chấp (UNDER_REVIEW → RESOLVED)
```

### 3.3. Certificate Management (Quản lý chứng nhận)

```
GET    /api/certificate/my-certificates
       Query: ?page={int}&pageSize={int}
       Returns: PagedResult<ChungNhanResponse>
       Auth: [Authorize]
       Desc: Danh sách chứng nhận của tôi

GET    /api/certificate/{certificateCode}
       Returns: ChungNhanDetailResponse
       Auth: [Authorize]
       Desc: Chi tiết chứng nhận (chỉ của mình hoặc admin)

GET    /api/certificate/{certificateCode}/pdf
       Returns: FileStreamResult (application/pdf)
       Auth: [Authorize]
       Desc: Tải PDF chứng nhận

GET    /api/public/certificate/verify/{certificateCode}
       Returns: PublicCertificateVerificationResponse
       Auth: [AllowAnonymous]
       RateLimit: 20 requests / 5 minutes / IP
       Desc: Xác minh công khai chứng nhận

GET    /api/admin/certificate
       Query: ?trangThai={int}&page={int}&pageSize={int}&search={string}
       Returns: PagedResult<ChungNhanResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Danh sách tất cả chứng nhận

POST   /api/admin/certificate/{id}/revoke
       Body: RevokeCertificateRequest (lý do bắt buộc)
       Returns: ChungNhanResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Thu hồi chứng nhận

GET    /api/admin/certificate/pending
       Query: ?page={int}&pageSize={int}
       Returns: PagedResult<CertificatePendingResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Danh sách chứng nhận chưa cấp được

POST   /api/admin/certificate/pending/{id}/retry
       Returns: NoContent
       Auth: [Authorize(Roles = "Admin")]
       Desc: Thử lại cấp chứng nhận

POST   /api/admin/certificate/pending/{id}/manual-issue
       Returns: ChungNhanResponse
       Auth: [Authorize(Roles = "Admin")]
       Desc: Cấp chứng nhận thủ công
```

### 3.4. Ownership History (Lịch sử sở hữu)

```
GET    /api/ownership/artwork/{tacPhamId}/history
       Returns: List<LichSuSoHuuResponse>
       Auth: [Authorize]
       Desc: Lịch sử sở hữu tác phẩm (họa sĩ xem của mình, người mua xem tác phẩm đã mua, admin xem tất cả)

GET    /api/admin/ownership
       Query: ?page={int}&pageSize={int}&tacPhamId={int}
       Returns: PagedResult<LichSuSoHuuResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Danh sách toàn bộ lịch sử sở hữu
```

### 3.5. Audit Log (Nhật ký)

```
GET    /api/admin/audit-log
       Query: ?tenDoiTuong={string}&maDoiTuong={int}&hanhDong={string}&nguoiThucHien={int}&tuNgay={date}&denNgay={date}&page={int}&pageSize={int}
       Returns: PagedResult<NhatKyResponse>
       Auth: [Authorize(Roles = "Admin")]
       Desc: Xem nhật ký hệ thống

GET    /api/audit-log/my-activities
       Query: ?page={int}&pageSize={int}
       Returns: PagedResult<NhatKyResponse>
       Auth: [Authorize]
       Desc: Xem nhật ký liên quan đến mình
```

### 3.6. Notification (Thông báo)

```
GET    /api/notification/my-notifications
       Query: ?daDoc={bool}&page={int}&pageSize={int}
       Returns: PagedResult<ThongBaoResponse>
       Auth: [Authorize]
       Desc: Danh sách thông báo của tôi

GET    /api/notification/unread-count
       Returns: { count: int }
       Auth: [Authorize]
       Desc: Số thông báo chưa đọc

POST   /api/notification/{id}/mark-read
       Returns: NoContent
       Auth: [Authorize]
       Desc: Đánh dấu đã đọc

POST   /api/notification/mark-all-read
       Returns: NoContent
       Auth: [Authorize]
       Desc: Đánh dấu tất cả đã đọc
```

---

## 4. DTO DEFINITIONS

### 4.1. Copyright DTOs

```csharp
// Request
public class DeclareCopyrightRequest
{
    public int MaTacPham { get; set; }
    public DateTime? NgaySangTac { get; set; }
    public string? MoTa { get; set; }
    public string? SoDangKy { get; set; }
}

public class UpdateCopyrightRequest
{
    public DateTime? NgaySangTac { get; set; }
    public string? MoTa { get; set; }
    public string? SoDangKy { get; set; }
}

public class VerifyCopyrightRequest
{
    public string? GhiChu { get; set; }
}

public class RejectCopyrightRequest
{
    [Required]
    public string LyDo { get; set; } = null!;
}

public class RequestInfoRequest
{
    [Required]
    public string LyDo { get; set; } = null!;
}

// Response
public class BanQuyenResponse
{
    public int MaBanQuyen { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenTacGia { get; set; } = null!;
    public string TrangThai { get; set; } = null!; // Text: "Chờ duyệt", "Đã xác minh", etc.
    public int TrangThaiCode { get; set; }
    public DateTime? NgaySangTac { get; set; }
    public DateTime NgayTao { get; set; }
    public string? LyDo { get; set; }
}

public class BanQuyenDetailResponse : BanQuyenResponse
{
    public string? MoTa { get; set; }
    public string? SoDangKy { get; set; }
    public DateTime NgayCapNhat { get; set; }
    public List<BangChungResponse> BangChung { get; set; } = new();
}

public class BangChungResponse
{
    public int MaBangChung { get; set; }
    public string TenTepGoc { get; set; } = null!;
    public string LoaiTep { get; set; } = null!;
    public long KichThuoc { get; set; }
    public DateTime NgayTao { get; set; }
    public string UrlTaiXuong { get; set; } = null!; // /api/.../evidence/{id}/file
}
```

### 4.2. Dispute DTOs

```csharp
// Request
public class ReportDisputeRequest
{
    public int MaBanQuyen { get; set; }
    public int MaTacPham { get; set; }
    [Required]
    public string TenNguoiKhieuNai { get; set; } = null!;
    [Required, EmailAddress]
    public string EmailLienHe { get; set; } = null!;
    public string? DienThoaiLienHe { get; set; }
    [Required]
    public string LyDoKhieuNai { get; set; } = null!;
}

public class RespondDisputeRequest
{
    [Required]
    public string PhanHoi { get; set; } = null!;
}

public class ReviewDisputeRequest
{
    public string? GhiChu { get; set; }
}

public class DismissDisputeRequest
{
    [Required]
    public string LyDo { get; set; } = null!;
}

public class ResolveDisputeRequest
{
    [Required]
    public string KetQua { get; set; } = null!; // "Hợp lệ" hoặc "Không hợp lệ"
    public string? LyDo { get; set; }
}

// Response
public class TraanhChapResponse
{
    public int MaTraanhChap { get; set; }
    public int MaBanQuyen { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenNguoiKhieuNai { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayGiaiQuyet { get; set; }
}

public class TraanhChapDetailResponse : TraanhChapResponse
{
    public string EmailLienHe { get; set; } = null!;
    public string? DienThoaiLienHe { get; set; }
    public string LyDoKhieuNai { get; set; } = null!;
    public string? PhanHoiHoaSi { get; set; }
    public DateTime? NgayPhanHoi { get; set; }
    public string? KetQua { get; set; }
    public string? TenNguoiXuLy { get; set; }
}
```

### 4.3. Certificate DTOs

```csharp
// Response
public class ChungNhanResponse
{
    public int MaChungNhan { get; set; }
    public string CertificateCode { get; set; } = null!;
    public string TenTacPham { get; set; } = null!;
    public string TenTacGia { get; set; } = null!;
    public DateTime NgayCap { get; set; }
    public string TrangThai { get; set; } = null!;
    public string? UrlPDF { get; set; }
    public string? UrlQR { get; set; }
}

public class ChungNhanDetailResponse : ChungNhanResponse
{
    public string ContentHash { get; set; } = null!;
    public string ChuSoHuu { get; set; } = null!;
    public string NguoiCap { get; set; } = null!;
    public DateTime? NgayThuHoi { get; set; }
    public string? LyDoThuHoi { get; set; }
}

public class PublicCertificateVerificationResponse
{
    public bool IsValid { get; set; }
    public string? CertificateCode { get; set; }
    public string? TrangThai { get; set; } // "ACTIVE", "SUPERSEDED", "REVOKED", "NOT_FOUND"
    public string? TenTacPham { get; set; }
    public string? TenTacGia { get; set; }
    public string? LoaiTacPham { get; set; }
    public DateTime? NgayCap { get; set; }
    public string? ChuSoHuu { get; set; } // Đã che tên
    public DateTime? NgayThuHoi { get; set; }
    public string? ThongBao { get; set; }
}

public class CertificatePendingResponse
{
    public int MaQueue { get; set; }
    public int MaLichSuSoHuu { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string ChuSoHuu { get; set; } = null!;
    public int SoLanThu { get; set; }
    public string TrangThai { get; set; } = null!;
    public string? ThongDiepLoi { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime LanThuTiepTheo { get; set; }
}

// Request
public class RevokeCertificateRequest
{
    [Required]
    public string LyDo { get; set; } = null!;
}
```

### 4.4. Ownership DTOs

```csharp
public class LichSuSoHuuResponse
{
    public int MaLichSuSoHuu { get; set; }
    public string ChuSoHuu { get; set; } = null!; // Họa sĩ hoặc Người dùng
    public string LoaiChuSoHuu { get; set; } = null!; // "Họa sĩ" hoặc "Khách hàng"
    public DateTime NgayNhan { get; set; }
    public DateTime? NgayChuyenGiao { get; set; }
    public string LoaiChuyenGiao { get; set; } = null!; // "Sáng tạo", "Bán", "Bán lại"
    public string TrangThai { get; set; } = null!; // "Hiện tại", "Đã chuyển", "Đảo ngược"
    public int? MaDonHang { get; set; }
    public bool CoChungNhan { get; set; }
    public string? MaChungNhan { get; set; }
}
```

### 4.5. Audit Log DTOs

```csharp
public class NhatKyResponse
{
    public long MaNhatKy { get; set; }
    public string TenDoiTuong { get; set; } = null!;
    public int MaDoiTuong { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? NguoiThucHien { get; set; }
    public string? VaiTro { get; set; }
    public DateTime ThoiGian { get; set; }
    public string? DiaChiIP { get; set; }
    public string? LyDo { get; set; }
}
```

### 4.6. Notification DTOs

```csharp
public class ThongBaoResponse
{
    public int MaThongBao { get; set; }
    public string LoaiThongBao { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string NoiDung { get; set; } = null!;
    public string? Url { get; set; }
    public bool DaDoc { get; set; }
    public DateTime NgayTao { get; set; }
}
```

---

## 5. BUSINESS LOGIC

### 5.1. Copyright Service

```csharp
public interface ICopyrightService
{
    Task<BanQuyenResponse> DeclareAsync(int hoaSiId, DeclareCopyrightRequest request);
    Task<BanQuyenDetailResponse> GetDetailAsync(int id, int userId, string role);
    Task<PagedResult<BanQuyenResponse>> GetListAsync(CopyrightFilter filter);
    Task<BanQuyenResponse> UpdateAsync(int id, int hoaSiId, UpdateCopyrightRequest request);
    Task<BanQuyenResponse> VerifyAsync(int id, int adminId, VerifyCopyrightRequest request);
    Task<BanQuyenResponse> RejectAsync(int id, int adminId, RejectCopyrightRequest request);
    Task<BanQuyenResponse> RequestInfoAsync(int id, int adminId, RequestInfoRequest request);
    Task<UploadEvidenceResponse> UploadEvidenceAsync(int banQuyenId, int hoaSiId, List<IFormFile> files);
    Task<FileStreamResult> GetEvidenceFileAsync(int evidenceId, int userId, string role);
    Task DeleteEvidenceAsync(int evidenceId, int hoaSiId);
}
```

**Quy tắc nghiệp vụ:**
- `DeclareAsync`: Kiểm tra tác phẩm thuộc họa sĩ, chưa có bản quyền, TacPham.TrangThai = 1
- `UpdateAsync`: Chỉ cho phép khi TrangThai IN (PENDING, NEED_INFO, REJECTED)
- `VerifyAsync`: Ghi audit log, gửi thông báo cho họa sĩ
- `UploadEvidenceAsync`: Kiểm tra MIME type thật, lưu file với GUID, 2-10 files, 5MB/file
- Mọi thao tác ghi `NhatKyHeThong`

### 5.2. Dispute Service

```csharp
public interface IDisputeService
{
    Task<TraanhChapResponse> ReportAsync(int userId, ReportDisputeRequest request);
    Task<TraanhChapDetailResponse> GetDetailAsync(int id, int userId, string role);
    Task<PagedResult<TraanhChapResponse>> GetListAsync(DisputeFilter filter, int userId, string role);
    Task<TraanhChapResponse> RespondAsync(int id, int hoaSiId, RespondDisputeRequest request);
    Task<TraanhChapResponse> ReviewAsync(int id, int adminId, ReviewDisputeRequest request);
    Task<TraanhChapResponse> DismissAsync(int id, int adminId, DismissDisputeRequest request);
    Task<TraanhChapResponse> ResolveAsync(int id, int adminId, ResolveDisputeRequest request);
}
```

**Quy tắc nghiệp vụ:**
- `ReportAsync`: Kiểm tra giới hạn 3 khiếu nại/tháng, tạo OPEN, KHÔNG chuyển BanQuyen
- `ReviewAsync`: OPEN → UNDER_REVIEW, chuyển BanQuyen → DISPUTED, ẩn tác phẩm, gửi thông báo họa sĩ
- `RespondAsync`: Kiểm tra trong 7 ngày kể từ NgayTao của UNDER_REVIEW
- `ResolveAsync`: UNDER_REVIEW → RESOLVED, cập nhật BanQuyen (VERIFIED hoặc REJECTED)

### 5.3. Certificate Service

```csharp
public interface ICertificateService
{
    Task<ChungNhanResponse?> IssueCertificateAsync(int lichSuSoHuuId);
    Task<ChungNhanDetailResponse> GetDetailAsync(string certificateCode, int userId, string role);
    Task<PagedResult<ChungNhanResponse>> GetMyCertificatesAsync(int userId, PagingRequest paging);
    Task<PublicCertificateVerificationResponse> VerifyPublicAsync(string certificateCode);
    Task<FileStreamResult> GetPdfAsync(string certificateCode, int userId, string role);
    Task<ChungNhanResponse> RevokeAsync(int id, int adminId, RevokeCertificateRequest request);
    Task<PagedResult<CertificatePendingResponse>> GetPendingQueueAsync(PagingRequest paging);
    Task RetryIssueAsync(int queueId, int adminId);
    Task<ChungNhanResponse> ManualIssueAsync(int queueId, int adminId);
}
```

**Quy tắc nghiệp vụ:**
- `IssueCertificateAsync`:
  - Kiểm tra BanQuyen.TrangThai = VERIFIED
  - Kiểm tra chưa có Certificate ACTIVE cho LichSuSoHuu
  - Sinh CertificateCode, tính HMAC-SHA256 hash
  - Tạo QR code, tạo PDF bằng QuestPDF
  - Nếu thất bại: Ghi vào CertificatePendingQueue
- `VerifyPublicAsync`: Không cần auth, rate limit 20/5min/IP, che tên chủ sở hữu

### 5.4. Ownership Service

```csharp
public interface IOwnershipService
{
    Task<LichSuSoHuuResponse> CreateInitialOwnershipAsync(int tacPhamId, int hoaSiId);
    Task TransferOwnershipOnOrderCompletedAsync(int donHangId);
    Task ReverseOwnershipOnRefundAsync(int donHangId, int adminId);
    Task<List<LichSuSoHuuResponse>> GetArtworkHistoryAsync(int tacPhamId, int userId, string role);
}
```

**Quy tắc nghiệp vụ:**
- `CreateInitialOwnershipAsync`: LoaiChuyenGiao = CREATION, MaHoaSi != NULL, TrangThai = CURRENT
- `TransferOwnershipOnOrderCompletedAsync`:
  - Dùng transaction
  - Cập nhật bản ghi cũ: TrangThai = TRANSFERRED, NgayChuyenGiao = UtcNow
  - Tạo bản ghi mới: MaNguoiDung != NULL, LoaiChuyenGiao = SALE, TrangThai = CURRENT
  - Gọi `ICertificateService.IssueCertificateAsync`
- `ReverseOwnershipOnRefundAsync`:
  - Kiểm tra TrangThai = CURRENT, nếu không → log error, không đảo
  - Đảo ngược ownership
  - Revoke Certificate hiện tại, khôi phục Certificate cũ (hoặc cấp mới)

### 5.5. Notification Service

```csharp
public interface INotificationService
{
    Task SendAsync(int taiKhoanId, string loai, string tieuDe, string noiDung, string? url = null);
    Task<PagedResult<ThongBaoResponse>> GetMyNotificationsAsync(int taiKhoanId, bool? daDoc, PagingRequest paging);
    Task<int> GetUnreadCountAsync(int taiKhoanId);
    Task MarkAsReadAsync(int thongBaoId, int taiKhoanId);
    Task MarkAllAsReadAsync(int taiKhoanId);
}
```

---

## 6. BACKGROUND SERVICES

### 6.1. CertificateRetryService

```csharp
public class CertificateRetryService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<CertificateRetryService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var certificateService = scope.ServiceProvider.GetRequiredService<ICertificateService>();
                
                // Đọc từ queue: TrangThai = PENDING AND SoLanThu < 3 AND LanThuTiepTheo <= UtcNow
                var pendingItems = await GetPendingItemsAsync(scope);
                
                foreach (var item in pendingItems)
                {
                    try
                    {
                        // Cập nhật TrangThai = PROCESSING
                        await UpdateStatusAsync(scope, item.MaQueue, 1);
                        
                        // Thử cấp certificate
                        var result = await certificateService.IssueCertificateAsync(item.MaLichSuSoHuu);
                        
                        if (result != null)
                        {
                            // Thành công: Xóa hoặc chuyển TrangThai = COMPLETED
                            await DeleteOrCompleteAsync(scope, item.MaQueue);
                            _logger.LogInformation($"Certificate issued for queue {item.MaQueue}");
                        }
                        else
                        {
                            // Thất bại: Tăng SoLanThu, set LanThuTiepTheo, TrangThai = PENDING
                            await IncrementRetryAsync(scope, item.MaQueue);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error processing queue {item.MaQueue}");
                        await IncrementRetryAsync(scope, item.MaQueue, ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CertificateRetryService");
            }
            
            // Chạy mỗi 5 phút
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
    
    private async Task IncrementRetryAsync(IServiceScope scope, int queueId, string? error = null)
    {
        // SoLanThu += 1
        // LanThuTiepTheo = UtcNow + 5 minutes
        // Nếu SoLanThu >= 3: TrangThai = FAILED, gửi thông báo Admin
    }
}
```

**Đăng ký trong Program.cs:**
```csharp
builder.Services.AddHostedService<CertificateRetryService>();
```

---

## 7. CẤU HÌNH

### 7.1. appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=...;..."
  },
  "Copyright": {
    "BaseUrl": "https://artgallery.com",
    "CertificateHashKey": "YOUR_SECRET_KEY_HERE_MIN_32_CHARS",
    "EvidencePath": "D:\\Uploads\\CopyrightEvidence",
    "CertificatePdfPath": "D:\\Certificates\\PDF",
    "CertificateQrPath": "D:\\Certificates\\QR",
    "MaxEvidenceFileSize": 5242880,
    "MinEvidenceFiles": 2,
    "MaxEvidenceFiles": 10,
    "AllowedEvidenceMimeTypes": ["image/jpeg", "image/png", "application/pdf"],
    "DisputeLimitPerMonth": 3,
    "DisputeResponseDays": 7,
    "CertificateRetryIntervalMinutes": 5,
    "CertificateMaxRetries": 3
  },
  "RateLimiting": {
    "VerifyCertificate": {
      "PermitLimit": 20,
      "WindowMinutes": 5
    }
  }
}
```

### 7.2. Program.cs - Cấu hình Rate Limiting

```csharp
// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("verify-certificate", opt =>
    {
        opt.PermitLimit = builder.Configuration.GetValue<int>("RateLimiting:VerifyCertificate:PermitLimit");
        opt.Window = TimeSpan.FromMinutes(builder.Configuration.GetValue<int>("RateLimiting:VerifyCertificate:WindowMinutes"));
        opt.QueueLimit = 0;
    });
});

// ForwardedHeaders (để lấy IP thật sau proxy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ...

app.UseForwardedHeaders();
app.UseRateLimiter();
```

### 7.3. Controller - Áp dụng Rate Limit

```csharp
[ApiController]
[Route("api/public/certificate")]
public class PublicCertificateController : ControllerBase
{
    [HttpGet("verify/{certificateCode}")]
    [AllowAnonymous]
    [EnableRateLimiting("verify-certificate")]
    public async Task<ActionResult<PublicCertificateVerificationResponse>> Verify(string certificateCode)
    {
        var result = await _certificateService.VerifyPublicAsync(certificateCode);
        return Ok(result);
    }
}
```

---

## 8. MIGRATION SCRIPTS

### 8.1. Migration đầy đủ (theo thứ tự)

```sql
-- ============================================
-- MIGRATION: CopyrightModule_Initial
-- Version: 1.0
-- Date: 2026-09-28
-- ============================================

-- 1. Tạo bảng BanQuyen
CREATE TABLE BanQuyen (
    MaBanQuyen INT PRIMARY KEY IDENTITY(1,1),
    MaTacPham INT NOT NULL,
    MaTacGia INT NOT NULL,
    MaNguoiGiuQuyen INT NOT NULL,
    TrangThai TINYINT NOT NULL DEFAULT 0,
    NgaySangTac DATE NULL,
    MoTa NVARCHAR(2000) NULL,
    SoDangKy NVARCHAR(100) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NguoiTao INT NULL,
    NguoiCapNhat INT NULL,
    LyDo NVARCHAR(500) NULL,
    
    CONSTRAINT FK_BanQuyen_TacPham FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham),
    CONSTRAINT FK_BanQuyen_TacGia FOREIGN KEY (MaTacGia) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_BanQuyen_NguoiGiuQuyen FOREIGN KEY (MaNguoiGiuQuyen) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT UQ_BanQuyen_TacPham UNIQUE (MaTacPham)
);

CREATE INDEX IX_BanQuyen_TrangThai ON BanQuyen(TrangThai);
CREATE INDEX IX_BanQuyen_TacGia ON BanQuyen(MaTacGia);

-- 2. Tạo bảng BangChungBanQuyen
CREATE TABLE BangChungBanQuyen (
    MaBangChung INT PRIMARY KEY IDENTITY(1,1),
    MaBanQuyen INT NOT NULL,
    TenTepGoc NVARCHAR(255) NOT NULL,
    TenTepLuu NVARCHAR(255) NOT NULL,
    DuongDan NVARCHAR(500) NOT NULL,
    LoaiTep NVARCHAR(50) NOT NULL,
    KichThuoc BIGINT NOT NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NguoiTao INT NULL,
    
    CONSTRAINT FK_BangChung_BanQuyen FOREIGN KEY (MaBanQuyen) REFERENCES BanQuyen(MaBanQuyen) ON DELETE CASCADE,
    CONSTRAINT CK_BangChung_KichThuoc CHECK (KichThuoc <= 5242880)
);

CREATE INDEX IX_BangChung_BanQuyen ON BangChungBanQuyen(MaBanQuyen);

-- 3. Tạo bảng LichSuSoHuu
CREATE TABLE LichSuSoHuu (
    MaLichSuSoHuu INT PRIMARY KEY IDENTITY(1,1),
    MaTacPham INT NOT NULL,
    MaNguoiDung INT NULL,
    MaHoaSi INT NULL,
    NgayNhan DATETIME NOT NULL,
    NgayChuyenGiao DATETIME NULL,
    LoaiChuyenGiao TINYINT NOT NULL,
    TrangThai TINYINT NOT NULL,
    MaDonHang INT NULL,
    GhiChu NVARCHAR(500) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT CK_LichSuSoHuu_Owner CHECK (
        (MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR 
        (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL)
    ),
    
    CONSTRAINT FK_LichSuSoHuu_TacPham FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham),
    CONSTRAINT FK_LichSuSoHuu_NguoiDung FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT FK_LichSuSoHuu_HoaSi FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_LichSuSoHuu_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
);

-- Unique constraint với WHERE clause (SQL Server 2008+)
CREATE UNIQUE NONCLUSTERED INDEX UQ_LichSuSoHuu_Current 
ON LichSuSoHuu(MaTacPham) WHERE TrangThai = 1;

CREATE INDEX IX_LichSuSoHuu_TacPham ON LichSuSoHuu(MaTacPham);
CREATE INDEX IX_LichSuSoHuu_NguoiDung ON LichSuSoHuu(MaNguoiDung);
CREATE INDEX IX_LichSuSoHuu_HoaSi ON LichSuSoHuu(MaHoaSi);
CREATE INDEX IX_LichSuSoHuu_DonHang ON LichSuSoHuu(MaDonHang);

-- 4. Tạo bảng ChungNhan
CREATE TABLE ChungNhan (
    MaChungNhan INT PRIMARY KEY IDENTITY(1,1),
    MaLichSuSoHuu INT NOT NULL,
    CertificateCode NVARCHAR(50) NOT NULL UNIQUE,
    ContentHash NVARCHAR(128) NOT NULL,
    NgayCap DATETIME NOT NULL,
    TrangThai TINYINT NOT NULL,
    NguoiCap NVARCHAR(100) NULL,
    NgayThuHoi DATETIME NULL,
    LyDoThuHoi NVARCHAR(500) NULL,
    DuongDanPDF NVARCHAR(500) NULL,
    DuongDanQR NVARCHAR(500) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_ChungNhan_LichSuSoHuu FOREIGN KEY (MaLichSuSoHuu) REFERENCES LichSuSoHuu(MaLichSuSoHuu)
);

CREATE UNIQUE NONCLUSTERED INDEX UQ_ChungNhan_LichSuSoHuu_Active 
ON ChungNhan(MaLichSuSoHuu) WHERE TrangThai = 1;

CREATE INDEX IX_ChungNhan_CertificateCode ON ChungNhan(CertificateCode);
CREATE INDEX IX_ChungNhan_LichSuSoHuu ON ChungNhan(MaLichSuSoHuu);
CREATE INDEX IX_ChungNhan_TrangThai ON ChungNhan(TrangThai);

-- 5. Tạo bảng TranhChapBanQuyen
CREATE TABLE TranhChapBanQuyen (
    MaTraanhChap INT PRIMARY KEY IDENTITY(1,1),
    MaBanQuyen INT NOT NULL,
    MaNguoiKhieuNai INT NOT NULL,
    TenNguoiKhieuNai NVARCHAR(200) NOT NULL,
    EmailLienHe NVARCHAR(200) NOT NULL,
    DienThoaiLienHe NVARCHAR(20) NULL,
    LyDoKhieuNai NVARCHAR(2000) NOT NULL,
    BangChungKhieuNai NVARCHAR(MAX) NULL,
    TrangThai TINYINT NOT NULL DEFAULT 0,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NULL,
    PhanHoiHoaSi NVARCHAR(2000) NULL,
    BangChungPhanHoi NVARCHAR(MAX) NULL,
    NgayPhanHoi DATETIME NULL,
    NguoiXuLy INT NULL,
    KetQua NVARCHAR(2000) NULL,
    NgayGiaiQuyet DATETIME NULL,
    
    CONSTRAINT FK_TraanhChap_BanQuyen FOREIGN KEY (MaBanQuyen) REFERENCES BanQuyen(MaBanQuyen)
);

CREATE INDEX IX_TraanhChap_BanQuyen ON TranhChapBanQuyen(MaBanQuyen);
CREATE INDEX IX_TraanhChap_NguoiKhieuNai ON TranhChapBanQuyen(MaNguoiKhieuNai);
CREATE INDEX IX_TraanhChap_TrangThai ON TranhChapBanQuyen(TrangThai);

-- 6. Tạo bảng NhatKyHeThong
CREATE TABLE NhatKyHeThong (
    MaNhatKy BIGINT PRIMARY KEY IDENTITY(1,1),
    TenDoiTuong NVARCHAR(100) NOT NULL,
    MaDoiTuong INT NOT NULL,
    HanhDong NVARCHAR(100) NOT NULL,
    GiaTriTruoc NVARCHAR(MAX) NULL,
    GiaTriSau NVARCHAR(MAX) NULL,
    NguoiThucHien INT NULL,
    VaiTro TINYINT NULL,
    ThoiGian DATETIME NOT NULL DEFAULT GETUTCDATE(),
    DiaChiIP NVARCHAR(50) NULL,
    LyDo NVARCHAR(500) NULL,
    ThongTinBoSung NVARCHAR(MAX) NULL
);

CREATE INDEX IX_NhatKy_TenDoiTuong ON NhatKyHeThong(TenDoiTuong);
CREATE INDEX IX_NhatKy_MaDoiTuong ON NhatKyHeThong(MaDoiTuong);
CREATE INDEX IX_NhatKy_NguoiThucHien ON NhatKyHeThong(NguoiThucHien);
CREATE INDEX IX_NhatKy_ThoiGian ON NhatKyHeThong(ThoiGian);

-- 7. Tạo bảng CertificatePendingQueue
CREATE TABLE CertificatePendingQueue (
    MaQueue INT PRIMARY KEY IDENTITY(1,1),
    MaLichSuSoHuu INT NOT NULL,
    SoLanThu INT NOT NULL DEFAULT 1,
    TrangThai TINYINT NOT NULL DEFAULT 0,
    ThongDiepLoi NVARCHAR(1000) NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayCapNhat DATETIME NULL,
    LanThuTiepTheo DATETIME NOT NULL,
    
    CONSTRAINT FK_Queue_LichSuSoHuu FOREIGN KEY (MaLichSuSoHuu) REFERENCES LichSuSoHuu(MaLichSuSoHuu)
);

CREATE INDEX IX_Queue_TrangThai ON CertificatePendingQueue(TrangThai);
CREATE INDEX IX_Queue_LanThuTiepTheo ON CertificatePendingQueue(LanThuTiepTheo);

-- 8. Tạo bảng ThongBao
CREATE TABLE ThongBao (
    MaThongBao INT PRIMARY KEY IDENTITY(1,1),
    MaTaiKhoan INT NOT NULL,
    LoaiThongBao NVARCHAR(50) NOT NULL,
    TieuDe NVARCHAR(200) NOT NULL,
    NoiDung NVARCHAR(1000) NOT NULL,
    Url NVARCHAR(500) NULL,
    DaDoc BIT NOT NULL DEFAULT 0,
    NgayTao DATETIME NOT NULL DEFAULT GETUTCDATE(),
    NgayDoc DATETIME NULL
);

CREATE INDEX IX_ThongBao_TaiKhoan ON ThongBao(MaTaiKhoan);
CREATE INDEX IX_ThongBao_DaDoc ON ThongBao(DaDoc);
CREATE INDEX IX_ThongBao_NgayTao ON ThongBao(NgayTao);

-- 9. Thêm cột vào TacPham
ALTER TABLE TacPham ADD LoaiTacPham TINYINT NOT NULL DEFAULT 0;
ALTER TABLE TacPham ADD MaTacPhamGoc INT NULL;
ALTER TABLE TacPham ADD SoBanIn INT NULL;
ALTER TABLE TacPham ADD TongSoBan INT NULL;

ALTER TABLE TacPham ADD CONSTRAINT FK_TacPham_TacPhamGoc 
    FOREIGN KEY (MaTacPhamGoc) REFERENCES TacPham(MaTacPham);

-- 10. Migrate dữ liệu: Tạo BanQuyen LEGACY cho tác phẩm cũ
INSERT INTO BanQuyen (MaTacPham, MaTacGia, MaNguoiGiuQuyen, TrangThai, 
    NgaySangTac, MoTa, NgayTao, NgayCapNhat)
SELECT 
    MaTacPham,
    MaHoaSi as MaTacGia,
    MaHoaSi as MaNguoiGiuQuyen,
    5 as TrangThai, -- LEGACY
    NgayTao as NgaySangTac,
    N'Dữ liệu di chuyển từ hệ thống cũ' as MoTa,
    GETUTCDATE() as NgayTao,
    GETUTCDATE() as NgayCapNhat
FROM TacPham
WHERE NOT EXISTS (SELECT 1 FROM BanQuyen WHERE BanQuyen.MaTacPham = TacPham.MaTacPham);

-- 11. Migrate dữ liệu: Tạo LichSuSoHuu cho tác phẩm chưa bán
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT 
    t.MaTacPham,
    NULL as MaNguoiDung,
    t.MaHoaSi as MaHoaSi,
    t.NgayTao as NgayNhan,
    NULL as NgayChuyenGiao,
    0 as LoaiChuyenGiao, -- CREATION
    1 as TrangThai, -- CURRENT
    NULL as MaDonHang,
    N'Migration: Tác phẩm chưa bán' as GhiChu
FROM TacPham t
WHERE NOT EXISTS (
    SELECT 1 FROM ChiTietDonHang ct
    JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
    WHERE ct.MaTacPham = t.MaTacPham AND d.TrangThai = 3
);

-- 12. Migrate dữ liệu: Tạo LichSuSoHuu TRANSFERRED cho họa sĩ (tác phẩm đã bán)
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT DISTINCT
    ct.MaTacPham,
    NULL as MaNguoiDung,
    t.MaHoaSi as MaHoaSi,
    t.NgayTao as NgayNhan,
    d.NgayDat as NgayChuyenGiao,
    0 as LoaiChuyenGiao, -- CREATION
    2 as TrangThai, -- TRANSFERRED
    NULL as MaDonHang,
    N'Migration: Sở hữu ban đầu của họa sĩ' as GhiChu
FROM ChiTietDonHang ct
JOIN DonHang d ON ct.MaDonHang = d.MaDonHang AND d.TrangThai = 3
JOIN TacPham t ON ct.MaTacPham = t.MaTacPham;

-- 13. Migrate dữ liệu: Tạo LichSuSoHuu CURRENT cho người mua
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT 
    ct.MaTacPham,
    d.MaNguoiDung as MaNguoiDung,
    NULL as MaHoaSi,
    d.NgayDat as NgayNhan,
    d.NgayDat as NgayChuyenGiao,
    1 as LoaiChuyenGiao, -- SALE
    1 as TrangThai, -- CURRENT
    d.MaDonHang,
    N'Migration: Đơn hàng đã giao từ hệ thống cũ. Không cấp chứng nhận cho dữ liệu migration.' as GhiChu
FROM ChiTietDonHang ct
JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
WHERE d.TrangThai = 3;

PRINT N'Migration completed successfully!';
```

---

## 9. TEMPLATE PDF

### 9.1. Layout chứng nhận (QuestPDF)

```csharp
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class CertificatePdfGenerator
{
    public byte[] Generate(ChungNhanPdfData data)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(12).FontFamily("Arial"));

                page.Header().Element(ComposeHeader);
                page.Content().Element(content => ComposeContent(content, data));
                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Trang ");
                    text.CurrentPageNumber();
                });
            });
        }).GeneratePdf();
    }

    void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text("CHỨNG NHẬN TÁC PHẨM NGHỆ THUẬT")
                    .FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                column.Item().Text("CERTIFICATE OF AUTHENTICITY")
                    .FontSize(16).FontColor(Colors.Grey.Darken1);
            });
            
            // Logo
            // row.ConstantItem(100).Image("path/to/logo.png");
        });
    }

    void ComposeContent(IContainer container, ChungNhanPdfData data)
    {
        container.PaddingVertical(20).Column(column =>
        {
            column.Spacing(10);

            // Mã chứng nhận
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Mã chứng nhận:").Bold();
                row.RelativeItem().Text(data.CertificateCode).FontSize(14).FontColor(Colors.Red.Darken1);
            });

            // Tác phẩm
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Tác phẩm:").Bold();
                row.RelativeItem().Text(data.TenTacPham);
            });

            // Tác giả
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Tác giả:").Bold();
                row.RelativeItem().Text(data.TenTacGia);
            });

            // Loại tác phẩm
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Loại:").Bold();
                row.RelativeItem().Text(data.LoaiTacPham);
            });

            // Chủ sở hữu
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Chủ sở hữu hiện tại:").Bold();
                row.RelativeItem().Text(data.ChuSoHuu);
            });

            // Ngày cấp
            column.Item().Row(row =>
            {
                row.RelativeItem().Text("Ngày cấp:").Bold();
                row.RelativeItem().Text(data.NgayCap.ToString("dd/MM/yyyy HH:mm"));
            });

            // QR Code
            column.Item().AlignCenter().Height(150).Image(data.QRCodeBytes);

            // Content Hash
            column.Item().PaddingTop(10).Text(text =>
            {
                text.Span("Hash: ").Bold();
                text.Span(data.ContentHash).FontSize(8).FontFamily("Courier New");
            });

            // Disclaimer
            column.Item().PaddingTop(20).Border(1).BorderColor(Colors.Grey.Lighten1)
                .Padding(10).Text("⚠️ Chứng nhận này do nền tảng cấp, không thay thế việc đăng ký quyền tác giả tại cơ quan nhà nước có thẩm quyền.")
                .FontSize(10).Italic().FontColor(Colors.Grey.Darken1);
        });
    }
}

public class ChungNhanPdfData
{
    public string CertificateCode { get; set; } = null!;
    public string TenTacPham { get; set; } = null!;
    public string TenTacGia { get; set; } = null!;
    public string LoaiTacPham { get; set; } = null!;
    public string ChuSoHuu { get; set; } = null!;
    public DateTime NgayCap { get; set; }
    public string ContentHash { get; set; } = null!;
    public byte[] QRCodeBytes { get; set; } = null!;
}
```

---

## 10. MA TRẬN PHÂN QUYỀN CHI TIẾT

### 10.1. API Authorization Matrix

| Endpoint | Admin | Họa sĩ | Khách | Public |
|----------|-------|--------|-------|--------|
| **Copyright** |
| POST /api/artist/copyright/declare | ❌ | ✅ (của mình) | ❌ | ❌ |
| GET /api/artist/copyright/my-copyrights | ❌ | ✅ | ❌ | ❌ |
| PUT /api/artist/copyright/{id} | ❌ | ✅ (của mình, PENDING/NEED_INFO/REJECTED) | ❌ | ❌ |
| POST /api/artist/copyright/{id}/upload-evidence | ❌ | ✅ (của mình) | ❌ | ❌ |
| GET /api/artist/copyright/evidence/{id}/file | ❌ | ✅ (của mình) | ❌ | ❌ |
| GET /api/admin/copyright | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/copyright/{id}/verify | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/copyright/{id}/reject | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/copyright/{id}/request-info | ✅ | ❌ | ❌ | ❌ |
| GET /api/admin/copyright/evidence/{id}/file | ✅ | ❌ | ❌ | ❌ |
| **Dispute** |
| POST /api/dispute/report | ✅ | ✅ | ✅ | ❌ |
| GET /api/dispute/my-disputes | ✅ | ✅ | ✅ | ❌ |
| POST /api/artist/dispute/{id}/respond | ❌ | ✅ (trong 7 ngày) | ❌ | ❌ |
| GET /api/admin/dispute | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/dispute/{id}/review | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/dispute/{id}/dismiss | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/dispute/{id}/resolve | ✅ | ❌ | ❌ | ❌ |
| **Certificate** |
| GET /api/certificate/my-certificates | ✅ | ✅ (của mình) | ✅ (của mình) | ❌ |
| GET /api/certificate/{code} | ✅ | ✅ (của mình) | ✅ (của mình) | ❌ |
| GET /api/certificate/{code}/pdf | ✅ | ✅ (của mình) | ✅ (của mình) | ❌ |
| GET /api/public/certificate/verify/{code} | ✅ | ✅ | ✅ | ✅ (rate limit 20/5min) |
| GET /api/admin/certificate | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/certificate/{id}/revoke | ✅ | ❌ | ❌ | ❌ |
| GET /api/admin/certificate/pending | ✅ | ❌ | ❌ | ❌ |
| POST /api/admin/certificate/pending/{id}/retry | ✅ | ❌ | ❌ | ❌ |
| **Ownership** |
| GET /api/ownership/artwork/{id}/history | ✅ | ✅ (của mình) | ✅ (đã mua) | ❌ |
| GET /api/admin/ownership | ✅ | ❌ | ❌ | ❌ |
| **Audit Log** |
| GET /api/admin/audit-log | ✅ | ❌ | ❌ | ❌ |
| GET /api/audit-log/my-activities | ✅ | ✅ | ✅ | ❌ |
| **Notification** |
| GET /api/notification/my-notifications | ✅ | ✅ | ✅ | ❌ |
| GET /api/notification/unread-count | ✅ | ✅ | ✅ | ❌ |
| POST /api/notification/{id}/mark-read | ✅ | ✅ | ✅ | ❌ |

---

**Ghi chú:**
- ✅ = Được phép
- ❌ = Không được phép
- (của mình) = Kiểm tra resource ownership
- (rate limit) = Có giới hạn tốc độ

---

**Kết thúc design.md**
