import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import {
    adminService,
    AdminArtworkFilterOption,
    TacPhamHoaSiResponse,
} from '../../services/adminService';
import { formatVnd } from '../../utils/currency';
import './AdminArt.css';

const STATUS_TEXT: Record<number, string> = {
    0: 'Chờ duyệt',
    1: 'Đang bán',
    2: 'Đang ẩn',
    3: 'Từ chối',
    99: 'Đã xóa (Họa sĩ)',
};

const STATUS_CLASS: Record<number, string> = {
    0: 'pending',
    1: 'success',
    2: 'shipped',
    3: 'canceled',
    99: 'canceled',
};

const PAGE_SIZE = 20;

type ArtworkFilters = {
    keyword: string;
    maHoaSi: string;
    maDanhMuc: string;
    trangThai: string;
    loaiPhatHanh: string;
    tonKho: string;
    sapXep: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'artist';
};

const DEFAULT_ARTWORK_FILTERS: ArtworkFilters = {
    keyword: '',
    maHoaSi: '',
    maDanhMuc: '',
    trangThai: '',
    loaiPhatHanh: '',
    tonKho: '',
    sapXep: 'newest',
};

interface TacPhamChinhSuaResponse {
    maChinhSua: number;
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi: string;
    tenDanhMuc?: string;
    gia: number;
    soLuong: number;
    hinhAnh?: string;
    trangThai: number;
    ngayChinhSua: string;
    lyDo?: string;
}

interface ArtworkDetailResponse {
    maChiTiet: number;
    maTacPham: number;
    tenTacPham: string;
    maHoaSi: number;
    tenHoaSi: string;
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
    trangThai: number;
    trangThaiText: string;
    lyDoTuChoi?: string;
}

const AdminArt: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'artworks' | 'edits'>('artworks');
    const [artworks, setArtworks] = useState<TacPhamHoaSiResponse[]>([]);
    const [edits, setEdits] = useState<TacPhamChinhSuaResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ArtworkFilters>(DEFAULT_ARTWORK_FILTERS);
    const [artists, setArtists] = useState<AdminArtworkFilterOption[]>([]);
    const [categories, setCategories] = useState<AdminArtworkFilterOption[]>([]);
    const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 });
    const [groupByArtist, setGroupByArtist] = useState(false);
    const [selectedArtwork, setSelectedArtwork] = useState<TacPhamHoaSiResponse | null>(null);
    const [selectedArtworkDetail, setSelectedArtworkDetail] = useState<ArtworkDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailMessage, setDetailMessage] = useState('');

    useEffect(() => {
        if (activeTab === 'artworks') {
            void loadArtworks(1);
            void loadFilterOptions();
        } else {
            loadEdits();
        }
        // Bộ lọc chỉ được áp dụng khi Admin nhấn nút "Lọc"; không tự tải lại khi đang nhập.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const loadFilterOptions = async () => {
        try {
            const data = await adminService.getBoLocTacPhamQuanLy();
            setArtists(data.hoaSi);
            setCategories(data.danhMuc);
        } catch (error) {
            // Danh sách vẫn dùng được khi một bộ lọc phụ chưa tải được.
            console.error('Không thể tải dữ liệu bộ lọc tác phẩm:', error);
        }
    };

    const loadArtworks = async (page = pageInfo.page, activeFilters = filters) => {
        setLoading(true);
        try {
            const data = await adminService.getTacPhamQuanLy({
                keyword: activeFilters.keyword.trim() || undefined,
                maHoaSi: activeFilters.maHoaSi ? Number(activeFilters.maHoaSi) : undefined,
                maDanhMuc: activeFilters.maDanhMuc ? Number(activeFilters.maDanhMuc) : undefined,
                trangThai: activeFilters.trangThai ? Number(activeFilters.trangThai) : undefined,
                laTacPhamDocBan: activeFilters.loaiPhatHanh === 'doc-ban'
                    ? true
                    : activeFilters.loaiPhatHanh === 'nhieu-ban'
                        ? false
                        : undefined,
                tonKho: activeFilters.tonKho as 'con_hang' | 'sap_het' | 'het_hang' || undefined,
                sapXep: activeFilters.sapXep,
                page,
                pageSize: PAGE_SIZE,
            });
            setArtworks(data.items);
            setPageInfo({
                page: data.page,
                pageSize: data.pageSize,
                totalItems: data.totalItems,
                totalPages: data.totalPages,
            });
        } catch (error) {
            console.error('Error loading artworks:', error);
            alert('Không thể tải danh sách tác phẩm');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => void loadArtworks(1);

    const clearFilters = () => {
        setFilters(DEFAULT_ARTWORK_FILTERS);
        void loadArtworks(1, DEFAULT_ARTWORK_FILTERS);
    };

    const refreshArtworkList = async () => {
        const targetPage = artworks.length === 1 && pageInfo.page > 1
            ? pageInfo.page - 1
            : pageInfo.page;
        await loadArtworks(targetPage);
    };

    const loadEdits = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<TacPhamChinhSuaResponse[]>('/admin/tac-pham-chinh-sua');
            console.log('Loaded edits:', response.data); // Debug log
            setEdits(response.data);
        } catch (error: any) {
            console.error('Error loading edits:', error);
            console.error('Error response:', error.response?.data);
            alert('Không thể tải danh sách chỉnh sửa: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!window.confirm('Phê duyệt tác phẩm này?')) return;
        try {
            await adminService.approveArtwork(id, true);
            setSelectedArtwork(null);
            setSelectedArtworkDetail(null);
            await refreshArtworkList();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi duyệt tác phẩm.');
        }
    };

    const handleReject = async (id: number) => {
        const input = window.prompt('Nhập lý do từ chối (tuỳ chọn):');
        if (input === null) return;
        const lyDo = input.trim() || undefined;
        try {
            await adminService.duyetTacPham(id, { pheDuyet: false, lyDo });
            setSelectedArtwork(null);
            setSelectedArtworkDetail(null);
            await refreshArtworkList();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối tác phẩm.');
        }
    };

    const openArtworkDetail = async (artwork: TacPhamHoaSiResponse) => {
        setSelectedArtwork(artwork);
        setSelectedArtworkDetail(null);
        setDetailMessage('');
        setDetailLoading(true);
        try {
            const response = await apiClient.get<ArtworkDetailResponse>(`/admin/chi-tiet-tac-pham/${artwork.maTacPham}`);
            setSelectedArtworkDetail(response.data);
        } catch (error: any) {
            if (error?.response?.status === 404) {
                setDetailMessage('Họa sĩ chưa cung cấp nội dung chi tiết riêng cho tác phẩm này.');
            } else {
                setDetailMessage(error?.response?.data?.message || 'Không thể tải nội dung chi tiết tác phẩm.');
            }
        } finally {
            setDetailLoading(false);
        }
    };

    const closeArtworkDetail = () => {
        setSelectedArtwork(null);
        setSelectedArtworkDetail(null);
        setDetailMessage('');
    };

    const refreshSelectedDetail = async () => {
        if (!selectedArtwork) return;
        const response = await apiClient.get<ArtworkDetailResponse>(`/admin/chi-tiet-tac-pham/${selectedArtwork.maTacPham}`);
        setSelectedArtworkDetail(response.data);
    };

    const handleApproveDetailContent = async () => {
        if (!selectedArtworkDetail || !window.confirm('Phê duyệt nội dung chi tiết và thư viện ảnh này?')) return;
        try {
            await apiClient.put(`/admin/chi-tiet-tac-pham/${selectedArtworkDetail.maTacPham}/duyet`, {
                pheDuyet: true,
                lyDoTuChoi: null,
            });
            await refreshSelectedDetail();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể duyệt nội dung chi tiết.');
        }
    };

    const handleRejectDetailContent = async () => {
        if (!selectedArtworkDetail) return;
        const reason = window.prompt('Nhập lý do từ chối nội dung chi tiết:');
        if (reason === null) return;
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do từ chối nội dung chi tiết.');
            return;
        }
        try {
            await apiClient.put(`/admin/chi-tiet-tac-pham/${selectedArtworkDetail.maTacPham}/duyet`, {
                pheDuyet: false,
                lyDoTuChoi: reason.trim(),
            });
            await refreshSelectedDetail();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể từ chối nội dung chi tiết.');
        }
    };

    const handleHide = async (id: number) => {
        if (!window.confirm('Ẩn tác phẩm này khỏi cửa hàng?')) return;
        try {
            await apiClient.put(`/admin/tac-pham/${id}/hide`);
            await refreshArtworkList();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể ẩn tác phẩm');
        }
    };

    const handleShow = async (id: number) => {
        if (!window.confirm('Mở hiển thị tác phẩm trở lại?')) return;
        try {
            await apiClient.put(`/admin/tac-pham/${id}/show`);
            await refreshArtworkList();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể mở hiển thị tác phẩm');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Xoá vĩnh viễn tác phẩm này?')) return;
        try {
            await adminService.xoaTacPham(id);
            await refreshArtworkList();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể xoá tác phẩm');
        }
    };

    const handleApproveEdit = async (maChinhSua: number) => {
        if (!window.confirm('Phê duyệt chỉnh sửa này?')) return;
        try {
            await apiClient.put(`/admin/tac-pham-chinh-sua/${maChinhSua}/duyet`, {
                pheDuyet: true
            });
            alert('Đã duyệt chỉnh sửa thành công!');
            await loadEdits();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi duyệt chỉnh sửa.');
        }
    };

    const handleRejectEdit = async (maChinhSua: number) => {
        const lyDo = window.prompt('Nhập lý do từ chối:');
        if (lyDo === null) return;
        if (!lyDo.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }
        try {
            await apiClient.put(`/admin/tac-pham-chinh-sua/${maChinhSua}/duyet`, {
                pheDuyet: false,
                lyDo: lyDo
            });
            alert('Đã từ chối chỉnh sửa!');
            await loadEdits();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối chỉnh sửa.');
        }
    };

    const formatPrice = formatVnd;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const artworksByArtist = artworks.reduce<Record<string, TacPhamHoaSiResponse[]>>((groups, artwork) => {
        const artistName = artwork.tenHoaSi || 'Chưa xác định họa sĩ';
        if (!groups[artistName]) groups[artistName] = [];
        groups[artistName].push(artwork);
        return groups;
    }, {});

    // STT được tính theo thứ tự đang hiển thị của toàn bộ trang hiện tại, không dùng mã nội bộ của tác phẩm.
    const artworkDisplayOrder = groupByArtist
        ? Object.keys(artworksByArtist)
            .sort((a, b) => a.localeCompare(b, 'vi'))
            .flatMap((artistName) => artworksByArtist[artistName])
        : artworks;
    const getArtworkSequence = (artwork: TacPhamHoaSiResponse) =>
        (pageInfo.page - 1) * pageInfo.pageSize + artworkDisplayOrder.indexOf(artwork) + 1;

    const renderArtworkRow = (artwork: TacPhamHoaSiResponse) => (
        <tr key={artwork.maTacPham}>
            <td className="artwork-sequence">{getArtworkSequence(artwork)}</td>
            <td>
                <img
                    src={artwork.hinhAnh || '/assets/images/no-image.svg'}
                    alt={artwork.tenTacPham}
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/no-image.svg';
                    }}
                />
            </td>
            <td>
                <strong>{artwork.tenTacPham}</strong>
                <br />
                <small style={{ color: '#64748b' }}>{artwork.laTacPhamDocBan ? 'Độc bản' : 'Nhiều bản'}</small>
            </td>
            <td>{artwork.tenDanhMuc || '-'}</td>
            <td>{artwork.tenHoaSi || '-'}</td>
            <td>{formatPrice(artwork.gia)}</td>
            <td>
                <span className={`status ${STATUS_CLASS[artwork.trangThai] || ''}`}>
                    {STATUS_TEXT[artwork.trangThai] || artwork.trangThaiText}
                </span>
                <small className="artwork-stock">Tồn: {artwork.soLuong}</small>
            </td>
            <td>
                <button
                    className="artwork-detail-btn"
                    onClick={() => openArtworkDetail(artwork)}
                    title={artwork.trangThai === 0 ? 'Xem đầy đủ trước khi duyệt' : 'Xem chi tiết tác phẩm'}
                    style={{ backgroundColor: '#1d4ed8', border: '1px solid #1d4ed8', color: '#ffffff' }}
                >
                    <i className="ti-eye"></i> {artwork.trangThai === 0 ? 'Xem & duyệt' : 'Xem chi tiết'}
                </button>
                {artwork.trangThai === 0 && (
                    <span className="review-first-hint">Xem chi tiết trước khi xử lý</span>
                )}
                {artwork.trangThai === 1 && (
                    <button
                        className="reject-btn"
                        onClick={() => handleHide(artwork.maTacPham)}
                        title="Ẩn tác phẩm"
                    >
                        <i className="ti-eye"></i> Ẩn
                    </button>
                )}
                {artwork.trangThai === 2 && (
                    <button
                        className="approve-btn"
                        onClick={() => handleShow(artwork.maTacPham)}
                        title="Hiển thị lại"
                    >
                        <i className="ti-eye"></i> Hiển thị
                    </button>
                )}
                <button
                    className="delete-btn"
                    onClick={() => handleDelete(artwork.maTacPham)}
                    title="Xoá vĩnh viễn"
                    style={{ marginLeft: 6 }}
                >
                    <i className="ti-trash"></i>
                </button>
            </td>
        </tr>
    );

    const pendingEdits = edits.filter(e => e.trangThai === 0);
    const approvedEdits = edits.filter(e => e.trangThai === 1);
    const rejectedEdits = edits.filter(e => e.trangThai === 2);
    const selectedImages = selectedArtwork
        ? [
            selectedArtwork.hinhAnh,
            selectedArtworkDetail?.hinhAnh1,
            selectedArtworkDetail?.hinhAnh2,
            selectedArtworkDetail?.hinhAnh3,
            selectedArtworkDetail?.hinhAnh4,
        ]
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value))
            .filter((value, index, values) => values.indexOf(value) === index)
        : [];

    return (
        <div id="art" className="page">
            <div className="art-header">
                <h4>
                    <i className="ti-image"></i> Quản Lý Tác Phẩm
                </h4>
                <button
                    className="btn-refresh"
                    onClick={() => activeTab === 'artworks' ? void loadArtworks(pageInfo.page) : void loadEdits()}
                >
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px', 
                borderBottom: '2px solid #f0f0f0' 
            }}>
                <button
                    onClick={() => setActiveTab('artworks')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'artworks' ? '#ff7b00' : 'transparent',
                        color: activeTab === 'artworks' ? 'white' : '#666',
                        fontWeight: activeTab === 'artworks' ? '600' : '400',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        transition: '0.3s',
                        fontSize: '15px'
                    }}
                >
                    <i className="ti-image"></i> Duyệt Tác Phẩm ({pageInfo.totalItems})
                </button>
                <button
                    onClick={() => setActiveTab('edits')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'edits' ? '#ff7b00' : 'transparent',
                        color: activeTab === 'edits' ? 'white' : '#666',
                        fontWeight: activeTab === 'edits' ? '600' : '400',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        transition: '0.3s',
                        fontSize: '15px'
                    }}
                >
                    <i className="ti-pencil-alt"></i> Duyệt Chỉnh Sửa ({pendingEdits.length})
                </button>
            </div>

            {/* Tab Content: Artworks */}
            {activeTab === 'artworks' && (
                <>
                    <div className="artwork-management-toolbar">
                        <div className="artwork-filter-grid">
                            <label className="artwork-search-field">
                                <span>Tìm kiếm</span>
                                <input
                                    value={filters.keyword}
                                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    placeholder="Tên tranh, họa sĩ, danh mục..."
                                />
                            </label>
                            <label>
                                <span>Họa sĩ</span>
                                <select
                                    value={filters.maHoaSi}
                                    onChange={(e) => setFilters({ ...filters, maHoaSi: e.target.value })}
                                >
                                    <option value="">Tất cả họa sĩ</option>
                                    {artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.ten}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Danh mục</span>
                                <select
                                    value={filters.maDanhMuc}
                                    onChange={(e) => setFilters({ ...filters, maDanhMuc: e.target.value })}
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.ten}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Trạng thái</span>
                                <select
                                    value={filters.trangThai}
                                    onChange={(e) => setFilters({ ...filters, trangThai: e.target.value })}
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="0">Chờ duyệt</option>
                                    <option value="1">Đang bán</option>
                                    <option value="2">Đang ẩn</option>
                                    <option value="3">Từ chối</option>
                                    <option value="99">Đã xóa bởi họa sĩ</option>
                                </select>
                            </label>
                            <label>
                                <span>Phát hành</span>
                                <select
                                    value={filters.loaiPhatHanh}
                                    onChange={(e) => setFilters({ ...filters, loaiPhatHanh: e.target.value })}
                                >
                                    <option value="">Độc bản & nhiều bản</option>
                                    <option value="doc-ban">Tranh độc bản</option>
                                    <option value="nhieu-ban">Tranh nhiều bản</option>
                                </select>
                            </label>
                            <label>
                                <span>Tồn kho</span>
                                <select
                                    value={filters.tonKho}
                                    onChange={(e) => setFilters({ ...filters, tonKho: e.target.value })}
                                >
                                    <option value="">Tất cả tồn kho</option>
                                    <option value="con_hang">Còn hàng</option>
                                    <option value="sap_het">Sắp hết (1–3)</option>
                                    <option value="het_hang">Hết hàng</option>
                                </select>
                            </label>
                            <label>
                                <span>Sắp xếp</span>
                                <select
                                    value={filters.sapXep}
                                    onChange={(e) => setFilters({ ...filters, sapXep: e.target.value as ArtworkFilters['sapXep'] })}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="artist">Theo tên họa sĩ</option>
                                    <option value="price_asc">Giá tăng dần</option>
                                    <option value="price_desc">Giá giảm dần</option>
                                    <option value="stock_asc">Tồn kho tăng dần</option>
                                    <option value="stock_desc">Tồn kho giảm dần</option>
                                </select>
                            </label>
                        </div>
                        <div className="artwork-toolbar-actions">
                            <button className="approve-btn" onClick={applyFilters}><i className="ti-search"></i> Lọc</button>
                            <button className="artwork-reset-btn" onClick={clearFilters}>Đặt lại</button>
                            <label className="artwork-group-toggle">
                                <input
                                    type="checkbox"
                                    checked={groupByArtist}
                                    onChange={(e) => setGroupByArtist(e.target.checked)}
                                />
                                Nhóm theo họa sĩ
                            </label>
                        </div>
                    </div>

                    <div className="artwork-list-summary">
                        Hiển thị {artworks.length === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1}–{Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalItems)} / {pageInfo.totalItems} tác phẩm
                        {groupByArtist && ' · Nhóm trong trang hiện tại'}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : artworks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Không tìm thấy tác phẩm nào.</p>
                        </div>
                    ) : (
                        <table className="art-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
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
                                {groupByArtist
                                    ? Object.keys(artworksByArtist).sort((a, b) => a.localeCompare(b, 'vi')).map((artistName) => (
                                        <React.Fragment key={artistName}>
                                            <tr className="artwork-artist-group"><td colSpan={8}><i className="ti-user"></i> {artistName} ({artworksByArtist[artistName].length})</td></tr>
                                            {artworksByArtist[artistName].map(renderArtworkRow)}
                                        </React.Fragment>
                                    ))
                                    : artworks.map(renderArtworkRow)}
                            </tbody>
                        </table>
                    )}
                    {pageInfo.totalPages > 1 && (
                        <nav className="artwork-pagination" aria-label="Phân trang tác phẩm">
                            <button disabled={pageInfo.page <= 1} onClick={() => void loadArtworks(pageInfo.page - 1)}>← Trước</button>
                            <span>Trang {pageInfo.page} / {pageInfo.totalPages}</span>
                            <button disabled={pageInfo.page >= pageInfo.totalPages} onClick={() => void loadArtworks(pageInfo.page + 1)}>Sau →</button>
                        </nav>
                    )}
                </>
            )}

            {/* Tab Content: Edits */}
            {activeTab === 'edits' && (
                <>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : edits.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Không có chỉnh sửa nào.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chờ duyệt */}
                            {pendingEdits.length > 0 && (
                                <>
                                    <h5 style={{ marginTop: '20px', marginBottom: '15px', color: '#ff9800' }}>
                                        <i className="ti-time"></i> Chờ duyệt ({pendingEdits.length})
                                    </h5>
                                    <table className="art-table">
                                        <thead>
                                            <tr>
                                                <th>STT</th>
                                                <th>Ảnh</th>
                                                <th>Tên tranh</th>
                                                <th>Danh mục</th>
                                                <th>Họa sĩ</th>
                                                <th>Giá mới</th>
                                                <th>Số lượng</th>
                                                <th>Ngày sửa</th>
                                                <th>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingEdits.map((edit, index) => (
                                                <tr key={edit.maChinhSua}>
                                                    <td className="artwork-sequence">{index + 1}</td>
                                                    <td>
                                                        <img
                                                            src={edit.hinhAnh || '/assets/images/no-image.svg'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/assets/images/no-image.svg';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <strong>{edit.tenTacPham}</strong>
                                                    </td>
                                                    <td>{edit.tenDanhMuc || '-'}</td>
                                                    <td>{edit.tenHoaSi}</td>
                                                    <td>{formatPrice(edit.gia)}</td>
                                                    <td>{edit.soLuong}</td>
                                                    <td>
                                                        <small>{formatDate(edit.ngayChinhSua)}</small>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="approve-btn"
                                                            onClick={() => handleApproveEdit(edit.maChinhSua)}
                                                            title="Duyệt chỉnh sửa"
                                                        >
                                                            <i className="ti-check"></i> Duyệt
                                                        </button>
                                                        <button
                                                            className="reject-btn"
                                                            onClick={() => handleRejectEdit(edit.maChinhSua)}
                                                            title="Từ chối"
                                                        >
                                                            <i className="ti-close"></i> Từ chối
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {/* Đã duyệt */}
                            {approvedEdits.length > 0 && (
                                <>
                                    <h5 style={{ marginTop: '30px', marginBottom: '15px', color: '#4caf50' }}>
                                        <i className="ti-check"></i> Đã duyệt ({approvedEdits.length})
                                    </h5>
                                    <table className="art-table">
                                        <thead>
                                            <tr>
                                                <th>Ảnh</th>
                                                <th>Tên tranh</th>
                                                <th>Họa sĩ</th>
                                                <th>Giá</th>
                                                <th>Ngày sửa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {approvedEdits.map((edit) => (
                                                <tr key={edit.maChinhSua} style={{ opacity: 0.7 }}>
                                                    <td>
                                                        <img
                                                            src={edit.hinhAnh || '/assets/images/no-image.svg'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/assets/images/no-image.svg';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>{edit.tenTacPham}</td>
                                                    <td>{edit.tenHoaSi}</td>
                                                    <td>{formatPrice(edit.gia)}</td>
                                                    <td>
                                                        <small>{formatDate(edit.ngayChinhSua)}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {/* Đã từ chối */}
                            {rejectedEdits.length > 0 && (
                                <>
                                    <h5 style={{ marginTop: '30px', marginBottom: '15px', color: '#f44336' }}>
                                        <i className="ti-close"></i> Đã từ chối ({rejectedEdits.length})
                                    </h5>
                                    <table className="art-table">
                                        <thead>
                                            <tr>
                                                <th>Ảnh</th>
                                                <th>Tên tranh</th>
                                                <th>Họa sĩ</th>
                                                <th>Lý do từ chối</th>
                                                <th>Ngày sửa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rejectedEdits.map((edit) => (
                                                <tr key={edit.maChinhSua} style={{ opacity: 0.7 }}>
                                                    <td>
                                                        <img
                                                            src={edit.hinhAnh || '/assets/images/no-image.svg'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/assets/images/no-image.svg';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>{edit.tenTacPham}</td>
                                                    <td>{edit.tenHoaSi}</td>
                                                    <td>
                                                        <span style={{ color: '#f44336', fontStyle: 'italic' }}>
                                                            {edit.lyDo || 'Không có lý do'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small>{formatDate(edit.ngayChinhSua)}</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {selectedArtwork && (
                <div className="artwork-review-overlay" onClick={closeArtworkDetail}>
                    <div className="artwork-review-dialog" onClick={(event) => event.stopPropagation()}>
                        <button className="artwork-review-close" type="button" onClick={closeArtworkDetail} aria-label="Đóng">
                            &times;
                        </button>

                        <div className="artwork-review-header">
                            <div>
                                <span className="artwork-review-eyebrow">HỒ SƠ TÁC PHẨM · STT {getArtworkSequence(selectedArtwork)}</span>
                                <h3>{selectedArtwork.tenTacPham}</h3>
                                <p>Họa sĩ: <strong>{selectedArtwork.tenHoaSi || '-'}</strong></p>
                            </div>
                            <span className={`status ${STATUS_CLASS[selectedArtwork.trangThai] || ''}`}>
                                {STATUS_TEXT[selectedArtwork.trangThai] || selectedArtwork.trangThaiText}
                            </span>
                        </div>

                        <div className="artwork-review-body">
                            <section className="artwork-review-section">
                                <h4><i className="ti-info-alt"></i> Thông tin tác phẩm</h4>
                                <div className="artwork-review-info-grid">
                                    <div><span>Danh mục</span><strong>{selectedArtwork.tenDanhMuc || 'Chưa cập nhật'}</strong></div>
                                    <div><span>Giá bán</span><strong>{formatPrice(selectedArtwork.gia)}</strong></div>
                                    <div><span>Số lượng</span><strong>{selectedArtwork.soLuong}</strong></div>
                                    <div><span>Kích thước</span><strong>{selectedArtwork.kichThuoc || selectedArtworkDetail?.kichThuoc || 'Chưa cập nhật'}</strong></div>
                                    <div><span>Chất liệu</span><strong>{selectedArtwork.chatLieu || selectedArtworkDetail?.chatLieu || 'Chưa cập nhật'}</strong></div>
                                    <div><span>Chất liệu khung</span><strong>{selectedArtwork.chatLieuKhung || selectedArtworkDetail?.chatLieuKhung || 'Chưa cập nhật'}</strong></div>
                                </div>
                                <div className="artwork-review-description">
                                    <span>Mô tả của họa sĩ</span>
                                    <p>{selectedArtwork.moTa || 'Họa sĩ chưa nhập mô tả.'}</p>
                                </div>
                            </section>

                            <section className="artwork-review-section">
                                <h4><i className="ti-gallery"></i> Thư viện hình ảnh ({selectedImages.length})</h4>
                                {selectedImages.length > 0 ? (
                                    <div className="artwork-review-images">
                                        {selectedImages.map((url, index) => (
                                            <a href={url} target="_blank" rel="noreferrer" key={url}>
                                                <img
                                                    src={url}
                                                    alt={`${selectedArtwork.tenTacPham} ${index + 1}`}
                                                    onError={(event) => {
                                                        event.currentTarget.src = '/assets/images/no-image.svg';
                                                    }}
                                                />
                                                <span>{index === 0 ? 'Ảnh đại diện' : `Ảnh bổ sung ${index}`}</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="artwork-review-empty">Họa sĩ chưa cung cấp hình ảnh.</div>
                                )}
                            </section>

                            <section className="artwork-review-section">
                                <div className="artwork-review-section-title-row">
                                    <h4><i className="ti-write"></i> Nội dung chi tiết của họa sĩ</h4>
                                    {selectedArtworkDetail && (
                                        <span className={`detail-review-status detail-status-${selectedArtworkDetail.trangThai}`}>
                                            {selectedArtworkDetail.trangThaiText}
                                        </span>
                                    )}
                                </div>

                                {detailLoading ? (
                                    <div className="artwork-review-empty">Đang tải nội dung chi tiết...</div>
                                ) : selectedArtworkDetail ? (
                                    <div className="artwork-review-content-list">
                                        <DetailContent label="Câu chuyện sáng tác" value={selectedArtworkDetail.cauChuyenSangTac} />
                                        <DetailContent label="Ý nghĩa nghệ thuật" value={selectedArtworkDetail.yNghiaNghiThuat} />
                                        <DetailContent label="Kỹ thuật thực hiện" value={selectedArtworkDetail.kyThuatThucHien} />
                                        <DetailContent label="Cảm hứng sáng tạo" value={selectedArtworkDetail.camHungSangTao} />
                                        <DetailContent label="Thông tin bổ sung" value={selectedArtworkDetail.thongTinBosung} />
                                        {selectedArtworkDetail.lyDoTuChoi && (
                                            <div className="artwork-detail-reject-reason">
                                                <strong>Lý do từ chối nội dung:</strong> {selectedArtworkDetail.lyDoTuChoi}
                                            </div>
                                        )}
                                        {selectedArtworkDetail.trangThai === 0 && (
                                            <div className="artwork-detail-actions">
                                                <button type="button" className="approve-btn" onClick={handleApproveDetailContent}>
                                                    <i className="ti-check"></i> Duyệt nội dung chi tiết
                                                </button>
                                                <button type="button" className="reject-btn" onClick={handleRejectDetailContent}>
                                                    <i className="ti-close"></i> Từ chối nội dung
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="artwork-review-empty">{detailMessage || 'Chưa có nội dung chi tiết.'}</div>
                                )}
                            </section>
                        </div>

                        {selectedArtwork.trangThai === 0 && (
                            <div className="artwork-review-footer">
                                <button type="button" className="reject-btn" onClick={() => handleReject(selectedArtwork.maTacPham)}>
                                    <i className="ti-close"></i> Từ chối tác phẩm
                                </button>
                                <button type="button" className="approve-btn" onClick={() => handleApprove(selectedArtwork.maTacPham)}>
                                    <i className="ti-check"></i> Duyệt tác phẩm
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailContent: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="artwork-review-content-item">
        <span>{label}</span>
        <p>{value || 'Chưa cập nhật'}</p>
    </div>
);

export default AdminArt;
