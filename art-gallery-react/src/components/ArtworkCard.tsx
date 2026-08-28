// ArtworkCard Component - Sử dụng Props và Props Validation
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Artwork } from '../types';
import FavoriteButton from './FavoriteButton';
import '../assets/css/ArtworkCard.css';

// Props Interface với TypeScript (thay cho PropTypes)
interface ArtworkCardProps {
  artwork: Artwork;
  showAddToCart?: boolean;
  onAddToCart?: (artwork: Artwork) => void;
}

// Functional Component với Props
const ArtworkCard: React.FC<ArtworkCardProps> = ({ 
  artwork, 
  showAddToCart = true,
  onAddToCart 
}) => {
  const { addToCart } = useCart();

  // Event Handler - Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem = {
      id: artwork.id,
      name: artwork.tenTranh,
      price: artwork.giaBan,
      image: artwork.anhTranh,
      quantity: 1,
    };

    const success = await addToCart(cartItem);
    if (success) {
      alert('🛒 Đã thêm sản phẩm vào giỏ hàng!');
      if (onAddToCart) {
        onAddToCart(artwork);
      }
    }
  };

  return (
    <div className="artwork-card">
      <Link to={`/artworks/${artwork.id}`} className="artwork-link">
        <div className="artwork-image">
          <img src={artwork.anhTranh} alt={artwork.tenTranh} />
          {artwork.isFeatured && <span className="badge featured">Nổi bật</span>}
          {artwork.isBestSelling && <span className="badge bestselling">Bán chạy</span>}
          
          {/* Nút yêu thích ở góc trên bên phải ảnh */}
          <div className="favorite-button-overlay">
            <FavoriteButton artworkId={Number(artwork.id)} size="small" />
          </div>
        </div>
        
        <div className="artwork-info">
          <h3 className="artwork-title">{artwork.tenTranh}</h3>
          <p className="artwork-artist">Họa sĩ: {artwork.tacGia}</p>
          <p className="artwork-category">{artwork.danhMuc}</p>
          
          {artwork.kichThuoc && (
            <p className="artwork-size">Kích thước: {artwork.kichThuoc}</p>
          )}
          
          <div className="artwork-footer">
            <span className="artwork-price">
              {artwork.giaBan.toLocaleString('vi-VN')}₫
            </span>
            
            {showAddToCart && artwork.soLuongTon > 0 && (
              <button 
                className="btn-add-to-cart"
                onClick={handleAddToCart}
              >
                <i className="ti-shopping-cart"></i>
                Thêm vào giỏ
              </button>
            )}
            
            {artwork.soLuongTon === 0 && (
              <span className="out-of-stock">Hết hàng</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArtworkCard;
