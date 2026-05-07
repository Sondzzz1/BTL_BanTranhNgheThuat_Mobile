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

    const handleStatusChange = async (
        orderId: number,
        newStatus: number,
        requireCancelReason: boolean = true,
        reasonOverride?: string
    ) => {
        let reason = '';
        if (newStatus === 3 && requireCancelReason) {
            reason = prompt('Vui lòng nhập lý do hủy đơn hàng:') || '';
            if (!reason) {
                alert('Bạn cần cung cấp lý do để hủy đơn hàng.');
                return;
            }
        } else if (newStatus === 3 && !requireCancelReason) {
            // Nếu admin "duyệt hủy" thì không cần nhập lại, nhưng vẫn giữ nguyên lý do đang có
            reason = reasonOverride || '';
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
                        <option value={0}>Chờ xác nhận</option>
                        <option value={1}>Đã xác nhận</option>
                        <option value={2}>Đang giao</option>
                        <option value={3}>Đã hủy</option>
                        <option value={4}>Yêu cầu hủy</option>
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
                                        {order.trangThai !== 4 && (
                                            <select
                                                value={order.trangThai}
                                                onChange={(e) => handleStatusChange(order.maDonHang, Number(e.target.value))}
                                                className={`status status-${order.trangThai}`}
                                            >
                                                <option value={0}>Chờ xác nhận</option>
                                                <option value={1}>Đã xác nhận</option>
                                                <option value={2}>Đang giao</option>
                                                <option value={3}>Đã hủy</option>
                                            </select>
                                        )}
                                        {order.trangThai === 4 && (
                                            <div style={{ margin: '8px auto 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(92px, 1fr))', gap: '8px', maxWidth: '220px' }}>
                                                <button
                                                    style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    onClick={() => handleStatusChange(order.maDonHang, 3, false, order.lyDoHuy)}
                                                    title="Duyệt hủy đơn hàng"
                                                >
                                                    ✔ Duyệt hủy
                                                </button>
                                                <button
                                                    style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    onClick={() => handleStatusChange(order.maDonHang, 1)}
                                                    title="Từ chối yêu cầu hủy"
                                                >
                                                    ✖ Từ chối
                                                </button>
                                            </div>
                                        )}
                                        {(order.trangThai === 3 || order.trangThai === 4) && order.lyDoHuy && (
                                            <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '6px', textAlign: 'center' }}>
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
