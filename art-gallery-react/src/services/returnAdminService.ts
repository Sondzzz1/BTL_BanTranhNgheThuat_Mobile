// Return Admin Service - Quản lý yêu cầu hoàn trả (Admin)
import apiClient from './api';

export interface ReturnRequestAdmin {
  maYeuCau: number;
  maDonHang: number;
  maNguoiDung: number;
  tenNguoiDung?: string;
  maTacPham: number;
  tenTacPham: string;
  hinhAnhTacPham?: string;
  giaTacPham?: number;
  lyDo: string;
  lyDoKhac?: string;
  moTa?: string;
  hinhAnh: string[]; // Array of image URLs
  trangThai: string; // 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | ...
  lyDoTuChoi?: string;
  ngayTao: string;
}

export const returnAdminService = {
  /**
   * Lấy tất cả yêu cầu hoàn trả (Admin)
   */
  async getAllRequests(): Promise<ReturnRequestAdmin[]> {
    const response = await apiClient.get('/admin/hoan-tra/get-all');
    return response.data;
  },

  /**
   * Duyệt yêu cầu hoàn trả
   */
  async approveRequest(maYeuCau: number): Promise<void> {
    await apiClient.put(`/admin/hoan-tra/${maYeuCau}/duyet`, {
      chapNhan: true
    });
  },

  /**
   * Từ chối yêu cầu hoàn trả
   */
  async rejectRequest(maYeuCau: number, lyDoTuChoi: string): Promise<void> {
    await apiClient.put(`/admin/hoan-tra/${maYeuCau}/duyet`, {
      chapNhan: false,
      lyDoTuChoi: lyDoTuChoi
    });
  },
};
