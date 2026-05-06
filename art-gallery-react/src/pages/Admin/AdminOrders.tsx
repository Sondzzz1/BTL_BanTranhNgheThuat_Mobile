import React, { useState, useEffect } from 'react';
import { adminService, DonHangAdminResponse } from '../../services/adminService';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<DonHangAdminResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<number>(-1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await adminService.getOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            alert('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: number) => {
        let reason = '';
        if (newStatus === 3) {
            reason = prompt('Vui lòng nhập lý do hủy đơn hàng:') || '';
            if (!reason) {
                alert('Bạn cần cung cấp lý do để hủy đơn hàng.');
                return;
            }
        }
        try {
            await adminService.updateOrderStatus(orderId, newStatus, reason);
            alert('Cập nhật trạng thái thành công!');
            loadOrders();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(error.message || 'Không thể cập nhật trạng thái');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === -1 || order.trangThai === statusFilter;
        const matchesSearch = order.maDonHang.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    return (
        <div id="orders" className="page">
            <div className="page-header">
                <h4><i className="ti-shopping-cart"></i> Quản lý Đơn hàng</h4>
                <button className="btn-refresh" onClick={loadOrders}>
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            <div className="filter-bar">
                <div className="filter-item">
                    <label>Trạng thái:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(Number(e.target.value))}
                    >
                        <option value={-1}>Tất cả ({orders.length})</option>
                        <option value={0}>Chờ xử lý</option>
                        <option value={1}>Đang giao</option>
                        <option value={2}>Hoàn thành</option>
                        <option value={3}>Đã hủy</option>
                    </select>
                </div>
                <div className="filter-item">
                    <input
                        type="text"
                        placeholder="Mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Chưa có đơn hàng nào</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Ngày đặt</th>
                                <th>Trạng thái</th>
                                <th>Tổng tiền</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.maDonHang}>
                                    <td>DH{order.maDonHang}</td>
                                    <td>{formatDate(order.ngayDat)}</td>
                                    <td>
                                        <select
                                            value={order.trangThai}
                                            onChange={(e) => handleStatusChange(order.maDonHang, Number(e.target.value))}
                                            className={`status status-${order.trangThai}`}
                                        >
                                            <option value={0}>Chờ xử lý</option>
                                            <option value={1}>Đang giao</option>
                                            <option value={2}>Hoàn thành</option>
                                            <option value={3}>Đã hủy</option>
                                        </select>
                                        {order.trangThai === 3 && order.lyDoHuy && (
                                            <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px' }}>
                                                Lý do: {order.lyDoHuy}
                                            </div>
                                        )}
                                    </td>
                                    <td>{formatPrice(order.tongTien)}</td>
                                    <td>
                                        <button
                                            title="Xem chi tiết"
                                            onClick={() => {
                                                alert(`Chi tiết đơn hàng DH${order.maDonHang}:\nTính năng đang phát triển.`);
                                            }}
                                        >
                                            <i className="ti-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
