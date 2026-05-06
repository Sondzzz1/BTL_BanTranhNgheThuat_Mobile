import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Admin.css';

const AdminProfile: React.FC = () => {
    const { user } = useAuth();

    return (
        <div id="profile" className="page">
            <div className="header">
                <h4><i className="ti-id-badge"></i> Hồ sơ người dùng</h4>
            </div>
            
            <div className="block" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center' }}>
                    <img src={user?.avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"} 
                         alt="Avatar" 
                         style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #2c7be5' }} />
                    <button className="add-btn" style={{ marginTop: '15px', width: '100%' }}>Đổi ảnh đại diện</button>
                </div>
                
                <div style={{ flex: 1 }}>
                    <form className="form-grid">
                        <div className="form-group">
                            <label>Họ và tên:</label>
                            <input type="text" defaultValue={user?.name || ""} />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input type="email" defaultValue={user?.email || ""} disabled />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại:</label>
                            <input type="text" defaultValue={user?.phone || "Chưa cập nhật"} />
                        </div>
                        <div className="form-group">
                            <label>Vai trò:</label>
                            <input type="text" defaultValue={user?.role === 'admin' ? 'Quản trị viên' : 'Họa sĩ'} disabled />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Tiểu sử / Giới thiệu:</label>
                            <textarea rows={5} defaultValue="Thông tin cá nhân và tiểu sử nghệ thuật của bạn."></textarea>
                        </div>
                    </form>
                    <button className="add-btn" style={{ marginTop: '20px' }}>Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
