import apiClient from './api';

export type ReportType = 'doanh-thu' | 'don-hang' | 'tac-pham' | 'hoa-si' | 'khach-hang';
export type DatePreset = 'today' | 'week' | 'month' | 'custom';
export const reportTypes: Record<ReportType, string> = {
  'doanh-thu': 'Doanh thu', 'don-hang': 'Đơn hàng', 'tac-pham': 'Tác phẩm bán chạy',
  'hoa-si': 'Doanh thu họa sĩ', 'khach-hang': 'Khách hàng tiềm năng',
};
export interface ReportFilter { type: ReportType; fromDate: string; toDate: string }
export interface ReportRow { key: string; label: string; orders: number; quantity: number; gross: number; refund: number; net: number }
export interface AdminReport {
  type: ReportType; fromDate: string; toDate: string; dateBasis: string; hasData: boolean;
  summary: { label: string; value: number; format: 'number' | 'currency' | 'percent' }[];
  rows: ReportRow[];
}
// Calendar dates, not UTC timestamps (which can shift a Vietnam date).
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function presetDates(preset: DatePreset, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'week') start.setDate(start.getDate() - 6);
  if (preset === 'month') start.setDate(1);
  return { fromDate: localDate(start), toDate: localDate(now) };
}
export function validateReportDates(from: string, to: string): string {
  if (!from || !to) return 'Vui lòng chọn từ ngày và đến ngày.';
  if (from > to) return 'Từ ngày không được lớn hơn đến ngày.';
  if (from < '1753-01-01' || to >= '9999-12-31') return 'Khoảng ngày không được hỗ trợ.';
  return '';
}
export async function getAdminReport(filter: ReportFilter): Promise<AdminReport> {
  const { type, ...params } = filter;
  return (await apiClient.get<AdminReport>(`/admin/bao-cao/${type}`, { params })).data;
}
