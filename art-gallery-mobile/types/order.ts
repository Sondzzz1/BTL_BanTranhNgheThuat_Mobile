// Order Types

export interface CreateOrderRequest {
  tenNguoiNhan: string;
  soDienThoai: string;
  diaChiGiao: string;
  phuongThucThanhToan?: string;
  phuongThucTT?: string;
  ghiChu?: string;
  mode?: 'CART' | 'BUY_NOW';
  cartItemIds?: number[];
  maTacPham?: number;
  soLuong?: number;
}

export interface OrderItem {
  maChiTietDH?: number;
  maTacPham: number;
  tenTacPham?: string;
  tenHoaSi?: string;
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
  ngayGiao?: string;
  tongTien: number;
  tenNguoiNhan?: string;
  soDienThoai?: string;
  diaChiGiao?: string;
  trangThai: number;
  /**
   * Phương thức thanh toán do API chi tiết đơn hàng trả về, ví dụ COD hoặc
   * BankTransfer. Trường có thể vắng mặt với dữ liệu/phiên bản API cũ.
   */
  phuongThucThanhToan?: string;
  /** Trạng thái thanh toán do API trả về, ví dụ ChoThanhToan hoặc DaThanhToan. */
  trangThaiThanhToan?: string;
  lyDoHuy?: string;
  /** Tổng số lượng sản phẩm, được API danh sách đơn trả về dạng tóm tắt. */
  soSanPham?: number;
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
  CANCEL_REQUESTED: 4, // Chờ duyệt hủy
  CANCELLED: 5,      // Đã hủy
} as const;

export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: 'Chờ xác nhận',
  1: 'Đã xác nhận',
  2: 'Đang giao hàng',
  3: 'Hoàn thành',
  4: 'Chờ duyệt hủy',
  5: 'Đã hủy',
};
