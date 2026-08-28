import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import './AdminArtistArtworks.css';

interface Artwork {
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi?: string;
    tenDanhMuc?: string;
    gia: number;
    soLuong: number;
    hinhAnh?: string;
    moTa?: string;
    trangThai: number;
    ngayTao: string;
    luotXem?: number;
    kichThuoc?: string;
    chatLieu?: string;
    chatLieuKhung?: string;
}

interface Artist {
    id: number;
    tenHoaSi: string;
    email: string;
    soDienThoai: string;
    tieuSu?: string;
    anhDaiDien?: string;
    trangThai: boolean;
    soTacPham?: number;
    doanhThu?: number;
    diaChi?: string;
    chuyenMon?: string;
}

const AdminArtistArtworks: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<number | 'all'>('all');
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            setError(null);

            // Load thông tin họa sĩ
            const artistData = await adminService.getHoaSiById(parseInt(id));
            setArtist(artistData);

            // Load danh sách tác phẩm của họa sĩ
            const artworksData = await adminService.getTacPhamCuaHoaSi(parseInt(id));
            setArtworks(artworksData);
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError(err.response?.data?.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status: number): string => {
        switch (status) {
            case 0: return 'Chờ duyệt';
            case 1: return 'Đang bán';
            case 2: return 'Ẩn';
            case 3: return 'Từ chối';
            case 99: return 'Đã xóa';
            default: return 'Không xác định';
        }
    };

    const getStatusClass = (status: number): string => {
        switch (status) {
            case 0: return 'status-pending';
            case 1: return 'status-active';
            case 2: return 'status-hidden';
            case 3: return 'status-rejected';
            case 99: return 'status-deleted';
            default: return '';
        }
    };

    const handleApprove = async (artworkId: number) => {
        if (!window.confirm('Bạn có chắc muốn duyệt tác phẩm này?')) return;

        try {
            await adminService.duyetTacPham(artworkId, { pheDuyet: true });
            alert('Duyệt tác phẩm thành công!');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleReject = async (artworkId: number) => {
        const reason = prompt('Nhập lý do từ chối:');
        if (!reason) return;

        try {
            await adminService.duyetTacPham(artworkId, { pheDuyet: false, lyDo: reason });
            alert('Từ chối tác phẩm thành công!');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleHide = async (artworkId: number) => {
        if (!window.confirm('Bạn có chắc muốn ẩn tác phẩm này?')) return;

        try {
            await adminService.hideTacPham(artworkId);
            alert('Ẩn tác phẩm thành công!');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleShow = async (artworkId: number) => {
        if (!window.confirm('Bạn có chắc muốn hiển thị lại tác phẩm này?')) return;

        try {
            await adminService.showTacPham(artworkId);
            alert('Hiển thị tác phẩm thành công!');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (artworkId: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa tác phẩm này? Hành động này không thể hoàn tác!')) return;

        try {
            await adminService.xoaTacPham(artworkId);
            alert('Xóa tác phẩm thành công!');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const filteredArtworks = artworks.filter(artwork => {
        const matchStatus = filterStatus === 'all' || artwork.trangThai === filterStatus;
        const matchSearch = artwork.tenTacPham.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                           (artwork.tenDanhMuc || '').toLowerCase().includes(searchKeyword.toLowerCase());
        return matchStatus && matchSearch;
    });

    if (loading) {
        return (
            <div className="admin-artist-artworks">
                <div className="loading">Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-artist-artworks">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate('/admin/authors')} className="btn-back">
                    Quay lại danh sách họa sĩ
                </button>
            </div>
        );
    }

    return (
        <div className="admin-artist-artworks">
            {/* Header với thông tin họa sĩ */}
            <div className="artist-header">
                <button onClick={() => navigate('/admin/authors')} className="btn-back">
                    <i className="ti-arrow-left"></i> Quay lại
                </button>
                <div className="artist-info">
                    {artist?.anhDaiDien && (
                        <img src={artist.anhDaiDien} alt={artist.tenHoaSi} className="artist-avatar" />
                    )}
                    <div className="artist-details">
                        <h2>{artist?.tenHoaSi}</h2>
                        <p><i className="ti-email"></i> {artist?.email}</p>
                        <p><i className="ti-mobile"></i> {artist?.soDienThoai}</p>
                        <p><i className="ti-location-pin"></i> {artist?.diaChi}</p>
                        {artist?.chuyenMon && (
                            <p><i className="ti-palette"></i> Chuyên môn: {artist.chuyenMon}</p>
                        )}
                        <span className={`artist-status ${artist?.trangThai ? 'active' : 'inactive'}`}>
                            {artist?.trangThai ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bộ lọc và tìm kiếm */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Trạng thái:</label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="filter-select"
                    >
                        <option value="all">Tất cả</option>
                        <option value="0">Chờ duyệt</option>
                        <option value="1">Đang bán</option>
                        <option value="2">Ẩn</option>
                        <option value="3">Từ chối</option>
                        <option value="99">Đã xóa</option>
                    </select>
                </div>
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Tìm kiếm tác phẩm..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="search-input"
                    />
                    <i className="ti-search"></i>
                </div>
            </div>

            {/* Thống kê */}
            <div className="stats-section">
                <div className="stat-card">
                    <i className="ti-image"></i>
                    <div>
                        <h3>{artworks.length}</h3>
                        <p>Tổng tác phẩm</p>
                    </div>
                </div>
                <div className="stat-card pending">
                    <i className="ti-time"></i>
                    <div>
                        <h3>{artworks.filter(a => a.trangThai === 0).length}</h3>
                        <p>Chờ duyệt</p>
                    </div>
                </div>
                <div className="stat-card active">
                    <i className="ti-check"></i>
                    <div>
                        <h3>{artworks.filter(a => a.trangThai === 1).length}</h3>
                        <p>Đang bán</p>
                    </div>
                </div>
                <div className="stat-card rejected">
                    <i className="ti-close"></i>
                    <div>
                        <h3>{artworks.filter(a => a.trangThai === 3).length}</h3>
                        <p>Từ chối</p>
                    </div>
                </div>
            </div>

            {/* Danh sách tác phẩm */}
            <div className="artworks-section">
                <h3>Danh sách tác phẩm ({filteredArtworks.length})</h3>
                
                {filteredArtworks.length === 0 ? (
                    <div className="no-data">
                        <i className="ti-image"></i>
                        <p>Không có tác phẩm nào</p>
                    </div>
                ) : (
                    <div className="artworks-grid">
                        {filteredArtworks.map(artwork => (
                            <div key={artwork.maTacPham} className="artwork-card">
                                <div className="artwork-image">
                                    <img src={artwork.hinhAnh || ''} alt={artwork.tenTacPham} />
                                    <span className={`status-badge ${getStatusClass(artwork.trangThai)}`}>
                                        {getStatusText(artwork.trangThai)}
                                    </span>
                                </div>
                                <div className="artwork-info">
                                    <h4>{artwork.tenTacPham}</h4>
                                    <p className="category">
                                        <i className="ti-folder"></i> {artwork.tenDanhMuc || 'Chưa phân loại'}
                                    </p>
                                    <p className="price">
                                        <i className="ti-money"></i> {artwork.gia.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                    <p className="quantity">
                                        <i className="ti-package"></i> Số lượng: {artwork.soLuong}
                                    </p>
                                    <p className="views">
                                        <i className="ti-eye"></i> {artwork.luotXem || 0} lượt xem
                                    </p>
                                    <p className="date">
                                        <i className="ti-calendar"></i> {new Date(artwork.ngayTao).toLocaleDateString('vi-VN')}
                                    </p>
                                    
                                    {/* Nút hành động */}
                                    <div className="artwork-actions">
                                        {artwork.trangThai === 0 && (
                                            <>
                                                <button 
                                                    onClick={() => handleApprove(artwork.maTacPham)}
                                                    className="btn-approve"
                                                    title="Duyệt"
                                                >
                                                    <i className="ti-check"></i>
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(artwork.maTacPham)}
                                                    className="btn-reject"
                                                    title="Từ chối"
                                                >
                                                    <i className="ti-close"></i>
                                                </button>
                                            </>
                                        )}
                                        {artwork.trangThai === 1 && (
                                            <button 
                                                onClick={() => handleHide(artwork.maTacPham)}
                                                className="btn-hide"
                                                title="Ẩn"
                                            >
                                                <i className="ti-eye"></i>
                                            </button>
                                        )}
                                        {artwork.trangThai === 2 && (
                                            <button 
                                                onClick={() => handleShow(artwork.maTacPham)}
                                                className="btn-show"
                                                title="Hiển thị"
                                            >
                                                <i className="ti-eye"></i>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(artwork.maTacPham)}
                                            className="btn-delete"
                                            title="Xóa"
                                        >
                                            <i className="ti-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminArtistArtworks;
