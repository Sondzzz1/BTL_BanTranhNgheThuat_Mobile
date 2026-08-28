// User Profile - Quản lý tài khoản người dùng
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/customerService';

const UserProfile: React.FC = () => {
  const { user, setUser, changePassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Đổi mật khẩu
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setSubmitError('');
    try {
      const data = await customerService.getThongTin();
      const next = {
        name: data.hoTen || '',
        email: data.email || user?.email || '',
        phone: data.soDienThoai || '',
        address: data.diaChi || '',
      };
      setFormData(next);

      // Đồng bộ vào context để các trang khác dùng (Checkout etc.)
      if (user) {
        setUser({ ...user, name: next.name, phone: next.phone, address: next.address });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setSubmitError('Không thể tải hồ sơ từ server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubmitError('');
    setSuccessMsg('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPwError('');
    setPwSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setSubmitError('Vui lòng nhập họ tên');
      return;
    }
    if (formData.phone && !/^[0-9]{9,11}$/.test(formData.phone.trim())) {
      setSubmitError('Số điện thoại không hợp lệ (9-11 chữ số)');
      return;
    }

    try {
      await customerService.capNhatThongTin({
        ten: formData.name.trim(),
        email: formData.email.trim() || undefined,
        dienThoai: formData.phone.trim() || undefined,
        diaChi: formData.address.trim() || undefined,
      });

      if (user) {
        setUser({
          ...user,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        });
      }

      setIsEditing(false);
      setSuccessMsg('Cập nhật thông tin thành công.');
    } catch (error: any) {
      setSubmitError(error?.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!passwordData.currentPassword) {
      setPwError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPwError('Mật khẩu mới không được trùng mật khẩu cũ');
      return;
    }

    setPwSubmitting(true);
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setPwSuccess(result.message || 'Đổi mật khẩu thành công');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        setPwError(result.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      setPwError(err?.message || 'Có lỗi xảy ra');
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: 40, textAlign: 'center' }}>Đang tải hồ sơ...</div>;
  }

  return (
    <div className="user-profile">
      <h1>Thông Tin Tài Khoản</h1>

      <div className="profile-card">
        <div className="card-header">
          <h2>Thông Tin Cá Nhân</h2>
          <button className="btn-edit" onClick={() => { setIsEditing(!isEditing); setSubmitError(''); setSuccessMsg(''); }}>
            {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
          </button>
        </div>

        {submitError && (
          <div style={{ background: '#fee', color: '#c0392b', padding: 10, borderRadius: 6, marginBottom: 12 }}>
            {submitError}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 10, borderRadius: 6, marginBottom: 12 }}>
            {successMsg}
          </div>
        )}

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
                onChange={handleChange}
                disabled={!isEditing}
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
              <button type="submit" className="btn-save">Lưu Thay Đổi</button>
            </div>
          )}
        </form>
      </div>

      <div className="profile-card">
        <div className="card-header">
          <h2>Đổi Mật Khẩu</h2>
          <button
            className="btn-edit"
            onClick={() => { setShowPasswordForm(!showPasswordForm); setPwError(''); setPwSuccess(''); }}
          >
            {showPasswordForm ? 'Hủy' : 'Đổi Mật Khẩu'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit}>
            {pwError && (
              <div style={{ background: '#fee', color: '#c0392b', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                {pwSuccess}
              </div>
            )}

            <div className="form-group">
              <label>Mật Khẩu Hiện Tại</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                autoComplete="current-password"
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
                autoComplete="new-password"
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
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-save" disabled={pwSubmitting}>
              {pwSubmitting ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
