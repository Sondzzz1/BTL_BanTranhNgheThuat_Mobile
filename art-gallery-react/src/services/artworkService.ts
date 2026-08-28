// Artwork Service - API calls cho Tranh (Public)
import apiClient from './api';
import { Artwork } from '../types';

// Interface khớp với TacPhamResponse từ PublicController backend
interface TacPhamResponse {
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

// Chuyển đổi từ DTO backend sang Artwork frontend
const mapToArtwork = (dto: TacPhamResponse): Artwork => {
  return {
    id: dto.maTacPham.toString(),
    tenTranh: dto.tenTacPham,
    giaBan: dto.gia,
    danhMuc: (dto.tenDanhMuc || 'Khác') as any,
    tacGia: dto.tenHoaSi,
    kichThuoc: dto.kichThuoc || '',
    chatLieu: dto.chatLieu || '',
    chatLieuKhung: dto.chatLieuKhung || '',
    soLuongTon: dto.soLuong,
    anhTranh: dto.hinhAnh || '/placeholder.jpg',
    moTa: dto.moTa,
    isFeatured: false,
    isBestSelling: false,
  };
};

export const artworkService = {
  // Lấy tất cả tranh (Public API)
  async getAllArtworks(): Promise<Artwork[]> {
    try {
      const response = await apiClient.get<TacPhamResponse[]>('/tranh');
      return response.data.map(mapToArtwork);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      throw error;
    }
  },

  // Lấy tranh theo ID (Public API)
  async getArtworkById(id: string): Promise<Artwork> {
    try {
      const response = await apiClient.get<TacPhamResponse>(`/tranh/${id}`);
      return mapToArtwork(response.data);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      throw error;
    }
  },

  // Lấy tác phẩm gợi ý
  async getRecommendedArtworks(id: string): Promise<Artwork[]> {
    try {
      const response = await apiClient.get<TacPhamResponse[]>(`/tranh/${id}/goi-y`);
      return response.data.map(mapToArtwork);
    } catch (error) {
      console.error('Error fetching recommended artworks:', error);
      return []; // Trả về mảng rỗng nếu lỗi
    }
  },

  // Tìm kiếm tranh theo từ khóa
  async searchArtworks(keyword: string): Promise<Artwork[]> {
    try {
      if (!keyword || keyword.trim().length === 0) {
        return [];
      }
      const response = await apiClient.get<TacPhamResponse[]>('/tranh', {
        params: { keyword: keyword.trim() }
      });
      return response.data.map(mapToArtwork);
    } catch (error) {
      console.error('Error searching artworks:', error);
      return [];
    }
  },
};
