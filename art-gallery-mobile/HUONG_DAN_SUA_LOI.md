# Hướng dẫn sửa lỗi "TurboModuleRegistry.getEnforcing" 

## Lỗi gặp phải:
```
[runtime not ready]: Invariant Violation:
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.
Verify that a module by this name is registered in the native binary.
```

## Nguyên nhân:
- Lỗi này xảy ra do xung đột trong Expo cache hoặc node_modules
- Có thể do version conflicts giữa các dependencies

## Giải pháp:

### Bước 1: Tắt Expo Dev Server
- Nhấn `Ctrl+C` trong terminal đang chạy `npx expo start`

### Bước 2: Mở Command Prompt (CMD) - KHÔNG dùng PowerShell
Nhấn `Windows + R` → gõ `cmd` → Enter

### Bước 3: Di chuyển vào thư mục project
```cmd
cd C:\Users\huanp\Downloads\BTL_Mobile\art-gallery-mobile
```

### Bước 4: Xóa cache (chọn 1 trong 2 cách)

**Cách 1: Xóa thủ công**
```cmd
rmdir /s /q node_modules
rmdir /s /q .expo
del package-lock.json
```

**Cách 2: Dùng npm**
```cmd
npm cache clean --force
```

### Bước 5: Cài lại dependencies
```cmd
npm install --legacy-peer-deps
```

### Bước 6: Start lại Expo với clear cache
```cmd
npx expo start -c
```
**Lưu ý:** Flag `-c` để clear cache của Expo bundler

### Bước 7: Reload app trên điện thoại
- Trong Expo Go, shake điện thoại (hoặc nhấn menu)
- Chọn "Reload"

## Nếu vẫn lỗi, thử các cách sau:

### Giải pháp 2: Xóa Expo Go cache trên điện thoại
1. Mở Expo Go app
2. Vào Settings/Profile
3. Chọn "Clear cache"
4. Thoát và mở lại app

### Giải pháp 3: Cài lại Expo Go
1. Gỡ Expo Go app khỏi điện thoại
2. Cài lại từ Play Store/App Store
3. Scan QR code lại

### Giải pháp 4: Update Expo CLI
```cmd
npm install -g expo-cli@latest
npm install -g @expo/ngrok@latest
```

Sau đó chạy lại:
```cmd
cd C:\Users\huanp\Downloads\BTL_Mobile\art-gallery-mobile
npx expo start -c
```

### Giải pháp 5: Kiểm tra app.json
Đảm bảo file `app.json` có đúng SDK version:

```json
{
  "expo": {
    "sdkVersion": "54.0.0",
    ...
  }
}
```

### Giải pháp 6: Reinstall toàn bộ (Last resort)

```cmd
cd C:\Users\huanp\Downloads\BTL_Mobile\art-gallery-mobile

rem Xóa tất cả
rmdir /s /q node_modules
rmdir /s /q .expo
del package-lock.json

rem Cài lại
npm install --legacy-peer-deps

rem Clear Expo cache
npx expo start -c --clear
```

## Checklist debug:

- [ ] Đã tắt Expo Dev Server (Ctrl+C)
- [ ] Đã xóa node_modules
- [ ] Đã xóa .expo folder
- [ ] Đã xóa package-lock.json
- [ ] Đã chạy `npm install --legacy-peer-deps`
- [ ] Đã chạy `npx expo start -c`
- [ ] Đã reload app trên điện thoại
- [ ] Điện thoại và máy tính cùng WiFi
- [ ] Backend đang chạy (nếu cần test API)

## Nếu tất cả đều không được:

Thử downgrade một số packages có thể gây xung đột:

```cmd
npm install react-native@0.76.3 --legacy-peer-deps
npm install expo@~54.0.0 --legacy-peer-deps
npx expo install --fix
```

Sau đó:
```cmd
npx expo start -c
```

## Lưu ý:
- Luôn dùng **Command Prompt (CMD)**, không dùng PowerShell (vì PowerShell có lỗi với path dài)
- Luôn thêm flag `-c` khi start Expo để clear cache
- Đảm bảo điện thoại và máy tính cùng WiFi
