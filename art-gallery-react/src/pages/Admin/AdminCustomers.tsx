import React, { useState, useEffect } from 'react';
import { customerService, ThongTinKhachHangResponse } from '../../services/customerService';

const AdminCustomers: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customers, setCustomers] = useState<ThongTinKhachHangResponse[]>([]);
    const [loading, setLoading] = useState(false);

    // Load customers khi component mount
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div id="customers" className="page">
            <div className="customer-header">
                <h4><i className="ti-user"></i> Quản lý Khách hàng</h4>
                <div>
                    <button 
                        className="btn-refresh" 
                        onClick={loadCustomers}
                        style={{ marginRight: '10px', padding: '8px 15px' }}
                    >
                        <i className="ti-reload"></i> Làm mới
                    </button>
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                        <i className="ti-plus"></i> Thêm khách hàng
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Chưa có khách hàng nào.</p>
                </div>
            ) : (
                <table className="customer-table">
                    <thead>
                        <tr>
                            <th>Tên khách hàng</th>
                            <th>Số điện thoại</th>
                            <th>Email</th>
                            <th>Địa chỉ</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.hoTen}</td>
                                <td>{customer.soDienThoai || 'N/A'}</td>
                                <td>{customer.email || 'N/A'}</td>
                                <td>{customer.diaChi || 'Chưa cập nhật'}</td>
                                <td>
                                    <button className="edit-btn" title="Sửa">
                                        <i className="ti-pencil"></i>
                                    </button>
                                    <button className="delete-btn" title="Xóa">
                                        <i className="ti-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div id="customerModal" className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
                        <h3>Thêm Khách Hàng Mới</h3>
                        <form id="customerForm">
                            <label>Tên khách hàng:</label>
                            <input type="text" id="tenKhachHang" placeholder="Nhập tên khách hàng" required />

                            <label>Số điện thoại:</label>
                            <input type="text" id="sdtKhachHang" placeholder="Nhập số điện thoại" required />

                            <label>Email:</label>
                            <input type="email" id="emailKhachHang" placeholder="Nhập địa chỉ email" required />

                            <label>Địa chỉ:</label>
                            <input type="text" id="diaChiKhachHang" placeholder="Nhập địa chỉ" required />

                            <div className="modal-buttons">
                                <button type="button" onClick={() => setIsModalOpen(false)}>Lưu</button>
                                <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
