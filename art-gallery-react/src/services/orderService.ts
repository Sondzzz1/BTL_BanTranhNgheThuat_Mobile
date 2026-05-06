// Order Service - API calls cho Đơn hàng
import apiClient from './api';
import { Order, CartItem } from '../types';

// Interface khớp với TaoDonHangRequest từ KhachHangController backend
interface TaoDonHangRequest {
  tenNguoiNhan: string;
  soDienThoai: string;
  diaChiGiao: string;
  phuongThucThanhToan?: string; // COD, BankTransfer, Momo, VNPay
}

// Interface khớp với DonHangResponse từ backend
interface DonHangResponseDTO {
  maDonHang: number;
  ngayDat: string;
  tongTien: number;
  tenNguoiNhan: string;
  soDienThoai: string;
  diaChiGiao: string;
  trangThai: number;
  trangThaiText: string;
  trangThaiThanhToan?: string;
  chiTiet: {
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    hinhAnh?: string;
  }[];
}

// Map trạng thái
const mapTrangThai = (status: number): 'pending' | 'shipped' | 'success' | 'canceled' => {
  switch (status) {
    case 0: return 'pending';
    case 1: return 'shipped';
    case 2: return 'success';
    case 3: return 'canceled';
    default: return 'pending';
  }
};

const mapDtoToOrder = (dto: DonHangResponseDTO): Order => ({
  id: dto.maDonHang.toString(),
  maHD: `DH${dto.maDonHang.toString().padStart(6, '0')}`,
  tenKH: dto.tenNguoiNhan || 'Khách hàng',
  email: '',
  phone: dto.soDienThoai || '',
  address: dto.diaChiGiao || '',
  ngayLap: dto.ngayDat,
  trangThai: mapTrangThai(dto.trangThai),
  tongTien: dto.tongTien,
  items: (dto.chiTiet || []).map(ct => ({
    id: ct.maTacPham.toString(),
    name: ct.tenTacPham || '',
    price: ct.donGia,
    image: ct.hinhAnh || '',
    quantity: ct.soLuong,
  })),
});

export const orderService = {
  // Tạo đơn hàng mới (Khách hàng - dùng JWT, giỏ hàng trên server)
  async createOrder(
    userId: number,
    customerInfo: {
      name: string;
      phone: string;
      address: string;
    },
    cartItems: CartItem[],
    paymentMethod: string = 'COD'
  ): Promise<string> {
    try {
      const orderData: TaoDonHangRequest = {
        tenNguoiNhan: customerInfo.name,
        soDienThoai: customerInfo.phone,
        diaChiGiao: customerInfo.address,
        phuongThucThanhToan: paymentMethod,
      };

      const response = await apiClient.post('/don-hang/tao', orderData);
      return response.data.message;
    } catch (error: any) {
      console.error('Error creating order:', error);
      const serverError = error.response?.data;
      const errorMessage = serverError?.error || serverError?.message || 'Lỗi khi tạo đơn hàng';
      throw new Error(errorMessage);
    }
  },

  // Lấy đơn hàng của tôi (Khách hàng - dùng JWT)
  async getMyOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<DonHangResponseDTO[]>('/don-hang/cua-toi');
      return response.data.map(mapDtoToOrder);
    } catch (error) {
      console.error('Error fetching my orders:', error);
      throw error;
    }
  },

  // Lấy đơn hàng theo ID
  async getOrderById(id: number): Promise<Order> {
    try {
      const response = await apiClient.get<DonHangResponseDTO>(`/don-hang/${id}`);
      return mapDtoToOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Hủy đơn hàng (Khách hàng)
  async cancelOrder(id: number, lyDo: string): Promise<string> {
    try {
      const response = await apiClient.put(`/don-hang/${id}/huy`, { lyDo });
      return response.data.message;
    } catch (error: any) {
      console.error('Error canceling order:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    }
  },

  // === Alias cho code cũ ===
  async getAllOrders(): Promise<Order[]> {
    return this.getMyOrders();
  },

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return this.getMyOrders();
  },
};
