import React, { useEffect, useState } from 'react';
import { customerService, ThongTinKhachHangResponse } from '../../services/customerService';
import { adminService } from '../../services/adminService';

const AdminCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<ThongTinKhachHangResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerService.getAllCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
            alert('Không thể tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async (c: ThongTinKhachHangResponse) => {
        const isActive = c.trangThai !== false;
        const msg = isActive
            ? `Khóa tài khoản của "${c.hoTen}"?`
            : `Mở khóa tài khoản của "${c.hoTen}"?`;
        if (!window.confirm(msg)) return;
        try {
            if (isActive) {
                await adminService.khoaKhachHang(c.id);
            } else {
                await adminService.moKhoaKhachHang(c.id);
            }
            await loadCustomers();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    const filtered = customers.filter((c) => {
        if (!keyword.trim()) return true;
        const k = keyword.toLowerCase();
        return (
            c.hoTen.toLowerCase().includes(k) ||
            (c.email || '').toLowerCase().includes(k) ||
            (c.soDienThoai || '').toLowerCase().includes(k)
        );
    });

    return (
        <div id="customers" className="page">
            <div className="page-header">
                <h4><i className="ti-user"></i> Quản lý Khách hàng</h4>
                <button className="btn-refresh" onClick={loadCustomers}>
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            <div className="filter-bar" style={{ marginTop: 15 }}>
                <div className="filter-item" style={{ flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <p>Không tìm thấy khách hàng nào.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Địa chỉ</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((customer) => {
                                const isActive = customer.trangThai !== false;
                                return (
                                    <tr key={customer.id}>
                                        <td>{customer.id}</td>
                                        <td><strong>{customer.hoTen}</strong></td>
                                        <td>{customer.soDienThoai || '-'}</td>
                                        <td>{customer.email || '-'}</td>
                                        <td>{customer.diaChi || 'Chưa cập nhật'}</td>
                                        <td>
                                            <span className={`status ${isActive ? 'success' : 'canceled'}`}>
                                                {isActive ? 'Hoạt động' : 'Đang khóa'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleLock(customer)}
                                                title={isActive ? 'Khóa' : 'Mở khóa'}
                                                style={{ color: isActive ? '#dc3545' : '#28a745' }}
                                            >
                                                <i className={isActive ? 'ti-lock' : 'ti-unlock'}></i>{' '}
                                                {isActive ? 'Khóa' : 'Mở khóa'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
