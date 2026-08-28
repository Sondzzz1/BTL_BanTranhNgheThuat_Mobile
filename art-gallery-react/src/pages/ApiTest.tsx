// API Test Page - Kiểm tra kết nối với Backend
import React, { useState } from 'react';
import { artworkService } from '../services/artworkService';
import '../assets/css/ApiTest.css';

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Chưa kiểm tra');
  const [loading, setLoading] = useState<boolean>(false);
  const [artworkCount, setArtworkCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setStatus('Đang kiểm tra...');

    try {
      const artworks = await artworkService.getAllArtworks();
      setArtworkCount(artworks.length);
      setStatus('✅ Kết nối thành công!');
      console.log('Artworks:', artworks);
    } catch (err: any) {
      setStatus('❌ Kết nối thất bại');
      setError(err.message || 'Không thể kết nối đến API');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-test-page">
      <div className="api-test-container">
        <h1>🔧 Kiểm tra Kết nối API</h1>
        
        <div className="test-info">
          <h3>Thông tin Backend:</h3>
          <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5273/api'}</p>
          <p><strong>Endpoint kiểm tra:</strong> /tranh</p>
        </div>

        <button 
          onClick={testConnection} 
          disabled={loading}
          className="test-button"
        >
          {loading ? 'Đang kiểm tra...' : 'Kiểm tra Kết nối'}
        </button>

        <div className={`status-box ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : ''}`}>
          <h3>Trạng thái:</h3>
          <p className="status-text">{status}</p>
          
          {artworkCount > 0 && (
            <p className="artwork-count">
              📊 Đã tìm thấy <strong>{artworkCount}</strong> tranh trong database
            </p>
          )}
          
          {error && (
            <div className="error-details">
              <h4>Chi tiết lỗi:</h4>
              <pre>{error}</pre>
            </div>
          )}
        </div>

        <div className="instructions">
          <h3>📋 Hướng dẫn:</h3>
          <ol>
            <li>Đảm bảo backend đang chạy tại <code>http://localhost:5273</code></li>
            <li>Kiểm tra database đã có dữ liệu chưa</li>
            <li>Mở DevTools (F12) → Console để xem log chi tiết</li>
            <li>Nếu lỗi CORS, kiểm tra cấu hình CORS trong backend</li>
          </ol>
        </div>

        <div className="quick-links">
          <h3>🔗 Quick Links:</h3>
          <a href="http://localhost:5273/swagger" target="_blank" rel="noopener noreferrer">
            Swagger UI
          </a>
          <a href="http://localhost:5273/api/tranh" target="_blank" rel="noopener noreferrer">
            Test API Direct
          </a>
          <a href="/">Về Trang Chủ</a>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
