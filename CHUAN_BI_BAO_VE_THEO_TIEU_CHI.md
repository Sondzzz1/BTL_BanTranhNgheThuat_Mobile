# CHUẨN BỊ BẢO VỆ ĐỒ ÁN THEO 5 TIÊU CHÍ ĐÁNH GIÁ

---

## 📋 TIÊU CHÍ 1: PHÂN TÍCH NGHIỆP VỤ BÀI TOÁN

### 1.1. Bài toán thực tế

**Vấn đề cần giải quyết**:
- Các gallery tranh truyền thống chỉ bán offline, hạn chế khách hàng
- Họa sĩ khó tiếp cận thị trường, phụ thuộc vào gallery
- Khách hàng khó tìm kiếm, so sánh tác phẩm từ nhiều họa sĩ
- Quy trình mua bán chưa minh bạch, thiếu quản lý

**Giải pháp đề xuất**:
- Xây dựng nền tảng trực tuyến kết nối họa sĩ - khách hàng - gallery
- Họa sĩ tự quản lý tác phẩm, theo dõi doanh thu
- Khách hàng dễ dàng tìm kiếm, so sánh, đặt hàng online
- Admin quản lý tập trung, kiểm duyệt chất lượng

### 1.2. Phân tích các Actor (Người dùng)

#### **Actor 1: Khách hàng (User)**
**Nhu cầu**:
- Xem danh sách tác phẩm nghệ thuật
- Tìm kiếm theo danh mục, họa sĩ, giá
- Xem chi tiết tác phẩm (hình ảnh, mô tả, giá)
- Thêm vào giỏ hàng, đặt hàng
- Lưu tác phẩm yêu thích để mua sau
- Theo dõi đơn hàng, hủy đơn nếu cần
- Xem tác phẩm gợi ý tương tự

**Use cases chính**:
1. Đăng ký/Đăng nhập
2. Xem danh sách tác phẩm
3. Tìm kiếm, lọc tác phẩm
4. Xem chi tiết tác phẩm
5. Thêm vào giỏ hàng
6. Đặt hàng
7. Quản lý đơn hàng
8. Quản lý danh sách yêu thích

#### **Actor 2: Họa sĩ (Artist)**
**Nhu cầu**:
- Đăng bán tác phẩm của mình
- Quản lý thông tin tác phẩm (CRUD)
- Chỉnh sửa tác phẩm đang bán (cần admin duyệt)
- Xem doanh thu, số lượng đã bán
- Quản lý hồ sơ cá nhân
- Viết bài giới thiệu

**Use cases chính**:
1. Đăng nhập
2. Tạo tác phẩm mới (chờ admin duyệt)
3. Chỉnh sửa tác phẩm
4. Xóa tác phẩm
5. Xem doanh thu
6. Quản lý chi tiết tác phẩm
7. Quản lý bài viết

#### **Actor 3: Quản trị viên (Admin)**
**Nhu cầu**:
- Kiểm duyệt tác phẩm mới từ họa sĩ
- Kiểm duyệt chỉnh sửa tác phẩm
- Quản lý đơn hàng (xác nhận, cập nhật trạng thái)
- Quản lý người dùng, họa sĩ
- Xem báo cáo thống kê
- Quản lý danh mục, nội dung

**Use cases chính**:
1. Đăng nhập
2. Duyệt tác phẩm mới
3. Duyệt chỉnh sửa tác phẩm
4. Quản lý đơn hàng
5. Quản lý khách hàng
6. Quản lý họa sĩ
7. Xem báo cáo thống kê

### 1.3. Quy trình nghiệp vụ chính

#### **Quy trình 1: Đăng ký và Đăng nhập**

**Sequence Diagram**:
```
User → Frontend: Nhập username, password
Frontend → Backend: POST /api/auth/dang-nhap
Backend → Database: Query TaiKhoan
Database → Backend: Return TaiKhoan data
Backend → Backend: Verify password (BCrypt)
Backend → Backend: Generate JWT token
Backend → Frontend: Return token + user info
Frontend → Frontend: Lưu token vào localStorage
Frontend → User: Redirect về trang chủ
```

**Business Rules**:
- Username phải unique
- Password tối thiểu 6 ký tự
- Password được hash bằng BCrypt trước khi lưu
- Token expire sau 60 phút
- Sai password 5 lần → Lock tài khoản 15 phút

#### **Quy trình 2: Họa sĩ tạo tác phẩm mới**

**Sequence Diagram**:
```
HoaSi → Frontend: Nhập thông tin tác phẩm
Frontend → Backend: POST /api/hoa-si/tac-pham (with JWT token)
Backend → Backend: Verify token, check role = HoaSi
Backend → Database: INSERT TacPham (TrangThai = 0)
Database → Backend: Return MaTacPham
Backend → Frontend: Success response
Frontend → HoaSi: Hiển thị "Tác phẩm đã tạo, chờ admin duyệt"
```

**Business Rules**:
- Chỉ họa sĩ mới được tạo tác phẩm
- Tác phẩm mới có TrangThai = 0 (Chờ duyệt)
- Phải có đầy đủ: Tên, Mô tả, Giá, Danh mục, Ảnh
- Giá phải > 0
- Số lượng tồn phải >= 0


#### **Quy trình 3: Admin duyệt tác phẩm**

**Sequence Diagram**:
```
Admin → Frontend: Vào trang "Duyệt Tác Phẩm"
Frontend → Backend: GET /api/admin/tac-pham?trangThai=0
Backend → Database: Query TacPham WHERE TrangThai = 0
Database → Backend: Return danh sách tác phẩm chờ duyệt
Backend → Frontend: Return data
Frontend → Admin: Hiển thị danh sách

Admin → Frontend: Click "Duyệt" hoặc "Từ chối"
Frontend → Backend: PUT /api/admin/tac-pham/{id}/duyet
Backend → Database: UPDATE TacPham SET TrangThai = 1 (hoặc 3)
Database → Backend: Success
Backend → Frontend: Success response
Frontend → Admin: Cập nhật UI
```

**Business Rules**:
- Chỉ admin mới được duyệt
- TrangThai = 1: Đang bán (hiển thị trên web)
- TrangThai = 3: Từ chối (không hiển thị)
- Phải kiểm tra: Nội dung phù hợp, giá hợp lý, ảnh rõ ràng

#### **Quy trình 4: Họa sĩ chỉnh sửa tác phẩm đang bán**

**Sequence Diagram**:
```
HoaSi → Frontend: Click "Chỉnh sửa" tác phẩm (TrangThai = 1)
Frontend → Backend: PUT /api/hoa-si/tac-pham/{id}
Backend → Backend: Check TrangThai
Backend → Database: 
  IF TrangThai = 0: UPDATE TacPham trực tiếp
  IF TrangThai = 1: INSERT TacPhamChinhSua (TrangThai = 0)
Database → Backend: Success
Backend → Frontend: Success response
Frontend → HoaSi: 
  IF TrangThai = 0: "Đã cập nhật"
  IF TrangThai = 1: "Đã gửi yêu cầu chỉnh sửa, chờ admin duyệt"
```

**Business Rules**:
- Tác phẩm TrangThai = 0: Sửa trực tiếp (chưa public)
- Tác phẩm TrangThai = 1: Lưu vào TacPhamChinhSua (đang public)
- TacPham gốc giữ nguyên → User vẫn thấy phiên bản cũ
- Admin duyệt → Copy TacPhamChinhSua sang TacPham


#### **Quy trình 5: Khách hàng đặt hàng**

**Sequence Diagram**:
```
User → Frontend: Thêm tác phẩm vào giỏ hàng
Frontend → Backend: POST /api/gio-hang
Backend → Database: INSERT ChiTietGioHang
Database → Backend: Success
Backend → Frontend: Success response

User → Frontend: Click "Thanh toán"
Frontend → User: Hiển thị form thông tin giao hàng
User → Frontend: Nhập địa chỉ, số điện thoại
Frontend → Backend: POST /api/don-hang
Backend → Database: 
  1. INSERT HoaDonBan (TrangThai = 0)
  2. INSERT ChiTietHoaDon
  3. UPDATE TacPham SET SoLuongTon = SoLuongTon - SoLuong
  4. DELETE ChiTietGioHang
Database → Backend: Success
Backend → Frontend: Return MaHoaDon
Frontend → User: "Đặt hàng thành công"
```

**Business Rules**:
- Phải đăng nhập mới được đặt hàng
- Kiểm tra SoLuongTon >= SoLuong đặt
- Nếu không đủ hàng → Báo lỗi
- Đơn hàng mới có TrangThai = 0 (Chờ xác nhận)
- Tự động trừ SoLuongTon khi đặt hàng
- Xóa giỏ hàng sau khi đặt hàng thành công

#### **Quy trình 6: Admin quản lý đơn hàng**

**Sequence Diagram**:
```
Admin → Frontend: Vào trang "Quản lý đơn hàng"
Frontend → Backend: GET /api/admin/don-hang
Backend → Database: Query HoaDonBan + ChiTietHoaDon
Database → Backend: Return danh sách đơn hàng
Backend → Frontend: Return data
Frontend → Admin: Hiển thị danh sách

Admin → Frontend: Cập nhật trạng thái đơn hàng
Frontend → Backend: PUT /api/admin/don-hang/{id}/trang-thai
Backend → Database: UPDATE HoaDonBan SET TrangThai = X
Database → Backend: Success
Backend → Frontend: Success response
Frontend → Admin: Cập nhật UI
```

**Các trạng thái đơn hàng**:
- 0: Chờ xác nhận (User vừa đặt)
- 1: Đã xác nhận (Admin xác nhận)
- 2: Đang giao (Đang vận chuyển)
- 3: Hoàn thành (Đã giao hàng)
- 4: Đã hủy (User hoặc Admin hủy)

**Business Rules**:
- User chỉ được hủy khi TrangThai = 0
- Admin có thể hủy bất kỳ lúc nào
- Khi hủy: Hoàn lại SoLuongTon



---

## 📐 TIÊU CHÍ 2: TƯ DUY PHÂN TÍCH THIẾT KẾ HỆ THỐNG

### 2.1. Kiến trúc tổng thể

**Mô hình**: Client-Server Architecture với RESTful API

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript                               │   │
│  │  - Components (UI)                                   │   │
│  │  - Services (API calls)                              │   │
│  │  - Context (State management)                        │   │
│  │  - Hooks (Business logic)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS (REST API)
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Backend)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ASP.NET Core 8.0 Web API                            │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Presentation Layer (Controllers)              │  │   │
│  │  │  - AuthController, AdminController, etc.       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Business Logic Layer (BLL)                    │  │   │
│  │  │  - AuthBusiness, AdminBusiness, etc.           │  │   │
│  │  │  - Validation, Business rules                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Data Access Layer (DAL)                       │  │   │
│  │  │  - Repositories                                │  │   │
│  │  │  - Database queries                            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ ADO.NET
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SQL Server 2022                                     │   │
│  │  - 10 tables chính                                   │   │
│  │  - Stored Procedures                                 │   │
│  │  - Indexes, Constraints                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Lý do chọn kiến trúc này**:
1. **Tách biệt Frontend - Backend**: Dễ phát triển song song, dễ scale
2. **RESTful API**: Chuẩn công nghiệp, dễ tích hợp với mobile app sau này
3. **3-Layer Architecture**: Tách biệt concerns, dễ maintain, dễ test


### 2.2. Design Patterns được sử dụng

#### **1. Repository Pattern**

**Vấn đề**: 
- Business logic trực tiếp gọi database → Khó test, khó thay đổi database

**Giải pháp**:
```csharp
// Interface
public interface ITacPhamRepository {
    Task<List<TacPham>> GetAllAsync();
    Task<TacPham> GetByIdAsync(int id);
    Task<int> CreateAsync(TacPham tacPham);
    Task<bool> UpdateAsync(TacPham tacPham);
    Task<bool> DeleteAsync(int id);
}

// Implementation
public class TacPhamRepository : ITacPhamRepository {
    private readonly string _connectionString;
    
    public async Task<List<TacPham>> GetAllAsync() {
        // Database logic here
    }
}

// Usage in BLL
public class HoaSiBusiness {
    private readonly ITacPhamRepository _tacPhamRepo;
    
    public HoaSiBusiness(ITacPhamRepository tacPhamRepo) {
        _tacPhamRepo = tacPhamRepo;
    }
    
    public async Task<List<TacPham>> GetTacPhamCuaHoaSi(int maHoaSi) {
        return await _tacPhamRepo.GetByHoaSiAsync(maHoaSi);
    }
}
```

**Lợi ích**:
- Dễ test (mock repository)
- Dễ thay đổi database (chỉ sửa repository)
- Tách biệt concerns

#### **2. Dependency Injection Pattern**

**Cấu hình trong Program.cs**:
```csharp
// Register services
builder.Services.AddScoped<ITacPhamRepository, TacPhamRepository>();
builder.Services.AddScoped<IHoaSiBusiness, HoaSiBusiness>();
builder.Services.AddScoped<IAdminBusiness, AdminBusiness>();
```

**Lợi ích**:
- Loose coupling
- Dễ test
- Dễ thay đổi implementation


#### **3. DTO (Data Transfer Object) Pattern**

**Vấn đề**:
- Trả về Model trực tiếp → Expose sensitive data (password, internal IDs)
- Frontend không cần tất cả fields

**Giải pháp**:
```csharp
// Model (Database entity)
public class TaiKhoan {
    public int MaTaiKhoan { get; set; }
    public string TenDangNhap { get; set; }
    public string MatKhau { get; set; }  // Sensitive!
    public int VaiTro { get; set; }
}

// DTO (API response)
public class DangNhapResponse {
    public string Token { get; set; }
    public string TenDangNhap { get; set; }
    public int VaiTro { get; set; }
    // Không có MatKhau!
}
```

**Lợi ích**:
- Bảo mật (không expose sensitive data)
- Giảm bandwidth (chỉ trả về fields cần thiết)
- Tách biệt API contract vs Database schema

#### **4. Middleware Pattern**

**JwtMiddleware.cs**:
```csharp
public class JwtMiddleware {
    private readonly RequestDelegate _next;
    
    public async Task Invoke(HttpContext context) {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();
        
        if (token != null) {
            AttachUserToContext(context, token);
        }
        
        await _next(context);
    }
}
```

**Lợi ích**:
- Centralized authentication logic
- Tự động validate token cho mọi request
- Dễ maintain


#### **5. Context API Pattern (Frontend)**

**AppContext.tsx**:
```typescript
interface AppContextType {
  user: User | null;
  cart: CartItem[];
  artworks: Artwork[];
  login: (user: User) => void;
  logout: () => void;
  addToCart: (item: CartItem) => void;
}

export const AppContext = createContext<AppContextType>(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // ... logic
  
  return (
    <AppContext.Provider value={{ user, cart, login, logout, addToCart }}>
      {children}
    </AppContext.Provider>
  );
};
```

**Lợi ích**:
- Global state management
- Tránh prop drilling
- Dễ access state từ bất kỳ component nào

### 2.3. Thiết kế Database

#### **Nguyên tắc thiết kế**:

1. **Normalization (Chuẩn hóa)**:
   - Đạt 3NF (Third Normal Form)
   - Tránh redundancy
   - Mỗi bảng có primary key

2. **Referential Integrity (Toàn vẹn tham chiếu)**:
   - Foreign keys với ON DELETE CASCADE/RESTRICT
   - Đảm bảo data consistency

3. **Indexing**:
   - Index trên foreign keys
   - Index trên columns thường query (TenDangNhap, Email)
   - Tăng performance


#### **Entity Relationship Diagram (ERD)**:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  TaiKhoan   │         │  NguoiDung  │         │   HoaSi     │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ MaTaiKhoan  │◄───────┤ MaTaiKhoan  │         │ MaTaiKhoan  │◄───┐
│ TenDangNhap │         │ MaNguoiDung │         │ MaHoaSi     │    │
│ MatKhau     │         │ Ten         │         │ Ten         │    │
│ VaiTro      │         │ Email       │         │ TieuSu      │    │
└─────────────┘         └─────────────┘         └─────────────┘    │
                               │                        │           │
                               │                        │           │
                               ▼                        ▼           │
                        ┌─────────────┐         ┌─────────────┐    │
                        │  GioHang    │         │  TacPham    │    │
                        ├─────────────┤         ├─────────────┤    │
                        │ MaGioHang   │         │ MaTacPham   │    │
                        │ MaNguoiDung │         │ MaHoaSi     │────┘
                        └─────────────┘         │ MaDanhMuc   │
                               │                │ TenTranh    │
                               │                │ GiaBan      │
                               ▼                │ TrangThai   │
                        ┌─────────────┐         └─────────────┘
                        │ChiTietGioHang│               │
                        ├─────────────┤               │
                        │ MaChiTiet   │               │
                        │ MaGioHang   │               │
                        │ MaTacPham   │◄──────────────┘
                        │ SoLuong     │
                        └─────────────┘
```

**Các mối quan hệ chính**:
- TaiKhoan 1-1 NguoiDung
- TaiKhoan 1-1 HoaSi
- HoaSi 1-N TacPham
- NguoiDung 1-1 GioHang
- GioHang 1-N ChiTietGioHang
- TacPham 1-N ChiTietGioHang
- NguoiDung 1-N HoaDonBan
- TacPham 1-N YeuThich
- TacPham 1-N TacPhamChinhSua


### 2.4. Quyết định thiết kế quan trọng

#### **Quyết định 1: Tại sao tách TaiKhoan, NguoiDung, HoaSi?**

**Lý do**:
- **TaiKhoan**: Thông tin đăng nhập (username, password, role)
- **NguoiDung**: Thông tin khách hàng (địa chỉ giao hàng, số điện thoại)
- **HoaSi**: Thông tin họa sĩ (tiểu sử, portfolio)

**Lợi ích**:
- Tách biệt concerns
- Dễ mở rộng (thêm role mới không ảnh hưởng)
- Bảo mật (TaiKhoan chỉ chứa thông tin authentication)

#### **Quyết định 2: Tại sao cần bảng TacPhamChinhSua?**

**Vấn đề**:
- Tác phẩm đang bán (TrangThai=1) đang hiển thị cho user
- Họa sĩ muốn sửa → Nếu sửa trực tiếp, user thấy nội dung chưa duyệt
- Nếu đổi TrangThai=0, tác phẩm biến mất khỏi web

**Giải pháp**:
- Tạo bảng TacPhamChinhSua để lưu chỉnh sửa
- TacPham gốc giữ nguyên
- Admin duyệt → Copy sang TacPham

**Lợi ích**:
- User luôn thấy nội dung đã duyệt
- Admin kiểm soát chất lượng
- Có thể rollback nếu cần

#### **Quyết định 3: Tại sao dùng JWT thay vì Session?**

**So sánh**:

| Tiêu chí | JWT | Session |
|----------|-----|---------|
| Stateless | ✅ Có | ❌ Không (cần lưu server) |
| Scalability | ✅ Dễ scale | ❌ Khó scale (sticky session) |
| Mobile support | ✅ Dễ dàng | ❌ Khó khăn |
| Security | ⚠️ Cần HTTPS | ✅ An toàn hơn |
| Performance | ✅ Nhanh | ❌ Cần query DB |

**Kết luận**: Chọn JWT vì dễ scale, phù hợp với RESTful API


#### **Quyết định 4: Tại sao dùng React thay vì Angular/Vue?**

**So sánh**:

| Tiêu chí | React | Angular | Vue |
|----------|-------|---------|-----|
| Learning curve | ⚠️ Trung bình | ❌ Khó | ✅ Dễ |
| Ecosystem | ✅ Lớn nhất | ⚠️ Trung bình | ⚠️ Trung bình |
| Performance | ✅ Tốt | ✅ Tốt | ✅ Tốt |
| TypeScript | ✅ Hỗ trợ tốt | ✅ Built-in | ⚠️ Hỗ trợ |
| Community | ✅ Lớn nhất | ⚠️ Trung bình | ⚠️ Nhỏ hơn |

**Kết luận**: Chọn React vì ecosystem lớn, nhiều thư viện, dễ tìm tài liệu

#### **Quyết định 5: Thuật toán gợi ý tác phẩm**

**Yêu cầu**:
- Gợi ý tác phẩm tương tự khi user xem chi tiết
- Tăng conversion rate

**Thuật toán**:
```
Scoring system:
- Cùng danh mục: +3 điểm
- Cùng họa sĩ: +2 điểm
- Giá tương đương (±20%): +1 điểm

Sắp xếp theo điểm giảm dần
Lấy top 8 tác phẩm
```

**Lý do**:
- Đơn giản, dễ implement
- Performance tốt (không cần ML)
- Hiệu quả với dataset nhỏ/trung bình

**Có thể nâng cấp**:
- Collaborative filtering (user behavior)
- Content-based filtering (image similarity)
- Hybrid approach

---

## 🤖 TIÊU CHÍ 3: SỬ DỤNG AI TRONG PHÁT TRIỂN

### 3.1. Công cụ AI đã sử dụng

**1. GitHub Copilot**
- **Mục đích**: Code completion, generate boilerplate code
- **Sử dụng ở đâu**: 
  - Generate CRUD operations trong Repository
  - Generate DTO classes
  - Generate API endpoints

**2. ChatGPT / Claude**
- **Mục đích**: Tư vấn kiến trúc, debug, giải thích concepts
- **Sử dụng ở đâu**:
  - Thiết kế database schema
  - Giải quyết bugs phức tạp
  - Tối ưu SQL queries


### 3.2. Ví dụ sử dụng AI

#### **Ví dụ 1: Generate Repository Pattern**

**Input (Prompt)**:
```
Tạo Repository Pattern cho bảng TacPham với các methods:
- GetAllAsync()
- GetByIdAsync(int id)
- CreateAsync(TacPham tacPham)
- UpdateAsync(TacPham tacPham)
- DeleteAsync(int id)
Sử dụng ADO.NET và SQL Server
```

**Output (AI Generated)**:
```csharp
public interface ITacPhamRepository {
    Task<List<TacPham>> GetAllAsync();
    Task<TacPham> GetByIdAsync(int id);
    Task<int> CreateAsync(TacPham tacPham);
    Task<bool> UpdateAsync(TacPham tacPham);
    Task<bool> DeleteAsync(int id);
}

public class TacPhamRepository : ITacPhamRepository {
    private readonly string _connectionString;
    
    public TacPhamRepository(IConfiguration configuration) {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }
    
    public async Task<List<TacPham>> GetAllAsync() {
        var tacPhams = new List<TacPham>();
        using (var connection = new SqlConnection(_connectionString)) {
            var command = new SqlCommand("SELECT * FROM TacPham", connection);
            await connection.OpenAsync();
            using (var reader = await command.ExecuteReaderAsync()) {
                while (await reader.ReadAsync()) {
                    tacPhams.Add(MapToTacPham(reader));
                }
            }
        }
        return tacPhams;
    }
    
    // ... other methods
}
```

**Đánh giá**:
- ✅ Code đúng cú pháp
- ✅ Follow best practices
- ⚠️ Cần review và customize cho business logic cụ thể


#### **Ví dụ 2: Debug lỗi 401 Unauthorized**

**Input (Prompt)**:
```
Tôi gặp lỗi 401 Unauthorized khi gọi API /api/hoa-si/tac-pham
Token đã được gửi trong header: Authorization: Bearer <token>
Backend ASP.NET Core với JWT authentication
```

**Output (AI Suggestion)**:
```
Kiểm tra các điểm sau:

1. Token có đúng format không?
   - Phải là: "Bearer <token>"
   - Không có khoảng trắng thừa

2. Token có expired không?
   - Check ExpireMinutes trong appsettings.json
   - Decode token tại jwt.io để xem exp claim

3. Middleware có được register đúng thứ tự không?
   app.UseAuthentication();  // Phải trước UseAuthorization
   app.UseAuthorization();

4. Controller có [Authorize] attribute không?
   [Authorize]
   [ApiController]
   public class HoaSiController : ControllerBase

5. CORS có được config đúng không?
   builder.Services.AddCors(options => {
       options.AddPolicy("AllowReactApp", policy => {
           policy.WithOrigins("http://localhost:3000")
                 .AllowAnyMethod()
                 .AllowAnyHeader()
                 .AllowCredentials();
       });
   });
```

**Kết quả**:
- ✅ Phát hiện lỗi: Middleware order sai
- ✅ Fix: Đổi thứ tự UseAuthentication() trước UseAuthorization()
- ✅ Lỗi được giải quyết


#### **Ví dụ 3: Tối ưu SQL Query**

**Input (Prompt)**:
```sql
-- Query chậm, mất 2 giây
SELECT t.*, h.Ten AS TenHoaSi, d.TenDanhMuc
FROM TacPham t
LEFT JOIN HoaSi h ON t.MaHoaSi = h.MaHoaSi
LEFT JOIN DanhMuc d ON t.MaDanhMuc = d.MaDanhMuc
WHERE t.TrangThai = 1
ORDER BY t.NgayTao DESC
```

**Output (AI Suggestion)**:
```sql
-- Thêm indexes để tăng performance
CREATE INDEX IX_TacPham_TrangThai ON TacPham(TrangThai);
CREATE INDEX IX_TacPham_NgayTao ON TacPham(NgayTao DESC);
CREATE INDEX IX_TacPham_MaHoaSi ON TacPham(MaHoaSi);
CREATE INDEX IX_TacPham_MaDanhMuc ON TacPham(MaDanhMuc);

-- Query sau khi optimize
SELECT 
    t.MaTacPham, t.TenTranh, t.GiaBan, t.AnhTranh,
    h.Ten AS TenHoaSi, 
    d.TenDanhMuc
FROM TacPham t WITH (INDEX(IX_TacPham_TrangThai))
LEFT JOIN HoaSi h ON t.MaHoaSi = h.MaHoaSi
LEFT JOIN DanhMuc d ON t.MaDanhMuc = d.MaDanhMuc
WHERE t.TrangThai = 1
ORDER BY t.NgayTao DESC;
```

**Kết quả**:
- ✅ Query time giảm từ 2s → 0.1s
- ✅ Hiểu được cách sử dụng indexes

### 3.3. Quy trình làm việc với AI

```
1. Phân tích yêu cầu
   ↓
2. Tự thiết kế kiến trúc tổng thể
   ↓
3. Sử dụng AI để:
   - Generate boilerplate code
   - Tư vấn best practices
   - Debug lỗi phức tạp
   ↓
4. Review code do AI generate
   ↓
5. Customize cho business logic cụ thể
   ↓
6. Test kỹ lưỡng
   ↓
7. Deploy
```

**Nguyên tắc**:
- ✅ AI là công cụ hỗ trợ, không thay thế tư duy
- ✅ Luôn review code do AI generate
- ✅ Hiểu rõ code trước khi sử dụng
- ❌ Không copy-paste mù quáng



---

## 💻 TIÊU CHÍ 4: GIẢI THÍCH VÀ CHỈNH SỬA CODE

### 4.1. Ví dụ giải thích code quan trọng

#### **Code 1: JWT Authentication Flow**

**File**: `DoAn3_BackEnd/DoAn2_BackEnd/BLL/AuthBusiness.cs`

```csharp
public async Task<DangNhapResponse> DangNhap(DangNhapRequest request) {
    // 1. Tìm tài khoản theo username
    var taiKhoan = await _taiKhoanRepo.GetByUsernameAsync(request.TenDangNhap);
    
    // 2. Kiểm tra tài khoản có tồn tại không
    if (taiKhoan == null) {
        throw new Exception("Tên đăng nhập không tồn tại");
    }
    
    // 3. Verify password với BCrypt
    if (!BCrypt.Net.BCrypt.Verify(request.MatKhau, taiKhoan.MatKhau)) {
        throw new Exception("Mật khẩu không đúng");
    }
    
    // 4. Kiểm tra trạng thái tài khoản
    if (taiKhoan.TrangThai == 0) {
        throw new Exception("Tài khoản đã bị khóa");
    }
    
    // 5. Generate JWT token
    var token = _jwtHelper.GenerateToken(
        taiKhoan.MaTaiKhoan, 
        taiKhoan.TenDangNhap, 
        taiKhoan.VaiTro
    );
    
    // 6. Trả về response
    return new DangNhapResponse {
        Token = token,
        TenDangNhap = taiKhoan.TenDangNhap,
        VaiTro = taiKhoan.VaiTro,
        MaTaiKhoan = taiKhoan.MaTaiKhoan
    };
}
```

**Giải thích từng bước**:

1. **Query database**: Tìm tài khoản theo username
   - Sử dụng Repository pattern
   - Async/await để không block thread

2. **Validation**: Kiểm tra tài khoản có tồn tại
   - Nếu không → Throw exception
   - Exception sẽ được catch ở Controller

3. **Password verification**: So sánh password
   - Sử dụng BCrypt.Verify()
   - BCrypt tự động handle salt
   - Không so sánh plain text

4. **Check status**: Kiểm tra tài khoản có bị khóa không
   - TrangThai = 0: Khóa
   - TrangThai = 1: Active

5. **Generate token**: Tạo JWT token
   - Encode: MaTaiKhoan, TenDangNhap, VaiTro
   - Expire: 60 phút (config trong appsettings.json)
   - Sign với secret key

6. **Return response**: Trả về DTO
   - Không trả về password
   - Chỉ trả về thông tin cần thiết


#### **Code 2: Họa sĩ chỉnh sửa tác phẩm**

**File**: `DoAn3_BackEnd/DoAn2_BackEnd/BLL/HoaSiBusiness.cs`

```csharp
public async Task<bool> ChinhSuaTacPham(int maTacPham, int maHoaSi, TacPhamDTO dto) {
    // 1. Lấy tác phẩm hiện tại
    var tacPham = await _tacPhamRepo.GetByIdAsync(maTacPham);
    
    // 2. Kiểm tra quyền sở hữu
    if (tacPham.MaHoaSi != maHoaSi) {
        throw new UnauthorizedException("Bạn không có quyền chỉnh sửa tác phẩm này");
    }
    
    // 3. Kiểm tra trạng thái
    if (tacPham.TrangThai == 0) {
        // Tác phẩm chưa duyệt → Sửa trực tiếp
        tacPham.TenTranh = dto.TenTranh;
        tacPham.MoTa = dto.MoTa;
        tacPham.GiaBan = dto.GiaBan;
        
        return await _tacPhamRepo.UpdateAsync(tacPham);
    } 
    else if (tacPham.TrangThai == 1) {
        // Tác phẩm đang bán → Lưu vào TacPhamChinhSua
        var chinhSua = new TacPhamChinhSua {
            MaTacPham = maTacPham,
            MaHoaSi = maHoaSi,
            TenTranh = dto.TenTranh,
            MoTa = dto.MoTa,
            GiaBan = dto.GiaBan,
            TrangThai = 0,  // Chờ duyệt
            NgayChinhSua = DateTime.Now
        };
        
        return await _tacPhamChinhSuaRepo.CreateAsync(chinhSua);
    }
    
    throw new Exception("Không thể chỉnh sửa tác phẩm này");
}
```

**Giải thích logic**:

1. **Lấy tác phẩm**: Query từ database
   - Cần thông tin TrangThai để quyết định logic

2. **Authorization**: Kiểm tra quyền sở hữu
   - Chỉ họa sĩ sở hữu mới được sửa
   - Tránh họa sĩ A sửa tác phẩm của họa sĩ B

3. **Business logic theo TrangThai**:
   
   **Case 1: TrangThai = 0 (Chờ duyệt)**
   - Tác phẩm chưa public
   - Sửa trực tiếp vào bảng TacPham
   - Không ảnh hưởng user
   
   **Case 2: TrangThai = 1 (Đang bán)**
   - Tác phẩm đang hiển thị cho user
   - Không sửa trực tiếp (user sẽ thấy nội dung chưa duyệt)
   - Lưu vào bảng TacPhamChinhSua
   - TrangThai = 0 (Chờ admin duyệt)
   - TacPham gốc giữ nguyên

**Lợi ích**:
- User luôn thấy nội dung đã duyệt
- Admin kiểm soát chất lượng
- Tránh spam, nội dung không phù hợp


#### **Code 3: API Interceptor (Frontend)**

**File**: `art-gallery-react/src/services/api.ts`

```typescript
// Tạo axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Thêm token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý lỗi 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired hoặc invalid
      
      // Danh sách trang public (không cần đăng nhập)
      const publicPages = ['/', '/login', '/register', '/about', '/artworks', '/news', '/contact'];
      const currentPath = window.location.pathname;
      
      // Chỉ redirect về login nếu KHÔNG phải trang public
      if (!publicPages.includes(currentPath)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Giải thích**:

1. **Axios instance**: Tạo instance với baseURL
   - Tất cả requests sẽ dùng chung baseURL
   - Dễ config, dễ maintain

2. **Request interceptor**: Tự động thêm token
   - Lấy token từ localStorage
   - Thêm vào header: `Authorization: Bearer <token>`
   - Không cần thêm token thủ công ở mỗi request

3. **Response interceptor**: Xử lý lỗi 401
   - 401 = Unauthorized (token invalid/expired)
   - Kiểm tra xem có phải trang public không
   - Nếu là trang private → Redirect về /login
   - Nếu là trang public → Không redirect (tránh loop)

**Vấn đề đã fix**:
- Trước đây: Ấn "Về trang chủ" từ admin → Bị logout
- Nguyên nhân: Interceptor redirect về /login khi gặp 401 ở trang public
- Giải pháp: Chỉ redirect nếu KHÔNG phải trang public


#### **Code 4: Thuật toán gợi ý tác phẩm**

**File**: `DoAn3_BackEnd/DoAn2_BackEnd/BLL/PublicBusiness.cs`

```csharp
public async Task<List<TacPhamDTO>> GetTacPhamGoiY(int maTacPham) {
    // 1. Lấy tác phẩm gốc
    var tacPhamGoc = await _tacPhamRepo.GetByIdAsync(maTacPham);
    
    // 2. Lấy tất cả tác phẩm khác (TrangThai = 1, không bao gồm tác phẩm gốc)
    var allTacPhams = await _tacPhamRepo.GetAllAsync();
    var otherTacPhams = allTacPhams
        .Where(t => t.MaTacPham != maTacPham && t.TrangThai == 1)
        .ToList();
    
    // 3. Tính điểm cho mỗi tác phẩm
    var scoredTacPhams = otherTacPhams.Select(t => new {
        TacPham = t,
        Score = CalculateScore(tacPhamGoc, t)
    }).ToList();
    
    // 4. Sắp xếp theo điểm giảm dần, lấy top 8
    var goiY = scoredTacPhams
        .OrderByDescending(x => x.Score)
        .Take(8)
        .Select(x => MapToDTO(x.TacPham))
        .ToList();
    
    return goiY;
}

private int CalculateScore(TacPham goc, TacPham other) {
    int score = 0;
    
    // Cùng danh mục: +3 điểm
    if (goc.MaDanhMuc == other.MaDanhMuc) {
        score += 3;
    }
    
    // Cùng họa sĩ: +2 điểm
    if (goc.MaHoaSi == other.MaHoaSi) {
        score += 2;
    }
    
    // Giá tương đương (±20%): +1 điểm
    var minPrice = goc.GiaBan * 0.8m;
    var maxPrice = goc.GiaBan * 1.2m;
    if (other.GiaBan >= minPrice && other.GiaBan <= maxPrice) {
        score += 1;
    }
    
    return score;
}
```

**Giải thích thuật toán**:

1. **Lấy dữ liệu**:
   - Tác phẩm gốc (user đang xem)
   - Tất cả tác phẩm khác (TrangThai = 1)

2. **Scoring system**:
   - **Cùng danh mục**: +3 điểm
     - Ví dụ: Cả 2 đều là "Tranh sơn dầu"
     - Lý do: User quan tâm đến loại tranh này
   
   - **Cùng họa sĩ**: +2 điểm
     - User thích phong cách họa sĩ này
     - Có thể mua thêm tác phẩm khác của họa sĩ
   
   - **Giá tương đương**: +1 điểm
     - ±20% giá gốc
     - Ví dụ: Gốc 5 triệu → Gợi ý 4-6 triệu
     - Lý do: User có budget tương tự

3. **Sắp xếp và lấy top**:
   - Sắp xếp theo điểm giảm dần
   - Lấy top 8 tác phẩm
   - Convert sang DTO

**Ví dụ cụ thể**:

Tác phẩm gốc: "Hoa Sen" - Sơn dầu - Họa sĩ A - 5 triệu

| Tác phẩm | Danh mục | Họa sĩ | Giá | Điểm |
|----------|----------|--------|-----|------|
| "Hoa Đào" | Sơn dầu | Họa sĩ A | 5.5 triệu | 3+2+1 = 6 |
| "Phong Cảnh" | Sơn dầu | Họa sĩ B | 4.8 triệu | 3+0+1 = 4 |
| "Chân Dung" | Sơn mài | Họa sĩ A | 5.2 triệu | 0+2+1 = 3 |
| "Trừu Tượng" | Sơn dầu | Họa sĩ C | 10 triệu | 3+0+0 = 3 |

→ Gợi ý theo thứ tự: Hoa Đào (6) > Phong Cảnh (4) > Chân Dung (3) > Trừu Tượng (3)


### 4.2. Kỹ năng chỉnh sửa code

#### **Tình huống 1: Thêm validation cho giá tác phẩm**

**Yêu cầu**: Giá tác phẩm phải từ 100,000 đến 1,000,000,000 VNĐ

**Code cũ**:
```csharp
public async Task<int> CreateTacPham(TacPhamDTO dto) {
    var tacPham = new TacPham {
        TenTranh = dto.TenTranh,
        GiaBan = dto.GiaBan,
        // ...
    };
    
    return await _tacPhamRepo.CreateAsync(tacPham);
}
```

**Code mới** (sau khi chỉnh sửa):
```csharp
public async Task<int> CreateTacPham(TacPhamDTO dto) {
    // Validation
    if (dto.GiaBan < 100000) {
        throw new ValidationException("Giá tối thiểu là 100,000 VNĐ");
    }
    
    if (dto.GiaBan > 1000000000) {
        throw new ValidationException("Giá tối đa là 1,000,000,000 VNĐ");
    }
    
    var tacPham = new TacPham {
        TenTranh = dto.TenTranh,
        GiaBan = dto.GiaBan,
        // ...
    };
    
    return await _tacPhamRepo.CreateAsync(tacPham);
}
```

**Giải thích**:
- Thêm validation trước khi tạo tác phẩm
- Throw exception nếu không hợp lệ
- Exception sẽ được catch ở Controller và trả về 400 Bad Request


#### **Tình huống 2: Thêm pagination cho danh sách tác phẩm**

**Yêu cầu**: Hiển thị 12 tác phẩm mỗi trang thay vì load hết

**Code cũ**:
```csharp
[HttpGet]
public async Task<IActionResult> GetAllTacPham() {
    var tacPhams = await _tacPhamRepo.GetAllAsync();
    return Ok(tacPhams);
}
```

**Code mới**:
```csharp
[HttpGet]
public async Task<IActionResult> GetAllTacPham(
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 12
) {
    // Validation
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 12;
    
    // Lấy tổng số tác phẩm
    var total = await _tacPhamRepo.CountAsync();
    
    // Tính skip
    var skip = (page - 1) * pageSize;
    
    // Lấy data theo page
    var tacPhams = await _tacPhamRepo.GetPagedAsync(skip, pageSize);
    
    // Trả về kèm metadata
    return Ok(new {
        data = tacPhams,
        pagination = new {
            page = page,
            pageSize = pageSize,
            total = total,
            totalPages = (int)Math.Ceiling((double)total / pageSize)
        }
    });
}
```

**Giải thích**:
- Thêm parameters: `page`, `pageSize`
- Validation: page >= 1, pageSize trong khoảng hợp lý
- Tính `skip` = (page - 1) * pageSize
- Lấy data theo page từ database
- Trả về kèm metadata (total, totalPages) để frontend render pagination

**Frontend sử dụng**:
```typescript
// Gọi API với pagination
const response = await api.get('/api/tranh?page=2&pageSize=12');

// Response:
{
  data: [...],  // 12 tác phẩm
  pagination: {
    page: 2,
    pageSize: 12,
    total: 50,
    totalPages: 5
  }
}
```


#### **Tình huống 3: Thêm tính năng tìm kiếm**

**Yêu cầu**: Tìm kiếm tác phẩm theo tên, họa sĩ, danh mục

**Code mới**:
```csharp
[HttpGet("search")]
public async Task<IActionResult> SearchTacPham(
    [FromQuery] string keyword = "",
    [FromQuery] int? maDanhMuc = null,
    [FromQuery] int? maHoaSi = null,
    [FromQuery] decimal? minPrice = null,
    [FromQuery] decimal? maxPrice = null
) {
    var tacPhams = await _tacPhamRepo.SearchAsync(
        keyword, 
        maDanhMuc, 
        maHoaSi, 
        minPrice, 
        maxPrice
    );
    
    return Ok(tacPhams);
}
```

**Repository implementation**:
```csharp
public async Task<List<TacPham>> SearchAsync(
    string keyword, 
    int? maDanhMuc, 
    int? maHoaSi, 
    decimal? minPrice, 
    decimal? maxPrice
) {
    var query = @"
        SELECT t.*, h.Ten AS TenHoaSi, d.TenDanhMuc
        FROM TacPham t
        LEFT JOIN HoaSi h ON t.MaHoaSi = h.MaHoaSi
        LEFT JOIN DanhMuc d ON t.MaDanhMuc = d.MaDanhMuc
        WHERE t.TrangThai = 1
        AND (@Keyword = '' OR t.TenTranh LIKE '%' + @Keyword + '%')
        AND (@MaDanhMuc IS NULL OR t.MaDanhMuc = @MaDanhMuc)
        AND (@MaHoaSi IS NULL OR t.MaHoaSi = @MaHoaSi)
        AND (@MinPrice IS NULL OR t.GiaBan >= @MinPrice)
        AND (@MaxPrice IS NULL OR t.GiaBan <= @MaxPrice)
        ORDER BY t.NgayTao DESC
    ";
    
    using (var connection = new SqlConnection(_connectionString)) {
        var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Keyword", keyword ?? "");
        command.Parameters.AddWithValue("@MaDanhMuc", (object)maDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaHoaSi", (object)maHoaSi ?? DBNull.Value);
        command.Parameters.AddWithValue("@MinPrice", (object)minPrice ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaxPrice", (object)maxPrice ?? DBNull.Value);
        
        await connection.OpenAsync();
        using (var reader = await command.ExecuteReaderAsync()) {
            var tacPhams = new List<TacPham>();
            while (await reader.ReadAsync()) {
                tacPhams.Add(MapToTacPham(reader));
            }
            return tacPhams;
        }
    }
}
```

**Giải thích**:
- Sử dụng parameterized query (tránh SQL injection)
- Các filter là optional (nullable)
- Nếu không truyền → Không filter
- LIKE '%keyword%' để tìm kiếm gần đúng

**Frontend sử dụng**:
```typescript
// Tìm kiếm "hoa" trong danh mục "Sơn dầu" (maDanhMuc=1)
const response = await api.get('/api/tranh/search?keyword=hoa&maDanhMuc=1');

// Tìm kiếm theo khoảng giá 1-5 triệu
const response = await api.get('/api/tranh/search?minPrice=1000000&maxPrice=5000000');
```



---

## 📦 TIÊU CHÍ 5: ĐÁNH GIÁ SẢN PHẨM CUỐI

### 5.1. Tính năng đã hoàn thành

#### **A. Tính năng cho Khách hàng (User)**

✅ **Xem và tìm kiếm tác phẩm**
- Danh sách tất cả tác phẩm
- Filter theo danh mục
- Search theo tên
- Xem chi tiết tác phẩm
- Xem tác phẩm gợi ý

✅ **Giỏ hàng và đặt hàng**
- Thêm vào giỏ hàng
- Cập nhật số lượng
- Xóa khỏi giỏ
- Thanh toán
- Xem lịch sử đơn hàng
- Hủy đơn hàng (nếu chưa xác nhận)

✅ **Yêu thích**
- Thêm tác phẩm vào danh sách yêu thích
- Xem danh sách yêu thích
- Xóa khỏi danh sách

✅ **Quản lý tài khoản**
- Đăng ký tài khoản
- Đăng nhập
- Đổi mật khẩu
- Xem/sửa thông tin cá nhân

#### **B. Tính năng cho Họa sĩ (Artist)**

✅ **Quản lý tác phẩm**
- Tạo tác phẩm mới (chờ admin duyệt)
- Xem danh sách tác phẩm của mình
- Chỉnh sửa tác phẩm:
  - Tác phẩm chờ duyệt: Sửa trực tiếp
  - Tác phẩm đang bán: Gửi yêu cầu chỉnh sửa
- Xóa tác phẩm

✅ **Quản lý chi tiết tác phẩm**
- Thêm/sửa/xóa mô tả chi tiết
- Upload gallery images
- Thêm thông tin kỹ thuật

✅ **Xem doanh thu**
- Tổng doanh thu
- Số lượng tác phẩm đã bán
- Danh sách đơn hàng có tác phẩm của mình

✅ **Quản lý hồ sơ**
- Xem/sửa thông tin cá nhân
- Cập nhật tiểu sử
- Đổi ảnh đại diện


#### **C. Tính năng cho Admin**

✅ **Quản lý tác phẩm**
- Xem tất cả tác phẩm
- Duyệt tác phẩm mới
- Duyệt chỉnh sửa tác phẩm:
  - Xem so sánh nội dung cũ vs mới
  - Duyệt hoặc từ chối
- Xóa tác phẩm

✅ **Quản lý đơn hàng**
- Xem tất cả đơn hàng
- Cập nhật trạng thái đơn hàng:
  - Chờ xác nhận → Đã xác nhận
  - Đã xác nhận → Đang giao
  - Đang giao → Hoàn thành
- Hủy đơn hàng
- Xem chi tiết đơn hàng

✅ **Quản lý người dùng**
- Xem danh sách khách hàng
- Xem danh sách họa sĩ
- Kích hoạt/vô hiệu hóa tài khoản

✅ **Báo cáo thống kê**
- Dashboard với số liệu tổng quan
- Doanh thu theo tháng
- Tác phẩm bán chạy
- Họa sĩ có doanh thu cao

### 5.2. Chất lượng code

#### **A. Code Organization**

✅ **Backend**:
- 3-Layer Architecture (Controller - BLL - DAL)
- Repository Pattern
- Dependency Injection
- DTO Pattern
- Tách biệt concerns rõ ràng

✅ **Frontend**:
- Component-based architecture
- Services cho API calls
- Custom hooks cho business logic
- Context API cho state management
- TypeScript cho type safety

#### **B. Best Practices**

✅ **Security**:
- JWT authentication
- BCrypt password hashing
- Role-based authorization
- Parameterized queries (SQL injection prevention)
- CORS configuration

✅ **Performance**:
- Database indexes
- Async/await
- Lazy loading
- Caching (Context API)

✅ **Code Quality**:
- Consistent naming conventions
- Comments cho logic phức tạp
- Error handling
- Validation (frontend + backend)


### 5.3. Testing

#### **A. Manual Testing**

✅ **Functional Testing**:
- Đăng ký/đăng nhập
- CRUD tác phẩm
- Giỏ hàng và đặt hàng
- Duyệt tác phẩm
- Quản lý đơn hàng
- Yêu thích
- Tác phẩm gợi ý

✅ **User Acceptance Testing**:
- Test với 3 roles: Admin, User, HoaSi
- Test các workflows chính
- Test edge cases

✅ **Browser Testing**:
- Chrome ✅
- Firefox ✅
- Edge ✅
- Safari ⚠️ (chưa test đầy đủ)

✅ **Responsive Testing**:
- Desktop (1920x1080) ✅
- Laptop (1366x768) ✅
- Tablet (768x1024) ⚠️ (cần cải thiện)
- Mobile (375x667) ⚠️ (cần cải thiện)

#### **B. Unit Testing**

⚠️ **Chưa implement**:
- Backend unit tests (xUnit)
- Frontend unit tests (Jest)
- Integration tests

**Lý do**: Tập trung vào functional development trước
**Kế hoạch**: Thêm tests trong giai đoạn maintenance

### 5.4. Deployment Readiness

#### **A. Đã sẵn sàng**

✅ **Database**:
- Schema hoàn chỉnh
- Sample data
- Indexes
- Constraints

✅ **Backend**:
- Production-ready code
- Error handling
- Logging
- Configuration (appsettings.json)

✅ **Frontend**:
- Build script (npm run build)
- Environment variables (.env)
- Production optimization

#### **B. Cần chuẩn bị thêm**

⚠️ **Deployment**:
- Chưa deploy lên server thực
- Chưa có domain
- Chưa có SSL certificate

⚠️ **CI/CD**:
- Chưa có pipeline tự động
- Chưa có automated testing

⚠️ **Monitoring**:
- Chưa có logging system
- Chưa có error tracking (Sentry)
- Chưa có analytics


### 5.5. Báo cáo đồ án

#### **A. Cấu trúc báo cáo**

✅ **Đã hoàn thành**:
- Trang bìa
- Lời cảm ơn
- Mục lục
- Danh sách hình ảnh, bảng biểu

✅ **Chương 1: Giới thiệu**
- Bối cảnh dự án
- Mục tiêu
- Phạm vi
- Ý nghĩa thực tiễn

✅ **Chương 2: Cơ sở lý thuyết**
- Công nghệ sử dụng
- Kiến trúc hệ thống
- Design patterns
- Database design

✅ **Chương 3: Phân tích và thiết kế**
- Use case diagram
- Sequence diagram
- Class diagram
- Database schema (ERD)
- UI/UX design

✅ **Chương 4: Cài đặt và triển khai**
- Chi tiết implementation
- Code samples
- Screenshots
- Testing results

✅ **Chương 5: Kết luận**
- Tổng kết
- Đánh giá
- Hạn chế
- Hướng phát triển

#### **B. Tài liệu kỹ thuật**

✅ **HUONG_DAN_BAO_VE_DO_AN.md**:
- Tổng quan dự án
- Cấu trúc thư mục chi tiết
- Database schema
- Authentication flow
- Tính năng chính
- Workflows quan trọng
- Cách chạy project
- Câu hỏi thường gặp

✅ **CHUAN_BI_BAO_VE_THEO_TIEU_CHI.md** (file này):
- Phân tích nghiệp vụ
- Thiết kế hệ thống
- Sử dụng AI
- Giải thích code
- Đánh giá sản phẩm


### 5.6. Điểm mạnh của sản phẩm

#### **1. Kiến trúc tốt**
- 3-Layer Architecture rõ ràng
- Tách biệt Frontend - Backend
- RESTful API chuẩn
- Dễ maintain, dễ scale

#### **2. Bảo mật**
- JWT authentication
- BCrypt password hashing
- Role-based authorization
- SQL injection prevention
- CORS configuration

#### **3. User Experience**
- Giao diện đẹp, dễ sử dụng
- Responsive design
- Loading states
- Error handling tốt
- Validation rõ ràng

#### **4. Business Logic**
- Workflow duyệt tác phẩm hợp lý
- Thuật toán gợi ý hiệu quả
- Quản lý đơn hàng đầy đủ
- Phân quyền rõ ràng

#### **5. Code Quality**
- Clean code
- Consistent naming
- Comments đầy đủ
- Error handling
- TypeScript type safety

### 5.7. Hạn chế và hướng phát triển

#### **A. Hạn chế hiện tại**

⚠️ **1. Testing**
- Chưa có unit tests
- Chưa có integration tests
- Chỉ có manual testing

⚠️ **2. Performance**
- Chưa có caching layer (Redis)
- Chưa có CDN cho images
- Chưa optimize images

⚠️ **3. Features**
- Chưa có payment gateway thực
- Chưa có email notification
- Chưa có chat support
- Chưa có review/rating

⚠️ **4. Mobile**
- Responsive chưa tốt trên mobile
- Chưa có mobile app


#### **B. Hướng phát triển**

🚀 **Phase 1: Hoàn thiện cơ bản (1-2 tháng)**
- Thêm unit tests và integration tests
- Cải thiện responsive design cho mobile
- Thêm email notification (đăng ký, đặt hàng, duyệt tác phẩm)
- Optimize images (lazy loading, compression)

🚀 **Phase 2: Tính năng nâng cao (2-3 tháng)**
- Tích hợp payment gateway (VNPay, MoMo)
- Thêm review và rating cho tác phẩm
- Thêm chat support (SignalR)
- Thêm wishlist sharing (chia sẻ danh sách yêu thích)
- Thêm compare artworks (so sánh tác phẩm)

🚀 **Phase 3: Scale và Optimize (3-6 tháng)**
- Implement Redis caching
- CDN cho images
- Elasticsearch cho search
- Microservices architecture (nếu cần)
- Load balancing

🚀 **Phase 4: Mobile và AI (6-12 tháng)**
- React Native mobile app
- AI-powered recommendation (collaborative filtering)
- Image similarity search
- Virtual gallery (AR/VR)
- Chatbot support

### 5.8. Kết luận

#### **Đánh giá tổng quan**

✅ **Hoàn thành mục tiêu**:
- Xây dựng được hệ thống bán tranh trực tuyến đầy đủ tính năng
- 3 roles: Admin, User, HoaSi hoạt động tốt
- Workflow duyệt tác phẩm hợp lý
- Bảo mật tốt với JWT và BCrypt
- Code quality tốt, dễ maintain

✅ **Áp dụng kiến thức**:
- React + TypeScript
- ASP.NET Core Web API
- SQL Server
- RESTful API
- Design Patterns (Repository, DI, DTO)
- Authentication & Authorization

✅ **Kỹ năng đạt được**:
- Phân tích nghiệp vụ
- Thiết kế hệ thống
- Full-stack development
- Database design
- API design
- Security best practices
- Problem solving

**Sản phẩm đã sẵn sàng cho demo và bảo vệ đồ án!** 🎉

---

## 📝 PHỤ LỤC: CHECKLIST BẢO VỆ

### Trước buổi bảo vệ

☑️ **Chuẩn bị kỹ thuật**:
- [ ] Database đã setup và có dữ liệu mẫu
- [ ] Backend chạy được (http://localhost:5273)
- [ ] Frontend chạy được (http://localhost:3000)
- [ ] Test tất cả tính năng chính
- [ ] Chuẩn bị tài khoản demo (admin, user, hoasi)

☑️ **Chuẩn bị tài liệu**:
- [ ] In báo cáo đồ án
- [ ] Chuẩ bị slide PowerPoint
- [ ] Chuẩn bị file HUONG_DAN_BAO_VE_DO_AN.md
- [ ] Chuẩn bị file CHUAN_BI_BAO_VE_THEO_TIEU_CHI.md

☑️ **Chuẩn bị demo**:
- [ ] Luyện tập demo các tính năng chính
- [ ] Chuẩn bị kịch bản demo (10-15 phút)
- [ ] Test trên máy sẽ demo

### Trong buổi bảo vệ

☑️ **Phần trình bày (10-15 phút)**:
1. Giới thiệu đồ án (2 phút)
2. Demo tính năng (8-10 phút)
3. Kết luận (2 phút)

☑️ **Phần hỏi đáp**:
- Tự tin, trả lời rõ ràng
- Nếu không biết, thành thật nói "Em chưa tìm hiểu phần này"
- Có thể mở code để giải thích

**Chúc bạn bảo vệ thành công! 🎓**
