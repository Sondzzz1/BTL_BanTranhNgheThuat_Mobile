// API Service - Kết nối với Backend ASP.NET Core
import axios from 'axios';

// Base URL của API backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5273/api';

console.log('API Base URL:', API_BASE_URL);

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  // Cho phép gửi request đến HTTPS với self-signed certificate
  withCredentials: false,
});

// Request interceptor - Thêm token vào header nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      // Unauthorized - Chỉ xóa token và redirect nếu token thực sự invalid
      const currentPath = window.location.pathname;
      
      // Không redirect nếu đang ở trang public hoặc đã ở trang login
      const publicPaths = ['/', '/login', '/register', '/about', '/artworks', '/news', '/contact'];
      const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith('/artworks/'));
      
      if (!isPublicPath && !currentPath.includes('/login')) {
        console.warn('401 Unauthorized - Clearing auth and redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.warn('401 Unauthorized on public page - Not redirecting');
      }
    }

    if (error.response?.status === 403) {
      // Forbidden - Không có quyền truy cập
      console.warn('403 Forbidden - Access denied');
    }

    if (error.response?.status === 404) {
      console.warn('Resource not found:', error.config?.url);
    }

    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
