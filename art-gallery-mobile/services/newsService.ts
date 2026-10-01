import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface BlogImage { maHinhAnh:number; duongDan:string; chuThich?:string; thuTu:number; }
export interface LinkedArtwork { maTacPham:number; tenTacPham:string; hinhAnh?:string; gia:number; tenHoaSi:string; }
export interface Article {
  maBaiViet:number;tieuDe:string;tomTat?:string;noiDung?:string;anhTieuDe?:string;
  ngayDang:string;ngayXuatBan?:string;ngayCapNhat?:string;tenTacGia:string;tenHoaSi:string;
  maDanhMucBaiViet?:number;tenDanhMuc?:string;trangThai:number;
  ngayBatDauSuKien?:string;ngayKetThucSuKien?:string;diaDiemSuKien?:string;nguonNoiDung?:string;
  hinhAnhNoiDung:BlogImage[];tacPhamLienQuan:LinkedArtwork[];
}
export interface BlogCategory { maDanhMucBaiViet:number;tenDanhMuc:string;slug:string; }
export interface PagedArticles { items:Article[];total:number;page:number;pageSize:number; }

export const newsService={
  async getArticles(params:{keyword?:string;maDanhMuc?:number;page?:number;pageSize?:number}={}):Promise<PagedArticles>{
    return (await apiClient.get<PagedArticles>(API_ENDPOINTS.NEWS,{params})).data;
  },
  async getAllArticles():Promise<Article[]>{return (await this.getArticles({pageSize:50})).items;},
  async getArticleById(id:number):Promise<Article>{return (await apiClient.get<Article>(API_ENDPOINTS.NEWS_DETAIL(id))).data;},
  async getCategories():Promise<BlogCategory[]>{return (await apiClient.get<BlogCategory[]>('/bai-viet/danh-muc')).data;},
  async getRelated(id:number):Promise<Article[]>{return (await apiClient.get<Article[]>(`/bai-viet/${id}/lien-quan`)).data;},
};
