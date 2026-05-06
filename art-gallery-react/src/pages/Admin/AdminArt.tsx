import React, { useState, useEffect } from 'react';
import { adminService, TacPhamHoaSiResponse } from '../../services/adminService';

const AdminArt: React.FC = () => {
    const [artworks, setArtworks] = useState<TacPhamHoaSiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<number>(-1);

    useEffect(() => {
        loadArtworks();
    }, []);

    const loadArtworks = async () => {
        setLoading(true);
        try {
            const data = await adminService.getArtworks();
            setArtworks(data);
        } catch (error) {
            console.error('Error loading artworks:', error);
            alert('Không thể tải danh sách tác phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn duyệt tác phẩm này?')) {
            try {
                await adminService.approveArtwork(id, true);
                alert('Duyệt tác phẩm thành công!');
                loadArtworks();
            } catch (error) {
                console.error('Error approving artwork:', error);
                alert('Có lỗi xảy ra khi duyệt tác phẩm.');
            }
        }
    };

    const handleReject = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn từ chối tác phẩm này?')) {
            try {
                await adminService.approveArtwork(id, false);
                alert('Từ chối tác phẩm thành công!');
                loadArtworks();
            } catch (error) {
                console.error('Error rejecting artwork:', error);
                alert('Có lỗi xảy ra khi từ chối tác phẩm.');
            }
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const filteredArtworks = artworks.filter(art => {
        if (statusFilter === -1) return true;
        return art.trangThai === statusFilter;
    });

    return (
        <div id="art" className="page">
            <div className="art-header">
                <h4><i className="ti-image"></i> Duyệt Tác Phẩm</h4>
                <button className="btn-refresh" onClick={loadArtworks}>
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            <div className="filter-bar">
                <div className="filter-item">
                    <label>Trạng thái:</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(Number(e.target.value))}
                    >
                        <option value={-1}>Tất cả ({artworks.length})</option>
                        <option value={0}>Chờ duyệt ({artworks.filter(a => a.trangThai === 0).length})</option>
                        <option value={1}>Đã duyệt ({artworks.filter(a => a.trangThai === 1).length})</option>
                        <option value={2}>Từ chối ({artworks.filter(a => a.trangThai === 2).length})</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : filteredArtworks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Không tìm thấy tác phẩm nào.</p>
                </div>
            ) : (
                <table className="art-table">
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên tranh</th>
                            <th>Danh mục</th>
                            <th>Tác giả</th>
                            <th>Giá bán</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArtworks.map((artwork) => (
                            <tr key={artwork.maTacPham}>
                                <td>
                                    <img 
                                        src={artwork.hinhAnh || 'https://via.placeholder.com/80?text=No+Image'}
                                        alt={artwork.tenTacPham}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                                        }}
                                    />
                                </td>
                                <td>{artwork.tenTacPham}</td>
                                <td>{artwork.tenDanhMuc || '-'}</td>
                                <td>{artwork.tenHoaSi || '-'}</td>
                                <td>{formatPrice(artwork.gia)}</td>
                                <td>
                                    <span className={`status ${
                                        artwork.trangThai === 0 ? 'pending' : 
                                        artwork.trangThai === 1 ? 'success' : 
                                        artwork.trangThai === 2 ? 'canceled' : ''
                                    }`}>
                                        {artwork.trangThaiText}
                                    </span>
                                </td>
                                <td>
                                    {artwork.trangThai === 0 ? (
                                        <>
                                            <button 
                                                className="approve-btn"
                                                onClick={() => handleApprove(artwork.maTacPham)}
                                                title="Duyệt"
                                            >
                                                <i className="ti-check"></i> Duyệt
                                            </button>
                                            <button 
                                                className="reject-btn"
                                                onClick={() => handleReject(artwork.maTacPham)}
                                                title="Từ chối"
                                            >
                                                <i className="ti-close"></i> Từ chối
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                className="edit-btn"
                                                title="Sửa"
                                            >
                                                <i className="ti-pencil"></i>
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                title="Xóa"
                                            >
                                                <i className="ti-trash"></i>
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminArt;
