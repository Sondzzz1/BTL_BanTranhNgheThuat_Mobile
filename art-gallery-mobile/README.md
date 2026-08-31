# Art Gallery Mobile App

Ứng dụng Mobile bán tranh nghệ thuật cho KHÁCH HÀNG (Customer) - **ĐÃ HOÀN THÀNH**.

## 🎯 Mục đích

Đây là ứng dụng Mobile **CHỈ DÀNH CHO CUSTOMER**, phát triển bằng React Native + Expo SDK 54, kết nối với Backend ASP.NET Core và Database SQL Server hiện có.

**KHÔNG có chức năng Admin trên Mobile** - Admin vẫn quản lý trên Website.

## ✅ Tính năng đã hoàn thành

### 1. Xác thực (Authentication)
- ✅ Đăng nhập với email/password
- ✅ Đăng ký tài khoản mới với validation
- ✅ Lưu JWT token tự động
- ✅ Tự động đăng nhập khi mở app
- ✅ Đăng xuất

### 2. Trang chủ (Home)
- ✅ Hiển thị danh mục sản phẩm (horizontal scroll)
- ✅ Sản phẩm nổi bật (6 sản phẩm đầu)
- ✅ Thống kê tổng quan (số sản phẩm, danh mục, còn hàng)
- ✅ Pull-to-refresh
- ✅ Navigate đến Products với filter danh mục

### 3. Sản phẩm (Products)
- ✅ Danh sách tất cả sản phẩm
- ✅ Tìm kiếm theo tên, họa sĩ, danh mục
- ✅ Lọc theo danh mục (chips filter)
- ✅ Hiển thị số lượng kết quả
- ✅ Pull-to-refresh
- ✅ Empty state khi không có sản phẩm

### 4. Chi tiết sản phẩm (Product Detail)
- ✅ Hiển thị hình ảnh lớn
- ✅ Thông tin chi tiết (tên, giá, họa sĩ, danh mục)
- ✅ Mô tả sản phẩm
- ✅ Thông số (kích thước, chất liệu, khung)
- ✅ Trạng thái tồn kho
- ✅ Chọn số lượng muốn mua
- ✅ Thêm vào giỏ hàng
- ✅ Sản phẩm gợi ý tương tự
- ✅ Badge "Hết hàng" nếu không còn

### 5. Giỏ hàng (Cart)
- ✅ Xem tất cả sản phẩm trong giỏ
- ✅ Hiển thị hình ảnh, tên, giá, số lượng
- ✅ Thay đổi số lượng (+/-)
- ✅ Xóa sản phẩm khỏi giỏ (với confirmation)
- ✅ Validation số lượng tồn kho
- ✅ Tính tổng tiền tự động
- ✅ Nút thanh toán
- ✅ Empty state khi giỏ trống

### 6. Thanh toán (Checkout)
- ✅ Hiển thị tóm tắt đơn hàng
- ✅ Form thông tin giao hàng (tên, SĐT, địa chỉ)
- ✅ Tự động điền thông tin từ profile
- ✅ Validation form đầy đủ
- ✅ Xác nhận đặt hàng
- ✅ Tạo đơn hàng qua API
- ✅ Navigate đến màn hình thành công

### 7. Đặt hàng thành công (Order Success)
- ✅ Hiển thị icon success
- ✅ Hiển thị mã đơn hàng
- ✅ Thông báo thành công
- ✅ Button "Xem đơn hàng"
- ✅ Button "Tiếp tục mua sắm"
- ✅ Không cho back về checkout

### 8. Đơn hàng (Orders)
- ✅ Danh sách tất cả đơn hàng
- ✅ Sắp xếp theo ngày (mới nhất trước)
- ✅ Trạng thái đơn với màu sắc:
  - Chờ xác nhận (Cam)
  - Đã xác nhận (Xanh dương)
  - Đang giao (Tím)
  - Hoàn thành (Xanh lá)
  - Đã hủy (Đỏ)
- ✅ Hiển thị tóm tắt sản phẩm
- ✅ Hiển thị lý do hủy (nếu có)
- ✅ Pull-to-refresh
- ✅ Empty state

### 9. Chi tiết đơn hàng (Order Detail)
- ✅ Thông tin đơn hàng đầy đủ
- ✅ Thông tin giao hàng
- ✅ Danh sách sản phẩm trong đơn
- ✅ Tính tổng tiền
- ✅ Nút hủy đơn (chỉ khi status = 0 hoặc 1)
- ✅ Hiển thị lý do hủy nếu đã hủy
- ✅ Note liên hệ support

### 10. Tài khoản (Profile)
- ✅ Xem thông tin cá nhân
- ✅ Chỉnh sửa thông tin (tên, email, SĐT, địa chỉ)
- ✅ Validation form
- ✅ Lưu thay đổi
- ✅ Hủy chỉnh sửa
- ✅ Đăng xuất với confirmation

## 🛠️ Công nghệ sử dụng

- **React Native 0.76.3**
- **Expo SDK 54** (downgraded để tương thích tốt hơn)
- **TypeScript 5.3.3**
- **React Navigation 7** (Stack + Bottom Tabs)
- **Axios** (HTTP Client với JWT interceptor)
- **AsyncStorage** (Lưu JWT token)

## 📋 Yêu cầu

- Node.js >= 18
- npm
- **Expo Go app** trên điện thoại (để test)
- Backend ASP.NET Core đang chạy (port 5273)
- Máy tính và điện thoại **cùng WiFi**

## 🚀 Cài đặt và chạy

### Bước 1: Cài dependencies

```bash
cd art-gallery-mobile
npm install --legacy-peer-deps
```

**Lưu ý:** Phải dùng `--legacy-peer-deps` do conflicts trong dependencies.

### Bước 2: Cấu hình API URL

**QUAN TRỌNG:** Phải cập nhật IP máy tính!

#### 2.1. Lấy IP máy tính

**Windows:**
```cmd
ipconfig
```
Tìm **IPv4 Address** (ví dụ: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# hoặc
ip addr
```

#### 2.2. Cập nhật file config

Mở file `constants/api.ts` và thay đổi:

```typescript
export const API_BASE_URL = 'http://192.168.1.100:5273/api';
//                                ^^^^^^^^^^^^^^
//                                Thay bằng IP của bạn
```

**Lưu ý:** 
- KHÔNG dùng `localhost` (mobile không truy cập được localhost của máy tính)
- Phải dùng IP thực của máy tính
- Backend phải allow CORS (đã có sẵn)

### Bước 3: Chạy Backend

```bash
cd DoAn3_BackEnd/DoAn2_BackEnd
dotnet run
```

Backend sẽ chạy ở: `http://localhost:5273`

Kiểm tra: Mở browser và vào `http://localhost:5273/api/tacpham` - nếu thấy JSON là OK.

### Bước 4: Chạy Mobile App

```bash
cd art-gallery-mobile
npx expo start
```

Sẽ xuất hiện QR code trong terminal.

### Bước 5: Mở app trên điện thoại

**Cách 1: Expo Go (Khuyến nghị)**
1. Cài đặt **Expo Go** từ:
   - iOS: App Store
   - Android: Play Store
2. Mở Expo Go
3. Quét QR code từ terminal
4. Đợi app load (lần đầu sẽ lâu hơn)

**Cách 2: Emulator/Simulator**
- Android: Nhấn `a` trong terminal (yêu cầu Android Studio)
- iOS: Nhấn `i` trong terminal (yêu cầu Mac + Xcode)

**Lưu ý:** Điện thoại và máy tính phải **cùng mạng WiFi**!

## 📂 Cấu trúc thư mục

```
art-gallery-mobile/
├── app/                          # Màn hình chính
│   ├── auth/                     # Xác thực
│   │   ├── LoginScreen.tsx       # Đăng nhập
│   │   └── RegisterScreen.tsx    # Đăng ký
│   ├── tabs/                     # Bottom tabs
│   │   ├── HomeScreen.tsx        # Trang chủ
│   │   ├── ProductsScreen.tsx    # Danh sách sản phẩm
│   │   ├── CartScreen.tsx        # Giỏ hàng
│   │   ├── OrdersScreen.tsx      # Đơn hàng
│   │   └── ProfileScreen.tsx     # Tài khoản
│   ├── products/                 
│   │   └── ProductDetailScreen.tsx  # Chi tiết sản phẩm
│   ├── orders/
│   │   └── OrderDetailScreen.tsx    # Chi tiết đơn hàng
│   ├── CheckoutScreen.tsx        # Thanh toán
│   └── OrderSuccessScreen.tsx    # Đặt hàng thành công
├── components/                   # Components tái sử dụng
│   ├── ProductCard.tsx
│   ├── Loading.tsx
│   ├── ErrorMessage.tsx
│   └── EmptyState.tsx
├── services/                     # API services
│   ├── api.ts                    # Axios instance + JWT interceptor
│   ├── authService.ts            # Auth API
│   ├── productService.ts         # Product API
│   ├── cartService.ts            # Cart API
│   ├── orderService.ts           # Order API
│   └── customerService.ts        # Customer/Profile API
├── context/                      # React Context
│   └── AuthContext.tsx           # Auth state management
├── types/                        # TypeScript types
│   ├── auth.ts
│   ├── product.ts
│   ├── cart.ts
│   └── order.ts
├── constants/                    
│   └── api.ts                    # API config (CẦN CẬP NHẬT IP)
├── assets/                       # Images, icons
├── App.tsx                       # Entry point + Navigation
└── package.json
```

## 🎯 Luồng sử dụng app

### Người dùng mới (Chưa có tài khoản)

1. Mở app → Màn hình **Login**
2. Nhấn "**Đăng ký ngay**" → **RegisterScreen**
3. Điền form:
   - Họ tên
   - Email
   - Số điện thoại (10-11 số)
   - Địa chỉ
   - Mật khẩu (ít nhất 6 ký tự)
   - Xác nhận mật khẩu
4. Nhấn "**Đăng ký**"
5. Đăng ký thành công → Tự động đăng nhập → **Home**

### Mua hàng

1. Xem sản phẩm ở **Home** hoặc **Products**
2. Nhấn vào sản phẩm → **ProductDetailScreen**
3. Xem thông tin chi tiết
4. Chọn số lượng (nếu còn hàng)
5. Nhấn "**Thêm vào giỏ**"
6. Alert hiện ra → Chọn "**Xem giỏ hàng**"
7. **CartScreen** → Kiểm tra giỏ → Nhấn "**Thanh toán**"
8. **CheckoutScreen** → Điền thông tin giao hàng → "**Đặt hàng**"
9. Xác nhận → **OrderSuccessScreen**
10. Chọn "**Xem đơn hàng**" hoặc "**Tiếp tục mua sắm**"

### Quản lý đơn hàng

1. Vào tab **Orders**
2. Xem danh sách đơn hàng (mới nhất trước)
3. Nhấn vào đơn → **OrderDetailScreen**
4. Xem chi tiết đơn
5. Có thể **Hủy đơn** nếu:
   - Status = Chờ xác nhận (0)
   - Status = Đã xác nhận (1)
6. Sau khi hủy, không thể hủy lại

### Cập nhật thông tin

1. Vào tab **Profile**
2. Nhấn "**Chỉnh sửa**"
3. Sửa thông tin
4. Nhấn "**Lưu**" hoặc "**Hủy**"

### Đăng xuất

1. Vào tab **Profile**
2. Cuộn xuống → Nhấn "**Đăng xuất**"
3. Xác nhận
4. Về màn hình **Login**

## 📡 API Endpoints đã tích hợp

### Authentication (Public)
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký

### Products (Public)
- `GET /tacpham` - Lấy tất cả sản phẩm
- `GET /tacpham/{id}` - Chi tiết sản phẩm
- `GET /tacpham/{id}/goi-y` - Gợi ý sản phẩm

### Categories (Public)
- `GET /danhmuc` - Lấy danh mục

### Cart (Auth Required)
- `GET /giohang` - Lấy giỏ hàng
- `POST /giohang` - Thêm vào giỏ
- `PUT /giohang/{id}` - Cập nhật số lượng
- `DELETE /giohang/{id}` - Xóa khỏi giỏ

### Orders (Auth Required)
- `GET /donhang/customer` - Đơn hàng của tôi
- `GET /donhang/{id}` - Chi tiết đơn hàng
- `POST /donhang` - Tạo đơn hàng mới
- `PUT /donhang/{id}/cancel` - Hủy đơn hàng

### Customer/Profile (Auth Required)
- `GET /khachhang/profile` - Lấy thông tin
- `PUT /khachhang/profile` - Cập nhật thông tin

## 🔒 Authentication Flow

1. User đăng nhập → Backend trả về:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": { ... }
   }
   ```

2. App lưu token vào **AsyncStorage**

3. **Axios Interceptor** tự động thêm header cho mọi request:
   ```
   Authorization: Bearer <token>
   ```

4. Nếu token hết hạn → Backend trả 401 → App tự động logout

5. Khi mở app:
   - Đọc token từ AsyncStorage
   - Nếu có → Tự động đăng nhập
   - Nếu không → Hiển thị Login

## 🎨 Trạng thái đơn hàng

| Status | Tên | Màu sắc | Có thể hủy |
|--------|-----|---------|------------|
| 0 | Chờ xác nhận | Cam (#f59e0b) | ✅ Có |
| 1 | Đã xác nhận | Xanh dương (#3b82f6) | ✅ Có |
| 2 | Đang giao | Tím (#8b5cf6) | ❌ Không |
| 3 | Hoàn thành | Xanh lá (#10b981) | ❌ Không |
| 4 | Đã hủy | Đỏ (#ef4444) | ❌ Không |

## 🐛 Troubleshooting (Xử lý lỗi)

### 1. Lỗi: Network Error / Không kết nối được API

**Triệu chứng:**
- App báo "Network Error"
- Không load được sản phẩm
- Không login được

**Nguyên nhân:**
- Backend không chạy
- IP address sai
- Không cùng WiFi
- Firewall chặn

**Giải pháp:**

1. **Kiểm tra Backend đang chạy:**
   ```bash
   # Terminal 1: Backend
   cd DoAn3_BackEnd/DoAn2_BackEnd
   dotnet run
   ```
   
   Mở browser: `http://localhost:5273/api/tacpham`
   - Nếu thấy JSON → Backend OK
   - Nếu không load được → Backend chưa chạy

2. **Kiểm tra IP address:**
   ```cmd
   ipconfig
   ```
   Copy IPv4 Address (ví dụ: `192.168.1.100`)

3. **Cập nhật constants/api.ts:**
   ```typescript
   export const API_BASE_URL = 'http://192.168.1.100:5273/api';
   ```

4. **Restart Expo:**
   ```bash
   # Ctrl+C để stop
   npx expo start -c  # -c để clear cache
   ```

5. **Kiểm tra WiFi:**
   - Máy tính và điện thoại cùng WiFi
   - Không dùng VPN
   - Tắt firewall tạm thời (nếu cần)

### 2. Lỗi: Peer Dependencies Conflict

**Triệu chứng:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Giải pháp:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 3. Lỗi: AsyncStorage not found

**Giải pháp:**
```bash
npx expo install @react-native-async-storage/async-storage
```

### 4. App load chậm hoặc white screen

**Giải pháp:**
```bash
# Clear cache
npx expo start -c

# Hoặc reset Expo
rm -rf .expo
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start
```

### 5. Không quét được QR code

**Giải pháp:**
- Mở Expo Go → Tab "Projects" → Manual connection
- Nhập URL từ terminal (ví dụ: `exp://192.168.1.100:8081`)

### 6. Lỗi: Login failed / Invalid credentials

**Kiểm tra:**
- Email/password đúng chưa?
- Tài khoản đã tồn tại trong database chưa?
- Backend có log error gì không?

**Test với Postman:**
```
POST http://localhost:5273/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

## ⚠️ Lưu ý quan trọng

### 1. Backend phải chạy trước
Backend ASP.NET Core **PHẢI** đang chạy ở `http://localhost:5273` trước khi mở mobile app.

### 2. Cùng mạng WiFi
Điện thoại và máy tính **PHẢI** cùng mạng WiFi. Không được:
- Máy tính dùng LAN, điện thoại dùng WiFi khác
- Máy tính dùng VPN
- Firewall chặn port 8081 (Expo) hoặc 5273 (Backend)

### 3. IP Address
**PHẢI** cập nhật đúng IP máy tính trong `constants/api.ts`. 
- KHÔNG dùng `localhost`
- KHÔNG dùng `127.0.0.1`
- Phải dùng IP thực (ví dụ: `192.168.1.100`)

### 4. Expo Go compatibility
App đã downgrade xuống **SDK 54** để tương thích tốt nhất với Expo Go trên nhiều thiết bị.

### 5. Legacy peer deps
**PHẢI** dùng `npm install --legacy-peer-deps` do conflicts giữa dependencies.

### 6. Chỉ dành cho Customer
App mobile **CHỈ** cho khách hàng. Admin vẫn dùng web React app để quản lý.

## 📱 Test Scenarios (Kịch bản test)

### Test 1: Đăng ký & Đăng nhập
1. Mở app
2. Nhấn "Đăng ký ngay"
3. Điền form với email mới
4. Đăng ký thành công → Tự động vào Home
5. Đăng xuất
6. Đăng nhập lại với email vừa tạo

### Test 2: Xem sản phẩm
1. Home → Xem categories
2. Nhấn vào category → Lọc sản phẩm
3. Tab Products → Tìm kiếm sản phẩm
4. Nhấn vào sản phẩm → Xem chi tiết

### Test 3: Mua hàng
1. Product Detail → Chọn số lượng
2. Thêm vào giỏ
3. Thêm thêm 2-3 sản phẩm khác
4. Tab Cart → Xem giỏ
5. Thay đổi số lượng
6. Xóa 1 sản phẩm
7. Thanh toán → Điền thông tin
8. Đặt hàng → Xem màn hình success

### Test 4: Quản lý đơn
1. Tab Orders → Xem danh sách
2. Nhấn vào đơn → Xem chi tiết
3. Hủy đơn (nếu có thể)
4. Refresh → Xem status đã đổi

### Test 5: Profile
1. Tab Profile
2. Sửa thông tin
3. Lưu → Reload → Xem đã update chưa
4. Đăng xuất

## 🔗 Liên kết

- **Backend**: `../DoAn3_BackEnd/DoAn2_BackEnd`
- **Web Frontend**: `../art-gallery-react`
- **Database**: SQL Server `HeThongBanTranh`

## 🎯 Tính năng mở rộng (Future)

Những tính năng có thể thêm sau:

- [ ] Push Notifications (thông báo khi đơn đổi status)
- [ ] Chat với admin
- [ ] Đánh giá & comment sản phẩm
- [ ] Wishlist / Yêu thích
- [ ] Lọc & sắp xếp nâng cao (giá, mới nhất, bán chạy)
- [ ] Thanh toán online (VNPay, MoMo)
- [ ] Chia sẻ sản phẩm lên Facebook
- [ ] Dark mode
- [ ] Multi-language (Tiếng Việt / English)
- [ ] Lịch sử tìm kiếm
- [ ] Tracking đơn hàng real-time

## 📄 License

MIT License

## 👥 Tác giả

Art Gallery Mobile Team

---

**Trạng thái:** ✅ **HOÀN THÀNH - Sẵn sàng sử dụng**

**Last Updated:** 2024

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Cài đặt
cd art-gallery-mobile
npm install --legacy-peer-deps

# 2. Lấy IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 3. Cập nhật constants/api.ts với IP của bạn
# export const API_BASE_URL = 'http://YOUR_IP:5273/api';

# 4. Chạy Backend (Terminal 1)
cd ../DoAn3_BackEnd/DoAn2_BackEnd
dotnet run

# 5. Chạy Mobile (Terminal 2)
cd art-gallery-mobile
npx expo start

# 6. Quét QR bằng Expo Go
```

Xong! 🎉
