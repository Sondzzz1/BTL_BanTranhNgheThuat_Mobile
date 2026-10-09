import apiClient from './api';

export interface ArtistNotification {
  maThongBao: number;
  loai: string;
  tieuDe: string;
  noiDung: string;
  duongDan?: string;
  loaiDoiTuong?: string;
  maDoiTuong?: number;
  daDoc: boolean;
  ngayTao: string;
}

export interface NotificationPage {
  items: ArtistNotification[];
  total: number;
  page: number;
  pageSize: number;
}

export const notificationService = {
  async getMine(page = 1, pageSize = 20): Promise<NotificationPage> {
    return (await apiClient.get<NotificationPage>('/thong-bao', { params: { page, pageSize } })).data;
  },

  async countUnread(): Promise<number> {
    return (await apiClient.get<{ soLuong: number }>('/thong-bao/chua-doc/dem')).data.soLuong;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.put(`/thong-bao/${id}/da-doc`);
    window.dispatchEvent(new Event('notifications:changed'));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/thong-bao/da-doc-tat-ca');
    window.dispatchEvent(new Event('notifications:changed'));
  },
};

// Only existing role-local routes are navigable; legacy content links are repaired.
export function notificationPath(item: ArtistNotification, inboxPath: string): string | undefined {
  const root = inboxPath.startsWith('/admin/') ? 'admin' : 'artist';
  let path = item.duongDan;
  if (root === 'artist' && item.loai.startsWith('ARTWORK_CONTENT_') && item.maDoiTuong)
    path = `/artist/artworks/${item.maDoiTuong}/content`;
  if (!path || path.includes('\\\\') || Array.from(path).some(char => char.charCodeAt(0) < 32) || /%5c/i.test(path)) return undefined;
  const allowed = root === 'admin'
    ? /^\/admin\/(art|artwork-details|copyright)(\?[a-zA-Z0-9=&_-]+)?$/
    : /^\/artist\/artworks(\/[1-9][0-9]*(\/(content|copyright))?)?$/;
  return allowed.test(path) ? path : undefined;
}
