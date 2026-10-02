import apiClient from './api';

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
  laTacPhamDocBan: boolean;
  luuYPhapLy: string;
}

export const certificateService = {
  async getMine(): Promise<Certificate[]> {
    const response = await apiClient.get<Certificate[]>('/chung-nhan/cua-toi');
    return response.data;
  },
  async getPublicCopyright(artworkId: number): Promise<PublicCopyright> {
    const response = await apiClient.get<PublicCopyright>(`/ban-quyen/cong-khai/tac-pham/${artworkId}`);
    return response.data;
  },
};
