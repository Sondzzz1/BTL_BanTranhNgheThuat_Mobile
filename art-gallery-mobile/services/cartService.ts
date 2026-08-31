// Cart Service
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { Cart, AddToCartRequest, UpdateCartRequest } from '../types/cart';

export const cartService = {
  // Lấy giỏ hàng của user hiện tại
  async getCart(): Promise<Cart> {
    try {
      const response = await apiClient.get<Cart>(API_ENDPOINTS.CART);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(maTacPham: number, soLuong: number): Promise<void> {
    try {
      const request: AddToCartRequest = { maTacPham, soLuong };
      await apiClient.post(API_ENDPOINTS.CART_ADD, request);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Cập nhật số lượng trong giỏ hàng
  async updateCartItem(itemId: number, soLuong: number): Promise<void> {
    try {
      const request: UpdateCartRequest = { soLuong };
      await apiClient.put(API_ENDPOINTS.CART_UPDATE(itemId), request);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(itemId: number): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART_DELETE(itemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Xóa toàn bộ giỏ hàng
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.CART_CLEAR);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
};
