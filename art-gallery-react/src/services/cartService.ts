// Cart Service - API calls cho Giỏ hàng
import apiClient from './api';
import { CartItem } from '../types';

export interface ChiTietGioHangResponse {
  maChiTietGH: number;
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  gia: number;
  soLuong: number;
  thanhTien: number;
  hinhAnh?: string;
}

export interface GioHangResponse {
  maGioHang: number;
  danhSachSanPham: ChiTietGioHangResponse[];
  tongTien: number;
}

export const cartService = {
  // Lấy giỏ hàng từ server
  async getGioHang(): Promise<CartItem[]> {
    try {
      const response = await apiClient.get<GioHangResponse>('/gio-hang');
      return response.data.danhSachSanPham.map(item => ({
        id: item.maTacPham.toString(),
        dbId: item.maChiTietGH, // Lưu lại ID trong DB để cập nhật/xóa
        name: item.tenTacPham,
        price: Number(item.gia),
        image: item.hinhAnh || '',
        quantity: item.soLuong
      }));
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Thêm sản phẩm vào giỏ hàng trên server
  async addToCart(maTacPham: number, soLuong: number = 1): Promise<void> {
    try {
      await apiClient.post('/gio-hang/them', {
        maTacPham,
        soLuong
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
    }
  },

  // Cập nhật số lượng trên server
  async updateQuantity(maChiTietGH: number, soLuong: number): Promise<void> {
    try {
      await apiClient.put(`/gio-hang/cap-nhat/${maChiTietGH}`, {
        soLuong
      });
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng');
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng trên server
  async removeFromCart(maChiTietGH: number): Promise<void> {
    try {
      await apiClient.delete(`/gio-hang/xoa/${maChiTietGH}`);
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng');
    }
  },

  // Xoá toàn bộ giỏ hàng trên server
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete('/gio-hang/xoa-toan-bo');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xoá toàn bộ giỏ hàng');
    }
  }
};
