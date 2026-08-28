// Login Page - Xử lý Form trong React
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Register.css'; // Sử dụng chung file css của trang đăng kí

const Login: React.FC = () => {
  // State cho form inputs (dùng "username" làm tên field, có thể là email hoặc username)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Event Handler - Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
    setSubmitError('');
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập hoặc email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Event Handler - Xử lý submit form
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      const success = await login(formData.username.trim(), formData.password);

      if (success) {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'author') {
          navigate('/artist');
        } else {
          navigate('/');
        }
      } else {
        setSubmitError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setSubmitError(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="register-section">
      <div className="register-container">
        <h2>Đăng nhập tài khoản</h2>
        <p>Nếu bạn chưa có tài khoản, <Link to="/register">đăng ký TẠI ĐÂY!</Link></p>

        <form onSubmit={handleSubmit} className="register-form">
          {submitError && (
            <div style={{
              background: '#fee', color: '#c0392b', padding: '10px 12px',
              borderRadius: '6px', marginBottom: '15px', fontSize: '14px',
              borderLeft: '4px solid #e74c3c', textAlign: 'left'
            }}>
              {submitError}
            </div>
          )}

          <label htmlFor="username">Tên đăng nhập hoặc Email</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Tên đăng nhập hoặc email*"
            className={errors.username ? 'error' : ''}
            autoComplete="username"
          />
          {errors.username && <span style={{ color: 'red', fontSize: '13px', display: 'block', textAlign: 'left', marginBottom: '10px', marginTop: '-10px' }}>{errors.username}</span>}

          <label htmlFor="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mật khẩu*"
            className={errors.password ? 'error' : ''}
            autoComplete="current-password"
          />
          {errors.password && <span style={{ color: 'red', fontSize: '13px', display: 'block', textAlign: 'left', marginBottom: '10px', marginTop: '-10px' }}>{errors.password}</span>}

          <button
            type="submit"
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#333' }}>📋 Tài khoản demo:</p>
          <p style={{ margin: '5px 0' }}><strong>Admin:</strong> admin | 123456</p>
          <p style={{ margin: '5px 0' }}><strong>Họa sĩ:</strong> artist | 123456</p>
          <p style={{ margin: '5px 0' }}><strong>User:</strong> user | 123456</p>
        </div>
      </div>
    </section>
  );
};

export default Login;
