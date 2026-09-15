// News/Articles Service - API calls cho tin tức và bài viết
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Article {
  maBaiViet: number;
  tieuDe: string;
  noiDung: string;
  anhTieuDe: string;
  ngayDang: string;
  tenHoaSi: string;
  maHoaSi: number;
  trangThai: string;
}

export const newsService = {
  /**
   * Lấy tất cả bài viết đã được duyệt
   */
  async getAllArticles(): Promise<Article[]> {
    try {
      const response = await apiClient.get<Article[]>(API_ENDPOINTS.NEWS);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải danh sách tin tức');
    }
  },

  /**
   * Lấy chi tiết một bài viết theo ID
   */
  async getArticleById(id: number): Promise<Article> {
    try {
      const response = await apiClient.get<Article>(API_ENDPOINTS.NEWS_DETAIL(id));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching article detail:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải chi tiết bài viết');
    }
  },
};
