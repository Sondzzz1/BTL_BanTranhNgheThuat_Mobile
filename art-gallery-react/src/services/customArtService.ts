import apiClient from './api';

export interface CustomArtRequestApi {
  maYeuCau: number;
  maKhachHang: number;
  maHoaSi?: number | null;
  tieuDe: string;
  type?: string;
  loaiTranh: string;
  kichThuoc: string;
  chuDe?: string;
  mauSac?: string;
  phongCach?: string;
  chatLieu?: string;
  moTa?: string | null;
  anhThamKhao?: string | null;
  referenceArtworkId?: number | null;
  referenceArtworkName?: string | null;
  referenceArtistName?: string | null;
  referenceImageUrl?: string | null;
  tienDatCoc?: number;
  giaDuKien?: number;
  trangThai: string;
  ngayTao: string;
}

export interface CustomArtQuoteRequest {
  MaYeuCau: number;
  MaHoaSi: number;
  GiaBaoGia: number;
  ThoiGianHoanThanh: string;
  GhiChu?: string;
}

export interface CustomArtQuoteResponse {
  maBaoGia: number;
  maYeuCau: number;
  maHoaSi: number;
  giaBaoGia: number;
  thoiGianHoanThanh: string;
  ghiChu?: string | null;
  trangThai: string;
}

export const customArtStatusMap: Record<string, string> = {
  Draft: 'Nháp',
  Submitted: 'Chờ xử lý',
  PendingArtist: 'Chờ họa sĩ xác nhận',
  Assigned: 'Đã chấp nhận',
  Quoted: 'Đã báo giá',
  CustomerAccepted: 'Khách chấp nhận giá',
  DepositPaid: 'Đã đặt cọc',
  InProgress: 'Đang thực hiện',
  PreviewSent: 'Đã gửi preview',
  RevisionRequested: 'Yêu cầu chỉnh sửa',
  Completed: 'Hoàn thành',
  Rejected: 'Từ chối',
  Cancelled: 'Đã hủy',
};

export const getCustomArtStatusLabel = (status?: string | null) => {
  if (!status) return 'Chưa xác định';
  return customArtStatusMap[status] || status;
};

export const customArtService = {
  async getAllRequests(): Promise<CustomArtRequestApi[]> {
    const response = await apiClient.get('/tranh-theo-yeu-cau/danh-sach-yeu-cau');
    return response.data || [];
  },

  async getMyRequests(): Promise<CustomArtRequestApi[]> {
    const response = await apiClient.get('/tranh-theo-yeu-cau/yeu-cau-cua-toi');
    return response.data || [];
  },

  async claimRequest(id: number): Promise<{ message: string }> {
    const response = await apiClient.post(`/tranh-theo-yeu-cau/nhan-yeu-cau/${id}`);
    return response.data;
  },

  async createQuote(payload: CustomArtQuoteRequest): Promise<CustomArtQuoteResponse> {
    const response = await apiClient.post('/tranh-theo-yeu-cau/tao-bao-gia', payload);
    const data = response.data || {};
    return {
      maBaoGia: data.maBaoGia ?? data.MaBaoGia ?? 0,
      maYeuCau: data.maYeuCau ?? data.MaYeuCau ?? payload.MaYeuCau,
      maHoaSi: data.maHoaSi ?? data.MaHoaSi ?? payload.MaHoaSi,
      giaBaoGia: data.giaBaoGia ?? data.GiaBaoGia ?? payload.GiaBaoGia,
      thoiGianHoanThanh: data.thoiGianHoanThanh ?? data.ThoiGianHoanThanh ?? payload.ThoiGianHoanThanh,
      ghiChu: data.ghiChu ?? data.GhiChu ?? payload.GhiChu,
      trangThai: data.trangThai ?? data.TrangThai ?? 'PendingCustomerApproval',
    };
  },

  async confirmQuote(quoteId: number): Promise<{ message: string }> {
    const response = await apiClient.post(`/tranh-theo-yeu-cau/bao-gia/${quoteId}/xac-nhan`);
    return response.data;
  },
};
