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
      
      // Nếu backend không trả về cacTacPham, gọi API /tranh và filter
      if (!response.data.cacTacPham || response.data.cacTacPham.length === 0) {
        try {
          const artworksResponse = await apiClient.get('/tranh');
          const allArtworks = artworksResponse.data;
          
          // Filter tác phẩm theo họa sĩ
          const artistArtworks = allArtworks
            .filter((tp: any) => tp.tenHoaSi === response.data.tenHoaSi)
            .map((tp: any) => ({
              maTacPham: tp.maTacPham,
              tenTacPham: tp.tenTacPham,
              hinhAnh: tp.hinhAnh,
              gia: tp.gia,
              trangThai: tp.soLuong > 0 ? 'available' : 'sold'
            }));
          
          response.data.cacTacPham = artistArtworks;
        } catch (artworkError) {
          console.log('Could not fetch artworks separately:', artworkError);
          response.data.cacTacPham = [];
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching artist detail:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải thông tin họa sĩ');
    }
  },
};
