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
  // Đây là khai báo phát hành từ hồ sơ tác phẩm. Trạng thái xác minh được
  // hiển thị riêng ở màn hình chi tiết qua hồ sơ bản quyền công khai.
  laTacPhamDocBan?: boolean;
  soLuongBanDau?: number;
}

export interface Category {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
}
