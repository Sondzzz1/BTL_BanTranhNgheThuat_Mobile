import React, { useCallback, useEffect, useState } from 'react';
import { CertificateRecord, copyrightService } from '../../services/copyrightService';
import './AdminCopyright.css';
import './AdminCopyrightOverrides.css';

export default function AdminCertificates() {
  const [items, setItems] = useState<CertificateRecord[]>([]);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await copyrightService.adminCertificates(status || undefined, keyword || undefined)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải danh sách chứng nhận'); }
    finally { setLoading(false); }
  }, [keyword, status]);

  useEffect(() => { void load(); }, [load]);

  const revoke = async (item: CertificateRecord) => {
    const reason = window.prompt(`Nhập lý do thu hồi chứng nhận ${item.maChungNhanCongKhai}:`)?.trim();
    if (!reason) return;
    try { await copyrightService.revokeCertificate(item.maChungNhan, reason); await load(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể thu hồi chứng nhận'); }
  };

  return <div className="copyright-admin-page">
    <header className="copyright-page-header"><div><p className="copyright-eyebrow">QUYỀN SỞ HỮU HIỆN VẬT</p><h1>Quản lý chứng nhận</h1><p>Tra cứu trạng thái và thu hồi chứng nhận có lý do. Việc thu hồi không thay đổi quyền tác giả.</p></div><div className="copyright-metrics"><span>{items.length}<small>Chứng nhận</small></span><span>{items.filter(x => x.trangThai === 'ACTIVE').length}<small>Hiệu lực</small></span><span>{items.filter(x => x.trangThai === 'REVOKED').length}<small>Thu hồi</small></span></div></header>
    <div className="copyright-toolbar"><input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && void load()} placeholder="Tìm mã, tác phẩm, chủ sở hữu..."/><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Hiệu lực</option><option value="REVOKED">Đã thu hồi</option><option value="SUPERSEDED">Đã thay thế</option><option value="EXPIRED">Hết hiệu lực</option></select><button onClick={() => void load()}>Tìm kiếm</button></div>
    <div className="copyright-table-wrap"><table><thead><tr><th>Mã chứng nhận</th><th>Tác phẩm</th><th>Họa sĩ / tác giả gốc</th><th>Chủ sở hữu hiện vật</th><th>Ngày cấp</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      {loading ? <tr><td colSpan={7} className="copyright-empty">Đang tải...</td></tr> : items.length === 0 ? <tr><td colSpan={7} className="copyright-empty">Không có chứng nhận phù hợp.</td></tr> : items.map(item => <tr key={item.maChungNhan}><td><strong>{item.maChungNhanCongKhai}</strong><small>#{item.maChungNhan}</small></td><td><strong>{item.tenTacPham}</strong><small>{item.loaiTacPhamText}</small></td><td>{item.tenHoaSi}<small>{item.tacGiaGoc ? `Tác giả gốc: ${item.tacGiaGoc}` : item.tacGia}</small></td><td>{item.chuSoHuu}</td><td>{new Date(item.ngayCap).toLocaleString('vi-VN')}</td><td><span className={`copyright-status ${item.trangThai.toLowerCase()}`}>{item.trangThai}</span></td><td>{item.trangThai === 'ACTIVE' && <button className="detail-button" onClick={() => void revoke(item)}>Thu hồi</button>}</td></tr>)}
    </tbody></table></div>
  </div>;
}
