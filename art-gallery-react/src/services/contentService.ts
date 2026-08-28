import apiClient from './api';

// ======================================================
// KIỂU DỮ LIỆU
// ======================================================

// TrangThai: 0 = Chờ duyệt, 2 = Đã duyệt, 3 = Từ chối
export interface BaiVietResponse {
  maBaiViet: number;
  tieuDe: string;
  noiDung?: string;
  anhTieuDe?: string;
  maHoaSi: number;
  tenHoaSi: string;
  ngayDang: string;
  trangThai: number;
  lyDo?: string;
}

export interface NoiDungResponse {
  maNoiDung: number;
  maTacPham: number;
  tenTacPham?: string; // Thêm tên tác phẩm để hiển thị
  tieuDe: string;
  moTa?: string;
  loai: string;
  trangThai: boolean;
}

// ======================================================
// CONTENT SERVICE
// ======================================================

export const contentService = {
  // ======================================================
  // BÀI VIẾT (ARTICLES)
  // ======================================================

  // Public - chỉ lấy bài đã duyệt (TrangThai = 2)
  async layTatCaBaiViet(): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/noi-dung/bai-viet');
    return response.data;
  },

  // Admin - lấy tất cả bài viết (Hỗ trợ filter trangThai qua query params)
  async layTatCaBaiVietAdmin(trangThai?: number): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/noi-dung/bai-viet/get-all', {
      params: { trangThai }
    });
    return response.data;
  },

  // Xóa bài viết (Admin/Artist)
  async xoaBaiViet(id: number): Promise<void> {
    await apiClient.delete(`/noi-dung/bai-viet/${id}/delete`);
  },

  // Duyệt bài viết (Admin) - Gửi body { pheDuyet: true }
  async pheDuyetBaiViet(id: number): Promise<void> {
    await apiClient.put(`/noi-dung/bai-viet/${id}/update/duyet`, {
      pheDuyet: true,
      lyDo: null
    });
  },

  // Từ chối bài viết (Admin) - Gửi body { pheDuyet: false, lyDo: "..." }
  async tuChoiBaiViet(id: number, lyDo: string): Promise<void> {
    await apiClient.put(`/noi-dung/bai-viet/${id}/update/duyet`, {
      pheDuyet: false,
      lyDo: lyDo
    });
  },

  // ======================================================
  // CHI TIẾT TÁC PHẨM (ARTWORK DETAILS)
  // ======================================================

  async layTatCaChiTietTacPham(loai?: string): Promise<NoiDungResponse[]> {
    const response = await apiClient.get('/noi-dung/chi-tiet-tac-pham', {
      params: { loai }
    });
    return response.data;
  },

  async layChiTietTheoTacPham(maTacPham: number): Promise<NoiDungResponse[]> {
    const response = await apiClient.get(`/noi-dung/chi-tiet-tac-pham/theo-tac-pham/${maTacPham}`);
    return response.data;
  },

  async capNhatChiTietTacPham(id: number, data: {
    tieuDe: string;
    moTa?: string;
    loai: string;
    trangThai: boolean;
  }): Promise<void> {
    await apiClient.put(`/noi-dung/chi-tiet-tac-pham/${id}`, data);
  },

  async xoaChiTietTacPham(id: number): Promise<void> {
    await apiClient.delete(`/noi-dung/chi-tiet-tac-pham/${id}`);
  }
};