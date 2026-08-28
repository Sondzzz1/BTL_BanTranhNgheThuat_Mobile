# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

## 2.1. Quy trình phát triển phần mềm

Dự án áp dụng mô hình phát triển phần mềm Agile với các giai đoạn chính:

### 2.1.1. Phân tích yêu cầu

**Mục tiêu hệ thống:**
- Xây dựng nền tảng thương mại điện tử chuyên về tranh nghệ thuật
- Kết nối họa sĩ với người mua một cách trực tiếp và minh bạch
- Cung cấp công cụ quản lý toàn diện cho admin, họa sĩ và khách hàng

**Đối tượng người dùng:**
1. **Admin (Quản trị viên):**
   - Quản lý toàn bộ hệ thống
   - Duyệt tác phẩm, bài viết của họa sĩ
   - Quản lý đơn hàng, người dùng, họa sĩ
   - Xem báo cáo thống kê doanh thu

2. **Họa sĩ (Artist):**
   - Đăng ký và quản lý hồ sơ cá nhân
   - Đăng tải và quản lý tác phẩm
   - Viết bài giới thiệu tác phẩm
   - Theo dõi doanh thu và đơn hàng

3. **Người dùng (Customer):**
   - Duyệt và tìm kiếm tác phẩm
   - Thêm vào giỏ hàng và đặt mua
   - Quản lý đơn hàng cá nhân
   - Lưu danh sách yêu thích

**Yêu cầu chức năng:**
- Hệ thống xác thực và phân quyền dựa trên JWT
- Quản lý tác phẩm với workflow duyệt (Pending → Approved → Published)
- Giỏ hàng và thanh toán trực tuyến
- Quản lý đơn hàng với nhiều trạng thái
- Báo cáo thống kê doanh thu theo thời gian
- Tìm kiếm và lọc tác phẩm theo nhiều tiêu chí

**Yêu cầu phi chức năng:**
- **Bảo mật:** Mã hóa mật khẩu BCrypt, JWT authentication, HTTPS
- **Hiệu năng:** Response time < 2s, hỗ trợ 100+ concurrent users
- **Khả năng mở rộng:** Kiến trúc 3-layer, RESTful API
- **Tính sẵn sàng:** Uptime 99%, backup database hàng ngày
- **Trải nghiệm người dùng:** Responsive design, intuitive UI

### 2.1.2. Thiết kế hệ thống

**Kiến trúc tổng thể:**
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  React SPA (Port 3000)                                   │
│  - Components, Pages, Services                           │
│  - State Management (Context API)                        │
│  - Routing (React Router)                                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ RESTful API
┌────────────────────▼────────────────────────────────────┐
│                  API LAYER                               │
│  ASP.NET Core Web API (Port 5273)                        │
│  - Controllers (API Endpoints)                           │
│  - Middleware (Auth, CORS, Error Handling)               │
│  - JWT Authentication                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                       │
│  - Business Services                                     │
│  - Validation Logic                                      │
│  - Business Rules                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              DATA ACCESS LAYER                           │
│  - Repository Pattern                                    │
│  - ADO.NET / Dapper                                      │
│  - Database Context                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                DATABASE LAYER                            │
│  SQL Server (DUYSONW\SQLEXPRESS)                         │
│  - 16 Tables                                             │
│  - Stored Procedures                                     │
│  - Indexes & Constraints                                 │
└─────────────────────────────────────────────────────────┘
```

**Thiết kế cơ sở dữ liệu:**
- 16 bảng chính với quan hệ foreign key
- Áp dụng normalization (3NF)
- Soft delete cho dữ liệu quan trọng
- Audit trail (NgayTao, NgayCapNhat)

**Thiết kế API Endpoints:**
- RESTful API design principles
- Versioning: /api/v1/...
- Consistent response format
- HTTP status codes chuẩn

**Thiết kế giao diện:**
- Responsive design (Mobile-first)
- Component-based architecture
- Consistent color scheme và typography
- Accessibility (WCAG 2.1 Level AA)

### 2.1.3. Lập trình

**Backend Development:**
- Framework: ASP.NET Core 8.0
- Language: C# 12
- Architecture: Clean Architecture (3-layer)
- Patterns: Repository, Dependency Injection, Factory

**Frontend Development:**
- Library: React 18.2
- Language: TypeScript
- State Management: Context API + Hooks
- Styling: CSS Modules + Custom CSS

**Database Development:**
- RDBMS: SQL Server 2019
- ORM: ADO.NET + Dapper
- Migration: SQL Scripts
- Seeding: Sample data scripts

### 2.1.4. Kiểm thử

**Unit Testing:**
- Backend: xUnit, Moq
- Frontend: Jest, React Testing Library

**Integration Testing:**
- API Testing: Postman, Swagger
- Database Testing: SQL Server Management Studio

**User Acceptance Testing:**
- Manual testing với test cases
- Cross-browser testing (Chrome, Firefox, Edge)
- Responsive testing (Desktop, Tablet, Mobile)

### 2.1.5. Triển khai và đánh giá

**Môi trường triển khai:**
- Development: localhost
- Staging: Local network
- Production: Cloud hosting (Azure/AWS)

**Đánh giá hiệu quả:**
- Performance metrics
- User feedback
- Bug tracking và fixing
- Continuous improvement

---

## 2.2. Công nghệ Backend - ASP.NET Core

### 2.2.1. Tổng quan về ASP.NET Core

ASP.NET Core là framework mã nguồn mở, đa nền tảng của Microsoft để xây dựng ứng dụng web hiện đại, cloud-based và kết nối Internet.

**Đặc điểm nổi bật:**
- **Cross-platform:** Chạy trên Windows, Linux, macOS
- **High performance:** Một trong những web framework nhanh nhất
- **Open source:** Mã nguồn mở, cộng đồng lớn
- **Modern architecture:** Built-in dependency injection, middleware pipeline
- **Cloud-ready:** Tối ưu cho cloud deployment

**Phiên bản sử dụng:** ASP.NET Core 8.0 (LTS - Long Term Support)

### 2.2.2. Kiến trúc 3-layer trong dự án


#### **Layer 1: Presentation Layer (Controllers)**

**Chức năng:**
- Nhận HTTP requests từ client
- Validate input data
- Gọi Business Logic Layer
- Trả về HTTP responses

**Ví dụ trong dự án:**
```csharp
[ApiController]
[Route("api/hoa-si")]
[Authorize(Roles = "Admin,HoaSi")]
public class HoaSiController : ControllerBase
{
    private readonly IHoaSiBusiness _hoaSiBusiness;
    
    [HttpGet("tac-pham/get-all")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> GetTacPhamCuaToi()
    {
        var maHoaSi = JwtHelper.GetMaHoaSi(User);
        var result = await _hoaSiBusiness.GetTacPhamCuaToi(maHoaSi.Value);
        return Ok(result);
    }
}
```

**Controllers trong dự án:**
- `AuthController`: Xác thực, đăng nhập, đăng ký
- `PublicController`: API công khai (tác phẩm, họa sĩ, danh mục)
- `AdminController`: Quản lý hệ thống
- `HoaSiController`: Quản lý tác phẩm, bài viết của họa sĩ
- `UserController`: Quản lý giỏ hàng, đơn hàng, yêu thích

#### **Layer 2: Business Logic Layer (Services)**

**Chức năng:**
- Xử lý business rules
- Validate business logic
- Orchestrate data operations
- Transform data giữa layers

**Ví dụ trong dự án:**
```csharp
public class HoaSiBusiness : IHoaSiBusiness
{
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    
    public async Task<int> TaoTacPham(int maHoaSi, TaoTacPhamRequest request)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(request.TenTacPham))
            throw new ArgumentException("Tên tác phẩm không được để trống");
        if (request.Gia <= 0)
            throw new ArgumentException("Giá phải lớn hơn 0");
            
        // Business logic
        var tacPham = new TacPham
        {
            TenTacPham = request.TenTacPham.Trim(),
            MaHoaSi = maHoaSi,
            Gia = request.Gia,
            TrangThai = 0, // Chờ duyệt
            NgayTao = DateTime.UtcNow
        };
        
        return await _tacPhamRepo.Create(tacPham);
    }
}
```

**Business Services trong dự án:**
- `AuthBusiness`: Xác thực, mã hóa mật khẩu, tạo JWT token
- `AdminBusiness`: Logic quản trị (duyệt tác phẩm, thống kê)
- `HoaSiBusiness`: Logic họa sĩ (quản lý tác phẩm, doanh thu)
- `UserBusiness`: Logic người dùng (giỏ hàng, đơn hàng)

#### **Layer 3: Data Access Layer (Repositories)**

**Chức năng:**
- Truy cập database
- Execute SQL queries/stored procedures
- Map data từ database sang models
- Không chứa business logic

**Ví dụ trong dự án:**
```csharp
public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;
    
    public async Task<List<TacPham>> GetByHoaSi(int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        var query = @"
            SELECT * FROM TacPham 
            WHERE MaHoaSi = @MaHoaSi AND TrangThai != 99
            ORDER BY NgayTao DESC";
            
        var result = await connection.QueryAsync<TacPham>(
            query, 
            new { MaHoaSi = maHoaSi }
        );
        
        return result.ToList();
    }
}
```

**Repositories trong dự án:**
- `TaiKhoanRepository`: Quản lý tài khoản
- `NguoiDungRepository`: Quản lý người dùng
- `HoaSiRepository`: Quản lý họa sĩ
- `TacPhamRepository`: Quản lý tác phẩm
- `DonHangRepository`: Quản lý đơn hàng
- `GioHangRepository`: Quản lý giỏ hàng

### 2.2.3. Dependency Injection

**Khái niệm:**
Dependency Injection (DI) là design pattern cho phép inject dependencies vào class thay vì class tự tạo dependencies.

**Lợi ích:**
- Loose coupling giữa các components
- Dễ dàng testing (mock dependencies)
- Dễ maintain và extend code

**Cấu hình trong Program.cs:**
```csharp
// Register repositories
builder.Services.AddScoped<ITaiKhoanRepository, TaiKhoanRepository>();
builder.Services.AddScoped<ITacPhamRepository, TacPhamRepository>();

// Register business services
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
builder.Services.AddScoped<IHoaSiBusiness, HoaSiBusiness>();

// Register helpers
builder.Services.AddScoped<JwtHelper>();
```

### 2.2.4. Middleware Pipeline

**Khái niệm:**
Middleware là các components xử lý HTTP requests và responses theo thứ tự.

**Middleware trong dự án:**
```csharp
// CORS - Cho phép frontend gọi API
app.UseCors("AllowReactApp");

// Authentication - Xác thực JWT token
app.UseAuthentication();

// Authorization - Kiểm tra quyền truy cập
app.UseAuthorization();

// Error Handling - Xử lý lỗi tập trung
app.UseExceptionHandler("/error");

// Routing - Định tuyến requests
app.MapControllers();
```

### 2.2.5. JWT Authentication

**Khái niệm:**
JSON Web Token (JWT) là chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các bên dưới dạng JSON object.

**Cấu trúc JWT:**
```
Header.Payload.Signature
```

**Ví dụ trong dự án:**
```csharp
public string GenerateToken(TaiKhoan taiKhoan, string role, int? entityId)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, taiKhoan.MaTaiKhoan.ToString()),
        new Claim(ClaimTypes.Name, taiKhoan.TenDangNhap),
        new Claim(ClaimTypes.Role, role)
    };
    
    if (entityId.HasValue)
    {
        if (role == "HoaSi")
            claims.Add(new Claim("MaHoaSi", entityId.Value.ToString()));
        else if (role == "NguoiDung")
            claims.Add(new Claim("MaNguoiDung", entityId.Value.ToString()));
    }
    
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    
    var token = new JwtSecurityToken(
        issuer: _jwtIssuer,
        audience: _jwtAudience,
        claims: claims,
        expires: DateTime.Now.AddDays(7),
        signingCredentials: creds
    );
    
    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### 2.2.6. Repository Pattern

**Khái niệm:**
Repository Pattern là design pattern tạo abstraction layer giữa business logic và data access.

**Lợi ích:**
- Tách biệt business logic và data access
- Dễ dàng thay đổi database technology
- Dễ testing với mock repositories
- Centralized data access logic

**Interface:**
```csharp
public interface ITacPhamRepository
{
    Task<List<TacPham>> GetAll();
    Task<TacPham?> GetById(int id);
    Task<List<TacPham>> GetByHoaSi(int maHoaSi);
    Task<int> Create(TacPham tacPham);
    Task<bool> Update(TacPham tacPham);
    Task<bool> Delete(int id);
}
```

---

## 2.3. Công nghệ Frontend - React

### 2.3.1. Tổng quan về React

React là thư viện JavaScript mã nguồn mở do Facebook phát triển, chuyên dụng cho việc xây dựng giao diện người dùng, đặc biệt là Single Page Applications (SPA).

**Đặc điểm nổi bật:**
- **Declarative:** Mô tả UI nên như thế nào, React lo việc cập nhật
- **Component-Based:** Chia UI thành các component độc lập, tái sử dụng
- **Learn Once, Write Anywhere:** Có thể dùng cho web, mobile (React Native)
- **Virtual DOM:** Tối ưu hiệu năng bằng cách chỉ update những gì thay đổi

**Phiên bản sử dụng:** React 18.2 với TypeScript

### 2.3.2. Component-Based Architecture

**Khái niệm:**
Component là building block của React app. Mỗi component là một đơn vị độc lập, có thể tái sử dụng.

**Phân loại components trong dự án:**

**1. Layout Components:**
```typescript
// Header.tsx - Thanh điều hướng chính
const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  
  return (
    <header className="header">
      <nav>
        <Link to="/">Trang chủ</Link>
        <Link to="/artworks">Tác phẩm</Link>
        <SearchBox />
        <CartIcon count={cartItems.length} />
        {user ? <UserMenu /> : <Link to="/login">Đăng nhập</Link>}
      </nav>
    </header>
  );
};
```

**2. Page Components:**
```typescript
// Home.tsx - Trang chủ
const Home: React.FC = () => {
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  
  useEffect(() => {
    loadFeaturedArtworks();
  }, []);
  
  return (
    <div className="home-page">
      <HeroBanner />
      <FeaturedArtworks artworks={featuredArtworks} />
      <BestSellingArtworks />
      <RecommendedArtworks />
    </div>
  );
};
```

**3. Reusable Components:**
```typescript
// ArtworkCard.tsx - Card hiển thị tác phẩm
interface ArtworkCardProps {
  artwork: Artwork;
  onAddToCart?: (id: string) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onAddToCart }) => {
  return (
    <div className="artwork-card">
      <img src={artwork.hinhAnh} alt={artwork.tenTacPham} />
      <h3>{artwork.tenTacPham}</h3>
      <p className="artist">{artwork.tenHoaSi}</p>
      <p className="price">{formatPrice(artwork.gia)}</p>
      <button onClick={() => onAddToCart?.(artwork.id)}>
        Thêm vào giỏ
      </button>
    </div>
  );
};
```

### 2.3.3. Virtual DOM

**Khái niệm:**
Virtual DOM là bản sao nhẹ của Real DOM, được React sử dụng để tối ưu việc cập nhật UI.

**Cơ chế hoạt động:**
```
1. State thay đổi
   ↓
2. React tạo Virtual DOM mới
   ↓
3. So sánh với Virtual DOM cũ (Diffing)
   ↓
4. Tính toán thay đổi tối thiểu (Reconciliation)
   ↓
5. Cập nhật Real DOM (Batch Update)
```

**Lợi ích:**
- Giảm số lần thao tác với Real DOM (expensive operation)
- Batch updates - gộp nhiều thay đổi thành 1 lần update
- Tăng hiệu năng đáng kể

### 2.3.4. JSX (JavaScript XML)

**Khái niệm:**
JSX là syntax extension cho JavaScript, cho phép viết HTML-like code trong JavaScript.

**Ví dụ:**
```typescript
// JSX
const element = (
  <div className="artwork-list">
    <h2>Tác phẩm nổi bật</h2>
    {artworks.map(artwork => (
      <ArtworkCard key={artwork.id} artwork={artwork} />
    ))}
  </div>
);

// Compiled thành JavaScript
const element = React.createElement(
  'div',
  { className: 'artwork-list' },
  React.createElement('h2', null, 'Tác phẩm nổi bật'),
  artworks.map(artwork => 
    React.createElement(ArtworkCard, { key: artwork.id, artwork: artwork })
  )
);
```

### 2.3.5. State Management

**1. Component State (useState):**
```typescript
const [artworks, setArtworks] = useState<Artwork[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadArtworks = async () => {
  try {
    setLoading(true);
    const data = await artworkService.getAllArtworks();
    setArtworks(data);
  } catch (err) {
    setError('Không thể tải dữ liệu');
  } finally {
    setLoading(false);
  }
};
```

**2. Global State (Context API):**
```typescript
// AppContext.tsx
interface AppContextType {
  user: User | null;
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const addToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  };
  
  return (
    <AppContext.Provider value={{ user, cartItems, addToCart, removeFromCart }}>
      {children}
    </AppContext.Provider>
  );
};

// Sử dụng trong component
const { cartItems, addToCart } = useContext(AppContext);
```

**3. Custom Hooks:**
```typescript
// useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return { user, isAuthenticated, login, logout };
};
```

### 2.3.6. React Router

**Khái niệm:**
React Router là thư viện routing cho React, cho phép điều hướng giữa các trang mà không reload browser.

**Cấu hình trong dự án:**
```typescript
// App.tsx
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/artworks" element={<Layout><Artworks /></Layout>} />
        <Route path="/artworks/:id" element={<Layout><ArtworkDetail /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="artworks" element={<AdminArtworks />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        
        {/* Artist Routes */}
        <Route path="/artist" element={<ArtistLayout />}>
          <Route index element={<ArtistDashboard />} />
          <Route path="artworks" element={<ArtistArtworks />} />
          <Route path="revenue" element={<ArtistRevenue />} />
        </Route>
        
        {/* User Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route path="profile" element={<UserProfile />} />
          <Route path="orders" element={<UserOrders />} />
        </Route>
      </Routes>
    </Router>
  );
}
```

**Navigation:**
```typescript
// Programmatic navigation
const navigate = useNavigate();
navigate('/artworks/123');

// Link component
<Link to="/artworks">Xem tác phẩm</Link>

// Get URL parameters
const { id } = useParams();
```

### 2.3.7. API Integration

**Axios Configuration:**
```typescript
// api.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:5273/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Service Layer:**
```typescript
// artworkService.ts
export const artworkService = {
  async getAllArtworks(): Promise<Artwork[]> {
    const response = await apiClient.get<Artwork[]>('/tranh');
    return response.data;
  },
  
  async getArtworkById(id: number): Promise<Artwork> {
    const response = await apiClient.get<Artwork>(`/tranh/${id}`);
    return response.data;
  },
  
  async searchArtworks(keyword: string): Promise<Artwork[]> {
    const response = await apiClient.get<Artwork[]>('/tranh', {
      params: { keyword }
    });
    return response.data;
  },
};
```

---


## 2.4. Cơ sở dữ liệu - SQL Server

### 2.4.1. Tổng quan về SQL Server

SQL Server là hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) của Microsoft, được sử dụng rộng rãi trong các ứng dụng doanh nghiệp.

**Đặc điểm nổi bật:**
- **ACID Compliance:** Đảm bảo tính toàn vẹn dữ liệu (Atomicity, Consistency, Isolation, Durability)
- **High Performance:** Tối ưu hóa truy vấn, indexing, query optimization
- **Scalability:** Hỗ trợ từ ứng dụng nhỏ đến enterprise-level
- **Security:** Encryption, authentication, authorization, auditing
- **Business Intelligence:** Tích hợp SSRS, SSIS, SSAS

**Phiên bản sử dụng:** SQL Server 2019 Express
**Instance:** DUYSONW\SQLEXPRESS
**Database:** HeThongBanTranh

### 2.4.2. Thiết kế cơ sở dữ liệu

**Nguyên tắc thiết kế áp dụng:**

**1. Normalization (Chuẩn hóa):**
Dự án áp dụng chuẩn hóa đến dạng chuẩn 3 (3NF) để:
- Loại bỏ dữ liệu trùng lặp
- Đảm bảo tính toàn vẹn dữ liệu
- Dễ dàng maintain và update

**Ví dụ chuẩn hóa trong dự án:**
```sql
-- Trước khi chuẩn hóa (1 bảng):
-- DonHang(MaDonHang, TenKhachHang, EmailKhachHang, DienThoaiKhachHang, 
--         TenTacPham, TenHoaSi, EmailHoaSi, Gia, SoLuong)
-- ❌ Dữ liệu khách hàng và họa sĩ bị lặp lại nhiều lần

-- Sau khi chuẩn hóa (3NF):
-- TaiKhoan(MaTaiKhoan, TenDangNhap, MatKhau, VaiTro)
-- NguoiDung(MaNguoiDung, MaTaiKhoan, Ten, Email, DienThoai)
-- HoaSi(MaHoaSi, MaTaiKhoan, TenHoaSi, Email, DienThoai)
-- TacPham(MaTacPham, MaHoaSi, TenTacPham, Gia)
-- HoaDonBan(MaHoaDon, MaNguoiDung, MaTacPham, SoLuong, DonGia)
-- ✅ Mỗi thông tin chỉ lưu 1 lần, tham chiếu qua foreign key
```

**2. Referential Integrity (Toàn vẹn tham chiếu):**
```sql
-- Foreign Key Constraints
ALTER TABLE NguoiDung 
ADD CONSTRAINT FK_NguoiDung_TaiKhoan 
FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan);

ALTER TABLE TacPham 
ADD CONSTRAINT FK_TacPham_HoaSi 
FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi);

ALTER TABLE HoaDonBan 
ADD CONSTRAINT FK_HoaDonBan_NguoiDung 
FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung);
```

**3. Data Types Optimization:**
```sql
-- Sử dụng đúng kiểu dữ liệu để tối ưu storage và performance
TrangThai   TINYINT       -- 0-255, chỉ 1 byte
VaiTro      TINYINT       -- 0-255, chỉ 1 byte  
Gia         DECIMAL(18,2) -- Chính xác cho tiền tệ
NgayTao     DATETIME      -- Lưu cả ngày và giờ
TrangThai   BIT           -- True/False, chỉ 1 bit
```

**4. Soft Delete Pattern:**
```sql
-- Không xóa vật lý, chỉ đánh dấu đã xóa
UPDATE TacPham 
SET TrangThai = 99  -- 99 = Đã xóa
WHERE MaTacPham = @MaTacPham;

-- Lọc bỏ records đã xóa trong queries
SELECT * FROM TacPham 
WHERE TrangThai != 99;
```

### 2.4.3. Cấu trúc bảng chính

**Sơ đồ quan hệ:**
```
TaiKhoan (1) ──┬── (1) NguoiDung
               │
               └── (1) HoaSi ── (N) TacPham ── (N) HoaDonBan
                         │                           │
                         └── (N) BaiViet             │
                                                     │
NguoiDung (1) ── (1) GioHang ── (N) ChiTietGioHang  │
         │                                           │
         └────────────────────────────────────────(N)
```

**Bảng TacPham - Bảng trung tâm:**
```sql
CREATE TABLE TacPham (
    MaTacPham   INT            IDENTITY(1,1) PRIMARY KEY,
    MaHoaSi     INT            NOT NULL,
    MaDanhMuc   INT            NOT NULL,
    TenTacPham  NVARCHAR(200)  NOT NULL,
    MoTa        NVARCHAR(MAX),
    Gia         DECIMAL(18,2)  NOT NULL,
    HinhAnh     NVARCHAR(500),
    SoLuong     INT            NOT NULL DEFAULT 1,
    TrangThai   TINYINT        NOT NULL DEFAULT 0,
    NgayTao     DATETIME       NOT NULL DEFAULT GETDATE(),
    LuotXem     INT            NOT NULL DEFAULT 0,
    LyDo        NVARCHAR(MAX)  NULL,
    
    CONSTRAINT FK_TacPham_HoaSi 
        FOREIGN KEY (MaHoaSi) REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_TacPham_DanhMuc 
        FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc),
    CONSTRAINT CK_TacPham_Gia 
        CHECK (Gia > 0),
    CONSTRAINT CK_TacPham_SoLuong 
        CHECK (SoLuong >= 0)
);
```

**Giải thích TrangThai của TacPham:**
- `0` = Chờ duyệt (Pending) - Họa sĩ vừa tạo, chờ admin duyệt
- `1` = Đang bán (Published) - Admin đã duyệt, hiển thị công khai
- `2` = Ẩn (Hidden) - Họa sĩ tạm ẩn, không hiển thị
- `3` = Từ chối (Rejected) - Admin từ chối, có LyDo
- `99` = Đã xóa (Deleted) - Soft delete

### 2.4.4. Indexing Strategy

**1. Clustered Index (Primary Key):**
```sql
-- Mỗi bảng có 1 clustered index trên Primary Key
-- Dữ liệu được sắp xếp vật lý theo thứ tự này
CREATE TABLE TacPham (
    MaTacPham INT IDENTITY(1,1) PRIMARY KEY CLUSTERED
    -- Clustered index tự động tạo trên PRIMARY KEY
);
```

**2. Non-Clustered Indexes:**
```sql
-- Index trên cột thường xuyên search/filter
CREATE NONCLUSTERED INDEX IX_TacPham_MaHoaSi 
ON TacPham(MaHoaSi);

CREATE NONCLUSTERED INDEX IX_TacPham_MaDanhMuc 
ON TacPham(MaDanhMuc);

CREATE NONCLUSTERED INDEX IX_TacPham_TrangThai 
ON TacPham(TrangThai);

-- Composite index cho queries phức tạp
CREATE NONCLUSTERED INDEX IX_TacPham_HoaSi_TrangThai 
ON TacPham(MaHoaSi, TrangThai)
INCLUDE (TenTacPham, Gia, HinhAnh);
```

**3. Unique Index:**
```sql
-- Đảm bảo tính duy nhất
CREATE UNIQUE NONCLUSTERED INDEX UX_TaiKhoan_TenDangNhap 
ON TaiKhoan(TenDangNhap);
```

**Lợi ích của Indexing:**
- Tăng tốc độ SELECT queries (từ O(n) xuống O(log n))
- Tối ưu JOIN operations
- Tăng tốc ORDER BY và GROUP BY
- Trade-off: Chậm hơn khi INSERT/UPDATE/DELETE

### 2.4.5. Query Optimization

**1. Sử dụng Parameterized Queries:**
```sql
-- ❌ BAD: SQL Injection risk, không cache execution plan
SELECT * FROM TacPham WHERE MaTacPham = ' + @id + ';

-- ✅ GOOD: An toàn, cache execution plan
SELECT * FROM TacPham WHERE MaTacPham = @MaTacPham;
```

**2. SELECT chỉ cột cần thiết:**
```sql
-- ❌ BAD: Lấy tất cả cột, tốn bandwidth
SELECT * FROM TacPham WHERE TrangThai = 1;

-- ✅ GOOD: Chỉ lấy cột cần thiết
SELECT MaTacPham, TenTacPham, Gia, HinhAnh 
FROM TacPham 
WHERE TrangThai = 1;
```

**3. Sử dụng JOIN thay vì Subquery:**
```sql
-- ❌ SLOWER: Subquery
SELECT * FROM TacPham 
WHERE MaHoaSi IN (
    SELECT MaHoaSi FROM HoaSi WHERE TrangThai = 1
);

-- ✅ FASTER: JOIN
SELECT tp.* 
FROM TacPham tp
INNER JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
WHERE hs.TrangThai = 1;
```

**4. Sử dụng EXISTS thay vì COUNT:**
```sql
-- ❌ SLOWER: Đếm tất cả
IF (SELECT COUNT(*) FROM TacPham WHERE MaHoaSi = @MaHoaSi) > 0

-- ✅ FASTER: Dừng ngay khi tìm thấy 1 record
IF EXISTS (SELECT 1 FROM TacPham WHERE MaHoaSi = @MaHoaSi)
```


### 2.4.6. Stored Procedures

**Khái niệm:**
Stored Procedure là tập hợp các câu lệnh SQL được biên dịch sẵn và lưu trữ trong database.

**Lợi ích:**
- **Performance:** Execution plan được cache, chạy nhanh hơn
- **Security:** Giảm SQL injection, kiểm soát quyền truy cập
- **Maintainability:** Logic tập trung, dễ update
- **Network Traffic:** Giảm lượng dữ liệu truyền tải

**Ví dụ trong dự án:**

**1. Stored Procedure lấy tác phẩm theo họa sĩ:**
```sql
CREATE PROCEDURE sp_GetTacPhamByHoaSi
    @MaHoaSi INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tp.MaTacPham,
        tp.TenTacPham,
        tp.MoTa,
        tp.Gia,
        tp.HinhAnh,
        tp.SoLuong,
        tp.TrangThai,
        tp.NgayTao,
        tp.LuotXem,
        dm.TenDanhMuc,
        hs.TenHoaSi
    FROM TacPham tp
    INNER JOIN DanhMuc dm ON tp.MaDanhMuc = dm.MaDanhMuc
    INNER JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
    WHERE tp.MaHoaSi = @MaHoaSi 
      AND tp.TrangThai != 99  -- Loại bỏ đã xóa
    ORDER BY tp.NgayTao DESC;
END;
GO

-- Sử dụng:
EXEC sp_GetTacPhamByHoaSi @MaHoaSi = 1;
```

**2. Stored Procedure thống kê doanh thu:**
```sql
CREATE PROCEDURE sp_ThongKeDoanhThu
    @TuNgay DATE,
    @DenNgay DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        hs.MaHoaSi,
        hs.TenHoaSi,
        COUNT(DISTINCT hd.MaHoaDon) AS SoDonHang,
        SUM(hd.ThanhTien) AS TongDoanhThu,
        AVG(hd.ThanhTien) AS DoanhThuTrungBinh,
        MAX(hd.ThanhTien) AS DonHangLonNhat
    FROM HoaSi hs
    LEFT JOIN TacPham tp ON hs.MaHoaSi = tp.MaHoaSi
    LEFT JOIN HoaDonBan hd ON tp.MaTacPham = hd.MaTacPham
    WHERE hd.NgayDat BETWEEN @TuNgay AND @DenNgay
      AND hd.TrangThai IN (3, 4)  -- Đã giao hoặc Hoàn thành
    GROUP BY hs.MaHoaSi, hs.TenHoaSi
    ORDER BY TongDoanhThu DESC;
END;
GO

-- Sử dụng:
EXEC sp_ThongKeDoanhThu 
    @TuNgay = '2024-01-01', 
    @DenNgay = '2024-12-31';
```

**3. Stored Procedure xử lý đơn hàng:**
```sql
CREATE PROCEDURE sp_TaoDonHang
    @MaNguoiDung INT,
    @MaTacPham INT,
    @SoLuong INT,
    @DiaChiGiao NVARCHAR(500),
    @GhiChu NVARCHAR(500) = NULL,
    @MaHoaDon INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Kiểm tra tồn kho
        DECLARE @SoLuongTon INT, @Gia DECIMAL(18,2);
        
        SELECT @SoLuongTon = SoLuong, @Gia = Gia
        FROM TacPham
        WHERE MaTacPham = @MaTacPham AND TrangThai = 1;
        
        IF @SoLuongTon IS NULL
            THROW 50001, N'Tác phẩm không tồn tại hoặc không còn bán', 1;
        
        IF @SoLuongTon < @SoLuong
            THROW 50002, N'Số lượng không đủ', 1;
        
        -- Tạo đơn hàng
        INSERT INTO HoaDonBan (
            MaNguoiDung, MaTacPham, SoLuong, DonGia, ThanhTien,
            NgayDat, TrangThai, DiaChiGiao, GhiChu
        )
        VALUES (
            @MaNguoiDung, @MaTacPham, @SoLuong, @Gia, @Gia * @SoLuong,
            GETDATE(), 0, @DiaChiGiao, @GhiChu
        );
        
        SET @MaHoaDon = SCOPE_IDENTITY();
        
        -- Giảm số lượng tồn kho
        UPDATE TacPham
        SET SoLuong = SoLuong - @SoLuong
        WHERE MaTacPham = @MaTacPham;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Sử dụng:
DECLARE @MaHoaDonMoi INT;
EXEC sp_TaoDonHang 
    @MaNguoiDung = 1,
    @MaTacPham = 5,
    @SoLuong = 1,
    @DiaChiGiao = N'123 Lê Lợi, Q1, TP.HCM',
    @GhiChu = N'Giao giờ hành chính',
    @MaHoaDon = @MaHoaDonMoi OUTPUT;
    
SELECT @MaHoaDonMoi AS MaHoaDonVuaTao;
```

### 2.4.7. Transactions và ACID

**ACID Properties:**

**1. Atomicity (Tính nguyên tử):**
```sql
-- Tất cả thành công hoặc tất cả thất bại
BEGIN TRANSACTION;
    UPDATE TacPham SET SoLuong = SoLuong - 1 WHERE MaTacPham = 1;
    INSERT INTO HoaDonBan (...) VALUES (...);
    -- Nếu 1 trong 2 lệnh lỗi, cả 2 đều rollback
COMMIT TRANSACTION;
```

**2. Consistency (Tính nhất quán):**
```sql
-- Constraints đảm bảo dữ liệu luôn hợp lệ
ALTER TABLE TacPham 
ADD CONSTRAINT CK_TacPham_Gia CHECK (Gia > 0);

ALTER TABLE TacPham 
ADD CONSTRAINT CK_TacPham_SoLuong CHECK (SoLuong >= 0);
```

**3. Isolation (Tính cô lập):**
```sql
-- Isolation Level ngăn dirty read, phantom read
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
    -- Các transaction khác không thấy uncommitted changes
    UPDATE TacPham SET Gia = 5000000 WHERE MaTacPham = 1;
COMMIT TRANSACTION;
```

**4. Durability (Tính bền vững):**
```sql
-- Sau khi COMMIT, dữ liệu được lưu vĩnh viễn
-- Ngay cả khi server crash, dữ liệu không mất
COMMIT TRANSACTION;
```

### 2.4.8. Backup và Recovery

**1. Full Backup:**
```sql
-- Backup toàn bộ database
BACKUP DATABASE HeThongBanTranh
TO DISK = 'C:\Backup\HeThongBanTranh_Full.bak'
WITH FORMAT, 
     NAME = 'Full Backup of HeThongBanTranh',
     COMPRESSION;
```

**2. Differential Backup:**
```sql
-- Backup chỉ những thay đổi từ lần Full Backup cuối
BACKUP DATABASE HeThongBanTranh
TO DISK = 'C:\Backup\HeThongBanTranh_Diff.bak'
WITH DIFFERENTIAL,
     NAME = 'Differential Backup of HeThongBanTranh',
     COMPRESSION;
```

**3. Transaction Log Backup:**
```sql
-- Backup transaction log (cho Point-in-Time Recovery)
BACKUP LOG HeThongBanTranh
TO DISK = 'C:\Backup\HeThongBanTranh_Log.trn'
WITH NAME = 'Log Backup of HeThongBanTranh',
     COMPRESSION;
```

**4. Restore Database:**
```sql
-- Restore từ Full Backup
RESTORE DATABASE HeThongBanTranh
FROM DISK = 'C:\Backup\HeThongBanTranh_Full.bak'
WITH REPLACE, RECOVERY;

-- Restore với Differential
RESTORE DATABASE HeThongBanTranh
FROM DISK = 'C:\Backup\HeThongBanTranh_Full.bak'
WITH NORECOVERY;

RESTORE DATABASE HeThongBanTranh
FROM DISK = 'C:\Backup\HeThongBanTranh_Diff.bak'
WITH RECOVERY;
```

**Chiến lược Backup trong dự án:**
- **Full Backup:** Hàng tuần (Chủ nhật 2:00 AM)
- **Differential Backup:** Hàng ngày (2:00 AM)
- **Transaction Log Backup:** Mỗi 4 giờ
- **Retention:** Giữ backup 30 ngày

### 2.4.9. Security

**1. Authentication:**
```sql
-- SQL Server Authentication
CREATE LOGIN hoasi_user WITH PASSWORD = 'StrongP@ssw0rd';
CREATE USER hoasi_user FOR LOGIN hoasi_user;

-- Windows Authentication (Recommended)
CREATE LOGIN [DOMAIN\Username] FROM WINDOWS;
CREATE USER [DOMAIN\Username] FOR LOGIN [DOMAIN\Username];
```

**2. Authorization:**
```sql
-- Phân quyền theo role
CREATE ROLE HoaSiRole;
CREATE ROLE AdminRole;
CREATE ROLE UserRole;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TacPham TO HoaSiRole;
GRANT SELECT ON TacPham TO UserRole;
GRANT ALL ON DATABASE::HeThongBanTranh TO AdminRole;

-- Add user to role
ALTER ROLE HoaSiRole ADD MEMBER hoasi_user;
```

**3. Encryption:**
```sql
-- Transparent Data Encryption (TDE)
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MasterKeyP@ssw0rd';

CREATE CERTIFICATE TDECert WITH SUBJECT = 'TDE Certificate';

CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDECert;

ALTER DATABASE HeThongBanTranh
SET ENCRYPTION ON;
```

**4. Row-Level Security:**
```sql
-- Họa sĩ chỉ thấy tác phẩm của mình
CREATE FUNCTION fn_SecurityPredicate(@MaHoaSi INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS Result
WHERE @MaHoaSi = CAST(SESSION_CONTEXT(N'MaHoaSi') AS INT);

CREATE SECURITY POLICY HoaSiSecurityPolicy
ADD FILTER PREDICATE dbo.fn_SecurityPredicate(MaHoaSi) ON TacPham
WITH (STATE = ON);
```


---

## 2.5. Công nghệ bổ sung

### 2.5.1. TypeScript

**Tổng quan:**
TypeScript là superset của JavaScript, thêm static typing và các tính năng hiện đại.

**Lợi ích:**
- **Type Safety:** Phát hiện lỗi tại compile-time thay vì runtime
- **IntelliSense:** Auto-completion tốt hơn trong IDE
- **Refactoring:** Dễ dàng refactor code với confidence
- **Documentation:** Types là documentation tự nhiên

**Ví dụ trong dự án:**
```typescript
// Định nghĩa types
interface Artwork {
  maTacPham: number;
  tenTacPham: string;
  moTa: string;
  gia: number;
  hinhAnh: string;
  soLuong: number;
  trangThai: number;
  ngayTao: string;
  luotXem: number;
  tenHoaSi: string;
  tenDanhMuc: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Type-safe function
async function getArtworkById(id: number): Promise<Artwork> {
  const response = await apiClient.get<Artwork>(`/tranh/${id}`);
  return response.data;
}

// Generic type
function createApiResponse<T>(data: T, success: boolean = true): ApiResponse<T> {
  return { success, data };
}

// Union types
type ArtworkStatus = 0 | 1 | 2 | 3 | 99;
type UserRole = 'Admin' | 'HoaSi' | 'NguoiDung';

// Type guards
function isArtwork(obj: any): obj is Artwork {
  return obj && typeof obj.maTacPham === 'number' && typeof obj.tenTacPham === 'string';
}
```

### 2.5.2. Axios

**Tổng quan:**
Axios là HTTP client dựa trên Promise cho browser và Node.js.

**Đặc điểm:**
- Promise-based API
- Request/Response interceptors
- Automatic JSON transformation
- Request cancellation
- Timeout support

**Cấu hình trong dự án:**
```typescript
// api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5273/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Logging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden:', message);
          break;
        case 404:
          console.error('Resource not found:', error.config?.url);
          break;
        case 500:
          console.error('Server error:', message);
          break;
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.5.3. BCrypt

**Tổng quan:**
BCrypt là thuật toán hash mật khẩu an toàn, được thiết kế để chậm để chống brute-force attacks.

**Đặc điểm:**
- **Adaptive:** Có thể tăng độ phức tạp theo thời gian
- **Salt:** Tự động thêm random salt vào mỗi hash
- **One-way:** Không thể decrypt, chỉ có thể verify

**Sử dụng trong dự án:**
```csharp
// AuthBusiness.cs
using BCrypt.Net;

public class AuthBusiness : IAuthBusiness
{
    // Hash password khi đăng ký
    public async Task<int> DangKy(DangKyRequest request)
    {
        // Hash password với work factor 11
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(
            request.MatKhau, 
            workFactor: 11
        );
        
        var taiKhoan = new TaiKhoan
        {
            TenDangNhap = request.TenDangNhap,
            MatKhau = hashedPassword,  // Lưu hash, không lưu plain text
            VaiTro = request.VaiTro
        };
        
        return await _taiKhoanRepo.Create(taiKhoan);
    }
    
    // Verify password khi đăng nhập
    public async Task<LoginResponse> DangNhap(LoginRequest request)
    {
        var taiKhoan = await _taiKhoanRepo.GetByUsername(request.TenDangNhap);
        
        if (taiKhoan == null)
            throw new UnauthorizedException("Tài khoản không tồn tại");
        
        // Verify password
        bool isValidPassword = BCrypt.Net.BCrypt.Verify(
            request.MatKhau,      // Plain text password
            taiKhoan.MatKhau      // Hashed password from DB
        );
        
        if (!isValidPassword)
            throw new UnauthorizedException("Mật khẩu không đúng");
        
        // Generate JWT token
        var token = _jwtHelper.GenerateToken(taiKhoan);
        
        return new LoginResponse { Token = token, User = taiKhoan };
    }
}
```

**Work Factor:**
- Work factor 11 = 2^11 = 2048 iterations
- Mỗi tăng 1 = tăng gấp đôi thời gian hash
- Trade-off giữa security và performance
- Khuyến nghị: 10-12 cho web applications

### 2.5.4. CORS (Cross-Origin Resource Sharing)

**Khái niệm:**
CORS là cơ chế cho phép web application từ domain này truy cập resources từ domain khác.

**Vấn đề:**
```
Frontend: http://localhost:3000
Backend:  http://localhost:5273

❌ Mặc định browser chặn cross-origin requests (Same-Origin Policy)
```

**Giải pháp trong dự án:**
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Cấu hình CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",      // Development
                "https://artgallery.com"      // Production
            )
            .AllowAnyMethod()                 // GET, POST, PUT, DELETE, etc.
            .AllowAnyHeader()                 // Authorization, Content-Type, etc.
            .AllowCredentials();              // Cookies, Authorization headers
    });
});

var app = builder.Build();

// Áp dụng CORS middleware
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

**CORS Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### 2.5.5. Dapper

**Tổng quan:**
Dapper là micro-ORM cho .NET, cung cấp cách đơn giản để map SQL queries sang objects.

**So sánh với Entity Framework:**
| Feature | Dapper | Entity Framework |
|---------|--------|------------------|
| Performance | ⚡ Rất nhanh | 🐢 Chậm hơn |
| Control | 🎯 Full control SQL | 🤖 Auto-generated SQL |
| Learning Curve | 📈 Dễ học | 📊 Phức tạp hơn |
| Flexibility | ✅ Linh hoạt | ⚠️ Hạn chế |

**Sử dụng trong dự án:**
```csharp
using Dapper;
using System.Data.SqlClient;

public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;
    
    public TacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }
    
    // Query trả về list
    public async Task<List<TacPham>> GetAll()
    {
        using var connection = new SqlConnection(_connectionString);
        
        var query = @"
            SELECT 
                tp.*,
                hs.TenHoaSi,
                dm.TenDanhMuc
            FROM TacPham tp
            INNER JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
            INNER JOIN DanhMuc dm ON tp.MaDanhMuc = dm.MaDanhMuc
            WHERE tp.TrangThai = 1
            ORDER BY tp.NgayTao DESC";
        
        var result = await connection.QueryAsync<TacPham>(query);
        return result.ToList();
    }
    
    // Query với parameters
    public async Task<TacPham?> GetById(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        
        var query = "SELECT * FROM TacPham WHERE MaTacPham = @Id";
        
        return await connection.QueryFirstOrDefaultAsync<TacPham>(
            query, 
            new { Id = id }
        );
    }
    
    // Execute stored procedure
    public async Task<List<TacPham>> GetByHoaSi(int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        
        var result = await connection.QueryAsync<TacPham>(
            "sp_GetTacPhamByHoaSi",
            new { MaHoaSi = maHoaSi },
            commandType: CommandType.StoredProcedure
        );
        
        return result.ToList();
    }
    
    // Insert và lấy ID
    public async Task<int> Create(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        
        var query = @"
            INSERT INTO TacPham (
                MaHoaSi, MaDanhMuc, TenTacPham, MoTa, Gia, 
                HinhAnh, SoLuong, TrangThai, NgayTao
            )
            VALUES (
                @MaHoaSi, @MaDanhMuc, @TenTacPham, @MoTa, @Gia,
                @HinhAnh, @SoLuong, @TrangThai, @NgayTao
            );
            SELECT CAST(SCOPE_IDENTITY() AS INT);";
        
        return await connection.ExecuteScalarAsync<int>(query, tacPham);
    }
    
    // Update
    public async Task<bool> Update(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        
        var query = @"
            UPDATE TacPham
            SET TenTacPham = @TenTacPham,
                MoTa = @MoTa,
                Gia = @Gia,
                HinhAnh = @HinhAnh,
                SoLuong = @SoLuong,
                TrangThai = @TrangThai
            WHERE MaTacPham = @MaTacPham";
        
        var rowsAffected = await connection.ExecuteAsync(query, tacPham);
        return rowsAffected > 0;
    }
    
    // Multi-mapping (JOIN nhiều bảng)
    public async Task<List<TacPhamDetail>> GetTacPhamWithDetails()
    {
        using var connection = new SqlConnection(_connectionString);
        
        var query = @"
            SELECT 
                tp.*, 
                hs.*, 
                dm.*
            FROM TacPham tp
            INNER JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
            INNER JOIN DanhMuc dm ON tp.MaDanhMuc = dm.MaDanhMuc";
        
        var result = await connection.QueryAsync<TacPham, HoaSi, DanhMuc, TacPhamDetail>(
            query,
            (tacPham, hoaSi, danhMuc) => new TacPhamDetail
            {
                TacPham = tacPham,
                HoaSi = hoaSi,
                DanhMuc = danhMuc
            },
            splitOn: "MaHoaSi,MaDanhMuc"
        );
        
        return result.ToList();
    }
}
```


---

## 2.6. Design Patterns áp dụng

### 2.6.1. Repository Pattern

**Mục đích:**
Tạo abstraction layer giữa business logic và data access, giúp code dễ test và maintain.

**Cấu trúc:**
```
Controller → Business Service → Repository → Database
```

**Ví dụ trong dự án:**
```csharp
// Interface
public interface ITacPhamRepository
{
    Task<List<TacPham>> GetAll();
    Task<TacPham?> GetById(int id);
    Task<int> Create(TacPham tacPham);
    Task<bool> Update(TacPham tacPham);
    Task<bool> Delete(int id);
}

// Implementation
public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;
    
    public TacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }
    
    public async Task<List<TacPham>> GetAll()
    {
        // Data access logic
    }
}

// Dependency Injection
builder.Services.AddScoped<ITacPhamRepository, TacPhamRepository>();
```

**Lợi ích:**
- Tách biệt concerns
- Dễ unit testing (mock repository)
- Dễ thay đổi data source
- Code reusability

### 2.6.2. Dependency Injection Pattern

**Mục đích:**
Inject dependencies vào class thay vì class tự tạo, giảm coupling.

**Các loại Lifetime:**
```csharp
// Singleton - 1 instance cho toàn app
builder.Services.AddSingleton<IEmailService, EmailService>();

// Scoped - 1 instance cho mỗi HTTP request
builder.Services.AddScoped<ITacPhamRepository, TacPhamRepository>();

// Transient - Tạo instance mới mỗi lần inject
builder.Services.AddTransient<ILogService, LogService>();
```

**Sử dụng trong Controller:**
```csharp
[ApiController]
[Route("api/hoa-si")]
public class HoaSiController : ControllerBase
{
    private readonly IHoaSiBusiness _hoaSiBusiness;
    private readonly ILogger<HoaSiController> _logger;
    
    // Constructor Injection
    public HoaSiController(
        IHoaSiBusiness hoaSiBusiness,
        ILogger<HoaSiController> logger)
    {
        _hoaSiBusiness = hoaSiBusiness;
        _logger = logger;
    }
    
    [HttpGet("tac-pham")]
    public async Task<ActionResult> GetTacPham()
    {
        var result = await _hoaSiBusiness.GetTacPham();
        return Ok(result);
    }
}
```

### 2.6.3. Factory Pattern

**Mục đích:**
Tạo objects mà không cần specify exact class.

**Ví dụ trong dự án:**
```csharp
// Factory Interface
public interface IPaymentFactory
{
    IPaymentProcessor CreateProcessor(string paymentMethod);
}

// Payment Processors
public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessPayment(PaymentRequest request);
}

public class CODPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessPayment(PaymentRequest request)
    {
        // COD logic
        return new PaymentResult { Success = true, Method = "COD" };
    }
}

public class BankingPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessPayment(PaymentRequest request)
    {
        // Banking API integration
        return new PaymentResult { Success = true, Method = "Banking" };
    }
}

public class MomoPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessPayment(PaymentRequest request)
    {
        // Momo API integration
        return new PaymentResult { Success = true, Method = "Momo" };
    }
}

// Factory Implementation
public class PaymentFactory : IPaymentFactory
{
    public IPaymentProcessor CreateProcessor(string paymentMethod)
    {
        return paymentMethod.ToUpper() switch
        {
            "COD" => new CODPaymentProcessor(),
            "BANKING" => new BankingPaymentProcessor(),
            "MOMO" => new MomoPaymentProcessor(),
            _ => throw new ArgumentException($"Unsupported payment method: {paymentMethod}")
        };
    }
}

// Usage
public class OrderBusiness
{
    private readonly IPaymentFactory _paymentFactory;
    
    public async Task<PaymentResult> ProcessOrder(Order order)
    {
        var processor = _paymentFactory.CreateProcessor(order.PaymentMethod);
        return await processor.ProcessPayment(new PaymentRequest
        {
            Amount = order.TotalAmount,
            OrderId = order.MaHoaDon
        });
    }
}
```

### 2.6.4. Middleware Pattern

**Mục đích:**
Xử lý HTTP requests/responses theo pipeline.

**Ví dụ Custom Middleware:**
```csharp
// ErrorHandlingMiddleware.cs
public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;
    
    public ErrorHandlingMiddleware(
        RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found");
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Internal server error"
            });
        }
    }
}

// Register middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
```

### 2.6.5. Observer Pattern (React Context)

**Mục đích:**
Notify nhiều components khi state thay đổi.

**Ví dụ trong dự án:**
```typescript
// CartContext.tsx
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Observers được notify khi cartItems thay đổi
  const addToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  };
  
  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };
  
  const clearCart = () => {
    setCartItems([]);
  };
  
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.gia * item.soLuong, 0);
  }, [cartItems]);
  
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Observer components
const Header: React.FC = () => {
  const { cartItems } = useCart();  // Subscribe to changes
  return <CartIcon count={cartItems.length} />;
};

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, totalAmount } = useCart();
  return (
    <div>
      {cartItems.map(item => (
        <CartItem key={item.id} item={item} onRemove={removeFromCart} />
      ))}
      <Total amount={totalAmount} />
    </div>
  );
};
```

---

## 2.7. Best Practices áp dụng

### 2.7.1. Backend Best Practices

**1. API Versioning:**
```csharp
[Route("api/v1/[controller]")]
public class TacPhamController : ControllerBase
{
    // Version 1 API
}

[Route("api/v2/[controller]")]
public class TacPhamV2Controller : ControllerBase
{
    // Version 2 API với breaking changes
}
```

**2. Consistent Response Format:**
```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
}

// Usage
[HttpGet("{id}")]
public async Task<ActionResult<ApiResponse<TacPham>>> GetById(int id)
{
    var tacPham = await _business.GetById(id);
    
    if (tacPham == null)
        return NotFound(new ApiResponse<TacPham>
        {
            Success = false,
            Message = "Tác phẩm không tồn tại"
        });
    
    return Ok(new ApiResponse<TacPham>
    {
        Success = true,
        Data = tacPham
    });
}
```

**3. Input Validation:**
```csharp
public class TaoTacPhamRequest
{
    [Required(ErrorMessage = "Tên tác phẩm không được để trống")]
    [StringLength(200, ErrorMessage = "Tên tác phẩm tối đa 200 ký tự")]
    public string TenTacPham { get; set; }
    
    [Required]
    [Range(1000, 1000000000, ErrorMessage = "Giá phải từ 1,000 đến 1,000,000,000")]
    public decimal Gia { get; set; }
    
    [Required]
    [Range(1, 100, ErrorMessage = "Số lượng phải từ 1 đến 100")]
    public int SoLuong { get; set; }
}

[HttpPost]
public async Task<ActionResult> Create([FromBody] TaoTacPhamRequest request)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    
    // Process request
}
```

**4. Logging:**
```csharp
public class HoaSiBusiness
{
    private readonly ILogger<HoaSiBusiness> _logger;
    
    public async Task<int> TaoTacPham(TaoTacPhamRequest request)
    {
        _logger.LogInformation(
            "Creating artwork: {TenTacPham} by artist {MaHoaSi}",
            request.TenTacPham,
            request.MaHoaSi
        );
        
        try
        {
            var result = await _repo.Create(request);
            _logger.LogInformation("Artwork created successfully: {MaTacPham}", result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating artwork");
            throw;
        }
    }
}
```

### 2.7.2. Frontend Best Practices

**1. Component Organization:**
```
src/
├── components/          # Reusable components
│   ├── common/         # Button, Input, Modal
│   ├── layout/         # Header, Footer, Sidebar
│   └── artwork/        # ArtworkCard, ArtworkGrid
├── pages/              # Page components
│   ├── Home.tsx
│   ├── ArtworkDetail.tsx
│   └── Admin/
├── services/           # API services
│   ├── api.ts
│   ├── artworkService.ts
│   └── authService.ts
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   └── useCart.ts
├── types/              # TypeScript types
│   └── index.ts
└── utils/              # Utility functions
    ├── formatters.ts
    └── validators.ts
```

**2. Custom Hooks:**
```typescript
// useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);
  
  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password);
    localStorage.setItem('token', response.token);
    setUser(response.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return { user, loading, login, logout };
};
```

**3. Error Handling:**
```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Đã xảy ra lỗi</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**4. Performance Optimization:**
```typescript
// Memoization
const ArtworkList: React.FC<{ artworks: Artwork[] }> = ({ artworks }) => {
  // Chỉ re-render khi artworks thay đổi
  const sortedArtworks = useMemo(() => {
    return [...artworks].sort((a, b) => b.luotXem - a.luotXem);
  }, [artworks]);
  
  return (
    <div>
      {sortedArtworks.map(artwork => (
        <ArtworkCard key={artwork.maTacPham} artwork={artwork} />
      ))}
    </div>
  );
};

// Lazy Loading
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const ArtistDashboard = lazy(() => import('./pages/Artist/ArtistDashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
        <Route path="/artist/*" element={<ArtistDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### 2.7.3. Security Best Practices

**1. SQL Injection Prevention:**
```csharp
// ❌ BAD: Vulnerable to SQL injection
var query = $"SELECT * FROM TaiKhoan WHERE TenDangNhap = '{username}'";

// ✅ GOOD: Parameterized query
var query = "SELECT * FROM TaiKhoan WHERE TenDangNhap = @Username";
var result = await connection.QueryAsync<TaiKhoan>(query, new { Username = username });
```

**2. XSS Prevention:**
```typescript
// React tự động escape HTML
const ArtworkDetail: React.FC = () => {
  return (
    <div>
      {/* Safe - React escapes HTML */}
      <h1>{artwork.tenTacPham}</h1>
      <p>{artwork.moTa}</p>
      
      {/* Dangerous - Only use with trusted content */}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
    </div>
  );
};
```

**3. CSRF Protection:**
```csharp
// ASP.NET Core tự động bảo vệ với ValidateAntiForgeryToken
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<ActionResult> Create([FromBody] TacPham tacPham)
{
    // Protected against CSRF
}
```

**4. Secure Password Storage:**
```csharp
// ❌ NEVER store plain text passwords
var taiKhoan = new TaiKhoan { MatKhau = request.MatKhau };

// ✅ Always hash passwords
var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.MatKhau, 11);
var taiKhoan = new TaiKhoan { MatKhau = hashedPassword };
```

---

## 2.8. Tổng kết

Chương 2 đã trình bày chi tiết các công nghệ và phương pháp được áp dụng trong dự án:

**Quy trình phát triển:**
- Áp dụng mô hình Agile với 5 giai đoạn rõ ràng
- Phân tích yêu cầu đầy đủ cho 3 nhóm người dùng
- Thiết kế kiến trúc 3-layer scalable và maintainable

**Backend (ASP.NET Core):**
- Kiến trúc 3-layer: Controllers, Business Logic, Data Access
- Dependency Injection cho loose coupling
- JWT Authentication cho bảo mật
- Repository Pattern cho data abstraction

**Frontend (React):**
- Component-based architecture
- Virtual DOM cho performance
- Context API cho state management
- React Router cho SPA navigation
- TypeScript cho type safety

**Database (SQL Server):**
- Thiết kế chuẩn hóa 3NF với 16 bảng
- Indexing strategy cho performance
- Stored Procedures cho complex logic
- ACID transactions cho data integrity
- Backup strategy cho disaster recovery

**Design Patterns:**
- Repository, Dependency Injection, Factory, Middleware, Observer

**Best Practices:**
- API versioning, consistent responses, input validation
- Error handling, logging, security measures
- Performance optimization, code organization

Các công nghệ và phương pháp này tạo nền tảng vững chắc cho việc xây dựng hệ thống bán tranh nghệ thuật trực tuyến chuyên nghiệp, bảo mật và hiệu quả.
