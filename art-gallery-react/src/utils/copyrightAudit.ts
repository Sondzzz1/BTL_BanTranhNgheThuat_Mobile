import type { CopyrightAuditRecord } from '../services/copyrightService';

const objectLabels: Record<string, string> = {
  BanQuyen: 'Hồ sơ bản quyền',
  BangChungBanQuyen: 'Bằng chứng bản quyền',
  LichSuSoHuu: 'Lịch sử sở hữu',
  ChungNhan: 'Chứng nhận sở hữu',
  YeuCauHoanTra: 'Yêu cầu hoàn trả',
  ThanhToanYeuCau: 'Yêu cầu thanh toán',
  YeuCauVeTranh: 'Yêu cầu vẽ tranh',
  TacPham: 'Tác phẩm',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Đã tạo hồ sơ',
  UPDATE: 'Đã cập nhật hồ sơ',
  ADD: 'Đã thêm bằng chứng',
  DELETE: 'Đã xóa bằng chứng',
  REVIEW: 'Đã kiểm duyệt hồ sơ bản quyền',
  REVOKE_VERIFICATION: 'Đã thu hồi xác minh nguồn gốc',
  VERIFY_INITIAL_QUANTITY: 'Đã xác minh số lượng phát hành ban đầu',
  CORRECT_PUBLICATION_DECLARATION: 'Đã hiệu chỉnh thông tin phát hành',
  RESEAL_INTEGRITY_HASH: 'Hệ thống đã ký lại mã kiểm tra chứng nhận',
  ISSUE: 'Đã cấp chứng nhận sở hữu',
  ISSUE_AFTER_VERIFY: 'Đã cấp chứng nhận sở hữu sau khi xác minh',
  SALE_TRANSFER: 'Đã chuyển quyền sở hữu sau giao dịch',
  SALE_TRANSFER_AFTER_VERIFY: 'Đã chuyển quyền sở hữu sau khi xác minh',
  CUSTOM_ART_TRANSFER: 'Đã chuyển quyền sở hữu tranh đặt vẽ',
  REVOKE: 'Đã thu hồi chứng nhận sở hữu',
  SET_OWNER_VISIBILITY: 'Đã thay đổi chế độ hiển thị chủ sở hữu',
  PHYSICAL_RETURN_RECEIVED: 'Đã xác nhận đã nhận tranh hoàn trả',
  REFUND_COMPLETED: 'Đã hoàn tất hoàn tiền',
  RETURN_REVERSED: 'Đã hủy quy trình hoàn trả',
};

const roleLabels: Record<number, string> = {
  0: 'Quản trị viên',
  1: 'Khách hàng',
  2: 'Họa sĩ',
};

const statusLabels: Record<number, string> = {
  0: 'chờ kiểm duyệt',
  1: 'cần bổ sung thông tin',
  2: 'đã xác minh',
  3: 'đã từ chối',
  4: 'đang tranh chấp',
  5: 'dữ liệu cũ',
  6: 'đã thu hồi',
};

type AuditJson = Record<string, unknown>;

function readJson(value?: string): AuditJson | null {
  if (!value?.trim().startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AuditJson : null;
  } catch {
    return null;
  }
}

function getValue(data: AuditJson, key: string): unknown {
  const actualKey = Object.keys(data).find(item => item.toLowerCase() === key.toLowerCase());
  return actualKey ? data[actualKey] : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function formatFileSize(value: unknown): string | undefined {
  const size = number(value);
  if (size === undefined) return undefined;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStructuredChange(item: CopyrightAuditRecord): string | undefined {
  const data = readJson(item.giaTriSau) || readJson(item.thongTinBoSung);
  if (!data) return undefined;

  const originalName = text(getValue(data, 'originalName'));
  if (originalName) {
    const size = formatFileSize(getValue(data, 'size'));
    return `Đã thêm tệp bằng chứng “${originalName}”${size ? ` (${size})` : ''}.`;
  }

  const status = number(getValue(data, 'status'));
  if (status !== undefined) return `Trạng thái hồ sơ được chuyển thành ${statusLabels[status] || `mã ${status}`}.`;

  const artworkId = number(getValue(data, 'maTacPham'));
  const isExclusive = getValue(data, 'laTacPhamDocBan');
  if (artworkId !== undefined || typeof isExclusive === 'boolean') {
    const parts: string[] = [];
    if (artworkId !== undefined) parts.push(`tác phẩm #${artworkId}`);
    if (typeof isExclusive === 'boolean') parts.push(isExclusive ? 'phát hành độc bản' : 'phát hành nhiều bản');
    return `Thông tin đã ghi nhận: ${parts.join(', ')}.`;
  }

  const visible = getValue(data, 'hienThiChuSoHuu') ?? getValue(data, 'ownerVisible');
  if (typeof visible === 'boolean') return visible ? 'Đã cho phép hiển thị tên chủ sở hữu.' : 'Đã ẩn tên chủ sở hữu.';

  return undefined;
}

function formatKeyValueChange(item: CopyrightAuditRecord): string | undefined {
  const raw = item.thongTinBoSung || item.giaTriSau;
  if (!raw || raw.trim().startsWith('{')) return undefined;
  const values = Object.fromEntries(raw.split(';').map(part => {
    const [key, ...rest] = part.split('=');
    return [key.trim().toLowerCase(), rest.join('=').trim()];
  }).filter(([key, value]) => key && value));

  if (values.code) return `Mã chứng nhận được cấp: ${values.code}.`;
  if (values.order) return `Thay đổi được thực hiện cho đơn hàng #${values.order}.`;
  return undefined;
}

export function formatAuditObject(objectName: string): string {
  return objectLabels[objectName] || objectName;
}

export function formatAuditAction(item: CopyrightAuditRecord): string {
  return actionLabels[item.hanhDong] || `Đã thực hiện thao tác ${item.hanhDong.replaceAll('_', ' ').toLowerCase()}`;
}

export function formatAuditActor(item: CopyrightAuditRecord): string {
  if (typeof item.nguoiThucHien !== 'number') return 'Hệ thống tự động';
  const role = item.vaiTroNguoiThucHien === undefined ? 'Tài khoản' : roleLabels[item.vaiTroNguoiThucHien] || 'Tài khoản';
  return `${role}: ${item.tenNguoiThucHien || `#${item.nguoiThucHien}`}`;
}

export function formatAuditChange(item: CopyrightAuditRecord): string {
  const detail = formatStructuredChange(item) || formatKeyValueChange(item);
  if (item.lyDo?.trim()) return detail ? `${detail} Ghi chú: ${item.lyDo.trim()}` : `Ghi chú: ${item.lyDo.trim()}`;
  return detail || 'Không có thay đổi bổ sung.';
}
