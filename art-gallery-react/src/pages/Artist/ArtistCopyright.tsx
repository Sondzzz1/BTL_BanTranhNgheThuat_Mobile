import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CopyrightRecord, copyrightService } from '../../services/copyrightService';
import { artistDashboardService, OriginalArtworkOption } from '../../services/artistDashboardService';
import './ArtistCopyright.css';
import './ArtistCopyrightOverrides.css';

const emptyForm = {
  tacGia: '', ngaySangTac: '', nguonGoc: '', moTaBanQuyen: '', ghiChu: '', laTacPhamDocBan: false,
  loaiTacPham: 0, tacGiaGoc: '', maTacPhamGoc: '', tenTacPhamGoc: '', khongXacDinhTacGiaGoc: false,
  moTaNguonGoc: '', canCuSuDung: 1,
  nguonThamKhao: '', soDangKy: '',
};

const isImageEvidence = (file: CopyrightRecord['bangChung'][number]) => file.loaiTep.startsWith('image/');

export default function ArtistCopyright() {
  const { id = '' } = useParams();
  const artworkId = Number(id);
  const navigate = useNavigate();
  const [record, setRecord] = useState<CopyrightRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidencePreviewUrls, setEvidencePreviewUrls] = useState<Record<number, string>>({});
  const [originMethod, setOriginMethod] = useState<'catalog' | 'external'>('catalog');
  const [originSearch, setOriginSearch] = useState('');
  const [originResults, setOriginResults] = useState<OriginalArtworkOption[]>([]);
  const [selectedOriginal, setSelectedOriginal] = useState<OriginalArtworkOption | null>(null);
  const [initialQuantity, setInitialQuantity] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const value = await copyrightService.artistGet(artworkId);
      setRecord(value);
      setInitialQuantity(value.soLuongBanDau ?? null);
      setForm({
        tacGia: value.tacGia || '', ngaySangTac: value.ngaySangTac?.slice(0, 10) || '',
        nguonGoc: value.nguonGoc || '', moTaBanQuyen: value.moTaBanQuyen || '', ghiChu: value.ghiChu || '',
        laTacPhamDocBan: value.laTacPhamDocBan, loaiTacPham: value.loaiTacPham,
        tacGiaGoc: value.tacGiaGoc || '', maTacPhamGoc: value.maTacPhamGoc?.toString() || '',
        tenTacPhamGoc: value.tenTacPhamGoc || '', khongXacDinhTacGiaGoc: value.khongXacDinhTacGiaGoc || false,
        moTaNguonGoc: value.moTaNguonGoc || '', canCuSuDung: value.canCuSuDungSo || 1,
        nguonThamKhao: value.nguonThamKhao || '', soDangKy: value.soDangKy || '',
      });
      setOriginMethod(value.maTacPhamGoc || !value.tenTacPhamGoc ? 'catalog' : 'external');
      setSelectedOriginal(value.maTacPhamGoc
        ? await artistDashboardService.getPublicOriginalArtwork(value.maTacPhamGoc).catch(() => null)
        : null);
    } catch (error: any) {
      if (error?.response?.status !== 404) alert(error?.response?.data?.message || 'Không thể tải hồ sơ nguồn gốc');
      setRecord(null);
      if (error?.response?.status === 404) {
        try {
          const artwork = await artistDashboardService.getTacPhamById(artworkId);
          setInitialQuantity(artwork.soLuongBanDau ?? null);
          setForm({
            ...emptyForm,
            laTacPhamDocBan: artwork.laTacPhamDocBan,
            loaiTacPham: artwork.loaiTacPham === 2 || artwork.loaiTacPham === 4 ? artwork.loaiTacPham : 0,
            tacGiaGoc: artwork.tacGiaGoc || '',
            maTacPhamGoc: artwork.maTacPhamGoc?.toString() || '',
            tenTacPhamGoc: artwork.tenTacPhamGoc || '',
            khongXacDinhTacGiaGoc: artwork.khongXacDinhTacGiaGoc || false,
            nguonThamKhao: artwork.nguonThamKhao || '',
            moTaNguonGoc: artwork.moTaNguonGoc || '',
          });
          setOriginMethod(artwork.maTacPhamGoc || !artwork.tenTacPhamGoc ? 'catalog' : 'external');
          setSelectedOriginal(artwork.maTacPhamGoc
            ? await artistDashboardService.getPublicOriginalArtwork(artwork.maTacPhamGoc).catch(() => null)
            : null);
        } catch (artworkError: any) {
          alert(artworkError?.response?.data?.message || 'Không thể tải khai báo phát hành của tác phẩm');
        }
      }
    } finally { setLoading(false); }
  }, [artworkId]);

  useEffect(() => { if (Number.isInteger(artworkId) && artworkId > 0) void load(); }, [artworkId, load]);
  useEffect(() => {
    if (form.loaiTacPham !== 2 || originMethod !== 'catalog' || originSearch.trim().length < 2) {
      setOriginResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void artistDashboardService.searchOriginalArtworks(originSearch.trim())
        .then(items => { if (active) setOriginResults(items.filter(item => item.maTacPham !== artworkId).slice(0, 10)); })
        .catch(() => { if (active) setOriginResults([]); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [form.loaiTacPham, originMethod, originSearch, artworkId]);
  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    const imageFiles = record?.bangChung.filter(isImageEvidence) || [];
    setEvidencePreviewUrls({});

    void Promise.all(imageFiles.map(async item => {
      try {
        const blob = await copyrightService.downloadEvidence(item.duongDanTai);
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        return [item.maBangChung, url] as const;
      } catch {
        return null;
      }
    })).then(previews => {
      if (cancelled) return;
      setEvidencePreviewUrls(Object.fromEntries(previews.filter((item): item is readonly [number, string] => item !== null)));
    });

    return () => {
      cancelled = true;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [record]);

  const payload = () => ({
    ...(record ? {} : { maTacPham: artworkId, laTacPhamDocBan: form.laTacPhamDocBan }),
    tacGia: form.tacGia, ngaySangTac: form.ngaySangTac || null, nguonGoc: form.nguonGoc,
    moTaBanQuyen: form.moTaBanQuyen || null, ghiChu: form.ghiChu || null,
    loaiTacPham: Number(form.loaiTacPham), tacGiaGoc: form.tacGiaGoc || null,
    maTacPhamGoc: form.loaiTacPham === 2 && originMethod === 'catalog' ? selectedOriginal?.maTacPham || null : null,
    tenTacPhamGoc: form.loaiTacPham === 2 && originMethod === 'external' ? form.tenTacPhamGoc || null : null,
    khongXacDinhTacGiaGoc: form.loaiTacPham === 2 && originMethod === 'external' && form.khongXacDinhTacGiaGoc,
    moTaNguonGoc: form.moTaNguonGoc || null, canCuSuDung: Number(form.canCuSuDung),
    nguonThamKhao: form.nguonThamKhao || null, soDangKy: form.soDangKy || null,
  });

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (form.loaiTacPham === 2 && originMethod === 'catalog' && !selectedOriginal)
        throw new Error('Vui lòng chọn tác phẩm gốc trong kết quả tìm kiếm.');
      if (form.loaiTacPham === 2 && originMethod === 'external'
        && (!form.tenTacPhamGoc.trim() || (!form.tacGiaGoc.trim() && !form.khongXacDinhTacGiaGoc)))
        throw new Error('Vui lòng nhập tên tác phẩm gốc và tác giả, hoặc đánh dấu không xác định tác giả.');
      if (form.loaiTacPham === 4 && (!form.nguonThamKhao.trim() || !form.moTaNguonGoc.trim()))
        throw new Error('Vui lòng nhập nguồn tham khảo và mô tả cách sử dụng nguồn.');
      if (record) await copyrightService.artistUpdate(record.maBanQuyen, payload());
      else await copyrightService.artistCreate(payload());
      await load(); alert('Đã lưu hồ sơ. Admin sẽ kiểm tra bằng chứng trước khi xác minh.');
    } catch (error: any) { alert(error?.response?.data?.message || error?.message || 'Không thể lưu hồ sơ'); }
    finally { setSaving(false); }
  };

  const upload = async () => {
    if (!record || !file) return;
    try { await copyrightService.artistAddEvidence(record.maBanQuyen, file, evidenceNote.trim() || undefined); setFile(null); setEvidenceNote(''); await load(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải bằng chứng'); }
  };

  const removeEvidence = async (evidenceId: number) => {
    if (!record || !window.confirm('Xóa bằng chứng này?')) return;
    try { await copyrightService.artistDeleteEvidence(record.maBanQuyen, evidenceId); await load(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể xóa bằng chứng'); }
  };

  const openEvidence = async (item: CopyrightRecord['bangChung'][number]) => {
    try {
      const blob = await copyrightService.downloadEvidence(item.duongDanTai);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('Không thể mở tệp bằng chứng');
    }
  };

  if (loading) return <div className="artist-copyright-page">Đang tải...</div>;
  return <div className="artist-copyright-page">
    <button className="back-button" onClick={() => navigate('/artist/artworks')}>← Tác phẩm của tôi</button>
    <header><div><p>NGUỒN GỐC VÀ XÁC MINH</p><h1>{record?.tenTacPham || `Tác phẩm #${artworkId}`}</h1><span>Khai báo nguồn gốc không đồng nghĩa với được xác minh hoặc chuyển quyền tác giả.</span></div>{record && <strong className={`artist-copyright-status ${record.trangThai.toLowerCase()}`}>{record.trangThai}</strong>}</header>
    {record?.ghiChuKiemDuyet && <div className="review-note"><strong>Phản hồi của Admin</strong><span>{record.ghiChuKiemDuyet}</span></div>}
    {record?.biChanBan && <div className="review-note danger"><strong>Tác phẩm đang bị chặn bán</strong><span>{record.lyDoThuHoiXacMinh || 'Liên hệ Admin để được hỗ trợ.'}</span></div>}
    <form onSubmit={save} className="artist-copyright-form">
      <label>Tác giả khai báo<input required value={form.tacGia} onChange={e => setForm({...form, tacGia:e.target.value})}/></label>
      <label>Ngày sáng tác<input type="date" value={form.ngaySangTac} onChange={e => setForm({...form, ngaySangTac:e.target.value})}/></label>
      <label>Loại tác phẩm<select value={form.loaiTacPham} onChange={e => { setForm({...form, loaiTacPham:Number(e.target.value)}); setSelectedOriginal(null); }}><option value={0}>Tự sáng tác</option><option value={2}>Phiên bản vẽ lại / phái sinh</option><option value={4}>Dựa trên tư liệu tham khảo</option></select></label>
      <label>Căn cứ sử dụng<select value={form.canCuSuDung} onChange={e => setForm({...form, canCuSuDung:Number(e.target.value)})}><option value={1}>Tác giả / chủ thể quyền</option><option value={2}>Phạm vi công cộng đã được xem xét</option><option value={3}>Có văn bản cho phép</option><option value={4}>Căn cứ hợp pháp khác</option><option value={5}>Chưa đủ căn cứ</option></select></label>
      <label className="wide">Mô tả nguồn gốc<input required value={form.nguonGoc} onChange={e => setForm({...form, nguonGoc:e.target.value})}/></label>
      <label>Loại phát hành<select disabled value={form.laTacPhamDocBan ? 'exclusive' : 'multiple'}><option value="multiple">Nhiều bản</option><option value="exclusive">Độc bản</option></select><small>Số lượng ban đầu: {initialQuantity ?? 'chưa đối soát'} bản. Loại phát hành không đổi khi sửa nguồn gốc; tồn kho hiện tại không quyết định độc bản hay nhiều bản.</small></label>
      <label>Số đăng ký (nếu có)<input value={form.soDangKy} onChange={e => setForm({...form, soDangKy:e.target.value})}/></label>
      {form.loaiTacPham === 2 && <div className="wide">
        <p>Chọn một tác phẩm gốc trên hệ thống hoặc khai báo tác phẩm ngoài hệ thống.</p>
        <label><input type="radio" checked={originMethod === 'catalog'} onChange={() => { setOriginMethod('catalog'); setSelectedOriginal(null); }} /> Trên hệ thống</label>{' '}
        <label><input type="radio" checked={originMethod === 'external'} onChange={() => { setOriginMethod('external'); setSelectedOriginal(null); }} /> Ngoài hệ thống</label>
        {originMethod === 'catalog' ? <div>
          {selectedOriginal ? <p><strong>{selectedOriginal.tenTacPham}</strong> — {selectedOriginal.tenHoaSi} <button type="button" onClick={() => setSelectedOriginal(null)}>Đổi</button></p> : <>
            <label>Tìm tác phẩm gốc theo tên tranh hoặc họa sĩ<input type="search" value={originSearch} onChange={e => setOriginSearch(e.target.value)} placeholder="Nhập ít nhất 2 ký tự" /></label>
            {originResults.map(item => <button type="button" key={item.maTacPham} onClick={() => { setSelectedOriginal(item); setOriginSearch(''); }} style={{display:'block',width:'100%',textAlign:'left',padding:8}}>{item.hinhAnh && <img src={item.hinhAnh} alt="" style={{width:36,height:36,objectFit:'cover',verticalAlign:'middle',marginRight:8}} />}{item.tenTacPham} — {item.tenHoaSi}</button>)}
          </>}
        </div> : <div>
          <label>Tên tác phẩm gốc<input required value={form.tenTacPhamGoc} onChange={e => setForm({...form, tenTacPhamGoc:e.target.value})} /></label>
          <label>Tác giả gốc<input value={form.tacGiaGoc} disabled={form.khongXacDinhTacGiaGoc} onChange={e => setForm({...form, tacGiaGoc:e.target.value})} /></label>
          <label><input type="checkbox" checked={form.khongXacDinhTacGiaGoc} onChange={e => setForm({...form, khongXacDinhTacGiaGoc:e.target.checked, tacGiaGoc:e.target.checked ? '' : form.tacGiaGoc})} /> Không xác định được tác giả gốc</label>
        </div>}
      </div>}
      {form.loaiTacPham !== 0 && <><label className="wide">Nguồn tham khảo<input required={form.loaiTacPham === 4} value={form.nguonThamKhao} onChange={e => setForm({...form, nguonThamKhao:e.target.value})}/></label><label className="wide">Mô tả nguồn gốc / cách sử dụng nguồn<textarea required={form.loaiTacPham === 4} rows={3} value={form.moTaNguonGoc} onChange={e => setForm({...form, moTaNguonGoc:e.target.value})}/></label></>}
      <label className="wide">Mô tả quyền và phạm vi sử dụng<textarea rows={3} value={form.moTaBanQuyen} onChange={e => setForm({...form, moTaBanQuyen:e.target.value})}/></label>
      <label className="wide">Ghi chú<textarea rows={2} value={form.ghiChu} onChange={e => setForm({...form, ghiChu:e.target.value})}/></label>
      <div className="wide form-actions"><button disabled={saving}>{saving ? 'Đang lưu...' : record ? 'Cập nhật và gửi lại kiểm tra' : 'Tạo hồ sơ chờ kiểm tra'}</button></div>
    </form>
    {record && (
      <section className="artist-evidence">
        <h2>Bằng chứng ({record.bangChung.length}/10)</h2>
        <p>JPG, PNG, WEBP hoặc PDF; tối đa 5 MB/tệp. Ảnh sẽ hiển thị bản xem trước. Tệp chỉ Admin và chủ hồ sơ được xem.</p>
        <div className="evidence-upload">
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          <input value={evidenceNote} onChange={e => setEvidenceNote(e.target.value)} placeholder="Mô tả bằng chứng" />
          <button type="button" disabled={!file} onClick={() => void upload()}>Tải lên</button>
        </div>
        <div className="artist-evidence-list">
          {record.bangChung.map(item => {
            const previewUrl = evidencePreviewUrls[item.maBangChung];
            return (
              <article key={item.maBangChung}>
                <button type="button" className="artist-evidence-preview" onClick={() => void openEvidence(item)} title="Mở tệp bằng chứng">
                  <span className="artist-evidence-preview-frame">
                    {isImageEvidence(item) && previewUrl ? <img src={previewUrl} alt={`Bằng chứng: ${item.tenTepGoc}`} /> : <span>{isImageEvidence(item) ? 'Đang tải ảnh' : 'PDF'}</span>}
                  </span>
                  <span className="artist-evidence-copy"><strong>{item.tenTepGoc}</strong><span>{item.moTa || item.loaiTep}</span><code>{item.sha256}</code></span>
                </button>
                {['PENDING', 'NEED_INFO', 'REJECTED'].includes(record.trangThai) && <button onClick={() => void removeEvidence(item.maBangChung)}>Xóa</button>}
              </article>
            );
          })}
        </div>
      </section>
    )}
  </div>;
}
