import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Admin.css';

const AdminLayout: React.FC = () => {
    const { logout, user, isAdmin, isAuthor } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect users đúng layout
    useEffect(() => {
        // Author không nên ở /admin → đẩy về /artist
        if (isAuthor && location.pathname.startsWith('/admin')) {
            navigate('/artist', { replace: true });
            return;
        }
        // User thường hoặc chưa đăng nhập → về login
        if (!user || (user.role !== 'admin' && user.role !== 'author')) {
            navigate('/login');
        }
    }, [isAuthor, location.pathname, navigate, user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-wrapper">
            <div className="sidebar">
                <h2><i className="ti-palette"></i> ART GALLERY</h2>
                <ul>
                    {isAdmin && (
                        <NavLink to="/admin" end>
                            <li className={location.pathname === '/admin' ? 'active' : ''}>
                                <i className="ti-home"></i> Trang chủ
                            </li>
                        </NavLink>
                    )}

                    {/* Chỉ Admin mới thấy Quản lý Đơn hàng và Khách hàng */}
                    {isAdmin && (
                        <>
                            <NavLink to="/admin/orders">
                                <li className={location.pathname === '/admin/orders' ? 'active' : ''}>
                                    <i className="ti-shopping-cart"></i> Đơn hàng
                                </li>
                            </NavLink>
                            <NavLink to="/admin/customers">
                                <li className={location.pathname === '/admin/customers' ? 'active' : ''}>
                                    <i className="ti-user"></i> Khách hàng
                                </li>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/admin/art">
                        <li className={location.pathname === '/admin/art' ? 'active' : ''}>
                            <i className="ti-image"></i> Tác phẩm
                        </li>
                    </NavLink>

                    <NavLink to="/admin/content">
                        <li className={location.pathname === '/admin/content' ? 'active' : ''}>
                            <i className="ti-write"></i> Nội dung
                        </li>
                    </NavLink>

                    <NavLink to="/admin/artwork-details">
                        <li className={location.pathname === '/admin/artwork-details' ? 'active' : ''}>
                            <i className="ti-write"></i> Chi Tiết Tác Phẩm
                        </li>
                    </NavLink>

                    {isAdmin && (
                        <>
                            <NavLink to="/admin/authors">
                                <li className={location.pathname === '/admin/authors' ? 'active' : ''}>
                                    <i className="ti-user"></i> Quản lý Tác giả
                                </li>
                            </NavLink>
                            <NavLink to="/admin/report">
                                <li className={location.pathname === '/admin/report' ? 'active' : ''}>
                                    <i className="ti-bar-chart"></i> Báo cáo
                                </li>
                            </NavLink>
                        </>
                    )}

                    {isAdmin && (
                        <NavLink to="/admin/settings">
                            <li className={location.pathname === '/admin/settings' ? 'active' : ''}>
                                <i className="ti-settings"></i> Thiết lập
                            </li>
                        </NavLink>
                    )}

                    {isAdmin && (
                        <NavLink to="/admin/profile">
                            <li className={location.pathname === '/admin/profile' ? 'active' : ''}>
                                <i className="ti-id-badge"></i> Hồ sơ
                            </li>
                        </NavLink>
                    )}
                    
                    <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <li className="sidebar-link">
                            <i className="ti-world"></i> Về Trang Chủ
                        </li>
                    </a>
                    <li className="logout-btn" onClick={handleLogout}>
                        <i className="ti-power-off"></i> Đăng xuất
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
                        <i className="ti-user"></i> <span>{user?.name || 'User'}</span>
                    </div>
                </div>

                {/* Khu vực hiển thị component con */}
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
