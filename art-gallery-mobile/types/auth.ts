// Authentication Types

export interface LoginRequest {
  tenDangNhap: string;
  matKhau: string;
}

export interface RegisterRequest {
  tenDangNhap: string;
  matKhau: string;
  ten: string;
  email?: string;
  dienThoai?: string;
  diaChi?: string;
  vaiTro?: number; // 1: NguoiDung (Customer)
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: UserInfo;
}

export interface UserInfo {
  maTaiKhoan: number;
  tenDangNhap: string;
  vaiTro: number;
  vaiTroText: string;
  maNguoiDung?: number;
  maHoaSi?: number;
  ten?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user' | 'author';
}

export interface ChangePasswordRequest {
  matKhauCu: string;
  matKhauMoi: string;
}
