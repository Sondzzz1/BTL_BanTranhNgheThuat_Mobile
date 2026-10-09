// Artist Artworks - Quản lý tác phẩm của họa sĩ
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  artistDashboardService,
  OriginalArtworkOption,
  TacPhamHoaSiResponse,
} from '../../services/artistDashboardService';
import { categoryService } from '../../services/categoryService';
import { formatVnd } from '../../utils/currency';
import './ArtistArtworks.css';
import { newRequestKey } from '../../utils/requestKey';

const STATUS_LABEL: Record<number, { text: string; cls: string; icon: string }> = {
  0: { text: 'Chờ duyệt',  cls: 'pending',   icon: 'ti-time' },
  1: { text: 'Đang bán',   cls: 'success',   icon: 'ti-check-box' },
  2: { text: 'Đã ẩn',      cls: 'shipped',   icon: 'ti-eye' },
  3: { text: 'Bị từ chối', cls: 'canceled',  icon: 'ti-close' },
};

const ArtistArtworks: React.FC = () => {
  const navigate = useNavigate();
  const sending = useRef(false);
  const createRequestKey = useRef('');
  const [saving, setSaving] = useState(false);
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
    loaiTacPham: 0 as 0 | 2 | 4,
    tacGiaGoc: '',
    maTacPhamGoc: '',
    tenTacPhamGoc: '',
    khongXacDinhTacGiaGoc: false,
    nguonThamKhao: '',
    moTaNguonGoc: '',
    moTa: '',
    kichThuoc: '',
    chatLieu: '',
    chatLieuKhung: '',
  });
  const [originMethod, setOriginMethod] = useState<'catalog' | 'external'>('catalog');
  const [originSearch, setOriginSearch] = useState('');
  const [originResults, setOriginResults] = useState<OriginalArtworkOption[]>([]);
  const [selectedOriginal, setSelectedOriginal] = useState<OriginalArtworkOption | null>(null);
  const [originSearchLoading, setOriginSearchLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [failedImageIndexes, setFailedImageIndexes] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isModalOpen || (editingArtwork && editingArtwork.trangThai !== 0 && editingArtwork.trangThai !== 3) || formData.loaiTacPham !== 2
        || originMethod !== 'catalog' || originSearch.trim().length < 2) {
      setOriginResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setOriginSearchLoading(true);
      try {
        const results = await artistDashboardService.searchOriginalArtworks(originSearch.trim());
        if (active) setOriginResults(results.slice(0, 10));
      } catch {
        if (active) setOriginResults([]);
      } finally {
        if (active) setOriginSearchLoading(false);
      }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isModalOpen, editingArtwork, formData.loaiTacPham, originMethod, originSearch]);

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
    if (sending.current) return;
    createRequestKey.current = newRequestKey();
    setFailedImageIndexes([]);
    if (artwork) {
      setEditingArtwork(artwork);
      setOriginMethod(artwork.maTacPhamGoc || !artwork.tenTacPhamGoc ? 'catalog' : 'external');
      setOriginSearch('');
      setOriginResults([]);
      setSelectedOriginal(null);
      if (artwork.maTacPhamGoc) {
        artistDashboardService.getPublicOriginalArtwork(artwork.maTacPhamGoc)
          .then(setSelectedOriginal)
          .catch(() => setSelectedOriginal(null));
      }
      const cat = categories.find(c => c.tenDanhMuc === artwork.tenDanhMuc);
      setFormData({
        tenTacPham: artwork.tenTacPham,
        gia: artwork.gia.toString(),
        maDanhMuc: cat ? cat.maDanhMuc.toString() : (categories.length > 0 ? categories[0].maDanhMuc.toString() : ''),
        soLuong: artwork.soLuong.toString(),
        loaiPhatHanh: artwork.laTacPhamDocBan ? 'exclusive' : 'multiple',
        loaiTacPham: artwork.loaiTacPham === 2 ? 2 : artwork.loaiTacPham === 4 ? 4 : 0,
        tacGiaGoc: artwork.tacGiaGoc || '',
        maTacPhamGoc: artwork.maTacPhamGoc?.toString() || '',
        tenTacPhamGoc: artwork.tenTacPhamGoc || '',
        khongXacDinhTacGiaGoc: artwork.khongXacDinhTacGiaGoc || false,
        nguonThamKhao: artwork.nguonThamKhao || '',
        moTaNguonGoc: artwork.moTaNguonGoc || '',
        moTa: artwork.moTa || '',
        kichThuoc: artwork.kichThuoc || '',
        chatLieu: artwork.chatLieu || '',
        chatLieuKhung: artwork.chatLieuKhung || '',
      });
      setImageUrls([artwork.hinhAnh || '']);
      setIsModalOpen(true);
    } else {
      setEditingArtwork(null);
      setOriginMethod('catalog');
      setOriginSearch('');
      setOriginResults([]);
      setSelectedOriginal(null);
      setFormData({
        tenTacPham: '',
        gia: '',
        maDanhMuc: categories.length > 0 ? categories[0].maDanhMuc.toString() : '',
        soLuong: '1',
        loaiPhatHanh: 'exclusive',
        loaiTacPham: 0,
        tacGiaGoc: '',
        maTacPhamGoc: '',
        tenTacPhamGoc: '',
        khongXacDinhTacGiaGoc: false,
        nguonThamKhao: '',
        moTaNguonGoc: '',
        moTa: '',
        kichThuoc: '',
        chatLieu: '',
        chatLieuKhung: '',
      });
      setImageUrls(['']);
      setIsModalOpen(true);
    }
  };

  const normalizedImageUrls = () => imageUrls
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setSaving(true);
    try {
      const urls = normalizedImageUrls();
      const invalidUrl = urls.find((url) => !isValidImageUrl(url));
      if (invalidUrl) {
        alert(`URL ảnh không hợp lệ: ${invalidUrl}\nVui lòng dùng đường dẫn bắt đầu bằng http:// hoặc https://`);
        return;
      }

      const rawGia = formData.gia.toString().replace(/\D/g, '');
      const parsedGia = parseFloat(rawGia);
      if (!rawGia || isNaN(parsedGia) || parsedGia <= 0) {
        alert('Vui lòng nhập giá bán hợp lệ.');
        return;
      }

      const artworkPayload = {
        tenTacPham: formData.tenTacPham,
        gia: parsedGia,
        maDanhMuc: formData.maDanhMuc ? parseInt(formData.maDanhMuc) : undefined,
        // Editing changes remaining stock only; never revive a sold-out exclusive work.
        soLuong: editingArtwork ? parseInt(formData.soLuong, 10)
          : formData.loaiPhatHanh === 'exclusive' ? 1 : parseInt(formData.soLuong, 10),
        laTacPhamDocBan: formData.loaiPhatHanh === 'exclusive',
        hinhAnh: urls[0] || '',
        moTa: formData.moTa,
        kichThuoc: formData.kichThuoc,
        chatLieu: formData.chatLieu,
        chatLieuKhung: formData.chatLieuKhung,
      };

      if (!Number.isInteger(artworkPayload.soLuong) || artworkPayload.soLuong < (editingArtwork ? 0 : 1)) {
        alert(editingArtwork ? 'Tồn kho phải là số nguyên không âm.' : 'Số lượng phát hành phải là số nguyên lớn hơn 0.');
        return;
      }
      if (editingArtwork && editingArtwork.soLuongBanDau != null
        && artworkPayload.soLuong > editingArtwork.soLuongBanDau) {
        alert('Tồn kho không được vượt số lượng phát hành ban đầu đã ghi nhận.');
        return;
      }
      if (!editingArtwork && artworkPayload.laTacPhamDocBan && artworkPayload.soLuong !== 1) {
        alert('Tranh độc bản phải được tạo với số lượng bằng 1.');
        return;
      }
      if (!editingArtwork && !artworkPayload.laTacPhamDocBan && artworkPayload.soLuong < 2) {
        alert('Tranh nhiều bản cần khai báo số lượng ban đầu từ 2 trở lên.');
        return;
      }

      const canEditOrigin = !editingArtwork || editingArtwork.trangThai === 0 || editingArtwork.trangThai === 3;
      if (canEditOrigin && formData.loaiTacPham === 2) {
        if (originMethod === 'catalog' && !selectedOriginal) {
          alert('Vui lòng chọn tác phẩm gốc từ kết quả tìm kiếm.');
          return;
        }
        if (originMethod === 'external' && (!formData.tenTacPhamGoc.trim()
          || (!formData.tacGiaGoc.trim() && !formData.khongXacDinhTacGiaGoc))) {
          alert('Tác phẩm ngoài hệ thống cần tên tác phẩm gốc và tác giả, hoặc đánh dấu không xác định tác giả.');
          return;
        }
      }
      if (canEditOrigin && formData.loaiTacPham === 4
        && (!formData.nguonThamKhao.trim() || !formData.moTaNguonGoc.trim())) {
        alert('Vui lòng khai báo nguồn tham khảo và cách bạn sử dụng nguồn đó.');
        return;
      }

      const originPayload = {
        loaiTacPham: formData.loaiTacPham,
        maTacPhamGoc: formData.loaiTacPham === 2 && originMethod === 'catalog'
          ? selectedOriginal?.maTacPham : undefined,
        tenTacPhamGoc: formData.loaiTacPham === 2 && originMethod === 'external'
          ? formData.tenTacPhamGoc.trim() : undefined,
        tacGiaGoc: formData.loaiTacPham === 2 && originMethod === 'external'
          && !formData.khongXacDinhTacGiaGoc ? formData.tacGiaGoc.trim() : undefined,
        khongXacDinhTacGiaGoc: formData.loaiTacPham === 2 && originMethod === 'external'
          ? formData.khongXacDinhTacGiaGoc : false,
        nguonThamKhao: formData.loaiTacPham !== 0 ? formData.nguonThamKhao.trim() : undefined,
        moTaNguonGoc: formData.loaiTacPham !== 0 ? formData.moTaNguonGoc.trim() : undefined,
      };

      let artworkId: number;
      if (editingArtwork) {
        await artistDashboardService.capNhatTacPham(editingArtwork.maTacPham, {
          ...artworkPayload,
          ...(canEditOrigin ? originPayload : {}),
        });
        artworkId = editingArtwork.maTacPham;
      } else {
        const created = await artistDashboardService.taoTacPham({
          ...artworkPayload,
          ...originPayload,
        }, createRequestKey.current);
        artworkId = created.maTacPham;
      }

      if (canEditOrigin) {
        let saved: TacPhamHoaSiResponse;
        try {
          saved = await artistDashboardService.getTacPhamById(artworkId);
        } catch {
          setIsModalOpen(false);
          await loadData();
          alert('Tác phẩm đã được lưu nhưng chưa thể kiểm tra nguồn gốc trong dữ liệu. Vui lòng kiểm tra lại trước khi admin phê duyệt; không bấm thêm mới lần nữa để tránh trùng tác phẩm.');
          return;
        }
        const sourceMatches = saved.loaiTacPham === originPayload.loaiTacPham
          && (originPayload.loaiTacPham !== 2 || (originMethod === 'catalog'
            ? saved.maTacPhamGoc === originPayload.maTacPhamGoc
            : saved.tenTacPhamGoc?.trim() === originPayload.tenTacPhamGoc
              && saved.khongXacDinhTacGiaGoc === originPayload.khongXacDinhTacGiaGoc
              && (originPayload.khongXacDinhTacGiaGoc || saved.tacGiaGoc?.trim() === originPayload.tacGiaGoc)))
          && (originPayload.loaiTacPham !== 4
            || (saved.nguonThamKhao?.trim() === originPayload.nguonThamKhao
              && saved.moTaNguonGoc?.trim() === originPayload.moTaNguonGoc));
        if (!sourceMatches) {
          setIsModalOpen(false);
          await loadData();
          alert('Tác phẩm đã được lưu nhưng nguồn gốc KHÔNG được ghi nhận đúng. Vui lòng cập nhật và khởi động lại backend, sau đó sửa khai báo của tác phẩm đang chờ duyệt trước khi admin phê duyệt.');
          return;
        }
      }

      alert(editingArtwork
        ? 'Cập nhật tác phẩm thành công!'
        : 'Thêm tác phẩm thành công! Tác phẩm đang chờ admin duyệt.');
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Có lỗi xảy ra');
    } finally { sending.current = false; setSaving(false); }
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
                        title="Thêm / chỉnh sửa nội dung chi tiết để gửi duyệt riêng"
                        style={{ background: '#9b59b6', color: 'white', marginRight: 5 }}
                      >
                        <i className="ti-write"></i> Nội dung chi tiết
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
                      min="0"
                      value={formData.gia}
                      onChange={(e) => setFormData({ ...formData, gia: e.target.value })}
                      placeholder="Ví dụ: 1000000"
                      required
                    />
                    <div style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: '#475569',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>Hiển thị:</span>
                      <strong style={{ color: '#059669', fontSize: 14 }}>
                        {formData.gia && Number(formData.gia) > 0
                          ? `${Number(formData.gia).toLocaleString('vi-VN')} VNĐ`
                          : '1.000.000 VNĐ'}
                      </strong>
                    </div>
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
                    <label>{editingArtwork ? 'Tồn kho hiện tại:' : formData.loaiPhatHanh === 'exclusive' ? 'Số lượng phát hành (cố định):' : 'Số lượng phát hành ban đầu:'} <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="number" 
                      min={editingArtwork ? 0 : formData.loaiPhatHanh === 'exclusive' ? 1 : 2}
                      max={editingArtwork ? editingArtwork.soLuongBanDau ?? undefined : undefined}
                      value={formData.soLuong}
                      disabled={formData.loaiPhatHanh === 'exclusive'}
                      onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
                      required 
                    />
                    {editingArtwork && <small>{formData.loaiPhatHanh === 'multiple'
                      ? 'Đây là số bản còn lại; tồn 0 hoặc 1 vẫn là tranh nhiều bản nếu ban đầu phát hành từ 2 bản.'
                      : 'Đây là số hiện vật còn lại của tranh độc bản; không thể đổi loại phát hành bằng cách sửa tồn kho.'}</small>}
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

              {(!editingArtwork || editingArtwork.trangThai === 0 || editingArtwork.trangThai === 3) ? (
                <section
                  aria-labelledby="artwork-origin-heading"
                  style={{
                    margin: '4px 0 18px', padding: 16, border: '1px solid #d6e4f0',
                    borderRadius: 8, background: '#f8fbff'
                  }}
                >
                  <div id="artwork-origin-heading" style={{ fontWeight: 700, color: '#1f3d5a', marginBottom: 6 }}>
                    Nguồn gốc sáng tạo <span style={{ color: 'red' }}>*</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#667085', lineHeight: 1.5 }}>
                    Khai báo này khác với loại phát hành. Nguồn gốc cho biết tác phẩm do bạn tự sáng tác
                    hay được phát triển từ một tác phẩm hoặc nguồn có trước.
                  </p>
                  <div className="form-group" style={{ maxWidth: 420, marginBottom: 10 }}>
                    <label>Loại tác phẩm</label>
                    <select
                      value={formData.loaiTacPham}
                      onChange={(e) => {
                        const loaiTacPham = Number(e.target.value) as 0 | 2 | 4;
                        setSelectedOriginal(null);
                        setOriginSearch('');
                        setFormData({
                          ...formData,
                          loaiTacPham,
                          tacGiaGoc: '', maTacPhamGoc: '', tenTacPhamGoc: '',
                          khongXacDinhTacGiaGoc: false, nguonThamKhao: '', moTaNguonGoc: '',
                        });
                      }}
                    >
                      <option value={0}>Tác phẩm gốc do tôi sáng tác</option>
                      <option value={2}>Phiên bản vẽ lại / phái sinh</option>
                      <option value={4}>Dựa trên ảnh / tài liệu tham khảo</option>
                    </select>
                  </div>

                  {formData.loaiTacPham === 2 && (
                    <>
                      <div style={{ display: 'flex', gap: 14, margin: '8px 0 12px' }}>
                        <label><input type="radio" checked={originMethod === 'catalog'} onChange={() => { setOriginMethod('catalog'); setSelectedOriginal(null); }} /> Có trên hệ thống</label>
                        <label><input type="radio" checked={originMethod === 'external'} onChange={() => { setOriginMethod('external'); setSelectedOriginal(null); setOriginSearch(''); }} /> Ngoài hệ thống</label>
                      </div>
                      {originMethod === 'catalog' ? (
                        <div className="form-group">
                          <label>Tác phẩm gốc trên hệ thống <span style={{ color: 'red' }}>*</span></label>
                          {selectedOriginal ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'white', border: '1px solid #cbd5e1', borderRadius: 7 }}>
                              {selectedOriginal.hinhAnh && <img src={selectedOriginal.hinhAnh} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} />}
                              <span><strong>{selectedOriginal.tenTacPham}</strong><br /><small>{selectedOriginal.tenHoaSi}</small></span>
                              <button type="button" onClick={() => setSelectedOriginal(null)} style={{ marginLeft: 'auto' }}>Đổi</button>
                            </div>
                          ) : (
                            <>
                              <input type="search" value={originSearch} onChange={e => setOriginSearch(e.target.value)} placeholder="Tìm tên tác phẩm hoặc họa sĩ..." />
                              {originSearchLoading && <small>Đang tìm...</small>}
                              {originResults.length > 0 && <div style={{ maxHeight: 180, overflowY: 'auto', background: 'white', border: '1px solid #d6e4f0', borderRadius: 6 }}>
                                {originResults.map(item => <button key={item.maTacPham} type="button"
                                  onClick={() => { setSelectedOriginal(item); setOriginSearch(''); setOriginResults([]); }}
                                  style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', gap: 10, padding: 8, background: 'white', border: 0, borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                  {item.hinhAnh && <img src={item.hinhAnh} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />}
                                  <span>{item.tenTacPham} — {item.tenHoaSi}</span>
                                </button>)}
                              </div>}
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          <div className="form-group"><label>Tên tác phẩm gốc <span style={{ color: 'red' }}>*</span></label><input value={formData.tenTacPhamGoc} onChange={e => setFormData({ ...formData, tenTacPhamGoc: e.target.value })} placeholder="Ví dụ: The Starry Night" required /></div>
                          <div className="form-group"><label>Tác giả gốc</label><input value={formData.tacGiaGoc} disabled={formData.khongXacDinhTacGiaGoc} onChange={e => setFormData({ ...formData, tacGiaGoc: e.target.value })} placeholder="Ví dụ: Vincent van Gogh" /></div>
                          <label style={{ gridColumn: '1 / -1' }}><input type="checkbox" checked={formData.khongXacDinhTacGiaGoc} onChange={e => setFormData({ ...formData, khongXacDinhTacGiaGoc: e.target.checked, tacGiaGoc: e.target.checked ? '' : formData.tacGiaGoc })} /> Không xác định được tác giả gốc</label>
                        </div>
                      )}
                    </>
                  )}
                  {formData.loaiTacPham !== 0 && <>
                    <div className="form-group"><label>Nguồn tham khảo {formData.loaiTacPham === 4 && <span style={{ color: 'red' }}>*</span>}</label><input type="text" value={formData.nguonThamKhao} onChange={e => setFormData({ ...formData, nguonThamKhao: e.target.value })} placeholder="URL hoặc tên nguồn tham khảo" required={formData.loaiTacPham === 4} /></div>
                    <div className="form-group"><label>Mô tả nguồn gốc / cách sử dụng {formData.loaiTacPham === 4 && <span style={{ color: 'red' }}>*</span>}</label><textarea rows={3} value={formData.moTaNguonGoc} onChange={e => setFormData({ ...formData, moTaNguonGoc: e.target.value })} placeholder="Ví dụ: Tác phẩm được phát triển từ nguồn có trước; tôi thay đổi màu sắc, bố cục hoặc phong cách..." required={formData.loaiTacPham === 4} /></div>
                  </>}
                  <small style={{ display: 'block', marginTop: 12, color: '#667085', lineHeight: 1.45 }}>
                    Khai báo nguồn gốc không đồng nghĩa với được xác minh hoặc được chuyển quyền tác giả.
                    Bạn có thể bổ sung căn cứ và bằng chứng tại mục “Nguồn gốc và xác minh” sau khi tạo tác phẩm.
                  </small>
                </section>
              ) : (
                <div style={{ margin: '4px 0 18px', padding: '10px 12px', borderRadius: 8, background: '#f8f9fa', fontSize: 13, color: '#495057' }}>
                  <strong>Nguồn gốc đã khai báo:</strong> {editingArtwork.loaiTacPhamText || 'Tự sáng tác'}.
                  {editingArtwork.loaiTacPham === 2 && (
                    <span> Điều chỉnh hoặc bổ sung bằng chứng tại mục “Nguồn gốc và xác minh”.</span>
                  )}
                </div>
              )}

              <div className="artwork-image-url-section">
                <div className="image-url-heading">
                  <div>
                    <label htmlFor="artwork-main-image">Ảnh đại diện tác phẩm</label>
                    <p>Ảnh này được duyệt cùng tác phẩm. Sau khi lưu, chọn “Nội dung chi tiết” để gửi câu chuyện và ảnh bổ sung.</p>
                  </div>
                </div>
                <div className="image-url-inputs"><div className="image-url-row">
                  <span className="image-url-index">1</span>
                  <input id="artwork-main-image" type="url" value={imageUrls[0] || ''}
                    onChange={(e) => updateImageUrl(0, e.target.value)} placeholder="URL ảnh đại diện (https://...)" />
                </div></div>
                {imageUrls[0]?.trim() && (
                  <div className="image-preview-gallery"><div className="image-preview-card">
                    {failedImageIndexes.includes(0) ? <div className="image-preview-error">Không tải được ảnh</div> : (
                      <img src={imageUrls[0].trim()} alt="Xem trước ảnh đại diện"
                        onError={() => setFailedImageIndexes([0])} />
                    )}
                    <span className="image-preview-label">Ảnh đại diện</span>
                  </div></div>
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
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Đang gửi...' : editingArtwork ? 'Cập nhật' : 'Thêm mới'}
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
