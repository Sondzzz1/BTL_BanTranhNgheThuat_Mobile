import apiClient from './api';

export interface ChiTietHoaDon {
  maChiTietHD: number;
  maTacPham: number;
  tenTacPham: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

export interface HoaDon {
  maHoaDon: number;
  maDonHang: number;
  ngayXuatHD: string;
  tongTienHang: number;
  tenNguoiMua?: string;
  diaChiNguoiMua?: string;
  soDienThoaiNguoiMua?: string;
  email?: string;
  phuongThucThanhToan?: string;
  trangThaiThanhToan?: string;
  trangThai: string;
  chiTiet: ChiTietHoaDon[];
}

export const invoiceService = {
  // Lấy hóa đơn theo mã đơn hàng
  async getByOrderId(orderId: number): Promise<HoaDon | null> {
    try {
      const response = await apiClient.get<HoaDon>(`/hoa-don/don-hang/${orderId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching invoice by order:', error);
      throw error;
    }
  },

  // Lấy hóa đơn theo mã hóa đơn
  async getById(invoiceId: number): Promise<HoaDon> {
    const response = await apiClient.get<HoaDon>(`/hoa-don/${invoiceId}`);
    return response.data;
  },

  // Tải file PDF hóa đơn
  async downloadPdf(invoiceId: number): Promise<void> {
    try {
      const response = await apiClient.get(`/hoa-don/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HoaDon_HD${String(invoiceId).padStart(6, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  },
};
