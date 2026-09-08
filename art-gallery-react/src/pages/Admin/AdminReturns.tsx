import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminReturnService,
  HoanTraSummary,
  RETURN_STATUS_TEXT,
  RETURN_STATUS_COLOR,
  RETURN_REASON_TEXT,
} from '../../services/adminReturnService';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'CHO_DUYET', label: 'Chờ duyệt' },
  { value: 'DA_DUYET', label: 'Đã duyệt' },
  { value: 'TU_CHOI', label: 'Từ chối' },
  { value: 'DANG_HOAN_TRA', label: 'Đang gửi hàng' },
  { value: 'DA_NHAN_HANG', label: 'Đã nhận hàng' },
  { value: 'DA_HOAN_TIEN', label: 'Đã hoàn tiền' },
  { value: 'HOAN_TAT', label: 'Hoàn tất' },
];

const PAGE_SIZE = 10;

const AdminReturns: React.FC = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<HoanTraSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminReturnService.getAllReturns({
        trangThai: statusFilter || undefined,
        keyword: keyword || undefined,
        tuNgay: tuNgay || undefined,
        denNgay: denNgay || undefined,
      });
      setReturns(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách hoàn trả');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadReturns();
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setTuNgay('');
    setDenNgay('');
    setTimeout(loadReturns, 0);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Phân trang
  const totalPages = Math.ceil(returns.length / PAGE_SIZE);
  const pagedReturns = returns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Quản lý hoàn trả</h1>
        <p className="admin-subtitle">{returns.length} yêu cầu hoàn trả</p>
      </div>

      {/* Bộ lọc & tìm kiếm */}
      <div className="filter-section" style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên khách hàng, tên sản phẩm, mã đơn..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
          </div>
          <div style={{ minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Từ ngày</label>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Đến ngày</label>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary">🔍 Tìm kiếm</button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Đặt lại</button>
          </div>
        </form>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="error-message" style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          ⏳ Đang tải dữ liệu...
        </div>
      )}

      {/* Bảng danh sách */}
      {!loading && (
        <>
          {returns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
              <p style={{ fontSize: '16px' }}>Không có yêu cầu hoàn trả nào</p>
            </div>
          ) : (
            <div className="table-container" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={thStyle}>Mã HT</th>
                    <th style={thStyle}>Sản phẩm</th>
                    <th style={thStyle}>Khách hàng</th>
                    <th style={thStyle}>Đơn hàng</th>
                    <th style={thStyle}>Lý do</th>
                    <th style={thStyle}>Ngày yêu cầu</th>
                    <th style={thStyle}>Trạng thái</th>
                    <th style={thStyle}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedReturns.map((item) => {
                    const statusText = RETURN_STATUS_TEXT[item.trangThai] ?? item.trangThai;
                    const statusColor = RETURN_STATUS_COLOR[item.trangThai] ?? '#6b7280';
                    const reasonText = RETURN_REASON_TEXT[item.lyDo] ?? item.lyDo;

                    return (
                      <tr key={item.maYeuCau} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>#{item.maYeuCau}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.hinhAnhTacPham && (
                              <img
                                src={item.hinhAnhTacPham}
                                alt=""
                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                              />
                            )}
                            <span style={{ fontSize: '13px', color: '#374151', maxWidth: '160px' }}>
                              {item.tenTacPham ?? '–'}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', color: '#374151' }}>
                            {/* Tên khách hàng được ghép vào TenTacPham trong Admin view */}
                            {typeof item.tenTacPham === 'string' && item.tenTacPham.includes('[')
                              ? item.tenTacPham.match(/\[(.*?)\]/)?.[1] ?? '–'
                              : '–'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 500 }}>
                            #{item.maDonHang}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{reasonText}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(item.ngayTao)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: statusColor + '20',
                            color: statusColor,
                          }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => navigate(`/admin/returns/${item.maYeuCau}`)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="btn btn-small btn-secondary"
                  >
                    ← Trước
                  </button>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Trang {currentPage}/{totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="btn btn-small btn-secondary"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Styles
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  verticalAlign: 'middle',
};

export default AdminReturns;
