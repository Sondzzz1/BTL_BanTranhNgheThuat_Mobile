import React, { useState, useEffect } from 'react';
import { contentService, BaiVietResponse, NoiDungResponse } from '../../services/contentService';
import './Artist.css';

const ArtistArticles: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'artwork-details'>('articles');
  const [articles, setArticles] = useState<BaiVietResponse[]>([]);
  const [artworkDetails, setArtworkDetails] = useState<NoiDungResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'articles') {
        const data = await contentService.layTatCaBaiViet();
        setArticles(data); 
      } else {
        const data = await contentService.layTatCaChiTietTacPham();
        setArtworkDetails(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="content" className="page">
      <div className="page-header">
        <h4><i className="ti-write"></i> Quản lý Nội dung</h4>
        <div className="header-actions">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              Bài viết của tôi
            </button>
            <button 
              className={`tab-btn ${activeTab === 'artwork-details' ? 'active' : ''}`}
              onClick={() => setActiveTab('artwork-details')}
            >
              Chi tiết tác phẩm
            </button>
          </div>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <i className="ti-plus"></i> Thêm mới
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
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item) => (
                <tr key={item.maBaiViet}>
                  <td><strong>{item.tieuDe}</strong></td>
                  <td>{new Date(item.ngayDang).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status ${item.trangThai ? 'status-success' : 'status-pending'}`}>
                      {item.trangThai ? 'Đã duyệt' : 'Đang chờ'}
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
      ) : (
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Chi tiết tác phẩm</th>
                <th>Loại</th>
                <th>Ngày cập nhật</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {artworkDetails.map((item) => (
                <tr key={item.maNoiDung}>
                  <td>Mô tả Tác phẩm #{item.maNoiDung}</td>
                  <td>{item.loai}</td>
                  <td>Cập nhật gần đây</td>
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

export default ArtistArticles;
