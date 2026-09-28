# 📍 API GATEWAY CỦA BẠN Ở ĐÂU?

## 🎯 CÂU TRẢ LỜI TRỰC TIẾP:

**API Gateway của bạn = `Program.cs` + Middleware Pipeline**

```
📂 BTL_BackEnd/
  📂 BTL_BackEnd/
    📄 Program.cs  ← 🎯 ĐÂY LÀ API GATEWAY!
    📂 Controllers/
    📂 Middleware/
    📂 BLL/
    📂 DAL/
```

---

## 🔍 TẠI SAO `Program.cs` LÀ API GATEWAY?

### Trong dự án của bạn:

```csharp
// File: Program.cs
var builder = WebApplication.CreateBuilder(args);

// ============================================
// 🌐 PHẦN 1: ĐĂNG KÝ SERVICES (Dependency Injection)
// ============================================
builder.Services.AddControllers();

// CORS - Cho phép cross-origin requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// JWT Authentication - Xác thực token
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { ... });

// Đăng ký Repository & Business Logic
builder.Services.AddScoped<ITaiKhoanRepository, TaiKhoanRepository>();
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
// ... 20+ services

// ============================================
// 🚀 PHẦN 2: BUILD APP & CONFIGURE MIDDLEWARE
// ============================================
var app = builder.Build();

// Middleware Pipeline (CHÍNH LÀ GATEWAY!)
app.UseCors("AllowAll");                      // ← Gateway cho CORS
app.UseExceptionHandlingMiddleware();          // ← Gateway cho Error Handling
app.UseAuthentication();                       // ← Gateway cho JWT Auth
app.UseAuthorization();                        // ← Gateway cho Role Check
app.MapControllers();                          // ← Gateway routing đến Controllers

app.Run();  // Start server on port 5273
```

---

## 🏗️ ĐÂY LÀ KIẾN TRÚC CỦA BẠN:

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│   - Web App (React)                                          │
│   - Mobile App (React Native)                                │
│   - Admin Dashboard                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Request
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    PROGRAM.CS                                │
│             (API Gateway Configuration)                      │
│                                                              │
│  🌐 Port: 5273                                              │
│  🔧 Base URL: http://10.59.67.116:5273                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         MIDDLEWARE PIPELINE                          │  │
│  │  (Được cấu hình trong Program.cs)                    │  │
│  │                                                       │  │
│  │  1️⃣ app.UseCors("AllowAll")                         │  │
│  │     → Check origin, add CORS headers                 │  │
│  │                                                       │  │
│  │  2️⃣ app.UseExceptionHandlingMiddleware()            │  │
│  │     → Catch exceptions, format error response        │  │
│  │                                                       │  │
│  │  3️⃣ app.UseAuthentication()                         │  │
│  │     → Parse JWT token, validate signature            │  │
│  │                                                       │  │
│  │  4️⃣ app.UseAuthorization()                          │  │
│  │     → Check roles, verify permissions                │  │
│  │                                                       │  │
│  │  5️⃣ app.MapControllers()                            │  │
│  │     → Route request to appropriate controller        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLERS                               │
│  - AuthController                                            │
│  - PublicController                                          │
│  - KhachHangController                                       │
│  - HoaSiController                                           │
│  - AdminController                                           │
│  - ... (12 controllers)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆚 SO SÁNH: GATEWAY THỰC SỰ vs GATEWAY CỦA BẠN

### ❌ **Microservices với API Gateway thực sự**:
```
Client → Kong/Ocelot Gateway → Service 1 (Products)
                             → Service 2 (Users)
                             → Service 3 (Orders)
                             → Service 4 (Payments)
```
- **Nhiều services** độc lập
- **Gateway riêng** cho routing
- Phức tạp, khó setup

---

### ✅ **Dự án của bạn (Monolithic với "Simple Gateway")**:
```
Client → Program.cs (Gateway) → Controllers → BLL → DAL → Database
```
- **1 service** duy nhất
- **Program.cs** đóng vai trò gateway
- Đơn giản, dễ maintain

---

## 📂 CÁC FILE THAM GIA VÀO "API GATEWAY":

### 1️⃣ **Program.cs** (Main Gateway)
```
📄 BTL_BackEnd/BTL_BackEnd/Program.cs
```
- Cấu hình middleware
- Đăng ký services
- Setup JWT authentication
- Configure CORS
- **Đây là nơi mọi request đi qua đầu tiên!**

---

### 2️⃣ **Middleware/ExceptionHandlingMiddleware.cs**
```
📄 BTL_BackEnd/BTL_BackEnd/Middleware/ExceptionHandlingMiddleware.cs
```
- Catch tất cả exceptions
- Format error response
- **Một phần của Gateway pipeline**

---

### 3️⃣ **Controllers/** (Routing Endpoints)
```
📂 BTL_BackEnd/BTL_BackEnd/Controllers/
  📄 AuthController.cs          → /api/auth/*
  📄 PublicController.cs        → /api/tranh/*, /api/hoa-si/*
  📄 KhachHangController.cs     → /api/khach-hang/*
  📄 HoaSiController.cs         → /api/hoa-si/*
  📄 AdminController.cs         → /api/admin/*
  📄 HoanTraController.cs       → /api/hoan-tra/*
  ... (12 controllers)
```
- Define routes
- Handle requests
- **Đây là "destinations" mà Gateway route tới**

---

### 4️⃣ **appsettings.json** (Gateway Configuration)
```
📄 BTL_BackEnd/BTL_BackEnd/appsettings.json
```
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=HeThongBanTranh;..."
  },
  "Jwt": {
    "Key": "YourSuperSecretKey...",
    "Issuer": "DoAn2_BackEnd",
    "Audience": "DoAn2_FrontEnd"
  }
}
```
- JWT configuration
- Database connection
- **Gateway settings**

---

## 🔄 LUỒNG REQUEST QUA "GATEWAY":

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client gửi request                                        │
│    POST http://10.59.67.116:5273/api/auth/dang-nhap        │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Kestrel Web Server (ASP.NET Core)                        │
│    - Listen on port 5273                                     │
│    - Accept HTTP connection                                  │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Program.cs - Middleware Pipeline                          │
│    (ĐÂY LÀ API GATEWAY!)                                    │
│                                                              │
│    app.UseCors()          → ✅ Check origin                 │
│    app.UseException()     → ✅ Wrap try-catch               │
│    app.UseAuthentication() → ✅ Parse JWT token             │
│    app.UseAuthorization() → ✅ Check roles                  │
│    app.MapControllers()   → ✅ Route to controller          │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AuthController.DangNhap()                                 │
│    - Validate credentials                                    │
│    - Generate JWT token                                      │
│    - Return response                                         │
└─────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Response trở về Client                                    │
│    { "success": true, "accessToken": "..." }                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 KẾT LUẬN:

### ✅ **API Gateway của bạn CHÍNH LÀ:**

1. **File `Program.cs`** - Main configuration
2. **Middleware Pipeline** - CORS, Auth, Exception Handling
3. **Controller Routing** - MapControllers()

### 📍 **Vị trí vật lý:**
```
c:\Users\huanp\Downloads\BTL_Mobile\BTL_BackEnd\BTL_BackEnd\Program.cs
```

### 🌐 **Network Address:**
```
http://10.59.67.116:5273
```

### 🔑 **Vai trò:**
- ✅ Entry point cho tất cả API requests
- ✅ Authentication & Authorization
- ✅ CORS handling
- ✅ Error handling
- ✅ Request routing
- ✅ Response formatting

---

## 💡 HIỂU ĐƠN GIẢN:

**Trong dự án MONOLITHIC như của bạn:**
- ❌ KHÔNG CÓ file riêng tên là "ApiGateway.cs"
- ❌ KHÔNG CÓ service riêng cho Gateway
- ✅ `Program.cs` + Middleware = API Gateway
- ✅ Mọi thứ tập trung trong 1 project duy nhất

**So sánh với nhà hàng:**
- **Microservices**: Nhiều quầy riêng (bếp, thu ngân, phục vụ) + 1 quầy lễ tân điều phối
- **Monolithic (bạn)**: 1 quầy duy nhất xử lý tất cả, nhưng có quy trình (middleware) để xử lý từng bước

---

## 🚀 NẾU MUỐN THÊM GATEWAY THỰC SỰ:

Bạn có thể thêm **Ocelot** (API Gateway cho .NET):

```
📦 Install: dotnet add package Ocelot

📄 ocelot.json:
{
  "Routes": [
    {
      "DownstreamPathTemplate": "/api/tranh",
      "UpstreamPathTemplate": "/products",
      "UpstreamHttpMethod": [ "Get" ]
    }
  ]
}

📄 Program.cs:
app.UseOcelot();
```

Nhưng với quy mô hiện tại, **KHÔNG CẦN THIẾT**! 👍

---

**Tóm lại**: API Gateway = `Program.cs` + Middleware Pipeline! 🎉
