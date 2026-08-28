# HƯỚNG DẪN BẢO VỆ ĐỒ ÁN - HỆ THỐNG BÁN TRANH TRỰC TUYẾN

## 📋 TỔNG QUAN DỰ ÁN

**Tên đồ án**: Hệ Thống Bán Tranh Nghệ Thuật Trực Tuyến (Art Gallery E-Commerce)

**Công nghệ sử dụng**:
- **Frontend**: React 18 + TypeScript
- **Backend**: ASP.NET Core 8.0 Web API
- **Database**: SQL Server 2022
- **Authentication**: JWT (JSON Web Token)
- **State Management**: React Context API + Recoil
- **Styling**: CSS3 + Tailwind CSS

**Mô hình kiến trúc**: 
- Client-Server Architecture
- RESTful API
- 3-Layer Architecture (Presentation - Business Logic - Data Access)

---

## 📁 CẤU TRÚC THỨ MỤC TỔNG QUAN

```
DoAn_2/
├── art-gallery-react/          # Frontend React Application
├── DoAn3_BackEnd/              # Backend ASP.NET Core API
├── .git/                       # Git version control
├── .vscode/                    # VS Code configuration
├── start-dev.bat               # Script khởi động development (Windows)
├── start-dev.ps1               # Script khởi động development (PowerShell)
└── test-api.html               # File test API endpoints
```

---

## 🎨 PHẦN 1: FRONTEND (art-gallery-react/)

### 1.1. Cấu trúc thư mục chính

```
art-gallery-react/
├── public/                     # Static assets
│   ├── assets/                 # Images, CSS, JS
│   │   ├── css/               # CSS files cho từng trang
│   │   ├── js/                # JavaScript utilities
│   │   ├── fonts/             # Font files (Themify Icons)
│   │   ├── codien/            # Hình ảnh tranh cổ điển
│   │   └── TrangNgoai/        # Hình ảnh giao diện, showroom
│   └── index.html             # HTML template
├── src/                        # Source code
├── build/                      # Production build output
├── node_modules/              # Dependencies
├── package.json               # NPM dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── .env                       # Environment variables
```

### 1.2. Thư mục src/ - Source Code Chi Tiết

#### 📂 **src/pages/** - Các trang chính của ứng dụng

**Public Pages** (Người dùng chưa đăng nhập):
- `Home.tsx` - Trang chủ: Hiển thị slider, tác phẩm nổi bật, bán chạy, testimonials
- `About.tsx` - Giới thiệu về gallery
- `Artworks.tsx` - Danh sách tất cả tác phẩm với filter, search
- `ArtworkDetail.tsx` - Chi tiết tác phẩm, thêm giỏ hàng, tác phẩm gợi ý
- `News.tsx` - Tin tức, bài viết
- `Contact.tsx` - Liên hệ
- `Login.tsx` - Đăng nhập
- `Register.tsx` - Đăng ký tài khoản
- `Cart.tsx` - Giỏ hàng
- `Checkout.tsx` - Thanh toán

**User Pages** (Khách hàng đã đăng nhập):
- `User/UserLayout.tsx` - Layout cho trang user
- `User/UserProfile.tsx` - Thông tin cá nhân
- `User/UserOrders.tsx` - Danh sách đơn hàng
- `User/UserOrderDetail.tsx` - Chi tiết đơn hàng
- `User/UserFavorites.tsx` - Danh sách tác phẩm yêu thích

**Admin Pages** (Quản trị viên):
- `Admin/AdminLayout.tsx` - Layout cho trang admin
- `Admin/AdminHome.tsx` - Dashboard thống kê
- `Admin/AdminOrders.tsx` - Quản lý đơn hàng
- `Admin/AdminArt.tsx` - Quản lý tác phẩm (duyệt tác phẩm mới & chỉnh sửa)
- `Admin/AdminCustomers.tsx` - Quản lý khách hàng
- `Admin/AdminAuthors.tsx` - Quản lý họa sĩ
- `Admin/AdminContent.tsx` - Quản lý nội dung
- `Admin/AdminArtworkDetails.tsx` - Quản lý chi tiết tác phẩm
- `Admin/AdminReport.tsx` - Báo cáo doanh thu
- `Admin/AdminSettings.tsx` - Cài đặt hệ thống
- `Admin/AdminProfile.tsx` - Hồ sơ admin

**Artist Pages** (Họa sĩ):
- `Artist/ArtistLayout.tsx` - Layout cho trang họa sĩ
- `Artist/ArtistDashboard.tsx` - Dashboard họa sĩ
- `Artist/ArtistProfile.tsx` - Hồ sơ họa sĩ
- `Artist/ArtistArtworks.tsx` - Quản lý tác phẩm của họa sĩ
- `Artist/ArtworkDetailManagement.tsx` - Quản lý chi tiết tác phẩm
- `Artist/ArtworkDetailContent.tsx` - Chỉnh sửa nội dung chi tiết
- `Artist/ArtistArticles.tsx` - Quản lý bài viết
- `Artist/ArtistRevenue.tsx` - Doanh thu của họa sĩ

#### 📂 **src/components/** - Các component tái sử dụng

- `Header.tsx` - Header với menu, giỏ hàng, đăng nhập/đăng xuất
- `Footer.tsx` - Footer với thông tin liên hệ
- `ArtworkCard.tsx` - Card hiển thị tác phẩm (dùng ở nhiều nơi)
- `ArtworkDetailSection.tsx` - Section chi tiết tác phẩm
- `FavoriteButton.tsx` - Nút thêm/xóa yêu thích
- `RecommendedArtworks.tsx` - Danh sách tác phẩm gợi ý
- `CancelOrderModal.tsx` - Modal hủy đơn hàng
- `ScrollToTop.tsx` - Component scroll to top khi chuyển trang

#### 📂 **src/services/** - Các service gọi API

- `api.ts` - Axios instance, interceptors (thêm token, xử lý lỗi 401)
- `authService.ts` - Đăng nhập, đăng ký, đăng xuất, đổi mật khẩu
- `artworkService.ts` - CRUD tác phẩm, lấy danh sách, chi tiết, gợi ý
- `cartService.ts` - Thêm/xóa/cập nhật giỏ hàng
- `orderService.ts` - Tạo đơn hàng, lấy danh sách, chi tiết, hủy đơn
- `adminService.ts` - Các API dành cho admin
- `artistService.ts` - Các API dành cho họa sĩ
- `favoriteService.ts` - Thêm/xóa/lấy danh sách yêu thích
- `initData.ts` - Khởi tạo dữ liệu mẫu

#### 📂 **src/hooks/** - Custom React Hooks

- `useAuth.ts` - Hook quản lý authentication (login, logout, user state)
- `useCart.ts` - Hook quản lý giỏ hàng (add, remove, update quantity)
- `useFavorite.ts` - Hook quản lý yêu thích (add, remove, check)

#### 📂 **src/context/** - React Context API

- `AppContext.tsx` - Global state: user, cart, artworks, loading

#### 📂 **src/types/** - TypeScript Type Definitions

- `index.ts` - Định nghĩa các interface: User, Artwork, CartItem, Order, etc.

#### 📂 **src/assets/** - Static assets trong src

- `css/` - CSS files cho từng trang
- `images/` - Hình ảnh

#### 📂 **src/recoil/** - Recoil State Management

- `atoms.ts` - Recoil atoms cho state management nâng cao

### 1.3. Files cấu hình quan trọng

#### **package.json** - Quản lý dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",           // React framework
    "react-router-dom": "^6.x",   // Routing
    "axios": "^1.x",              // HTTP client
    "recoil": "^0.7.x",           // State management
    "typescript": "^5.x"          // TypeScript
  },
  "scripts": {
    "start": "react-scripts start",      // Chạy dev server
    "build": "react-scripts build",      // Build production
    "test": "react-scripts test"         // Chạy tests
  }
}
```

#### **.env** - Environment Variables
```
REACT_APP_API_URL=http://localhost:5273/api
```
- Định nghĩa URL của backend API
- Dùng trong `api.ts` để gọi API

#### **tsconfig.json** - TypeScript Configuration
- Cấu hình compiler TypeScript
- Target: ES6, Module: ESNext
- Strict type checking enabled

---

## 🔧 PHẦN 2: BACKEND (DoAn3_BackEnd/)

### 2.1. Cấu trúc thư mục Backend

```
DoAn3_BackEnd/
├── DoAn2_BackEnd/                    # Main project
│   ├── Controllers/                  # API Controllers
│   ├── BLL/                         # Business Logic Layer
│   ├── DAL/                         # Data Access Layer
│   ├── Models/                      # Entity Models
│   ├── DTO/                         # Data Transfer Objects
│   ├── Helpers/                     # Helper classes
│   ├── Middleware/                  # Custom middleware
│   ├── Attributes/                  # Custom attributes
│   ├── Properties/                  # Project properties
│   ├── Program.cs                   # Entry point
│   ├── appsettings.json            # Configuration
│   └── DoAn2_BackEnd.csproj        # Project file
├── Database_Setup_With_SampleData.sql  # Database setup script
├── Migration_TacPhamChinhSua.sql      # Migration: Artwork edit feature
├── Migration_YeuThich.sql             # Migration: Favorite feature
└── DoAn2_BackEnd.sln                  # Solution file
```

### 2.2. Controllers/ - API Endpoints

#### **AuthController.cs** - Xác thực
- `POST /api/auth/dang-nhap` - Đăng nhập
- `POST /api/auth/dang-ky` - Đăng ký
- `POST /api/auth/dang-xuat` - Đăng xuất
- `POST /api/auth/doi-mat-khau` - Đổi mật khẩu
- `GET /api/auth/me` - Lấy thông tin user hiện tại

#### **PublicController.cs** - API công khai
- `GET /api/tranh` - Lấy danh sách tác phẩm
- `GET /api/tranh/{id}` - Lấy chi tiết tác phẩm
- `GET /api/tranh/{id}/goi-y` - Lấy tác phẩm gợi ý
- `GET /api/danh-muc` - Lấy danh sách danh mục
- `GET /api/hoa-si` - Lấy danh sách họa sĩ

#### **GioHangController.cs** - Giỏ hàng
- `GET /api/gio-hang` - Lấy giỏ hàng của user
- `POST /api/gio-hang` - Thêm sản phẩm vào giỏ
- `PUT /api/gio-hang/{id}` - Cập nhật số lượng
- `DELETE /api/gio-hang/{id}` - Xóa sản phẩm khỏi giỏ

#### **DonHangController.cs** - Đơn hàng
- `GET /api/don-hang` - Lấy danh sách đơn hàng của user
- `GET /api/don-hang/{id}` - Lấy chi tiết đơn hàng
- `POST /api/don-hang` - Tạo đơn hàng mới
- `PUT /api/don-hang/{id}/huy` - Hủy đơn hàng

#### **YeuThichController.cs** - Yêu thích
- `GET /api/yeuthich` - Lấy danh sách yêu thích
- `POST /api/yeuthich/{maTacPham}` - Thêm yêu thích
- `DELETE /api/yeuthich/{maTacPham}` - Xóa yêu thích
- `GET /api/yeuthich/{maTacPham}/check` - Kiểm tra đã yêu thích chưa

#### **AdminController.cs** - Quản trị
- `GET /api/admin/don-hang` - Quản lý đơn hàng
- `PUT /api/admin/don-hang/{id}/trang-thai` - Cập nhật trạng thái đơn
- `GET /api/admin/khach-hang` - Quản lý khách hàng
- `GET /api/admin/tac-pham` - Quản lý tác phẩm
- `PUT /api/admin/tac-pham/{id}/duyet` - Duyệt tác phẩm
- `GET /api/admin/tac-pham-chinh-sua` - Lấy danh sách chỉnh sửa chờ duyệt
- `PUT /api/admin/tac-pham-chinh-sua/{id}/duyet` - Duyệt chỉnh sửa
- `GET /api/admin/bao-cao` - Báo cáo thống kê

#### **HoaSiController.cs** - Họa sĩ
- `GET /api/hoa-si/tac-pham` - Lấy tác phẩm của họa sĩ
- `POST /api/hoa-si/tac-pham` - Tạo tác phẩm mới
- `PUT /api/hoa-si/tac-pham/{id}` - Chỉnh sửa tác phẩm
- `DELETE /api/hoa-si/tac-pham/{id}` - Xóa tác phẩm
- `GET /api/hoa-si/doanh-thu` - Xem doanh thu

### 2.3. BLL/ - Business Logic Layer

**Interfaces/**:
- `IAuthBusiness.cs` - Interface cho authentication logic
- `IAdminBusiness.cs` - Interface cho admin logic
- `IHoaSiBusiness.cs` - Interface cho họa sĩ logic
- `IGioHangBusiness.cs` - Interface cho giỏ hàng logic
- `IDonHangBusiness.cs` - Interface cho đơn hàng logic

**Implementations/**:
- `AuthBusiness.cs` - Xử lý logic đăng nhập, đăng ký, JWT token
- `AdminBusiness.cs` - Xử lý logic quản trị (duyệt tác phẩm, thống kê)
- `HoaSiBusiness.cs` - Xử lý logic họa sĩ (CRUD tác phẩm, doanh thu)
- `GioHangBusiness.cs` - Xử lý logic giỏ hàng
- `DonHangBusiness.cs` - Xử lý logic đơn hàng

**Chức năng chính**:
- Validation dữ liệu
- Business rules enforcement
- Gọi DAL để truy xuất database
- Xử lý logic phức tạp (tính toán, kiểm tra điều kiện)

### 2.4. DAL/ - Data Access Layer

**Interfaces/**:
- `ITaiKhoanRepository.cs`
- `INguoiDungRepository.cs`
- `IHoaSiRepository.cs`
- `ITacPhamRepository.cs`
- `IGioHangRepository.cs`
- `IDonHangRepository.cs`
- `IYeuThichRepository.cs`
- `ITacPhamChinhSuaRepository.cs`

**Implementations/**:
- `TaiKhoanRepository.cs` - Truy xuất bảng TaiKhoan
- `NguoiDungRepository.cs` - Truy xuất bảng NguoiDung
- `HoaSiRepository.cs` - Truy xuất bảng HoaSi
- `TacPhamRepository.cs` - Truy xuất bảng TacPham
- `GioHangRepository.cs` - Truy xuất bảng GioHang
- `DonHangRepository.cs` - Truy xuất bảng HoaDonBan
- `YeuThichRepository.cs` - Truy xuất bảng YeuThich
- `TacPhamChinhSuaRepository.cs` - Truy xuất bảng TacPhamChinhSua
- `AdminRepository.cs` - Các query phức tạp cho admin

**Chức năng**:
- Kết nối SQL Server
- Execute stored procedures
- Execute raw SQL queries
- Mapping data từ database sang Models

### 2.5. Models/ - Entity Models

- `TaiKhoan.cs` - Model cho bảng TaiKhoan
- `NguoiDung.cs` - Model cho bảng NguoiDung
- `HoaSi.cs` - Model cho bảng HoaSi
- `TacPham.cs` - Model cho bảng TacPham
- `DanhMuc.cs` - Model cho bảng DanhMuc
- `GioHang.cs` - Model cho bảng GioHang
- `ChiTietGioHang.cs` - Model cho bảng ChiTietGioHang
- `HoaDonBan.cs` - Model cho bảng HoaDonBan
- `YeuThich.cs` - Model cho bảng YeuThich
- `TacPhamChinhSua.cs` - Model cho bảng TacPhamChinhSua

**Đặc điểm**:
- Mapping 1-1 với database tables
- Properties tương ứng với columns
- Data annotations cho validation

### 2.6. DTO/ - Data Transfer Objects

- `AuthDTO.cs` - DTO cho authentication (DangNhapRequest, DangNhapResponse)
- `TacPhamDTO.cs` - DTO cho tác phẩm (TacPhamResponse, CreateTacPhamRequest)
- `GioHangDTO.cs` - DTO cho giỏ hàng
- `DonHangDTO.cs` - DTO cho đơn hàng
- `HoaSiDTO.cs` - DTO cho họa sĩ (TacPhamChinhSuaResponse, DuyetRequest)
- `AdminDTO.cs` - DTO cho admin

**Mục đích**:
- Tách biệt Models với API response/request
- Chỉ trả về fields cần thiết
- Bảo mật (không expose sensitive data)

### 2.7. Helpers/ - Helper Classes

- `JwtHelper.cs` - Generate và validate JWT tokens
- `PasswordHelper.cs` - Hash và verify passwords (BCrypt)
- `DatabaseHelper.cs` - Database connection utilities

### 2.8. Middleware/ - Custom Middleware

- `JwtMiddleware.cs` - Validate JWT token cho mỗi request
- `ExceptionMiddleware.cs` - Global exception handling

### 2.9. Attributes/ - Custom Attributes

- `AuthorizeAttribute.cs` - Custom authorization attribute
- `RoleAttribute.cs` - Role-based authorization

### 2.10. Program.cs - Entry Point

**Cấu hình chính**:
```csharp
// 1. Add services to container
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// 2. Configure CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 3. Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidAudience = configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(configuration["Jwt:Key"])
            )
        };
    });

// 4. Register Dependency Injection
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
builder.Services.AddScoped<IAdminBusiness, AdminBusiness>();
// ... other services

// 5. Build and configure pipeline
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### 2.11. appsettings.json - Configuration

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=DUYSONW\\SQLEXPRESS;Database=HeThongBanTranh;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyHere123456789",
    "Issuer": "ArtGalleryAPI",
    "Audience": "ArtGalleryClient",
    "ExpireMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

---

## 💾 PHẦN 3: DATABASE

### 3.1. Database Schema

**Tên Database**: `HeThongBanTranh`

**Các bảng chính**:

1. **TaiKhoan** - Tài khoản đăng nhập
   - MaTaiKhoan (PK)
   - TenDangNhap (UNIQUE)
   - MatKhau (Hashed)
   - VaiTro (0=Admin, 1=User, 2=HoaSi)
   - TrangThai

2. **NguoiDung** - Thông tin khách hàng
   - MaNguoiDung (PK)
   - MaTaiKhoan (FK)
   - Ten, Email, DienThoai, DiaChi
   - Avatar, NgayTao

3. **HoaSi** - Thông tin họa sĩ
   - MaHoaSi (PK)
   - MaTaiKhoan (FK)
   - Ten, Email, DienThoai
   - TieuSu, AnhDaiDien
   - TrangThai

4. **DanhMuc** - Danh mục tác phẩm
   - MaDanhMuc (PK)
   - TenDanhMuc
   - MoTa

5. **TacPham** - Tác phẩm nghệ thuật
   - MaTacPham (PK)
   - MaHoaSi (FK)
   - MaDanhMuc (FK)
   - TenTranh, MoTa
   - GiaBan, SoLuongTon
   - AnhTranh
   - TrangThai (0=Chờ duyệt, 1=Đang bán, 2=Đã bán, 3=Từ chối)

6. **TacPhamChinhSua** - Lưu chỉnh sửa tác phẩm chờ duyệt
   - MaChinhSua (PK)
   - MaTacPham (FK)
   - MaHoaSi (FK)
   - TenTranh, MoTa, GiaBan (các field được chỉnh sửa)
   - TrangThai (0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối)
   - NgayChinhSua

7. **GioHang** - Giỏ hàng
   - MaGioHang (PK)
   - MaNguoiDung (FK)
   - NgayTao

8. **ChiTietGioHang** - Chi tiết giỏ hàng
   - MaChiTiet (PK)
   - MaGioHang (FK)
   - MaTacPham (FK)
   - SoLuong, GiaBan

9. **HoaDonBan** - Đơn hàng
   - MaHoaDon (PK)
   - MaNguoiDung (FK)
   - NgayDat, TongTien
   - TrangThai (0=Chờ xác nhận, 1=Đã xác nhận, 2=Đang giao, 3=Hoàn thành, 4=Đã hủy)
   - DiaChiGiaoHang, SoDienThoai

10. **YeuThich** - Danh sách yêu thích
    - MaYeuThich (PK)
    - MaNguoiDung (FK)
    - MaTacPham (FK)
    - NgayThem
    - UNIQUE(MaNguoiDung, MaTacPham)

### 3.2. SQL Files

#### **Database_Setup_With_SampleData.sql**
- Tạo toàn bộ database schema
- Tạo tất cả tables với constraints
- Insert dữ liệu mẫu:
  - 3 tài khoản (admin, user, họa sĩ)
  - 2 họa sĩ
  - 5 danh mục
  - 20+ tác phẩm
  - Đơn hàng mẫu

**Cách chạy**:
```sql
-- Mở SQL Server Management Studio
-- File > Open > File > chọn Database_Setup_With_SampleData.sql
-- Execute (F5)
```

#### **Migration_TacPhamChinhSua.sql**
- Tạo bảng `TacPhamChinhSua`
- Tạo indexes để tăng performance
- Tạo foreign keys
- Insert dữ liệu mẫu

**Mục đích**: 
- Khi họa sĩ chỉnh sửa tác phẩm đang bán (TrangThai=1)
- Lưu vào bảng TacPhamChinhSua (TrangThai=0 - Chờ duyệt)
- Admin duyệt → Copy sang TacPham
- Tác phẩm gốc vẫn hiển thị cho user trong lúc chờ duyệt

#### **Migration_YeuThich.sql**
- Tạo bảng `YeuThich`
- Tạo indexes (MaNguoiDung, MaTacPham, NgayThem)
- Tạo UNIQUE constraint (MaNguoiDung, MaTacPham)
- Insert dữ liệu mẫu

**Mục đích**:
- User có thể lưu tác phẩm yêu thích
- Xem lại danh sách yêu thích
- Mua sau

---

## 🔐 PHẦN 4: AUTHENTICATION & AUTHORIZATION

### 4.1. JWT Authentication Flow

```
1. User đăng nhập → POST /api/auth/dang-nhap
   ↓
2. Backend validate username/password
   ↓
3. Generate JWT token (expire 60 phút)
   ↓
4. Return token + user info
   ↓
5. Frontend lưu token vào localStorage
   ↓
6. Mỗi request sau đó gửi token trong header:
   Authorization: Bearer <token>
   ↓
7. Backend validate token (JwtMiddleware)
   ↓
8. Nếu valid → cho phép truy cập
   Nếu invalid/expired → 401 Unauthorized
```

### 4.2. Role-Based Authorization

**3 Roles**:
- **Admin (VaiTro = 0)**: Toàn quyền quản trị
- **User (VaiTro = 1)**: Khách hàng mua hàng
- **HoaSi (VaiTro = 2)**: Họa sĩ đăng bán tác phẩm

**Phân quyền**:
- Admin: Truy cập `/admin/*`, duyệt tác phẩm, quản lý đơn hàng
- HoaSi: Truy cập `/artist/*`, CRUD tác phẩm của mình
- User: Truy cập `/user/*`, mua hàng, xem đơn hàng

---

## 🚀 PHẦN 5: TÍNH NĂNG CHÍNH

### 5.1. Tính năng cho User (Khách hàng)

1. **Xem tác phẩm**
   - Danh sách tất cả tác phẩm
   - Filter theo danh mục
   - Search theo tên
   - Xem chi tiết tác phẩm
   - Xem tác phẩm gợi ý (cùng danh mục, cùng họa sĩ, giá tương đương)

2. **Giỏ hàng**
   - Thêm tác phẩm vào giỏ
   - Cập nhật số lượng
   - Xóa khỏi giỏ
   - Xem tổng tiền

3. **Đặt hàng**
   - Nhập thông tin giao hàng
   - Tạo đơn hàng
   - Xem danh sách đơn hàng
   - Xem chi tiết đơn hàng
   - Hủy đơn hàng (nếu chưa xác nhận)

4. **Yêu thích**
   - Thêm tác phẩm vào danh sách yêu thích
   - Xem danh sách yêu thích
   - Xóa khỏi danh sách

5. **Quản lý tài khoản**
   - Xem/sửa thông tin cá nhân
   - Đổi mật khẩu
   - Xem lịch sử đơn hàng

### 5.2. Tính năng cho Họa sĩ (Artist)

1. **Quản lý tác phẩm**
   - Tạo tác phẩm mới (TrangThai=0 - Chờ admin duyệt)
   - Xem danh sách tác phẩm của mình
   - Chỉnh sửa tác phẩm:
     - Nếu TrangThai=0 (Chờ duyệt): Sửa trực tiếp
     - Nếu TrangThai=1 (Đang bán): Lưu vào TacPhamChinhSua, chờ admin duyệt
   - Xóa tác phẩm (chỉ nếu chưa có đơn hàng)

2. **Quản lý chi tiết tác phẩm**
   - Thêm/sửa/xóa mô tả chi tiết
   - Upload gallery images
   - Thêm thông tin kỹ thuật

3. **Xem doanh thu**
   - Tổng doanh thu
   - Doanh thu theo tháng
   - Số lượng tác phẩm đã bán

4. **Quản lý bài viết**
   - Viết bài giới thiệu
   - Chia sẻ kinh nghiệm

### 5.3. Tính năng cho Admin

1. **Quản lý đơn hàng**
   - Xem tất cả đơn hàng
   - Cập nhật trạng thái đơn hàng
   - Xem chi tiết đơn hàng
   - Thống kê đơn hàng

2. **Quản lý tác phẩm**
   - Xem tất cả tác phẩm
   - Duyệt tác phẩm mới (TrangThai: 0→1 hoặc 0→3)
   - Duyệt chỉnh sửa tác phẩm:
     - Xem danh sách chỉnh sửa chờ duyệt
     - So sánh nội dung cũ vs mới
     - Duyệt: Copy từ TacPhamChinhSua → TacPham
     - Từ chối: Giữ nguyên TacPham gốc

3. **Quản lý người dùng**
   - Xem danh sách khách hàng
   - Xem danh sách họa sĩ
   - Kích hoạt/vô hiệu hóa tài khoản

4. **Báo cáo thống kê**
   - Doanh thu theo tháng/năm
   - Tác phẩm bán chạy
   - Họa sĩ có doanh thu cao
   - Số lượng đơn hàng

---

## 🎯 PHẦN 6: WORKFLOW QUAN TRỌNG

### 6.1. Workflow: Họa sĩ chỉnh sửa tác phẩm đang bán

**Vấn đề**: 
- Tác phẩm đang bán (TrangThai=1) đang hiển thị cho user
- Nếu họa sĩ sửa trực tiếp → User thấy nội dung chưa được duyệt
- Nếu đổi TrangThai=0 → Tác phẩm biến mất khỏi trang web

**Giải pháp**:
```
1. Họa sĩ click "Chỉnh sửa" tác phẩm (TrangThai=1)
   ↓
2. Frontend gọi PUT /api/hoa-si/tac-pham/{id}
   ↓
3. Backend kiểm tra:
   - Nếu TrangThai=0: Sửa trực tiếp vào TacPham
   - Nếu TrangThai=1: 
     * Lưu vào TacPhamChinhSua (TrangThai=0)
     * TacPham gốc giữ nguyên
   ↓
4. Admin vào "Duyệt Chỉnh Sửa"
   ↓
5. Admin xem so sánh:
   - Nội dung cũ (từ TacPham)
   - Nội dung mới (từ TacPhamChinhSua)
   ↓
6. Admin duyệt:
   - Nếu Duyệt: Copy TacPhamChinhSua → TacPham
   - Nếu Từ chối: Giữ nguyên TacPham
   ↓
7. User luôn thấy nội dung đã được duyệt
```

### 6.2. Workflow: Đặt hàng

```
1. User thêm tác phẩm vào giỏ
   ↓
2. Click "Thanh toán"
   ↓
3. Nhập thông tin giao hàng
   ↓
4. Click "Đặt hàng"
   ↓
5. Backend:
   - Tạo HoaDonBan (TrangThai=0 - Chờ xác nhận)
   - Tạo ChiTietHoaDon
   - Trừ SoLuongTon của TacPham
   - Xóa giỏ hàng
   ↓
6. Admin xác nhận đơn hàng (TrangThai: 0→1)
   ↓
7. Admin cập nhật "Đang giao" (TrangThai: 1→2)
   ↓
8. Admin cập nhật "Hoàn thành" (TrangThai: 2→3)
```

### 6.3. Workflow: Tác phẩm gợi ý

**Thuật toán**:
```
1. User xem chi tiết tác phẩm A
   ↓
2. Backend tính điểm cho các tác phẩm khác:
   - Cùng danh mục: +3 điểm
   - Cùng họa sĩ: +2 điểm
   - Giá tương đương (±20%): +1 điểm
   ↓
3. Sắp xếp theo điểm giảm dần
   ↓
4. Lấy top 8 tác phẩm
   ↓
5. Hiển thị dưới chi tiết tác phẩm
```

---

## 🛠️ PHẦN 7: CÁCH CHẠY PROJECT

### 7.1. Yêu cầu hệ thống

**Phần mềm cần cài đặt**:
- Node.js 18+ (cho React)
- .NET 8.0 SDK (cho ASP.NET Core)
- SQL Server 2022 (hoặc SQL Server Express)
- Visual Studio 2022 hoặc VS Code
- SQL Server Management Studio (SSMS)

### 7.2. Setup Database

```sql
-- 1. Mở SSMS, kết nối SQL Server
-- 2. Mở file Database_Setup_With_SampleData.sql
-- 3. Execute (F5)
-- 4. Kiểm tra database đã tạo:
USE HeThongBanTranh;
SELECT * FROM TaiKhoan;
SELECT * FROM TacPham;

-- 5. Chạy migrations:
-- Mở Migration_TacPhamChinhSua.sql → Execute
-- Mở Migration_YeuThich.sql → Execute
```

### 7.3. Chạy Backend

**Cách 1: Visual Studio**
```
1. Mở DoAn2_BackEnd.sln
2. Kiểm tra appsettings.json:
   - ConnectionString đúng với SQL Server của bạn
3. Press F5 hoặc click "Run"
4. Backend chạy tại: http://localhost:5273
```

**Cách 2: Command Line**
```bash
cd DoAn3_BackEnd/DoAn2_BackEnd
dotnet restore
dotnet run
```

### 7.4. Chạy Frontend

```bash
cd art-gallery-react
npm install          # Cài dependencies (lần đầu)
npm start            # Chạy dev server
```

Frontend chạy tại: http://localhost:3000

### 7.5. Chạy cả 2 cùng lúc

**Windows**:
```bash
# Double click file start-dev.bat
# Hoặc chạy trong PowerShell:
.\start-dev.ps1
```

### 7.6. Tài khoản test

**Admin**:
- Username: `admin`
- Password: `admin123`

**Họa sĩ**:
- Username: `hoasi1`
- Password: `hoasi123`

**User**:
- Username: `user1`
- Password: `user123`

---

## 📊 PHẦN 8: ĐIỂM NỔI BẬT CỦA ĐỒ ÁN

### 8.1. Kiến trúc & Design Patterns

1. **3-Layer Architecture**
   - Presentation Layer (Controllers)
   - Business Logic Layer (BLL)
   - Data Access Layer (DAL)
   - Tách biệt rõ ràng, dễ maintain

2. **Repository Pattern**
   - Interface + Implementation
   - Dễ test, dễ thay đổi database

3. **Dependency Injection**
   - Loose coupling
   - Testable code

4. **DTO Pattern**
   - Tách biệt Models vs API response
   - Bảo mật, không expose sensitive data

### 8.2. Bảo mật

1. **JWT Authentication**
   - Stateless authentication
   - Token expire sau 60 phút
   - Refresh token support

2. **Password Hashing**
   - BCrypt algorithm
   - Salt + Hash
   - Không lưu plain text password

3. **Role-Based Authorization**
   - 3 roles: Admin, User, HoaSi
   - Phân quyền rõ ràng

4. **CORS Configuration**
   - Chỉ cho phép origin từ localhost:3000
   - Bảo vệ khỏi cross-origin attacks

5. **SQL Injection Prevention**
   - Sử dụng parameterized queries
   - Không concatenate SQL strings

### 8.3. Performance

1. **Database Indexes**
   - Index trên foreign keys
   - Index trên columns thường query
   - Tăng tốc độ truy vấn

2. **Lazy Loading**
   - Chỉ load data khi cần
   - Giảm memory usage

3. **Caching**
   - Frontend cache artworks trong Context
   - Giảm số lần gọi API

4. **Pagination**
   - Không load hết data một lúc
   - Load theo trang

### 8.4. User Experience

1. **Responsive Design**
   - Mobile-friendly
   - Tablet-friendly
   - Desktop-optimized

2. **Loading States**
   - Spinner khi đang load
   - Skeleton screens
   - User biết hệ thống đang xử lý

3. **Error Handling**
   - Hiển thị lỗi rõ ràng
   - User-friendly messages
   - Không crash app

4. **Validation**
   - Frontend validation (UX)
   - Backend validation (Security)
   - Hiển thị lỗi ngay lập tức

---

## 💡 PHẦN 9: CÂU HỎI THƯỜNG GẶP KHI BẢO VỆ

### Q1: Tại sao chọn React thay vì Angular hoặc Vue?

**Trả lời**:
- React có ecosystem lớn nhất, nhiều thư viện hỗ trợ
- Component-based architecture dễ tái sử dụng
- Virtual DOM giúp performance tốt
- TypeScript support tốt, giúp catch lỗi sớm
- Cộng đồng lớn, dễ tìm tài liệu

### Q2: Tại sao dùng JWT thay vì Session?

**Trả lời**:
- **Stateless**: Server không cần lưu session, dễ scale
- **Cross-domain**: Có thể dùng cho mobile app, multiple domains
- **Performance**: Không cần query database mỗi request
- **Decentralized**: Có thể verify token ở bất kỳ server nào

### Q3: Giải thích luồng đăng nhập?

**Trả lời**:
```
1. User nhập username/password → Frontend
2. Frontend POST /api/auth/dang-nhap
3. Backend:
   - Query TaiKhoan từ database
   - Verify password với BCrypt
   - Nếu đúng: Generate JWT token
   - Return token + user info
4. Frontend:
   - Lưu token vào localStorage
   - Lưu user info vào Context
   - Redirect về trang chủ
5. Các request sau:
   - Thêm header: Authorization: Bearer <token>
   - Backend verify token
   - Nếu valid: Cho phép truy cập
```

### Q4: Làm sao phân biệt Admin, User, Họa sĩ?

**Trả lời**:
- Lưu VaiTro trong database (0=Admin, 1=User, 2=HoaSi)
- Khi đăng nhập, VaiTro được encode vào JWT token
- Backend decode token, lấy VaiTro
- Check VaiTro trước khi cho phép truy cập API
- Frontend check VaiTro để hiển thị menu phù hợp

### Q5: Tại sao cần bảng TacPhamChinhSua?

**Trả lời**:
**Vấn đề**: 
- Tác phẩm đang bán (TrangThai=1) đang hiển thị cho user
- Họa sĩ muốn sửa giá, mô tả
- Nếu sửa trực tiếp → User thấy nội dung chưa được admin duyệt
- Nếu đổi TrangThai=0 → Tác phẩm biến mất

**Giải pháp**:
- Lưu chỉnh sửa vào bảng TacPhamChinhSua
- TacPham gốc giữ nguyên → User vẫn thấy
- Admin duyệt → Copy sang TacPham
- Admin từ chối → Giữ nguyên TacPham

### Q6: Giải thích cách tính tác phẩm gợi ý?

**Trả lời**:
```
Scoring system:
- Cùng danh mục (tranh sơn dầu, tranh sơn mài): +3 điểm
- Cùng họa sĩ: +2 điểm
- Giá tương đương (±20%): +1 điểm

Ví dụ:
Tác phẩm A: Tranh sơn dầu, Họa sĩ X, Giá 5 triệu

Tác phẩm B: Tranh sơn dầu, Họa sĩ X, Giá 5.5 triệu
→ Điểm: 3 + 2 + 1 = 6 điểm (gợi ý tốt nhất)

Tác phẩm C: Tranh sơn dầu, Họa sĩ Y, Giá 10 triệu
→ Điểm: 3 + 0 + 0 = 3 điểm

Sắp xếp theo điểm giảm dần, lấy top 8
```

### Q7: Xử lý lỗi như thế nào?

**Trả lời**:

**Frontend**:
```typescript
try {
  const response = await api.post('/api/auth/dang-nhap', data);
  // Success
} catch (error) {
  if (error.response?.status === 401) {
    alert('Sai tên đăng nhập hoặc mật khẩu');
  } else if (error.response?.status === 500) {
    alert('Lỗi server, vui lòng thử lại');
  } else {
    alert('Có lỗi xảy ra');
  }
}
```

**Backend**:
```csharp
try {
  // Business logic
  return Ok(result);
} catch (Exception ex) {
  _logger.LogError(ex, "Error message");
  return StatusCode(500, new { 
    message = "Lỗi server", 
    error = ex.Message 
  });
}
```

**API Interceptor**:
- Tự động redirect về /login nếu 401
- Hiển thị toast notification nếu 403, 500

### Q8: Làm sao đảm bảo bảo mật?

**Trả lời**:

1. **Authentication**: JWT token, expire sau 60 phút
2. **Authorization**: Role-based, check VaiTro
3. **Password**: BCrypt hash, không lưu plain text
4. **SQL Injection**: Parameterized queries
5. **XSS**: React tự động escape HTML
6. **CORS**: Chỉ cho phép localhost:3000
7. **HTTPS**: Production nên dùng HTTPS
8. **Validation**: Frontend + Backend validation

### Q9: Database có bao nhiêu bảng? Mối quan hệ?

**Trả lời**:

**10 bảng chính**:
1. TaiKhoan (1) → (1) NguoiDung
2. TaiKhoan (1) → (1) HoaSi
3. HoaSi (1) → (N) TacPham
4. DanhMuc (1) → (N) TacPham
5. TacPham (1) → (N) ChiTietGioHang
6. TacPham (1) → (N) YeuThich
7. TacPham (1) → (1) TacPhamChinhSua
8. NguoiDung (1) → (1) GioHang
9. GioHang (1) → (N) ChiTietGioHang
10. NguoiDung (1) → (N) HoaDonBan

**Ràng buộc**:
- Foreign Keys với ON DELETE CASCADE
- UNIQUE constraints (TenDangNhap, MaNguoiDung+MaTacPham trong YeuThich)
- CHECK constraints (VaiTro IN (0,1,2), TrangThai IN (0,1,2,3,4))

### Q10: Có áp dụng design pattern nào?

**Trả lời**:

1. **Repository Pattern**: Tách DAL khỏi BLL
2. **Dependency Injection**: Loose coupling
3. **DTO Pattern**: Tách Models vs API response
4. **Singleton Pattern**: DbConnection
5. **Factory Pattern**: Create objects
6. **MVC Pattern**: Model-View-Controller (Backend)
7. **Component Pattern**: React components (Frontend)
8. **Observer Pattern**: React Context, useEffect

---

## 🎓 PHẦN 10: TIPS BẢO VỆ THÀNH CÔNG

### 10.1. Chuẩn bị trước

✅ **Hiểu rõ luồng hoạt động**:
- Đăng nhập → JWT → Lưu token → Gọi API
- Thêm giỏ hàng → Thanh toán → Tạo đơn hàng
- Họa sĩ sửa tác phẩm → Lưu TacPhamChinhSua → Admin duyệt

✅ **Biết vị trí files quan trọng**:
- Controllers: `DoAn3_BackEnd/DoAn2_BackEnd/Controllers/`
- Frontend pages: `art-gallery-react/src/pages/`
- Database script: `DoAn3_BackEnd/Database_Setup_With_SampleData.sql`

✅ **Chạy thử project**:
- Đảm bảo backend chạy được
- Đảm bảo frontend chạy được
- Test các tính năng chính

✅ **Chuẩn bị demo**:
- Đăng nhập các role khác nhau
- Thêm giỏ hàng, đặt hàng
- Admin duyệt tác phẩm
- Họa sĩ sửa tác phẩm

### 10.2. Trong lúc bảo vệ

✅ **Tự tin**:
- Nói to, rõ ràng
- Nhìn vào giáo viên khi trình bày
- Không đọc slide

✅ **Trình bày có logic**:
1. Giới thiệu tổng quan
2. Kiến trúc hệ thống
3. Database schema
4. Demo tính năng
5. Kết luận

✅ **Khi bị hỏi**:
- Nghe kỹ câu hỏi
- Suy nghĩ 2-3 giây
- Trả lời ngắn gọn, đúng trọng tâm
- Nếu không biết: "Em chưa tìm hiểu sâu về phần này"

✅ **Khi demo**:
- Mở sẵn browser, đăng nhập sẵn
- Chuẩn bị các scenario demo
- Nếu lỗi: Giải thích nguyên nhân, cách fix

### 10.3. Câu hỏi có thể gặp

**Về công nghệ**:
- Tại sao chọn React/ASP.NET Core?
- JWT hoạt động như thế nào?
- Giải thích 3-layer architecture?

**Về tính năng**:
- Luồng đặt hàng như thế nào?
- Làm sao phân quyền Admin/User/Họa sĩ?
- Tại sao cần bảng TacPhamChinhSua?

**Về bảo mật**:
- Làm sao bảo vệ khỏi SQL Injection?
- Password được lưu như thế nào?
- Xử lý lỗi 401 Unauthorized?

**Về database**:
- Có bao nhiêu bảng? Mối quan hệ?
- Tại sao cần indexes?
- Foreign key có ON DELETE CASCADE không?

### 10.4. Checklist trước khi bảo vệ

- [ ] Backend chạy được (http://localhost:5273)
- [ ] Frontend chạy được (http://localhost:3000)
- [ ] Database có dữ liệu mẫu
- [ ] Biết username/password test
- [ ] Hiểu rõ luồng đăng nhập
- [ ] Hiểu rõ luồng đặt hàng
- [ ] Hiểu rõ luồng duyệt tác phẩm
- [ ] Biết vị trí files quan trọng
- [ ] Chuẩn bị trả lời câu hỏi thường gặp
- [ ] Tự tin, không lo lắng

---

## 🎉 KẾT LUẬN

Đồ án này đã xây dựng một **Hệ thống bán tranh nghệ thuật trực tuyến** hoàn chỉnh với:

✅ **Frontend**: React + TypeScript, responsive, user-friendly
✅ **Backend**: ASP.NET Core Web API, RESTful, 3-layer architecture
✅ **Database**: SQL Server, 10 bảng, relationships rõ ràng
✅ **Authentication**: JWT, role-based authorization
✅ **Security**: Password hashing, SQL injection prevention, CORS
✅ **Features**: Đầy đủ tính năng cho User, Họa sĩ, Admin

**Điểm mạnh**:
- Kiến trúc rõ ràng, dễ maintain
- Bảo mật tốt
- UX/UI đẹp, responsive
- Code clean, có comments

**Hướng phát triển**:
- Thêm payment gateway (VNPay, Momo)
- Thêm chat realtime (SignalR)
- Thêm notification system
- Deploy lên cloud (Azure, AWS)

---

**Chúc bạn bảo vệ thành công! 🎓🎉**
