# 🚀 BẮT ĐẦU CHẠY APP - 3 BƯỚC ĐƠN GIẢN

## ⚡ BƯỚC 1: CẬP NHẬT IP API

### 1.1. Lấy IP máy tính

Mở **CMD** và gõ:
```cmd
ipconfig
```

Tìm **IPv4 Address**, ví dụ: `192.168.1.100`

### 1.2. Cập nhật file config

Mở file: `art-gallery-mobile\constants\api.ts`

Thay đổi dòng 15:
```typescript
export const API_BASE_URL = 'http://192.168.1.100:5273/api';
//                                 ^^^^^^^^^^^^^^
//                                 ← Thay IP của bạn vào đây
```

**Lưu file!**

---

## ⚡ BƯỚC 2: CHẠY BACKEND

Mở **Terminal 1** (PowerShell hoặc CMD):

```cmd
cd DoAn3_BackEnd
dotnet run --project DoAn2_BackEnd
```

Đợi đến khi thấy:
```
Now listening on: http://localhost:5273
```

✅ Backend đã chạy! **Giữ terminal này mở.**

---

## ⚡ BƯỚC 3: CHẠY MOBILE APP

Mở **Terminal 2** (mới):

```cmd
cd art-gallery-mobile
npm start
```

Đợi đến khi thấy QR code.

---

## 📱 BƯỚC 4: MỞ TRÊN ĐIỆN THOẠI

### 4.1. Cài Expo Go (nếu chưa có)

- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 4.2. Scan QR Code

1. Mở **Expo Go** app
2. Nhấn "Scan QR code"
3. Scan QR từ terminal
4. Đợi app load (lần đầu hơi lâu, khoảng 1-2 phút)

✅ App mở thành công!

---

## 🎉 TEST APP

### Màn hình đầu tiên: **Login**

#### Test 1: Đăng ký tài khoản mới

1. Nhấn "Đăng ký ngay"
2. Điền form:
   ```
   Tên đăng nhập: testuser1
   Mật khẩu: 123456
   Xác nhận: 123456
   Họ tên: Nguyễn Văn A
   SĐT: 0123456789
   ```
3. Nhấn "Đăng ký"
4. ✅ Tự động đăng nhập → Vào Home

#### Test 2: Đăng nhập

1. Nhập:
   ```
   Tên đăng nhập: testuser1
   Mật khẩu: 123456
   ```
2. Nhấn "Đăng nhập"
3. ✅ Vào Home

---

### Tabs có thể dùng:

#### 🏠 **Trang chủ**
- Xem danh mục
- Xem sản phẩm nổi bật
- Thống kê

#### 🛍️ **Sản phẩm**
- Tìm kiếm tranh
- Lọc theo danh mục
- Xem danh sách

#### 🛒 **Giỏ hàng**
- Xem giỏ (trống nếu chưa thêm)
- Thêm/xóa sản phẩm
- Cập nhật số lượng

#### 📦 **Đơn hàng**
- Xem lịch sử đơn hàng
- Trạng thái đơn

#### 👤 **Tài khoản**
- Xem thông tin
- Chỉnh sửa profile
- Đăng xuất

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: "Network Error"

**Nguyên nhân:** Không kết nối được API

**Giải pháp:**

1. Kiểm tra Backend đang chạy: `http://localhost:5273/api/tranh`
2. Kiểm tra IP trong `constants/api.ts` đúng chưa
3. Điện thoại và máy tính **cùng WiFi** chưa?
4. Firewall có block port 5273 không?
5. Restart app: Trong Expo Go, shake điện thoại → Reload

### ❌ Lỗi: "Đăng nhập thất bại"

**Giải pháp:**

1. Kiểm tra Backend log có lỗi gì
2. Thử đăng ký tài khoản mới
3. Kiểm tra Database có chạy không

### ❌ App bị trắng

**Giải pháp:**

```bash
cd art-gallery-mobile
npm start -- --clear
```

### ❌ "Metro bundler error"

**Giải pháp:**

```bash
# Stop (Ctrl+C)
npm start
```

---

## ✅ CHECKLIST

Trước khi chạy, đảm bảo:

- [ ] Node.js đã cài (v18+)
- [ ] .NET SDK đã cài
- [ ] SQL Server đang chạy
- [ ] Database `HeThongBanTranh` đã tạo
- [ ] IP đã update trong `constants/api.ts`
- [ ] Backend đang chạy (Terminal 1)
- [ ] Expo Go đã cài trên điện thoại
- [ ] Điện thoại và máy tính **cùng WiFi**

---

## 📞 HỖ TRỢ

### Kiểm tra Backend:

**Cách 1:** Browser
```
http://localhost:5273/api/tranh
```

**Cách 2:** CMD
```cmd
curl http://localhost:5273/api/tranh
```

**Cách 3:** Swagger
```
http://localhost:5273/swagger
```

Nếu thấy JSON → ✅ Backend OK

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi setup:

1. ✅ App mở được
2. ✅ Đăng ký/Đăng nhập được
3. ✅ Thấy danh sách sản phẩm
4. ✅ Tìm kiếm được
5. ✅ Xem giỏ hàng
6. ✅ Xem đơn hàng
7. ✅ Sửa profile
8. ✅ Đăng xuất

---

## 🚨 QUAN TRỌNG

- Backend **PHẢI** chạy trước khi mở app
- Điện thoại **PHẢI** cùng WiFi với máy tính
- IP trong config **PHẢI** đúng

---

**Cần giúp gì nữa không?** 😊

---

## 📚 TÀI LIỆU THAM KHẢO

- `README.md` - Hướng dẫn đầy đủ
- `SETUP_MOBILE.md` - Setup chi tiết
- `PROGRESS.md` - Theo dõi tiến độ
- `COMPLETED.md` - Tính năng đã hoàn thành
- `SETUP_MOBILE.md` - Xử lý lỗi

---

**Ready to go!** 🚀
