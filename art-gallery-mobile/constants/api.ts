

// Option 1: Dùng IP mạng (cho thiết bị thật - ĐÃ TẮT FIREWALL)
export const API_BASE_URL = 'http://10.59.67.115:5273/api';


export const API_TIMEOUT = 60000; // 60 seconds (tăng từ 30s)

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

  // Favorites
  FAVORITES: '/yeuthich',
  FAVORITE_ADD: '/yeuthich/them',
  FAVORITE_REMOVE: (id: number) => `/yeuthich/xoa/${id}`,

  // Reviews
  REVIEWS: '/danh-gia',
  REVIEW_BY_PRODUCT: (productId: number) => `/danh-gia/tac-pham/${productId}`,
  REVIEW_ADD: '/danh-gia/them',
  REVIEW_CHECK_PURCHASED: (productId: number) => `/danh-gia/kiem-tra-mua-hang/${productId}`,
  REVIEW_FIVE_STARS: '/danh-gia/5-sao',

  // Hoàn trả sản phẩm
  RETURN_CREATE: '/hoan-tra',
  RETURN_MY: '/hoan-tra/cua-toi',
  RETURN_DETAIL: (id: number) => `/hoan-tra/${id}`,
  RETURN_CONFIRM_SHIPPED: (id: number) => `/hoan-tra/${id}/xac-nhan-da-gui`,
};
