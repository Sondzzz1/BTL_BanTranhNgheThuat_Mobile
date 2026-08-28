import React, { useState, useEffect } from 'react';
import {
  contentService,
  BaiVietResponse,
  NoiDungResponse
} from '../../services/contentService';
import './Admin.css';

// ======================== HELPER TRẠNG THÁI ========================
const trangThaiBaiVietLabel = (status: any) => {
  switch (Number(status)) {
    case 0: return { text: 'Nháp',       cls: 'status-inactive' };
    case 1: return { text: 'Chờ duyệt',  cls: 'status-pending' };
    case 2: return { text: 'Đã duyệt',   cls: 'status-success' };
    case 3: return { text: 'Từ chối',    cls: 'status-canceled' };
    case 4: return { text: 'Đã lưu trữ', cls: 'status-inactive' };
    default: return { text: 'Trống', cls: 'status-inactive' };
  }
};

// ======================== MODAL TỪ CHỐI ========================
interface RejectModalProps {
  baiViet: BaiVietResponse;
  onConfirm: (lyDo: string) => void;
  onCancel: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ baiViet, onConfirm, onCancel }) => {
  const [lyDo, setLyDo] = useState('');
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 450, width: '90%' }}>
        <h3>Từ chối bài viết</h3>
        <p>Lý do từ chối bài viết: <strong>{baiViet.tieuDe}</strong></p>
        <textarea
          value={lyDo}
          onChange={e => setLyDo(e.target.value)}
          rows={4}
          placeholder="Nhập lý do tại đây..."
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd' }}>Hủy</button>
          <button onClick={() => onConfirm(lyDo)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e74c3c', color: '#fff' }}>Gửi từ chối</button>
        </div>
      </div>
    </div>
  );
};

// ======================== MODAL PREVIEW ========================
const PreviewModal: React.FC<{ baiViet: BaiVietResponse; onClose: () => void }> = ({ baiViet, onClose }) => {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ marginTop: 0 }}>{baiViet.tieuDe}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: '#888', fontSize: 13 }}>Đăng bởi: {baiViet.tenHoaSi} - {new Date(baiViet.ngayDang).toLocaleDateString('vi-VN')}</p>
        {baiViet.anhTieuDe && (
          <img src={baiViet.anhTieuDe} alt={baiViet.tieuDe} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, margin: '15px 0' }} />
        )}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333' }}>
          {baiViet.noiDung || 'Chưa có nội dung'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd' }}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

// ======================== COMPONENT CHÍNH ========================
const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'artwork-details'>('articles');
  const [articles, setArticles] = useState<BaiVietResponse[]>([]);
  const [artworkDetails, setArtworkDetails] = useState<NoiDungResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<BaiVietResponse | null>(null);
  const [previewModal, setPreviewModal] = useState<BaiVietResponse | null>(null);

  useEffect(() => {
    if (activeTab === 'articles') loadArticles();
    else loadArtworkDetails();
  }, [activeTab]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // Gọi hàm Admin để lấy tất cả (kể cả bài trạng thái 0)
      const data = await contentService.layTatCaBaiVietAdmin();
      setArticles(data);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
      alert('Không thể tải bài viết. Vui lòng kiểm tra lại Backend.');
    } finally {
      setLoading(false);
    }
  };

  const loadArtworkDetails = async () => {
    setLoading(true);
    try {
      const data = await contentService.layTatCaChiTietTacPham();
      setArtworkDetails(data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleApprove = async (id: number) => {
    if (!window.confirm('Duyệt bài viết này?')) return;
    try {
      await contentService.pheDuyetBaiViet(id);
      alert('Đã duyệt bài viết thành công!');
      loadArticles();
    } catch (error) {
      alert('Lỗi khi duyệt bài viết');
    }
  };

  const handleRejectConfirm = async (lyDo: string) => {
    if (!rejectModal || !lyDo.trim()) return;
    try {
      await contentService.tuChoiBaiViet(rejectModal.maBaiViet, lyDo);
      alert('Đã từ chối bài viết.');
      setRejectModal(null);
      loadArticles();
    } catch (error) {
      alert('Lỗi khi gửi từ chối');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await contentService.xoaBaiViet(id);
      alert('Đã xóa bài viết.');
      loadArticles();
    } catch (error) {
      alert('Lỗi khi xóa bài viết');
    }
  };

  return (
    <div className="page">
      {rejectModal && (
        <RejectModal
          baiViet={rejectModal}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
        />
      )}
      {previewModal && (
        <PreviewModal baiViet={previewModal} onClose={() => setPreviewModal(null)} />
      )}

      <div className="page-header">
        <h4><i className="ti-write"></i> Quản lý Nội dung</h4>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>Bài viết</button>
          <button className={`tab-btn ${activeTab === 'artwork-details' ? 'active' : ''}`} onClick={() => setActiveTab('artwork-details')}>Chi tiết tác phẩm</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : activeTab === 'articles' ? (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người đăng</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(item => {
                const { text, cls } = trangThaiBaiVietLabel(item.trangThai);
                return (
                  <tr key={item.maBaiViet}>
                    <td><strong>{item.tieuDe}</strong></td>
                    <td>{item.tenHoaSi}</td>
                    <td>{new Date(item.ngayDang).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`status ${cls}`}>{text}</span></td>
                    <td>
                      <button onClick={() => setPreviewModal(item)} className="btn-approve" title="Xem trước" style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ddd', marginRight: 5 }}><i className="ti-eye"></i> Xem</button>
                      {item.trangThai === 1 && (
                        <>
                          <button onClick={() => handleApprove(item.maBaiViet)} className="btn-approve" title="Duyệt"><i className="ti-check"></i> Duyệt</button>
                          <button onClick={() => setRejectModal(item)} className="btn-delete" title="Từ chối" style={{marginLeft: 5}}><i className="ti-close"></i> Từ chối</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteArticle(item.maBaiViet)} className="btn-delete" title="Xóa" style={{marginLeft: 5}}><i className="ti-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Tác phẩm</th>
                <th>Tiêu đề nội dung</th>
                <th>Loại</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {artworkDetails.map(item => (
                <tr key={item.maNoiDung}>
                  <td>Mã TP #{item.maTacPham}</td>
                  <td>{item.tieuDe}</td>
                  <td>{item.loai}</td>
                  <td>
                    <button className="btn-delete" onClick={() => contentService.xoaChiTietTacPham(item.maNoiDung).then(loadArtworkDetails)}><i className="ti-trash"></i></button>
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

export default AdminContent;
