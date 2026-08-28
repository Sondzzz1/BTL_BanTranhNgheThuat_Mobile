// Artist Dashboard - Trang tổng quan cho họa sĩ
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  artistDashboardService,
  TacPhamHoaSiResponse,
  DoanhThuTongQuanResponse,
} from '../../services/artistDashboardService';

const ArtistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myArtworks, setMyArtworks] = useState<TacPhamHoaSiResponse[]>([]);
  const [tongQuan, setTongQuan] = useState<DoanhThuTongQuanResponse | null>(null);
  const [articleCount, setArticleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [artworks, doanhThu, articles] = await Promise.all([
        artistDashboardService.getTacPhamCuaToi(),
        artistDashboardService.getDoanhThuTongQuan(),
        artistDashboardService.getBaiVietCuaToi().catch(() => []),
      ]);
      setMyArtworks(artworks);
      setTongQuan(doanhThu);
      setArticleCount(articles.length);
    } catch (error) {
      console.error('Lỗi khi tải dashboard tác giả:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const totalArtworks = myArtworks.length;
  const publishedArtworks = myArtworks.filter((a) => a.trangThai === 1).length;

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div id="home" className="page">
      <div className="header">
        <h4><i className="ti-dashboard"></i> Dashboard - Chào mừng, {user?.name}!</h4>
      </div>

      <div className="dashboard">
        <div className="card bg-primary">
          <i className="ti-image" style={{ fontSize: '2.5rem' }}></i>
          <h3>{totalArtworks}</h3>
          <p>Tổng Tác Phẩm</p>
        </div>

        <div className="card bg-success">
          <i className="ti-check" style={{ fontSize: '2.5rem' }}></i>
          <h3>{publishedArtworks}</h3>
          <p>Đang Bán</p>
        </div>

        <div className="card bg-warning">
          <i className="ti-write" style={{ fontSize: '2.5rem' }}></i>
          <h3>{articleCount}</h3>
          <p>Bài Viết</p>
        </div>

        <div className="card bg-success">
          <i className="ti-money" style={{ fontSize: '2.5rem' }}></i>
          <h3>{formatCurrency(tongQuan?.tongDoanhThu || 0)}</h3>
          <p>Doanh Thu</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="block">
          <h4><i className="ti-image"></i> Tác Phẩm Gần Đây</h4>
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên tranh</th>
                  <th>Giá bán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {myArtworks.slice(0, 5).map((artwork) => (
                  <tr key={artwork.maTacPham}>
                    <td>
                      {artwork.hinhAnh ? (
                        <img
                          src={artwork.hinhAnh}
                          alt={artwork.tenTacPham}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '5px' }} />
                      )}
                    </td>
                    <td>{artwork.tenTacPham}</td>
                    <td>{formatCurrency(artwork.gia)}</td>
                    <td>
                      <span
                        className={`status ${
                          artwork.trangThai === 1
                            ? 'success'
                            : artwork.trangThai === 0
                            ? 'pending'
                            : artwork.trangThai === 2
                            ? 'shipped'
                            : 'canceled'
                        }`}
                      >
                        {artwork.trangThaiText}
                      </span>
                    </td>
                  </tr>
                ))}
                {myArtworks.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center' }}>
                      Bạn chưa có tác phẩm nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="block">
          <h4><i className="ti-bolt"></i> Thao Tác Nhanh</h4>
          <div className="activity">
            <div><Link to="/artist/artworks" style={{ textDecoration: 'none', color: 'inherit' }}><i className="ti-plus"></i> Thêm Tác Phẩm</Link></div>
            <div><Link to="/artist/articles" style={{ textDecoration: 'none', color: 'inherit' }}><i className="ti-write"></i> Viết Bài Mới</Link></div>
            <div><Link to="/artist/revenue" style={{ textDecoration: 'none', color: 'inherit' }}><i className="ti-bar-chart"></i> Xem Doanh Thu</Link></div>
            <div><Link to="/artist/profile" style={{ textDecoration: 'none', color: 'inherit' }}><i className="ti-settings"></i> Cập Nhật Hồ Sơ</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;
