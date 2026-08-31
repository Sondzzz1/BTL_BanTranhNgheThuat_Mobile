// Order Service
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { Order, CreateOrderRequest, CancelOrderRequest } from '../types/order';

export const orderService = {
  // Tạo đơn hàng mới
  async createOrder(
    tenNguoiNhan?: string,
    soDienThoai?: string,
    diaChiGiao?: string
  ): Promise<{ message: string; maDonHang: number }> {
    try {
      const request: CreateOrderRequest = {
        tenNguoiNhan,
        soDienThoai,
        diaChiGiao,
      };
      const response = await apiClient.post<{ message: string; maDonHang: number }>(
        API_ENDPOINTS.ORDER_CREATE,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của user hiện tại
  async getMyOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<Order[]>(API_ENDPOINTS.ORDER_MY);
      return response.data;
    } catch (error) {
      console.error('Error fetching my orders:', error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  async getOrderById(id: number): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(API_ENDPOINTS.ORDER_DETAIL(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      throw error;
    }
  },

  // Hủy đơn hàng
  async cancelOrder(id: number, lyDo?: string): Promise<{ message: string }> {
    try {
      const request: CancelOrderRequest = { lyDo };
      const response = await apiClient.put<{ message: string }>(
        API_ENDPOINTS.ORDER_CANCEL(id),
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },
};
