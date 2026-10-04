import React, { useCallback, useEffect, useState } from 'react';
import { CopyrightAuditRecord, copyrightService } from '../../services/copyrightService';
import { formatAuditAction, formatAuditActor, formatAuditChange, formatAuditObject } from '../../utils/copyrightAudit';
import './AdminCopyright.css';

const objects = ['', 'BanQuyen', 'BangChungBanQuyen', 'LichSuSoHuu', 'ChungNhan', 'YeuCauHoanTra', 'ThanhToanYeuCau', 'YeuCauVeTranh'];

export default function AdminCopyrightAudit() {
  const [items, setItems] = useState<CopyrightAuditRecord[]>([]);
  const [objectName, setObjectName] = useState('');
  const [objectId, setObjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await copyrightService.adminAudit(objectName || undefined, objectId ? Number(objectId) : undefined)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải nhật ký'); }
    finally { setLoading(false); }
  }, [objectId, objectName]);
  useEffect(() => { void load(); }, [load]);

  return <div className="copyright-admin-page"><header className="copyright-page-header"><div><p className="copyright-eyebrow">NHẬT KÝ BẤT BIẾN</p><h1>Nhật ký nguồn gốc và sở hữu</h1><p>Chỉ đọc tối đa 200 sự kiện mới nhất; ứng dụng không cung cấp API sửa hoặc xóa.</p></div><div className="copyright-metrics"><span>{items.length}<small>Sự kiện</small></span></div></header>
    <div className="copyright-toolbar"><input type="number" min="1" value={objectId} onChange={e => setObjectId(e.target.value)} placeholder="Mã đối tượng"/><select value={objectName} onChange={e => setObjectName(e.target.value)}>{objects.map(value => <option key={value} value={value}>{value ? formatAuditObject(value) : 'Tất cả đối tượng'}</option>)}</select><button onClick={() => void load()}>Lọc</button></div>
    <div className="copyright-table-wrap"><table><thead><tr><th>Thời gian</th><th>Đối tượng</th><th>Hành động</th><th>Người thực hiện</th><th>Lý do / thay đổi</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="copyright-empty">Đang tải...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="copyright-empty">Chưa có sự kiện.</td></tr> : items.map(item => <tr key={item.maNhatKy}><td>{new Date(item.thoiGian).toLocaleString('vi-VN')}</td><td><strong>{formatAuditObject(item.tenDoiTuong)}</strong><small>#{item.maDoiTuong} · nhật ký #{item.maNhatKy}</small></td><td>{formatAuditAction(item)}</td><td>{formatAuditActor(item)}</td><td>{formatAuditChange(item)}</td></tr>)}</tbody></table></div>
  </div>;
}
