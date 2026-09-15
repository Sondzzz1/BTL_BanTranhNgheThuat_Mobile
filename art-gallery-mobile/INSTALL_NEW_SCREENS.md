# 📱 HƯỚNG DẪN CÀI ĐẶT CÁC MÀN HÌNH MỚI

## 📋 CÁC MÀN HÌNH ĐÃ THÊM

Đã thêm 4 màn hình mới từ website vào mobile app:

1. **NewsScreen.tsx** - Tin tức & Sự kiện
2. **AboutScreen.tsx** - Giới thiệu (Về họa sĩ Lân Vũ)
3. **ArtistsScreen.tsx** - Danh sách họa sĩ
4. **ContactScreen.tsx** - Liên hệ

---

## 🔧 BƯỚC 1: CÀI ĐẶT THƯ VIỆN

ContactScreen cần thư viện Picker. Chạy lệnh:

```bash
cd art-gallery-mobile
npm install @react-native-picker/picker
```

---

## 🔧 BƯỚC 2: CẬP NHẬT APP.TSX

Mở file `App.tsx` và thêm các màn hình vào navigation:

### Import các màn hình mới:

```typescript
// Thêm vào phần import
import NewsScreen from './app/NewsScreen';
import AboutScreen from './app/AboutScreen';
import ArtistsScreen from './app/ArtistsScreen';
import ContactScreen from './app/ContactScreen';
```

### Thêm vào Stack Navigator:

```typescript
{/* Các màn hình mới */}
<Stack.Screen 
  name="News" 
  component={NewsScreen}
  options={{ title: 'Tin Tức' }}
/>
<Stack.Screen 
  name="About" 
  component={AboutScreen}
  options={{ title: 'Giới Thiệu' }}
/>
<Stack.Screen 
  name="Artists" 
  component={ArtistsScreen}
  options={{ title: 'Họa Sĩ' }}
/>
<Stack.Screen 
  name="Contact" 
  component={ContactScreen}
  options={{ title: 'Liên Hệ' }}
/>
```

---

## 🔧 BƯỚC 3: THÊM VÀO MENU (Tùy chọn)

### Cách 1: Thêm vào Profile Screen

Mở `app/tabs/ProfileScreen.tsx` và thêm các menu item:

```typescript
const menuItems = [
  // ... existing items
  { icon: 'newspaper-outline', title: 'Tin tức', screen: 'News' },
  { icon: 'people-outline', title: 'Họa sĩ', screen: 'Artists' },
  { icon: 'information-circle-outline', title: 'Giới thiệu', screen: 'About' },
  { icon: 'mail-outline', title: 'Liên hệ', screen: 'Contact' },
];
```

### Cách 2: Thêm vào Home Screen

Mở `app/tabs/HomeScreen.tsx` và thêm quick actions:

```typescript
<View style={styles.quickActions}>
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={() => navigation.navigate('News')}
  >
    <Ionicons name="newspaper-outline" size={24} color="#2563eb" />
    <Text style={styles.actionText}>Tin tức</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={() => navigation.navigate('Artists')}
  >
    <Ionicons name="palette-outline" size={24} color="#2563eb" />
    <Text style={styles.actionText}>Họa sĩ</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={() => navigation.navigate('About')}
  >
    <Ionicons name="information-circle-outline" size={24} color="#2563eb" />
    <Text style={styles.actionText}>Giới thiệu</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={() => navigation.navigate('Contact')}
  >
    <Ionicons name="mail-outline" size={24} color="#2563eb" />
    <Text style={styles.actionText}>Liên hệ</Text>
  </TouchableOpacity>
</View>
```

---

## 🔧 BƯỚC 4: THÊM SERVICES (Tùy chọn)

Để các màn hình hoạt động đầy đủ, cần thêm API services:

### 1. News Service

Tạo file `services/newsService.ts`:

```typescript
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Article {
  maBaiViet: number;
  tieuDe: string;
  noiDung: string;
  anhTieuDe: string;
  ngayDang: string;
  tenHoaSi: string;
}

export const newsService = {
  async getAllArticles(): Promise<Article[]> {
    const response = await apiClient.get(API_ENDPOINTS.NEWS);
    return response.data;
  },
  
  async getArticleById(id: number): Promise<Article> {
    const response = await apiClient.get(API_ENDPOINTS.NEWS_DETAIL(id));
    return response.data;
  },
};
```

### 2. Artist Service

Tạo file `services/artistService.ts`:

```typescript
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Artist {
  maHoaSi: number;
  tenHoaSi: string;
  anhDaiDien: string;
  tieuSu: string;
  email: string;
  soDienThoai: string;
}

export const artistService = {
  async getAllArtists(): Promise<Artist[]> {
    const response = await apiClient.get(API_ENDPOINTS.ARTISTS);
    return response.data;
  },
  
  async getArtistById(id: number): Promise<Artist> {
    const response = await apiClient.get(API_ENDPOINTS.ARTIST_DETAIL(id));
    return response.data;
  },
};
```

---

## 🔧 BƯỚC 5: CẬP NHẬT API ENDPOINTS

Mở `constants/api.ts` và đảm bảo có các endpoints:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  
  // Blog/News
  NEWS: '/bai-viet',
  NEWS_DETAIL: (id: number) => `/bai-viet/${id}`,

  // Artists
  ARTISTS: '/hoa-si',
  ARTIST_DETAIL: (id: number) => `/hoa-si/${id}`,
};
```

---

## ✅ HOÀN THÀNH

Sau khi làm xong các bước trên:

1. **Chạy lại Metro Bundler:**
   ```bash
   npx expo start --clear
   ```

2. **Reload app trên điện thoại:**
   - Shake điện thoại → Reload
   - Hoặc nhấn `r` trong terminal

3. **Test các màn hình mới:**
   - Vào Profile → Chọn "Tin tức", "Họa sĩ", "Giới thiệu", "Liên hệ"
   - Hoặc navigate từ Home Screen

---

## 🎨 TÍNH NĂNG CỦA TỪNG MÀN HÌNH

### 📰 News Screen
- Hero section với gradient
- Featured news card
- List of articles
- Pull to refresh
- Navigate to article detail

### 👤 About Screen
- Hero với thông tin họa sĩ Lân Vũ
- Biography sections
- Career timeline
- Philosophy quotes
- Vision & mission

### 🎨 Artists Screen
- Hero section
- Introduction text
- Artist cards with images
- Featured artist section (Lân Vũ)
- Notable works carousel
- "Join us" CTA

### 📧 Contact Screen
- Contact info cards (clickable):
  * Address → Opens Google Maps
  * Phone → Opens dialer
  * Email → Opens email client
  * Working hours
- Contact form with validation
- Social media links

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Unable to resolve @react-native-picker/picker"

```bash
npm install @react-native-picker/picker
npx expo start --clear
```

### Lỗi: Navigation không hoạt động

Đảm bảo đã thêm screens vào Stack Navigator trong `App.tsx`

### Lỗi: Icons không hiển thị

Đảm bảo đã import đúng:
```typescript
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [React Navigation](https://reactnavigation.org/)
- [React Native Picker](https://github.com/react-native-picker/picker)
- [Expo Vector Icons](https://icons.expo.fyi/)

---

**Ngày tạo:** ${new Date().toLocaleDateString('vi-VN')}
