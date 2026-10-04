// Customer Profile Service
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface ProfileInfo {
  maNguoiDung: number;
  maTaiKhoan?: number;
  ten: string;
  email?: string;
  dienThoai?: string;
  diaChi?: string;
  avatar?: string;
}

/** API hồ sơ của Web dùng các trường id, hoTen và soDienThoai. */
interface ProfileApiResponse {
  id?: number;
  maNguoiDung?: number;
  maTaiKhoan?: number;
  hoTen?: string;
  ten?: string;
  email?: string;
  soDienThoai?: string;
  dienThoai?: string;
  diaChi?: string;
  avatar?: string;
}

export interface UpdateProfileRequest {
  ten: string;
  email?: string;
  dienThoai?: string;
  diaChi?: string;
}

export const customerService = {
  // Lấy thông tin cá nhân
  async getProfile(): Promise<ProfileInfo> {
    try {
      const response = await apiClient.get<ProfileApiResponse>(API_ENDPOINTS.PROFILE);
      const profile = response.data;
      return {
        maNguoiDung: profile.maNguoiDung ?? profile.id ?? 0,
        maTaiKhoan: profile.maTaiKhoan,
        ten: profile.ten ?? profile.hoTen ?? '',
        email: profile.email,
        dienThoai: profile.dienThoai ?? profile.soDienThoai,
        diaChi: profile.diaChi,
        avatar: profile.avatar,
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Cập nhật thông tin cá nhân
  async updateProfile(data: UpdateProfileRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>(
        API_ENDPOINTS.PROFILE_UPDATE,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};
