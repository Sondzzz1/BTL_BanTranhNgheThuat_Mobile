import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artworkService } from '../services/artworkService';
import { Artwork } from '../types';
import './RecommendedArtworks.css';

interface RecommendedArtworksProps {
  currentArtworkId: string;
}

const RecommendedArtworks: React.FC<RecommendedArtworksProps> = ({ currentArtworkId }) => {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const data = await artworkService.getRecommendedArtworks(currentArtworkId);
        setArtworks(data);
      } catch (error) {
        console.error('Lỗi tải tác phẩm gợi ý:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [currentArtworkId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleArtworkClick = (id: string) => {
    navigate(`/artworks/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="recommended-section">
        <div className="recommended-loading">
          <div className="spinner"></div>
          <span>Đang tải tác phẩm gợi ý...</span>
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return null;
  }

  return (
    <div className="recommended-section">
      <div className="recommended-header">
        <div className="header-icon">
          <i className="ti-star"></i>
        </div>
        <h2 className="recommended-title">Tác Phẩm Gợi Ý Cho Bạn</h2>
        <p className="recommended-subtitle">Những tác phẩm tương tự có thể bạn quan tâm</p>
      </div>

      <div className="recommended-grid">
        {artworks.map((artwork) => (
          <div
            key={artwork.id}
            className="recommended-card"
            onClick={() => handleArtworkClick(artwork.id)}
          >
            <div className="card-image">
              <img
                src={artwork.anhTranh}
                alt={artwork.tenTranh}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                }}
              />
              <div className="card-overlay">
                <button className="btn-view-detail">
                  <i className="ti-eye"></i> Xem chi tiết
                </button>
              </div>
              {artwork.soLuongTon <= 0 && (
                <div className="sold-out-badge">Hết hàng</div>
              )}
            </div>

            <div className="card-content">
              <h3 className="card-title">{artwork.tenTranh}</h3>
              <p className="card-artist">
                <i className="ti-user"></i> {artwork.tacGia}
              </p>
              {artwork.danhMuc && (
                <p className="card-category">
                  <i className="ti-tag"></i> {artwork.danhMuc}
                </p>
              )}
              <div className="card-footer">
                <span className="card-price">{formatPrice(artwork.giaBan)}</span>
                {artwork.soLuongTon > 0 && artwork.soLuongTon <= 5 && (
                  <span className="stock-warning">Chỉ còn {artwork.soLuongTon}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedArtworks;
