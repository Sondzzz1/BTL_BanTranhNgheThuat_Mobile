import React, { useEffect, useMemo, useState } from 'react';
import { CopyrightRecord, copyrightService } from '../../services/copyrightService';
import './AdminCopyright.css';
import './AdminCopyrightOverrides.css';

const labels: Record<string, string> = {
  PENDING: 'Chờ duyệt', NEED_INFO: 'Cần bổ sung', VERIFIED: 'Đã xác minh', REJECTED: 'Từ chối',
  DISPUTED: 'Tranh chấp', LEGACY: 'Dữ liệu cũ', REVOKED: 'Đã thu hồi',
};

export default function AdminCopyright() {
  const [items, setItems] = useState<CopyrightRecord[]>([]);
  const [selected, setSelected] = useState<CopyrightRecord | null>(null);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await copyrightService.adminList(status || undefined, keyword || undefined)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải hồ sơ bản quyền'); }
    finally { setLoading(false); }
  };

  // Keyword chỉ được áp dụng khi người dùng bấm Tìm kiếm/Enter; đổi trạng thái thì tải lại ngay.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [status]);
  const counts = useMemo(() => items.reduce<Record<string, number>>((acc, item) => {
    acc[item.trangThai] = (acc[item.trangThai] || 0) + 1; return acc;
  }, {}), [items]);

  const open = async (id: number) => {
    try { setSelected(await copyrightService.adminDetail(id)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải chi tiết'); }
  };

  const review = async (action: 'xac-minh' | 'yeu-cau-bo-sung' | 'tu-choi') => {
    if (!selected) return;
    const needsReason = action !== 'xac-minh';
    const note = window.prompt(needsReason ? 'Nhập lý do bắt buộc:' : 'Ghi chú kiểm duyệt (không bắt buộc):')?.trim();
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
        <td>{item.soLuongTon} / {item.soLuongBanDau ?? 'chưa đối soát'}</td><td><span className={`copyright-status ${item.trangThai.toLowerCase()}`}>{labels[item.trangThai] || item.trangThai}</span>{item.biChanBan && <small className="blocked-note">Đang chặn bán</small>}</td>
        <td><button className="detail-button" onClick={() => void open(item.maBanQuyen)}>Xem hồ sơ</button></td></tr>)}</tbody></table></div>

    {selected && <div className="copyright-overlay" onMouseDown={() => !busy && setSelected(null)}><section className="copyright-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="copyright-modal-head"><div><p className="copyright-eyebrow">HỒ SƠ #{selected.maBanQuyen}</p><h2>{selected.tenTacPham}</h2><p>{selected.tenHoaSi} · {selected.loaiTacPhamText}</p></div><button onClick={() => setSelected(null)} disabled={busy}>×</button></div>
      <div className="copyright-alert"><strong>Lưu ý pháp lý</strong><span>Xác minh nguồn gốc không chuyển quyền tác giả. Chứng nhận sau bán chỉ ghi nhận quyền sở hữu hiện vật.</span></div>
      <div className="copyright-grid"><div><label>Tác giả khai báo</label><p>{selected.tacGia}</p></div><div><label>Căn cứ sử dụng</label><p>{selected.canCuSuDung}</p></div><div><label>Tác giả gốc</label><p>{selected.tacGiaGoc || 'Không áp dụng'}</p></div><div><label>Số lượng</label><p>Tồn {selected.soLuongTon} · Ban đầu {selected.soLuongBanDau ?? 'chưa đối soát'}</p></div></div>
      {selected.moTaNguonGoc && <div className="copyright-copy"><label>Mô tả nguồn gốc</label><p>{selected.moTaNguonGoc}</p></div>}
      <h3>Bằng chứng ({selected.bangChung.length}/10)</h3><div className="evidence-list">{selected.bangChung.map(file => <button type="button" key={file.maBangChung} onClick={() => void openEvidence(file)}><strong>{file.tenTepGoc}</strong><span>{file.moTa || file.loaiTep}</span><code>{file.sha256 || 'Chưa có SHA-256'}</code></button>)}</div>
      <div className="copyright-actions">{selected.trangThai === 'PENDING' && <><button className="neutral" disabled={busy} onClick={() => void review('yeu-cau-bo-sung')}>Yêu cầu bổ sung</button><button className="danger" disabled={busy} onClick={() => void review('tu-choi')}>Từ chối</button><button className="primary" disabled={busy || selected.bangChung.length < 2} onClick={() => void review('xac-minh')}>Xác minh</button></>}{selected.trangThai === 'VERIFIED' && <button className="danger" disabled={busy} onClick={() => void revoke()}>Thu hồi xác minh</button>}</div>
    </section></div>}
  </div>;
}
