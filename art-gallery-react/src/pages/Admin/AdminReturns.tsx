import React, { useState, useEffect, useMemo } from 'react';
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

// Component thẻ thống kê
const StatCard: React.FC<{
  icon: string;
  title: string;
  value: number;
  color: string;
  bgColor: string;
}> = ({ icon, title, value, color, bgColor }) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: `2px solid ${color}20`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500',
          }}>
            {title}
          </p>
          <h2 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: color,
          }}>
            {value}
          </h2>
        </div>
        <div style={{
          fontSize: '36px',
          background: bgColor,
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Styles hiện đại
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '2px solid #e5e7eb',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  outline: 'none',
  background: '#fff',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const modernThStyle: React.CSSProperties = {
  padding: '16px 20px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '700',
  color: '#fff',
  whiteSpace: 'nowrap',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const modernTdStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: '14px',
  verticalAlign: 'middle',
};

const paginationButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '2px solid #e5e7eb',
  background: '#fff',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const pageNumberStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '2px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

// Styles cho bảng cũ (tạm thời giữ lại)
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

  // Thống kê dữ liệu
  const statistics = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter(r => r.trangThai === 'CHO_DUYET').length;
    const approved = returns.filter(r => r.trangThai === 'DA_DUYET').length;
    const rejected = returns.filter(r => r.trangThai === 'TU_CHOI').length;
    const completed = returns.filter(r => r.trangThai === 'HOAN_TAT').length;
    const processing = returns.filter(r => 
      ['DANG_HOAN_TRA', 'DA_NHAN_HANG', 'DA_HOAN_TIEN'].includes(r.trangThai)
    ).length;

    return { total, pending, approved, rejected, completed, processing };
  }, [returns]);

  return (
    <div className="admin-content">
      {/* Header với gradient đẹp */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '30px 40px',
        marginBottom: '30px',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
          📦 Quản lý yêu cầu hoàn trả
        </h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
          Tổng quan và xử lý các yêu cầu hoàn trả sản phẩm từ khách hàng
        </p>
      </div>

      {/* Thẻ thống kê */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}>
        <StatCard
          icon="📊"
          title="Tổng số yêu cầu"
          value={statistics.total}
          color="#667eea"
          bgColor="#f0f3ff"
        />
        <StatCard
          icon="⏳"
          title="Chờ duyệt"
          value={statistics.pending}
          color="#f59e0b"
          bgColor="#fff7ed"
        />
        <StatCard
          icon="✅"
          title="Đã duyệt"
          value={statistics.approved}
          color="#10b981"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon="🔄"
          title="Đang xử lý"
          value={statistics.processing}
          color="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          icon="✔️"
          title="Hoàn tất"
          value={statistics.completed}
          color="#8b5cf6"
          bgColor="#faf5ff"
        />
        <StatCard
          icon="❌"
          title="Từ chối"
          value={statistics.rejected}
          color="#ef4444"
          bgColor="#fef2f2"
        />
      </div>

      {/* Bộ lọc & tìm kiếm - Thiết kế hiện đại */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            🔍 Bộ lọc tìm kiếm
          </h3>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Tìm kiếm */}
          <div>
            <label style={labelStyle}>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã đơn, tên KH, sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label style={labelStyle}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Từ ngày */}
          <div>
            <label style={labelStyle}>Từ ngày</label>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label style={labelStyle}>Đến ngày</label>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Các nút */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                flex: 1,
              }}
            >
              🔍 Tìm
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                ...buttonStyle,
                background: '#f3f4f6',
                color: '#374151',
                flex: 1,
              }}
            >
              ↺ Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          color: '#991b1b',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid #fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '500',
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Đang tải dữ liệu...</p>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
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

export default AdminReturns;
