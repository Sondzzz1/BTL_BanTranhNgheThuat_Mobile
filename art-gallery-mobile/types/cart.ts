// Cart Types - Khớp với GioHangResponse và ChiTietGioHangResponse từ Backend ASP.NET Core

export interface CartItem {
  maChiTietGH: number;
  maGioHang?: number;
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi?: string;
  gia: number;
  soLuong: number;
  thanhTien: number;
  hinhAnh?: string;
  soLuongTon?: number;
}

export interface Cart {
  maGioHang: number;
  maNguoiDung?: number;
  danhSachSanPham: CartItem[];
  tongTien: number;
}

export interface AddToCartRequest {
  maTacPham: number;
  soLuong: number;
}

export interface UpdateCartRequest {
  soLuong: number;
}

