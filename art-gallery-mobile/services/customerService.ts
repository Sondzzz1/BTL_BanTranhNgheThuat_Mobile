// Customer Profile Service
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface ProfileInfo {
  maNguoiDung: number;
  maTaiKhoan: number;
  ten: string;
  email?: string;
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
      const response = await apiClient.get<ProfileInfo>(API_ENDPOINTS.PROFILE);
      return response.data;
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
