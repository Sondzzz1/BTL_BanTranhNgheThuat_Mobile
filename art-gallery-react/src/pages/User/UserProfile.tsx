// User Profile - Quản lý tài khoản người dùng
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/customerService';

const UserProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user?.id) {
        await customerService.capNhatThongTin({
          ten: formData.name,
          email: formData.email,
          dienThoai: formData.phone,
          diaChi: formData.address,
        });
        
        // Update local user state
        setUser({
          ...user,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        });
        
        setIsEditing(false);
        alert('Cập nhật thông tin thành công!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    // TODO: Call API to change password
    console.log('Change password');
    alert('Đổi mật khẩu thành công!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordForm(false);
  };

  return (
    <div className="user-profile">
      <h1>Thông Tin Tài Khoản</h1>

      <div className="profile-card">
        <div className="card-header">
          <h2>Thông Tin Cá Nhân</h2>
          <button
            className="btn-edit"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-info-section">
            <h3 className="section-title">Hồ Sơ Của Tôi</h3>
            <div className="form-group">
              <label>Họ Tên</label>
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
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                title="Email không thể thay đổi"
              />
            </div>
          </div>

          <div className="profile-info-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <h3 className="section-title">Địa Chỉ Của Tôi</h3>
            <div className="form-group">
              <label>Số Điện Thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Địa Chỉ Giao Hàng</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-save">
                Lưu Thay Đổi
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="profile-card">
        <div className="card-header">
          <h2>Đổi Mật Khẩu</h2>
          <button
            className="btn-edit"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Hủy' : 'Đổi Mật Khẩu'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Mật Khẩu Hiện Tại</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật Khẩu Mới</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Xác Nhận Mật Khẩu Mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-save">
              Đổi Mật Khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
