// Artist Deleted Artworks - Trang quản lý tác phẩm đã xóa
import React, { useState, useEffect } from 'react';
import { hoaSiAuthService } from '../../services/hoaSiAuthService';
import { categoryService } from '../../services/categoryService';
import './ArtistArtworks.css';

interface DeletedArtwork {
  maTacPham: number;
  tenTacPham: string;
  tenHoaSi: string;
  tenDanhMuc?: string;
  gia: number;
  soLuong: number;
  moTa?: string;
  hinhAnh?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
  ngayTao?: string;
}

const ArtistDeletedArtworks: React.FC = () => {
  const [artworks, setArtworks] = useState<DeletedArtwork[]>([]);
  const [categories, setCategories] = useState<{ maDanhMuc: number, tenDanhMuc: string }[]>([]);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deletedData, categoriesRes] = await Promise.all([
        hoaSiAuthService.getDeletedArtworks(),
        categoryService.getAllCategories().catch(() => [])
      ]);
      setArtworks(deletedData);
      setCategories(categoriesRes);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách tác phẩm đã xóa');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn khôi phục tác phẩm "${name}"?\nTác phẩm sẽ quay lại danh sách quản lý chính với trạng thái "Chờ duyệt".`)) {
      return;
    }

    try {
      await hoaSiAuthService.restoreArtwork(id);
      alert('Khôi phục tác phẩm thành công!');
      loadData(); // Reload danh sách
    } catch (err: any) {
      console.error('Error restoring artwork:', err);
      alert(err.response?.data?.message || 'Không thể khôi phục tác phẩm');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Lọc tác phẩm đã xóa
  let filteredArtworks = artworks;
  if (filterCat !== 'all') {
    filteredArtworks = filteredArtworks.filter(art => art.tenDanhMuc === filterCat);
  }
  if (searchQuery.trim() !== '') {
    filteredArtworks = filteredArtworks.filter(art =>
      art.tenTacPham.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.chatLieu && art.chatLieu.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

  return (
    <div id="art" className="page">
      <div className="art-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '20px', color: '#c0392b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti-trash"></i> Thùng Rác / Tác Phẩm Đã Xóa
          </h4>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#777' }}>
            Nơi lưu trữ tạm thời các tác phẩm đã xóa. Bạn có thể khôi phục chúng bất cứ lúc nào.
          </p>
        </div>
      </div>

      {/* Bộ lọc giống trang quản lý chính */}
      <div className="filter-bar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
        <input
          type="text"
          placeholder="Tìm theo tên tranh hoặc chất liệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 5, flex: 1, minWidth: 200 }}
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 5 }}
        >
          <option value="all">Tất cả danh mục ({artworks.length})</option>
          {categories.map(c => (
            <option key={c.maDanhMuc} value={c.tenDanhMuc}>{c.tenDanhMuc}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ background: '#fdecea', color: '#c0392b', padding: '12px', borderRadius: '8px', margin: '15px 0' }}>
          {error}
        </div>
      )}

      {filteredArtworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 10, marginTop: '20px' }}>
          <i className="ti-info-alt" style={{ fontSize: '4rem', color: '#ddd' }}></i>
          <h3>Không có tác phẩm nào trong thùng rác</h3>
          <p style={{ color: '#777', fontSize: '14px' }}>Các tác phẩm bị xóa sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: '20px' }}>
          <table className="art-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên tác phẩm</th>
                <th>Danh mục</th>
                <th>Thông tin chi tiết</th>
                <th>Giá bán</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtworks.map(artwork => (
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
                  <td>
                    <strong>{artwork.tenTacPham}</strong>
                  </td>
                  <td>{artwork.tenDanhMuc || 'Chưa phân loại'}</td>
                  <td>
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {artwork.kichThuoc && <div>📏 <strong>Kích thước:</strong> {artwork.kichThuoc}</div>}
                      {artwork.chatLieu && <div>🎨 <strong>Chất liệu:</strong> {artwork.chatLieu}</div>}
                      {artwork.chatLieuKhung && <div>🖼️ <strong>Khung:</strong> {artwork.chatLieuKhung}</div>}
                    </div>
                  </td>
                  <td style={{ color: '#c0392b', fontWeight: 'bold' }}>{formatPrice(artwork.gia)}</td>
                  <td>{artwork.soLuong}</td>
                  <td>
                    <span className="status canceled" style={{ background: '#fdecea', color: '#c0392b', border: '1px solid #f5b7b1' }}>
                      <i className="ti-trash"></i> Đã xóa tạm
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleRestore(artwork.maTacPham, artwork.tenTacPham)}
                      title="Khôi phục tác phẩm này"
                      style={{
                        background: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(46,204,113,0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#27ae60';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#2ecc71';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="ti-reload"></i> Khôi phục
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArtistDeletedArtworks;
