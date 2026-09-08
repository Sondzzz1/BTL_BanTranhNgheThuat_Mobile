// Return Service - API calls cho chức năng hoàn trả sản phẩm
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import {
  YeuCauHoanTra,
  YeuCauHoanTraChiTiet,
  TaoHoanTraRequest,
  TaoHoanTraResponse,
} from '../types/return';

export const returnService = {
  /**
   * Tạo yêu cầu hoàn trả sản phẩm mới.
   * Gửi thông tin sản phẩm cần hoàn trả, lý do và hình ảnh minh chứng.
   */
  async createReturnRequest(request: TaoHoanTraRequest): Promise<TaoHoanTraResponse> {
    try {
      const response = await apiClient.post<TaoHoanTraResponse>(
        API_ENDPOINTS.RETURN_CREATE,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating return request:', error);
      const serverError = error.response?.data;
      const errorMessage =
        serverError?.message || serverError?.error || error.message || 'Lỗi khi gửi yêu cầu hoàn trả';
      throw new Error(errorMessage);
    }
  },

  /**
   * Lấy danh sách yêu cầu hoàn trả của khách hàng hiện tại.
   */
  async getMyReturns(): Promise<YeuCauHoanTra[]> {
    try {
      const response = await apiClient.get<YeuCauHoanTra[]>(API_ENDPOINTS.RETURN_MY);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my returns:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải danh sách hoàn trả');
    }
  },

  /**
   * Lấy chi tiết một yêu cầu hoàn trả theo ID.
   */
  async getReturnDetail(id: number): Promise<YeuCauHoanTraChiTiet> {
    try {
      const response = await apiClient.get<YeuCauHoanTraChiTiet>(
        API_ENDPOINTS.RETURN_DETAIL(id)
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching return detail:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể tải chi tiết yêu cầu hoàn trả');
    }
  },

  /**
   * Khách hàng xác nhận đã gửi sản phẩm về cửa hàng.
   * Chuyển trạng thái từ DA_DUYET → DANG_HOAN_TRA.
   */
  async confirmProductReturned(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>(
        API_ENDPOINTS.RETURN_CONFIRM_SHIPPED(id)
      );
      return response.data;
    } catch (error: any) {
      console.error('Error confirming product returned:', error);
      const serverError = error.response?.data;
      throw new Error(serverError?.message || error.message || 'Không thể xác nhận gửi hàng');
    }
  },
};
