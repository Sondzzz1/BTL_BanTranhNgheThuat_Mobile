import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './ChangePassword.css';

const ChangePassword: React.FC = () => {
  const { isAuthenticated, changePassword } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu cũ');
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      if (result.success) {
        setSuccess(result.message || 'Đổi mật khẩu thành công');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => navigate('/user'), 1500);
      } else {
        setError(result.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="change-password-page">
      <div className="change-password-container">
        <div className="change-password-card">
          <h2>Đổi Mật Khẩu</h2>

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div
              className="error-message"
              style={{ background: '#e8f5e9', color: '#2e7d32', borderLeftColor: '#2e7d32' }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Mật khẩu hiện tại <span className="required">*</span></label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới <span className="required">*</span></label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới <span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/user')}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button type="submit" className="btn-save" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
