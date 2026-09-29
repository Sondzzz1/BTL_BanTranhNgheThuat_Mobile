import apiClient from './api';

export interface CustomArtRequestApi {
  maYeuCau: number;
  maKhachHang: number;
  tenKhachHang?: string | null;
  maHoaSi?: number | null;
  tenHoaSiThucHien?: string | null;
  tieuDe: string;
  type: 'ORIGINAL_COMMISSION' | 'PERSONAL_REFERENCE' | 'EXISTING_ARTWORK';
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
  nguonTacPhamGoc?: string | null;
  tinhTrangQuyenSuDung?: string | null;
  daXacNhanQuyenTaiLieu?: boolean;
  moTaQuyenSuDung?: string | null;
  bangChungQuyenSuDung?: string | null;
  ghiChuKiemDuyet?: string | null;
  tienDatCoc?: number;
  giaDuKien?: number;
  trangThai: string;
  trangThaiNoiBo?: string;
  ngayTao: string;
  ngayCapNhat?: string | null;
  ngayHoanThanhDuKien?: string | null;
  maTacPhamKetQua?: number | null;
  quote?: CustomArtQuoteResponse | null;
  progress: CustomArtProgressResponse[];
}

export interface CustomArtQuoteRequest {
  MaYeuCau: number;
  MaHoaSi?: number;
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
  ngayTao: string;
}

export interface CustomArtProgressResponse {
  maTienDo: number;
  maYeuCau: number;
  tieuDe: string;
  moTa: string;
  anhPreview?: string | null;
  trangThai: string;
  ngayTao: string;
}

export const customArtStatusMap: Record<string, string> = {
  DRAFT: 'Nháp', PENDING: 'Chờ Admin duyệt', WAITING_PERMISSION: 'Chờ bổ sung quyền',
  APPROVED: 'Đã duyệt', ACCEPTED: 'Họa sĩ đã nhận', IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy',
  Draft: 'Nháp', Submitted: 'Chờ xử lý', PendingArtist: 'Đã duyệt', Assigned: 'Đã nhận',
  Quoted: 'Đã báo giá', CustomerAccepted: 'Khách chấp nhận giá', DepositPaid: 'Đã đặt cọc',
  InProgress: 'Đang thực hiện', PreviewSent: 'Đã gửi preview', RevisionRequested: 'Yêu cầu chỉnh sửa',
  Completed: 'Hoàn thành', Rejected: 'Từ chối', Cancelled: 'Đã hủy',
};

export const getCustomArtStatusLabel = (status?: string | null) =>
  status ? customArtStatusMap[status] || status : 'Chưa xác định';

export const getCustomArtTypeLabel = (type?: string | null) => ({
  ORIGINAL_COMMISSION: 'Ý tưởng mới',
  PERSONAL_REFERENCE: 'Ảnh/tài liệu cá nhân',
  EXISTING_ARTWORK: 'Dựa trên tác phẩm có sẵn',
}[type || ''] || type || 'Chưa xác định');

export const customArtFileUrl = (path?: string | null) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(apiClient.defaults.baseURL || '').replace(/\/api\/?$/i, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getAuthenticatedCustomArtFileUrl = async (path?: string | null) => {
  if (!path) return undefined;
  if (/^data:image\//i.test(path)) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const endpoint = path.replace(/^\/api(?=\/)/i, '');
  const response = await apiClient.get<Blob>(endpoint, { responseType: 'blob' });
  return URL.createObjectURL(response.data);
};

export const customArtService = {
  async getAllRequests(type?: string, status?: string): Promise<CustomArtRequestApi[]> {
    const response = await apiClient.get('/tranh-theo-yeu-cau/admin/danh-sach', {
      params: { type: type || undefined, status: status || undefined },
    });
    return response.data || [];
  },

  async getArtistRequests(): Promise<CustomArtRequestApi[]> {
    const response = await apiClient.get('/tranh-theo-yeu-cau/hoa-si/danh-sach');
    return response.data || [];
  },

  async getById(id: number): Promise<CustomArtRequestApi> {
    return (await apiClient.get(`/tranh-theo-yeu-cau/yeu-cau/${id}`)).data;
  },

  async approve(id: number, ghiChu?: string) {
    return (await apiClient.post(`/tranh-theo-yeu-cau/admin/${id}/duyet`, { ghiChu })).data;
  },

  async requestPermission(id: number, ghiChu: string) {
    return (await apiClient.post(`/tranh-theo-yeu-cau/admin/${id}/yeu-cau-quyen-su-dung`, { ghiChu })).data;
  },

  async reject(id: number, ghiChu: string) {
    return (await apiClient.post(`/tranh-theo-yeu-cau/admin/${id}/tu-choi`, { ghiChu })).data;
  },

  async claimRequest(id: number): Promise<{ message: string }> {
    return (await apiClient.post(`/tranh-theo-yeu-cau/nhan-yeu-cau/${id}`)).data;
  },

  async updateStatus(id: number, trangThai: 'IN_PROGRESS') {
    return (await apiClient.put(`/tranh-theo-yeu-cau/hoa-si/${id}/trang-thai`, { trangThai })).data;
  },

  async complete(id: number, payload: { tenTacPhamMoi?: string; hinhAnhTacPham?: string; moTaNguonGoc?: string }) {
    return (await apiClient.post(`/tranh-theo-yeu-cau/hoa-si/${id}/hoan-thanh`, payload)).data;
  },

  async createQuote(payload: CustomArtQuoteRequest): Promise<CustomArtQuoteResponse> {
    return (await apiClient.post('/tranh-theo-yeu-cau/tao-bao-gia', payload)).data;
  },

  async confirmQuote(quoteId: number): Promise<{ message: string }> {
    return (await apiClient.post(`/tranh-theo-yeu-cau/bao-gia/${quoteId}/xac-nhan`)).data;
  },

  async createProgress(id: number, input: { tieuDe: string; moTa: string; image?: File }) {
    const form = new FormData();
    form.append('TieuDe', input.tieuDe);
    form.append('MoTa', input.moTa);
    form.append('TrangThai', 'InProgress');
    if (input.image) form.append('AnhPreviewFile', input.image);
    return (await apiClient.post(`/tranh-theo-yeu-cau/hoa-si/${id}/tien-do-co-tep`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
};
