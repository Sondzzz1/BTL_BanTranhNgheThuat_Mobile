import React, { useState, useEffect } from 'react';
import { contentService, BaiVietResponse } from '../services/contentService';
import './News.css';

const News: React.FC = () => {
    const [articles, setArticles] = useState<BaiVietResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                // API này mặc định chỉ trả về các bài viết đã được duyệt
                const data = await contentService.layTatCaBaiViet();
                setArticles(data);
            } catch (error) {
                console.error("Error fetching articles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    return (
        <div className="news-page">
            {/* Hero Section */}
            <section className="news-hero">
                <div className="hero-content">
                    <h1 className="fade-in-up">Tin Tức & Sự Kiện</h1>
                    <p className="fade-in-up delay-1">Cập nhật những thông tin mới nhất về nghệ thuật, triển lãm và sự kiện</p>
                </div>
            </section>

            {/* News Content */}
            <section className="news-content">
                <div className="container" style={{ display: 'block', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    {/* Featured News */}
                    <div className="featured-news fade-in">
                        <div className="featured-image">
                            {/* Assuming images are copied to public or accessible. Using placeholder if not */}
                            <img src="/assets/tintucnoibat/camtucau.webp" alt="Triển lãm tranh" />
                            <div className="featured-overlay">
                                <span className="featured-badge">NỔI BẬT</span>
                            </div>
                        </div>
                        <div className="featured-info">
                            <span className="news-date">
                                <i className="ti-calendar"></i> 15/01/2025
                            </span>
                            <h2>Triển lãm tranh "Cảm Từ Cầu" - Họa sĩ Lân Vũ</h2>
                            <p>Triển lãm tranh đặc biệt của họa sĩ Lân Vũ với chủ đề "Cảm Từ Cầu" sẽ được tổ chức tại LanVu Gallery từ ngày 20/01 đến 28/01/2025. Đây là cơ hội để người yêu nghệ thuật chiêm ngưỡng những tác phẩm độc đáo...</p>
                            <a href="#" className="read-more-btn">
                                Đọc thêm <i className="ti-arrow-right"></i>
                            </a>
                        </div>
                    </div>

                    {/* News Grid */}
                    <div className="news-grid">
                        {loading ? (
                            <div className="loading-state">Đang tải tin tức...</div>
                        ) : articles.length > 0 ? (
                            articles.map(article => (
                                <article key={article.maBaiViet} className="news-card fade-in">
                                    <div className="news-card-image">
                                        <img 
                                            src={article.anhTieuDe || "/assets/tintucnoibat/ngamsen.webp"} 
                                            alt={article.tieuDe} 
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.onerror = null;
                                                img.src = 'https://via.placeholder.com/600x400?text=No+Image';
                                            }}
                                        />
                                        <div className="news-card-overlay">
                                            <a href="#" className="view-btn"><i className="ti-eye"></i></a>
                                        </div>
                                    </div>
                                    <div className="news-card-content">
                                        <span className="news-category">Tin tức</span>
                                        <span className="news-date">
                                            <i className="ti-calendar"></i> {new Date(article.ngayDang).toLocaleDateString('vi-VN')}
                                        </span>
                                        <h3>{article.tieuDe}</h3>
                                        <p style={{ 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 3, 
                                            WebkitBoxOrient: 'vertical', 
                                            overflow: 'hidden' 
                                        }}>
                                            {article.noiDung ? article.noiDung.replace(/<[^>]+>/g, '') : 'Chưa có nội dung...'}
                                        </p>
                                        <p className="author-name" style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                                            Đăng bởi: <strong>{article.tenHoaSi}</strong>
                                        </p>
                                        <a href="#" className="read-more">Đọc thêm →</a>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="no-data-state">Hiện tại chưa có tin tức nào.</div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default News;
