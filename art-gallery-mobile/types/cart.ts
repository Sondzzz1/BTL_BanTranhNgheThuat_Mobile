// Cart Types

export interface CartItem {
  maChiTietGH: number;
  maGioHang: number;
  maTacPham: number;
  tenTacPham?: string;
  gia: number;
  hinhAnh?: string;
  soLuong: number;
  soLuongTon: number;
  thanhTien: number;
}

export interface Cart {
  maGioHang: number;
  maNguoiDung: number;
  chiTiet: CartItem[];
}

export interface AddToCartRequest {
  maTacPham: number;
  soLuong: number;
}

export interface UpdateCartRequest {
  soLuong: number;
}
