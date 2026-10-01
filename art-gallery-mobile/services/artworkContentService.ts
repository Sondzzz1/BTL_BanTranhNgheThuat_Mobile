import apiClient from './api';
import { API_BASE_URL } from '../constants/api';

export interface ArtworkContent {
  maChiTiet: number;
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  cauChuyenSangTac?: string;
  yNghiaNghiThuat?: string;
  kyThuatThucHien?: string;
  camHungSangTao?: string;
  thongTinBosung?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
  namSangTac?: number;
  diaDiemSangTac?: string;
  hinhAnh1?: string;
  hinhAnh2?: string;
  hinhAnh3?: string;
  hinhAnh4?: string;
}

export const resolveContentImageUrl = (value?: string) => {
  if (!value) return undefined;
  if (/^(https?:|data:|file:)/i.test(value)) return value;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
};

export const artworkContentService = {
  async getPublic(id: number): Promise<ArtworkContent | null> {
    try {
      const response = await apiClient.get<ArtworkContent>(`/public/tac-pham/${id}/chi-tiet`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },
};
