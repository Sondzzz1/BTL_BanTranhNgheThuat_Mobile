export type CommissionType =
  | 'ORIGINAL_COMMISSION'
  | 'PERSONAL_REFERENCE'
  | 'EXISTING_ARTWORK';

export type PermissionUsageStatus =
  | 'AUTHOR_OR_RIGHTS_OWNER'
  | 'PERMISSION_GRANTED'
  | 'PERMITTED_SCOPE'
  | 'UNSURE';

export type CommissionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'WAITING_PERMISSION'
  | 'APPROVED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface CommissionRequest {
  maYeuCau: number;
  maKhachHang: number;
  tenKhachHang?: string | null;
  maHoaSi?: number | null;
  tenHoaSiThucHien?: string | null;
  tieuDe: string;
  type: CommissionType;
  loaiTranh: string;
  kichThuoc: string;
  chuDe?: string;
  mauSac?: string;
  phongCach?: string;
  chatLieu?: string;
  moTa?: string | null;
  anhThamKhao?: string | null;
  referenceArtworkId?: number | null;
  referenceArtworkName?: string | null;
  referenceArtistName?: string | null;
  referenceImageUrl?: string | null;
  nguonTacPhamGoc?: string | null;
  tinhTrangQuyenSuDung?: string | null;
  daXacNhanQuyenTaiLieu: boolean;
  moTaQuyenSuDung?: string | null;
  bangChungQuyenSuDung?: string | null;
  ghiChuKiemDuyet?: string | null;
  tienDatCoc: number;
  giaDuKien: number;
  trangThai: CommissionStatus;
  trangThaiNoiBo?: string;
  ngayTao: string;
  ngayCapNhat?: string | null;
  ngayHoanThanhDuKien?: string | null;
  maTacPhamKetQua?: number | null;
}

export interface CommissionCreateInput {
  tieuDe: string;
  type: CommissionType;
  loaiTranh: string;
  kichThuoc: string;
  chuDe?: string;
  mauSac?: string;
  phongCach?: string;
  chatLieu?: string;
  moTa: string;
  referenceArtworkName?: string;
  referenceArtistName?: string;
  nguonTacPhamGoc?: string;
  tinhTrangQuyenSuDung?: PermissionUsageStatus;
  daXacNhanQuyenTaiLieu?: boolean;
  moTaQuyenSuDung?: string;
  giaDuKien?: number;
  ngayHoanThanhDuKien?: string;
}

export interface LocalUploadFile {
  uri: string;
  name: string;
  type: string;
}

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ Admin duyệt',
  WAITING_PERMISSION: 'Chờ bổ sung quyền',
  APPROVED: 'Đã duyệt',
  ACCEPTED: 'Họa sĩ đã nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
};
