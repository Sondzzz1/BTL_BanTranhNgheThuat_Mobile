// Artist Artwork Detail Management - Quản lý chi tiết tác phẩm cho họa sĩ
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { artistDashboardService, TacPhamHoaSiResponse } from '../../services/artistDashboardService';
import { categoryService } from '../../services/categoryService';
import apiClient from '../../services/api';
import './ArtworkDetailManagement.css';

interface ArtworkStats {
  tongSoLuongBan: number;
  tongDoanhThu: number;
  soDonHang: number;
  soLuongConLai: number;
  doanhThuThangNay: number;
  soLuongBanThangNay: number;
}

interface OrderItem {
  maDonHang: number;
  maHD: string;
  ngayDat: string;
  tenKhachHang: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  trangThai: string;
  trangThaiClass: string;
}

interface MonthlyRevenue {
  thang: string;
  doanhThu: number;
  soLuong: number;
}

const STATUS_LABEL: Record<number, { text: string; cls: string; icon: string }> = {
  0: { text: 'Chờ duyệt', cls: 'pending', icon: 'ti-time' },
  1: { text: 'Đang bán', cls: 'success', icon: 'ti-check-box' },
  2: { text: 'Đã ẩn', cls: 'shipped', icon: 'ti-eye' },
  3: { text: 'Bị từ chối', cls: 'canceled', icon: 'ti-close' },
};

const ArtworkDetailManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<TacPhamHoaSiResponse | null>(null);
  const [stats, setStats] = useState<ArtworkStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [categories, setCategories] = useState<{ maDanhMuc: number; tenDanhMuc: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenTacPham: '',
    gia: '',
    maDanhMuc: '',
    soLuong: '1',
    anhTranh: '',
    moTa: '',
    kichThuoc: '',
    chatLieu: '',
    chatLieuKhung: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [artworkData, categoriesData] = await Promise.all([
        loadArtworkDetail(parseInt(id)),
        categoryService.getAllCategories(),
      ]);
      setCategories(categoriesData);
      
      if (artworkData) {
        setArtwork(artworkData);
        await loadStats(parseInt(id));
        await loadOrders(parseInt(id));
        await loadMonthlyRevenue(parseInt(id));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      alert('Không thể tải thông tin tác phẩm');
      navigate('/artist/artworks');
    } finally {
      setLoading(false);
    }
  };

  const loadArtworkDetail = async (artworkId: number): Promise<TacPhamHoaSiResponse | null> => {
    try {
      const allArtworks = await artistDashboardService.getTacPhamCuaToi();
      const found = allArtworks.find((a) => a.maTacPham === artworkId);
      return found || null;
    } catch (error) {
      console.error('Lỗi khi tải chi tiết tác phẩm:', error);
      return null;
    }
  };

  const loadStats = async (artworkId: number) => {
    try {
      const response = await apiClient.get(`/hoa-si/tac-pham/${artworkId}/thong-ke`);
      setStats(response.data);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      setStats({
        tongSoLuongBan: 0,
        tongDoanhThu: 0,
        soDonHang: 0,
        soLuongConLai: artwork?.soLuong || 0,
        doanhThuThangNay: 0,
        soLuongBanThangNay: 0,
      });
    }
  };

  const loadOrders = async (artworkId: number) => {
    try {
      const response = await apiClient.get(`/hoa-si/tac-pham/${artworkId}/don-hang`);
      setOrders(response.data);
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
      setOrders([]);
    }
  };

  const loadMonthlyRevenue = async (artworkId: number) => {
    try {
      const response = await apiClient.get(`/hoa-si/tac-pham/${artworkId}/doanh-thu-theo-thang`);
      setMonthlyRevenue(response.data);
    } catch (error) {
      console.error('Lỗi khi tải doanh thu theo tháng:', error);
      setMonthlyRevenue([]);
    }
  };

  const handleOpenEditModal = () => {
    if (!artwork) return;
    const cat = categories.find((c) => c.tenDanhMuc === artwork.tenDanhMuc);
    setFormData({
      tenTacPham: artwork.tenTacPham,
      gia: artwork.gia.toString(),
      maDanhMuc: cat ? cat.maDanhMuc.toString() : categories.length > 0 ? categories[0].maDanhMuc.toString() : '',
      soLuong: artwork.soLuong.toString(),
      anhTranh: artwork.hinhAnh || '',
      moTa: artwork.moTa || '',
      kichThuoc: artwork.kichThuoc || '',
      chatLieu: artwork.chatLieu || '',
      chatLieuKhung: artwork.chatLieuKhung || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artwork) return;
    try {
      const payload = {
        tenTacPham: formData.tenTacPham,
        gia: parseFloat(formData.gia),
        maDanhMuc: formData.maDanhMuc ? parseInt(formData.maDanhMuc) : undefined,
        soLuong: parseInt(formData.soLuong),
        hinhAnh: formData.anhTranh,
        moTa: formData.moTa,
        kichThuoc: formData.kichThuoc,
        chatLieu: formData.chatLieu,
        chatLieuKhung: formData.chatLieuKhung,
      };

      await artistDashboardService.capNhatTacPham(artwork.maTacPham, payload);
      alert('Cập nhật tác phẩm thành công!');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!artwork) return;
    if (window.confirm('Bạn có chắc muốn xóa tác phẩm này? Hành động này không thể hoàn tác!')) {
      try {
        await artistDashboardService.xoaTacPham(artwork.maTacPham);
        alert('Xóa tác phẩm thành công!');
        navigate('/artist/artworks');
      } catch (error: any) {
        alert(error?.response?.data?.message || error.message || 'Không thể xóa tác phẩm');
      }
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <div className="loading-spinner">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <div className="error-message">Không tìm thấy tác phẩm</div>
        <Link to="/artist/artworks" className="btn-back">
          <i className="ti-arrow-left"></i> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const st = STATUS_LABEL[artwork.trangThai] || { text: artwork.trangThaiText, cls: '', icon: '' };
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.doanhThu), 1);

  return (
    <div id="artwork-detail-management" className="page">
      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <Link to="/artist/artworks" className="btn-back">
            <i className="ti-arrow-left"></i> Quay lại
          </Link>
          <h4>
            <i className="ti-image"></i> Chi Tiết Tác Phẩm
          </h4>
        </div>
        <div className="header-actions">
          <button className="btn-edit" onClick={handleOpenEditModal}>
            <i className="ti-pencil"></i> Chỉnh sửa
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            <i className="ti-trash"></i> Xóa
          </button>
        </div>
      </div>

      {/* Artwork Info Section */}
      <div className="artwork-info-section">
        <div className="artwork-image-container">
          {artwork.hinhAnh ? (
            <img src={artwork.hinhAnh} alt={artwork.tenTacPham} className="artwork-image" />
          ) : (
            <div className="no-image">
              <i className="ti-image"></i>
              <p>Chưa có hình ảnh</p>
            </div>
          )}
        </div>

        <div className="artwork-details">
          <h2 className="artwork-title">{artwork.tenTacPham}</h2>
          <div className="artwork-status">
            <span className={`status ${st.cls}`}>
              <i className={st.icon}></i> {st.text}
            </span>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <label>
                <i className="ti-tag"></i> Danh mục:
              </label>
              <span>{artwork.tenDanhMuc || 'Chưa phân loại'}</span>
            </div>
            <div className="detail-item">
              <label>
                <i className="ti-money"></i> Giá bán:
              </label>
              <span className="price">{formatPrice(artwork.gia)}</span>
            </div>
            <div className="detail-item">
              <label>
                <i className="ti-package"></i> Số lượng:
              </label>
              <span>{artwork.soLuong}</span>
            </div>
            <div className="detail-item">
              <label>
                <i className="ti-ruler-alt"></i> Kích thước:
              </label>
              <span>{artwork.kichThuoc || 'Chưa cập nhật'}</span>
            </div>
            <div className="detail-item">
              <label>
                <i className="ti-brush"></i> Chất liệu:
              </label>
              <span>{artwork.chatLieu || 'Chưa cập nhật'}</span>
            </div>
            <div className="detail-item">
              <label>
                <i className="ti-layout"></i> Chất liệu khung:
              </label>
              <span>{artwork.chatLieuKhung || 'Chưa cập nhật'}</span>
            </div>
            <div className="detail-item full-width">
              <label>
                <i className="ti-calendar"></i> Ngày tạo:
              </label>
              <span>{formatDate(artwork.ngayTao)}</span>
            </div>
          </div>

          {artwork.moTa && (
            <div className="artwork-description">
              <label>
                <i className="ti-align-left"></i> Mô tả:
              </label>
              <p>{artwork.moTa}</p>
            </div>
          )}

          {artwork.trangThai === 3 && artwork.lyDo && (
            <div className="reject-reason">
              <h4>
                <i className="ti-alert"></i> Lý do từ chối:
              </h4>
              <p>{artwork.lyDo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <h3>
          <i className="ti-bar-chart"></i> Thống Kê Bán Hàng
        </h3>
        <div className="stats-grid">
          <div className="stat-card bg-primary">
            <i className="ti-shopping-cart"></i>
            <div className="stat-content">
              <h4>{stats?.tongSoLuongBan || 0}</h4>
              <p>Đã bán</p>
            </div>
          </div>
          <div className="stat-card bg-success">
            <i className="ti-money"></i>
            <div className="stat-content">
              <h4>{formatPrice(stats?.tongDoanhThu || 0)}</h4>
              <p>Tổng doanh thu</p>
            </div>
          </div>
          <div className="stat-card bg-info">
            <i className="ti-receipt"></i>
            <div className="stat-content">
              <h4>{stats?.soDonHang || 0}</h4>
              <p>Đơn hàng</p>
            </div>
          </div>
          <div className="stat-card bg-warning">
            <i className="ti-package"></i>
            <div className="stat-content">
              <h4>{stats?.soLuongConLai || 0}</h4>
              <p>Còn lại</p>
            </div>
          </div>
        </div>

        <div className="monthly-stats">
          <div className="stat-card-small">
            <i className="ti-calendar"></i>
            <div>
              <p>Doanh thu tháng này</p>
              <h4>{formatPrice(stats?.doanhThuThangNay || 0)}</h4>
            </div>
          </div>
          <div className="stat-card-small">
            <i className="ti-shopping-cart"></i>
            <div>
              <p>Số lượng bán tháng này</p>
              <h4>{stats?.soLuongBanThangNay || 0}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <div className="chart-section">
          <h3>
            <i className="ti-stats-up"></i> Doanh Thu Theo Tháng
          </h3>
          <div className="chart-container">
            {monthlyRevenue.map((item, index) => (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${(item.doanhThu / maxRevenue) * 100}%` }}
                    title={`${formatPrice(item.doanhThu)} - ${item.soLuong} sản phẩm`}
                  >
                    <span className="bar-value">{formatPrice(item.doanhThu)}</span>
                  </div>
                </div>
                <div className="chart-label">{item.thang}</div>
                <div className="chart-quantity">{item.soLuong} SP</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-section">
        <h3>
          <i className="ti-receipt"></i> Lịch Sử Đơn Hàng ({orders.length})
        </h3>
        {orders.length === 0 ? (
          <div className="empty-state">
            <i className="ti-shopping-cart"></i>
            <p>Chưa có đơn hàng nào cho tác phẩm này</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.maDonHang}>
                    <td>
                      <strong>{order.maHD}</strong>
                    </td>
                    <td>{formatDate(order.ngayDat)}</td>
                    <td>{order.tenKhachHang}</td>
                    <td className="text-center">{order.soLuong}</td>
                    <td>{formatPrice(order.donGia)}</td>
                    <td>
                      <strong>{formatPrice(order.thanhTien)}</strong>
                    </td>
                    <td>
                      <span className={`status ${order.trangThaiClass}`}>{order.trangThai}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal show" style={{ display: 'flex' }}>
          <div className="modal-content">
            <span className="close" onClick={() => setIsEditModalOpen(false)}>
              &times;
            </span>
            <h3>Chỉnh Sửa Tác Phẩm</h3>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-grid">
                <div className="form-column">
                  <div className="form-group">
                    <label>
                      Tên tranh: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.tenTacPham}
                      onChange={(e) => setFormData({ ...formData, tenTacPham: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Giá bán (VNĐ): <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.gia}
                      onChange={(e) => setFormData({ ...formData, gia: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Danh mục: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                      value={formData.maDanhMuc}
                      onChange={(e) => setFormData({ ...formData, maDanhMuc: e.target.value })}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.maDanhMuc} value={c.maDanhMuc}>
                          {c.tenDanhMuc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-group">
                    <label>
                      Số lượng: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.soLuong}
                      onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Link ảnh:</label>
                    <input
                      type="text"
                      value={formData.anhTranh}
                      onChange={(e) => setFormData({ ...formData, anhTranh: e.target.value })}
                      placeholder="URL hình ảnh"
                    />
                  </div>

                  <div className="form-group">
                    <label>Kích thước:</label>
                    <input
                      type="text"
                      value={formData.kichThuoc}
                      onChange={(e) => setFormData({ ...formData, kichThuoc: e.target.value })}
                      placeholder="Ví dụ: 60x80 cm"
                    />
                  </div>

                  <div className="form-group">
                    <label>Chất liệu tranh:</label>
                    <input
                      type="text"
                      value={formData.chatLieu}
                      onChange={(e) => setFormData({ ...formData, chatLieu: e.target.value })}
                      placeholder="Ví dụ: Sơn dầu trên toan"
                    />
                  </div>

                  <div className="form-group">
                    <label>Chất liệu khung:</label>
                    <input
                      type="text"
                      value={formData.chatLieuKhung}
                      onChange={(e) => setFormData({ ...formData, chatLieuKhung: e.target.value })}
                      placeholder="Ví dụ: Khung gỗ sồi"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Mô tả:</label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={5}
                  placeholder="Mô tả về tác phẩm..."
                ></textarea>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-save">
                  <i className="ti-check"></i> Cập nhật
                </button>
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetailManagement;
