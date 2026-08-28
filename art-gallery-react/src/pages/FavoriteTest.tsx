import React, { useState } from 'react';
import apiClient from '../services/api';

const FavoriteTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      
      const response = await apiClient.get('/yeuthich/test');
      setResult(response.data);
      console.log('Test response:', response.data);
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetFavorites = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiClient.get('/yeuthich');
      setResult(response.data);
      console.log('Favorites:', response.data);
    } catch (err: any) {
      console.error('Get favorites error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testAddFavorite = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Test với artwork ID 1
      const response = await apiClient.post('/yeuthich/1', {});
      setResult(response.data);
      console.log('Add favorite:', response.data);
    } catch (err: any) {
      console.error('Add favorite error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Test Yêu Thích API</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAuth}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Auth
        </button>
        
        <button 
          onClick={testGetFavorites}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Get Favorites
        </button>
        
        <button 
          onClick={testAddFavorite}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Favorite (ID: 1)
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{ 
          padding: '15px', 
          background: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          padding: '15px', 
          background: '#e8f5e9', 
          color: '#2e7d32',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <strong>Result:</strong>
          <pre style={{ 
            marginTop: '10px', 
            background: 'white', 
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <h3>Hướng dẫn:</h3>
        <ol>
          <li>Đăng nhập trước khi test</li>
          <li>Click "Test Auth" để kiểm tra token và claims</li>
          <li>Click "Get Favorites" để lấy danh sách yêu thích</li>
          <li>Click "Add Favorite" để thêm tác phẩm ID 1 vào yêu thích</li>
          <li>Mở Console (F12) để xem logs chi tiết</li>
        </ol>
      </div>
    </div>
  );
};

export default FavoriteTest;
