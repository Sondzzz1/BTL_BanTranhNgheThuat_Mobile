// Họa Sĩ Authenticated Service - API calls cho họa sĩ đã đăng nhập
import apiClient from './api';

// Interface cho tác phẩm đã xóa
interface DeletedArtwork {
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  tenDanhMuc?: string;
  gia: number;
  soLuong: number;
  moTa?: string;
  hinhAnh?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
}

export const hoaSiAuthService = {
  // Lấy danh sách tác phẩm đã xóa
  async getDeletedArtworks(): Promise<DeletedArtwork[]> {
    try {
      const response = await apiClient.get<DeletedArtwork[]>('/hoa-si/tac-pham-da-xoa');
      return response.data;
    } catch (error) {
      console.error('Error fetching deleted artworks:', error);
      throw error;
    }
  },

  // Khôi phục tác phẩm đã xóa
  async restoreArtwork(id: number): Promise<void> {
    try {
      await apiClient.put(`/hoa-si/tac-pham/${id}/khoi-phuc`);
    } catch (error) {
      console.error('Error restoring artwork:', error);
      throw error;
    }
  },

  // Gửi duyệt lại tác phẩm bị từ chối
  async resubmitArtwork(id: number): Promise<void> {
    try {
      await apiClient.put(`/hoa-si/tac-pham/${id}/gui-duyet-lai`);
    } catch (error) {
      console.error('Error resubmitting artwork:', error);
      throw error;
    }
  },
};
