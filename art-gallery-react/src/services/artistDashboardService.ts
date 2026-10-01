// Artist Dashboard Service - Dành riêng cho phân hệ Họa Sĩ quản lý
import apiClient from './api';

export interface HoSoHoaSiResponse {
    maHoaSi: number;
    tenHoaSi: string;
    tieuSu?: string;
    anhDaiDien?: string;
    soTacPham: number;
    tongDoanhThu: number;
}

export interface CapNhatHoSoHoaSiRequest {
    tenHoaSi: string;
    tieuSu?: string;
}

export interface TaoTacPhamRequest {
    tenTacPham: string;
    maDanhMuc?: number;
    gia: number;
    soLuong: number;
    moTa?: string;
    hinhAnh?: string;
    kichThuoc?: string;
    chatLieu?: string;
    chatLieuKhung?: string;
}

export interface CapNhatTacPhamRequest {
    tenTacPham: string;
    maDanhMuc?: number;
    gia: number;
    soLuong: number;
    moTa?: string;
    hinhAnh?: string;
    kichThuoc?: string;
    chatLieu?: string;
    chatLieuKhung?: string;
}

export interface ChiTietTacPhamPayload {
    cauChuyenSangTac?: string | null;
    yNghiaNghiThuat?: string | null;
    kyThuatThucHien?: string | null;
    camHungSangTao?: string | null;
    thongTinBosung?: string | null;
    kichThuoc?: string | null;
    chatLieu?: string | null;
    chatLieuKhung?: string | null;
    namSangTac?: number | null;
    diaDiemSangTac?: string | null;
    hinhAnh1?: string | null;
    hinhAnh2?: string | null;
    hinhAnh3?: string | null;
    hinhAnh4?: string | null;
}

export interface ChiTietTacPhamResponse extends ChiTietTacPhamPayload {
    maChiTiet: number;
    maTacPham: number;
    tenTacPham: string;
    maHoaSi: number;
    tenHoaSi: string;
    trangThai: number;
    trangThaiText: string;
    lyDoTuChoi?: string;
    ngayTao: string;
    ngayCapNhat?: string;
}

export interface TacPhamHoaSiResponse {
    maTacPham: number;
    tenTacPham: string;
    tenDanhMuc?: string;
    gia: number;
    soLuong: number;
    moTa?: string;
    hinhAnh?: string;
    kichThuoc?: string;
    chatLieu?: string;
    chatLieuKhung?: string;
    trangThai: number;
    trangThaiText: string;
    ngayTao: string;
    lyDo?: string;
}

export interface BaiVietResponse {
    maBaiViet: number;
    tieuDe: string;
    noiDung?: string;
    anhTieuDe?: string;
    maHoaSi?: number;
    maTaiKhoanTacGia?: number;
    tenHoaSi: string;
    tenTacGia?: string;
    tomTat?: string;
    maDanhMucBaiViet?: number;
    tenDanhMuc?: string;
    ngayDang: string;
    ngayXuatBan?: string;
    ngayCapNhat?: string;
    ngayBatDauSuKien?: string;
    ngayKetThucSuKien?: string;
    diaDiemSuKien?: string;
    nguonNoiDung?: string;
    trangThai: number; // 0=Draft, 2=Published, 3=Rejected
    lyDo?: string;
}

export interface TaoBaiVietRequest {
    tieuDe: string;
    noiDung?: string;
    anhTieuDe?: string;
    tomTat?: string;
    maDanhMucBaiViet?: number;
    ngayBatDauSuKien?: string | null;
    ngayKetThucSuKien?: string | null;
    diaDiemSuKien?: string;
    nguonNoiDung?: string;
    maTacPhamLienQuan: number[];
}

export interface CapNhatBaiVietRequest {
    tieuDe: string;
    noiDung?: string;
    anhTieuDe?: string;
    tomTat?: string;
    maDanhMucBaiViet?: number;
    ngayBatDauSuKien?: string | null;
    ngayKetThucSuKien?: string | null;
    diaDiemSuKien?: string;
    nguonNoiDung?: string;
    maTacPhamLienQuan: number[];
}

export interface DanhMucBaiVietResponse { maDanhMucBaiViet:number;tenDanhMuc:string;slug:string; }

export interface DoanhThuTongQuanResponse {
    tongDoanhThu: number;
    soDonHang: number;
    soTacPhamDaBan: number;
    doanhThuThangNay: number;
}

export interface DoanhThuChiTietResponse {
    maDonHang: number;
    ngayDat: string;
    tenKhachHang: string;
    tongTien: number;
    trangThai: string;
}

export interface DonHangResponse {
    maDonHang: number;
    ngayDat: string;
    tenKhachHang: string;
    tongTien: number;
    trangThai: string;
}

export const artistDashboardService = {
  // --- HỒ SƠ ---
  getHoSo: async (): Promise<HoSoHoaSiResponse> => {
    const response = await apiClient.get('/hoa-si/ho-so');
    return response.data;
  },
  capNhatHoSo: async (data: CapNhatHoSoHoaSiRequest): Promise<any> => {
    const response = await apiClient.put('/hoa-si/cap-nhat-ho-so', data);
    return response.data;
  },
  uploadAvatar: async (avatarUrl: string): Promise<any> => {
    const response = await apiClient.post('/hoa-si/upload-avatar', { avatarUrl });
    return response.data;
  },

  // --- TÁC PHẨM ---
  getTacPhamCuaToi: async (): Promise<TacPhamHoaSiResponse[]> => {
    const response = await apiClient.get('/hoa-si/tac-pham/get-all');
    return response.data;
  },
  taoTacPham: async (data: TaoTacPhamRequest): Promise<{ message: string; maTacPham: number }> => {
    const response = await apiClient.post('/hoa-si/tac-pham/create', data);
    return response.data;
  },
  capNhatTacPham: async (id: number, data: CapNhatTacPhamRequest): Promise<any> => {
    const response = await apiClient.put(`/hoa-si/tac-pham/${id}/update`, data);
    return response.data;
  },
  xoaTacPham: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/hoa-si/tac-pham/${id}/delete`);
    return response.data;
  },
  guiDuyetLaiTacPham: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/hoa-si/tac-pham/${id}/gui-duyet-lai`);
    return response.data;
  },
  getChiTietTacPham: async (id: number): Promise<ChiTietTacPhamResponse | null> => {
    try {
      const response = await apiClient.get<ChiTietTacPhamResponse>(`/hoa-si/tac-pham/${id}/chi-tiet`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },
  taoChiTietTacPham: async (id: number, data: ChiTietTacPhamPayload): Promise<any> => {
    const response = await apiClient.post(`/hoa-si/tac-pham/${id}/chi-tiet`, data);
    return response.data;
  },
  capNhatChiTietTacPham: async (id: number, data: ChiTietTacPhamPayload): Promise<any> => {
    const response = await apiClient.put(`/hoa-si/tac-pham/${id}/chi-tiet`, data);
    return response.data;
  },

  // --- BÀI VIẾT ---
  getBaiVietCuaToi: async (): Promise<BaiVietResponse[]> => {
    const response = await apiClient.get('/hoa-si/bai-viet/get-all');
    return response.data;
  },
  getDanhMucBaiViet: async (): Promise<DanhMucBaiVietResponse[]> => {
    const response = await apiClient.get('/bai-viet/danh-muc');
    return response.data;
  },
  taoBaiViet: async (data: TaoBaiVietRequest): Promise<any> => {
    const response = await apiClient.post('/hoa-si/bai-viet/create', data);
    return response.data;
  },
  capNhatBaiViet: async (id: number, data: CapNhatBaiVietRequest): Promise<any> => {
    const response = await apiClient.put(`/hoa-si/bai-viet/${id}/update`, data);
    return response.data;
  },
  xoaBaiViet: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/hoa-si/bai-viet/${id}/delete`);
    return response.data;
  },
  guiDuyetBaiViet: async (id: number): Promise<any> => {
    const response = await apiClient.put(`/hoa-si/bai-viet/${id}/gui-duyet`);
    return response.data;
  },

  // --- DOANH THU ---
  getDoanhThuTongQuan: async (): Promise<DoanhThuTongQuanResponse> => {
    const response = await apiClient.get('/hoa-si/doanh-thu/tong-quan');
    return response.data;
  },
  getDoanhThuChiTiet: async (): Promise<DoanhThuChiTietResponse[]> => {
    const response = await apiClient.get('/hoa-si/doanh-thu/chi-tiet');
    return response.data;
  },
  getDonHangCuaToi: async (): Promise<DonHangResponse[]> => {
      const response = await apiClient.get('/hoa-si/don-hang');
      return response.data;
  }
};
