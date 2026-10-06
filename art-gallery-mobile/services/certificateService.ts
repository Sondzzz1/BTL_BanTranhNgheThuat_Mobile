import apiClient from './api';
import { API_BASE_URL } from '../constants/api';

export interface Certificate {
  maChungNhan: number;
  maChungNhanCongKhai: string;
  maTacPham: number;
  tenTacPham: string;
  tacGia: string;
  tenHoaSi: string;
  chuSoHuu: string;
  ngayCap: string;
  trangThai: string;
  loaiTacPhamText: string;
  tacGiaGoc?: string;
  luuYPhapLy: string;
}

/**
 * Trạng thái chỉ đọc của một tranh độc bản đã giao nhưng hệ thống chưa thể
 * phát hành chứng nhận. API không tạo quyền sở hữu hoặc chứng nhận ở đây.
 */
export interface PendingCertificateStatus {
  maDonHang: number;
  maChiTietDonHang: number;
  maTacPham: number;
  tenTacPham: string;
  hinhAnh?: string;
  ngayGiao?: string;
  soLuongTrongDon: number;
  soLuongBanDau?: number;
  daThanhToanHopLe: boolean;
  daGiaoThanhCong: boolean;
  dangCoYeuCauHoanTra: boolean;
  trangThaiBanQuyen: string;
  trangThaiChungNhan: string;
  thongDiep: string;
  daDuDieuKienCap: boolean;
}

export interface PublicCertificateVerification {
  timThay: boolean;
  toanVen: boolean;
  maChungNhan: string;
  trangThai: string;
  tenTacPham?: string;
  loaiTacPham?: number;
  loaiTacPhamText?: string;
  tacGiaGoc?: string;
  hoaSiThucHien?: string;
  chuSoHuuHienThi?: string;
  ngayCap?: string;
  luuYPhapLy: string;
}

export interface PublicCopyright {
  daKhaiBao: boolean;
  trangThai: string;
  tacGia?: string;
  ngaySangTac?: string;
  nguonGoc?: string;
  moTaBanQuyen?: string;
  loaiTacPhamText?: string;
  tacGiaGoc?: string;
  hoaSiThucHien?: string;
  moTaNguonGoc?: string;
  canCuSuDung?: string;
  laTacPhamDocBan: boolean;
  soLuongBanDau?: number;
  luuYPhapLy: string;
}

export const certificateService = {
  async getMine(): Promise<Certificate[]> {
    const response = await apiClient.get<Certificate[]>('/chung-nhan/cua-toi');
    return response.data;
  },
  async getPendingMine(): Promise<PendingCertificateStatus[]> {
    const response = await apiClient.get<PendingCertificateStatus[]>('/chung-nhan/tinh-trang-cua-toi');
    return response.data;
  },
  async verifyPublic(code: string): Promise<PublicCertificateVerification> {
    const response = await apiClient.get<PublicCertificateVerification>(
      `/chung-nhan/xac-minh/${encodeURIComponent(code)}`,
    );
    return response.data;
  },
  getPublicPdfUrl(code: string): string {
    return `${API_BASE_URL}/chung-nhan/xac-minh/${encodeURIComponent(code)}/pdf`;
  },
  async getPublicCopyright(artworkId: number): Promise<PublicCopyright> {
    const response = await apiClient.get<PublicCopyright>(`/ban-quyen/cong-khai/tac-pham/${artworkId}`);
    return response.data;
  },
};
