// Artwork Detail Page - Chi tiết tác phẩm
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { artworkService } from '../services/artworkService';
import { contentService, NoiDungResponse } from '../services/contentService';
import apiClient from '../services/api';
import { Artwork } from '../types';
import ArtworkDetailSection from '../components/ArtworkDetailSection';
import RecommendedArtworks from '../components/RecommendedArtworks';
import FavoriteButton from '../components/FavoriteButton';
import '../assets/css/ArtworkDetail.css';

const ArtworkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { artworks } = useAppContext();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [artworkContents, setArtworkContents] = useState<NoiDungResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    loadArtwork();
  }, [id]);

  useEffect(() => {
    // Load gallery images from artwork detail
    const loadGalleryImages = async () => {
      if (!id) return;
      try {
        const response = await apiClient.get(`/public/tac-pham/${id}/chi-tiet`);
        const detail = response.data;
        const images = [
          detail.hinhAnh1,
          detail.hinhAnh2,
          detail.hinhAnh3,
          detail.hinhAnh4
        ].filter(Boolean) as string[];
        setGalleryImages(images);
      } catch (error) {
        console.log('Không tìm thấy ảnh bổ sung:', error);
      }
    };
    loadGalleryImages();
  }, [id]);

  useEffect(() => {
    // Set selected image to artwork main image when artwork loads
    if (artwork?.anhTranh) {
      setSelectedImage(artwork.anhTranh);
    }
  }, [artwork]);

  const loadArtwork = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Try to get from context first
      const found = artworks.find(art => art.id === id);
      if (found) {
        setArtwork(found);
      } else {
        // Fetch from API
        const data = await artworkService.getArtworkById(id);
        setArtwork(data);
      }

      // Fetch approved contents for this artwork
      try {
        const contents = await contentService.layChiTietTheoTacPham(Number(id));
        const approvedContents = contents.filter(c => c.trangThai === true);
        setArtworkContents(approvedContents);
      } catch (err) {
        console.error('Error loading artwork contents:', err);
      }
    } catch (error) {
      console.error('Error loading artwork:', error);
      alert('Không thể tải thông tin tác phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      navigate('/login');
      return;
    }

    if (!artwork) return;

    const ok = await addToCart({
      id: artwork.id,
      name: artwork.tenTranh,
      price: artwork.giaBan,
      image: artwork.anhTranh,
      quantity: quantity,
    });

    if (ok) alert('Đã thêm vào giỏ hàng!');
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }

    if (!artwork) return;

    const ok = await addToCart({
      id: artwork.id,
      name: artwork.tenTranh,
      price: artwork.giaBan,
      image: artwork.anhTranh,
      quantity: quantity,
    });

    if (ok) navigate('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="artwork-detail-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="artwork-detail-page">
        <div className="not-found">
          <h2>Không tìm thấy tác phẩm</h2>
          <button onClick={() => navigate('/artworks')}>Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="artwork-detail-page">
      <div className="detail-container-wrapper">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span>Tác phẩm</span> / <span>Tranh theo chủ đề</span> / <span>{artwork.danhMuc}</span>
        </div>

        <div className="detail-layout">
          {/* Cột trái: Ảnh và Thumbnails */}
          <div className="detail-media">
            <div className="main-image">
              <img
                src={selectedImage || artwork.anhTranh}
                alt={artwork.tenTranh}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600?text=No+Image';
                }}
              />
              <div className="zoom-icon">
                <i className="ti-fullscreen"></i>
              </div>
              {/* Nút yêu thích */}
              <div className="favorite-icon">
                <FavoriteButton artworkId={parseInt(id!)} size="medium" />
              </div>
            </div>
            <div className="thumbnails">
              {/* Main artwork image */}
              <img 
                src={artwork.anhTranh} 
                alt="Ảnh chính" 
                className={selectedImage === artwork.anhTranh ? 'active' : ''}
                onClick={() => setSelectedImage(artwork.anhTranh)}
              />
              {/* Gallery images from artwork detail */}
              {galleryImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Góc nhìn ${index + 1}`}
                  className={selectedImage === img ? 'active' : ''}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Cột giữa: Thông tin chi tiết */}
          <div className="detail-info-main">
            <h1 className="artwork-title">{artwork.tenTranh}</h1>
            
            <div className="info-meta">
              <p><strong>Các chuyên mục:</strong> {artwork.danhMuc}</p>
              <p><strong>Họa sĩ:</strong> {artwork.tacGia}</p>
              <p><strong>Chất liệu tranh:</strong> {artwork.chatLieu || 'Sơn dầu trên vải'}</p>
              <p><strong>Chất liệu khung:</strong> {artwork.chatLieuKhung || 'Khung gỗ sồi cao cấp'}</p>
            </div>

            <div className="stock-info">
              <span className={`stock-badge ${artwork.soLuongTon > 0 ? 'in-stock' : 'out-of-stock'}`}>
                <i className={artwork.soLuongTon > 0 ? 'ti-check-box' : 'ti-alert'}></i>
                {artwork.soLuongTon > 0 ? `Còn hàng: ${artwork.soLuongTon} tác phẩm` : 'Đã hết hàng'}
              </span>
              {artwork.soLuongTon > 0 && artwork.soLuongTon <= 5 && (
                <span className="stock-warning">Chỉ còn vài sản phẩm cuối cùng!</span>
              )}
            </div>

            <div className="quantity-section">
              <label>Số lượng:</label>
              <div className="quantity-controls">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={artwork.soLuongTon === 0}
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val > artwork.soLuongTon) {
                      alert(`⚠️ Rất tiếc, hiện tại chỉ còn ${artwork.soLuongTon} sản phẩm trong kho.`);
                      setQuantity(artwork.soLuongTon);
                    } else {
                      setQuantity(Math.max(1, val));
                    }
                  }}
                  min="1"
                  max={artwork.soLuongTon}
                  disabled={artwork.soLuongTon === 0}
                />
                <button 
                  className="qty-btn"
                  onClick={() => {
                    if (quantity >= artwork.soLuongTon) {
                      alert(`⚠️ Rất tiếc, hiện tại chỉ còn ${artwork.soLuongTon} sản phẩm trong kho.`);
                    } else {
                      setQuantity(quantity + 1);
                    }
                  }}
                  disabled={artwork.soLuongTon === 0 || quantity >= artwork.soLuongTon}
                >
                  +
                </button>
              </div>
            </div>

            <div className="detail-actions-group">
              <button 
                className="btn-buy-main" 
                onClick={handleBuyNow}
                disabled={artwork.soLuongTon === 0}
              >
                {artwork.soLuongTon > 0 ? 'Mua ngay' : 'Đã hết hàng'}
              </button>
              <button 
                className="btn-add-cart" 
                onClick={handleAddToCart}
                disabled={artwork.soLuongTon === 0}
              >
                Thêm vào giỏ hàng
              </button>
              
              <div className="social-chats">
                <a 
                  href="https://zalo.me/0982895121" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-zalo"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="btn-content">
                    <span className="btn-title"><i className="ti-comment-alt"></i> Chat zalo</span>
                    <span className="btn-subtitle">Giải đáp và hỗ trợ ngay tức thì</span>
                  </div>
                </a>
                <a 
                  href="https://www.facebook.com/son.phanduy.100?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-facebook"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="btn-content">
                    <span className="btn-title"><i className="ti-facebook"></i> Chat Facebook</span>
                    <span className="btn-subtitle">Giải đáp và hỗ trợ ngay tức thì</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin dịch vụ */}
          <div className="detail-sidebar">
            <div className="service-item">
              <div className="service-icon">
                <i className="ti-truck"></i>
              </div>
              <div className="service-text">
                <h4>GIAO HÀNG TIÊU CHUẨN</h4>
                <p>Dự kiến giao 1-7 ngày (phụ thuộc vào địa điểm của bạn).</p>
              </div>
            </div>

            <div className="service-item">
              <div className="service-icon">
                <i className="ti-shield"></i>
              </div>
              <div className="service-text">
                <h4>THÔNG TIN BẢO HÀNH</h4>
                <p>Bảo hành trọn đời.</p>
              </div>
            </div>

            <div className="service-item">
              <div className="service-icon">
                <i className="ti-reload"></i>
              </div>
              <div className="service-text">
                <h4>ĐỔI TRẢ HÀNG</h4>
                <p>Áp dụng đổi hàng trong vòng 3 ngày sau khi bắt đầu nhận cọc và thanh toán. Chỉ đổi hàng ngang giá hoặc cao hơn...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Component hiển thị chi tiết tác phẩm từ Họa Sĩ đã được Admin duyệt */}
        {id && (
          <ArtworkDetailSection 
            artworkId={id} 
            artworkDescription={artwork.moTa}
            artworkName={artwork.tenTranh}
            artworkContents={artworkContents}
          />
        )}

        {/* Tác phẩm gợi ý */}
        {id && <RecommendedArtworks currentArtworkId={id} />}
      </div>
    </div>
  );
};

export default ArtworkDetail;
