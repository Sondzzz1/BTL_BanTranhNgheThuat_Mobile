export type ConsultationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Confirmed'
  | 'Rejected'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled';

export interface ConsultationBooking {
  maLichTuVan: number;
  maKhachHang: number;
  maHoaSi?: number;
  maNhanVien?: number;
  ngay: string;
  gio: string;
  diaChi: string;
  nhuCau: string;
  ghiChu?: string;
  trangThai: ConsultationStatus;
  ketQuaTuVan?: string;
  ngayTao: string;
}

export interface CreateConsultationInput {
  ngay: string;
  gio: string;
  diaChi: string;
  nhuCau: string;
  ghiChu?: string;
}
