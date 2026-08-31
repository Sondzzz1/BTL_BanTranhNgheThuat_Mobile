// Cart Service - API calls cho Giỏ hàng đồng bộ với Backend
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { Cart, AddToCartRequest, UpdateCartRequest } from '../types/cart';

export const cartService = {
  // Lấy giỏ hàng của user hiện tại
  async getCart(): Promise<Cart> {
    try {
      const response = await apiClient.get<Cart>(API_ENDPOINTS.CART);
      return {
        maGioHang: response.data.maGioHang || 0,
        danhSachSanPham: response.data.danhSachSanPham || [],
        tongTien: response.data.tongTien || 0,
      };
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi tải giỏ hàng');
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(maTacPham: number, soLuong: number = 1): Promise<void> {
    try {
      const request: AddToCartRequest = { maTacPham, soLuong };
      await apiClient.post(API_ENDPOINTS.CART_ADD, request);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
    }
  },

  // Cập nhật số lượng trong giỏ hàng
  async updateCartItem(itemId: number, soLuong: number): Promise<void> {
    try {
      const request: UpdateCartRequest = { soLuong };
      await apiClient.put(API_ENDPOINTS.CART_UPDATE(itemId), request);
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng');
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(itemId: number): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART_DELETE(itemId));
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng');
    }
  },

  // Xóa toàn bộ giỏ hàng
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART_CLEAR);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa toàn bộ giỏ hàng');
    }
  },
};

