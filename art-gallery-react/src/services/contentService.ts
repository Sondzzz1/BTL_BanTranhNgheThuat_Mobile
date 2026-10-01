import apiClient from './api';

const absoluteContentUrl = (value:string) => {
  if (/^(https?:|data:)/i.test(value)) return value;
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5273/api';
  return `${base.replace(/\/api\/?$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
};

// ======================================================
// KIỂU DỮ LIỆU
// ======================================================

// TrangThai: 0 = Chờ duyệt, 2 = Đã duyệt, 3 = Từ chối
export interface BaiVietResponse {
  maBaiViet: number;
  tieuDe: string;
  noiDung?: string;
  anhTieuDe?: string;
  maHoaSi?: number;
  maTaiKhoanTacGia?: number;
  tenHoaSi: string;
  tenTacGia: string;
  tomTat?: string;
  maDanhMucBaiViet?: number;
  tenDanhMuc?: string;
  ngayDang: string;
  trangThai: number;
  lyDo?: string;
  ngayXuatBan?: string;
  ngayCapNhat?: string;
  ngayBatDauSuKien?: string;
  ngayKetThucSuKien?: string;
  diaDiemSuKien?: string;
  nguonNoiDung?: string;
  hinhAnhNoiDung?: Array<{ maHinhAnh:number;duongDan:string;chuThich?:string;thuTu:number }>;
  tacPhamLienQuan?: Array<{ maTacPham:number;tenTacPham:string;hinhAnh?:string;gia:number;tenHoaSi:string }>;
}

export interface DanhMucBaiVietResponse { maDanhMucBaiViet:number;tenDanhMuc:string;slug:string;trangThai?:boolean; }
export interface BaiVietPayload { tieuDe:string;noiDung?:string;anhTieuDe?:string;tomTat?:string;maDanhMucBaiViet?:number;ngayBatDauSuKien?:string|null;ngayKetThucSuKien?:string|null;diaDiemSuKien?:string;nguonNoiDung?:string;maTacPhamLienQuan:number[]; }

export interface ChiTietTacPhamCongKhaiResponse {
  maChiTiet:number;maTacPham:number;tenTacPham:string;tenHoaSi:string;avatarHoaSi?:string;
  cauChuyenSangTac?:string;yNghiaNghiThuat?:string;kyThuatThucHien?:string;
  camHungSangTao?:string;thongTinBosung?:string;kichThuoc?:string;chatLieu?:string;
  chatLieuKhung?:string;namSangTac?:number;diaDiemSangTac?:string;
  hinhAnh1?:string;hinhAnh2?:string;hinhAnh3?:string;hinhAnh4?:string;
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
    const response = await apiClient.get('/bai-viet', { params: { pageSize: 50 } });
    return response.data.items;
  },

  // Admin - lấy tất cả bài viết (Hỗ trợ filter trangThai qua query params)
  async layTatCaBaiVietAdmin(trangThai?: number): Promise<BaiVietResponse[]> {
    const response = await apiClient.get('/admin/bai-viet/get-all', {
      params: { trangThai }
    });
    return response.data;
  },
  async layBaiVietAdmin(id:number):Promise<BaiVietResponse>{const data:BaiVietResponse=(await apiClient.get(`/admin/bai-viet/${id}`)).data;data.hinhAnhNoiDung=data.hinhAnhNoiDung?.map(x=>({...x,duongDan:absoluteContentUrl(x.duongDan)}));return data;},

  // Xóa bài viết (Admin/Artist)
  async xoaBaiViet(id: number): Promise<void> {
    await apiClient.delete(`/admin/bai-viet/${id}/delete`);
  },

  // Duyệt bài viết (Admin) - Gửi body { pheDuyet: true }
  async pheDuyetBaiViet(id: number): Promise<void> {
    await apiClient.put(`/admin/bai-viet/${id}/update/duyet`, {
      pheDuyet: true,
      lyDo: null
    });
  },

  // Từ chối bài viết (Admin) - Gửi body { pheDuyet: false, lyDo: "..." }
  async tuChoiBaiViet(id: number, lyDo: string): Promise<void> {
    await apiClient.put(`/admin/bai-viet/${id}/update/duyet`, {
      pheDuyet: false,
      lyDo: lyDo
    });
  },

  async layDanhMucBaiViet(): Promise<DanhMucBaiVietResponse[]> { return (await apiClient.get('/bai-viet/danh-muc')).data; },
  async layDanhMucBaiVietAdmin(): Promise<DanhMucBaiVietResponse[]> { return (await apiClient.get('/admin/bai-viet/danh-muc')).data; },
  async taoDanhMucBaiViet(data:{tenDanhMuc:string;slug:string;trangThai:boolean}):Promise<void>{await apiClient.post('/admin/bai-viet/danh-muc',data);},
  async capNhatDanhMucBaiViet(id:number,data:{tenDanhMuc:string;slug:string;trangThai:boolean}):Promise<void>{await apiClient.put(`/admin/bai-viet/danh-muc/${id}`,data);},
  async taoBaiVietAdmin(data:BaiVietPayload):Promise<void>{await apiClient.post('/admin/bai-viet/create',data);},
  async capNhatBaiVietAdmin(id:number,data:BaiVietPayload):Promise<void>{await apiClient.put(`/admin/bai-viet/${id}/update`,data);},
  async taiAnhNoiDungBaiViet(id:number,file:File,chuThich=''):Promise<{maHinhAnh:number;duongDan:string;chuThich?:string;thuTu:number}>{const body=new FormData();body.append('file',file);body.append('chuThich',chuThich);return (await apiClient.post(`/bai-viet/${id}/hinh-anh`,body,{headers:{'Content-Type':'multipart/form-data'}})).data;},
  async xuatBanBaiViet(id:number):Promise<void>{await apiClient.put(`/admin/bai-viet/${id}/xuat-ban`);},

  // ======================================================
  // CHI TIẾT TÁC PHẨM (ARTWORK DETAILS)
  // ======================================================

  async layChiTietTacPhamCongKhai(maTacPham: number): Promise<ChiTietTacPhamCongKhaiResponse | null> {
    try {
      const response = await apiClient.get(`/public/tac-pham/${maTacPham}/chi-tiet`);
      return response.data;
    } catch (error:any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }
};
