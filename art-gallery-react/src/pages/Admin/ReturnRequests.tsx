import React, { useEffect, useMemo, useState } from 'react';
import {
  adminReturnService,
  HoanTraDetail,
  HoanTraSummary,
  RETURN_REASON_TEXT,
  RETURN_STATUS_COLOR,
  RETURN_STATUS_TEXT,
} from '../../services/adminReturnService';
import { formatVnd } from '../../utils/currency';

const filters = [
  ['ALL', 'Tất cả'], ['CHO_DUYET', 'Chờ duyệt'], ['DA_DUYET', 'Đã duyệt'],
  ['DANG_HOAN_TRA', 'Đang gửi'], ['DA_NHAN_HANG', 'Đã nhận'],
  ['DA_HOAN_TIEN', 'Đã hoàn tiền'], ['HOAN_TAT', 'Hoàn tất'],
];

const money = formatVnd;

const ReturnRequests: React.FC = () => {
  const [requests, setRequests] = useState<HoanTraSummary[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<HoanTraDetail | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [resellable, setResellable] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('CHUYEN_KHOAN');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const visible = useMemo(
    () => filter === 'ALL' ? requests : requests.filter((item) => item.trangThai === filter),
    [filter, requests]
  );

  const load = async () => {
    try {
      setLoading(true);
      setRequests(await adminReturnService.getAllReturns());
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể tải danh sách yêu cầu hoàn trả');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => () => evidenceUrls.filter((url) => url.startsWith('blob:')).forEach(URL.revokeObjectURL), [evidenceUrls]);

  const openDetail = async (id: number) => {
    try {
      setBusy(true);
      const value = await adminReturnService.getReturnById(id);
      evidenceUrls.filter((url) => url.startsWith('blob:')).forEach(URL.revokeObjectURL);
      const loaded = await Promise.all(value.hinhAnh.map((path) => adminReturnService.getEvidenceObjectUrl(path)));
      setEvidenceUrls(loaded);
      setDetail(value);
      setRejectReason('');
      setResellable(Boolean(value.coTheBanLai));
      setRefundAmount(Number(value.soTienHoan ?? value.giaTacPham * value.soLuongTra).toLocaleString('vi-VN'));
      setRefundMethod(value.phuongThucHoanTien || 'CHUYEN_KHOAN');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể tải chi tiết yêu cầu');
    } finally {
      setBusy(false);
    }
  };

  const closeDetail = () => {
    evidenceUrls.filter((url) => url.startsWith('blob:')).forEach(URL.revokeObjectURL);
    setEvidenceUrls([]);
    setDetail(null);
  };

  const run = async (action: () => Promise<{ message: string }>) => {
    try {
      setBusy(true);
      const result = await action();
      alert(result.message);
      closeDetail();
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Không thể xử lý yêu cầu');
    } finally {
      setBusy(false);
    }
  };

  const approve = () => detail && window.confirm('Chấp nhận yêu cầu hoàn trả này?') &&
    run(() => adminReturnService.approveReturn(detail.maYeuCau, { chapNhan: true }));

  const reject = () => {
    if (!detail || !rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
    return run(() => adminReturnService.approveReturn(detail.maYeuCau, {
      chapNhan: false, lyDoTuChoi: rejectReason.trim(),
    }));
  };

  const receive = () => detail && window.confirm(
    resellable
      ? 'Xác nhận đã nhận hàng và đưa số lượng trả về tồn kho bán lại?'
      : 'Xác nhận đã nhận hàng nhưng không đưa tác phẩm về tồn kho?'
  ) && run(() => adminReturnService.confirmReceived(detail.maYeuCau, resellable));

  const refund = () => {
    if (!detail) return;
    const amount = Number(refundAmount.replace(/\D/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) return alert('Số tiền hoàn phải lớn hơn 0');
    return run(() => adminReturnService.confirmRefund(detail.maYeuCau, {
      soTienHoan: amount, phuongThucHoanTien: refundMethod,
    }));
  };

  const complete = () => detail && window.confirm('Xác nhận hoàn tất toàn bộ quy trình?') &&
    run(() => adminReturnService.completeReturn(detail.maYeuCau));

  const badge = (status: string) => (
    <span style={{
      display: 'inline-block', padding: '5px 10px', borderRadius: 16,
      color: '#fff', background: RETURN_STATUS_COLOR[status] || '#6b7280', fontSize: 12, fontWeight: 700,
    }}>
      {RETURN_STATUS_TEXT[status] || status}
    </span>
  );

  return (
    <div id="return-requests" className="page">
      <div className="page-header" style={{ marginBottom: 18 }}>
        <h4><i className="ti-package" /> Quản lý hoàn trả</h4>
        <button className="btn-refresh" onClick={load} disabled={loading}>Làm mới</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {filters.map(([value, label]) => (
          <button key={value} className={`tab-btn ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>
            {label} ({value === 'ALL' ? requests.length : requests.filter((x) => x.trangThai === value).length})
          </button>
        ))}
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: 40 }}>Đang tải...</p> : (
        <div className="table-container">
          <table className="styled-table" style={{ width: '100%' }}>
            <thead><tr>
              <th>Mã YC</th><th>Đơn hàng</th><th>Khách hàng</th><th>Tác phẩm</th>
              <th>SL trả</th><th>Lý do</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th>
            </tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 35 }}>Không có yêu cầu phù hợp</td></tr>
              ) : visible.map((item) => (
                <tr key={item.maYeuCau}>
                  <td><strong>#{item.maYeuCau}</strong></td>
                  <td>DH{item.maDonHang}</td>
                  <td>{item.tenNguoiDung || `ND${item.maNguoiDung}`}</td>
                  <td style={{ textAlign: 'left' }}>{item.tenTacPham || `TP${item.maTacPham}`}</td>
                  <td>{item.soLuongTra}</td>
                  <td style={{ textAlign: 'left' }}>{RETURN_REASON_TEXT[item.lyDo] || item.lyDo}</td>
                  <td>{new Date(item.ngayTao).toLocaleDateString('vi-VN')}</td>
                  <td>{badge(item.trangThai)}</td>
                  <td><button className="btn-edit" onClick={() => openDetail(item.maYeuCau)}>Xem / xử lý</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="modal show" style={{ display: 'flex', zIndex: 9999 }} onClick={closeDetail}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{
            maxWidth: 760, width: '92vw', maxHeight: '88vh', overflowY: 'auto', borderRadius: 12, padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h4 style={{ margin: 0 }}>Yêu cầu #{detail.maYeuCau}</h4>
                <p style={{ margin: '6px 0' }}>Đơn DH{detail.maDonHang} · dòng #{detail.maChiTietDH ?? 'cũ'}</p>
              </div>
              <div>{badge(detail.trangThai)} <button onClick={closeDetail}>×</button></div>
            </div>
            <hr />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <p><strong>Khách hàng:</strong> {detail.tenNguoiDung || `ND${detail.maNguoiDung}`}</p>
              <p><strong>Liên hệ:</strong> {detail.emailNguoiDung || detail.soDienThoaiNguoiDung || '—'}</p>
              <p><strong>Tác phẩm:</strong> {detail.tenTacPham}</p>
              <p><strong>Số lượng trả:</strong> {detail.soLuongTra}/{detail.soLuong}</p>
              <p><strong>Đơn giá lịch sử:</strong> {money(detail.giaTacPham)}</p>
              <p><strong>Tối đa hoàn:</strong> {money(detail.giaTacPham * detail.soLuongTra)}</p>
            </div>
            <p><strong>Lý do:</strong> {RETURN_REASON_TEXT[detail.lyDo] || detail.lyDo}{detail.lyDoKhac ? ` — ${detail.lyDoKhac}` : ''}</p>
            {detail.moTa && <p><strong>Mô tả:</strong> {detail.moTa}</p>}
            {detail.lyDoTuChoi && <p style={{ color: '#b91c1c' }}><strong>Lý do từ chối:</strong> {detail.lyDoTuChoi}</p>}

            {evidenceUrls.length > 0 && <div>
              <strong>Ảnh bằng chứng:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {evidenceUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>
                  <img src={url} alt={`Bằng chứng ${index + 1}`} style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 8 }} />
                </a>)}
              </div>
            </div>}

            {detail.trangThai === 'CHO_DUYET' && <div style={{ marginTop: 18 }}>
              <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do nếu từ chối" style={{ width: '100%', padding: 10, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={approve} disabled={busy} style={{ background: '#16a34a', color: '#fff', padding: '9px 16px', border: 0 }}>Chấp nhận</button>
                <button onClick={reject} disabled={busy || !rejectReason.trim()} style={{ background: '#dc2626', color: '#fff', padding: '9px 16px', border: 0 }}>Từ chối</button>
              </div>
            </div>}

            {detail.trangThai === 'DA_DUYET' && <p style={{ marginTop: 18, color: '#1d4ed8' }}>Đang chờ khách hàng xác nhận đã gửi tác phẩm.</p>}

            {detail.trangThai === 'DANG_HOAN_TRA' && <div style={{ marginTop: 18, padding: 14, background: '#f8fafc' }}>
              <label><input type="checkbox" checked={resellable} onChange={(e) => setResellable(e.target.checked)} /> Tác phẩm đủ điều kiện bán lại (cộng lại tồn kho)</label>
              <div><button onClick={receive} disabled={busy} style={{ marginTop: 12, padding: '9px 16px' }}>Xác nhận đã nhận hàng</button></div>
            </div>}

            {detail.trangThai === 'DA_NHAN_HANG' && <div style={{ marginTop: 18, padding: 14, background: '#f8fafc' }}>
              <label>Số tiền hoàn <input type="text" inputMode="numeric" value={refundAmount} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); setRefundAmount(digits ? Number(digits).toLocaleString('vi-VN') : ''); }} /> ₫</label>
              <label style={{ marginLeft: 12 }}>Phương thức <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                <option value="CHUYEN_KHOAN">Chuyển khoản</option><option value="TIEN_MAT">Tiền mặt</option>
              </select></label>
              <div><button onClick={refund} disabled={busy} style={{ marginTop: 12, padding: '9px 16px' }}>Xác nhận đã hoàn tiền</button></div>
            </div>}

            {detail.trangThai === 'DA_HOAN_TIEN' && <button onClick={complete} disabled={busy} style={{ marginTop: 18, padding: '9px 16px' }}>Hoàn tất quy trình</button>}
            {detail.soTienHoan != null && <p><strong>Đã hoàn:</strong> {money(detail.soTienHoan)} · {detail.phuongThucHoanTien}</p>}
          </div>
        </div>
      )}
      {busy && !detail && <p>Đang tải chi tiết...</p>}
    </div>
  );
};

export default ReturnRequests;
