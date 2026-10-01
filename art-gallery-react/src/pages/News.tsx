import React, { useState, useEffect } from 'react';
import { contentService, BaiVietResponse } from '../services/contentService';
import './News.css';
import { blogExcerpt } from '../types/blogContent';

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
                    {articles[0] && <div className="featured-news fade-in">
                        <div className="featured-image">
                            <img src={articles[0].anhTieuDe || '/assets/images/no-image.svg'} alt={articles[0].tieuDe} />
                            <div className="featured-overlay"><span className="featured-badge">MỚI NHẤT</span></div>
                        </div>
                        <div className="featured-info">
                            <span className="news-date"><i className="ti-calendar"></i> {new Date(articles[0].ngayXuatBan || articles[0].ngayDang).toLocaleDateString('vi-VN')}</span>
                            <h2>{articles[0].tieuDe}</h2>
                            <p>{articles[0].tomTat || blogExcerpt(articles[0].noiDung) || 'Bài viết chưa có phần tóm tắt.'}</p>
                        </div>
                    </div>}

                    {/* News Grid */}
                    <div className="news-grid">
                        {loading ? (
                            <div className="loading-state">Đang tải tin tức...</div>
                        ) : articles.length > 0 ? (
                            articles.slice(1).map(article => (
                                <article key={article.maBaiViet} className="news-card fade-in">
                                    <div className="news-card-image">
                                        <img 
                                            src={article.anhTieuDe || "/assets/tintucnoibat/ngamsen.webp"} 
                                            alt={article.tieuDe} 
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.onerror = null;
                                                img.src = '/assets/images/no-image.svg';
                                            }}
                                        />
                                        <div className="news-card-overlay">
                                            <a href="#" className="view-btn"><i className="ti-eye"></i></a>
                                        </div>
                                    </div>
                                    <div className="news-card-content">
                                        <span className="news-category">{article.tenDanhMuc || 'Góc nghệ thuật'}</span>
                                        <span className="news-date">
                                            <i className="ti-calendar"></i> {new Date(article.ngayXuatBan || article.ngayDang).toLocaleDateString('vi-VN')}
                                        </span>
                                        <h3>{article.tieuDe}</h3>
                                        <p style={{ 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 3, 
                                            WebkitBoxOrient: 'vertical', 
                                            overflow: 'hidden' 
                                        }}>
                                            {article.tomTat || blogExcerpt(article.noiDung) || 'Chưa có nội dung...'}
                                        </p>
                                        <p className="author-name" style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                                            Đăng bởi: <strong>{article.tenTacGia || article.tenHoaSi}</strong>
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
