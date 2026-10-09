import apiClient from './api';
import { notificationService } from './notificationService';
jest.mock('./api', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;
beforeEach(() => { jest.resetAllMocks(); put.mockResolvedValue({}); });

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
