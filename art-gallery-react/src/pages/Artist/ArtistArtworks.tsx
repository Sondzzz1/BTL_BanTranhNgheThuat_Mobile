// Artist Artworks - Quản lý tác phẩm của họa sĩ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artistDashboardService, TacPhamHoaSiResponse } from '../../services/artistDashboardService';
import { categoryService } from '../../services/categoryService';

const STATUS_LABEL: Record<number, { text: string; cls: string; icon: string }> = {
  0: { text: 'Chờ duyệt',  cls: 'pending',   icon: 'ti-time' },
  1: { text: 'Đang bán',   cls: 'success',   icon: 'ti-check-box' },
  2: { text: 'Đã ẩn',      cls: 'shipped',   icon: 'ti-eye' },
  3: { text: 'Bị từ chối', cls: 'canceled',  icon: 'ti-close' },
};

const ArtistArtworks: React.FC = () => {
  const navigate = useNavigate();
  const [myArtworks, setMyArtworks] = useState<TacPhamHoaSiResponse[]>([]);
  const [categories, setCategories] = useState<{ maDanhMuc: number, tenDanhMuc: string }[]>([]);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<TacPhamHoaSiResponse | null>(null);
  const [rejectInfo, setRejectInfo] = useState<TacPhamHoaSiResponse | null>(null);

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [artworksRes, categoriesRes] = await Promise.all([
        artistDashboardService.getTacPhamCuaToi(),
        categoryService.getAllCategories()
      ]);
      setMyArtworks(artworksRes);
      setCategories(categoriesRes);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tác phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (artwork?: TacPhamHoaSiResponse) => {
    if (artwork) {
      setEditingArtwork(artwork);
      const cat = categories.find(c => c.tenDanhMuc === artwork.tenDanhMuc);
      setFormData({
        tenTacPham: artwork.tenTacPham,
        gia: artwork.gia.toString(),
        maDanhMuc: cat ? cat.maDanhMuc.toString() : (categories.length > 0 ? categories[0].maDanhMuc.toString() : ''),
        soLuong: artwork.soLuong.toString(),
        anhTranh: artwork.hinhAnh || '',
        moTa: artwork.moTa || '',
        kichThuoc: artwork.kichThuoc || '',
        chatLieu: artwork.chatLieu || '',
        chatLieuKhung: artwork.chatLieuKhung || '',
      });
    } else {
      setEditingArtwork(null);
      setFormData({
        tenTacPham: '',
        gia: '',
        maDanhMuc: categories.length > 0 ? categories[0].maDanhMuc.toString() : '',
        soLuong: '1',
        anhTranh: '',
        moTa: '',
        kichThuoc: '',
        chatLieu: '',
        chatLieuKhung: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (editingArtwork) {
        await artistDashboardService.capNhatTacPham(editingArtwork.maTacPham, payload);
        alert('Cập nhật tác phẩm thành công! Tác phẩm sẽ được admin duyệt lại.');
      } else {
        await artistDashboardService.taoTacPham(payload);
        alert('Thêm tác phẩm thành công! Tác phẩm đang chờ admin duyệt.');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa tác phẩm này?')) {
      try {
        await artistDashboardService.xoaTacPham(id);
        alert('Xóa tác phẩm thành công!');
        loadData();
      } catch (error: any) {
        alert(error?.response?.data?.message || error.message || 'Không thể xóa tác phẩm');
      }
    }
  };

  const handleResubmit = async (id: number, name: string) => {
    if (window.confirm(`Bạn có chắc muốn gửi duyệt lại tác phẩm "${name}"?\n\nTác phẩm sẽ được chuyển về trạng thái "Chờ duyệt" và admin sẽ xem xét lại.`)) {
      try {
        await artistDashboardService.guiDuyetLaiTacPham(id);
        alert('Đã gửi duyệt lại tác phẩm thành công!');
        loadData();
      } catch (error: any) {
        alert(error?.response?.data?.message || error.message || 'Không thể gửi duyệt lại');
      }
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Lọc
  let filteredArtworks = myArtworks;
  if (filterCat !== 'all') {
    filteredArtworks = filteredArtworks.filter(art => art.tenDanhMuc === filterCat);
  }
  if (filterStatus !== -1) {
    filteredArtworks = filteredArtworks.filter(art => art.trangThai === filterStatus);
  }
  if (searchQuery.trim() !== '') {
    filteredArtworks = filteredArtworks.filter(art =>
      art.tenTacPham.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const countByStatus = (s: number) => myArtworks.filter(a => a.trangThai === s).length;

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div id="art" className="page">
      <div className="art-header">
        <h4><i className="ti-image"></i> Quản Lý Tác Phẩm</h4>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <i className="ti-plus"></i> Thêm Tác Phẩm
        </button>
      </div>

      {/* Stats trạng thái */}
      <div style={{ display: 'flex', gap: 12, margin: '12px 0 16px', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff3cd', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
          ⏳ Chờ duyệt: <strong>{countByStatus(0)}</strong>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
          ✅ Đang bán: <strong>{countByStatus(1)}</strong>
        </div>
        <div style={{ background: '#e3f2fd', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
          🙈 Đã ẩn: <strong>{countByStatus(2)}</strong>
        </div>
        <div style={{ background: '#ffebee', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
          ❌ Bị từ chối: <strong>{countByStatus(3)}</strong>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 5, flex: 1, minWidth: 200 }}
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 5 }}
        >
          <option value="all">Tất cả danh mục ({myArtworks.length})</option>
          {categories.map(c => (
            <option key={c.maDanhMuc} value={c.tenDanhMuc}>{c.tenDanhMuc}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(Number(e.target.value))}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 5 }}
        >
          <option value={-1}>Tất cả trạng thái</option>
          <option value={0}>Chờ duyệt</option>
          <option value={1}>Đang bán</option>
          <option value={2}>Đã ẩn</option>
          <option value={3}>Bị từ chối</option>
        </select>
      </div>

      {filteredArtworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 10 }}>
          <i className="ti-image" style={{ fontSize: '4rem', color: '#ddd' }}></i>
          <h3>Không tìm thấy tác phẩm nào</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="art-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên tranh</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtworks.map(artwork => {
                const st = STATUS_LABEL[artwork.trangThai] || { text: artwork.trangThaiText, cls: '', icon: '' };
                const isRejected = artwork.trangThai === 3;
                return (
                  <tr key={artwork.maTacPham}>
                    <td>
                      {artwork.hinhAnh ? (
                        <img
                          src={artwork.hinhAnh}
                          alt={artwork.tenTacPham}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 5 }}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, background: '#f0f0f0', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No Img
                        </div>
                      )}
                    </td>
                    <td><strong>{artwork.tenTacPham}</strong></td>
                    <td>{artwork.tenDanhMuc}</td>
                    <td>{formatPrice(artwork.gia)}</td>
                    <td>{artwork.soLuong}</td>
                    <td>
                      <span className={`status ${st.cls}`} title={isRejected ? (artwork.lyDo || '') : ''}>
                        <i className={st.icon}></i> {st.text}
                      </span>
                      {isRejected && artwork.lyDo && (
                        <button
                          onClick={() => setRejectInfo(artwork)}
                          style={{
                            display: 'block', marginTop: 6, fontSize: 12,
                            color: '#c0392b', background: 'transparent',
                            border: '1px solid #f5b7b1', borderRadius: 4,
                            padding: '2px 8px', cursor: 'pointer'
                          }}
                          title="Xem lý do từ chối"
                        >
                          Xem lý do
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/artist/artworks/${artwork.maTacPham}`)}
                        title="Xem thống kê"
                        style={{ background: '#3498db', color: 'white', marginRight: 5 }}
                      >
                        <i className="ti-eye"></i>
                      </button>
                      <button
                        onClick={() => navigate(`/artist/artworks/${artwork.maTacPham}/content`)}
                        title="Quản lý nội dung chi tiết"
                        style={{ background: '#9b59b6', color: 'white', marginRight: 5 }}
                      >
                        <i className="ti-write"></i>
                      </button>
                      {isRejected && (
                        <button
                          onClick={() => handleResubmit(artwork.maTacPham, artwork.tenTacPham)}
                          title="Gửi duyệt lại (không sửa)"
                          style={{ background: '#f39c12', color: 'white', marginRight: 5 }}
                        >
                          <i className="ti-reload"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(artwork)}
                        title={isRejected ? 'Sửa và gửi duyệt lại' : 'Sửa'}
                      >
                        <i className="ti-pencil"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(artwork.maTacPham)}
                        style={{ color: 'red', marginLeft: 5 }}
                        title="Xóa"
                      >
                        <i className="ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal lý do từ chối */}
      {rejectInfo && (
        <div className="modal show" style={{ display: 'flex' }} onClick={() => setRejectInfo(null)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setRejectInfo(null)}>&times;</span>
            <h3 style={{ color: '#c0392b' }}>
              <i className="ti-close"></i> Lý do tác phẩm bị từ chối
            </h3>
            <p style={{ marginBottom: 12 }}><strong>Tác phẩm:</strong> {rejectInfo.tenTacPham}</p>
            <div style={{
              background: '#fdecea', color: '#641e16', padding: 12,
              borderRadius: 8, borderLeft: '4px solid #c0392b',
              whiteSpace: 'pre-wrap', lineHeight: 1.6
            }}>
              {rejectInfo.lyDo}
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              Bạn có thể sửa nội dung tác phẩm và gửi lại để admin duyệt.
            </p>
            <div className="modal-buttons" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-cancel" type="button" onClick={() => setRejectInfo(null)}>Đóng</button>
              <button
                className="btn-save"
                type="button"
                onClick={() => { setRejectInfo(null); handleOpenModal(rejectInfo); }}
              >
                <i className="ti-pencil"></i> Sửa & gửi lại
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal show" style={{ display: 'flex' }}>
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            <h3>{editingArtwork ? 'Sửa Tác Phẩm' : 'Thêm Tác Phẩm Mới'}</h3>
            {editingArtwork?.trangThai === 3 && editingArtwork.lyDo && (
              <div style={{
                background: '#fdecea', color: '#641e16',
                padding: '10px 12px', borderRadius: 8,
                borderLeft: '4px solid #c0392b',
                marginBottom: 16, fontSize: 14
              }}>
                <strong>Tác phẩm này đã bị từ chối.</strong> Lý do: {editingArtwork.lyDo}
                <div style={{ fontSize: 12, marginTop: 4, color: '#7b241c' }}>
                  Sau khi cập nhật, tác phẩm sẽ được gửi lại để admin duyệt.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-column">
                  <div className="form-group">
                    <label>Tên tranh: <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="text" 
                      value={formData.tenTacPham}
                      onChange={(e) => setFormData({ ...formData, tenTacPham: e.target.value })}
                      placeholder="Ví dụ: Sang Đông" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Giá bán (VNĐ): <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number" 
                      value={formData.gia}
                      onChange={(e) => setFormData({ ...formData, gia: e.target.value })}
                      placeholder="4500000" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Danh mục: <span style={{ color: 'red' }}>*</span></label>
                    <select 
                      value={formData.maDanhMuc}
                      onChange={(e) => setFormData({ ...formData, maDanhMuc: e.target.value })}
                      required
                    >
                      {categories.map(c => (
                          <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-group">
                    <label>Số lượng: <span style={{ color: 'red' }}>*</span></label>
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
                  {editingArtwork ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
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

export default ArtistArtworks;
