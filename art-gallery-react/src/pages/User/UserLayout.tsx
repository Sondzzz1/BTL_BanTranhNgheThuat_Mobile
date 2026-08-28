// User Layout - Layout cho trang người dùng
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './User.css';

const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect nếu chưa đăng nhập
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-layout">
      <Header />
      <div className="user-container">
        <aside className="user-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>

          <nav className="user-nav">
            <Link to="/user/profile" className="nav-item">
              <i className="ti-user"></i>
              <span>Tài Khoản</span>
            </Link>
            <Link to="/user/orders" className="nav-item">
              <i className="ti-shopping-cart"></i>
              <span>Đơn Hàng</span>
            </Link>
            <Link to="/user/favorites" className="nav-item">
              <i className="ti-heart"></i>
              <span>Yêu Thích</span>
            </Link>
            <Link to="/cart" className="nav-item">
              <i className="ti-bag"></i>
              <span>Giỏ Hàng</span>
            </Link>
            <Link to="/" className="nav-item">
              <i className="ti-home"></i>
              <span>Trang Chủ</span>
            </Link>
            <button onClick={handleLogout} className="nav-item logout-btn">
              <i className="ti-power-off"></i>
              <span>Đăng Xuất</span>
            </button>
          </nav>
        </aside>

        <main className="user-main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default UserLayout;
