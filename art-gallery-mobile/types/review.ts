// Review/Rating Types (for future backend integration)

export interface Review {
  maDanhGia: number;
  maTacPham: number;
  maNguoiDung: number;
  tenNguoiDung: string;
  danhGia: number; // 1-5 stars
  binhLuan?: string;
  ngayDanhGia: string;
}

export interface AddReviewRequest {
  maTacPham: number;
  danhGia: number; // 1-5
  binhLuan?: string;
}

export interface ProductReviewSummary {
  maTacPham: number;
  diemTrungBinh: number; // Average rating
  tongSoDanhGia: number; // Total reviews
  phanTramTheoSao: {
    [key: number]: number; // 5: 60%, 4: 20%, etc.
  };
}
