// Favorite Service - API calls cho Yêu Thích
import apiClient from './api';

export interface FavoriteItem {
  maYeuThich: number;
  ngayThem: string;
  ghiChu?: string;
  tacPham: {
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi: string;
    tenDanhMuc?: string;
    gia: number;
    soLuong: number;
    hinhAnh?: string;
    trangThai: number;
  };
}

export const favoriteService = {
  // Lấy danh sách yêu thích
  getFavorites: async (): Promise<FavoriteItem[]> => {
    const response = await apiClient.get('/yeuthich');
    return response.data;
  },

  // Thêm vào yêu thích
  addFavorite: async (artworkId: number, note?: string) => {
    const response = await apiClient.post(`/yeuthich/${artworkId}`, { ghiChu: note });
    return response.data;
  },

  // Xóa khỏi yêu thích
  removeFavorite: async (artworkId: number) => {
    const response = await apiClient.delete(`/yeuthich/${artworkId}`);
    return response.data;
  },

  // Kiểm tra đã yêu thích chưa
  checkFavorite: async (artworkId: number): Promise<boolean> => {
    const response = await apiClient.get(`/yeuthich/kiem-tra/${artworkId}`);
    return response.data.isLiked;
  },
};
