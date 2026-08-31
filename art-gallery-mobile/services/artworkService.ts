// Artwork Service - Đồng bộ với Web
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { Artwork, Product } from '../types';

export const mapToArtwork = (dto: Product): Artwork => {
  return {
    id: dto.maTacPham.toString(),
    tenTranh: dto.tenTacPham,
    giaBan: dto.gia,
    danhMuc: dto.tenDanhMuc || 'Khác',
    tacGia: dto.tenHoaSi,
    kichThuoc: dto.kichThuoc || '',
    chatLieu: dto.chatLieu || '',
    chatLieuKhung: dto.chatLieuKhung || '',
    soLuongTon: dto.soLuong,
    anhTranh: dto.hinhAnh || '',
    moTa: dto.moTa || '',
    isFeatured: false,
    isBestSelling: false,
  };
};

export const artworkService = {
  // Lấy tất cả tranh
  async getAllArtworks(keyword?: string): Promise<Artwork[]> {
    try {
      const params = keyword ? { keyword } : {};
      const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS, { params });
      return response.data.map(mapToArtwork);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      throw error;
    }
  },

  // Lấy tranh theo ID
  async getArtworkById(id: string | number): Promise<Artwork> {
    try {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      const response = await apiClient.get<Product>(API_ENDPOINTS.PRODUCT_DETAIL(numId));
      return mapToArtwork(response.data);
    } catch (error) {
      console.error('Error fetching artwork detail:', error);
      throw error;
    }
  },

  // Lấy tác phẩm gợi ý
  async getRecommendedArtworks(id: string | number): Promise<Artwork[]> {
    try {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCT_SUGGESTIONS(numId));
      return response.data.map(mapToArtwork);
    } catch (error) {
      console.error('Error fetching recommended artworks:', error);
      return [];
    }
  },

  // Tìm kiếm tranh
  async searchArtworks(keyword: string): Promise<Artwork[]> {
    return this.getAllArtworks(keyword);
  },
};
