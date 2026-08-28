import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/api';
import './Admin.css';

interface AdminInfo {
    maTaiKhoan: number;
    tenDangNhap: string;
    vaiTro: number;
    vaiTroText: string;
}

const AdminProfile: React.FC = () => {
    const { user, changePassword } = useAuth();
    const [info, setInfo] = useState<AdminInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Đổi mật khẩu
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwSubmitting, setPwSubmitting] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    useEffect(() => {
        loadInfo();
    }, []);

    const loadInfo = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<AdminInfo>('/admin/profile');
            setInfo(res.data);
        } catch (error) {
            console.error('Lỗi tải hồ sơ admin:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPwForm({ ...pwForm, [e.target.name]: e.target.value });
        setPwError('');
        setPwSuccess('');
    };

    const handlePwSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (!pwForm.current) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
        if (pwForm.next.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
        if (pwForm.current === pwForm.next) { setPwError('Mật khẩu mới không được trùng mật khẩu cũ'); return; }

        setPwSubmitting(true);
        try {
            const res = await changePassword(pwForm.current, pwForm.next);
            if (res.success) {
                setPwSuccess(res.message || 'Đổi mật khẩu thành công');
                setPwForm({ current: '', next: '', confirm: '' });
            } else {
                setPwError(res.message || 'Đổi mật khẩu thất bại');
            }
        } catch (err: any) {
            setPwError(err?.message || 'Có lỗi xảy ra');
        } finally {
            setPwSubmitting(false);
        }
    };

    return (
        <div id="profile" className="page">
            <div className="header">
                <h4><i className="ti-id-badge"></i> Hồ sơ quản trị viên</h4>
            </div>

            {loading ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Đang tải...</div>
            ) : (
                <div className="block" style={{ display: 'flex', gap: 30, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: 180 }}>
                        <div style={{
                            width: 150, height: 150, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#2c7be5,#0a58ca)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', fontWeight: 700, margin: '0 auto'
                        }}>
                            {(info?.tenDangNhap || user?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <h3 style={{ marginTop: 12 }}>{info?.tenDangNhap || user?.name}</h3>
                        <span className="status status-success">{info?.vaiTroText || 'Admin'}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 320 }}>
                        <h3 style={{ marginBottom: 16 }}>Thông tin tài khoản</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Mã tài khoản</label>
                                <input type="text" value={info?.maTaiKhoan ?? ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Tên đăng nhập</label>
                                <input type="text" value={info?.tenDangNhap ?? ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>Vai trò</label>
                                <input type="text" value={info?.vaiTroText ?? 'Admin'} disabled />
                            </div>
                        </div>

                        <hr style={{ margin: '24px 0' }} />

                        <h3 style={{ marginBottom: 16 }}>Đổi mật khẩu</h3>
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
                        <form onSubmit={handlePwSubmit} className="form-grid">
                            <div className="form-group">
                                <label>Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    name="current"
                                    value={pwForm.current}
                                    onChange={handlePwChange}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="next"
                                    value={pwForm.next}
                                    onChange={handlePwChange}
                                    minLength={6}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="confirm"
                                    value={pwForm.confirm}
                                    onChange={handlePwChange}
                                    minLength={6}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <button type="submit" className="add-btn" disabled={pwSubmitting}>
                                    {pwSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
