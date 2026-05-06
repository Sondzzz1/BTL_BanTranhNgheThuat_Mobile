// Customer Service - API cho thông tin khách hàng (cần auth)
import apiClient from './api';

// Interface khớp với ThongTinKhachHangResponse từ backend
export interface ThongTinKhachHangResponse {
  id: number;
  hoTen: string;
  diaChi?: string;
  soDienThoai?: string;
  email?: string;
}

export interface CapNhatThongTinRequest {
  ten: string;
  diaChi?: string;
  dienThoai?: string;
  email?: string;
}

export const customerService = {
  // Lấy thông tin cá nhân (dùng JWT token để xác định user)
  async getThongTin(): Promise<ThongTinKhachHangResponse> {
    try {
      const response = await apiClient.get<ThongTinKhachHangResponse>('/khach-hang/thong-tin');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer info:', error);
      throw error;
    }
  },

  // Cập nhật thông tin cá nhân
  async capNhatThongTin(data: CapNhatThongTinRequest): Promise<string> {
    try {
      const response = await apiClient.put('/khach-hang/cap-nhat', data);
      return response.data.message;
    } catch (error: any) {
      console.error('Error updating customer info:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    }
  },

  // === ADMIN: Lấy tất cả khách hàng (gọi từ AdminCustomers) ===
  async getAllCustomers(): Promise<ThongTinKhachHangResponse[]> {
    try {
      const response = await apiClient.get<ThongTinKhachHangResponse[]>('/admin/khach-hang/get-all');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
};
