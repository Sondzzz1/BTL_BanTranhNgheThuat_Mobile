// Artist Layout - Layout cho trang họa sĩ (Giống Admin)
import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../Admin/Admin.css'; // Dùng chung CSS với Admin

const ArtistLayout: React.FC = () => {
  const { user, logout, isAuthor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect nếu không phải artist
  useEffect(() => {
    if (!user || !isAuthor) {
      navigate('/login');
    }
  }, [user, isAuthor, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || !isAuthor) {
    return null;
  }

  return (
    <div className="admin-wrapper">
      <div className="sidebar">
        <h2><i className="ti-palette"></i> HỌA SĨ</h2>
        <ul>
          <NavLink to="/artist" end>
            <li className={location.pathname === '/artist' ? 'active' : ''}>
              <i className="ti-dashboard"></i> Bảng điều khiển
            </li>
          </NavLink>

          <NavLink to="/artist/profile">
            <li className={location.pathname === '/artist/profile' ? 'active' : ''}>
              <i className="ti-user"></i> Hồ Sơ
            </li>
          </NavLink>

          <NavLink to="/artist/artworks">
            <li className={location.pathname === '/artist/artworks' ? 'active' : ''}>
              <i className="ti-image"></i> Tác Phẩm
            </li>
          </NavLink>

          <NavLink to="/artist/artworks/deleted">
            <li className={location.pathname === '/artist/artworks/deleted' ? 'active' : ''}>
              <i className="ti-trash"></i> Tác Phẩm Đã Xóa
            </li>
          </NavLink>

          <NavLink to="/artist/articles">
            <li className={location.pathname === '/artist/articles' ? 'active' : ''}>
              <i className="ti-write"></i> Bài Viết
            </li>
          </NavLink>

          <NavLink to="/artist/revenue">
            <li className={location.pathname === '/artist/revenue' ? 'active' : ''}>
              <i className="ti-money"></i> Doanh Thu
            </li>
          </NavLink>

          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <li className="sidebar-link">
              <i className="ti-world"></i> Về Trang Chủ
            </li>
          </a>

          <li className="logout-btn" onClick={handleLogout}>
            <i className="ti-power-off"></i> Đăng Xuất
          </li>
        </ul>
      </div>

      <div className="content">
        <div className="topbar">
          <div className="left">
            <i className="ti-menu"></i>
            <input type="text" placeholder="Tìm kiếm..." className="search-box" />
          </div>
          <div className="right">
            <i className="ti-bell"></i>
            <i className="ti-user"></i> <span>{user?.name || 'Họa sĩ'}</span>
          </div>
        </div>

        {/* Khu vực hiển thị component con */}
        <Outlet />
      </div>
    </div>
  );
};

export default ArtistLayout;
