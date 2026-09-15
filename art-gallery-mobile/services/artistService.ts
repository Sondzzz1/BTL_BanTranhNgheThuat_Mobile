// Artist Service - API calls cho họa sĩ
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Artist {
  maHoaSi: number;
  tenHoaSi: string;
  anhDaiDien: string;
  tieuSu: string;
  email: string;
  soDienThoai: string;
  diaChi?: string;
  website?: string;
  soTacPham?: number;
}

export interface ArtistDetail extends Artist {
  cacTacPham?: ArtistArtwork[];
}

export interface ArtistArtwork {
  maTacPham: number;
  tenTacPham: string;
  hinhAnh: string;
  gia: number;
  trangThai: string;
}

export const artistService = {
  /**
   * Lấy danh sách tất cả họa sĩ
   */
  async getAllArtists(): Promise<Artist[]> {
    try {
      const response = await apiClient.get<Artist[]>(API_ENDPOINTS.ARTISTS);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching artists:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải danh sách họa sĩ');
    }
  },

  /**
   * Lấy thông tin chi tiết một họa sĩ theo ID
   */
  async getArtistById(id: number): Promise<ArtistDetail> {
    try {
      const response = await apiClient.get<ArtistDetail>(API_ENDPOINTS.ARTIST_DETAIL(id));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching artist detail:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải thông tin họa sĩ');
    }
  },
};
