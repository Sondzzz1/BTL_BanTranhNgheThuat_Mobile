// Admin Return Service - API calls quản lý hoàn trả cho Admin
import apiClient from './api';

// ================================================================
// INTERFACES
// ================================================================

export interface HoanTraSummary {
  maYeuCau: number;
  maDonHang: number;
  maTacPham: number;
  tenTacPham?: string;
  hinhAnhTacPham?: string;
  giaTacPham: number;
  lyDo: string;
  moTa?: string;
  trangThai: string;
  ngayTao: string;
}

export interface HoanTraDetail {
  maYeuCau: number;
  maDonHang: number;
  maNguoiDung: number;
  tenNguoiDung?: string;
  emailNguoiDung?: string;
  soDienThoaiNguoiDung?: string;
  maTacPham: number;
  tenTacPham?: string;
  hinhAnhTacPham?: string;
  giaTacPham: number;
  soLuong: number;
  lyDo: string;
  lyDoKhac?: string;
  moTa?: string;
  hinhAnh: string[];
  trangThai: string;
  lyDoTuChoi?: string;
  ngayTao: string;
  ngayCapNhat: string;
  ngayDatHang: string;
  tongTienDonHang: number;
}

export interface DuyetHoanTraRequest {
  chapNhan: boolean;
  lyDoTuChoi?: string;
}

export interface CapNhatTrangThaiRequest {
  trangThai: string;
}

// ================================================================
// SERVICE FUNCTIONS
// ================================================================

export const adminReturnService = {
  /** Lấy tất cả yêu cầu hoàn trả với các bộ lọc */
  async getAllReturns(params?: {
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    keyword?: string;
  }): Promise<HoanTraSummary[]> {
    const response = await apiClient.get<HoanTraSummary[]>('/admin/hoan-tra/get-all', {
      params,
    });
    return response.data;
  },

  /** Lấy chi tiết yêu cầu hoàn trả */
  async getReturnById(id: number): Promise<HoanTraDetail> {
    const response = await apiClient.get<HoanTraDetail>(`/admin/hoan-tra/${id}`);
    return response.data;
  },

  /** Admin duyệt hoặc từ chối yêu cầu */
  async approveReturn(id: number, request: DuyetHoanTraRequest): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(
      `/admin/hoan-tra/${id}/duyet`,
      request
    );
    return response.data;
  },

  /** Admin cập nhật trạng thái theo quy trình */
  async updateReturnStatus(id: number, trangThai: string): Promise<{ message: string }> {
    const request: CapNhatTrangThaiRequest = { trangThai };
    const response = await apiClient.put<{ message: string }>(
      `/admin/hoan-tra/${id}/cap-nhat-trang-thai`,
      request
    );
    return response.data;
  },

  /** Admin hoàn tất toàn bộ quy trình */
  async completeReturn(id: number): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(
      `/admin/hoan-tra/${id}/hoan-tat`
    );
    return response.data;
  },
};

// ================================================================
// CONSTANTS - Trạng thái hiển thị
// ================================================================

export const RETURN_STATUS_TEXT: Record<string, string> = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Từ chối',
  DANG_HOAN_TRA: 'Đang gửi hàng',
  DA_NHAN_HANG: 'Đã nhận hàng',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_TAT: 'Hoàn tất',
};

export const RETURN_STATUS_COLOR: Record<string, string> = {
  CHO_DUYET: '#f59e0b',
  DA_DUYET: '#3b82f6',
  TU_CHOI: '#ef4444',
  DANG_HOAN_TRA: '#f97316',
  DA_NHAN_HANG: '#8b5cf6',
  DA_HOAN_TIEN: '#10b981',
  HOAN_TAT: '#16a34a',
};

export const RETURN_REASON_TEXT: Record<string, string> = {
  SAN_PHAM_HU_HONG: 'Sản phẩm bị hư hỏng',
  SAI_MO_TA: 'Sản phẩm không đúng mô tả',
  GIAO_SAI: 'Giao sai sản phẩm',
  LOI_SAN_PHAM: 'Sản phẩm bị lỗi',
  KHONG_DUNG_DAT: 'Không đúng sản phẩm đã đặt',
  LY_DO_KHAC: 'Lý do khác',
};

/** Các trạng thái kế tiếp hợp lệ mà Admin có thể chuyển sang */
export const NEXT_VALID_STATUS: Record<string, string | null> = {
  CHO_DUYET: null, // Dùng approve/reject riêng
  DA_DUYET: 'DANG_HOAN_TRA',
  DANG_HOAN_TRA: 'DA_NHAN_HANG',
  DA_NHAN_HANG: 'DA_HOAN_TIEN',
  DA_HOAN_TIEN: 'HOAN_TAT',
  HOAN_TAT: null,
  TU_CHOI: null,
};
