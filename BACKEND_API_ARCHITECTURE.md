# 📚 KIẾN TRÚC BACKEND API - HỆ THỐNG BÁN TRANH

## 🏗️ Tổng quan kiến trúc

Backend được xây dựng bằng **ASP.NET Core Web API** với kiến trúc **3 lớp** (3-Layer Architecture):

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│                     (Controllers)                        │
│  - AuthController                                        │
│  - PublicController                                      │
│  - KhachHangController                                   │
│  - HoaSiController                                       │
│  - AdminController                                       │
│  - CustomArtController                                   │
│  - HoanTraController                                     │
│  - ConsultationController                                │
│  - YeuThichController                                    │
│  - DanhMucController                                     │
│  - ContentController                                     │
│  - ChiTietTacPhamController                              │
└─────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                  │
│                         (BLL)                            │
│  - IAuthBusiness / AuthBusiness                          │
│  - IKhachHangBusiness / KhachHangBusiness                │
│  - IHoaSiBusiness / HoaSiBusiness                        │
│  - IAdminBusiness / AdminBusiness                        │
│  - IContentBusiness / ContentBusiness                    │
│  - IChiTietTacPhamBusiness / ChiTietTacPhamBusiness      │
│  - IHoanTraBusiness / HoanTraBusiness                    │
│  - ICustomArtBusiness / CustomArtBusiness                │
│  - IConsultationBusiness / ConsultationBusiness          │
└─────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                      │
│                        (DAL/Repository)                  │
│  - ITaiKhoanRepository / TaiKhoanRepository              │
│  - INguoiDungRepository / NguoiDungRepository            │
│  - IHoaSiRepository / HoaSiRepository                    │
│  - IDanhMucRepository / DanhMucRepository                │
│  - ITacPhamRepository / TacPhamRepository                │
│  - IGioHangRepository / GioHangRepository                │
│  - IDonHangRepository / DonHangRepository                │
│  - IThanhToanRepository / ThanhToanRepository            │
│  - IBaiVietRepository / BaiVietRepository                │
│  - INoiDungRepository / NoiDungRepository                │
│  - IAdminRepository / AdminRepository                    │
│  - IChiTietTacPhamRepository / ChiTietTacPhamRepository  │
│  - ITacPhamChinhSuaRepository / TacPhamChinhSuaRepository│
│  - IYeuThichRepository / YeuThichRepository              │
│  - IHoanTraRepository / HoanTraRepository                │
│  - ICustomArtRepository / CustomArtRepository            │
│  - IConsultationRepository / ConsultationRepository      │
└─────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────┐
│                       DATABASE                           │
│           SQL Server (HeThongBanTranh)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 API GATEWAY & ROUTING

### Base URL
```
http://localhost:5273/api
```

### Middleware Pipeline
```
Request → CORS → ExceptionHandling → Authentication → Authorization → Controllers → Response
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### JWT Authentication
- **Secret Key**: `YourSuperSecretKeyThatIsAtLeast32CharactersLong!`
- **Issuer**: `DoAn2_BackEnd`
- **Audience**: `DoAn2_FrontEnd`
- **Token Type**: Bearer Token

### Luồng xác thực:
1. **Login**: POST `/api/auth/dang-nhap` → Trả về `accessToken` và `refreshToken`
2. **Header**: `Authorization: Bearer {accessToken}`
3. **Refresh Token**: POST `/api/auth/lam-moi-token` → Làm mới token khi hết hạn
4. **Get Current User**: GET `/api/auth/me` → Lấy thông tin user từ token
5. **Logout**: POST `/api/auth/dang-xuat` → Xóa refresh token

### Claims trong JWT Token:
```csharp
- MaTaiKhoan (Account ID)
- TenDangNhap (Username)
- VaiTro (Role: KhachHang/HoaSi/Admin)
- MaNguoiDung (Customer ID - nếu là khách hàng)
- MaHoaSi (Artist ID - nếu là họa sĩ)
```

---

## 📋 CÁC CONTROLLER & API ENDPOINTS

### 1️⃣ **AuthController** (`/api/auth`)
**Xử lý xác thực & quản lý tài khoản**

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/dang-nhap` | ❌ | Đăng nhập |
| POST | `/dang-ky` | ❌ | Đăng ký tài khoản mới |
| POST | `/dang-xuat` | ✅ | Đăng xuất |
| POST | `/lam-moi-token` | ❌ | Làm mới access token |
| GET | `/me` | ✅ | Lấy thông tin user hiện tại |
| POST | `/doi-mat-khau` | ✅ | Đổi mật khẩu |

---

### 2️⃣ **PublicController** (`/api`)
**API công khai - Không cần authentication**

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/tranh` | ❌ | Lấy danh sách tác phẩm (có thể search) |
| GET | `/tranh/{id}` | ❌ | Xem chi tiết tác phẩm |
| GET | `/tranh/{id}/goi-y` | ❌ | Gợi ý tác phẩm tương tự |
| GET | `/hoa-si` | ❌ | Danh sách họa sĩ |
| GET | `/hoa-si/{id}` | ❌ | Chi tiết họa sĩ & tác phẩm |
| GET | `/bai-viet` | ❌ | Danh sách bài viết (tin tức) |
| GET | `/bai-viet/{id}` | ❌ | Chi tiết bài viết |
| GET | `/danh-muc` | ❌ | Danh sách danh mục tranh |

**Thuật toán gợi ý tác phẩm:**
```
Score = 0
- Cùng danh mục: +3 điểm
- Cùng họa sĩ: +2 điểm  
- Giá tương đương (±30%): +1 điểm
→ Sắp xếp theo score giảm dần, lấy top 8
```

---

### 3️⃣ **KhachHangController** (`/api/khach-hang`)
**API cho khách hàng - Cần authentication**

| Chức năng | Endpoints |
|-----------|-----------|
| **Hồ sơ** | GET `/`, PUT `/` |
| **Giỏ hàng** | GET `/gio-hang`, POST `/gio-hang`, PUT `/gio-hang/{id}`, DELETE `/gio-hang/{id}` |
| **Đơn hàng** | GET `/don-hang`, GET `/don-hang/{id}`, POST `/dat-hang` |
| **Thanh toán** | POST `/thanh-toan` |
| **Yêu thích** | Xem `YeuThichController` |
| **Hoàn trả** | Xem `HoanTraController` |
| **Đánh giá** | GET `/danh-gia/tac-pham/{id}`, POST `/danh-gia` |

---

### 4️⃣ **HoaSiController** (`/api/hoa-si`)
**API cho họa sĩ - Cần authentication với role HoaSi**

| Chức năng | Endpoints |
|-----------|-----------|
| **Hồ sơ** | GET `/`, PUT `/` |
| **Tác phẩm** | GET `/tac-pham`, GET `/tac-pham/{id}`, POST `/tac-pham`, PUT `/tac-pham/{id}` |
| **Bài viết** | GET `/bai-viet`, POST `/bai-viet`, PUT `/bai-viet/{id}`, DELETE `/bai-viet/{id}` |
| **Custom Art** | Xem `CustomArtController` |
| **Consultation** | Xem `ConsultationController` |
| **Thống kê** | GET `/thong-ke` |

---

### 5️⃣ **AdminController** (`/api/admin`)
**API cho quản trị viên - Cần authentication với role Admin**

| Chức năng | Endpoints |
|-----------|-----------|
| **Dashboard** | GET `/dashboard` |
| **Quản lý họa sĩ** | GET `/hoa-si`, POST `/hoa-si`, PUT `/hoa-si/{id}`, DELETE `/hoa-si/{id}` |
| **Quản lý danh mục** | GET `/danh-muc`, POST `/danh-muc`, PUT `/danh-muc/{id}`, DELETE `/danh-muc/{id}` |
| **Duyệt tác phẩm** | GET `/tac-pham`, PUT `/tac-pham/{id}/duyet`, PUT `/tac-pham/{id}/tu-choi` |
| **Duyệt bài viết** | GET `/bai-viet`, PUT `/bai-viet/{id}/duyet`, PUT `/bai-viet/{id}/tu-choi` |
| **Quản lý đơn hàng** | GET `/don-hang`, GET `/don-hang/{id}`, PUT `/don-hang/{id}/trang-thai` |
| **Báo cáo** | GET `/bao-cao/doanh-thu`, GET `/bao-cao/san-pham` |

---

### 6️⃣ **HoanTraController** (`/api/hoan-tra`)
**API quản lý hoàn trả sản phẩm**

#### Khách hàng:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách yêu cầu hoàn trả của tôi |
| GET | `/{id}` | Chi tiết yêu cầu hoàn trả |
| POST | `/` | Tạo yêu cầu hoàn trả mới |

#### Admin:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/admin` | Tất cả yêu cầu hoàn trả |
| GET | `/admin/{id}` | Chi tiết yêu cầu (admin view) |
| PUT | `/admin/{id}/trang-thai` | Cập nhật trạng thái hoàn trả |

**Trạng thái hoàn trả:**
```
CHO_DUYET → DA_DUYET → DANG_HOAN_TRA → DA_NHAN_HANG → DA_HOAN_TIEN → HOAN_TAT
              ↓
            TU_CHOI
```

---

### 7️⃣ **CustomArtController** (`/api/custom-art`)
**API tranh vẽ theo yêu cầu**

#### Khách hàng:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/request` | Tạo yêu cầu vẽ tranh mới |
| GET | `/my-requests` | Yêu cầu của tôi |
| GET | `/{id}` | Chi tiết yêu cầu |
| POST | `/{id}/accept-quote` | Chấp nhận báo giá |
| POST | `/{id}/reject-quote` | Từ chối báo giá |

#### Họa sĩ:
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/available` | Yêu cầu chưa có họa sĩ nhận |
| POST | `/{id}/claim` | Nhận yêu cầu |
| POST | `/{id}/quote` | Gửi báo giá |
| POST | `/{id}/complete` | Hoàn thành tác phẩm |

**Luồng Custom Art:**
```
1. Khách tạo yêu cầu → Pending
2. Họa sĩ nhận yêu cầu → Assigned  
3. Họa sĩ báo giá → QuoteSubmitted
4. Khách chấp nhận → InProgress
5. Họa sĩ hoàn thành → Completed
```

---

### 8️⃣ **ConsultationController** (`/api/consultation`)
**API đặt lịch tư vấn**

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/book` | Customer | Đặt lịch tư vấn |
| GET | `/my-consultations` | Customer | Lịch tư vấn của tôi |
| GET | `/artist/{artistId}` | Artist | Lịch tư vấn của họa sĩ |
| PUT | `/{id}/confirm` | Artist | Xác nhận lịch |
| PUT | `/{id}/cancel` | Both | Hủy lịch |

---

### 9️⃣ **YeuThichController** (`/api/yeu-thich`)
**API danh sách yêu thích (Favorites)**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách tác phẩm yêu thích |
| POST | `/` | Thêm vào yêu thích |
| DELETE | `/{maTacPham}` | Xóa khỏi yêu thích |
| GET | `/check/{maTacPham}` | Kiểm tra đã yêu thích chưa |

---

### 🔟 **ChiTietTacPhamController** (`/api/chi-tiet-tac-pham`)
**API đánh giá & review sản phẩm**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/tac-pham/{maTacPham}` | Lấy review của tác phẩm |
| POST | `/` | Thêm đánh giá mới |
| PUT | `/{id}` | Cập nhật đánh giá |
| DELETE | `/{id}` | Xóa đánh giá |
| GET | `/5-sao` | Lấy tất cả đánh giá 5 sao (cho homepage) |

---

## 🔧 MIDDLEWARE & CROSS-CUTTING CONCERNS

### 1. **CORS (Cross-Origin Resource Sharing)**
```csharp
Policy: "AllowAll"
- AllowAnyOrigin()
- AllowAnyMethod()  
- AllowAnyHeader()
```

### 2. **Exception Handling Middleware**
```csharp
Tự động catch exception → Trả về JSON:
{
  "message": "Đã xảy ra lỗi trên server",
  "error": "Exception message",
  "details": "Inner exception"
}
```

### 3. **JWT Helper**
```csharp
Location: /Helpers/JwtHelper.cs
Methods:
- GetMaTaiKhoan(ClaimsPrincipal user)
- GetTenDangNhap(ClaimsPrincipal user)
- GetVaiTro(ClaimsPrincipal user)
- GetMaNguoiDung(ClaimsPrincipal user)
- GetMaHoaSi(ClaimsPrincipal user)
```

---

## 📊 DATABASE CONNECTION

### Connection String
```
Server=DUYSONW\\SQLEXPRESS;
Database=HeThongBanTranh;
Trusted_Connection=True;
TrustServerCertificate=True;
```

### Repository Pattern
Mỗi entity có:
- **Interface**: Định nghĩa contract (trong `DAL/Interfaces/`)
- **Implementation**: Logic truy vấn database (trong `DAL/`)
- **Dependency Injection**: Đăng ký trong `Program.cs`

---

## 🎯 DEPENDENCY INJECTION

Tất cả services được đăng ký trong `Program.cs`:

```csharp
// DAL Layer
builder.Services.AddScoped<ITaiKhoanRepository, TaiKhoanRepository>();
builder.Services.AddScoped<INguoiDungRepository, NguoiDungRepository>();
// ... (14 repositories)

// BLL Layer  
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
builder.Services.AddScoped<IKhachHangBusiness, KhachHangBusiness>();
// ... (9 business services)
```

---

## 📝 JSON SERIALIZATION

### CamelCase Convention
```csharp
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = 
        System.Text.Json.JsonNamingPolicy.CamelCase;
})
```

**Server (C#)**: `TenTacPham` → **Client (TypeScript)**: `tenTacPham`

---

## 🚀 API GATEWAY WORKFLOW

### Request Flow:
```
1. Client gửi request → http://localhost:5273/api/{endpoint}
2. CORS Middleware → Check origin
3. Exception Handling Middleware → Wrap request
4. Authentication Middleware → Verify JWT token
5. Authorization Middleware → Check roles
6. Controller → Process request
7. Business Layer → Business logic
8. Repository Layer → Database query
9. Response → JSON camelCase
10. Client nhận response
```

### Response Format:
#### Success:
```json
{
  "data": { ... },
  "message": "Success message"
}
```

#### Error:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Technical details"
}
```

---

## 🔒 SECURITY FEATURES

1. **JWT Authentication** - Token-based auth
2. **Password Hashing** - BCrypt/PBKDF2
3. **Role-based Authorization** - [Authorize(Roles = "Admin")]
4. **HTTPS Support** - TrustServerCertificate
5. **Input Validation** - DTO validation
6. **SQL Injection Prevention** - Parameterized queries
7. **CORS Policy** - Controlled origin access

---

## 📦 NUGET PACKAGES

- `Microsoft.AspNetCore.Authentication.JwtBearer` - JWT auth
- `Microsoft.IdentityModel.Tokens` - Token validation
- `Swashbuckle.AspNetCore` - Swagger/OpenAPI
- `System.Data.SqlClient` - SQL Server connection
- `BCrypt.Net-Next` hoặc tương tự - Password hashing

---

## 🌟 BEST PRACTICES ĐƯỢC ÁP DỤNG

✅ **3-Layer Architecture** - Separation of concerns  
✅ **Repository Pattern** - Data access abstraction  
✅ **Dependency Injection** - Loose coupling  
✅ **Interface Segregation** - Clean contracts  
✅ **Exception Handling** - Global error handling  
✅ **DTOs** - Data transfer objects  
✅ **JWT Authentication** - Stateless auth  
✅ **Swagger Documentation** - API docs  
✅ **CORS Support** - Cross-origin requests  
✅ **Async/Await** - Non-blocking operations

---

## 📚 TÀI LIỆU THAM KHẢO

- **Swagger UI**: `http://localhost:5273/swagger`
- **API Base URL**: `http://localhost:5273/api`
- **Database**: SQL Server (HeThongBanTranh)

---

**Tác giả**: Hệ Thống Bán Tranh Team  
**Phiên bản**: 1.0  
**Ngày cập nhật**: 2024
