import apiClient from './api';
import { notificationPath, notificationService } from './notificationService';
jest.mock('./api', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;
const commission = { maThongBao: 35, loai: 'CUSTOM_ART_CLAIMED', tieuDe: 'Họa sĩ đã nhận yêu cầu vẽ tranh',
  noiDung: 'Họa sĩ Trịnh Tuấn đã nhận yêu cầu vẽ tranh #35.', daDoc: false, ngayTao: '2026-10-13T00:00:00Z' };
beforeEach(() => { jest.resetAllMocks(); put.mockResolvedValue({}); });

test('commission notification opens only the Admin request detail route', () => {
  const item = { ...commission, duongDan: '/admin/custom-art?requestId=35' };
  expect(notificationPath(item, '/admin/notifications')).toBe(item.duongDan);
  expect(notificationPath(item, '/artist/notifications')).toBeUndefined();
});

test.each([
  '/admin/custom-art?requestId=0', '/admin/custom-art?requestId=-1',
  '/admin/custom-art?requestId=35&redirect=evil', '//evil.example/admin/custom-art?requestId=35',
  'https://evil.example/admin/custom-art?requestId=35', '/admin/custom-art?requestId=35%5c',
])('invalid commission target %s is not navigable', (duongDan) => {
  expect(notificationPath({ ...commission, duongDan }, '/admin/notifications')).toBeUndefined();
});

test('inbox and unread requests never send recipient IDs', async () => {
  get.mockResolvedValueOnce({ data: { items: [], total: 0, page: 2, pageSize: 20 } }).mockResolvedValueOnce({ data: { soLuong: 3 } });
  expect((await notificationService.getMine(2, 20)).items).toEqual([]);
  expect(get).toHaveBeenCalledWith('/thong-bao', { params: { page: 2, pageSize: 20 } });
  expect(await notificationService.countUnread()).toBe(3);
});

test('successful mark one/all broadcasts a refresh, failed mark does not', async () => {
  const listener = jest.fn(); window.addEventListener('notifications:changed', listener);
  try {
    await notificationService.markAsRead(7); await notificationService.markAllAsRead();
    expect(put).toHaveBeenCalledWith('/thong-bao/7/da-doc');
    expect(listener).toHaveBeenCalledTimes(2);
    put.mockRejectedValueOnce(new Error('offline'));
    await expect(notificationService.markAsRead(8)).rejects.toThrow('offline');
    expect(listener).toHaveBeenCalledTimes(2);
  } finally { window.removeEventListener('notifications:changed', listener); }
});
