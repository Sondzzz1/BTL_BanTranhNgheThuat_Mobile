// API Configuration
// Base URL của Backend API - ASP.NET Core

// QUAN TRỌNG: Thay đổi IP này thành IP máy tính chạy Backend
// Không dùng localhost vì Mobile emulator/device không truy cập được localhost của máy host

// Cách lấy IP máy tính:
// Windows: mở CMD và gõ: ipconfig
// Tìm "IPv4 Address" của card mạng đang dùng (WiFi hoặc Ethernet)
// Ví dụ: 192.168.1.100

export const API_BASE_URL = 'http://192.168.1.11:5273/api';

// Nếu test trên Web browser thì có thể dùng localhost
// export const API_BASE_URL = 'http://localhost:5273/api';

export const API_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/dang-nhap',
  REGISTER: '/auth/dang-ky',
  LOGOUT: '/auth/dang-xuat',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/doi-mat-khau',

  // Products
  PRODUCTS: '/tranh',
  PRODUCT_DETAIL: (id: number) => `/tranh/${id}`,
  PRODUCT_SUGGESTIONS: (id: number) => `/tranh/${id}/goi-y`,

  // Categories
  CATEGORIES: '/danh-muc',

  // Cart
  CART: '/gio-hang',
  CART_ADD: '/gio-hang/them',
  CART_UPDATE: (itemId: number) => `/gio-hang/cap-nhat/${itemId}`,
  CART_DELETE: (itemId: number) => `/gio-hang/xoa/${itemId}`,
  CART_CLEAR: '/gio-hang/xoa-toan-bo',

  // Orders
  ORDER_CREATE: '/don-hang/tao',
  ORDER_MY: '/don-hang/cua-toi',
  ORDER_DETAIL: (id: number) => `/don-hang/${id}`,
  ORDER_CANCEL: (id: number) => `/don-hang/${id}/huy`,

  // Profile
  PROFILE: '/khach-hang/thong-tin',
  PROFILE_UPDATE: '/khach-hang/cap-nhat',

  // Artists
  ARTISTS: '/hoa-si',
  ARTIST_DETAIL: (id: number) => `/hoa-si/${id}`,

  // Blog/News
  NEWS: '/bai-viet',
  NEWS_DETAIL: (id: number) => `/bai-viet/${id}`,
};
