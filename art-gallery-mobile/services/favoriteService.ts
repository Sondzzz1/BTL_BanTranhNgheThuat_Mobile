// Favorite Service - Kết nối với YeuThich API

import api from './api';
import { FavoriteWithProduct, AddFavoriteRequest, FavoriteCheckResponse } from '../types/favorite';

export const favoriteService = {
  // Lấy danh sách yêu thích
  getMyFavorites: async (): Promise<FavoriteWithProduct[]> => {
    const response = await api.get('/yeuthich');
    return response.data;
  },

  // Thêm vào yêu thích
  addFavorite: async (maTacPham: number, request?: AddFavoriteRequest): Promise<{ message: string; maYeuThich: number }> => {
    const response = await api.post(`/yeuthich/${maTacPham}`, request || {});
    return response.data;
  },

  // Xóa khỏi yêu thích
  removeFavorite: async (maTacPham: number): Promise<{ message: string }> => {
    const response = await api.delete(`/yeuthich/${maTacPham}`);
    return response.data;
  },

  // Kiểm tra đã yêu thích chưa
  checkFavorite: async (maTacPham: number): Promise<boolean> => {
    const response = await api.get<FavoriteCheckResponse>(`/yeuthich/kiem-tra/${maTacPham}`);
    return response.data.isLiked;
  },

  // Toggle favorite (thêm nếu chưa có, xóa nếu đã có)
  toggleFavorite: async (maTacPham: number, isCurrentlyLiked: boolean): Promise<boolean> => {
    if (isCurrentlyLiked) {
      await favoriteService.removeFavorite(maTacPham);
      return false;
    } else {
      await favoriteService.addFavorite(maTacPham);
      return true;
    }
  },
};

export default favoriteService;
