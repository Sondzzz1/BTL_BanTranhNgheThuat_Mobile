import React, { useEffect, useMemo, useState } from 'react';
import { CopyrightAuditRecord, CopyrightRecord, copyrightService } from '../../services/copyrightService';
import { formatAuditAction, formatAuditActor, formatAuditChange } from '../../utils/copyrightAudit';
import './AdminCopyright.css';
import './AdminCopyrightOverrides.css';

const labels: Record<string, string> = {
  PENDING: 'Chờ duyệt', NEED_INFO: 'Cần bổ sung', VERIFIED: 'Đã xác minh', REJECTED: 'Từ chối',
  DISPUTED: 'Tranh chấp', LEGACY: 'Dữ liệu cũ', REVOKED: 'Đã thu hồi',
};
const MINIMUM_EVIDENCE_FOR_VERIFICATION = 2;
const isImageEvidence = (file: CopyrightRecord['bangChung'][number]) => file.loaiTep.startsWith('image/');

export default function AdminCopyright() {
  const [items, setItems] = useState<CopyrightRecord[]>([]);
  const [selected, setSelected] = useState<CopyrightRecord | null>(null);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [evidencePreviewUrls, setEvidencePreviewUrls] = useState<Record<number, string>>({});
  const [auditRows, setAuditRows] = useState<CopyrightAuditRecord[]>([]);

  const load = async () => {
    setLoading(true);
    try { setItems(await copyrightService.adminList(status || undefined, keyword || undefined)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải hồ sơ bản quyền'); }
    finally { setLoading(false); }
  };

  // Keyword chỉ được áp dụng khi người dùng bấm Tìm kiếm/Enter; đổi trạng thái thì tải lại ngay.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    const imageFiles = selected?.bangChung.filter(isImageEvidence) || [];
    setEvidencePreviewUrls({});

    void Promise.all(imageFiles.map(async file => {
      try {
        const blob = await copyrightService.downloadEvidence(file.duongDanTai);
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        return [file.maBangChung, url] as const;
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
  }, [selected]);
  const counts = useMemo(() => items.reduce<Record<string, number>>((acc, item) => {
    acc[item.trangThai] = (acc[item.trangThai] || 0) + 1; return acc;
  }, {}), [items]);

  const open = async (id: number) => {
    try {
      const detail = await copyrightService.adminDetail(id);
      setSelected(detail);
      setAuditRows(await copyrightService.adminAudit('TacPham', detail.maTacPham));
    }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải chi tiết'); }
  };

  const correctPublication = async () => {
    if (!selected) return;
    const kind = window.prompt('Nhập "doc-ban" hoặc "nhieu-ban".', selected.laTacPhamDocBan ? 'doc-ban' : 'nhieu-ban')?.trim().toLowerCase();
    if (!kind) return;
    if (kind !== 'doc-ban' && kind !== 'nhieu-ban') { alert('Chỉ chấp nhận "doc-ban" hoặc "nhieu-ban".'); return; }
    const quantity = Number(window.prompt('Số lượng phát hành ban đầu đã được đối soát:', String(selected.soLuongBanDau ?? selected.soLuongTon)));
    if (!Number.isInteger(quantity) || quantity <= 0) { alert('Số lượng ban đầu phải là số nguyên dương.'); return; }
    const reason = window.prompt('Nhập căn cứ kiểm tra/hiệu chỉnh (bắt buộc):')?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      await copyrightService.correctPublicationDeclaration(selected.maTacPham, {
        laTacPhamDocBan: kind === 'doc-ban', soLuongBanDau: quantity, canCuXacMinh: reason,
      });
      setSelected(null); await load();
      alert('Đã hiệu chỉnh. Hồ sơ đã xác minh trước đó (nếu có) đã được chuyển về chờ xác minh lại.');
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể hiệu chỉnh loại phát hành'); }
    finally { setBusy(false); }
  };

  const review = async (action: 'xac-minh' | 'yeu-cau-bo-sung' | 'tu-choi') => {
    if (!selected) return;
    const needsReason = action !== 'xac-minh';
    const missingEvidence = Math.max(0, MINIMUM_EVIDENCE_FOR_VERIFICATION - selected.bangChung.length);
    const suggestedNote = action === 'yeu-cau-bo-sung' && missingEvidence > 0
      ? `Vui lòng bổ sung tối thiểu ${missingEvidence} bằng chứng nữa để hồ sơ có đủ ${MINIMUM_EVIDENCE_FOR_VERIFICATION} bằng chứng trước khi xác minh.`
      : '';
    const note = window.prompt(
      needsReason ? 'Nhập lý do bắt buộc:' : 'Ghi chú kiểm duyệt (không bắt buộc):',
      suggestedNote
    )?.trim();
    if (needsReason && !note) return;
    setBusy(true);
    try { await copyrightService.review(selected.maBanQuyen, action, note); setSelected(null); await load(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể cập nhật kiểm duyệt'); }
    finally { setBusy(false); }
  };

  const revoke = async () => {
    if (!selected) return;
    const reason = window.prompt('Lý do thu hồi xác minh:')?.trim();
    if (!reason) return;
    setBusy(true);
    try { await copyrightService.revokeVerification(selected.maBanQuyen, reason, true); setSelected(null); await load(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể thu hồi'); }
    finally { setBusy(false); }
  };

  const openEvidence = async (file: CopyrightRecord['bangChung'][number]) => {
    try {
      const blob = await copyrightService.downloadEvidence(file.duongDanTai);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { alert('Không thể mở tệp bằng chứng'); }
  };

  const evidenceCount = selected?.bangChung.length ?? 0;
  const missingEvidence = Math.max(0, MINIMUM_EVIDENCE_FOR_VERIFICATION - evidenceCount);
  const canVerifySelected = !!selected && selected.trangThai === 'PENDING' && missingEvidence === 0;

  return <div className="copyright-admin-page">
    <header className="copyright-page-header">
      <div><p className="copyright-eyebrow">NGUỒN GỐC & SỞ HỮU</p><h1>Quản lý bản quyền tác phẩm</h1><p>Kiểm tra bằng chứng, nguồn gốc và trạng thái chặn bán trước khi xác minh.</p></div>
      <div className="copyright-metrics"><span>{items.length}<small>Hồ sơ</small></span><span>{counts.PENDING || 0}<small>Chờ duyệt</small></span><span>{counts.VERIFIED || 0}<small>Đã xác minh</small></span></div>
    </header>
    <div className="copyright-toolbar">
      <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} placeholder="Tìm tác phẩm, họa sĩ, tác giả..." />
      <select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
      <button onClick={() => void load()}>Tìm kiếm</button>
    </div>
    <div className="copyright-table-wrap"><table><thead><tr><th>Tác phẩm</th><th>Họa sĩ</th><th>Phân loại</th><th>Số lượng</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={6} className="copyright-empty">Đang tải...</td></tr> : items.length === 0 ? <tr><td colSpan={6} className="copyright-empty">Không có hồ sơ phù hợp.</td></tr> : items.map(item => <tr key={item.maBanQuyen}>
        <td><strong>{item.tenTacPham}</strong><small>#{item.maTacPham} · {item.tacGia}</small></td><td>{item.tenHoaSi}</td><td>{item.loaiTacPhamText}<small>{item.laTacPhamDocBan ? 'Độc bản' : 'Nhiều bản / chưa định danh'}</small></td>
        <td>{item.soLuongTon} / {item.soLuongBanDau ?? 'chưa đối soát'}<small>{item.soDonHang} đơn đã phát sinh</small></td><td><span className={`copyright-status ${item.trangThai.toLowerCase()}`}>{labels[item.trangThai] || item.trangThai}</span>{item.biChanBan && <small className="blocked-note">Đang chặn bán</small>}</td>
        <td><button className="detail-button" onClick={() => void open(item.maBanQuyen)}>Xem hồ sơ</button></td></tr>)}</tbody></table></div>

    {selected && <div className="copyright-overlay" onMouseDown={() => !busy && setSelected(null)}><section className="copyright-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="copyright-modal-head"><div><p className="copyright-eyebrow">HỒ SƠ #{selected.maBanQuyen}</p><h2>{selected.tenTacPham}</h2><p>{selected.tenHoaSi} · {selected.loaiTacPhamText}</p></div><button onClick={() => setSelected(null)} disabled={busy}>×</button></div>
      <div className="copyright-alert"><strong>Lưu ý pháp lý</strong><span>Xác minh nguồn gốc không chuyển quyền tác giả. Chứng nhận sau bán chỉ ghi nhận quyền sở hữu hiện vật.</span></div>
      <div className="copyright-grid"><div><label>Tác giả khai báo</label><p>{selected.tacGia}</p></div><div><label>Căn cứ sử dụng</label><p>{selected.canCuSuDung}</p></div><div><label>Tác giả gốc</label><p>{selected.tacGiaGoc || 'Không áp dụng'}</p></div><div><label>Loại phát hành</label><p>{selected.laTacPhamDocBan ? 'Tranh độc bản' : 'Tranh nhiều bản'} · ban đầu {selected.soLuongBanDau ?? 'chưa đối soát'} · tồn {selected.soLuongTon}</p></div><div><label>Đơn hàng đã phát sinh</label><p>{selected.soDonHang}</p></div><div><label>Nguồn tham khảo</label><p>{selected.nguonThamKhao || 'Chưa cung cấp'}</p></div></div>
      {selected.moTaNguonGoc && <div className="copyright-copy"><label>Mô tả nguồn gốc</label><p>{selected.moTaNguonGoc}</p></div>}
      {auditRows.length > 0 && <section className="copyright-copy"><label>Nhật ký thay đổi liên quan</label><ul>{auditRows.slice(0, 5).map(row => <li key={row.maNhatKy}><strong>{formatAuditAction(row)}</strong> · {formatAuditActor(row)} · {new Date(row.thoiGian).toLocaleString('vi-VN')} · {formatAuditChange(row)}</li>)}</ul></section>}
      <h3>Bằng chứng ({evidenceCount}/10)</h3><div className="evidence-list">{selected.bangChung.map(file => <button type="button" className="evidence-preview-card" key={file.maBangChung} onClick={() => void openEvidence(file)} title="Mở tệp bằng chứng"><span className="evidence-preview-frame">{isImageEvidence(file) && evidencePreviewUrls[file.maBangChung] ? <img src={evidencePreviewUrls[file.maBangChung]} alt={`Bằng chứng: ${file.tenTepGoc}`} /> : <span className="evidence-file-type">{isImageEvidence(file) ? 'Đang tải ảnh' : 'PDF'}</span>}</span><span className="evidence-preview-copy"><strong>{file.tenTepGoc}</strong><span>{file.moTa || file.loaiTep}</span><code>{file.sha256 || 'Chưa có SHA-256'}</code></span></button>)}</div>
      {selected.trangThai === 'PENDING' && missingEvidence > 0 && <div className="verification-gate" role="status"><strong>Chưa thể xác minh hồ sơ này</strong><span>Cần tối thiểu {MINIMUM_EVIDENCE_FOR_VERIFICATION} bằng chứng; hiện có {evidenceCount}/{MINIMUM_EVIDENCE_FOR_VERIFICATION}. Hãy gửi “Yêu cầu bổ sung” để họa sĩ tải thêm tài liệu.</span></div>}
      <div className="copyright-actions"><button className="neutral" disabled={busy} title="Chỉ dùng khi chưa có đơn hàng, ownership hoặc chứng nhận" onClick={() => void correctPublication()}>Hiệu chỉnh phát hành</button>{selected.trangThai === 'PENDING' && <><button className="neutral" disabled={busy} onClick={() => void review('yeu-cau-bo-sung')}>Yêu cầu bổ sung</button><button className="danger" disabled={busy} onClick={() => void review('tu-choi')}>Từ chối</button><button className="primary" disabled={busy || !canVerifySelected} title={canVerifySelected ? 'Xác minh hồ sơ' : `Cần thêm ${missingEvidence} bằng chứng để xác minh`} onClick={() => void review('xac-minh')}>Xác minh</button></>}{selected.trangThai === 'VERIFIED' && <button className="danger" disabled={busy} onClick={() => void revoke()}>Thu hồi xác minh</button>}</div>
    </section></div>}
  </div>;
}
