import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteService, FavoriteItem } from '../../services/favoriteService';
import FavoriteButton from '../../components/FavoriteButton';
import './UserFavorites.css';

const UserFavorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu thích:', error);
      alert('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleViewDetail = (id: number) => {
    navigate(`/artwork/${id}`);
  };

  const handleRemoveFavorite = async (id: number) => {
    // Reload danh sách sau khi xóa
    await loadFavorites();
  };

  if (loading) {
    return (
      <div className="user-favorites-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-favorites-page">
      <div className="favorites-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="ti-heart"></i>
          </div>
          <div className="header-text">
            <h1>Tác Phẩm Yêu Thích</h1>
            <p>Danh sách các tác phẩm bạn đã lưu</p>
          </div>
        </div>
        <div className="favorites-count">
          <span className="count-number">{favorites.length}</span>
          <span className="count-label">tác phẩm</span>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="ti-heart-broken"></i>
          </div>
          <h2>Chưa có tác phẩm yêu thích</h2>
          <p>Hãy khám phá và lưu lại những tác phẩm bạn thích</p>
          <button className="btn-browse" onClick={() => navigate('/artworks')}>
            <i className="ti-search"></i> Khám phá tác phẩm
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.maYeuThich} className="favorite-card">
              <div className="card-image" onClick={() => handleViewDetail(fav.tacPham.maTacPham)}>
                <img
                  src={fav.tacPham.hinhAnh || 'https://via.placeholder.com/300?text=No+Image'}
                  alt={fav.tacPham.tenTacPham}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                  }}
                />
                <div className="card-overlay">
                  <button className="btn-view">
                    <i className="ti-eye"></i> Xem chi tiết
                  </button>
                </div>
                {fav.tacPham.soLuong <= 0 && (
                  <div className="sold-out-badge">Hết hàng</div>
                )}
                {fav.tacPham.trangThai !== 1 && (
                  <div className="unavailable-badge">Không khả dụng</div>
                )}
              </div>

              <div className="card-content">
                <div className="card-header">
                  <h3 className="card-title" onClick={() => handleViewDetail(fav.tacPham.maTacPham)}>
                    {fav.tacPham.tenTacPham}
                  </h3>
                  <div onClick={() => handleRemoveFavorite(fav.tacPham.maTacPham)}>
                    <FavoriteButton artworkId={fav.tacPham.maTacPham} size="small" />
                  </div>
                </div>

                <div className="card-info">
                  <p className="card-artist">
                    <i className="ti-user"></i> {fav.tacPham.tenHoaSi}
                  </p>
                  {fav.tacPham.tenDanhMuc && (
                    <p className="card-category">
                      <i className="ti-tag"></i> {fav.tacPham.tenDanhMuc}
                    </p>
                  )}
                  <p className="card-date">
                    <i className="ti-time"></i> Đã lưu: {formatDate(fav.ngayThem)}
                  </p>
                </div>

                {fav.ghiChu && (
                  <div className="card-note">
                    <i className="ti-comment"></i>
                    <span>{fav.ghiChu}</span>
                  </div>
                )}

                <div className="card-footer">
                  <span className="card-price">{formatPrice(fav.tacPham.gia)}</span>
                  {fav.tacPham.soLuong > 0 && fav.tacPham.soLuong <= 5 && (
                    <span className="stock-warning">Chỉ còn {fav.tacPham.soLuong}</span>
                  )}
                </div>

                <button
                  className="btn-add-cart"
                  onClick={() => handleViewDetail(fav.tacPham.maTacPham)}
                  disabled={fav.tacPham.soLuong <= 0 || fav.tacPham.trangThai !== 1}
                >
                  {fav.tacPham.soLuong > 0 && fav.tacPham.trangThai === 1 ? (
                    <>
                      <i className="ti-shopping-cart"></i> Thêm vào giỏ hàng
                    </>
                  ) : (
                    'Không khả dụng'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserFavorites;
