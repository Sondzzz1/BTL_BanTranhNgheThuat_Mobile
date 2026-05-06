import React, { useState, useEffect } from 'react';
import { adminService, HoSoHoaSiResponse } from '../../services/adminService';

const AdminAuthors: React.FC = () => {
    const [authors, setAuthors] = useState<HoSoHoaSiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadAuthors();
    }, []);

    const loadAuthors = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllHoaSi();
            setAuthors(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách tác giả:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLock = async (id: number, currentStatus: boolean) => {
        if (window.confirm(currentStatus ? 'Khóa tài khoản tác giả này?' : 'Mở khóa tài khoản tác giả này?')) {
            try {
                if (currentStatus) {
                    await adminService.khoaHoaSi(id);
                } else {
                    await adminService.moKhoaHoaSi(id);
                }
                loadAuthors();
            } catch (error) {
                console.error('Lỗi khi cập nhật trạng thái:', error);
            }
        }
    };

    return (
        <div id="authors" className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h4 style={{ color: '#2c7be5', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <i className="ti-id-badge"></i> Quản lý Tác giả
                </h4>
                {/* 
                Trong hệ thống hiện tại, Tác giả đăng ký qua trang Register 
                nên nút "Thêm tác giả" có thể dùng để tạo nhanh hoặc chỉ Admin mới được tạo.
                Tạm thời để logic mở modal.
                */}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
            ) : (
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên tác giả</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Số tác phẩm</th>
                                <th>Doanh thu</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authors.map((author) => (
                                <tr key={author.id}>
                                    <td>{author.id}</td>
                                    <td><strong>{author.tenHoaSi}</strong></td>
                                    <td>{author.email}</td>
                                    <td>{author.soDienThoai}</td>
                                    <td>{author.soTacPham}</td>
                                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(author.doanhThu)}</td>
                                    <td>
                                        <span className={`status ${author.trangThai ? 'status-success' : 'status-canceled'}`}>
                                            {author.trangThai ? 'Hoạt động' : 'Đang khóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleLock(author.id, author.trangThai)}
                                            title={author.trangThai ? 'Khóa' : 'Mở khóa'}
                                            style={{ color: author.trangThai ? 'red' : 'green' }}
                                        >
                                            <i className={author.trangThai ? 'ti-lock' : 'ti-unlock'}></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
                        <h3>Thêm Tác giả mới</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>Chức năng tạo tài khoản tác giả trực tiếp từ Admin đang được cập nhật.</p>
                        <div className="modal-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="cancel">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAuthors;
