import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CopyrightRecord, copyrightService } from '../../services/copyrightService';
import { artistDashboardService } from '../../services/artistDashboardService';
import './ArtistCopyright.css';
import './ArtistCopyrightOverrides.css';

const emptyForm = {
  tacGia: '', ngaySangTac: '', nguonGoc: '', moTaBanQuyen: '', ghiChu: '', laTacPhamDocBan: false,
  loaiTacPham: 0, tacGiaGoc: '', maTacPhamGoc: '', moTaNguonGoc: '', canCuSuDung: 1,
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const value = await copyrightService.artistGet(artworkId);
      setRecord(value);
      setForm({
        tacGia: value.tacGia || '', ngaySangTac: value.ngaySangTac?.slice(0, 10) || '',
        nguonGoc: value.nguonGoc || '', moTaBanQuyen: value.moTaBanQuyen || '', ghiChu: value.ghiChu || '',
        laTacPhamDocBan: value.laTacPhamDocBan, loaiTacPham: value.loaiTacPham,
        tacGiaGoc: value.tacGiaGoc || '', maTacPhamGoc: value.maTacPhamGoc?.toString() || '',
        moTaNguonGoc: value.moTaNguonGoc || '', canCuSuDung: value.canCuSuDungSo || 1,
        nguonThamKhao: value.nguonThamKhao || '', soDangKy: value.soDangKy || '',
      });
    } catch (error: any) {
      if (error?.response?.status !== 404) alert(error?.response?.data?.message || 'Không thể tải hồ sơ nguồn gốc');
      setRecord(null);
      if (error?.response?.status === 404) {
        try {
          const artwork = await artistDashboardService.getTacPhamById(artworkId);
          setForm({
            ...emptyForm,
            laTacPhamDocBan: artwork.laTacPhamDocBan,
            loaiTacPham: artwork.loaiTacPham === 2 ? 2 : 0,
            tacGiaGoc: artwork.tacGiaGoc || '',
            maTacPhamGoc: artwork.maTacPhamGoc?.toString() || '',
            moTaNguonGoc: artwork.moTaNguonGoc || '',
          });
        } catch (artworkError: any) {
          alert(artworkError?.response?.data?.message || 'Không thể tải khai báo phát hành của tác phẩm');
        }
      }
    } finally { setLoading(false); }
  }, [artworkId]);

  useEffect(() => { if (Number.isInteger(artworkId) && artworkId > 0) void load(); }, [artworkId, load]);
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
    maTacPhamGoc: form.maTacPhamGoc ? Number(form.maTacPhamGoc) : null,
    moTaNguonGoc: form.moTaNguonGoc || null, canCuSuDung: Number(form.canCuSuDung),
    nguonThamKhao: form.nguonThamKhao || null, soDangKy: form.soDangKy || null,
  });

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (record) await copyrightService.artistUpdate(record.maBanQuyen, payload());
      else await copyrightService.artistCreate(payload());
      await load(); alert('Đã lưu hồ sơ. Admin sẽ kiểm tra bằng chứng trước khi xác minh.');
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể lưu hồ sơ'); }
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
      <label>Loại tác phẩm<select value={form.loaiTacPham} onChange={e => setForm({...form, loaiTacPham:Number(e.target.value)})}><option value={0}>Tự sáng tác</option><option value={2}>Phiên bản vẽ lại</option></select></label>
      <label>Căn cứ sử dụng<select value={form.canCuSuDung} onChange={e => setForm({...form, canCuSuDung:Number(e.target.value)})}><option value={1}>Tác giả / chủ thể quyền</option><option value={2}>Phạm vi công cộng đã được xem xét</option><option value={3}>Có văn bản cho phép</option><option value={4}>Căn cứ hợp pháp khác</option><option value={5}>Chưa đủ căn cứ</option></select></label>
      <label className="wide">Mô tả nguồn gốc<input required value={form.nguonGoc} onChange={e => setForm({...form, nguonGoc:e.target.value})}/></label>
      <label>Định danh tác phẩm<select disabled value={form.laTacPhamDocBan ? 'exclusive' : 'multiple'}><option value="multiple">Nhiều bản</option><option value="exclusive">Độc bản (số lượng ban đầu là 1)</option></select><small>Loại phát hành được khai báo khi tạo tác phẩm và không thể đổi tại hồ sơ nguồn gốc.</small></label>
      <label>Số đăng ký (nếu có)<input value={form.soDangKy} onChange={e => setForm({...form, soDangKy:e.target.value})}/></label>
      {form.loaiTacPham === 2 && <><label>Tác giả gốc<input value={form.tacGiaGoc} onChange={e => setForm({...form, tacGiaGoc:e.target.value})}/></label><label>Mã tác phẩm gốc trong hệ thống<input type="number" min="1" value={form.maTacPhamGoc} onChange={e => setForm({...form, maTacPhamGoc:e.target.value})}/></label><label className="wide">Nguồn tham khảo<input value={form.nguonThamKhao} onChange={e => setForm({...form, nguonThamKhao:e.target.value})}/></label><label className="wide">Mô tả nguồn gốc tác phẩm gốc<textarea rows={3} value={form.moTaNguonGoc} onChange={e => setForm({...form, moTaNguonGoc:e.target.value})}/></label></>}
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
