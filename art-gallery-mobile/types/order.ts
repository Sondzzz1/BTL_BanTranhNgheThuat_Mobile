// Order Types

export interface CreateOrderRequest {
  tenNguoiNhan?: string;
  soDienThoai?: string;
  diaChiGiao?: string;
}

export interface OrderItem {
  maChiTietDH: number;
  maTacPham: number;
  tenTacPham?: string;
  hinhAnh?: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

export interface Order {
  maDonHang: number;
  maNguoiDung: number;
  tenNguoiDung?: string;
  ngayDat: string;
  tongTien: number;
  tenNguoiNhan?: string;
  soDienThoai?: string;
  diaChiGiao?: string;
  trangThai: number;
  lyDoHuy?: string;
  chiTiet: OrderItem[];
}

export interface CancelOrderRequest {
  lyDo?: string;
}

// Order Status
export const ORDER_STATUS = {
  PENDING: 0,        // Chờ xác nhận
  CONFIRMED: 1,      // Đã xác nhận
  SHIPPING: 2,       // Đang giao
  COMPLETED: 3,      // Hoàn thành
  CANCELLED: 4,      // Đã hủy
} as const;

export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: 'Chờ xác nhận',
  1: 'Đã xác nhận',
  2: 'Đang giao hàng',
  3: 'Hoàn thành',
  4: 'Đã hủy',
};
