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
    hinhAnh?: string; // Field từ backend
    gia: number;
    soLuong: number;
    tenHoaSi: string;
    tenDanhMuc: string;
    trangThai: number;
  };
}

export interface AddFavoriteRequest {
  ghiChu?: string;
}

export interface FavoriteCheckResponse {
  isLiked: boolean;
}
