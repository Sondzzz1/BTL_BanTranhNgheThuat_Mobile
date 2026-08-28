// Artist Revenue - Quản lý doanh thu của họa sĩ
import React, { useState, useEffect } from 'react';
import { artistDashboardService, DoanhThuTongQuanResponse, DonHangResponse } from '../../services/artistDashboardService';

const ArtistRevenue: React.FC = () => {
  const [tongQuan, setTongQuan] = useState<DoanhThuTongQuanResponse | null>(null);
  const [donHang, setDonHang] = useState<DonHangResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const [tqData, dhData] = await Promise.all([
        artistDashboardService.getDoanhThuTongQuan(),
        artistDashboardService.getDonHangCuaToi()
      ]);
      setTongQuan(tqData);
      setDonHang(dhData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu doanh thu:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div id="revenue" className="page">
      <div className="page-header">
        <h4><i className="ti-money"></i> Doanh Thu</h4>
      </div>

      <div className="dashboard" style={{ marginBottom: '30px' }}>
        <div className="card bg-success">
          <i className="ti-money" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.tongDoanhThu || 0)}</h3>
          <p>Tổng Doanh Thu</p>
        </div>

        <div className="card bg-warning">
          <i className="ti-stats-up" style={{ fontSize: '2rem' }}></i>
          <h3>{formatCurrency(tongQuan?.doanhThuThangNay || 0)}</h3>
          <p>Doanh Thu Tháng Này</p>
        </div>

        <div className="card bg-primary">
          <i className="ti-image" style={{ fontSize: '2rem' }}></i>
          <h3>{tongQuan?.soTacPhamDaBan || 0}</h3>
          <p>Tác Phẩm Đã Bán</p>
        </div>

        <div className="card bg-danger">
          <i className="ti-shopping-cart" style={{ fontSize: '2rem' }}></i>
          <h3>{tongQuan?.soDonHang || 0}</h3>
          <p>Tổng Đơn Hàng</p>
        </div>
      </div>

      <div className="block">
        <h4>Danh Sách Đơn Hàng</h4>
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Mã Đơn Hàng</th>
                <th>Ngày Đặt</th>
                <th>Khách Hàng</th>
                <th>Tổng Tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {donHang.map((dh) => (
                <tr key={dh.maDonHang}>
                  <td>#{dh.maDonHang}</td>
                  <td>{new Date(dh.ngayDat).toLocaleDateString('vi-VN')}</td>
                  <td><strong>{dh.tenKhachHang}</strong></td>
                  <td style={{ color: '#28a745', fontWeight: 'bold' }}>
                    {formatCurrency(dh.tongTien)}
                  </td>
                  <td>
                    <span className={`status ${dh.trangThai === 'Đã giao' ? 'success' : 'pending'}`}>
                      {dh.trangThai}
                    </span>
                  </td>
                </tr>
              ))}
              {donHang.length === 0 && (
                <tr>
                   <td colSpan={5} style={{ textAlign: 'center' }}>Chưa có đơn hàng nào.</td>
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
          <i className="ti-info-alt"></i> <strong>Lưu ý:</strong> Doanh thu trên đây là doanh thu bán tác phẩm trực tiếp. Tùy theo hợp đồng, có thể sẽ trừ một khoản hoa hồng khi quyết toán cuối tháng.
        </p>
      </div>
    </div>
  );
};

export default ArtistRevenue;
