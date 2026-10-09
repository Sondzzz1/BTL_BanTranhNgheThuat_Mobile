import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArtistNotificationBell from './ArtistNotificationBell';
import ArtistNotifications from '../pages/Artist/ArtistNotifications';
import AdminNotifications from '../pages/Admin/AdminNotifications';
import { ArtistNotification, notificationPath, notificationService } from '../services/notificationService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../services/notificationService', () => ({
  ...jest.requireActual('../services/notificationService'),
  notificationService: { getMine: jest.fn(), countUnread: jest.fn(), markAsRead: jest.fn(), markAllAsRead: jest.fn() },
}));
const svc = notificationService as jest.Mocked<typeof notificationService>;
const item: ArtistNotification = { maThongBao: 21, loai: 'DETAIL_SUBMITTED', tieuDe: 'Nội dung cần duyệt',
  noiDung: '<script>Không thực thi HTML</script>', duongDan: '/admin/artwork-details?artworkId=7', daDoc: false, ngayTao: '2026-10-09T00:00:00Z' };
beforeEach(() => {
  jest.resetAllMocks();
  svc.getMine.mockResolvedValue({ items: [item], total: 1, page: 1, pageSize: 20 });
  svc.countUnread.mockResolvedValue(14);
  svc.markAsRead.mockResolvedValue(); svc.markAllAsRead.mockResolvedValue();
});

test.each(['/admin/notifications', '/artist/notifications'])('shared bell displays badge and correct inbox link for %s', async path => {
  render(<ArtistNotificationBell allNotificationsPath={path} />);
  const bell = await screen.findByRole('button', { name: 'Thông báo, 14 chưa đọc' });
  expect(bell).toHaveTextContent('9+');
  fireEvent.click(bell);
  fireEvent.click(await screen.findByRole('button', { name: 'Xem tất cả thông báo' }));
  expect(mockNavigate).toHaveBeenCalledWith(path);
});

test('Admin notification marks read then opens the correct detail; text is escaped', async () => {
  render(<ArtistNotificationBell allNotificationsPath="/admin/notifications" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 14 chưa đọc' }));
  fireEvent.click(await screen.findByRole('button', { name: /Nội dung cần duyệt/ }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/artwork-details?artworkId=7'));
  expect(svc.markAsRead).toHaveBeenCalledWith(21);
  expect(screen.getByRole('button', { name: 'Thông báo, 13 chưa đọc' })).toBeInTheDocument();
  expect(document.querySelector('script')).toBeNull();
});

test('mark-read failure stays visible and does not mockNavigate or pretend the badge changed', async () => {
  svc.markAsRead.mockRejectedValue(new Error('offline'));
  render(<ArtistNotificationBell allNotificationsPath="/admin/notifications" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 14 chưa đọc' }));
  fireEvent.click(await screen.findByRole('button', { name: /Nội dung cần duyệt/ }));
  expect(await screen.findByText(/Không thể cập nhật trạng thái đã đọc/)).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('mark all clears unread badge', async () => {
  render(<ArtistNotificationBell />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 14 chưa đọc' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thông báo' })).toBeInTheDocument());
  expect(svc.markAllAsRead).toHaveBeenCalledTimes(1);
});

test('mark-read in another inbox refreshes the header badge immediately', async () => {
  render(<ArtistNotificationBell />);
  await screen.findByRole('button', { name: 'Thông báo, 14 chưa đọc' });
  svc.countUnread.mockResolvedValue(0);
  window.dispatchEvent(new Event('notifications:changed'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thông báo' })).toBeInTheDocument());
});

test.each([ArtistNotifications, AdminNotifications])('inbox empty state and API retry', async Component => {
  svc.getMine.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  render(<Component />);
  fireEvent.click(await screen.findByRole('button', { name: /Không thể tải thông báo/ }));
  expect(await screen.findByText('Bạn chưa có thông báo nào.')).toBeInTheDocument();
});

test('Artist decision opens its content form, never the Admin review page', async () => {
  svc.getMine.mockResolvedValue({ items: [{ ...item, loai: 'ARTWORK_CONTENT_APPROVED', maDoiTuong: 7,
    duongDan: '/artist/artworks/7' }], total: 1, page: 1, pageSize: 20 });
  render(<ArtistNotifications />);
  fireEvent.click(await screen.findByRole('button', { name: /Nội dung cần duyệt/ }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/artist/artworks/7/content'));
});

test.each(['https://evil.example', '//evil.example', '/artist/artworks/7', '/admin/missing', '/admin/art?artworkId=7%5c'])('unsafe or wrong-role target %s is not mockNavigated', path => {
  expect(notificationPath({ ...item, duongDan: path }, '/admin/notifications')).toBeUndefined();
});

test('bell displays empty state and load failure with retry', async () => {
  svc.getMine.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  svc.countUnread.mockResolvedValue(0);
  render(<ArtistNotificationBell />);
  await waitFor(() => expect(svc.getMine).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
  expect(await screen.findByText('Chưa có thông báo mới.')).toBeInTheDocument();
  svc.getMine.mockRejectedValue(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
  expect(await screen.findByRole('button', { name: /Không thể tải thông báo/ })).toBeInTheDocument();
});
