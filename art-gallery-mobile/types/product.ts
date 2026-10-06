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
  // Tương thích với backend cũ trong lúc thiết bị mobile chưa nhận bản API mới.
  // Màn chi tiết sẽ chuẩn hóa các trường này về nguonGocSangTao trước khi hiển thị.
  loaiTacPham?: number;
  tacGiaGoc?: string;
  maTacPhamGoc?: number;
  tenTacPhamGoc?: string;
  khongXacDinhTacGiaGoc?: boolean;
  nguonThamKhao?: string;
  moTaNguonGoc?: string;
  nguonGocSangTao?: {
    loai: 'ORIGINAL' | 'DERIVATIVE' | 'REFERENCE';
    tenLoai: string;
    tacPhamGoc?: {
      maTacPham: number;
      tenTacPham: string;
      tenHoaSi: string;
      hinhAnh?: string;
      coTheXemCongKhai: boolean;
    };
    tenTacPhamGocNgoaiHeThong?: string;
    tacGiaGoc?: string;
    khongXacDinhTacGiaGoc: boolean;
    nguonThamKhao?: string;
    moTaNguonGoc?: string;
  };
}

export interface Category {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
}
