// Artist Profile - Quản lý hồ sơ họa sĩ
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { artistDashboardService, HoSoHoaSiResponse } from '../../services/artistDashboardService';
import { formatVnd } from '../../utils/currency';

interface ProfileData {
  name: string;
  bio: string;
  avatarUrl: string;
}

const ArtistProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileInfo, setProfileInfo] = useState<HoSoHoaSiResponse | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    bio: '',
    avatarUrl: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await artistDashboardService.getHoSo();
      setProfileInfo(data);
      setFormData({
        name: data.tenHoaSi || '',
        bio: data.tieuSu || '',
        avatarUrl: data.anhDaiDien || ''
      });
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await artistDashboardService.capNhatHoSo({
        tenHoaSi: formData.name,
        tieuSu: formData.bio
      });
      // Nếu có upload avatar mới (URL mới), có thể gọi uploadAvatar riêng
      if (formData.avatarUrl && formData.avatarUrl !== profileInfo?.anhDaiDien) {
        await artistDashboardService.uploadAvatar(formData.avatarUrl);
      }
      setIsEditing(false);
      alert('Cập nhật hồ sơ thành công!');
      loadProfile(); // reload data
    } catch (error: any) {
      alert(error.message || 'Lỗi cập nhật hồ sơ');
    }
  };

  if (loading) return <div className="page" style={{ padding: '20px' }}>Đang tải thông tin...</div>;

  return (
    <div id="profile" className="page">
      <div className="page-header">
        <h4><i className="ti-user"></i> Hồ Sơ Cá Nhân</h4>
        <button 
          className={isEditing ? 'btn-cancel' : 'add-btn'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #eee' }}>
          {profileInfo?.anhDaiDien ? (
             <img src={profileInfo.anhDaiDien} alt="Avatar" style={{
                width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginRight: '20px'
             }} />
          ) : (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginRight: '20px'
            }}>
              {formData.name.charAt(0).toUpperCase() || 'H'}
            </div>
          )}
          
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>{formData.name}</h2>
            <p style={{ margin: '0', color: '#666' }}>
              <i className="ti-palette"></i> Họa sĩ
            </p>
            <div style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
               <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '5px', fontSize: '13px' }}>
                 Tác phẩm: <strong>{profileInfo?.soTacPham || 0}</strong>
               </span>
               <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '5px', fontSize: '13px' }}>
                 Tổng doanh thu: <strong>{formatVnd(profileInfo?.tongDoanhThu)}</strong>
               </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Thông Tin Cơ Bản</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Tên Họa Sĩ: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL Ảnh Đại Diện:</label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Link ảnh (https://...)"
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Tiểu Sử</h3>
            <div className="form-group">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={6}
                placeholder="Viết về bản thân, phong cách nghệ thuật, kinh nghiệm..."
              />
            </div>
          </div>

          {isEditing && (
            <div className="modal-buttons">
              <button type="submit" className="btn-save">
                <i className="ti-check"></i> Lưu Thay Đổi
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                Hủy
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ArtistProfile;
