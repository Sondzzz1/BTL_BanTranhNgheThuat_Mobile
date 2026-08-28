import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { adminService, TacPhamHoaSiResponse } from '../../services/adminService';

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

const AdminArt: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'artworks' | 'edits'>('artworks');
    const [artworks, setArtworks] = useState<TacPhamHoaSiResponse[]>([]);
    const [edits, setEdits] = useState<TacPhamChinhSuaResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<number>(-1);

    useEffect(() => {
        if (activeTab === 'artworks') {
            loadArtworks();
        } else {
            loadEdits();
        }
    }, [activeTab]);

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
            await loadArtworks();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi duyệt tác phẩm.');
        }
    };

    const handleReject = async (id: number) => {
        const lyDo = window.prompt('Nhập lý do từ chối (tuỳ chọn):') || undefined;
        if (lyDo === null) return; // user bấm Cancel
        try {
            await adminService.duyetTacPham(id, { pheDuyet: false, lyDo });
            await loadArtworks();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối tác phẩm.');
        }
    };

    const handleHide = async (id: number) => {
        if (!window.confirm('Ẩn tác phẩm này khỏi cửa hàng?')) return;
        try {
            await apiClient.put(`/admin/tac-pham/${id}/hide`);
            await loadArtworks();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể ẩn tác phẩm');
        }
    };

    const handleShow = async (id: number) => {
        if (!window.confirm('Mở hiển thị tác phẩm trở lại?')) return;
        try {
            await apiClient.put(`/admin/tac-pham/${id}/show`);
            await loadArtworks();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể mở hiển thị tác phẩm');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Xoá vĩnh viễn tác phẩm này?')) return;
        try {
            await adminService.xoaTacPham(id);
            await loadArtworks();
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

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const filteredArtworks = artworks.filter((art) =>
        statusFilter === -1 ? true : art.trangThai === statusFilter
    );

    const countByStatus = (s: number) => artworks.filter((a) => a.trangThai === s).length;

    const pendingEdits = edits.filter(e => e.trangThai === 0);
    const approvedEdits = edits.filter(e => e.trangThai === 1);
    const rejectedEdits = edits.filter(e => e.trangThai === 2);

    return (
        <div id="art" className="page">
            <div className="art-header">
                <h4>
                    <i className="ti-image"></i> Quản Lý Tác Phẩm
                </h4>
                <button className="btn-refresh" onClick={activeTab === 'artworks' ? loadArtworks : loadEdits}>
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
                    <i className="ti-image"></i> Duyệt Tác Phẩm ({artworks.length})
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
                    <div className="filter-bar">
                        <div className="filter-item">
                            <label>Trạng thái:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(Number(e.target.value))}
                            >
                                <option value={-1}>Tất cả ({artworks.length})</option>
                                <option value={0}>Chờ duyệt ({countByStatus(0)})</option>
                                <option value={1}>Đang bán ({countByStatus(1)})</option>
                                <option value={2}>Đang ẩn ({countByStatus(2)})</option>
                                <option value={3}>Từ chối ({countByStatus(3)})</option>
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
                                                    (e.target as HTMLImageElement).src =
                                                        'https://via.placeholder.com/80?text=No+Image';
                                                }}
                                            />
                                        </td>
                                        <td>{artwork.tenTacPham}</td>
                                        <td>{artwork.tenDanhMuc || '-'}</td>
                                        <td>{artwork.tenHoaSi || '-'}</td>
                                        <td>{formatPrice(artwork.gia)}</td>
                                        <td>
                                            <span className={`status ${STATUS_CLASS[artwork.trangThai] || ''}`}>
                                                {STATUS_TEXT[artwork.trangThai] || artwork.trangThaiText}
                                            </span>
                                        </td>
                                        <td>
                                            {artwork.trangThai === 0 && (
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
                                ))}
                            </tbody>
                        </table>
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
                                            {pendingEdits.map((edit) => (
                                                <tr key={edit.maChinhSua}>
                                                    <td>
                                                        <img
                                                            src={edit.hinhAnh || 'https://via.placeholder.com/80?text=No+Image'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <strong>{edit.tenTacPham}</strong>
                                                        <br />
                                                        <small style={{ color: '#666' }}>ID: {edit.maTacPham}</small>
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
                                                            src={edit.hinhAnh || 'https://via.placeholder.com/80?text=No+Image'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=No+Image';
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
                                                            src={edit.hinhAnh || 'https://via.placeholder.com/80?text=No+Image'}
                                                            alt={edit.tenTacPham}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=No+Image';
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
        </div>
    );
};

export default AdminArt;
