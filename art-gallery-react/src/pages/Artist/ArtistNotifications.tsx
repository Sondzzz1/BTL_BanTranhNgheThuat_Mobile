import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtistNotification, notificationService } from '../../services/notificationService';
import './ArtistNotifications.css';

const pageSize = 20;

export default function ArtistNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ArtistNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage: number) => {
    setLoading(true); setError('');
    try {
      const result = await notificationService.getMine(targetPage, pageSize);
      setItems(result.items); setTotal(result.total); setPage(result.page);
    } catch {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(page); }, [load, page]);

  const openItem = async (item: ArtistNotification) => {
    if (!item.daDoc) {
      try {
        await notificationService.markAsRead(item.maThongBao);
        setItems(current => current.map(value => value.maThongBao === item.maThongBao ? { ...value, daDoc: true } : value));
      } catch { setError('Không thể cập nhật trạng thái đã đọc.'); }
    }
    if (item.duongDan) navigate(item.duongDan);
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems(current => current.map(item => ({ ...item, daDoc: true })));
    } catch { setError('Không thể đánh dấu tất cả đã đọc.'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <main className="artist-notifications-page">
    <header><div><p>HỘP THƯ</p><h1>Thông báo</h1></div><button type="button" onClick={() => void markAll()}>Đánh dấu tất cả đã đọc</button></header>
    {loading ? <p className="artist-notifications-state">Đang tải...</p>
      : error ? <button className="artist-notifications-state retry" type="button" onClick={() => void load(page)}>{error}</button>
      : items.length === 0 ? <p className="artist-notifications-state">Bạn chưa có thông báo nào.</p>
      : <section>{items.map(item => <button type="button" key={item.maThongBao} className={`artist-notification-row ${item.daDoc ? 'read' : 'unread'}`} onClick={() => void openItem(item)}>
          <span aria-hidden="true" className="artist-notification-row-dot" /><span><strong>{item.tieuDe}</strong><span>{item.noiDung}</span><time>{new Date(item.ngayTao).toLocaleString('vi-VN')}</time></span>
        </button>)}</section>}
    {totalPages > 1 && <nav className="artist-notifications-pagination" aria-label="Phân trang thông báo">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page}/{totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</button>
    </nav>}
  </main>;
}
