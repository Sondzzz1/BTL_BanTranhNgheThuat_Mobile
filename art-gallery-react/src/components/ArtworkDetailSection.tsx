import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './ArtworkDetailSection.css';

interface ArtworkDetailSectionProps {
  artworkId: number | string;
  artworkDescription?: string;
  artworkName?: string;
  artworkContents?: Array<{
    maNoiDung: number;
    tieuDe?: string;
    moTa?: string;
    trangThai: boolean;
  }>;
}

interface ChiTietPublicResponse {
  maChiTiet: number;
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  avatarHoaSi?: string;
  cauChuyenSangTac?: string;
  yNghiaNghiThuat?: string;
  kyThuatThucHien?: string;
  camHungSangTao?: string;
  thongTinBosung?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
  namSangTac?: number;
  diaDiemSangTac?: string;
  hinhAnh1?: string;
  hinhAnh2?: string;
  hinhAnh3?: string;
  hinhAnh4?: string;
}

const ArtworkDetailSection: React.FC<ArtworkDetailSectionProps> = ({ 
  artworkId, 
  artworkDescription, 
  artworkName,
  artworkContents = []
}) => {
  const [detail, setDetail] = useState<ChiTietPublicResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeZoomImg, setActiveZoomImg] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtworkDetail = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/public/tac-pham/${artworkId}/chi-tiet`);
        setDetail(response.data);
      } catch (error) {
        console.log('Không tìm thấy chi tiết tác phẩm đã duyệt:', error);
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    if (artworkId) {
      fetchArtworkDetail();
    }
  }, [artworkId]);

  if (loading) {
    return (
      <div className="artwork-detail-section-loading">
        <div className="spinner-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <span>Đang tải thông tin chi tiết tác phẩm...</span>
      </div>
    );
  }

  // Show section if there's any content (description, artworkContents, or detail)
  const hasAnyContent = artworkDescription || artworkContents.length > 0 || detail;
  
  if (!hasAnyContent) {
    return null;
  }

  // Check if there is any narrative text
  const hasNarrative = 
    detail?.cauChuyenSangTac || 
    detail?.yNghiaNghiThuat || 
    detail?.kyThuatThucHien || 
    detail?.camHungSangTao || 
    detail?.thongTinBosung;

  // Check if there is any spec info
  const hasSpecs = 
    detail?.kichThuoc || 
    detail?.chatLieu || 
    detail?.chatLieuKhung || 
    detail?.namSangTac || 
    detail?.diaDiemSangTac;

  // Get additional images
  const additionalImages = detail ? [
    detail.hinhAnh1,
    detail.hinhAnh2,
    detail.hinhAnh3,
    detail.hinhAnh4
  ].filter(Boolean) as string[] : [];

  return (
    <div className="artwork-detail-section-wrapper">
      <div className="section-divider">
        <div className="divider-line"></div>
        <div className="divider-icon">
          <i className="ti-palette"></i>
        </div>
        <div className="divider-line"></div>
      </div>

      <h2 className="detail-section-title">Câu Chuyện & Chi Tiết Tác Phẩm</h2>
      
      {/* Phần mô tả ngắn từ artwork.moTa */}
      {(artworkDescription || artworkContents.length > 0) && (
        <div className="artwork-basic-description">
          {artworkDescription && (
            <div className="original-description">
              <p>"{artworkName}" {artworkDescription}</p>
            </div>
          )}
          
          {/* Render approved additional contents */}
          {artworkContents.length > 0 && (
            <div className="additional-contents">
              {artworkContents.map(content => (
                <div key={content.maNoiDung} className="content-item">
                  {content.tieuDe && <h4>{content.tieuDe}</h4>}
                  {content.moTa && <p>{content.moTa}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="detail-section-grid">
        {/* Left Column: Story & Narratives */}
        {hasNarrative && (
          <div className="detail-narratives">
            {detail.cauChuyenSangTac && (
              <div className="narrative-card story">
                <h3>
                  <i className="ti-book"></i> Câu Chuyện Sáng Tác
                </h3>
                <p className="narrative-text">{detail.cauChuyenSangTac}</p>
              </div>
            )}

            {detail.yNghiaNghiThuat && (
              <div className="narrative-card meaning">
                <h3>
                  <i className="ti-heart"></i> Ý Nghĩa Nghệ Thuật
                </h3>
                <p className="narrative-text">{detail.yNghiaNghiThuat}</p>
              </div>
            )}

            {detail.kyThuatThucHien && (
              <div className="narrative-card technique">
                <h3>
                  <i className="ti-brush"></i> Kỹ Thuật Thực Hiện
                </h3>
                <p className="narrative-text">{detail.kyThuatThucHien}</p>
              </div>
            )}

            {detail.camHungSangTao && (
              <div className="narrative-card inspiration">
                <h3>
                  <i className="ti-light-bulb"></i> Cảm Hứng Sáng Tạo
                </h3>
                <p className="narrative-text">{detail.camHungSangTao}</p>
              </div>
            )}

            {detail.thongTinBosung && (
              <div className="narrative-card additional">
                <h3>
                  <i className="ti-info-alt"></i> Thông Tin Triển Lãm & Giải Thưởng
                </h3>
                <p className="narrative-text">{detail.thongTinBosung}</p>
              </div>
            )}
          </div>
        )}

        {/* Right Column: Specs Panel */}
        {hasSpecs && (
          <div className="detail-specifications">
            <div className="specs-card">
              <h3>
                <i className="ti-layout-grid3"></i> Thông Số Tác Phẩm
              </h3>
              
              <div className="specs-list">
                {detail.kichThuoc && (
                  <div className="spec-row">
                    <span className="spec-label">Kích thước</span>
                    <span className="spec-value">{detail.kichThuoc}</span>
                  </div>
                )}
                {detail.chatLieu && (
                  <div className="spec-row">
                    <span className="spec-label">Chất liệu vẽ</span>
                    <span className="spec-value">{detail.chatLieu}</span>
                  </div>
                )}
                {detail.chatLieuKhung && (
                  <div className="spec-row">
                    <span className="spec-label">Chất liệu khung</span>
                    <span className="spec-value">{detail.chatLieuKhung}</span>
                  </div>
                )}
                {detail.namSangTac && (
                  <div className="spec-row">
                    <span className="spec-label">Năm sáng tác</span>
                    <span className="spec-value">{detail.namSangTac}</span>
                  </div>
                )}
                {detail.diaDiemSangTac && (
                  <div className="spec-row">
                    <span className="spec-label">Địa điểm</span>
                    <span className="spec-value">{detail.diaDiemSangTac}</span>
                  </div>
                )}
              </div>

              {/* Painter Card Info */}
              <div className="painter-quick-card">
                <div className="painter-avatar">
                  {detail.avatarHoaSi ? (
                    <img src={detail.avatarHoaSi} alt={detail.tenHoaSi} />
                  ) : (
                    <div className="avatar-placeholder">
                      {detail.tenHoaSi.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="painter-meta">
                  <span className="painter-role">Tác giả</span>
                  <span className="painter-name">{detail.tenHoaSi}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supplementary Gallery Section - Ẩn vì đã hiển thị ở thumbnails */}
      {/* {additionalImages.length > 0 && (
        <div className="supplementary-gallery-wrapper">
          <h3 className="gallery-title">
            <i className="ti-gallery"></i> Hình Ảnh Góc Nhìn Tác Phẩm
          </h3>
          <div className="gallery-grid">
            {additionalImages.map((img, index) => (
              <div 
                key={index} 
                className="gallery-item"
                onClick={() => setActiveZoomImg(img)}
              >
                <img src={img} alt={`Góc nhìn ${index + 1}`} />
                <div className="item-overlay">
                  <i className="ti-zoom-in"></i>
                  <span>Xem chi tiết</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Lightbox / Zoom Modal */}
      {activeZoomImg && (
        <div className="lightbox-overlay" onClick={() => setActiveZoomImg(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveZoomImg(null)}>
              ✕
            </button>
            <img src={activeZoomImg} alt="Phóng to chi tiết tác phẩm" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetailSection;
