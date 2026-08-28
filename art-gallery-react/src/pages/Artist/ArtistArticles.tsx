import React, { useState, useEffect } from 'react';
import {
  artistDashboardService,
  BaiVietResponse,
  TaoBaiVietRequest,
  CapNhatBaiVietRequest
} from '../../services/artistDashboardService';
import './Artist.css';

// ======================== TRẠNG THÁI ========================
const trangThaiLabel = (status: number) => {
  switch (status) {
    case 0: return { text: 'Nháp',      cls: 'status-draft' };
    case 1: return { text: 'Chờ duyệt', cls: 'status-pending' };
    case 2: return { text: 'Đã duyệt',  cls: 'status-approved' };
    case 3: return { text: 'Từ chối',   cls: 'status-rejected' };
    default: return { text: 'Không rõ', cls: '' };
  }
};

// ======================== FORM MODAL ========================
interface BaiVietFormProps {
  initial?: BaiVietResponse | null;
  onSubmit: (data: { tieuDe: string; noiDung: string; anhTieuDe: string }) => void;
  onCancel: () => void;
  submitting: boolean;
}

const BaiVietForm: React.FC<BaiVietFormProps> = ({ initial, onSubmit, onCancel, submitting }) => {
  const [tieuDe, setTieuDe] = useState(initial?.tieuDe || '');
  const [anhTieuDe, setAnhTieuDe] = useState(initial?.anhTieuDe || '');
  const [noiDung, setNoiDung] = useState(initial?.noiDung || '');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff', borderRadius: 14,
        padding: '32px', maxWidth: 560, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ marginTop: 0, color: '#1a1a2e', borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
          {initial ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Tiêu đề <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            value={tieuDe}
            onChange={e => setTieuDe(e.target.value)}
            placeholder="Nhập tiêu đề bài viết..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            URL Ảnh Tiêu Đề
          </label>
          <input
            value={anhTieuDe}
            onChange={e => setAnhTieuDe(e.target.value)}
            placeholder="Nhập đường dẫn URL hình ảnh..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box'
            }}
          />
          {anhTieuDe && (
            <img 
              src={anhTieuDe} 
              alt="Preview" 
              style={{ marginTop: 10, maxWidth: '100%', maxHeight: 150, borderRadius: 8, objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Nội dung</label>
          <textarea
            value={noiDung}
            onChange={e => setNoiDung(e.target.value)}
            rows={8}
            placeholder="Nhập nội dung bài viết..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14,
              resize: 'vertical', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '9px 22px', borderRadius: 8,
              border: '1px solid #ddd', background: '#f5f5f5',
              cursor: 'pointer', fontSize: 14
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (!tieuDe.trim()) { alert('Vui lòng nhập tiêu đề'); return; }
              onSubmit({ tieuDe: tieuDe.trim(), noiDung: noiDung.trim(), anhTieuDe: anhTieuDe.trim() });
            }}
            disabled={submitting}
            style={{
              padding: '9px 22px', borderRadius: 8,
              border: 'none',
              background: submitting ? '#aaa' : '#2c7be5',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600
            }}
          >
            {submitting ? 'Đang lưu...' : (initial ? 'Lưu thay đổi' : 'Tạo bài viết')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================== MAIN COMPONENT ========================
const ArtistArticles: React.FC = () => {
  const [articles, setArticles] = useState<BaiVietResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BaiVietResponse | null>(null);

  // Preview
  const [previewArticle, setPreviewArticle] = useState<BaiVietResponse | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  // ===================== LOAD =====================
  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await artistDashboardService.getBaiVietCuaToi();
      setArticles(data);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
      alert('Không thể tải danh sách bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ===================== CREATE =====================
  const handleCreate = async (data: { tieuDe: string; noiDung: string; anhTieuDe: string }) => {
    setSubmitting(true);
    try {
      await artistDashboardService.taoBaiViet(data);
      alert('Tạo bài viết thành công! Bài đang ở trạng thái Nháp.');
      setShowForm(false);
      loadArticles();
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error);
      alert('Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== UPDATE =====================
  const handleUpdate = async (data: { tieuDe: string; noiDung: string; anhTieuDe: string }) => {
    if (!editingArticle) return;
    setSubmitting(true);
    try {
      await artistDashboardService.capNhatBaiViet(editingArticle.maBaiViet, data);
      alert('Cập nhật bài viết thành công!');
      setEditingArticle(null);
      loadArticles();
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== DELETE =====================
  const handleDelete = async (item: BaiVietResponse) => {
    if (!window.confirm(`Xóa bài viết "${item.tieuDe}"? Hành động này không thể hoàn tác!`)) return;
    try {
      await artistDashboardService.xoaBaiViet(item.maBaiViet);
      alert('Đã xóa bài viết!');
      loadArticles();
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      alert('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  // ===================== GỬI DUYỆT =====================
  const handleGuiDuyet = async (item: BaiVietResponse) => {
    if (!window.confirm(`Gửi bài viết "${item.tieuDe}" để Admin duyệt?`)) return;
    try {
      await artistDashboardService.guiDuyetBaiViet(item.maBaiViet);
      alert('Đã gửi bài viết để duyệt! Admin sẽ xem xét sớm nhất.');
      loadArticles();
    } catch (error) {
      console.error('Lỗi khi gửi duyệt:', error);
      alert('Có lỗi xảy ra khi gửi duyệt');
    }
  };

  // ===================== STATS =====================
  const draftCount     = articles.filter(a => a.trangThai === 0).length;
  const pendingCount   = articles.filter(a => a.trangThai === 1).length;
  const approvedCount  = articles.filter(a => a.trangThai === 2).length;
  const rejectedCount  = articles.filter(a => a.trangThai === 3).length;

  return (
    <div id="artist-articles" className="page">
      {/* Form tạo/sửa bài viết */}
      {(showForm || editingArticle) && (
        <BaiVietForm
          initial={editingArticle}
          onSubmit={editingArticle ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingArticle(null); }}
          submitting={submitting}
        />
      )}

      {/* Preview bài viết */}
      {previewArticle && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 32,
            maxWidth: 700, width: '90%', maxHeight: '80vh',
            overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ marginTop: 0, color: '#1a1a2e' }}>{previewArticle.tieuDe}</h2>
              <button onClick={() => setPreviewArticle(null)} style={{
                background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999'
              }}>✕</button>
            </div>
            <p style={{ color: '#888', fontSize: 13 }}>
              Ngày đăng: {new Date(previewArticle.ngayDang).toLocaleDateString('vi-VN')}
            </p>
            {previewArticle.anhTieuDe && (
              <img 
                src={previewArticle.anhTieuDe} 
                alt={previewArticle.tieuDe} 
                style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', margin: '15px 0' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <hr />
            <div style={{ lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap' }}>
              {previewArticle.noiDung || <em style={{ color: '#aaa' }}>Chưa có nội dung</em>}
            </div>
            {previewArticle.lyDo && (
              <div style={{
                marginTop: 20, padding: '12px 16px', background: '#fce4ec',
                borderRadius: 8, borderLeft: '4px solid #e74c3c'
              }}>
                <strong style={{ color: '#e74c3c' }}>Lý do từ chối:</strong>
                <p style={{ margin: '4px 0 0', color: '#555' }}>{previewArticle.lyDo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h4><i className="ti-write"></i> Bài viết của tôi</h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-refresh"
            onClick={loadArticles}
            disabled={loading}
          >
            <i className="ti-reload"></i> Làm mới
          </button>
          <button
            className="add-btn"
            onClick={() => { setEditingArticle(null); setShowForm(true); }}
            style={{ margin: 0 }}
          >
            <i className="ti-plus"></i> Viết bài mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          📝 Nháp: <strong>{draftCount}</strong>
        </div>
        <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          ⏳ Chờ duyệt: <strong>{pendingCount}</strong>
        </div>
        <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          ✅ Đã duyệt: <strong>{approvedCount}</strong>
        </div>
        <div style={{ background: '#fce4ec', border: '1px solid #e91e63', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>
          ❌ Từ chối: <strong>{rejectedCount}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
          <i className="ti-write" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}></i>
          <p style={{ fontSize: 16 }}>Bạn chưa có bài viết nào.</p>
          <button className="add-btn" onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
            Viết bài đầu tiên
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th style={{ width: '35%', textAlign: 'left', paddingLeft: 16 }}>Tiêu đề</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item) => {
                const { text, cls } = trangThaiLabel(item.trangThai);
                const isDraft    = item.trangThai === 0;
                const isRejected = item.trangThai === 3;
                const canEdit    = item.trangThai === 0 || item.trangThai === 3; // chỉ sửa khi nháp hoặc bị từ chối

                return (
                  <tr key={item.maBaiViet}>
                    <td style={{ textAlign: 'left', paddingLeft: 16 }}>
                      <button
                        onClick={() => setPreviewArticle(item)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#1565c0', fontWeight: 600, textAlign: 'left',
                          padding: 0, fontSize: 14
                        }}
                        title="Xem trước bài viết"
                      >
                        {item.tieuDe}
                      </button>
                    </td>
                    <td>{new Date(item.ngayDang).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`status ${cls}`}>{text}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#e74c3c', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isRejected && item.lyDo ? item.lyDo : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Xem trước */}
                        <button
                          onClick={() => setPreviewArticle(item)}
                          title="Xem trước"
                          style={{
                            background: 'none', border: '1px solid #aaa',
                            borderRadius: 6, padding: '4px 10px',
                            cursor: 'pointer', fontSize: 13, color: '#555'
                          }}
                        >
                          <i className="ti-eye"></i>
                        </button>

                        {/* Sửa — chỉ khi nháp hoặc bị từ chối */}
                        {canEdit && (
                          <button
                            onClick={() => { setEditingArticle(item); setShowForm(false); }}
                            className="btn-edit"
                            title="Chỉnh sửa"
                          >
                            <i className="ti-pencil"></i>
                          </button>
                        )}

                        {/* Gửi duyệt — chỉ khi nháp hoặc bị từ chối */}
                        {(isDraft || isRejected) && (
                          <button
                            onClick={() => handleGuiDuyet(item)}
                            title="Gửi duyệt"
                            style={{
                              background: '#e3f2fd', border: '1px solid #1565c0',
                              borderRadius: 6, padding: '4px 10px',
                              cursor: 'pointer', fontSize: 13, color: '#1565c0',
                              fontWeight: 600
                            }}
                          >
                            <i className="ti-upload"></i> Gửi duyệt
                          </button>
                        )}

                        {/* Xóa */}
                        <button
                          onClick={() => handleDelete(item)}
                          className="btn-delete"
                          title="Xóa bài viết"
                        >
                          <i className="ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArtistArticles;
