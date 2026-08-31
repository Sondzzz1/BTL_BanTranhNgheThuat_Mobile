// Review Service - Placeholder (waiting for backend API)

import { Review, AddReviewRequest, ProductReviewSummary } from '../types/review';

// Mock data for now - will connect to backend later
const mockReviews: { [key: number]: Review[] } = {
  1: [
    {
      maDanhGia: 1,
      maTacPham: 1,
      maNguoiDung: 1,
      tenNguoiDung: 'Nguyễn Văn A',
      danhGia: 5,
      binhLuan: 'Tranh rất đẹp, chất lượng tuyệt vời!',
      ngayDanhGia: '2024-01-15',
    },
    {
      maDanhGia: 2,
      maTacPham: 1,
      maNguoiDung: 2,
      tenNguoiDung: 'Trần Thị B',
      danhGia: 4,
      binhLuan: 'Đẹp nhưng giao hàng hơi lâu',
      ngayDanhGia: '2024-01-10',
    },
  ],
};

export const reviewService = {
  // Lấy danh sách đánh giá của sản phẩm
  getProductReviews: async (maTacPham: number): Promise<Review[]> => {
    // TODO: Connect to backend when API is ready
    // const response = await api.get(`/danhgia/tacpham/${maTacPham}`);
    // return response.data;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockReviews[maTacPham] || []);
      }, 500);
    });
  },

  // Lấy tóm tắt đánh giá
  getProductReviewSummary: async (maTacPham: number): Promise<ProductReviewSummary> => {
    // TODO: Connect to backend when API is ready
    const reviews = mockReviews[maTacPham] || [];
    
    if (reviews.length === 0) {
      return {
        maTacPham,
        diemTrungBinh: 0,
        tongSoDanhGia: 0,
        phanTramTheoSao: {},
      };
    }

    const totalStars = reviews.reduce((sum, r) => sum + r.danhGia, 0);
    const avgRating = totalStars / reviews.length;

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      starCounts[r.danhGia]++;
    });

    const starPercentages: { [key: number]: number } = {};
    Object.entries(starCounts).forEach(([star, count]) => {
      starPercentages[parseInt(star)] = (count / reviews.length) * 100;
    });

    return {
      maTacPham,
      diemTrungBinh: avgRating,
      tongSoDanhGia: reviews.length,
      phanTramTheoSao: starPercentages,
    };
  },

  // Thêm đánh giá mới
  addReview: async (request: AddReviewRequest): Promise<Review> => {
    // TODO: Connect to backend when API is ready
    // const response = await api.post('/danhgia', request);
    // return response.data;

    return new Promise((resolve) => {
      setTimeout(() => {
        const newReview: Review = {
          maDanhGia: Date.now(),
          maTacPham: request.maTacPham,
          maNguoiDung: 1, // Current user
          tenNguoiDung: 'Tôi',
          danhGia: request.danhGia,
          binhLuan: request.binhLuan,
          ngayDanhGia: new Date().toISOString(),
        };

        if (!mockReviews[request.maTacPham]) {
          mockReviews[request.maTacPham] = [];
        }
        mockReviews[request.maTacPham].unshift(newReview);

        resolve(newReview);
      }, 500);
    });
  },
};

export default reviewService;
