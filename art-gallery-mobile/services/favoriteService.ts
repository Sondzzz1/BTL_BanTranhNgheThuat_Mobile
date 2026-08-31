// Favorite Service - API Yêu thích (Đồng bộ với Web)
import apiClient from './api';
import { FavoriteItem } from '../types';

export const favoriteService = {
  // Lấy danh sách yêu thích
  getFavorites: async (): Promise<FavoriteItem[]> => {
    try {
      const response = await apiClient.get<FavoriteItem[]>('/yeuthich');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  },

  // Thêm vào yêu thích
  addFavorite: async (artworkId: number, note?: string) => {
    try {
      const response = await apiClient.post(`/yeuthich/${artworkId}`, { ghiChu: note });
      return response.data;
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm yêu thích');
    }
  },

  // Xóa khỏi yêu thích
  removeFavorite: async (artworkId: number) => {
    try {
      const response = await apiClient.delete(`/yeuthich/${artworkId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa yêu thích');
    }
  },

  // Kiểm tra đã yêu thích chưa
  checkFavorite: async (artworkId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get<{ isLiked: boolean }>(`/yeuthich/kiem-tra/${artworkId}`);
      return response.data.isLiked;
    } catch (error) {
      return false;
    }
  },
};
