// Artist Revenue - Quản lý doanh thu của họa sĩ
import React, { useState, useEffect } from 'react';
import { artistDashboardService, DoanhThuTongQuanResponse, DoanhThuChiTietResponse } from '../../services/artistDashboardService';
import { formatVnd } from '../../utils/currency';

const ArtistRevenue: React.FC = () => {
  const [tongQuan, setTongQuan] = useState<DoanhThuTongQuanResponse | null>(null);
  const [donHang, setDonHang] = useState<DoanhThuChiTietResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const [tqData, dhData] = await Promise.all([
        artistDashboardService.getDoanhThuTongQuan(),
        artistDashboardService.getDoanhThuChiTiet()
      ]);
      setTongQuan(tqData);
      setDonHang(dhData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu doanh thu:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = formatVnd;

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div id="revenue" className="page">
      <div className="page-header">
        <h4><i className="ti-money"></i> Doanh thu và đối soát</h4>
      </div>

      <div className="dashboard" style={{ marginBottom: '30px' }}>
        <div className="card bg-success">
          <i className="ti-money" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.doanhThuGop || 0)}</h3>
          <p>Doanh thu gộp</p>
        </div>

        <div className="card bg-danger">
          <i className="ti-back-left" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.giaTriHoan || 0)}</h3>
          <p>Giá trị đã hoàn</p>
        </div>

        <div className="card bg-warning">
          <i className="ti-clipboard" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.doanhThuDuDieuKienChiTra || 0)}</h3>
          <p>Đủ điều kiện đối soát</p>
        </div>

        <div className="card bg-primary">
          <i className="ti-wallet" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.thucNhanDuKien || 0)}</h3>
          <p>Thực nhận dự kiến</p>
        </div>
      </div>

      <div className="block" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
          <span><strong>Doanh thu sau hoàn:</strong> {formatCurrency(tongQuan?.doanhThuSauHoan || 0)}</span>
          <span><strong>Tháng này:</strong> {formatCurrency(tongQuan?.doanhThuThangNay || 0)}</span>
          <span><strong>Đã bán:</strong> {tongQuan?.soTacPhamDaBan || 0} tác phẩm</span>
          <span><strong>Đơn có doanh thu:</strong> {tongQuan?.soDonHang || 0}</span>
        </div>
      </div>

      <div className="block">
        <h4>Chi tiết doanh thu theo đơn hàng</h4>
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Mã Đơn Hàng</th>
                <th>Ngày giao</th>
                <th>Khách Hàng</th>
                <th>Doanh thu gộp</th>
                <th>Đã hoàn</th>
                <th>Sau hoàn</th>
                <th>Đối soát</th>
              </tr>
            </thead>
            <tbody>
              {donHang.map((dh) => (
                <tr key={dh.maDonHang}>
                  <td>#{dh.maDonHang}</td>
                  <td>{new Date(dh.ngayGiao || dh.ngayDat).toLocaleDateString('vi-VN')}</td>
                  <td><strong>{dh.tenKhachHang}</strong></td>
                  <td>{formatCurrency(dh.doanhThuGop)}</td>
                  <td style={{ color: dh.giaTriHoan > 0 ? '#dc3545' : undefined }}>{formatCurrency(dh.giaTriHoan)}</td>
                  <td style={{ color: '#28a745', fontWeight: 'bold' }}>{formatCurrency(dh.doanhThuSauHoan)}</td>
                  <td>
                    <span className={`status ${dh.daThanhToanHopLe ? 'success' : 'pending'}`}>
                      {dh.daThanhToanHopLe ? 'Đủ điều kiện' : 'Chờ thanh toán'}
                    </span>
                  </td>
                </tr>
              ))}
              {donHang.length === 0 && (
                <tr>
                   <td colSpan={7} style={{ textAlign: 'center' }}>Chưa có đơn đã giao chứa tác phẩm của bạn.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffc107', 
        borderRadius: '8px', 
        padding: '15px', 
        marginTop: '20px' 
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          <i className="ti-info-alt"></i> <strong>Cách tính:</strong> mỗi dòng chỉ tính tiền của tác phẩm do bạn bán, không lấy tổng tiền cả đơn hàng. Giá trị đã hoàn được trừ khỏi doanh thu. “Đủ điều kiện đối soát” chỉ gồm đơn đã giao và thanh toán hợp lệ; đây chưa phải xác nhận tiền đã được chuyển cho bạn. Phí nền tảng, phí thanh toán và thuế hiện chưa được cấu hình nên đang là 0.
        </p>
      </div>
    </div>
  );
};

export default ArtistRevenue;
