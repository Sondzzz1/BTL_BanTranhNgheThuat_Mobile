import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtistNotification, notificationService, notificationPath } from '../services/notificationService';
import './ArtistNotificationBell.css';

interface NotificationBellProps {
  allNotificationsPath?: string;
}

export default function ArtistNotificationBell({ allNotificationsPath = '/artist/notifications' }: NotificationBellProps) {
  const navigate = useNavigate();
  const requestSequence = useRef(0);
  const markingRef = useRef(false);
  const [items, setItems] = useState<ArtistNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    try {
      setError('');
      const [page, unread] = await Promise.all([
        notificationService.getMine(1, 20),
        notificationService.countUnread(),
      ]);
      if (sequence !== requestSequence.current) return;
      setItems(page.items);
      setUnreadCount(unread);
    } catch {
      if (sequence !== requestSequence.current) return;
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    const refresh = () => { void load(); };
    window.addEventListener('notifications:changed', refresh);
    const activeRequests = requestSequence;
    return () => { ++activeRequests.current; window.clearInterval(interval); window.removeEventListener('notifications:changed', refresh); };
  }, [load]);

  const openItem = async (item: ArtistNotification) => {
    if (markingRef.current) return;
    markingRef.current = true;
    ++requestSequence.current;
    setMarking(true);
    if (!item.daDoc) {
      try {
        await notificationService.markAsRead(item.maThongBao);
        setItems(current => current.map(value => value.maThongBao === item.maThongBao ? { ...value, daDoc: true } : value));
        setUnreadCount(current => Math.max(0, current - 1));
      } catch {
        setError("Không thể cập nhật trạng thái đã đọc. Vui lòng thử lại.");
        markingRef.current = false;
        setMarking(false);
        return;
      }
    }
    setOpen(false);
    markingRef.current = false;
    setMarking(false);
    const path = notificationPath(item, allNotificationsPath);
    if (path) navigate(path);
  };

  const markAll = async () => {
    if (markingRef.current) return;
    markingRef.current = true;
    ++requestSequence.current;
    setMarking(true);
    try {
      await notificationService.markAllAsRead();
      setItems(current => current.map(item => ({ ...item, daDoc: true })));
      setUnreadCount(0);
    } catch {
      setError('Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.');
    } finally { markingRef.current = false; setMarking(false); }
  };

  return (
    <div className="artist-notification">
      <button
        type="button"
        className="artist-notification-trigger"
        aria-expanded={open}
        onClick={() => setOpen(value => {
          if (!value) void load();
          return !value;
        })}
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
      >
        <i className="ti-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className="artist-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section className="artist-notification-panel" aria-label="Danh sách thông báo">
          <header>
            <div><strong>Thông báo</strong><span>{unreadCount ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}</span></div>
            {unreadCount > 0 && <button type="button" disabled={marking} onClick={() => void markAll()}>Đánh dấu đã đọc</button>}
          </header>
          {loading ? <p className="artist-notification-state">Đang tải...</p> : error ? <button className="artist-notification-state retry" type="button" onClick={() => void load()}>{error}</button> : items.length === 0 ? <p className="artist-notification-state">Chưa có thông báo mới.</p> : (
            <div className="artist-notification-list">
              {items.map(item => (
                <button type="button" key={item.maThongBao} disabled={marking} className={`artist-notification-item ${item.daDoc ? 'read' : 'unread'}`} onClick={() => void openItem(item)}>
                  <span className="artist-notification-dot" aria-hidden="true" />
                  <span><strong>{item.tieuDe}</strong><span>{item.noiDung}</span><time>{new Date(item.ngayTao).toLocaleString('vi-VN')}</time></span>
                </button>
              ))}
            </div>
          )}
          <footer><button type="button" onClick={() => { setOpen(false); navigate(allNotificationsPath); }}>Xem tất cả thông báo</button></footer>
        </section>
      )}
    </div>
  );
}
