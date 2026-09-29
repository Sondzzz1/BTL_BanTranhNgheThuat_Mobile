import React, { useCallback, useEffect, useState } from 'react';
import {
  CustomArtRequestApi,
  customArtService,
  getAuthenticatedCustomArtFileUrl,
  getCustomArtStatusLabel,
  getCustomArtTypeLabel,
} from '../../services/customArtService';
import './AdminCustomArt.css';

const AdminCustomArt: React.FC = () => {
  const [items, setItems] = useState<CustomArtRequestApi[]>([]);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<CustomArtRequestApi | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [referencePreview, setReferencePreview] = useState<string>();
  const [evidencePreview, setEvidencePreview] = useState<string>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await customArtService.getAllRequests(type, status));
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  }, [status, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => {
    if (referencePreview?.startsWith('blob:')) URL.revokeObjectURL(referencePreview);
  }, [referencePreview]);
  useEffect(() => () => {
    if (evidencePreview?.startsWith('blob:')) URL.revokeObjectURL(evidencePreview);
  }, [evidencePreview]);

  const openDetail = async (id: number) => {
    try {
      const detail = await customArtService.getById(id);
      const [reference, evidence] = await Promise.all([
        getAuthenticatedCustomArtFileUrl(detail.referenceImageUrl || detail.anhThamKhao),
        getAuthenticatedCustomArtFileUrl(detail.bangChungQuyenSuDung),
      ]);
      setSelected(detail);
      setReferencePreview(reference);
      setEvidencePreview(evidence);
      setNote('');
    }
    catch (error: any) { setMessage(error?.response?.data?.message || 'Không thể tải chi tiết.'); }
  };

  const closeDetail = () => {
    setSelected(null);
    setReferencePreview(undefined);
    setEvidencePreview(undefined);
  };

  const review = async (action: 'approve' | 'permission' | 'reject') => {
    if (!selected) return;
    if (action !== 'approve' && !note.trim()) {
      setMessage(action === 'reject' ? 'Phải nhập lý do từ chối.' : 'Phải nhập nội dung cần bổ sung.');
      return;
    }
    try {
      if (action === 'approve') await customArtService.approve(selected.maYeuCau, note.trim() || undefined);
      if (action === 'permission') await customArtService.requestPermission(selected.maYeuCau, note.trim());
      if (action === 'reject') await customArtService.reject(selected.maYeuCau, note.trim());
      setMessage('Đã xử lý yêu cầu thành công.');
      closeDetail();
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể xử lý yêu cầu.');
    }
  };

  return (
    <div className="commission-page">
      <div className="page-header"><h4><i className="ti-paint-bucket" /> Commission Requests</h4></div>
      {message && <div className="commission-message">{message}</div>}
      <div className="commission-toolbar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="ORIGINAL_COMMISSION">Ý tưởng mới</option>
          <option value="PERSONAL_REFERENCE">Ảnh cá nhân</option>
          <option value="EXISTING_ARTWORK">Tác phẩm có sẵn</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {['PENDING', 'WAITING_PERMISSION', 'APPROVED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((value) =>
            <option key={value} value={value}>{getCustomArtStatusLabel(value)}</option>)}
        </select>
      </div>

      {loading ? <p>Đang tải...</p> : (
        <table className="commission-table">
          <thead><tr><th>Mã</th><th>Khách hàng</th><th>Tiêu đề</th><th>Loại</th><th>Tác giả gốc</th><th>Họa sĩ</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.maYeuCau} onClick={() => openDetail(item.maYeuCau)}>
                <td>#{item.maYeuCau}</td><td>{item.tenKhachHang || `#${item.maKhachHang}`}</td><td>{item.tieuDe}</td>
                <td>{getCustomArtTypeLabel(item.type)}</td><td>{item.referenceArtistName || '—'}</td>
                <td>{item.tenHoaSiThucHien || 'Chưa có'}</td><td><span className="commission-badge">{getCustomArtStatusLabel(item.trangThai)}</span></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7}>Không có dữ liệu.</td></tr>}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="commission-overlay" onMouseDown={closeDetail}>
          <div className="commission-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="commission-modal-header"><div><h2>{selected.tieuDe}</h2><span className="commission-badge">{getCustomArtStatusLabel(selected.trangThai)}</span></div><button className="commission-close" onClick={closeDetail}>×</button></div>
            <div className="commission-grid">
              <Field label="Khách hàng" value={selected.tenKhachHang || `#${selected.maKhachHang}`} />
              <Field label="Loại yêu cầu" value={getCustomArtTypeLabel(selected.type)} />
              <Field label="Họa sĩ thực hiện" value={selected.tenHoaSiThucHien || 'Chưa có'} />
              <Field label="Ngân sách" value={`${Number(selected.giaDuKien || 0).toLocaleString('vi-VN')}đ`} />
            </div>
            <Field label="Mô tả" value={selected.moTa || '—'} />
            {selected.type === 'EXISTING_ARTWORK' && <div className="commission-source">
              <h3>Thông tin tác phẩm gốc và quyền sử dụng</h3>
              <Field label="Tác phẩm gốc" value={selected.referenceArtworkName || '—'} />
              <Field label="Tác giả gốc" value={selected.referenceArtistName || '—'} />
              <Field label="Nguồn" value={selected.nguonTacPhamGoc || '—'} />
              <Field label="Tình trạng quyền" value={selected.tinhTrangQuyenSuDung || '—'} />
              <Field label="Mô tả quyền" value={selected.moTaQuyenSuDung || '—'} />
            </div>}
            {referencePreview && <><h4>Ảnh tham khảo</h4><img className="commission-image" src={referencePreview} alt="Ảnh tham khảo" /></>}
            {evidencePreview && <><h4>Bằng chứng quyền sử dụng</h4><a href={evidencePreview} target="_blank" rel="noreferrer">Mở bằng chứng</a></>}
            {['PENDING', 'WAITING_PERMISSION'].includes(selected.trangThai) && <>
              <textarea className="commission-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú kiểm duyệt / lý do..." />
              <div className="commission-actions"><button className="commission-approve" onClick={() => review('approve')}>Approve</button><button className="commission-wait" onClick={() => review('permission')}>Request permission</button><button className="commission-reject" onClick={() => review('reject')}>Reject</button></div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => <div className="commission-field"><small>{label}</small><strong>{value}</strong></div>;

export default AdminCustomArt;
