// Home Page - Kết nối với API Backend
import React, { useState, useEffect, useMemo } from 'react';
import { artworkService } from '../services/artworkService';
import { Artwork } from '../types';
import '../assets/css/Home.css';

const Home: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Fetch artworks from API
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        const data = await artworkService.getAllArtworks();
        setArtworks(data);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  const slides = [
    '/assets/TrangNgoai/anhgiaodien1.webp',
    '/assets/TrangNgoai/anhgiaodien2.webp',
    '/assets/TrangNgoai/anhgiaodien3.jpg',
  ];

  const totalTestimonials = 3;

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % totalTestimonials);
    }, 7000);
    return () => clearInterval(testimonialInterval);
  }, [totalTestimonials]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTestimonialDotClick = (index: number) => {
    setCurrentTestimonial(index);
  };

  // Tác phẩm "nổi bật" = 4 tác phẩm có id lớn nhất (mới nhất, vì id auto-increment).
  const featuredArtworks = useMemo(() => {
    return [...artworks]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 4);
  }, [artworks]);

  // Tác phẩm "bán chạy" = 4 tác phẩm có giá cao nhất (placeholder; cần endpoint riêng để có top sale thực).
  const bestSellingArtworks = useMemo(() => {
    return [...artworks]
      .sort((a, b) => b.giaBan - a.giaBan)
      .slice(0, 4);
  }, [artworks]);

  return (
    <div className="home-page">
      <div id="slider">
        <div className="slider-container">
          {slides.map((slide, index) => (
            <img
              key={index}
              src={slide}
              alt={`Slide ${index + 1}`}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
          <button className="slider-btn prev" onClick={handlePrevSlide}>‹</button>
          <button className="slider-btn next" onClick={handleNextSlide}>›</button>
        </div>
      </div>

      <div className="slide-introduce">
        <div className="slide-box">
          <h2><span>01.</span>TRANH SƠN DẦU CAO CẤP</h2>
          <p>Tranh sáng tác độc bản - Sơn dầu nhập khẩu độ bền hành trăm năm</p>
        </div>
        <div className="slide-box">
          <h2><span>02.</span>SỰ KHÁC BIỆT</h2>
          <p>Sang trọng - Tinh tế - kiến tạo không gian hiện đại</p>
        </div>
        <div className="slide-box">
          <h2><span>03.</span>TƯ VẤN CHUYÊN NGHIỆP</h2>
          <p>Đội ngũ chuyên nghiệp hàng đầu trong lĩnh vực kiến trúc - hội họa</p>
        </div>
      </div>

      <div className="intro-container">
        <div className="intro-video">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/xNOLRP9067c"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          ></iframe>
        </div>
        <div className="intro-content">
          <h2>GIỚI THIỆU</h2>
          <div className="intro-text">
            <h3>Nội dung độc đáo</h3>
            <p><i>Hơn 1000 tác phẩm Tranh Sơn Dầu Cao Cấp chỉ có tại Lanvu Gallery.</i></p>
          </div>
          <div className="intro-text">
            <h3>Chất lượng hoàn hảo</h3>
            <p><i>Tranh sơn dầu cao cấp sử dụng chất liệu toan vải Nga nhập khẩu.</i></p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu từ server...</p>
        </div>
      )}

      {!loading && featuredArtworks.length > 0 ? (
        <div className="featured-artworks-section">
          <div className="featured-header">
            <span className="decorative-left">❦</span>
            <h2 className="featured-title">TÁC PHẨM NỔI BẬT</h2>
            <span className="decorative-right">❦</span>
          </div>
          <div className="featured-artworks-grid">
            {featuredArtworks.map((artwork) => (
              <div key={artwork.id} className="featured-artwork-card">
                <div className="featured-artwork-image-wrapper">
                  <img 
                    src={artwork.anhTranh} 
                    alt={artwork.tenTranh}
                    className="featured-artwork-image"
                  />
                  {artwork.soLuongTon === 0 && (
                    <div className="sold-badge">ĐÃ BÁN</div>
                  )}
                </div>
                <div className="featured-artwork-info">
                  <div className="featured-artwork-category">{artwork.danhMuc}</div>
                  <h3 className="featured-artwork-name">{artwork.tenTranh}</h3>
                  <p className="featured-artwork-details">
                    Tác giả: {artwork.tacGia}<br/>
                    Chất liệu: {artwork.chatLieu || 'Sơn dầu'}<br/>
                    Kích thước: {artwork.kichThuoc || 'Liên hệ'}
                  </p>
                  <div className="featured-artwork-price">
                    {artwork.giaBan.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && (
        <div className="no-artworks">
          <p>Chưa có tác phẩm nào. Vui lòng kiểm tra kết nối tới backend ({process.env.REACT_APP_API_URL || 'http://localhost:5273/api'}).</p>
        </div>
      )}

      {!loading && bestSellingArtworks.length > 0 && (
        <div className="featured-artworks-section">
          <div className="featured-header">
            <span className="decorative-left">❦</span>
            <h2 className="featured-title">TÁC PHẨM BÁN CHẠY</h2>
            <span className="decorative-right">❦</span>
          </div>
          <div className="featured-artworks-grid">
            {bestSellingArtworks.map((artwork) => (
              <div key={artwork.id} className="featured-artwork-card">
                <div className="featured-artwork-image-wrapper">
                  <img 
                    src={artwork.anhTranh} 
                    alt={artwork.tenTranh}
                    className="featured-artwork-image"
                  />
                  {artwork.soLuongTon === 0 && (
                    <div className="sold-badge">ĐÃ BÁN</div>
                  )}
                </div>
                <div className="featured-artwork-info">
                  <div className="featured-artwork-category">{artwork.danhMuc}</div>
                  <h3 className="featured-artwork-name">{artwork.tenTranh}</h3>
                  <p className="featured-artwork-details">
                    Tác giả: {artwork.tacGia}<br/>
                    Chất liệu: {artwork.chatLieu || 'Sơn dầu'}<br/>
                    Kích thước: {artwork.kichThuoc || 'Liên hệ'}
                  </p>
                  <div className="featured-artwork-price">
                    {artwork.giaBan.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="testimonials-section-carousel">
        <h2 className="testimonials-title">KHÁCH HÀNG NHẬN XÉT VỀ CHÚNG TÔI</h2>
        <div className="testimonials-underline"></div>
        
        <div className="testimonials-carousel">
          <div className={`carousel-content ${currentTestimonial === 0 ? 'active' : ''}`}>
            <div className="carousel-image">
              <img src="/assets/TrangNgoai/nhanxetkh1.webp" alt="Showroom" />
            </div>
            <div className="carousel-review">
              <p className="review-text">
                Đa tham khảo nhiều nơi bán tranh sơn dầu và dần lần nơi xem thì mình đã quyết định chọn tranh tại LanVu Gallery 
                vì hợp với phong cách thiết kế của nhà mình và rất có hợp. Tranh làm khung đẹp hơn mình nghĩ, anh thợ treo tranh 
                cũng rất nhiệt tình. Cảm ơn team LanVu Gallery
              </p>
              <button className="read-more-btn">XEM THÊM ›</button>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-author">
                <strong>CHỊ THU MINH</strong>
                <p>Hình phòng khách Facebook</p>
              </div>
            </div>
          </div>

          <div className={`carousel-content ${currentTestimonial === 1 ? 'active' : ''}`}>
            <div className="carousel-image">
              <img src="/assets/TrangNgoai/nhanxetkh2.webp" alt="Showroom" />
            </div>
            <div className="carousel-review">
              <p className="review-text">
                Chất lượng tranh tuyệt vời, đóng gói cẩn thận. Tôi rất hài lòng với bức tranh sơn dầu đã mua. 
                Màu sắc sống động, chi tiết tinh xảo. Nhân viên tư vấn nhiệt tình, giao hàng đúng hẹn. 
                Sẽ quay lại mua thêm cho các phòng khác!
              </p>
              <button className="read-more-btn">XEM THÊM ›</button>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-author">
                <strong>ANH MINH TUẤN</strong>
                <p>Khách hàng thân thiết</p>
              </div>
            </div>
          </div>

          <div className={`carousel-content ${currentTestimonial === 2 ? 'active' : ''}`}>
            <div className="carousel-image">
              <img src="/assets/TrangNgoai/nhanxetkh3.webp" alt="Showroom" />
            </div>
            <div className="carousel-review">
              <p className="review-text">
                Bộ sưu tập tranh phong phú, đa dạng phong cách. Giá cả hợp lý, chất lượng đảm bảo. 
                Tôi đã trang trí cả văn phòng với tranh từ đây. Dịch vụ chuyên nghiệp, 
                tư vấn tận tâm giúp tôi chọn được những bức tranh phù hợp nhất.
              </p>
              <button className="read-more-btn">XEM THÊM ›</button>
              <div className="review-stars">⭐⭐⭐⭐⭐</div>
              <div className="review-author">
                <strong>CHỊ LAN HƯƠNG</strong>
                <p>Kiến trúc sư</p>
              </div>
            </div>
          </div>
        </div>

        <div className="carousel-dots">
          <span 
            className={`dot ${currentTestimonial === 0 ? 'active' : ''}`} 
            onClick={() => handleTestimonialDotClick(0)}
          ></span>
          <span 
            className={`dot ${currentTestimonial === 1 ? 'active' : ''}`} 
            onClick={() => handleTestimonialDotClick(1)}
          ></span>
          <span 
            className={`dot ${currentTestimonial === 2 ? 'active' : ''}`} 
            onClick={() => handleTestimonialDotClick(2)}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default Home;
