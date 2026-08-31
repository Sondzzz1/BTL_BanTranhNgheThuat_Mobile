// Product Types

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

export interface Category {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
}
