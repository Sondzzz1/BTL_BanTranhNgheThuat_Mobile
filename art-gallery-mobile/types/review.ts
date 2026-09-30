// Review/Rating Types (for future backend integration)

export interface Review {
  maDanhGia: number;
  maTacPham: number;
  tenTacPham?: string; // Tên sản phẩm được đánh giá
  hinhAnhTacPham?: string; // Hình ảnh sản phẩm
  maNguoiDung: number;
  tenNguoiDung: string;
  danhGia: number; // 1-5 stars
  binhLuan?: string;
  hinhAnhDanhGia?: string; // Hình ảnh khách hàng chèn vào đánh giá
  ngayDanhGia: string;
}

export interface AddReviewRequest {
  maTacPham: number;
  danhGia: number; // 1-5
  binhLuan?: string;
  hinhAnhDanhGia?: string; // Optional image from customer
}

export interface ProductReviewSummary {
  maTacPham: number;
  diemTrungBinh: number; // Average rating
  tongSoDanhGia: number; // Total reviews
  soLuong1Sao: number;
  soLuong2Sao: number;
  soLuong3Sao: number;
  soLuong4Sao: number;
  soLuong5Sao: number;
}

export interface ReviewPermission {
  canReview: boolean;
  reason?: string;
  existingReview?: Review;
}
