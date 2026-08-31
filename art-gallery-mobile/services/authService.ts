// Authentication Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  ChangePasswordRequest 
} from '../types/auth';

// Map vaiTro number to role string
const mapVaiTro = (vaiTro: number): 'admin' | 'user' | 'author' => {
  switch (vaiTro) {
    case 0: return 'admin';
    case 2: return 'author';
    default: return 'user';
  }
};

export const authService = {
  // Đăng nhập
  async login(tenDangNhap: string, matKhau: string): Promise<User> {
    try {
      const request: LoginRequest = { tenDangNhap, matKhau };
      
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.LOGIN,
        request
      );
      
      const data = response.data;
      
      if (!data.success || !data.user || !data.token) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      const role = mapVaiTro(data.user.vaiTro);

      const user: User = {
        id: (data.user.maNguoiDung || data.user.maHoaSi || data.user.maTaiKhoan).toString(),
        email: data.user.email || data.user.tenDangNhap,
        name: data.user.ten || data.user.tenDangNhap,
        phone: '',
        address: '',
        role: role,
      };

      // Lưu token và user info vào AsyncStorage
      await AsyncStorage.setItem('authToken', data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Đăng ký
  async register(
    tenDangNhap: string,
    matKhau: string,
    ten: string,
    dienThoai: string,
    email?: string,
    diaChi?: string
  ): Promise<User> {
    try {
      const request: RegisterRequest = {
        tenDangNhap,
        matKhau,
        ten,
        email: email || tenDangNhap,
        dienThoai,
        diaChi,
        vaiTro: 1, // 1 = NguoiDung (Customer)
      };

      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.REGISTER,
        request
      );
      
      const data = response.data;
      
      if (!data.success || !data.user || !data.token) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      const role = mapVaiTro(data.user.vaiTro);

      const user: User = {
        id: (data.user.maNguoiDung || data.user.maHoaSi || data.user.maTaiKhoan).toString(),
        email: data.user.email || tenDangNhap,
        name: data.user.ten || ten,
        phone: dienThoai,
        address: diaChi,
        role: role,
      };

      // Lưu token và user info
      await AsyncStorage.setItem('authToken', data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      return user;
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Đăng xuất
  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await apiClient.post(API_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tất cả dữ liệu auth
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'currentUser']);
    }
  },

  // Lấy thông tin user hiện tại từ AsyncStorage
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'currentUser']);
        return null;
      }
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Kiểm tra đã đăng nhập chưa
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Lấy thông tin user từ server (verify token)
  async getMe(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  },

  // Đổi mật khẩu
  async changePassword(matKhauCu: string, matKhauMoi: string): Promise<{ success: boolean; message: string }> {
    try {
      const request: ChangePasswordRequest = { matKhauCu, matKhauMoi };
      const response = await apiClient.post<{ success: boolean; message: string }>(
        API_ENDPOINTS.CHANGE_PASSWORD,
        request
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại';
      return { success: false, message };
    }
  },
};
