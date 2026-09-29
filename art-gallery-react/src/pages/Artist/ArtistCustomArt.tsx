import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  CustomArtRequestApi,
  customArtService,
  getAuthenticatedCustomArtFileUrl,
  getCustomArtStatusLabel,
  getCustomArtTypeLabel,
} from '../../services/customArtService';
import { formatVnd } from '../../utils/currency';
import './ArtistCustomArt.css';

const ArtistCustomArt: React.FC = () => {
  const { user } = useAuth();
  const artistId = Number(user?.id || 0);
  const [items, setItems] = useState<CustomArtRequestApi[]>([]);
  const [selected, setSelected] = useState<CustomArtRequestApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState({ price: '', time: '', note: '' });
  const [progressForm, setProgressForm] = useState<{ title: string; description: string; image?: File }>({ title: '', description: '' });
  const [referencePreview, setReferencePreview] = useState<string>();
  const [progressPreviews, setProgressPreviews] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try { setLoading(true); setItems(await customArtService.getArtistRequests()); }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể tải yêu cầu.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => () => {
    if (referencePreview?.startsWith('blob:')) URL.revokeObjectURL(referencePreview);
  }, [referencePreview]);
  useEffect(() => () => {
    Object.values(progressPreviews).filter((url) => url.startsWith('blob:')).forEach(URL.revokeObjectURL);
  }, [progressPreviews]);

  const loadDetail = async (id: number) => {
    const detail = await customArtService.getById(id);
    const [reference, progressImages] = await Promise.all([
      getAuthenticatedCustomArtFileUrl(detail.referenceImageUrl || detail.anhThamKhao),
      Promise.all((detail.progress || []).map(async (entry) => [
        entry.maTienDo,
        await getAuthenticatedCustomArtFileUrl(entry.anhPreview),
      ] as const)),
    ]);
    setSelected(detail);
    setReferencePreview(reference);
    setProgressPreviews(Object.fromEntries(progressImages.filter((entry): entry is readonly [number, string] => Boolean(entry[1]))));
  };

  const openDetail = async (item: CustomArtRequestApi) => {
    try {
      await loadDetail(item.maYeuCau);
      setQuote({ price: '', time: '', note: '' });
      setProgressForm({ title: '', description: '' });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể tải chi tiết.');
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setReferencePreview(undefined);
    setProgressPreviews({});
  };

  const run = async (action: () => Promise<any>, success: string) => {
    try { await action(); setMessage(success); closeDetail(); await load(); }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể thực hiện thao tác.'); }
  };

  const submitQuote = async () => {
    if (!selected || !quote.price || !quote.time) return setMessage('Vui lòng nhập giá và ngày hoàn thành.');
    await run(() => customArtService.createQuote({
      MaYeuCau: selected.maYeuCau,
      GiaBaoGia: Number(quote.price.replace(/\D/g, '')),
      ThoiGianHoanThanh: quote.time,
      GhiChu: quote.note || undefined,
    }), 'Đã gửi báo giá.');
  };

  const submitProgress = async () => {
    if (!selected || !progressForm.title.trim() || !progressForm.description.trim()) {
      return setMessage('Vui lòng nhập tiêu đề và mô tả tiến độ.');
    }
    try {
      await customArtService.createProgress(selected.maYeuCau, {
        tieuDe: progressForm.title.trim(),
        moTa: progressForm.description.trim(),
        image: progressForm.image,
      });
      setMessage('Đã đăng tiến độ mới.');
      setProgressForm({ title: '', description: '' });
      await loadDetail(selected.maYeuCau);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể đăng tiến độ.');
    }
  };

  const complete = async (item: CustomArtRequestApi) => {
    const title = window.prompt('Tên tác phẩm mới', item.tieuDe);
    if (title === null) return;
    const image = window.prompt('URL ảnh tác phẩm hoàn thành (có thể để trống)', '') || undefined;
    await run(() => customArtService.complete(item.maYeuCau, {
      tenTacPhamMoi: title || item.tieuDe,
      hinhAnhTacPham: image,
      moTaNguonGoc: item.nguonTacPhamGoc || undefined,
    }), 'Đã hoàn thành và tạo tác phẩm mới. Tác phẩm chưa được tự động xác minh bản quyền.');
  };

  return <div className="artist-commission">
    <div className="artist-commission-header"><div><h2>Yêu cầu tranh đã duyệt</h2><p>Chỉ hiển thị yêu cầu APPROVED hoặc yêu cầu do bạn nhận.</p></div><button className="artist-secondary" onClick={load}>Làm mới</button></div>
    {message && <div className="artist-commission-message">{message}</div>}
    {loading ? <p>Đang tải...</p> : <div className="artist-commission-grid">
      {items.map((item) => {
        const mine = item.maHoaSi === artistId;
        return <article className="artist-commission-card" key={item.maYeuCau}>
          <span className="artist-commission-badge">{getCustomArtStatusLabel(item.trangThai)}</span>
          <h3>{item.tieuDe}</h3>
          <p className="artist-commission-meta">{getCustomArtTypeLabel(item.type)} · {item.loaiTranh} · {item.kichThuoc}</p>
          <p>{item.moTa || 'Không có mô tả'}</p>
          {item.type === 'EXISTING_ARTWORK' && <p><strong>Tác giả gốc:</strong> {item.referenceArtistName}</p>}
          <div className="artist-commission-actions">
            <button className="artist-secondary" onClick={() => openDetail(item)}>Chi tiết</button>
            {!item.maHoaSi && item.trangThai === 'APPROVED' && <button className="artist-primary" onClick={() => run(() => customArtService.claimRequest(item.maYeuCau), 'Đã nhận yêu cầu.')}>Nhận yêu cầu</button>}
            {mine && ['CustomerAccepted', 'DepositPaid'].includes(item.trangThaiNoiBo || '') && <button className="artist-primary" onClick={() => run(() => customArtService.updateStatus(item.maYeuCau, 'IN_PROGRESS'), 'Đã bắt đầu thực hiện.')}>Bắt đầu</button>}
            {mine && item.trangThai === 'IN_PROGRESS' && <button className="artist-success" onClick={() => complete(item)}>Hoàn thành</button>}
          </div>
        </article>;
      })}
      {!items.length && <p>Chưa có yêu cầu phù hợp.</p>}
    </div>}

    {selected && <div className="artist-modal-overlay" onMouseDown={closeDetail}><div className="artist-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="artist-modal-top"><div><h2>{selected.tieuDe}</h2><span className="artist-commission-badge">{getCustomArtStatusLabel(selected.trangThai)}</span></div><button className="artist-secondary" onClick={closeDetail}>Đóng</button></div>
      <p><strong>Khách hàng:</strong> {selected.tenKhachHang || `#${selected.maKhachHang}`}</p>
      <p><strong>Nội dung:</strong> {selected.moTa}</p>
      <p><strong>Ngân sách dự kiến:</strong> {formatVnd(selected.giaDuKien)}</p>
      {selected.type === 'EXISTING_ARTWORK' && <div className="artist-source"><h3>Nguồn gốc và điều kiện sử dụng</h3><p><strong>Tác phẩm gốc:</strong> {selected.referenceArtworkName}</p><p><strong>Tác giả gốc:</strong> {selected.referenceArtistName}</p><p><strong>Nguồn:</strong> {selected.nguonTacPhamGoc || '—'}</p><p><strong>Quyền sử dụng:</strong> {selected.tinhTrangQuyenSuDung || '—'}</p><p><strong>Ghi chú quyền:</strong> {selected.moTaQuyenSuDung || '—'}</p></div>}
      {referencePreview && <img className="artist-reference" src={referencePreview} alt="Tham khảo" />}
      {selected.quote && <div className="artist-source"><h3>Báo giá hiện tại</h3><p><strong>Số tiền:</strong> {formatVnd(selected.quote.giaBaoGia)}</p><p><strong>Ngày hoàn thành:</strong> {new Date(`${selected.quote.thoiGianHoanThanh}T00:00:00`).toLocaleDateString('vi-VN')}</p><p><strong>Ghi chú:</strong> {selected.quote.ghiChu || '—'}</p><p><strong>Trạng thái:</strong> {selected.quote.trangThai === 'CustomerAccepted' ? 'Khách hàng đã chấp nhận' : 'Chờ khách hàng chấp nhận'}</p></div>}
      {selected.maHoaSi === artistId && ['Assigned', 'Quoted'].includes(selected.trangThaiNoiBo || '') && <div className="artist-quote"><h3>Báo giá</h3><input type="text" inputMode="numeric" placeholder="Giá báo giá" value={quote.price} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); setQuote({ ...quote, price: digits ? Number(digits).toLocaleString('vi-VN') : '' }); }} /><input type="date" value={quote.time} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setQuote({ ...quote, time: e.target.value })} /><textarea placeholder="Ghi chú" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} /><button className="artist-primary" onClick={submitQuote}>Gửi báo giá</button></div>}
      <div className="artist-source"><h3>Tiến độ</h3>{(selected.progress || []).length ? selected.progress.map((entry) => <div key={entry.maTienDo} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}><strong>{new Date(entry.ngayTao).toLocaleDateString('vi-VN')} — {entry.tieuDe}</strong><p>{entry.moTa}</p>{progressPreviews[entry.maTienDo] && <img className="artist-reference" src={progressPreviews[entry.maTienDo]} alt={entry.tieuDe} />}</div>) : <p>Chưa có cập nhật tiến độ.</p>}</div>
      {selected.maHoaSi === artistId && ['InProgress', 'PreviewSent', 'RevisionRequested'].includes(selected.trangThaiNoiBo || '') && <div className="artist-quote"><h3>Đăng tiến độ mới</h3><input placeholder="Tiêu đề tiến độ" value={progressForm.title} onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })} /><textarea placeholder="Mô tả tiến độ" value={progressForm.description} onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProgressForm({ ...progressForm, image: e.target.files?.[0] })} /><button className="artist-primary" onClick={submitProgress}>Đăng tiến độ</button></div>}
    </div></div>}
  </div>;
};

export default ArtistCustomArt;
