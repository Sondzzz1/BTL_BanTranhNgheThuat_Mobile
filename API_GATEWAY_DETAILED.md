# 🚀 CHI TIẾT HOẠT ĐỘNG API GATEWAY

## 📌 LƯU Ý QUAN TRỌNG

Dự án này **KHÔNG SỬ DỤNG API GATEWAY RIÊNG BIỆT** (như Ocelot, Kong, hoặc Azure API Gateway).

Thay vào đó, **ASP.NET Core Web API** đóng vai trò như một **"Simple Gateway"** với:
- Routing tập trung
- Middleware pipeline
- Cross-cutting concerns

---

## 🏗️ KIẾN TRÚC THỰC TẾ

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │   Admin      │      │
│  │   (React)    │  │(React Native)│  │  Dashboard   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   HTTP/HTTPS Request                         │
│                            ↓                                 │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              ASP.NET CORE WEB API (Port 5273)               │
│                    "Simple Gateway"                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               MIDDLEWARE PIPELINE                       │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  1. CORS Middleware                              │  │ │
│  │  │     - Check Origin                               │  │ │
│  │  │     - Add CORS headers                           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                        ↓                                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  2. Exception Handling Middleware                │  │ │
│  │  │     - Try-Catch toàn bộ request                  │  │ │
│  │  │     - Format error response                      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                        ↓                                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  3. Authentication Middleware                    │  │ │
│  │  │     - Parse JWT token from header                │  │ │
│  │  │     - Validate token (signature, expiry)         │  │ │
│  │  │     - Extract claims                             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                        ↓                                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  4. Authorization Middleware                     │  │ │
│  │  │     - Check user roles                           │  │ │
│  │  │     - Verify permissions                         │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                        ↓                                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  5. Routing Middleware                           │  │ │
│  │  │     - Match URL to Controller/Action             │  │ │
│  │  │     - Route to appropriate handler               │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   CONTROLLERS                           │ │
│  │  /api/auth/* → AuthController                          │ │
│  │  /api/tranh/* → PublicController                       │ │
│  │  /api/khach-hang/* → KhachHangController               │ │
│  │  /api/hoa-si/* → HoaSiController                       │ │
│  │  /api/admin/* → AdminController                        │ │
│  │  /api/hoan-tra/* → HoanTraController                   │ │
│  │  /api/custom-art/* → CustomArtController               │ │
│  │  ... (12 controllers)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│                         (BLL)                                │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATA ACCESS LAYER (DAL)                     │
│                     Repository Pattern                       │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   SQL SERVER DATABASE                        │
│                  (HeThongBanTranh)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 LUỒNG XỬ LÝ REQUEST CHI TIẾT

### 🎯 VÍ DỤ 1: LOGIN REQUEST

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: CLIENT GỬI REQUEST                                  │
└─────────────────────────────────────────────────────────────┘

POST http://10.59.67.116:5273/api/auth/dang-nhap
Content-Type: application/json

{
  "tenDangNhap": "user123",
  "matKhau": "password123"
}

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: CORS MIDDLEWARE                                     │
└─────────────────────────────────────────────────────────────┘

Policy: "AllowAll"
✅ Origin: http://localhost:3000 → ALLOWED
✅ Origin: http://10.59.67.164:8081 → ALLOWED (Expo)
✅ Origin: ANY → ALLOWED

Response Headers:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: *

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: EXCEPTION HANDLING MIDDLEWARE                       │
└─────────────────────────────────────────────────────────────┘

try {
  await next(context); // Tiếp tục pipeline
}
catch (Exception ex) {
  // Nếu có lỗi → Trả về JSON error
  {
    "message": "Đã xảy ra lỗi trên server",
    "error": ex.Message
  }
}

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: AUTHENTICATION MIDDLEWARE                           │
└─────────────────────────────────────────────────────────────┘

🔍 Check header: "Authorization"
❌ NOT FOUND (Login endpoint không cần auth)
✅ SKIP - Continue

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: ROUTING                                             │
└─────────────────────────────────────────────────────────────┘

URL: /api/auth/dang-nhap
Method: POST

Match:
✅ Controller: AuthController
✅ Action: DangNhap
✅ Route: [Route("api/auth")][HttpPost("dang-nhap")]

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: CONTROLLER EXECUTION                                │
└─────────────────────────────────────────────────────────────┘

AuthController.DangNhap(request)
  ↓
Call: _authBusiness.DangNhap(request)
  ↓
Validate credentials
  ↓
Generate JWT token
  ↓
Generate refresh token
  ↓
Save refresh token to DB

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: RESPONSE                                            │
└─────────────────────────────────────────────────────────────┘

HTTP 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "user": {
      "maTaiKhoan": 1,
      "tenDangNhap": "user123",
      "vaiTro": "KhachHang",
      "maNguoiDung": 5
    }
  }
}
```

---

### 🎯 VÍ DỤ 2: GET PRODUCTS (PUBLIC)

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: CLIENT GỬI REQUEST                                  │
└─────────────────────────────────────────────────────────────┘

GET http://10.59.67.116:5273/api/tranh?keyword=phong%20canh

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2-5: MIDDLEWARE PIPELINE                               │
└─────────────────────────────────────────────────────────────┘

CORS: ✅ PASS
Exception Handling: ✅ Wrapped
Authentication: ⚠️ SKIP (public endpoint)
Authorization: ⚠️ SKIP
Routing: ✅ Match → PublicController.GetAllTranh()

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: CONTROLLER LOGIC                                    │
└─────────────────────────────────────────────────────────────┘

PublicController.GetAllTranh(keyword: "phong canh")
  ↓
1. Get all TacPham from repository
2. Preload HoaSi và DanhMuc (avoid N+1 queries)
3. Filter by TrangThai == 1 (Approved only)
4. Filter by keyword (case-insensitive)
5. Map to TacPhamResponse DTO
6. Return list

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: JSON SERIALIZATION                                  │
└─────────────────────────────────────────────────────────────┘

C# Properties → camelCase JSON
TenTacPham → tenTacPham
MaTacPham → maTacPham
HinhAnh → hinhAnh

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 8: RESPONSE                                            │
└─────────────────────────────────────────────────────────────┘

HTTP 200 OK
Content-Type: application/json

[
  {
    "maTacPham": 1,
    "tenTacPham": "Phong Cảnh Núi Rừng",
    "tenHoaSi": "Nguyễn Văn A",
    "tenDanhMuc": "Phong Cảnh",
    "gia": 5000000,
    "soLuong": 1,
    "moTa": "Tranh vẽ phong cảnh thiên nhiên",
    "hinhAnh": "http://example.com/image.jpg",
    "kichThuoc": "60x80cm",
    "chatLieu": "Sơn dầu",
    "chatLieuKhung": "Gỗ"
  }
]
```

---

### 🎯 VÍ DỤ 3: ADD TO CART (AUTHENTICATED)

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: CLIENT GỬI REQUEST                                  │
└─────────────────────────────────────────────────────────────┘

POST http://10.59.67.116:5273/api/khach-hang/gio-hang
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "maTacPham": 5,
  "soLuong": 1
}

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2-3: CORS & EXCEPTION HANDLING                         │
└─────────────────────────────────────────────────────────────┘

CORS: ✅ PASS
Exception Handling: ✅ Wrapped

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: AUTHENTICATION MIDDLEWARE (CHI TIẾT)                │
└─────────────────────────────────────────────────────────────┘

1. Extract header: "Authorization"
   ✅ Found: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

2. Parse JWT token
   ✅ Algorithm: HS256
   ✅ Type: JWT

3. Validate token signature
   Key: "YourSuperSecretKeyThatIsAtLeast32CharactersLong!"
   ✅ Signature valid

4. Check expiration
   exp: 1735660800 (Unix timestamp)
   now: 1735574400
   ✅ Not expired

5. Validate Issuer
   Expected: "DoAn2_BackEnd"
   Actual: "DoAn2_BackEnd"
   ✅ Valid

6. Validate Audience
   Expected: "DoAn2_FrontEnd"
   Actual: "DoAn2_FrontEnd"
   ✅ Valid

7. Extract Claims
   {
     "MaTaiKhoan": "1",
     "TenDangNhap": "user123",
     "VaiTro": "KhachHang",
     "MaNguoiDung": "5",
     "exp": "1735660800"
   }

8. Set HttpContext.User
   ✅ User authenticated
   ✅ Claims populated

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 5: AUTHORIZATION                                       │
└─────────────────────────────────────────────────────────────┘

Endpoint: [Authorize]
Check: Is user authenticated?
✅ YES - HttpContext.User.Identity.IsAuthenticated = true

Check role (nếu có [Authorize(Roles = "...")])
Endpoint: /api/khach-hang/* → No specific role required
✅ PASS

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 6: ROUTING                                             │
└─────────────────────────────────────────────────────────────┘

URL: /api/khach-hang/gio-hang
Method: POST

Match:
✅ Controller: KhachHangController
✅ Action: ThemVaoGioHang
✅ Route: [Route("api/khach-hang")][HttpPost("gio-hang")]

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 7: CONTROLLER EXECUTION                                │
└─────────────────────────────────────────────────────────────┘

KhachHangController.ThemVaoGioHang(request)
  ↓
1. Get MaNguoiDung from JWT claims
   var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
   → maNguoiDung = 5

2. Call Business Layer
   _khachHangBusiness.ThemVaoGioHang(maNguoiDung, request)
     ↓
   3. Check if product exists
   4. Check if product available (SoLuong > 0)
   5. Check if already in cart → Update quantity
   6. Insert/Update GioHang record
   7. Return success

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 8: RESPONSE                                            │
└─────────────────────────────────────────────────────────────┘

HTTP 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Đã thêm vào giỏ hàng",
  "data": {
    "maGioHang": 123,
    "maTacPham": 5,
    "soLuong": 1
  }
}
```

---

### 🎯 VÍ DỤ 4: ADMIN ACCESS (ROLE-BASED)

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: CLIENT GỬI REQUEST                                  │
└─────────────────────────────────────────────────────────────┘

GET http://10.59.67.116:5273/api/admin/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ MIDDLEWARE PIPELINE                                          │
└─────────────────────────────────────────────────────────────┘

CORS: ✅ PASS
Exception: ✅ Wrapped
Authentication: ✅ Token valid, User = "user123"

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ AUTHORIZATION MIDDLEWARE (CHI TIẾT)                         │
└─────────────────────────────────────────────────────────────┘

Endpoint: [Authorize(Roles = "Admin")]

1. Check authentication
   ✅ User is authenticated

2. Check role from claims
   VaiTro: "KhachHang"
   Required: "Admin"
   ❌ MISMATCH!

3. Return 403 Forbidden

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ RESPONSE (SHORT-CIRCUIT - KHÔNG ĐẾN CONTROLLER)            │
└─────────────────────────────────────────────────────────────┘

HTTP 403 Forbidden
Content-Type: application/json

{
  "message": "Access denied. Admin role required."
}

❌ REQUEST STOPPED - Không thực thi controller
```

---

## 🔑 JWT TOKEN PROCESSING

### 📝 Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYVRhaUtob2FuIjoiMSIsIlRlbkRhbmdOaGFwIjoidXNlcjEyMyIsIlZhaVRybyI6IktoYWNoSGFuZyIsIk1hTmd1b2lEdW5nIjoiNSIsImV4cCI6MTczNTY2MDgwMCwiaXNzIjoiRG9BbjJfQmFja0VuZCIsImF1ZCI6IkRvQW4yX0Zyb250RW5kIn0.signature

       HEADER          .            PAYLOAD              .    SIGNATURE
```

### 📦 Token Payload (Decoded)

```json
{
  "MaTaiKhoan": "1",
  "TenDangNhap": "user123",
  "VaiTro": "KhachHang",
  "MaNguoiDung": "5",
  "exp": 1735660800,
  "iss": "DoAn2_BackEnd",
  "aud": "DoAn2_FrontEnd"
}
```

### 🔐 Validation Steps

```
┌────────────────────────────────────────────┐
│ 1. SIGNATURE VERIFICATION                  │
├────────────────────────────────────────────┤
│ Key: "YourSuperSecretKeyThatIs..."        │
│ Algorithm: HMAC-SHA256                     │
│ Result: ✅ Valid / ❌ Invalid              │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ 2. EXPIRATION CHECK                        │
├────────────────────────────────────────────┤
│ exp: 1735660800                            │
│ now: 1735574400                            │
│ Result: ✅ Valid / ❌ Expired              │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ 3. ISSUER CHECK                            │
├────────────────────────────────────────────┤
│ Expected: "DoAn2_BackEnd"                  │
│ Actual: "DoAn2_BackEnd"                    │
│ Result: ✅ Valid / ❌ Invalid              │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ 4. AUDIENCE CHECK                          │
├────────────────────────────────────────────┤
│ Expected: "DoAn2_FrontEnd"                 │
│ Actual: "DoAn2_FrontEnd"                   │
│ Result: ✅ Valid / ❌ Invalid              │
└────────────────────────────────────────────┘
           ↓
┌────────────────────────────────────────────┐
│ 5. SET HttpContext.User                    │
├────────────────────────────────────────────┤
│ User.Identity.IsAuthenticated = true       │
│ User.Claims = [...]                        │
└────────────────────────────────────────────┘
```

---

## 🎛️ ROUTING MECHANISM

### URL Matching Process

```
┌─────────────────────────────────────────────────────────────┐
│ REQUEST: POST /api/auth/dang-nhap                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. SCAN ALL CONTROLLERS                                     │
└─────────────────────────────────────────────────────────────┘

AuthController:
  [Route("api/auth")]
  
  Methods:
  - [HttpPost("dang-nhap")] ✅ MATCH!
  - [HttpPost("dang-ky")]
  - [HttpPost("dang-xuat")]
  - [HttpPost("lam-moi-token")]
  - [HttpGet("me")]
  - [HttpPost("doi-mat-khau")]

                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BUILD FULL ROUTE                                         │
└─────────────────────────────────────────────────────────────┘

Base: "api/auth"     (from [Route("api/auth")])
Action: "dang-nhap"  (from [HttpPost("dang-nhap")])

Full Route: "api/auth/dang-nhap"
Method: POST

✅ MATCH!

                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. INVOKE ACTION                                            │
└─────────────────────────────────────────────────────────────┘

Controller: AuthController
Action: DangNhap
Parameters: DangNhapRequest (from body)
```

### Route Priority

```
1. Exact match (highest priority)
   /api/auth/dang-nhap → [HttpPost("dang-nhap")]

2. Parameter routes
   /api/tranh/5 → [HttpGet("{id}")]

3. Wildcard routes (lowest priority)
   /api/* → Generic handler
```

---

## ⚠️ ERROR HANDLING FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ ANYWHERE IN PIPELINE                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
              Exception occurs!
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ EXCEPTION HANDLING MIDDLEWARE CATCHES                       │
└─────────────────────────────────────────────────────────────┘

try {
  await next(context);
}
catch (Exception ex) {
  // Log error
  _logger.LogError(ex, "Unhandled exception");
  
  // Build error response
  var response = new {
    message = "Đã xảy ra lỗi trên server",
    error = ex.Message,
    details = ex.InnerException?.Message
  };
  
  // Set status code
  context.Response.StatusCode = 500;
  context.Response.ContentType = "application/json";
  
  // Write JSON response
  await context.Response.WriteAsync(
    JsonSerializer.Serialize(response)
  );
}

                    ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE TO CLIENT                                          │
└─────────────────────────────────────────────────────────────┘

HTTP 500 Internal Server Error
Content-Type: application/json

{
  "message": "Đã xảy ra lỗi trên server",
  "error": "Object reference not set to an instance",
  "details": "Connection timeout"
}
```

---

## 🌍 CORS HANDLING

### Preflight Request (OPTIONS)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT SENDS PREFLIGHT                                       │
└─────────────────────────────────────────────────────────────┘

OPTIONS http://10.59.67.116:5273/api/tranh
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type,authorization

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ CORS MIDDLEWARE RESPONSE                                     │
└─────────────────────────────────────────────────────────────┘

HTTP 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Max-Age: 86400

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ CLIENT SENDS ACTUAL REQUEST                                  │
└─────────────────────────────────────────────────────────────┘

POST http://10.59.67.116:5273/api/tranh
Origin: http://localhost:3000
Content-Type: application/json
Authorization: Bearer token...

                    ↓

✅ Request processed normally
```

---

## 📊 PERFORMANCE CONSIDERATIONS

### 1. **N+1 Query Prevention**

❌ **BAD** (N+1 queries):
```csharp
var tacPhams = await _tacPhamRepo.GetAll();
foreach (var tp in tacPhams)
{
  var hoaSi = await _hoaSiRepo.GetById(tp.MaHoaSi); // Query per item!
  var danhMuc = await _danhMucRepo.GetById(tp.MaDanhMuc); // Query per item!
}
```

✅ **GOOD** (Preload):
```csharp
var tacPhams = await _tacPhamRepo.GetAll();
var hoaSis = await _hoaSiRepo.GetAll(); // 1 query
var hoaSiMap = hoaSis.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);
var danhMucs = await _danhMucRepo.GetAll(); // 1 query
var danhMucMap = danhMucs.ToDictionary(d => d.MaDanhMuc, d => d.TenDanhMuc);

foreach (var tp in tacPhams)
{
  var tenHoaSi = hoaSiMap[tp.MaHoaSi]; // O(1) lookup
  var tenDanhMuc = danhMucMap[tp.MaDanhMuc]; // O(1) lookup
}
```

### 2. **Async/Await Usage**

```csharp
// Non-blocking I/O
public async Task<ActionResult> GetAllTranh()
{
  var data = await _tacPhamRepo.GetAll(); // ✅ Async
  return Ok(data);
}
```

---

## 🔧 CONFIGURATION

### Program.cs - Middleware Order

```csharp
var app = builder.Build();

// 1. Development tools
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. CORS (must be early!)
app.UseCors("AllowAll");

// 3. Exception handling (wrap everything)
app.UseExceptionHandlingMiddleware();

// 4. Authentication (parse JWT)
app.UseAuthentication();

// 5. Authorization (check roles)
app.UseAuthorization();

// 6. Controllers (final handler)
app.MapControllers();

app.Run();
```

⚠️ **ORDER MATTERS!** Thứ tự middleware rất quan trọng.

---

## 🎯 ĐIỂM MẠNH & HẠN CHẾ

### ✅ Điểm mạnh:
- ✅ Đơn giản, dễ hiểu, dễ maintain
- ✅ Không cần infrastructure phức tạp
- ✅ Latency thấp (không có hop trung gian)
- ✅ Phù hợp cho dự án vừa và nhỏ
- ✅ Tích hợp tốt với ASP.NET Core ecosystem

### ❌ Hạn chế:
- ❌ Không có rate limiting
- ❌ Không có API versioning rõ ràng
- ❌ Không có centralized logging/monitoring
- ❌ Không có request/response caching
- ❌ Không có load balancing
- ❌ Khó scale horizontally (single service)

---

## 🚀 NÂNG CẤP LÊN API GATEWAY THỰC SỰ

Nếu muốn nâng cấp, có thể dùng:

1. **Ocelot** (ASP.NET Core Gateway)
2. **Kong** (Open-source)
3. **Azure API Management**
4. **AWS API Gateway**

Nhưng với quy mô hiện tại, **"Simple Gateway"** này **ĐỦ DÙNG**! ✅

---

**Kết luận**: Đây là **Monolithic API** với routing tập trung, chứ không phải microservices với API Gateway riêng. Nhưng nó hoạt động tốt cho dự án này! 🎉
