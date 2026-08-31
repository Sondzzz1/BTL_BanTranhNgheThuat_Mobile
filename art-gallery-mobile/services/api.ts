// API Service - Axios Instance với JWT Authentication
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../constants/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Tự động thêm JWT token vào header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Unauthorized callback listener
type UnauthorizedCallback = () => void;
let unauthorizedCallback: UnauthorizedCallback | null = null;

export const setUnauthorizedCallback = (callback: UnauthorizedCallback | null) => {
  unauthorizedCallback = callback;
};

// Response Interceptor - Xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // 401 Unauthorized - Token hết hạn hoặc không hợp lệ / Chưa đăng nhập
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - Clearing auth token and resetting state');
      try {
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'currentUser']);
      } catch (e) {
        console.error('Error removing auth storage:', e);
      }
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }

    // 403 Forbidden - Không có quyền
    if (error.response?.status === 403) {
      console.warn('403 Forbidden - Access denied');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
