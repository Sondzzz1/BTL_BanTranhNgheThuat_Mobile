// Header Component với Props và Event Handling
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import SearchBox from './SearchBox';
import '../assets/css/Header.css';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Event Handler - Xử lý đăng xuất
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/');
    }
  };

  // Event Handler - Toggle menu mobile
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <div className="ontop">
        <span className="ontop1">
          <i className="ti-headphone-alt" style={{ marginRight: '5px' }}></i> CONTACT | 
          <i className="ti-time" style={{ margin: '0 5px 0 10px' }}></i> Thứ 2-CN: 08H00 - 21H00 | 
          <i className="ti-mobile" style={{ margin: '0 5px 0 10px' }}></i> 0948883535 - 0948863535
        </span>
      </div>
      <div id="main">
        <div id="header">
          <div className="logo">
            <Link to="/">
              <h1 style={{ color: '#ff7b00', margin: 0 }}>🎨 ART GALLERY</h1>
            </Link>
          </div>
          
          <div className="menu-toggle" onClick={toggleMenu}>
            ☰
          </div>

          <ul id="nav" className={menuOpen ? 'active' : ''}>
            <li>
              <NavLink to="/" end>TRANG CHỦ</NavLink>
            </li>
            <li>
              <NavLink to="/about">GIỚI THIỆU</NavLink>
            </li>
            <li>
              <NavLink to="/artworks">TÁC PHẨM</NavLink>
            </li>
            <li>
              <NavLink to="/news">TIN TỨC</NavLink>
            </li>
            <li>
              <NavLink to="/contact">LIÊN HỆ</NavLink>
            </li>

            <div className="header-icons">
              {/* Search Icon */}
              <SearchBox />
              
              {isAuthenticated ? (
                <div className="user-menu">
                  <Link to="/user" className="user-link">
                    👤 {user?.name}
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'author') && (
                    <Link 
                      to={user?.role === 'author' ? "/artist" : "/admin"} 
                      className="admin-link" 
                      title={user?.role === 'author' ? 'Trang Tác giả' : 'Trang Quản trị'}
                    >
                      ⚙️
                    </Link>
                  )}
                  <button onClick={handleLogout} className="logout-btn">
                    🚪 Đăng xuất
                  </button>
                </div>
              ) : (
                <Link to="/login" className="user-link">
                  👤 Đăng nhập
                </Link>
              )}

              <Link to="/cart" className="cart-link">
                <div className="cart">
                  🛒
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </div>
              </Link>
            </div>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Header;
