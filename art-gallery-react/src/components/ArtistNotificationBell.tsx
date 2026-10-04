import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtistNotification, notificationService } from '../services/notificationService';
import './ArtistNotificationBell.css';

export default function ArtistNotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ArtistNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setError('');
      const [page, unread] = await Promise.all([
        notificationService.getMine(1, 20),
        notificationService.countUnread(),
      ]);
      setItems(page.items);
      setUnreadCount(unread);
    } catch {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const openItem = async (item: ArtistNotification) => {
    if (!item.daDoc) {
      try {
        await notificationService.markAsRead(item.maThongBao);
        setItems(current => current.map(value => value.maThongBao === item.maThongBao ? { ...value, daDoc: true } : value));
        setUnreadCount(current => Math.max(0, current - 1));
      } catch {
        // Link vẫn có thể mở; lần tải sau sẽ đồng bộ lại trạng thái đã đọc.
      }
    }
    setOpen(false);
    if (item.duongDan) navigate(item.duongDan);
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems(current => current.map(item => ({ ...item, daDoc: true })));
      setUnreadCount(0);
    } catch {
      setError('Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.');
    }
  };

  return (
    <div className="artist-notification">
      <button
        type="button"
        className="artist-notification-trigger"
        onClick={() => setOpen(value => {
          if (!value) void load();
          return !value;
        })}
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
      >
        <i className="ti-bell" />
        {unreadCount > 0 && <span className="artist-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section className="artist-notification-panel" aria-label="Danh sách thông báo">
          <header>
            <div><strong>Thông báo</strong><span>{unreadCount ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}</span></div>
            {unreadCount > 0 && <button type="button" onClick={() => void markAll()}>Đánh dấu đã đọc</button>}
          </header>
          {loading ? <p className="artist-notification-state">Đang tải...</p> : error ? <button className="artist-notification-state retry" type="button" onClick={() => void load()}>{error}</button> : items.length === 0 ? <p className="artist-notification-state">Chưa có thông báo mới.</p> : (
            <div className="artist-notification-list">
              {items.map(item => (
                <button type="button" key={item.maThongBao} className={`artist-notification-item ${item.daDoc ? 'read' : 'unread'}`} onClick={() => void openItem(item)}>
                  <span className="artist-notification-dot" aria-hidden="true" />
                  <span><strong>{item.tieuDe}</strong><span>{item.noiDung}</span><time>{new Date(item.ngayTao).toLocaleString('vi-VN')}</time></span>
                </button>
              ))}
            </div>
          )}
          <footer><button type="button" onClick={() => { setOpen(false); navigate('/artist/notifications'); }}>Xem tất cả thông báo</button></footer>
        </section>
      )}
    </div>
  );
}
