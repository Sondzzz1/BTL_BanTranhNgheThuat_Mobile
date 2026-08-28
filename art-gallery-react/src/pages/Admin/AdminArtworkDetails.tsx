// Admin Artwork Details - Admin duyệt chi tiết tác phẩm
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import './AdminArtworkDetails.css';

interface ChiTietChoDuyet {
  maChiTiet: number;
  maTacPham: number;
  tenTacPham: string;
  hinhAnh?: string;
  maHoaSi: number;
  tenHoaSi: string;
  ngayTao: string;
  ngayCapNhat?: string;
  trangThai: number;
  trangThaiText: string;
}

interface ChiTietDayDu {
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
  ngayTao: string;
  ngayCapNhat?: string;
  ngayDuyet?: string;
  tenNguoiDuyet?: string;
}

const AdminArtworkDetails: React.FC = () => {
  const [danhSach, setDanhSach] = useState<ChiTietChoDuyet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number>(-1);
  const [selectedDetail, setSelectedDetail] = useState<ChiTietDayDu | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [lyDoTuChoi, setLyDoTuChoi] = useState('');

  useEffect(() => {
    loadDanhSach();
  }, [filterStatus]);

  const loadDanhSach = async () => {
    setLoading(true);
    try {
      const endpoint = filterStatus === -1 
        ? '/admin/chi-tiet-tac-pham'
        : `/admin/chi-tiet-tac-pham?trangThai=${filterStatus}`;
      const response = await apiClient.get(endpoint);
      setDanhSach(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error);
      alert('Không thể tải danh sách chi tiết tác phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (maTacPham: number) => {
    try {
      const response = await apiClient.get(`/admin/chi-tiet-tac-pham/${maTacPham}`);
      setSelectedDetail(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết:', error);
      alert('Không thể tải chi tiết tác phẩm');
    }
  };

  const handleApprove = async () => {
    if (!selectedDetail) return;
    if (!window.confirm('Bạn có chắc muốn phê duyệt nội dung này?')) return;

    try {
      await apiClient.put(`/admin/chi-tiet-tac-pham/${selectedDetail.maTacPham}/duyet`, {
        pheDuyet: true,
        lyDoTuChoi: null
      });
      alert('Đã phê duyệt thành công!');
      setIsModalOpen(false);
      loadDanhSach();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReject = async () => {
    if (!selectedDetail) return;
    if (!lyDoTuChoi.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await apiClient.put(`/admin/chi-tiet-tac-pham/${selectedDetail.maTacPham}/duyet`, {
        pheDuyet: false,
        lyDoTuChoi: lyDoTuChoi.trim()
      });
      alert('Đã từ chối nội dung!');
      setIsModalOpen(false);
      setIsRejectModalOpen(false);
      setLyDoTuChoi('');
      loadDanhSach();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleApproveDirect = async (item: ChiTietChoDuyet) => {
    if (!window.confirm(`Bạn có chắc muốn phê duyệt nội dung của tác phẩm "${item.tenTacPham}"?`)) return;
    try {
      await apiClient.put(`/admin/chi-tiet-tac-pham/${item.maTacPham}/duyet`, {
        pheDuyet: true,
        lyDoTuChoi: null
      });
      alert('Đã phê duyệt thành công!');
      loadDanhSach();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRejectDirect = (item: ChiTietChoDuyet) => {
    setSelectedDetail({
      maChiTiet: item.maChiTiet,
      maTacPham: item.maTacPham,
      tenTacPham: item.tenTacPham,
      maHoaSi: item.maHoaSi,
      tenHoaSi: item.tenHoaSi,
      trangThai: item.trangThai,
      trangThaiText: item.trangThaiText,
      ngayTao: item.ngayTao
    });
    setLyDoTuChoi('');
    setIsRejectModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrangThaiClass = (trangThai: number) => {
    switch (Number(trangThai)) {
      case 0: return 'pending';
      case 1: return 'success';
      case 2: return 'canceled';
      default: return '';
    }
  };

  const countByStatus = (status: number) => {
    return danhSach.filter(item => Number(item.trangThai) === Number(status)).length;
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <div className="loading-spinner">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div id="admin-artwork-details" className="page">
      {/* Header */}
      <div className="art-header">
        <h4><i className="ti-write"></i> Duyệt Chi Tiết Tác Phẩm</h4>
        <button className="btn-refresh" onClick={loadDanhSach}>
          <i className="ti-reload"></i> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item pending">
          <i className="ti-time"></i>
          <span>Chờ duyệt: <strong>{countByStatus(0)}</strong></span>
        </div>
        <div className="stat-item success">
          <i className="ti-check"></i>
          <span>Đã duyệt: <strong>{countByStatus(1)}</strong></span>
        </div>
        <div className="stat-item canceled">
          <i className="ti-close"></i>
          <span>Từ chối: <strong>{countByStatus(2)}</strong></span>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(Number(e.target.value))}>
            <option value={-1}>Tất cả ({danhSach.length})</option>
            <option value={0}>Chờ duyệt ({countByStatus(0)})</option>
            <option value={1}>Đã duyệt ({countByStatus(1)})</option>
            <option value={2}>Từ chối ({countByStatus(2)})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {danhSach.length === 0 ? (
        <div className="empty-state">
          <i className="ti-folder"></i>
          <p>Không có chi tiết tác phẩm nào</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="art-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên tác phẩm</th>
                <th>Họa sĩ</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((item) => (
                <tr key={item.maChiTiet}>
                  <td>
                    <img
                      src={item.hinhAnh || 'https://via.placeholder.com/80?text=No+Image'}
                      alt={item.tenTacPham}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                  </td>
                  <td><strong>{item.tenTacPham}</strong></td>
                  <td>{item.tenHoaSi}</td>
                  <td>{formatDate(item.ngayTao)}</td>
                  <td>
                    <span className={`status ${getTrangThaiClass(item.trangThai)}`}>
                      {item.trangThaiText}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewDetail(item.maTacPham)}
                      title="Xem & Duyệt"
                      style={{ marginRight: '8px' }}
                    >
                      <i className="ti-eye"></i> Xem
                    </button>
                    {Number(item.trangThai) === 0 && (
                      <>
                        <button
                          className="approve-btn-small"
                          onClick={() => handleApproveDirect(item)}
                          title="Phê duyệt"
                        >
                          <i className="ti-check"></i> Duyệt
                        </button>
                        <button
                          className="reject-btn-small"
                          onClick={() => handleRejectDirect(item)}
                          title="Từ chối"
                        >
                          <i className="ti-close"></i> Từ chối
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Xem Chi Tiết */}
      {isModalOpen && selectedDetail && (
        <div className="modal show" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            
            <div className="modal-header">
              <h3><i className="ti-write"></i> Chi Tiết Nội Dung Tác Phẩm</h3>
              <span className={`status ${getTrangThaiClass(selectedDetail.trangThai)}`}>
                {selectedDetail.trangThaiText}
              </span>
            </div>

            <div className="modal-body">
              {/* Thông tin cơ bản */}
              <div className="info-section">
                <h4><i className="ti-info-alt"></i> Thông Tin Cơ Bản</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tác phẩm:</label>
                    <span>{selectedDetail.tenTacPham}</span>
                  </div>
                  <div className="info-item">
                    <label>Họa sĩ:</label>
                    <span>{selectedDetail.tenHoaSi}</span>
                  </div>
                  <div className="info-item">
                    <label>Kích thước:</label>
                    <span>{selectedDetail.kichThuoc || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="info-item">
                    <label>Năm sáng tác:</label>
                    <span>{selectedDetail.namSangTac || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="info-item">
                    <label>Chất liệu:</label>
                    <span>{selectedDetail.chatLieu || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="info-item">
                    <label>Địa điểm:</label>
                    <span>{selectedDetail.diaDiemSangTac || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Nội dung nghệ thuật */}
              <div className="content-section">
                <h4><i className="ti-book"></i> Nội Dung Nghệ Thuật</h4>
                
                {selectedDetail.cauChuyenSangTac && (
                  <div className="content-item">
                    <label><i className="ti-pencil-alt"></i> Câu Chuyện Sáng Tác:</label>
                    <p>{selectedDetail.cauChuyenSangTac}</p>
                  </div>
                )}

                {selectedDetail.yNghiaNghiThuat && (
                  <div className="content-item">
                    <label><i className="ti-light-bulb"></i> Ý Nghĩa Nghệ Thuật:</label>
                    <p>{selectedDetail.yNghiaNghiThuat}</p>
                  </div>
                )}

                {selectedDetail.kyThuatThucHien && (
                  <div className="content-item">
                    <label><i className="ti-brush-alt"></i> Kỹ Thuật Thực Hiện:</label>
                    <p>{selectedDetail.kyThuatThucHien}</p>
                  </div>
                )}

                {selectedDetail.camHungSangTao && (
                  <div className="content-item">
                    <label><i className="ti-star"></i> Cảm Hứng Sáng Tạo:</label>
                    <p>{selectedDetail.camHungSangTao}</p>
                  </div>
                )}

                {selectedDetail.thongTinBosung && (
                  <div className="content-item">
                    <label><i className="ti-info-alt"></i> Thông Tin Bổ Sung:</label>
                    <p>{selectedDetail.thongTinBosung}</p>
                  </div>
                )}
              </div>

              {/* Hình ảnh */}
              {(selectedDetail.hinhAnh1 || selectedDetail.hinhAnh2 || selectedDetail.hinhAnh3 || selectedDetail.hinhAnh4) && (
                <div className="images-section">
                  <h4><i className="ti-gallery"></i> Hình Ảnh Bổ Sung</h4>
                  <div className="images-grid">
                    {selectedDetail.hinhAnh1 && (
                      <img src={selectedDetail.hinhAnh1} alt="Hình 1" />
                    )}
                    {selectedDetail.hinhAnh2 && (
                      <img src={selectedDetail.hinhAnh2} alt="Hình 2" />
                    )}
                    {selectedDetail.hinhAnh3 && (
                      <img src={selectedDetail.hinhAnh3} alt="Hình 3" />
                    )}
                    {selectedDetail.hinhAnh4 && (
                      <img src={selectedDetail.hinhAnh4} alt="Hình 4" />
                    )}
                  </div>
                </div>
              )}

              {/* Lý do từ chối (nếu có) */}
              {Number(selectedDetail.trangThai) === 2 && selectedDetail.lyDoTuChoi && (
                <div className="reject-info">
                  <h4><i className="ti-alert"></i> Lý Do Từ Chối:</h4>
                  <p>{selectedDetail.lyDoTuChoi}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {Number(selectedDetail.trangThai) === 0 && (
              <div className="modal-actions">
                <button className="btn-approve" onClick={handleApprove}>
                  <i className="ti-check"></i> Phê Duyệt
                </button>
                <button className="btn-reject" onClick={() => setIsRejectModalOpen(true)}>
                  <i className="ti-close"></i> Từ Chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Từ Chối */}
      {isRejectModalOpen && (
        <div className="modal show" onClick={() => setIsRejectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setIsRejectModalOpen(false)}>&times;</span>
            <h3><i className="ti-alert"></i> Từ Chối Nội Dung</h3>
            <div className="form-group">
              <label>Lý do từ chối: <span style={{ color: 'red' }}>*</span></label>
              <textarea
                value={lyDoTuChoi}
                onChange={(e) => setLyDoTuChoi(e.target.value)}
                rows={5}
                placeholder="Nhập lý do từ chối (bắt buộc)..."
                autoFocus
              />
            </div>
            <div className="modal-buttons">
              <button className="btn-save" onClick={handleReject}>
                <i className="ti-check"></i> Xác Nhận Từ Chối
              </button>
              <button className="btn-cancel" onClick={() => setIsRejectModalOpen(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtworkDetails;
