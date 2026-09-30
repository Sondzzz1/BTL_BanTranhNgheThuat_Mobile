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
  const [completionTarget, setCompletionTarget] = useState<CustomArtRequestApi | null>(null);
  const [completionForm, setCompletionForm] = useState<{ note: string; image?: File }>({ note: '' });
  const [referencePreview, setReferencePreview] = useState<string>();
  const [progressPreviews, setProgressPreviews] = useState<Record<number, string>>({});
  const [progressUploadPreview, setProgressUploadPreview] = useState<string>();
  const [completionUploadPreview, setCompletionUploadPreview] = useState<string>();

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
  useEffect(() => () => {
    if (progressUploadPreview?.startsWith('blob:')) URL.revokeObjectURL(progressUploadPreview);
  }, [progressUploadPreview]);
  useEffect(() => () => {
    if (completionUploadPreview?.startsWith('blob:')) URL.revokeObjectURL(completionUploadPreview);
  }, [completionUploadPreview]);

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
      setProgressUploadPreview(undefined);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể tải chi tiết.');
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setReferencePreview(undefined);
    setProgressPreviews({});
    setProgressUploadPreview(undefined);
  };

  const run = async (action: () => Promise<any>, success: string) => {
    try { await action(); setMessage(success); closeDetail(); await load(); }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể thực hiện thao tác.'); }
  };

  const submitQuote = async () => {
    if (!selected || !quote.price || !quote.time) return setMessage('Vui lòng nhập giá và ngày hoàn thành.');
    await run(() => customArtService.createQuote({
      MaYeuCau: selected.maYeuCau,
      GiaBaoGia: Number(quote.price),
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
      setProgressUploadPreview(undefined);
      await loadDetail(selected.maYeuCau);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể đăng tiến độ.');
    }
  };

  const openCompletion = (item: CustomArtRequestApi) => {
    setCompletionTarget(item);
    setCompletionForm({ note: '' });
    setCompletionUploadPreview(undefined);
  };

  const selectProgressImage = (file?: File) => {
    setProgressForm((current) => ({ ...current, image: file }));
    setProgressUploadPreview(file ? URL.createObjectURL(file) : undefined);
  };

  const selectCompletionImage = (file?: File) => {
    setCompletionForm((current) => ({ ...current, image: file }));
    setCompletionUploadPreview(file ? URL.createObjectURL(file) : undefined);
  };

  const closeCompletion = () => {
    setCompletionTarget(null);
    setCompletionForm({ note: '' });
    setCompletionUploadPreview(undefined);
  };

  const submitCompletion = async () => {
    if (!completionTarget || !completionForm.image) {
      return setMessage('Ảnh tác phẩm hoàn thiện là bắt buộc.');
    }
    try {
      await customArtService.complete(completionTarget.maYeuCau, {
        image: completionForm.image,
        note: completionForm.note.trim() || undefined,
        title: completionTarget.tieuDe,
      });
      setMessage('Đã lưu tác phẩm hoàn thiện và chuyển yêu cầu sang COMPLETED.');
      closeCompletion();
      closeDetail();
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể hoàn thành tác phẩm.');
    }
  };

  return <div className="artist-commission">
    <div className="artist-commission-header"><div><h2>Yêu cầu tranh đã duyệt</h2><p>Chỉ hiển thị yêu cầu APPROVED hoặc yêu cầu do bạn nhận.</p></div><button className="artist-secondary" onClick={load}>Làm mới</button></div>
    {message && <div className="artist-commission-message">{message}</div>}
    {loading ? <p>Đang tải...</p> : <div className="artist-commission-grid">
      {items.map((item) => {
        const mine = item.maHoaSi === artistId;
        const canUpdateProgress = mine && ['InProgress', 'PreviewSent', 'RevisionRequested'].includes(item.trangThaiNoiBo || '');
        return <article className="artist-commission-card" key={item.maYeuCau}>
          <span className="artist-commission-badge">{getCustomArtStatusLabel(item.trangThai)}</span>
          <h3>{item.tieuDe}</h3>
          <p className="artist-commission-meta">{getCustomArtTypeLabel(item.type)} · {item.loaiTranh} · {item.kichThuoc}</p>
          <p>{item.moTa || 'Không có mô tả'}</p>
          {!!item.soLuongTienDo && <div className="artist-progress-alert">✓ Đã có {item.soLuongTienDo} cập nhật tiến độ</div>}
          {item.type === 'EXISTING_ARTWORK' && <p><strong>Tác giả gốc:</strong> {item.referenceArtistName}</p>}
          <div className="artist-commission-actions">
            <button className="artist-secondary" onClick={() => openDetail(item)}>Chi tiết</button>
            {canUpdateProgress && <button className="artist-primary" onClick={() => openDetail(item)}>Cập nhật tiến độ</button>}
            {!item.maHoaSi && item.trangThai === 'APPROVED' && <button className="artist-primary" onClick={() => run(() => customArtService.claimRequest(item.maYeuCau), 'Đã nhận yêu cầu.')}>Nhận yêu cầu</button>}
            {mine && ['CustomerAccepted', 'DepositPaid'].includes(item.trangThaiNoiBo || '') && <button className="artist-primary" onClick={() => run(() => customArtService.updateStatus(item.maYeuCau, 'IN_PROGRESS'), 'Đã bắt đầu thực hiện.')}>Bắt đầu</button>}
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
      {selected.maHoaSi === artistId && ['Assigned', 'Quoted'].includes(selected.trangThaiNoiBo || '') && <div className="artist-quote"><h3>Báo giá</h3><input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Giá báo giá" value={quote.price} onChange={(e) => setQuote({ ...quote, price: e.target.value.replace(/\D/g, '') })} />{!!quote.price && <small className="artist-money-preview">Hiển thị: {formatVnd(Number(quote.price))}</small>}<input type="date" value={quote.time} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setQuote({ ...quote, time: e.target.value })} /><textarea placeholder="Ghi chú" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} /><button className="artist-primary" onClick={submitQuote}>Gửi báo giá</button></div>}
      <div className="artist-source"><h3>Tiến độ</h3>{(selected.progress || []).length ? selected.progress.map((entry) => <div key={entry.maTienDo} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}><strong>{new Date(entry.ngayTao).toLocaleDateString('vi-VN')} — {entry.tieuDe}</strong><p>{entry.moTa}</p>{progressPreviews[entry.maTienDo] && <img className="artist-reference" src={progressPreviews[entry.maTienDo]} alt={entry.tieuDe} />}</div>) : <p>Chưa có cập nhật tiến độ.</p>}</div>
      {selected.maHoaSi === artistId && ['InProgress', 'PreviewSent', 'RevisionRequested'].includes(selected.trangThaiNoiBo || '') && <>
        <div className="artist-quote"><h3>Cập nhật tiến độ</h3><input placeholder="Tiêu đề tiến độ" value={progressForm.title} onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })} /><textarea placeholder="Mô tả tiến độ" value={progressForm.description} onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectProgressImage(e.target.files?.[0])} />{progressUploadPreview && <div className="artist-upload-preview-box"><span>Ảnh tiến độ đã chọn</span><img className="artist-upload-preview" src={progressUploadPreview} alt="Xem trước ảnh tiến độ" /></div>}<button className="artist-primary" onClick={submitProgress}>Đăng tiến độ</button></div>
        {(selected.progress || []).some((entry) => entry.trangThai?.toUpperCase() !== 'COMPLETED')
          ? <div className="artist-completion-ready"><strong>Đã có tiến độ thực hiện.</strong><span>Bạn có thể hoàn thành tác phẩm khi đã sẵn sàng.</span><button className="artist-success artist-complete-submit" onClick={() => openCompletion(selected)}>Hoàn thành tác phẩm</button></div>
          : <div className="artist-progress-required">Hãy đăng ít nhất một cập nhật tiến độ trước khi hoàn thành tác phẩm.</div>}
      </>}
    </div></div>}

    {completionTarget && <div className="artist-modal-overlay" onMouseDown={closeCompletion}><div className="artist-modal artist-completion-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="artist-modal-top"><div><h2>Hoàn thành tác phẩm</h2><p>{completionTarget.tieuDe}</p></div><button className="artist-secondary" onClick={closeCompletion}>Đóng</button></div>
      <div className="artist-quote">
        <label>Ảnh tác phẩm hoàn thiện *</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectCompletionImage(e.target.files?.[0])} />
        {completionForm.image && <small>Đã chọn: {completionForm.image.name}</small>}
        {completionUploadPreview && <div className="artist-upload-preview-box"><span>Ảnh tác phẩm hoàn thiện đã chọn</span><img className="artist-upload-preview" src={completionUploadPreview} alt="Xem trước tác phẩm hoàn thiện" /></div>}
        <label>Ghi chú hoàn thiện</label>
        <textarea placeholder="Ghi chú gửi khách hàng (không bắt buộc)" value={completionForm.note} onChange={(e) => setCompletionForm({ ...completionForm, note: e.target.value })} />
        <button className="artist-success artist-complete-submit" onClick={submitCompletion}>Lưu tác phẩm hoàn thiện</button>
      </div>
    </div></div>}
  </div>;
};

export default ArtistCustomArt;
