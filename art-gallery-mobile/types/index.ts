// Types & Interfaces cho dự án Art Gallery Mobile (Đồng bộ với Web)

export interface Artwork {
  id: string;
  tenTranh: string;
  giaBan: number;
  danhMuc?: string;
  tacGia: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
  soLuongTon: number;
  anhTranh: string;
  moTa?: string;
  isFeatured?: boolean;
  isBestSelling?: boolean;
}

export interface CartItem {
  id: string;
  dbId?: number; // maChiTietGH trong Database
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface User {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user' | 'author';
}

export interface Order {
  id: string;
  maHD: string;
  tenKH: string;
  email?: string;
  phone: string;
  address: string;
  ngayLap: string;
  trangThai: 'pending' | 'confirmed' | 'shipping' | 'success' | 'canceled' | 'cancel_pending';
  tongTien: number;
  items: CartItem[];
  ghiChu?: string;
}

export interface FavoriteItem {
  maYeuThich: number;
  ngayThem: string;
  ghiChu?: string;
  tacPham: {
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi: string;
    tenDanhMuc?: string;
    gia: number;
    soLuong: number;
    hinhAnh?: string;
    trangThai: number;
  };
}

export interface Category {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
}

export interface Product {
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  tenDanhMuc?: string;
  gia: number;
  soLuong: number;
  moTa?: string;
  hinhAnh?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
}
