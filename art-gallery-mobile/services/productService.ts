// Product Service
import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { Product, Category } from '../types/product';

export const productService = {
  // Lấy tất cả sản phẩm
  async getAllProducts(keyword?: string): Promise<Product[]> {
    try {
      const params = keyword ? { keyword } : {};
      const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getLatestProducts(limit: number = 6): Promise<Product[]> {
    const products = await this.getAllProducts();
    return [...products]
      .sort((a, b) => b.maTacPham - a.maTacPham)
      .slice(0, Math.max(1, limit));
  },

  async getBestSellingProducts(limit: number = 6): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS_BEST_SELLING, {
        params: { top: Math.max(1, limit) },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching best-selling products:', error);
      throw error;
    }
  },

  // Lấy chi tiết sản phẩm
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(API_ENDPOINTS.PRODUCT_DETAIL(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching product detail:', error);
      throw error;
    }
  },

  // Lấy sản phẩm gợi ý
  async getProductSuggestions(id: number): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCT_SUGGESTIONS(id));
      return response.data;
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      throw error;
    }
  },

  // Tìm kiếm sản phẩm
  async searchProducts(keyword: string): Promise<Product[]> {
    return this.getAllProducts(keyword);
  },

  // Lấy tất cả danh mục
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};
