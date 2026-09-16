// Admin - Quản lý yêu cầu hoàn trả
import React, { useState, useEffect } from 'react';
import { returnAdminService, ReturnRequestAdmin } from '../../services/returnAdminService';

const REASON_MAP: Record<string, string> = {
  SAN_PHAM_HU_HONG: 'Sản phẩm hư hỏng',
  SAI_MO_TA: 'Không đúng mô tả',
  GIAO_SAI: 'Giao sai sản phẩm',
  LOI_SAN_PHAM: 'Sản phẩm bị lỗi',
  KHONG_DUNG_DAT: 'Không đúng đã đặt',
  LY_DO_KHAC: 'Lý do khác',
};

const ReturnRequests: React.FC = () => {
  const [requests, setRequests] = useState<ReturnRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // all, CHO_DUYET, DA_DUYET, TU_CHOI
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestAdmin | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await returnAdminService.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading return requests:', error);
      alert('Không thể tải danh sách yêu cầu hoàn trả');
    } finally {
      setLoading(false);
    }
  };

  const isPending = (req: ReturnRequestAdmin) =>
    req.trangThai === 'CHO_DUYET' || (req.trangThai as any) === 0 || (req.trangThai as any) === '0';

  const isApproved = (req: ReturnRequestAdmin) =>
    req.trangThai === 'DA_DUYET' || (req.trangThai as any) === 1 || (req.trangThai as any) === '1';

  const isRejected = (req: ReturnRequestAdmin) =>
    req.trangThai === 'TU_CHOI' || (req.trangThai as any) === 2 || (req.trangThai as any) === '2';

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'CHO_DUYET') return isPending(req);
    if (filter === 'DA_DUYET') return isApproved(req);
    if (filter === 'TU_CHOI') return isRejected(req);
    return true;
  });

  const handleApprove = async (maYeuCau: number) => {
    if (!window.confirm(`Xác nhận chấp nhận duyệt yêu cầu hoàn trả #${maYeuCau}?`)) return;

    try {
      setActionLoading(true);
      await returnAdminService.approveRequest(maYeuCau);
      alert('Đã chấp nhận duyệt yêu cầu hoàn trả thành công!');
      loadRequests();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Không thể duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      await returnAdminService.rejectRequest(selectedRequest.maYeuCau, rejectReason.trim());
      alert('Đã từ chối yêu cầu hoàn trả thành công!');
      setShowModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (request: ReturnRequestAdmin) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setRejectReason('');
    setSelectedRequest(null);
  };

  const renderStatusBadge = (status: string | number) => {
    if (status === 'CHO_DUYET' || status === 0 || status === '0') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeeba',
          }}
        >
          Chờ duyệt
        </span>
      );
    }
    if (status === 'DA_DUYET' || status === 1 || status === '1') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
          }}
        >
          Đã chấp nhận
        </span>
      );
    }
    if (status === 'TU_CHOI' || status === 2 || status === '2') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
          }}
        >
          Đã từ chối
        </span>
      );
    }
    if (status === 'DANG_HOAN_TRA') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#ffe8cc',
            color: '#d9480f',
            border: '1px solid #ffd8a8',
          }}
        >
          Đang gửi hàng
        </span>
      );
    }
    if (status === 'DA_NHAN_HANG' || status === 'DA_HOAN_TIEN' || status === 'HOAN_TAT') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: '#e6fcf5',
            color: '#0ca678',
            border: '1px solid #c3fae8',
          }}
        >
          {status === 'HOAN_TAT' ? 'Hoàn tất' : status === 'DA_HOAN_TIEN' ? 'Đã hoàn tiền' : 'Đã nhận hàng'}
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          background: '#e2e3e5',
          color: '#383d41',
        }}
      >
        {String(status)}
      </span>
    );
  };

  const getReasonDisplay = (reasonKey: string, reasonOther?: string) => {
    const text = REASON_MAP[reasonKey] || reasonKey;
    if (reasonOther) {
      return `${text} (${reasonOther})`;
    }
    return text;
  };

  return (
    <div id="return-requests" className="page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h4>
          <i className="ti-package"></i> Quản Lý Hoàn Trả
        </h4>
        <button className="btn-refresh" onClick={loadRequests}>
          <i className="ti-reload"></i> Làm mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="tab-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({requests.length})
        </button>
        <button
          className={`tab-btn ${filter === 'CHO_DUYET' ? 'active' : ''}`}
          onClick={() => setFilter('CHO_DUYET')}
        >
          Chờ duyệt ({requests.filter(isPending).length})
        </button>
        <button
          className={`tab-btn ${filter === 'DA_DUYET' ? 'active' : ''}`}
          onClick={() => setFilter('DA_DUYET')}
        >
          Đã duyệt ({requests.filter(isApproved).length})
        </button>
        <button
          className={`tab-btn ${filter === 'TU_CHOI' ? 'active' : ''}`}
          onClick={() => setFilter('TU_CHOI')}
        >
          Từ chối ({requests.filter(isRejected).length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Đang tải danh sách hoàn trả...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Mã YC</th>
                <th style={{ width: '80px' }}>Mã ĐH</th>
                <th style={{ width: '130px', textAlign: 'left', paddingLeft: '14px' }}>Khách hàng</th>
                <th style={{ textAlign: 'left', paddingLeft: '14px' }}>Tác phẩm</th>
                <th style={{ width: '160px', textAlign: 'left', paddingLeft: '14px' }}>Lý do hoàn</th>
                <th style={{ width: '110px' }}>Hình ảnh</th>
                <th style={{ width: '100px' }}>Ngày tạo</th>
                <th style={{ width: '120px' }}>Trạng thái</th>
                <th style={{ width: '180px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Không có yêu cầu hoàn trả nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => {
                  const pending = isPending(request);
                  const rejected = isRejected(request);
                  const clientName = request.tenNguoiDung || 'Khách hàng';

                  return (
                    <tr key={request.maYeuCau}>
                      <td><strong>#{request.maYeuCau}</strong></td>
                      <td><strong>DH{request.maDonHang}</strong></td>
                      <td style={{ textAlign: 'left', paddingLeft: '14px' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>{clientName}</span>
                      </td>
                      <td style={{ textAlign: 'left', paddingLeft: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {request.hinhAnhTacPham && (
                            <img
                              src={request.hinhAnhTacPham}
                              alt={request.tenTacPham}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c7be5' }}>{request.tenTacPham}</div>
                            {request.moTa && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Ghi chú: {request.moTa}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', paddingLeft: '14px' }}>
                        <span style={{ fontSize: '13px', color: '#444' }}>
                          {getReasonDisplay(request.lyDo, request.lyDoKhac)}
                        </span>
                      </td>
                      <td>
                        {request.hinhAnh && request.hinhAnh.length > 0 ? (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                            {request.hinhAnh.slice(0, 2).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Bằng chứng"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ddd',
                                }}
                                onClick={() => setPreviewImage(img)}
                                title="Bấm để xem ảnh lớn"
                              />
                            ))}
                            {request.hinhAnh.length > 2 && (
                              <span style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>
                                +{request.hinhAnh.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '12px' }}>Không có</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#555' }}>
                          {new Date(request.ngayTao).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td>{renderStatusBadge(request.trangThai)}</td>
                      <td>
                        {pending ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className="btn-approve"
                              onClick={() => handleApprove(request.maYeuCau)}
                              disabled={actionLoading}
                              style={{
                                background: '#28a745',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="ti-check"></i> Chấp nhận
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => openRejectModal(request)}
                              disabled={actionLoading}
                              style={{
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="ti-close"></i> Từ chối
                            </button>
                          </div>
                        ) : rejected ? (
                          <div style={{ fontSize: '12px', color: '#c0392b', textAlign: 'center', maxWidth: '180px', margin: '0 auto' }}>
                            <strong>Lý do từ chối:</strong>
                            <div style={{ wordBreak: 'break-word', marginTop: '2px' }}>
                              {request.lyDoTuChoi || 'Không có lý do'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#27ae60', fontWeight: 600, fontSize: '13px' }}>
                            <i className="ti-check"></i> Đã duyệt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Từ chối hoàn trả */}
      {showModal && selectedRequest && (
        <div className="modal show" style={{ display: 'flex' }} onClick={closeModal}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '520px', borderRadius: '12px', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h5 style={{ margin: 0, fontSize: '18px', color: '#c0392b' }}>
                <i className="ti-alert"></i> Từ chối yêu cầu hoàn trả #{selectedRequest.maYeuCau}
              </h5>
              <span className="close" onClick={closeModal} style={{ position: 'static', cursor: 'pointer', fontSize: '24px' }}>
                &times;
              </span>
            </div>

            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
              <p style={{ margin: '6px 0' }}>
                <strong>Khách hàng:</strong> {selectedRequest.tenNguoiDung || 'Khách hàng'}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Mã đơn hàng:</strong> DH{selectedRequest.maDonHang}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Tác phẩm:</strong> {selectedRequest.tenTacPham}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Lý do yêu cầu:</strong> {getReasonDisplay(selectedRequest.lyDo, selectedRequest.lyDoKhac)}
              </p>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#222' }}>
                  Lý do từ chối: <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối gửi cho khách hàng (ví dụ: Sản phẩm đã quá hạn đổi trả, không đúng lỗi do nhà cung cấp...)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={closeModal}
                disabled={actionLoading}
                style={{ padding: '8px 18px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: actionLoading || !rejectReason.trim() ? '#e57373' : '#dc3545',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: actionLoading || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Ảnh lớn */}
      {previewImage && (
        <div
          className="modal show"
          style={{ display: 'flex', zIndex: 10000 }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '80vw',
              maxHeight: '80vh',
              background: '#fff',
              padding: '10px',
              borderRadius: '8px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <span
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#000',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              &times;
            </span>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRequests;

