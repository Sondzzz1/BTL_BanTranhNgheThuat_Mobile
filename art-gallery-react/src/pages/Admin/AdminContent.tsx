import React, { useState, useEffect } from 'react';
import { contentService, BaiVietResponse, NoiDungResponse } from '../../services/contentService';
import './Admin.css';

const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'artwork-details'>('articles');
  const [articles, setArticles] = useState<BaiVietResponse[]>([]);
  const [artworkDetails, setArtworkDetails] = useState<NoiDungResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles();
    } else {
      loadArtworkDetails();
    }
  }, [activeTab]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await contentService.layTatCaBaiViet();
      setArticles(data);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
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
      console.error('Lỗi khi tải chi tiết tác phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArticle = async (id: number, approve: boolean) => {
    try {
      await contentService.pheDuyetBaiViet(id, approve);
      alert(approve ? 'Đã duyệt bài viết!' : 'Đã từ chối bài viết!');
      loadArticles();
    } catch (error) {
      console.error('Lỗi khi duyệt bài viết:', error);
    }
  };

  return (
    <div id="content" className="page">
      <div className="page-header">
        <h4><i className="ti-write"></i> Quản lý Nội dung</h4>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            Bài viết hệ thống
          </button>
          <button 
            className={`tab-btn ${activeTab === 'artwork-details' ? 'active' : ''}`}
            onClick={() => setActiveTab('artwork-details')}
          >
            Chi tiết tác phẩm
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
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
              {articles.map((item) => (
                <tr key={item.maBaiViet}>
                  <td><strong>{item.tieuDe}</strong></td>
                  <td>{item.tenHoaSi}</td>
                  <td>{new Date(item.ngayDang).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status ${item.trangThai ? 'status-success' : 'status-pending'}`}>
                      {item.trangThai ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    {!item.trangThai && (
                      <button 
                        onClick={() => handleApproveArticle(item.maBaiViet, true)}
                        className="btn-approve"
                        title="Duyệt"
                      >
                        <i className="ti-check"></i>
                      </button>
                    )}
                    <button 
                      onClick={() => {}} 
                      className="btn-delete"
                      title="Xóa"
                    >
                      <i className="ti-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Tên tác phẩm</th>
                <th>Loại nội dung</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {artworkDetails.map((item) => (
                <tr key={item.maNoiDung}>
                  <td>Tác phẩm #{item.maNoiDung}</td>
                  <td>{item.loai}</td>
                  <td>{item.tieuDe}</td>
                  <td>
                    <span className={`status ${item.trangThai ? 'status-success' : 'status-pending'}`}>
                      {item.trangThai ? 'Công khai' : 'Nháp'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" title="Sửa"><i className="ti-pencil"></i></button>
                    <button className="btn-delete" title="Xóa"><i className="ti-trash"></i></button>
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
