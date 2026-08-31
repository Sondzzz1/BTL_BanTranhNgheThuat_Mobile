// Favorite/YeuThich Types

export interface Favorite {
  maYeuThich: number;
  maNguoiDung: number;
  maTacPham: number;
  ngayThem: string;
  ghiChu?: string;
}

export interface FavoriteWithProduct {
  maYeuThich: number;
  ngayThem: string;
  ghiChu?: string;
  tacPham: {
    maTacPham: number;
    tenTacPham: string;
    anhTranh: string;
    gia: number;
    soLuong: number;
    tenHoaSi: string;
    tenDanhMuc: string;
  };
}

export interface AddFavoriteRequest {
  ghiChu?: string;
}

export interface FavoriteCheckResponse {
  isLiked: boolean;
}
