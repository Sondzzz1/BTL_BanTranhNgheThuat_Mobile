import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { AddReviewRequest, ProductReviewSummary, Review, ReviewPermission } from '../types/review';

const getMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export const reviewService = {
  async getAllFiveStarReviews(): Promise<Review[]> {
    try {
      return (await apiClient.get<Review[]>(API_ENDPOINTS.REVIEW_FIVE_STARS)).data;
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể tải đánh giá nổi bật'));
    }
  },

  async getProductReviews(maTacPham: number): Promise<Review[]> {
    try {
      return (await apiClient.get<Review[]>(API_ENDPOINTS.REVIEW_BY_PRODUCT(maTacPham))).data;
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
      return (await apiClient.get<ReviewPermission>(API_ENDPOINTS.REVIEW_PERMISSION(maTacPham))).data;
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể kiểm tra quyền đánh giá'));
    }
  },

  async addReview(request: AddReviewRequest): Promise<Review> {
    try {
      return (await apiClient.post<Review>(API_ENDPOINTS.REVIEWS, request)).data;
    } catch (error: any) {
      throw new Error(getMessage(error, 'Không thể gửi đánh giá'));
    }
  },

  async updateReview(id: number, request: Omit<AddReviewRequest, 'maTacPham'>): Promise<Review> {
    try {
      return (await apiClient.put<Review>(API_ENDPOINTS.REVIEW_UPDATE(id), request)).data;
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
};

export default reviewService;
