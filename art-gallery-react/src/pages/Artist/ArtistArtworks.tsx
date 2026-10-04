// Artist Artworks - Quản lý tác phẩm của họa sĩ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  artistDashboardService,
  ChiTietTacPhamPayload,
  ChiTietTacPhamResponse,
  TacPhamHoaSiResponse,
} from '../../services/artistDashboardService';
import { categoryService } from '../../services/categoryService';
import { formatVnd } from '../../utils/currency';
import './ArtistArtworks.css';

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
    loaiPhatHanh: 'exclusive' as 'exclusive' | 'multiple',
    moTa: '',
    kichThuoc: '',
    chatLieu: '',
    chatLieuKhung: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [failedImageIndexes, setFailedImageIndexes] = useState<number[]>([]);
  const [loadedDetail, setLoadedDetail] = useState<ChiTietTacPhamResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleOpenModal = async (artwork?: TacPhamHoaSiResponse) => {
    setFailedImageIndexes([]);
    setLoadedDetail(null);
    if (artwork) {
      setEditingArtwork(artwork);
      const cat = categories.find(c => c.tenDanhMuc === artwork.tenDanhMuc);
      setFormData({
        tenTacPham: artwork.tenTacPham,
        gia: artwork.gia.toString(),
        maDanhMuc: cat ? cat.maDanhMuc.toString() : (categories.length > 0 ? categories[0].maDanhMuc.toString() : ''),
        soLuong: artwork.soLuong.toString(),
        loaiPhatHanh: artwork.laTacPhamDocBan ? 'exclusive' : 'multiple',
        moTa: artwork.moTa || '',
        kichThuoc: artwork.kichThuoc || '',
        chatLieu: artwork.chatLieu || '',
        chatLieuKhung: artwork.chatLieuKhung || '',
      });
      setImageUrls([artwork.hinhAnh || '']);
      setDetailLoading(true);
      setIsModalOpen(true);
      try {
        const detail = await artistDashboardService.getChiTietTacPham(artwork.maTacPham);
        setLoadedDetail(detail);
        const detailImages = detail
          ? [detail.hinhAnh1, detail.hinhAnh2, detail.hinhAnh3, detail.hinhAnh4]
              .map((value) => value?.trim())
              .filter((value): value is string => Boolean(value))
          : [];
        const combined = [artwork.hinhAnh?.trim(), ...detailImages]
          .filter((value): value is string => Boolean(value))
          .filter((value, index, values) => values.indexOf(value) === index)
          .slice(0, 5);
        setImageUrls(combined.length > 0 ? combined : ['']);
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Không thể tải danh sách ảnh chi tiết của tác phẩm.');
      } finally {
        setDetailLoading(false);
      }
    } else {
      setEditingArtwork(null);
      setFormData({
        tenTacPham: '',
        gia: '',
        maDanhMuc: categories.length > 0 ? categories[0].maDanhMuc.toString() : '',
        soLuong: '1',
        loaiPhatHanh: 'exclusive',
        moTa: '',
        kichThuoc: '',
        chatLieu: '',
        chatLieuKhung: '',
      });
      setImageUrls(['']);
      setDetailLoading(false);
      setIsModalOpen(true);
    }
  };

  const normalizedImageUrls = () => imageUrls
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 5);

  const isValidImageUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const updateImageUrl = (index: number, value: string) => {
    setImageUrls((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
    setFailedImageIndexes((current) => current.filter((itemIndex) => itemIndex !== index));
  };

  const addImageUrl = () => {
    if (imageUrls.length >= 5) return;
    if (imageUrls.some((value) => !value.trim())) {
      alert('Vui lòng nhập URL ảnh hiện tại trước khi thêm URL mới.');
      return;
    }
    setImageUrls((current) => [...current, '']);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [''];
    });
    setFailedImageIndexes([]);
  };

  const buildDetailPayload = (urls: string[]): ChiTietTacPhamPayload => ({
    cauChuyenSangTac: loadedDetail?.cauChuyenSangTac || null,
    yNghiaNghiThuat: loadedDetail?.yNghiaNghiThuat || null,
    kyThuatThucHien: loadedDetail?.kyThuatThucHien || null,
    camHungSangTao: loadedDetail?.camHungSangTao || null,
    thongTinBosung: loadedDetail?.thongTinBosung || formData.moTa.trim() || null,
    kichThuoc: formData.kichThuoc.trim() || loadedDetail?.kichThuoc || null,
    chatLieu: formData.chatLieu.trim() || loadedDetail?.chatLieu || null,
    chatLieuKhung: formData.chatLieuKhung.trim() || loadedDetail?.chatLieuKhung || null,
    namSangTac: loadedDetail?.namSangTac || null,
    diaDiemSangTac: loadedDetail?.diaDiemSangTac || null,
    hinhAnh1: urls[1] || null,
    hinhAnh2: urls[2] || null,
    hinhAnh3: urls[3] || null,
    hinhAnh4: urls[4] || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const urls = normalizedImageUrls();
      const invalidUrl = urls.find((url) => !isValidImageUrl(url));
      if (invalidUrl) {
        alert(`URL ảnh không hợp lệ: ${invalidUrl}\nVui lòng dùng đường dẫn bắt đầu bằng http:// hoặc https://`);
        return;
      }

      const payload = {
        tenTacPham: formData.tenTacPham,
        gia: parseFloat(formData.gia),
        maDanhMuc: formData.maDanhMuc ? parseInt(formData.maDanhMuc) : undefined,
        soLuong: formData.loaiPhatHanh === 'exclusive' ? 1 : parseInt(formData.soLuong, 10),
        laTacPhamDocBan: formData.loaiPhatHanh === 'exclusive',
        hinhAnh: urls[0] || '',
        moTa: formData.moTa,
        kichThuoc: formData.kichThuoc,
        chatLieu: formData.chatLieu,
        chatLieuKhung: formData.chatLieuKhung,
      };

      if (!Number.isInteger(payload.soLuong) || payload.soLuong <= 0) {
        alert('Số lượng phát hành phải là số nguyên lớn hơn 0.');
        return;
      }
      if (!editingArtwork && payload.laTacPhamDocBan && payload.soLuong !== 1) {
        alert('Tranh độc bản phải được tạo với số lượng bằng 1.');
        return;
      }
      if (!editingArtwork && !payload.laTacPhamDocBan && payload.soLuong < 2) {
        alert('Tranh nhiều bản cần khai báo số lượng ban đầu từ 2 trở lên.');
        return;
      }

      let artworkId: number;
      if (editingArtwork) {
        await artistDashboardService.capNhatTacPham(editingArtwork.maTacPham, payload);
        artworkId = editingArtwork.maTacPham;
      } else {
        const created = await artistDashboardService.taoTacPham(payload);
        artworkId = created.maTacPham;
      }

      try {
        const detailPayload = buildDetailPayload(urls);
        if (loadedDetail) {
          await artistDashboardService.capNhatChiTietTacPham(artworkId, detailPayload);
        } else {
          await artistDashboardService.taoChiTietTacPham(artworkId, detailPayload);
        }
      } catch (detailError: any) {
        setIsModalOpen(false);
        await loadData();
        alert(
          `${editingArtwork ? 'Tác phẩm đã được cập nhật' : 'Tác phẩm đã được tạo'}, ` +
          `nhưng chưa lưu được thư viện ảnh chi tiết: ${detailError?.response?.data?.message || detailError.message || 'Lỗi không xác định'}`
        );
        return;
      }

      alert(editingArtwork
        ? 'Cập nhật tác phẩm và thư viện ảnh thành công! Nội dung sẽ được admin duyệt lại.'
        : 'Thêm tác phẩm và thư viện ảnh thành công! Tác phẩm đang chờ admin duyệt.');
      setIsModalOpen(false);
      await loadData();
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

  const formatPrice = formatVnd;

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
                <th>Phát hành</th>
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
                    <td><strong>{artwork.laTacPhamDocBan ? 'Độc bản' : 'Nhiều bản'}</strong><br /><small>Ban đầu: {artwork.soLuongBanDau ?? 'chưa đối soát'}</small></td>
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
                      <button
                        onClick={() => navigate(`/artist/artworks/${artwork.maTacPham}/copyright`)}
                        title="Nguồn gốc và xác minh tác phẩm"
                        style={{ background: '#1f3d2f', color: 'white', marginRight: 5 }}
                      >
                        <i className="ti-shield"></i>
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
                    <label>Loại phát hành: <span style={{ color: 'red' }}>*</span></label>
                    <select
                      value={formData.loaiPhatHanh}
                      disabled={Boolean(editingArtwork)}
                      onChange={(e) => setFormData({
                        ...formData,
                        loaiPhatHanh: e.target.value as 'exclusive' | 'multiple',
                        soLuong: e.target.value === 'exclusive' ? '1' : (formData.soLuong === '1' ? '2' : formData.soLuong),
                      })}
                    >
                      <option value="exclusive">Tranh độc bản</option>
                      <option value="multiple">Tranh nhiều bản</option>
                    </select>
                    <small style={{ display: 'block', marginTop: 6, color: '#667085', lineHeight: 1.45 }}>
                      {formData.loaiPhatHanh === 'exclusive'
                        ? 'Chỉ có một hiện vật. Khai báo cần được Admin xác minh trước khi cấp chứng nhận sở hữu.'
                        : 'Một mẫu có nhiều hiện vật phát hành. Người mua sở hữu bản đã mua, không sở hữu toàn bộ mẫu tác phẩm.'}
                    </small>
                    {editingArtwork && <small style={{ display: 'block', marginTop: 4, color: '#a15c00' }}>Loại phát hành và số lượng ban đầu đã được chốt khi tạo. Nếu khai báo sai, hãy gửi căn cứ cho Admin để hiệu chỉnh và xác minh lại.</small>}
                  </div>

                  <div className="form-group">
                    <label>{formData.loaiPhatHanh === 'exclusive' ? 'Số lượng (cố định):' : 'Số lượng phát hành:'} <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number" 
                      min={formData.loaiPhatHanh === 'exclusive' ? 1 : 2}
                      value={formData.soLuong}
                      disabled={formData.loaiPhatHanh === 'exclusive'}
                      onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
                      required 
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

              <div className="artwork-image-url-section">
                <div className="image-url-heading">
                  <div>
                    <label>URL hình ảnh tác phẩm</label>
                    <p>Ảnh đầu tiên là ảnh đại diện. Bạn có thể thêm tối đa 5 URL (1 ảnh đại diện và 4 ảnh bổ sung).</p>
                  </div>
                  {imageUrls.length < 5 && (
                    <button type="button" className="btn-add-image-url" onClick={addImageUrl}>
                      <i className="ti-plus"></i> Thêm URL ảnh
                    </button>
                  )}
                </div>

                {detailLoading ? (
                  <div className="image-url-loading">Đang tải thư viện ảnh...</div>
                ) : (
                  <>
                    <div className="image-url-inputs">
                      {imageUrls.map((url, index) => (
                        <div className="image-url-row" key={index}>
                          <span className="image-url-index">{index + 1}</span>
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                            placeholder={`URL ảnh ${index + 1} (https://...)`}
                          />
                          {imageUrls.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-image-url"
                              onClick={() => removeImageUrl(index)}
                              title="Xóa URL ảnh này"
                            >
                              <i className="ti-trash"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {imageUrls.some((url) => url.trim()) && (
                      <div className="image-preview-gallery">
                        {imageUrls.map((url, index) => url.trim() && (
                          <div className="image-preview-card" key={`${index}-${url}`}>
                            {failedImageIndexes.includes(index) ? (
                              <div className="image-preview-error">
                                <i className="ti-image"></i>
                                <span>Không tải được ảnh</span>
                              </div>
                            ) : (
                              <img
                                src={url.trim()}
                                alt={`Xem trước tác phẩm ${index + 1}`}
                                onError={() => setFailedImageIndexes((current) =>
                                  current.includes(index) ? current : [...current, index]
                                )}
                              />
                            )}
                            <span className="image-preview-label">
                              {index === 0 ? 'Ảnh đại diện' : `Ảnh bổ sung ${index}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
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
                <button type="submit" className="btn-save" disabled={detailLoading}>
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
