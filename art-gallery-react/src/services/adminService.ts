// Admin Service - API calls cho Admin
import apiClient from './api';

// ================================================================
// INTERFACES & TYPES
// ================================================================

// Dashboard
export interface DashboardResponse {
  tongDoanhThu: number;
  tongDonHang: number;
  tongKhachHang: number;
  tongHoaSi: number;
  tongTacPham: number;
  donHangChoXuLy: number;
  tacPhamChoDuyet: number;
  baiVietChoDuyet: number;
}

export interface ThongKeTongQuanResponse {
  tongDoanhThu: number;
  tongDonHang: number;
  tongKhachHang: number;
  tongHoaSi: number;
  tongTacPham: number;
  tongBaiViet: number;
}

export interface ThongKeNhanhResponse {
  ngay: string;
  donHangMoi: number;
  donHangHoanThanh: number;
  doanhThuNgay: number;
  khachHangMoi: number;
  tacPhamMoi: number;
  donHangChoXuLy: number;
  tyLeHoanThanh: number;
}

export interface ThongKeSoSanhResponse {
  kyHienTai: {
    doanhThu: number;
    soDonHang: number;
  };
  kyTruoc: {
    doanhThu: number;
    soDonHang: number;
  };
  tangTruong: {
    doanhThu: number;
    soDonHang: number;
  };
}

// Đơn hàng
export interface DonHangAdminResponse {
  maDonHang: number;
  tenKhachHang: string;
  ngayDat: string;
  tongTien: number;
  trangThaiText: string;
  trangThai: number;
  trangThaiThanhToan?: string;
  lyDoHuy?: string;
}

export interface DonHangResponse {
  maDonHang: number;
  ngayDat: string;
  tongTien: number;
  tenNguoiNhan: string;
  soDienThoai: string;
  diaChiGiao: string;
  trangThai: number;
  trangThaiText: string;
  trangThaiThanhToan?: string;
  lyDoHuy?: string;
  chiTiet: ChiTietDonHangResponse[];
}

export interface ChiTietDonHangResponse {
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  hinhAnh?: string;
}

export interface CapNhatTrangThaiDonHangRequest {
  trangThai: number;
  ghiChu?: string;
}

export interface TimKiemDonHangRequest {
  keyword?: string;
  trangThai?: number;
  tuNgay?: string;
  denNgay?: string;
  tuGia?: number;
  denGia?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface TimKiemDonHangResponse {
  data: DonHangAdminResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// Khách hàng
export interface ThongTinKhachHangResponse {
  id: number;
  hoTen: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  ngayDangKy: string;
  tongChiTieu: number;
  soDonHang: number;
  trangThai: boolean;
}

export interface KhachHangTiemNangResponse {
  id: number;
  hoTen: string;
  email: string;
  tongChiTieu: number;
  soDonHang: number;
  lanMuaCuoi: string;
}

// Họa sĩ
export interface HoSoHoaSiResponse {
  id: number;
  tenHoaSi: string;
  email: string;
  soDienThoai: string;
  tieuSu?: string;
  anhDaiDien?: string;
  soTacPham: number;
  doanhThu: number;
  trangThai: boolean;
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
  tenHoaSi?: string;
  lyDo?: string;
}

export interface HoaSiXepHangResponse {
  id: number;
  tenHoaSi: string;
  doanhThu: number;
  soTacPham: number;
  daBan: number;
  xepHang: number;
}

// Tác phẩm
export interface DuyetTacPhamRequest {
  pheDuyet: boolean;
  lyDo?: string;
}

// Bài viết
export interface BaiVietResponse {
  maBaiViet: number;
  tieuDe: string;
  noiDung?: string;
  maHoaSi: number;
  tenHoaSi: string;
  ngayDang: string;
  trangThai?: number;
  trangThaiText?: string;
}

export interface DuyetBaiVietRequest {
  pheDuyet: boolean;
  lyDo?: string;
}

// Danh mục
export interface DanhMucResponse {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
  soTacPham: number;
}

export interface TaoDanhMucRequest {
  tenDanhMuc: string;
  moTa?: string;
}

export interface CapNhatDanhMucRequest {
  tenDanhMuc: string;
  moTa?: string;
}

// Thanh toán
export interface ThanhToanResponse {
  id: number;
  maDonHang: number;
  phuongThuc: string;
  soTien: number;
  trangThai: string;
  ngayThanhToan: string;
}

// Hóa đơn
export interface HoaDonResponse {
  id: number;
  maHoaDon: string;
  maDonHang: number;
  tongTien: number;
  ngayLap: string;
  trangThai: string;
}

export interface HoaDonChiTietResponse extends HoaDonResponse {
  chiTiet: any[];
}

export interface HuyHoaDonRequest {
  lyDo: string;
}

// Nội dung
export interface NoiDungResponse {
  id: number;
  tieuDe: string;
  noiDung: string;
  loai: string;
  ngayTao: string;
}

export interface TaoNoiDungRequest {
  tieuDe: string;
  noiDung: string;
  loai: string;
}

export interface CapNhatNoiDungRequest {
  tieuDe: string;
  noiDung: string;
}

// Báo cáo
export interface DoanhThuTheoThangResponse {
  thang: number;
  nam: number;
  doanhThu: number;
  soDonHang: number;
}

export interface DoanhThuTheoHoaSiResponse {
  maHoaSi: number;
  tenHoaSi: string;
  soTacPham: number;
  soLuongBan: number;
  doanhThu: number;
}

export interface TacPhamBanChayResponse {
  tacPhamId: number;
  tenTacPham: string;
  soLuongBan: number;
  doanhThu: number;
  hoaSi: string;
}

export interface ThongKeTrangThaiDonHangResponse {
  choXuLy: number;
  dangGiao: number;
  daGiao: number;
  daHuy: number;
}

export interface TimKiemTongHopResponse {
  donHang: DonHangAdminResponse[];
  khachHang: ThongTinKhachHangResponse[];
  tacPham: TacPhamHoaSiResponse[];
  hoaSi: HoSoHoaSiResponse[];
}

// ================================================================
// ADMIN SERVICE
// ================================================================

export const adminService = {
  // ================================================================
  // DASHBOARD & THỐNG KÊ
  // ================================================================
  
  async getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  async getThongKeTongQuan(): Promise<ThongKeTongQuanResponse> {
    const response = await apiClient.get('/admin/thong-ke/tong-quan');
    return response.data;
  },

  async getThongKeNhanh(ngay?: Date): Promise<ThongKeNhanhResponse> {
    const params = ngay ? { ngay: ngay.toISOString() } : {};
    const response = await apiClient.get('/admin/thong-ke/nhanh', { params });
    return response.data;
  },

  async getThongKeSoSanh(
    tuNgay1: Date,
    denNgay1: Date,
    tuNgay2: Date,
    denNgay2: Date
  ): Promise<ThongKeSoSanhResponse> {
    const response = await apiClient.get('/admin/thong-ke/so-sanh', {
      params: {
        tuNgay1: tuNgay1.toISOString(),
        denNgay1: denNgay1.toISOString(),
        tuNgay2: tuNgay2.toISOString(),
        denNgay2: denNgay2.toISOString(),
      },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ ĐƠN HÀNG
  // ================================================================

  async getAllDonHang(): Promise<DonHangAdminResponse[]> {
    const response = await apiClient.get('/admin/don-hang/get-all');
    return response.data;
  },

  async getDonHangById(id: number): Promise<DonHangResponse> {
    const response = await apiClient.get(`/admin/don-hang/${id}`);
    return response.data;
  },

  async capNhatTrangThaiDonHang(
    id: number,
    request: CapNhatTrangThaiDonHangRequest
  ): Promise<void> {
    await apiClient.put(`/admin/don-hang/${id}/update/trang-thai`, request);
  },

  async xoaDonHang(id: number): Promise<void> {
    await apiClient.delete(`/admin/don-hang/${id}/delete`);
  },

  async timKiemDonHang(params: TimKiemDonHangRequest): Promise<DonHangAdminResponse[]> {
    const response = await apiClient.get('/admin/don-hang/tim-kiem', { params });
    return response.data;
  },

  async timKiemDonHangNangCao(request: TimKiemDonHangRequest): Promise<TimKiemDonHangResponse> {
    const response = await apiClient.get('/admin/don-hang/tim-kiem-nang-cao', {
      params: request,
    });
    return response.data;
  },

  async sapXepDonHang(
    sapXepTheo: string = 'ngaydat',
    thuTu: string = 'desc'
  ): Promise<DonHangAdminResponse[]> {
    const response = await apiClient.get('/admin/don-hang/sap-xep', {
      params: { sapXepTheo, thuTu },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ KHÁCH HÀNG
  // ================================================================

  async getAllKhachHang(): Promise<ThongTinKhachHangResponse[]> {
    const response = await apiClient.get('/admin/khach-hang/get-all');
    return response.data;
  },

  async getKhachHangById(id: number): Promise<ThongTinKhachHangResponse> {
    const response = await apiClient.get(`/admin/khach-hang/${id}`);
    return response.data;
  },

  async getDonHangCuaKhachHang(id: number): Promise<DonHangResponse[]> {
    const response = await apiClient.get(`/admin/khach-hang/${id}/don-hang`);
    return response.data;
  },

  async khoaKhachHang(id: number): Promise<void> {
    await apiClient.put(`/admin/khach-hang/${id}/update/khoa`);
  },

  async moKhoaKhachHang(id: number): Promise<void> {
    await apiClient.put(`/admin/khach-hang/${id}/update/mo-khoa`);
  },

  async timKiemKhachHang(params: {
    keyword?: string;
    trangThai?: boolean;
    tuChiTieu?: number;
    denChiTieu?: number;
    tuSoDonHang?: number;
    denSoDonHang?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<ThongTinKhachHangResponse[]> {
    const response = await apiClient.get('/admin/khach-hang/tim-kiem', { params });
    return response.data;
  },

  async locKhachHangTheoHoatDong(loai: string): Promise<ThongTinKhachHangResponse[]> {
    const response = await apiClient.get('/admin/khach-hang/loc-theo-hoat-dong', {
      params: { loai },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ HỌA SĨ
  // ================================================================

  async taoTaiKhoanHoaSi(payload: {
    tenDangNhap: string;
    matKhau: string;
    tenHoaSi: string;
    email?: string;
    dienThoai?: string;
    diaChi?: string;
  }): Promise<{ success: boolean; message?: string; maTaiKhoan?: number; maHoaSi?: number }> {
    try {
      const response = await apiClient.post('/admin/hoa-si/create', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Tạo tài khoản họa sĩ thất bại';
      return { success: false, message };
    }
  },

  async getAllHoaSi(): Promise<HoSoHoaSiResponse[]> {
    const response = await apiClient.get('/admin/hoa-si/get-all');
    return response.data;
  },

  async getHoaSiById(id: number): Promise<HoSoHoaSiResponse> {
    const response = await apiClient.get(`/admin/hoa-si/${id}`);
    return response.data;
  },

  async getTacPhamCuaHoaSi(id: number): Promise<TacPhamHoaSiResponse[]> {
    const response = await apiClient.get(`/admin/hoa-si/${id}/tac-pham`);
    return response.data;
  },

  async khoaHoaSi(id: number): Promise<void> {
    await apiClient.put(`/admin/hoa-si/${id}/update/khoa`);
  },

  async moKhoaHoaSi(id: number): Promise<void> {
    await apiClient.put(`/admin/hoa-si/${id}/update/mo-khoa`);
  },

  async timKiemHoaSi(params: {
    keyword?: string;
    trangThai?: boolean;
    tuSoTacPham?: number;
    denSoTacPham?: number;
    tuDoanhThu?: number;
    denDoanhThu?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<HoSoHoaSiResponse[]> {
    const response = await apiClient.get('/admin/hoa-si/tim-kiem', { params });
    return response.data;
  },

  async xepHangHoaSi(tieuChi: string = 'doanhthu', top: number = 10): Promise<HoaSiXepHangResponse[]> {
    const response = await apiClient.get('/admin/hoa-si/xep-hang', {
      params: { tieuChi, top },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ TÁC PHẨM
  // ================================================================

  async getAllTacPham(): Promise<TacPhamHoaSiResponse[]> {
    const response = await apiClient.get('/admin/tac-pham/get-all');
    return response.data;
  },

  async duyetTacPham(id: number, request: DuyetTacPhamRequest): Promise<void> {
    await apiClient.put(`/admin/tac-pham/${id}/update/duyet`, request);
  },

  async xoaTacPham(id: number): Promise<void> {
    await apiClient.delete(`/admin/tac-pham/${id}/delete`);
  },

  async hideTacPham(id: number): Promise<void> {
    await apiClient.put(`/admin/tac-pham/${id}/hide`);
  },

  async showTacPham(id: number): Promise<void> {
    await apiClient.put(`/admin/tac-pham/${id}/show`);
  },

  async timKiemTacPham(params: {
    keyword?: string;
    maDanhMuc?: number;
    maHoaSi?: number;
    trangThai?: number;
    tuGia?: number;
    denGia?: number;
    tuSoLuong?: number;
    denSoLuong?: number;
    tuNgay?: string;
    denNgay?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<TacPhamHoaSiResponse[]> {
    const response = await apiClient.get('/admin/tac-pham/tim-kiem', { params });
    return response.data;
  },

  async locTacPhamTheoTieuChi(tieuChi: string): Promise<TacPhamHoaSiResponse[]> {
    const response = await apiClient.get('/admin/tac-pham/loc-theo-tieu-chi', {
      params: { tieuChi },
    });
    return response.data;
  },

  async sapXepTacPham(
    sapXepTheo: string = 'ngaytao',
    thuTu: string = 'desc'
  ): Promise<TacPhamHoaSiResponse[]> {
    const response = await apiClient.get('/admin/tac-pham/sap-xep', {
      params: { sapXepTheo, thuTu },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ BÀI VIẾT
  // ================================================================

  async getAllBaiViet(): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/admin/bai-viet/get-all');
    return response.data;
  },

  async duyetBaiViet(id: number, request: DuyetBaiVietRequest): Promise<void> {
    await apiClient.put(`/admin/bai-viet/${id}/update/duyet`, request);
  },

  async xoaBaiViet(id: number): Promise<void> {
    await apiClient.delete(`/admin/bai-viet/${id}/delete`);
  },

  async timKiemBaiViet(params: {
    keyword?: string;
    maHoaSi?: number;
    trangThai?: boolean;
    tuNgay?: string;
    denNgay?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/admin/bai-viet/tim-kiem', { params });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ DANH MỤC
  // ================================================================

  async getAllDanhMuc(): Promise<DanhMucResponse[]> {
    const response = await apiClient.get('/admin/danh-muc/get-all');
    return response.data;
  },

  async getDanhMucById(id: number): Promise<DanhMucResponse> {
    const response = await apiClient.get(`/admin/danh-muc/${id}`);
    return response.data;
  },

  async taoDanhMuc(request: TaoDanhMucRequest): Promise<number> {
    const response = await apiClient.post('/admin/danh-muc/create', request);
    return response.data.maDanhMuc;
  },

  async capNhatDanhMuc(id: number, request: CapNhatDanhMucRequest): Promise<void> {
    await apiClient.put(`/admin/danh-muc/${id}/update`, request);
  },

  async xoaDanhMuc(id: number): Promise<void> {
    await apiClient.delete(`/admin/danh-muc/${id}/delete`);
  },

  async timKiemDanhMuc(keyword?: string): Promise<DanhMucResponse[]> {
    const response = await apiClient.get('/admin/danh-muc/tim-kiem', {
      params: { keyword },
    });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ THANH TOÁN
  // ================================================================

  async getAllThanhToan(params: {
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
  }): Promise<ThanhToanResponse[]> {
    const response = await apiClient.get('/admin/thanh-toan/get-all', { params });
    return response.data;
  },

  async getThanhToanById(id: number): Promise<ThanhToanResponse> {
    const response = await apiClient.get(`/admin/thanh-toan/${id}`);
    return response.data;
  },

  async xacNhanThanhToan(id: number): Promise<void> {
    await apiClient.put(`/admin/thanh-toan/${id}/update/xac-nhan`);
  },

  async timKiemThanhToan(params: {
    keyword?: string;
    phuongThuc?: string;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    tuSoTien?: number;
    denSoTien?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<ThanhToanResponse[]> {
    const response = await apiClient.get('/admin/thanh-toan/tim-kiem', { params });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ HÓA ĐƠN
  // ================================================================

  async getAllHoaDon(params: {
    tuNgay?: string;
    denNgay?: string;
  }): Promise<HoaDonResponse[]> {
    const response = await apiClient.get('/admin/hoa-don/get-all', { params });
    return response.data;
  },

  async getHoaDonById(id: number): Promise<HoaDonChiTietResponse> {
    const response = await apiClient.get(`/admin/hoa-don/${id}`);
    return response.data;
  },

  async taoHoaDonTuDonHang(maDonHang: number): Promise<number> {
    const response = await apiClient.post(`/admin/hoa-don/create/tu-don-hang/${maDonHang}`);
    return response.data.maHoaDon;
  },

  async huyHoaDon(id: number, request: HuyHoaDonRequest): Promise<void> {
    await apiClient.put(`/admin/hoa-don/${id}/update/huy`, request);
  },

  async timKiemHoaDon(params: {
    keyword?: string;
    trangThai?: string;
    tuNgay?: string;
    denNgay?: string;
    tuSoTien?: number;
    denSoTien?: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<HoaDonResponse[]> {
    const response = await apiClient.get('/admin/hoa-don/tim-kiem', { params });
    return response.data;
  },

  // ================================================================
  // QUẢN LÝ NỘI DUNG
  // ================================================================

  async getAllNoiDung(loai?: string): Promise<NoiDungResponse[]> {
    const response = await apiClient.get('/admin/noi-dung/get-all', {
      params: { loai },
    });
    return response.data;
  },

  async taoNoiDung(request: TaoNoiDungRequest): Promise<number> {
    const response = await apiClient.post('/admin/noi-dung/create', request);
    return response.data.maNoiDung;
  },

  async capNhatNoiDung(id: number, request: CapNhatNoiDungRequest): Promise<void> {
    await apiClient.put(`/admin/noi-dung/${id}/update`, request);
  },

  async xoaNoiDung(id: number): Promise<void> {
    await apiClient.delete(`/admin/noi-dung/${id}/delete`);
  },

  // ================================================================
  // BÁO CÁO & THỐNG KÊ NÂNG CAO
  // ================================================================

  async getDoanhThuTheoThang(nam: number = 2026): Promise<DoanhThuTheoThangResponse[]> {
    const response = await apiClient.get('/admin/bao-cao/doanh-thu-theo-thang', {
      params: { nam },
    });
    return response.data;
  },

  async getDoanhThuTheoHoaSi(params: {
    tuNgay?: string;
    denNgay?: string;
  }): Promise<DoanhThuTheoHoaSiResponse[]> {
    const response = await apiClient.get('/admin/bao-cao/doanh-thu-theo-hoa-si', { params });
    return response.data;
  },

  async getTacPhamBanChay(top: number = 10): Promise<TacPhamBanChayResponse[]> {
    const response = await apiClient.get('/admin/bao-cao/tac-pham-ban-chay', {
      params: { top },
    });
    return response.data;
  },

  async getKhachHangTiemNang(top: number = 10): Promise<KhachHangTiemNangResponse[]> {
    const response = await apiClient.get('/admin/bao-cao/khach-hang-tiem-nang', {
      params: { top },
    });
    return response.data;
  },

  async getThongKeTrangThaiDonHang(): Promise<ThongKeTrangThaiDonHangResponse> {
    const response = await apiClient.get('/admin/bao-cao/thong-ke-trang-thai-don-hang');
    return response.data;
  },

  // ================================================================
  // TÌM KIẾM & XUẤT BÁO CÁO
  // ================================================================

  async timKiemTongHop(keyword: string): Promise<TimKiemTongHopResponse> {
    const response = await apiClient.get('/admin/tim-kiem', {
      params: { keyword },
    });
    return response.data;
  },

  async xuatBaoCaoDoanhThu(
    tuNgay: Date,
    denNgay: Date,
    format: 'excel' | 'pdf' | 'csv' = 'excel'
  ): Promise<Blob> {
    const response = await apiClient.get('/admin/xuat-bao-cao/doanh-thu', {
      params: {
        tuNgay: tuNgay.toISOString(),
        denNgay: denNgay.toISOString(),
        format,
      },
      responseType: 'blob',
    });
    return response.data;
  },

  async xuatBaoCaoDonHang(
    tuNgay: Date,
    denNgay: Date,
    format: 'excel' | 'pdf' | 'csv' = 'excel'
  ): Promise<Blob> {
    const response = await apiClient.get('/admin/xuat-bao-cao/don-hang', {
      params: {
        tuNgay: tuNgay.toISOString(),
        denNgay: denNgay.toISOString(),
        format,
      },
      responseType: 'blob',
    });
    return response.data;
  },

  // ================================================================
  // ALIAS METHODS - Để tương thích với code cũ
  // ================================================================

  // Đơn hàng
  async getOrders(): Promise<DonHangAdminResponse[]> {
    return this.getAllDonHang();
  },

  async updateOrderStatus(orderId: number, newStatus: number, ghiChu?: string): Promise<void> {
    return this.capNhatTrangThaiDonHang(orderId, { trangThai: newStatus, ghiChu });
  },

  // Tác phẩm
  async getArtworks(): Promise<TacPhamHoaSiResponse[]> {
    return this.getAllTacPham();
  },

  async approveArtwork(id: number, approve: boolean): Promise<void> {
    return this.duyetTacPham(id, { pheDuyet: approve });
  },

  // Danh mục
  async getCategories(): Promise<DanhMucResponse[]> {
    return this.getAllDanhMuc();
  },

  async createCategory(request: TaoDanhMucRequest): Promise<number> {
    return this.taoDanhMuc(request);
  },

  async updateCategory(id: number, request: CapNhatDanhMucRequest): Promise<void> {
    return this.capNhatDanhMuc(id, request);
  },

  async deleteCategory(id: number): Promise<void> {
    return this.xoaDanhMuc(id);
  },

  // Bài viết
  async getArticles(): Promise<BaiVietResponse[]> {
    return this.getAllBaiViet();
  },

  async approveArticle(id: number, approve: boolean): Promise<void> {
    return this.duyetBaiViet(id, { pheDuyet: approve });
  },

  async deleteArticle(id: number): Promise<void> {
    return this.xoaBaiViet(id);
  },

  // Khách hàng
  async getCustomers(): Promise<ThongTinKhachHangResponse[]> {
    return this.getAllKhachHang();
  },

  async getCustomerById(id: number): Promise<ThongTinKhachHangResponse> {
    return this.getKhachHangById(id);
  },

  async blockCustomer(id: number): Promise<void> {
    return this.khoaKhachHang(id);
  },

  async unblockCustomer(id: number): Promise<void> {
    return this.moKhoaKhachHang(id);
  },

  // Họa sĩ
  async getAuthors(): Promise<HoSoHoaSiResponse[]> {
    return this.getAllHoaSi();
  },

  async getAuthorById(id: number): Promise<HoSoHoaSiResponse> {
    return this.getHoaSiById(id);
  },

  async blockAuthor(id: number): Promise<void> {
    return this.khoaHoaSi(id);
  },

  async unblockAuthor(id: number): Promise<void> {
    return this.moKhoaHoaSi(id);
  },
};
