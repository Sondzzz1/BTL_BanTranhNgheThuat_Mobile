# 🚀 HƯỚNG DẪN SETUP & CHẠY MOBILE APP

## ⚡ SETUP NHANH (5 PHÚT)

### Bước 1: Cấu hình API URL

1. Mở CMD và gõ:
```cmd
ipconfig
```

2. Tìm **IPv4 Address** (ví dụ: `192.168.1.100`)

3. Mở file: `art-gallery-mobile\constants\api.ts`

4. Thay đổi dòng này:
```typescript
export const API_BASE_URL = 'http://192.168.1.100:5273/api';
//                                 ^^^^^^^^^^^^^^
//                                 Thay bằng IP máy bạn
```

### Bước 2: Chạy Backend

```cmd
cd DoAn3_BackEnd
dotnet run --project DoAn2_BackEnd
```

Backend sẽ chạy ở: `http://localhost:5273`

### Bước 3: Chạy Mobile App

Mở terminal mới:

```cmd
cd art-gallery-mobile
npm start
```

### Bước 4: Mở trên điện thoại

1. Tải **Expo Go** app từ:
   - Android: Google Play Store
   - iOS: App Store

2. Mở Expo Go

3. Scan QR code từ terminal

4. Đợi app load

**LƯU Ý:** Điện thoại và máy tính phải cùng mạng WiFi!

---

## 📱 CÁCH TEST APP

### Test 1: Đăng ký tài khoản

1. Mở app → Màn hình Login
2. Click "Đăng ký ngay"
3. Điền form:
   - Tên đăng nhập: `testuser`
   - Mật khẩu: `123456`
   - Xác nhận mật khẩu: `123456`
   - Họ tên: `Nguyễn Văn A`
   - Số điện thoại: `0123456789`
4. Click "Đăng ký"
5. Nếu thành công → Tự động đăng nhập → Vào Home

### Test 2: Đăng nhập

1. Mở app → Màn hình Login
2. Nhập:
   - Tên đăng nhập: `testuser`
   - Mật khẩu: `123456`
3. Click "Đăng nhập"
4. Nếu thành công → Vào Home

### Test 3: Xem Tabs

- Nhấn vào các tab ở dưới cùng:
  - Trang chủ
  - Sản phẩm
  - Giỏ hàng
  - Đơn hàng
  - Tài khoản

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Network Error"

**Nguyên nhân:** API không kết nối được

**Giải pháp:**

1. Kiểm tra Backend đang chạy:
   ```
   http://localhost:5273/api/tranh
   ```
   Phải trả về danh sách sản phẩm

2. Kiểm tra IP trong `constants/api.ts`

3. Kiểm tra Firewall không block port 5273

4. Restart app:
   - Trong Expo Go, shake điện thoại → Reload

### Lỗi: "Đăng nhập thất bại"

**Nguyên nhân:** Backend không chạy hoặc tài khoản sai

**Giải pháp:**

1. Kiểm tra Backend log có lỗi gì không

2. Thử tạo tài khoản mới (Đăng ký)

3. Kiểm tra Database có table `TaiKhoan`, `NguoiDung` không

### Lỗi: App bị trắng/crash

**Giải pháp:**

```bash
# Clear cache và restart
cd art-gallery-mobile
rm -rf node_modules
npm install
npm start -- --clear
```

### Lỗi: "Metro bundler error"

**Giải pháp:**

```bash
# Restart Metro
Ctrl + C (stop)
npm start
```

---

## 📝 CHECKLIST TRƯỚC KHI CHẠY

- [ ] Node.js đã cài (v18+)
- [ ] Backend đang chạy (port 5273)
- [ ] IP đã cập nhật trong `constants/api.ts`
- [ ] Expo Go đã cài trên điện thoại
- [ ] Điện thoại và máy tính cùng WiFi
- [ ] Firewall không block port 5273

---

## 🔍 KIỂM TRA BACKEND CÓ CHẠY KHÔNG

### Cách 1: Dùng Browser

Mở browser và truy cập:
```
http://localhost:5273/api/tranh
```

Nếu thấy JSON danh sách tranh → Backend OK ✅

### Cách 2: Dùng CMD

```cmd
curl http://localhost:5273/api/tranh
```

### Cách 3: Kiểm tra Swagger

```
http://localhost:5273/swagger
```

---

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi, kiểm tra:

1. **Backend log** - Xem có lỗi gì
2. **Metro bundler log** - Xem có lỗi compile
3. **Expo Go log** - Shake điện thoại → Show Dev Menu → Debug

### Dev Menu trong Expo Go

Shake điện thoại → Menu hiện ra:
- **Reload** - Reload app
- **Debug Remote JS** - Debug với Chrome DevTools
- **Show Element Inspector** - Kiểm tra UI

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi setup xong:

1. ✅ App mở được trên điện thoại
2. ✅ Màn hình Login hiển thị đẹp
3. ✅ Có thể đăng ký tài khoản mới
4. ✅ Có thể đăng nhập
5. ✅ Vào được Home với 5 tabs

---

**Trạng thái:** App đã sẵn sàng chạy! 🚀

**Tiếp theo:** Phát triển các screens còn lại (Home, Products, Cart, Orders, Profile)
