import apiClient from './api';

export interface BaiVietResponse {
  maBaiViet: number;
  tieuDe: string;
  noiDung?: string;
  maHoaSi: number;
  tenHoaSi: string;
  ngayDang: string;
  trangThai?: boolean;
}

export interface NoiDungResponse {
  maNoiDung: number;
  tieuDe: string;
  moTa?: string;
  loai: string;
  trangThai: boolean;
}

export const contentService = {
  // Bài viết
  async layTatCaBaiViet(): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/noi-dung/bai-viet');
    return response.data;
  },

  async taoBaiViet(data: { tieuDe: string; noiDung: string }): Promise<void> {
    await apiClient.post('/noi-dung/bai-viet', data);
  },

  async capNhatBaiViet(id: number, data: { tieuDe: string; noiDung: string }): Promise<void> {
    await apiClient.put(`/noi-dung/bai-viet/${id}`, data);
  },

  async xoaBaiViet(id: number): Promise<void> {
    await apiClient.delete(`/noi-dung/bai-viet/${id}`);
  },

  async pheDuyetBaiViet(id: number, approve: boolean): Promise<void> {
    await apiClient.put(`/noi-dung/bai-viet/${id}/phe-duyet`, approve, {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Chi tiết tác phẩm
  async layTatCaChiTietTacPham(loai?: string): Promise<NoiDungResponse[]> {
    const response = await apiClient.get('/noi-dung/chi-tiet-tac-pham', { params: { loai } });
    return response.data;
  },

  async layChiTietTheoTacPham(maTacPham: number): Promise<NoiDungResponse[]> {
    const response = await apiClient.get(`/noi-dung/chi-tiet-tac-pham/theo-tac-pham/${maTacPham}`);
    return response.data;
  },

  async taoChiTietTacPham(data: any): Promise<void> {
    await apiClient.post('/noi-dung/chi-tiet-tac-pham', data);
  },

  async capNhatChiTietTacPham(id: number, data: any): Promise<void> {
    await apiClient.put(`/noi-dung/chi-tiet-tac-pham/${id}`, data);
  },

  async xoaChiTietTacPham(id: number): Promise<void> {
    await apiClient.delete(`/noi-dung/chi-tiet-tac-pham/${id}`);
  }
};
