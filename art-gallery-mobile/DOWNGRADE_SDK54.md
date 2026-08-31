# 📦 DOWNGRADE TO EXPO SDK 54

## ✅ ĐÃ CẬP NHẬT

Tôi đã cập nhật `package.json` và `app.json` để sử dụng **Expo SDK 54** thay vì SDK 57.

SDK 54 tương thích tốt hơn với Expo Go app trên điện thoại cũ.

---

## 🔧 CÀI LẠI DEPENDENCIES

Package.json đã được cập nhật với các version tương thích SDK 54.

### Để cài lại clean:

```bash
# Bước 1: Xóa node_modules và package-lock (thủ công nếu lỗi)
# Có thể cần xóa thủ công nếu path quá dài

# Bước 2: Cài lại dependencies
cd art-gallery-mobile
npm install --legacy-peer-deps

# Hoặc nếu lỗi, thử:
npm cache clean --force
npm install --legacy-peer-deps
```

---

## 📝 THAY ĐỔI CHÍNH

### package.json - Versions mới:

```json
{
  "expo": "~54.0.0",
  "react": "18.2.0",
  "react-native": "0.76.3",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.9.17",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "react-native-screens": "~4.4.0",
  "react-native-safe-area-context": "4.11.1",
  "@react-native-async-storage/async-storage": "2.0.0",
  "axios": "^1.6.0",
  "@types/react": "~18.2.45",
  "typescript": "^5.1.3"
}
```

### app.json - Cấu hình đơn giản hơn:

```json
{
  "expo": {
    "name": "Art Gallery Mobile",
    "slug": "art-gallery-mobile",
    "version": "1.0.0",
    "sdkVersion": "54.0.0"
  }
}
```

---

## ⚠️ LƯU Ý

### 1. Code không cần thay đổi

Tất cả code TypeScript/React Native đã viết **KHÔNG CẦN SỬA**.

SDK 54 và SDK 57 có API tương tự.

### 2. Expo Go compatibility

- **SDK 57**: Cần Expo Go mới nhất (có thể không có trên Play Store cũ)
- **SDK 54**: Tương thích với Expo Go cũ hơn, hoạt động tốt trên nhiều thiết bị

### 3. Nếu npm install bị lỗi path quá dài

```bash
# Windows: Xóa thủ công node_modules
# Hoặc dùng tool bên thứ 3:
npx rimraf node_modules
npm install --legacy-peer-deps
```

---

## 🚀 SAU KHI CÀI XONG

```bash
cd art-gallery-mobile
npm start
```

App sẽ chạy với SDK 54, tương thích tốt hơn với Expo Go cũ.

---

## ✅ KIỂM TRA

Sau khi cài xong, kiểm tra:

```bash
cat package.json | grep "expo"
```

Phải thấy: `"expo": "~54.0.0"`

---

## 📱 EXPO GO VERSION

- **iOS**: Expo Go >= 2.28.0
- **Android**: Expo Go >= 2.28.0

SDK 54 hoạt động với các version Expo Go cũ hơn, không cần update.

---

**Cập nhật:** 29/08/2026 11:45 AM
