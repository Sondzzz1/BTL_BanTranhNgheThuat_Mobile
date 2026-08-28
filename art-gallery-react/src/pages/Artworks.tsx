import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Artwork } from '../types';
import './Artworks.css';

const Artworks: React.FC = () => {
    const { artworks, loading } = useAppContext();
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [authorFilter, setAuthorFilter] = useState<string>('');
    const [sizeFilter, setSizeFilter] = useState<string>('');
    const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);

    // Get unique authors
    const authors = Array.from(new Set(artworks.map(art => art.tacGia)));

    useEffect(() => {
        let filtered = artworks;

        if (categoryFilter) {
            filtered = filtered.filter(art => art.danhMuc === categoryFilter);
        }

        if (authorFilter) {
            filtered = filtered.filter(art => art.tacGia === authorFilter);
        }

        if (sizeFilter) {
            // Lọc theo cạnh lớn nhất (cm) trong chuỗi kichThuoc, ví dụ "60x80 cm"
            filtered = filtered.filter(art => {
                if (!art.kichThuoc) return false;
                const numbers = art.kichThuoc.match(/\d+/g)?.map(Number) ?? [];
                if (numbers.length === 0) return false;
                const maxSide = Math.max(...numbers);
                if (sizeFilter === 'Small') return maxSide < 60;
                if (sizeFilter === 'Medium') return maxSide >= 60 && maxSide < 90;
                if (sizeFilter === 'Large') return maxSide >= 90;
                return true;
            });
        }

        setFilteredArtworks(filtered);
    }, [artworks, categoryFilter, authorFilter, sizeFilter]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    return (
        <div className="artworks-page">
            <div className="artworks-container">
                <div className="sidebar">
                    <h2>Tác phẩm | Tranh sơn dầu</h2>

                    <h3>Chuyên mục</h3>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">- Tất cả chuyên mục -</option>
                        <option value="Tranh sơn dầu">Tranh sơn dầu</option>
                        <option value="Tranh sơn mài">Tranh sơn mài</option>
                        <option value="Tranh cổ điển">Tranh cổ điển</option>
                    </select>

                    <h3>Họa sĩ</h3>
                    <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                    >
                        <option value="">- Chọn họa sĩ -</option>
                        {authors.map(author => (
                            <option key={author} value={author}>{author}</option>
                        ))}
                    </select>

                    <h3>Kích thước</h3>
                    <select
                        value={sizeFilter}
                        onChange={(e) => setSizeFilter(e.target.value)}
                    >
                        <option value="">- Chọn kích thước -</option>
                        <option value="Small">Nhỏ</option>
                        <option value="Medium">Vừa</option>
                        <option value="Large">Lớn</option>
                    </select>

                    <button
                        onClick={() => {
                            setCategoryFilter('');
                            setAuthorFilter('');
                            setSizeFilter('');
                        }}
                        style={{
                            marginTop: '20px',
                            padding: '10px',
                            width: '100%',
                            backgroundColor: '#ff6b35',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Xóa bộ lọc
                    </button>
                </div>

                <div className="photograph">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', width: '100%' }}>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredArtworks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', width: '100%' }}>
                            <p>Không tìm thấy tác phẩm nào</p>
                        </div>
                    ) : (
                        <div className="photograph-min">
                            {filteredArtworks.map((artwork) => (
                                <Link
                                    key={artwork.id}
                                    to={`/artworks/${artwork.id}`}
                                    className="painting"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <img
                                        src={artwork.anhTranh}
                                        alt={artwork.tenTranh}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                        }}
                                    />
                                    <p className="category">{artwork.danhMuc.toUpperCase()}</p>
                                    <p className="name">{artwork.tenTranh}</p>
                                    <p className="price">{formatPrice(artwork.giaBan)}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Artworks;
