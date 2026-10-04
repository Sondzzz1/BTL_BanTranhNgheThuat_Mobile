import apiClient from './api';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { AddReviewRequest, ProductReviewSummary, Review, ReviewPermission } from '../types/review';
import { NormalizedUploadImage } from '../utils/imageUpload';

const getMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const imageUrl = (value?: string): string | undefined => {
  if (!value || /^https?:\/\//i.test(value) || /^data:image\//i.test(value)) return value;
  const origin = API_BASE_URL.replace(/\/api\/?$/i, '');
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
};

const normalizeReview = (review: Review): Review => ({
  ...review,
  hinhAnhTacPham: imageUrl(review.hinhAnhTacPham),
  hinhAnhDanhGia: imageUrl(review.hinhAnhDanhGia),
});

const normalizePermission = (permission: ReviewPermission): ReviewPermission => ({
  ...permission,
  existingReview: permission.existingReview ? normalizeReview(permission.existingReview) : undefined,
});

const appendReviewFields = (form: FormData, request: AddReviewRequest) => {
  form.append('maTacPham', String(request.maTacPham));
  form.append('danhGia', String(request.danhGia));
  if (request.binhLuan?.trim()) form.append('binhLuan', request.binhLuan.trim());
};

export const reviewService = {
  async getAllFiveStarReviews(): Promise<Review[]> {
    try {
      return (await apiClient.get<Review[]>(API_ENDPOINTS.REVIEW_FIVE_STARS)).data.map(normalizeReview);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể tải đánh giá nổi bật'));
    }
  },

  async getProductReviews(maTacPham: number): Promise<Review[]> {
    try {
      return (await apiClient.get<Review[]>(API_ENDPOINTS.REVIEW_BY_PRODUCT(maTacPham))).data.map(normalizeReview);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể tải đánh giá'));
    }
  },

  async getProductReviewSummary(maTacPham: number): Promise<ProductReviewSummary> {
    try {
      return (await apiClient.get<ProductReviewSummary>(API_ENDPOINTS.REVIEW_SUMMARY(maTacPham))).data;
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể tải tổng hợp đánh giá'));
    }
  },

  async getMyPermission(maTacPham: number): Promise<ReviewPermission> {
    try {
      return normalizePermission((await apiClient.get<ReviewPermission>(API_ENDPOINTS.REVIEW_PERMISSION(maTacPham))).data);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể kiểm tra quyền đánh giá'));
    }
  },

  async addReview(request: AddReviewRequest): Promise<Review> {
    try {
      return normalizeReview((await apiClient.post<Review>(API_ENDPOINTS.REVIEWS, request)).data);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể gửi đánh giá'));
    }
  },

  async updateReview(id: number, request: Omit<AddReviewRequest, 'maTacPham'>): Promise<Review> {
    try {
      return normalizeReview((await apiClient.put<Review>(API_ENDPOINTS.REVIEW_UPDATE(id), request)).data);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể cập nhật đánh giá'));
    }
  },

  async deleteReview(id: number): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.REVIEW_DELETE(id));
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể xóa đánh giá'));
    }
  },

  async addReviewWithImage(request: AddReviewRequest, image: NormalizedUploadImage): Promise<Review> {
    try {
      const form = new FormData();
      appendReviewFields(form, request);
      form.append('hinhAnhDanhGiaFile', image as any);
      return normalizeReview((await apiClient.post<Review>(API_ENDPOINTS.REVIEWS_WITH_IMAGE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể tải ảnh đánh giá lên'));
    }
  },

  async updateReviewWithImage(
    id: number,
    request: Omit<AddReviewRequest, 'maTacPham'>,
    image?: NormalizedUploadImage,
    removeImage = false
  ): Promise<Review> {
    try {
      const form = new FormData();
      form.append('danhGia', String(request.danhGia));
      if (request.binhLuan?.trim()) form.append('binhLuan', request.binhLuan.trim());
      form.append('xoaHinhAnh', String(removeImage));
      if (image) form.append('hinhAnhDanhGiaFile', image as any);
      return normalizeReview((await apiClient.put<Review>(API_ENDPOINTS.REVIEW_UPDATE_WITH_IMAGE(id), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data);
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể cập nhật ảnh đánh giá'));
    }
  },
};

export default reviewService;
