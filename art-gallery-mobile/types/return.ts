// Types cho module Hoàn trả sản phẩm

// ================================================================
// INTERFACES
// ================================================================

export interface YeuCauHoanTra {
  maYeuCau: number;
  maDonHang: number;
  maTacPham: number;
  tenTacPham?: string;
  hinhAnhTacPham?: string;
  giaTacPham: number;
  lyDo: string;
  moTa?: string;
  trangThai: string;
  ngayTao: string;
}

export interface YeuCauHoanTraChiTiet {
  maYeuCau: number;
  maDonHang: number;
  maNguoiDung: number;
  tenNguoiDung?: string;
  emailNguoiDung?: string;
  soDienThoaiNguoiDung?: string;
  maTacPham: number;
  tenTacPham?: string;
  hinhAnhTacPham?: string;
  giaTacPham: number;
  soLuong: number;
  lyDo: string;
  lyDoKhac?: string;
  moTa?: string;
  hinhAnh: string[];
  trangThai: string;
  lyDoTuChoi?: string;
  ngayTao: string;
  ngayCapNhat: string;
  ngayDatHang: string;
  tongTienDonHang: number;
}

export interface TaoHoanTraRequest {
  maDonHang: number;
  maTacPham: number;
  /** SAN_PHAM_HU_HONG | SAI_MO_TA | GIAO_SAI | LOI_SAN_PHAM | KHONG_DUNG_DAT | LY_DO_KHAC */
  lyDo: string;
  lyDoKhac?: string;
  moTa?: string;
  hinhAnh?: string[];
}

export interface TaoHoanTraResponse {
  message: string;
  maYeuCau: number;
}

// ================================================================
// CONSTANTS - Trạng thái hoàn trả
// ================================================================

export const RETURN_STATUS = {
  CHO_DUYET: 'CHO_DUYET',
  DA_DUYET: 'DA_DUYET',
  TU_CHOI: 'TU_CHOI',
  DANG_HOAN_TRA: 'DANG_HOAN_TRA',
  DA_NHAN_HANG: 'DA_NHAN_HANG',
  DA_HOAN_TIEN: 'DA_HOAN_TIEN',
  HOAN_TAT: 'HOAN_TAT',
} as const;

export type ReturnStatus = typeof RETURN_STATUS[keyof typeof RETURN_STATUS];

export const RETURN_STATUS_TEXT: Record<string, string> = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Từ chối',
  DANG_HOAN_TRA: 'Đang gửi hàng',
  DA_NHAN_HANG: 'Đã nhận hàng',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_TAT: 'Hoàn tất',
};

export const RETURN_STATUS_COLOR: Record<string, string> = {
  CHO_DUYET: '#f59e0b',
  DA_DUYET: '#3b82f6',
  TU_CHOI: '#ef4444',
  DANG_HOAN_TRA: '#f97316',
  DA_NHAN_HANG: '#8b5cf6',
  DA_HOAN_TIEN: '#10b981',
  HOAN_TAT: '#16a34a',
};

export const RETURN_STATUS_BG: Record<string, string> = {
  CHO_DUYET: '#fef3c7',
  DA_DUYET: '#dbeafe',
  TU_CHOI: '#fee2e2',
  DANG_HOAN_TRA: '#ffedd5',
  DA_NHAN_HANG: '#ede9fe',
  DA_HOAN_TIEN: '#d1fae5',
  HOAN_TAT: '#dcfce7',
};

// ================================================================
// CONSTANTS - Lý do hoàn trả
// ================================================================

export interface ReturnReason {
  value: string;
  label: string;
}

export const RETURN_REASONS: ReturnReason[] = [
  { value: 'SAN_PHAM_HU_HONG', label: 'Sản phẩm bị hư hỏng' },
  { value: 'SAI_MO_TA', label: 'Sản phẩm không đúng mô tả' },
  { value: 'GIAO_SAI', label: 'Giao sai sản phẩm' },
  { value: 'LOI_SAN_PHAM', label: 'Sản phẩm bị lỗi' },
  { value: 'KHONG_DUNG_DAT', label: 'Không đúng sản phẩm đã đặt' },
  { value: 'LY_DO_KHAC', label: 'Lý do khác' },
];

// ================================================================
// CONSTANTS - Timeline trạng thái
// ================================================================

export interface TimelineStep {
  status: string;
  label: string;
  description: string;
}

export const RETURN_TIMELINE: TimelineStep[] = [
  { status: 'CHO_DUYET', label: 'Đã gửi yêu cầu', description: 'Yêu cầu hoàn trả đã được gửi đến chúng tôi' },
  { status: 'DA_DUYET', label: 'Đã duyệt', description: 'Yêu cầu được chấp nhận, vui lòng gửi sản phẩm về' },
  { status: 'DANG_HOAN_TRA', label: 'Đang gửi hàng', description: 'Bạn đã xác nhận gửi sản phẩm về cửa hàng' },
  { status: 'DA_NHAN_HANG', label: 'Đã nhận hàng', description: 'Chúng tôi đã nhận được sản phẩm' },
  { status: 'DA_HOAN_TIEN', label: 'Đã hoàn tiền', description: 'Tiền đã được hoàn trả vào tài khoản' },
  { status: 'HOAN_TAT', label: 'Hoàn tất', description: 'Quy trình hoàn trả đã hoàn tất' },
];
