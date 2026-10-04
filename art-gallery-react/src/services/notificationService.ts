import apiClient from './api';

export interface ArtistNotification {
  maThongBao: number;
  loai: string;
  tieuDe: string;
  noiDung: string;
  duongDan?: string;
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
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/thong-bao/da-doc-tat-ca');
  },
};
