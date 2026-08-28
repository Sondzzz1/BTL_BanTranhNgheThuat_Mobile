// Auth Service - Xác thực người dùng qua Backend API
import apiClient from './api';
import { User } from '../types';

// Interfaces matching backend DTOs
interface DangNhapRequest {
  tenDangNhap: string;
  matKhau: string;
}

interface DangKyRequest {
  tenDangNhap: string;
  matKhau: string;
  ten: string;
  email?: string;
  dienThoai?: string;
  diaChi?: string;
  vaiTro?: number; // 1: NguoiDung (default)
}

interface DangNhapResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: UserInfo;
}

interface UserInfo {
  maTaiKhoan: number;
  tenDangNhap: string;
  vaiTro: number;
  vaiTroText: string;
  maNguoiDung?: number;
  maHoaSi?: number;
  ten?: string;
  email?: string;
}

// Map vaiTro number → role string for frontend
const mapVaiTro = (vaiTro: number): 'admin' | 'author' | 'user' => {
  switch (vaiTro) {
    case 0: return 'admin';
    case 2: return 'author';
    default: return 'user';
  }
};

export const authService = {
  // Đăng nhập - gọi API backend
  async login(email: string, password: string): Promise<User | null> {
    try {
      const request: DangNhapRequest = {
        tenDangNhap: email,
        matKhau: password,
      };

      const response = await apiClient.post<DangNhapResponse>('/auth/dang-nhap', request);
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

      // Lưu JWT token thật từ backend
      localStorage.setItem('authToken', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('userRole', role);

      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      // Nếu là lỗi từ API response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Đăng ký - gọi API backend
  async register(
    email: string,
    password: string,
    name: string,
    phone: string,
    address?: string,
    vaiTro: number = 1 // 1: Người dùng (mặc định), 2: Họa sĩ/Tác giả
  ): Promise<User> {
    try {
      const request: DangKyRequest = {
        tenDangNhap: email,
        matKhau: password,
        ten: name,
        email: email,
        dienThoai: phone,
        diaChi: address,
        vaiTro: vaiTro,
      };

      const response = await apiClient.post<DangNhapResponse>('/auth/dang-ky', request);
      const data = response.data;

      if (!data.success || !data.user || !data.token) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      const role = mapVaiTro(data.user.vaiTro);

      const user: User = {
        id: (data.user.maNguoiDung || data.user.maHoaSi || data.user.maTaiKhoan).toString(),
        email: data.user.email || data.user.tenDangNhap,
        name: data.user.ten || name,
        phone: phone,
        address: address,
        role: role,
      };

      // Lưu JWT token
      localStorage.setItem('authToken', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('userRole', role);

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
      const token = localStorage.getItem('authToken');
      if (token) {
        await apiClient.post('/auth/dang-xuat');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      sessionStorage.removeItem('userRole');
    }
  },

  // Lấy user hiện tại từ localStorage
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  // Lấy thông tin user từ server (verify token)
  async getMe(): Promise<any> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Đổi mật khẩu - gọi API backend
  async changePassword(matKhauCu: string, matKhauMoi: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/auth/doi-mat-khau',
        { matKhauCu, matKhauMoi }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại';
      return { success: false, message };
    }
  },
};
