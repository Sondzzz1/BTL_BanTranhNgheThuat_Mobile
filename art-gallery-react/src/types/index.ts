// Types và Interfaces cho dự án Art Gallery

export interface Artwork {
  id: string;
  tenTranh: string;
  giaBan: number;
  danhMuc: 'Tranh sơn dầu' | 'Tranh sơn mài' | 'Tranh cổ điển';
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
  dbId?: number; // ID trong database (maChiTietGH)
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
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  specialization?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  maHD: string;
  tenKH: string;
  email: string;
  phone: string;
  address: string;
  ngayLap: string;
  trangThai: 'pending' | 'confirmed' | 'shipping' | 'success' | 'canceled' | 'cancel_pending';
  tongTien: number;
  items: CartItem[];
  ghiChu?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>;
  isAuthenticated: boolean;
}
