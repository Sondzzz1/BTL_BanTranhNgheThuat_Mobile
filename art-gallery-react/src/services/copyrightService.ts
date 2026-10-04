import apiClient from './api';

export interface CopyrightEvidence {
  maBangChung: number;
  tenTepGoc: string;
  loaiTep: string;
  kichThuoc: number;
  ngayTao: string;
  duongDanTai: string;
  moTa?: string;
  sha256?: string;
}

export interface CopyrightRecord {
  maBanQuyen: number;
  maTacPham: number;
  tenTacPham: string;
  maHoaSi: number;
  tenHoaSi: string;
  tacGia: string;
  ngaySangTac?: string;
  nguonGoc: string;
  moTaBanQuyen?: string;
  ghiChu?: string;
  trangThai: string;
  trangThaiSo: number;
  laTacPhamDocBan: boolean;
  soLuongBanDau?: number;
  soLuongTon: number;
  soDonHang: number;
  loaiTacPhamText: string;
  loaiTacPham: number;
  tacGiaGoc?: string;
  maTacPhamGoc?: number;
  moTaNguonGoc?: string;
  canCuSuDung: string;
  canCuSuDungSo?: number;
  nguonThamKhao?: string;
  soDangKy?: string;
  laDuLieuCu: boolean;
  biChanBan: boolean;
  ghiChuKiemDuyet?: string;
  lyDoThuHoiXacMinh?: string;
  bangChung: CopyrightEvidence[];
}

export interface PublicCertificate {
  timThay: boolean;
  toanVen: boolean;
  maChungNhan: string;
  trangThai: string;
  tenTacPham?: string;
  loaiTacPhamText?: string;
  tacGiaGoc?: string;
  hoaSiThucHien?: string;
  chuSoHuuHienThi?: string;
  ngayCap?: string;
  luuYPhapLy: string;
}

export interface CertificateRecord {
  maChungNhan: number;
  maChungNhanCongKhai: string;
  maTacPham: number;
  tenTacPham: string;
  tacGia: string;
  tenHoaSi: string;
  chuSoHuu: string;
  ngayCap: string;
  trangThai: string;
  loaiTacPhamText: string;
  tacGiaGoc?: string;
}

export interface CopyrightAuditRecord {
  maNhatKy: number;
  tenDoiTuong: string;
  maDoiTuong: number;
  hanhDong: string;
  giaTriTruoc?: string;
  giaTriSau?: string;
  nguoiThucHien?: number;
  vaiTroNguoiThucHien?: number;
  tenNguoiThucHien?: string;
  thoiGian: string;
  lyDo?: string;
  thongTinBoSung?: string;
}

export const copyrightService = {
  async artistGet(artworkId: number) {
    const response = await apiClient.get<CopyrightRecord>(`/ban-quyen/tac-pham/${artworkId}`);
    return response.data;
  },
  async artistCreate(payload: Record<string, unknown>) {
    return (await apiClient.post<{ maBanQuyen: number }>('/ban-quyen', payload)).data;
  },
  async artistUpdate(id: number, payload: Record<string, unknown>) {
    await apiClient.put(`/ban-quyen/${id}`, payload);
  },
  async artistAddEvidence(id: number, file: File, moTa?: string) {
    const form = new FormData(); form.append('file', file); if (moTa) form.append('moTa', moTa);
    await apiClient.post(`/ban-quyen/${id}/bang-chung`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  async artistDeleteEvidence(id: number, evidenceId: number) {
    await apiClient.delete(`/ban-quyen/${id}/bang-chung/${evidenceId}`);
  },
  async adminList(status?: string, keyword?: string) {
    const response = await apiClient.get<CopyrightRecord[]>('/ban-quyen/admin', { params: { status, keyword } });
    return response.data;
  },
  async adminDetail(id: number) {
    const response = await apiClient.get<CopyrightRecord>(`/ban-quyen/admin/${id}`);
    return response.data;
  },
  async downloadEvidence(path: string) {
    const response = await apiClient.get<Blob>(path.replace(/^\/api/, ''), { responseType: 'blob' });
    return response.data;
  },
  async review(id: number, action: 'xac-minh' | 'yeu-cau-bo-sung' | 'tu-choi', ghiChu?: string) {
    await apiClient.post(`/ban-quyen/admin/${id}/${action}`, { ghiChu });
  },
  async correctPublicationDeclaration(artworkId: number, payload: { laTacPhamDocBan: boolean; soLuongBanDau: number; canCuXacMinh: string }) {
    await apiClient.post(`/ban-quyen/admin/tac-pham/${artworkId}/dieu-chinh-phat-hanh`, payload);
  },
  async revokeVerification(id: number, lyDo: string, tamAnTacPham = true) {
    await apiClient.post(`/ban-quyen/admin/${id}/thu-hoi-xac-minh`, { lyDo, tamAnTacPham });
  },
  async verifyCertificate(code: string) {
    const response = await apiClient.get<PublicCertificate>(`/chung-nhan/xac-minh/${encodeURIComponent(code)}`);
    return response.data;
  },
  publicCertificatePdfUrl(code: string) {
    return `${String(apiClient.defaults.baseURL || '').replace(/\/$/, '')}/chung-nhan/xac-minh/${encodeURIComponent(code)}/pdf`;
  },
  async adminCertificates(status?: string, keyword?: string) {
    const response = await apiClient.get<CertificateRecord[]>('/chung-nhan/admin', { params: { status, keyword } });
    return response.data;
  },
  async revokeCertificate(id: number, lyDo: string) {
    await apiClient.post(`/chung-nhan/admin/${id}/thu-hoi`, { lyDo });
  },
  async adminAudit(objectName?: string, objectId?: number) {
    return (await apiClient.get<CopyrightAuditRecord[]>('/ban-quyen/admin/nhat-ky', {
      params: { objectName, objectId },
    })).data;
  },
};
