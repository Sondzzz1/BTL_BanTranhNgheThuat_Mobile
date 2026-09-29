import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  CustomArtRequestApi,
  customArtService,
  getAuthenticatedCustomArtFileUrl,
  getCustomArtStatusLabel,
  getCustomArtTypeLabel,
} from '../../services/customArtService';
import './ArtistCustomArt.css';

const ArtistCustomArt: React.FC = () => {
  const { user } = useAuth();
  const artistId = Number(user?.id || 0);
  const [items, setItems] = useState<CustomArtRequestApi[]>([]);
  const [selected, setSelected] = useState<CustomArtRequestApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState({ price: '', time: '', note: '' });
  const [referencePreview, setReferencePreview] = useState<string>();

  const load = useCallback(async () => {
    try { setLoading(true); setItems(await customArtService.getArtistRequests()); }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể tải yêu cầu.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => () => {
    if (referencePreview?.startsWith('blob:')) URL.revokeObjectURL(referencePreview);
  }, [referencePreview]);

  const openDetail = async (item: CustomArtRequestApi) => {
    try {
      const detail = await customArtService.getById(item.maYeuCau);
      setSelected(detail);
      setReferencePreview(await getAuthenticatedCustomArtFileUrl(detail.referenceImageUrl || detail.anhThamKhao));
      setQuote({ price: '', time: '', note: '' });
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể tải chi tiết.');
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setReferencePreview(undefined);
  };

  const run = async (action: () => Promise<any>, success: string) => {
    try { await action(); setMessage(success); closeDetail(); await load(); }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể thực hiện thao tác.'); }
  };

  const submitQuote = async () => {
    if (!selected || !quote.price || !quote.time) return setMessage('Vui lòng nhập giá và thời gian hoàn thành.');
    await run(() => customArtService.createQuote({
      MaYeuCau: selected.maYeuCau,
      GiaBaoGia: Number(quote.price),
      ThoiGianHoanThanh: quote.time,
      GhiChu: quote.note || undefined,
    }), 'Đã gửi báo giá.');
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
            {mine && item.trangThai === 'ACCEPTED' && <button className="artist-primary" onClick={() => run(() => customArtService.updateStatus(item.maYeuCau, 'IN_PROGRESS'), 'Đã bắt đầu thực hiện.')}>Bắt đầu</button>}
            {mine && ['ACCEPTED', 'IN_PROGRESS'].includes(item.trangThai) && <button className="artist-success" onClick={() => complete(item)}>Hoàn thành</button>}
          </div>
        </article>;
      })}
      {!items.length && <p>Chưa có yêu cầu phù hợp.</p>}
    </div>}

    {selected && <div className="artist-modal-overlay" onMouseDown={closeDetail}><div className="artist-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="artist-modal-top"><div><h2>{selected.tieuDe}</h2><span className="artist-commission-badge">{getCustomArtStatusLabel(selected.trangThai)}</span></div><button className="artist-secondary" onClick={closeDetail}>Đóng</button></div>
      <p><strong>Khách hàng:</strong> {selected.tenKhachHang || `#${selected.maKhachHang}`}</p>
      <p><strong>Nội dung:</strong> {selected.moTa}</p>
      {selected.type === 'EXISTING_ARTWORK' && <div className="artist-source"><h3>Nguồn gốc và điều kiện sử dụng</h3><p><strong>Tác phẩm gốc:</strong> {selected.referenceArtworkName}</p><p><strong>Tác giả gốc:</strong> {selected.referenceArtistName}</p><p><strong>Nguồn:</strong> {selected.nguonTacPhamGoc || '—'}</p><p><strong>Quyền sử dụng:</strong> {selected.tinhTrangQuyenSuDung || '—'}</p><p><strong>Ghi chú quyền:</strong> {selected.moTaQuyenSuDung || '—'}</p></div>}
      {referencePreview && <img className="artist-reference" src={referencePreview} alt="Tham khảo" />}
      {selected.maHoaSi === artistId && ['ACCEPTED', 'IN_PROGRESS'].includes(selected.trangThai) && <div className="artist-quote"><h3>Báo giá</h3><input type="number" min="1" placeholder="Giá báo giá" value={quote.price} onChange={(e) => setQuote({ ...quote, price: e.target.value })} /><input placeholder="Thời gian hoàn thành" value={quote.time} onChange={(e) => setQuote({ ...quote, time: e.target.value })} /><textarea placeholder="Ghi chú" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} /><button className="artist-primary" onClick={submitQuote}>Gửi báo giá</button></div>}
    </div></div>}
  </div>;
};

export default ArtistCustomArt;
