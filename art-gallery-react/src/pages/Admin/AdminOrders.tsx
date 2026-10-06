import React, { useState, useEffect } from 'react';
import { adminService, DonHangAdminResponse, DonHangResponse } from '../../services/adminService';
import { formatVnd } from '../../utils/currency';
import { invoiceService } from '../../services/invoiceService';
import InvoiceModal from '../../components/InvoiceModal';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<DonHangAdminResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<number>(-1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<DonHangResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

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
        const currentOrder = orders.find(o => o.maDonHang === orderId);
        
        if (!currentOrder) return;

        const currentStatus = currentOrder.trangThai;

        // KIỂM TRA CÁC TRƯỜNG HỢP KHÔNG HỢP LỆ
        
        // 1. Không cho lùi trạng thái (chỉ được tiến lên hoặc hủy)
        if (newStatus < currentStatus && newStatus !== 5) {
            alert('Không thể lùi trạng thái đơn hàng. Chỉ có thể chuyển tiến hoặc hủy đơn.');
            return;
        }

        // 2. Admin chỉ xử lý đến trạng thái Đang giao; khách hàng xác nhận để hoàn tất.
        if (newStatus > currentStatus + 1 && newStatus !== 5) {
            alert('Không thể nhảy trạng thái. Vui lòng chuyển tuần tự: Chờ xác nhận → Đã xác nhận → Đang giao. Khách hàng sẽ xác nhận khi đã nhận hàng.');
            return;
        }

        // 3. Đơn đã hoàn thành (3) hoặc đã hủy (5) không được thay đổi
        if (currentStatus === 3 || currentStatus === 5) {
            alert('Không thể thay đổi trạng thái đơn hàng đã hoàn thành hoặc đã hủy.');
            return;
        }

        // 4. Chỉ được hủy khi đơn hàng chưa giao (status 0, 1, 2)
        if (newStatus === 5 && currentStatus >= 3) {
            alert('Không thể hủy đơn hàng đã hoàn thành.');
            return;
        }

        // Đơn chuyển khoản chỉ được chuyển sang Đang giao khi Admin đã xác nhận tiền.
        // Danh sách đơn có thể không chứa dữ liệu thanh toán trên các bản backend cũ,
        // nên lấy chi tiết đơn trước khi kiểm tra. Backend vẫn là lớp kiểm tra cuối cùng.
        if (newStatus === 2) {
            let paymentMethod = currentOrder.phuongThucThanhToan;
            let paymentStatus = currentOrder.trangThaiThanhToan;

            if (!paymentMethod || !paymentStatus) {
                try {
                    const detail = await adminService.getDonHangById(orderId);
                    paymentMethod = detail.phuongThucThanhToan;
                    paymentStatus = detail.trangThaiThanhToan;
                } catch (error) {
                    console.error('Error checking order payment before shipping:', error);
                    alert('Không thể kiểm tra trạng thái thanh toán của đơn hàng. Vui lòng thử lại.');
                    return;
                }
            }

            if (isBankTransfer(paymentMethod) && !isPaymentPaid(paymentStatus)) {
                alert('Đơn chuyển khoản chưa được xác nhận thanh toán. Hãy mở Chi tiết đơn hàng và bấm “Xác nhận đã nhận tiền” trước khi chuyển sang Đang giao.');
                return;
            }
        }

        // Xử lý lý do hủy
        let reason = '';
        if (newStatus === 5 && requireCancelReason) {
            reason = prompt('Vui lòng nhập lý do hủy đơn hàng:') || '';
            if (!reason) {
                alert('Bạn cần cung cấp lý do để hủy đơn hàng.');
                return;
            }
        } else if (newStatus === 5 && !requireCancelReason) {
            reason = reasonOverride || '';
        }

        try {
            await adminService.updateOrderStatus(orderId, newStatus, reason);
            await loadOrders();
            if (selectedOrder && selectedOrder.maDonHang === orderId) {
                handleViewDetail(orderId);
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(error?.response?.data?.message || error.message || 'Không thể cập nhật trạng thái');
        }
    };

    const handleViewDetail = async (orderId: number) => {
        setIsDetailLoading(true);
        setIsModalOpen(true);
        try {
            const detail = await adminService.getDonHangById(orderId);
            setSelectedOrder(detail);
        } catch (error) {
            console.error('Error loading order detail:', error);
            alert('Không thể tải chi tiết đơn hàng');
            setIsModalOpen(false);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleConfirmBankTransfer = async () => {
        if (!selectedOrder || !isBankTransfer(selectedOrder.phuongThucThanhToan) || !isPaymentWaitingForConfirmation(selectedOrder.trangThaiThanhToan)) {
            return;
        }

        if (!window.confirm(`Xác nhận hệ thống đã nhận ${formatVnd(selectedOrder.tongTien)} cho đơn hàng này?`)) {
            return;
        }

        setIsConfirmingPayment(true);
        try {
            const result = await adminService.xacNhanDaNhanTienDonHang(selectedOrder.maDonHang);
            alert(result.message || 'Đã xác nhận đã nhận tiền. Bạn có thể chuyển đơn sang Đang giao.');
            await loadOrders();
            await handleViewDetail(selectedOrder.maDonHang);
        } catch (error: any) {
            console.error('Error confirming bank transfer:', error);
            alert(error?.response?.data?.message || error?.message || 'Không thể xác nhận thanh toán.');
        } finally {
            setIsConfirmingPayment(false);
        }
    };

    const formatPrice = formatVnd;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const normalizePaymentValue = (value?: string) => (value || '').replace(/[\s_-]/g, '').toLocaleLowerCase('vi-VN');

    const isBankTransfer = (paymentMethod?: string) => {
        const normalized = normalizePaymentValue(paymentMethod);
        return normalized === 'banktransfer' || normalized === 'chuyenkhoan';
    };

    const isPaymentPaid = (paymentStatus?: string) => {
        const normalized = normalizePaymentValue(paymentStatus);
        return normalized === 'dathanhtoan' || normalized === 'paid' || normalized === 'completed';
    };

    const isPaymentWaitingForConfirmation = (paymentStatus?: string) => {
        const normalized = normalizePaymentValue(paymentStatus);
        return normalized === 'chothanhtoan' || normalized === 'choxacnhan' || normalized === 'pending';
    };

    const formatPaymentMethod = (paymentMethod?: string) => {
        if (isBankTransfer(paymentMethod)) return 'Chuyển khoản';
        if (normalizePaymentValue(paymentMethod) === 'cod') return 'Thanh toán khi nhận hàng (COD)';
        return paymentMethod || 'Chưa có thông tin';
    };

    const formatPaymentStatus = (paymentStatus?: string) => {
        if (isPaymentPaid(paymentStatus)) return 'Đã thanh toán';
        if (normalizePaymentValue(paymentStatus) === 'chothanhtoan') return 'Chờ xác nhận';
        return paymentStatus || 'Chưa có thông tin';
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === -1 || order.trangThai === statusFilter;
        const matchesSearch = order.tenKhachHang.toLocaleLowerCase('vi-VN').includes(searchTerm.trim().toLocaleLowerCase('vi-VN'));
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
                        <option value={3}>Đã giao</option>
                        <option value={4}>Yêu cầu hủy</option>
                        <option value={5}>Đã hủy</option>
                    </select>
                </div>
                <div className="filter-item">
                    <input
                        type="text"
                        placeholder="Tìm theo khách hàng..."
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
                                <th>STT</th>
                                <th>Ngày đặt</th>
                                <th>Trạng thái</th>
                                <th>Tổng tiền</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order, index) => (
                                <tr key={order.maDonHang}>
                                    <td>{index + 1}</td>
                                    <td>{formatDate(order.ngayDat)}</td>
                                    <td>
                                        {order.trangThai <= 2 && (
                                            <select
                                                value={order.trangThai}
                                                onChange={(e) => handleStatusChange(order.maDonHang, Number(e.target.value))}
                                                className={`status status-${order.trangThai}`}
                                            >
                                                {/* Chờ xác nhận (0) */}
                                                <option value={0} disabled={order.trangThai !== 0}>
                                                    Chờ xác nhận
                                                </option>
                                                
                                                {/* Đã xác nhận (1) - chỉ khi đang ở trạng thái 0 hoặc 1 */}
                                                <option value={1} disabled={order.trangThai !== 0 && order.trangThai !== 1}>
                                                    Đã xác nhận
                                                </option>
                                                
                                                {/* Đang giao (2) - sau đó chờ khách hàng xác nhận nhận hàng */}
                                                <option
                                                    value={2}
                                                    disabled={
                                                        (order.trangThai !== 1 && order.trangThai !== 2) ||
                                                        (isBankTransfer(order.phuongThucThanhToan) && !isPaymentPaid(order.trangThaiThanhToan))
                                                    }
                                                >
                                                    {isBankTransfer(order.phuongThucThanhToan) && !isPaymentPaid(order.trangThaiThanhToan)
                                                        ? 'Đang giao — cần xác nhận tiền'
                                                        : 'Đang giao — chờ khách xác nhận'}
                                                </option>
                                                
                                                {/* Hủy (5) - chỉ khi chưa hoàn thành */}
                                                <option value={5} disabled={order.trangThai >= 3}>
                                                    Đã hủy
                                                </option>
                                            </select>
                                        )}
                                        {order.trangThai === 3 && (
                                            <span className="status status-3" title="Khách hàng đã xác nhận nhận hàng">
                                                Đã giao
                                            </span>
                                        )}
                                        {order.trangThai === 5 && (
                                            <span 
                                                className="status status-5"
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    background: '#f8d7da',
                                                    color: '#842029',
                                                    border: '1px solid #f5c2c7'
                                                }}
                                            >
                                                Đã hủy
                                            </span>
                                        )}
                                        {order.trangThai === 4 && (
                                            <div style={{ margin: '8px auto 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(92px, 1fr))', gap: '8px', maxWidth: '220px' }}>
                                                <button
                                                    style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    onClick={() => handleStatusChange(order.maDonHang, 5, false, order.lyDoHuy)}
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
                                        {(order.trangThai === 4 || order.trangThai === 5) && order.lyDoHuy && (
                                            <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '6px', textAlign: 'center' }}>
                                                Lý do: {order.lyDoHuy}
                                            </div>
                                        )}
                                    </td>
                                    <td>{formatPrice(order.tongTien)}</td>
                                    <td>
                                        <button
                                            title="Xem chi tiết"
                                            onClick={() => handleViewDetail(order.maDonHang)}
                                            className="btn-view"
                                            style={{ background: '#2c7be5', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            <i className="ti-eye"></i> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Chi tiết đơn hàng */}
            {isModalOpen && (
                <div className="modal show" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
                        <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
                        <h3><i className="ti-receipt"></i> Chi tiết đơn hàng</h3>
                        
                        {isDetailLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px' }}>Đang tải chi tiết...</div>
                        ) : selectedOrder ? (
                            <div className="order-detail-body">
                                <div className="order-info-grid">
                                    <div className="info-section">
                                        <h5><i className="ti-info-alt"></i> Thông tin chung</h5>
                                        <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.ngayDat)}</p>
                                        <p><strong>Trạng thái:</strong> 
                                            <span className={`status status-${selectedOrder.trangThai}`} style={{ marginLeft: '8px' }}>
                                                {selectedOrder.trangThaiText}
                                            </span>
                                        </p>
                                        {selectedOrder.lyDoHuy && (
                                            <p><strong style={{ color: '#e74c3c' }}>Lý do hủy:</strong> {selectedOrder.lyDoHuy}</p>
                                        )}
                                    </div>
                                    <div className="info-section">
                                        <h5><i className="ti-user"></i> Người nhận hàng</h5>
                                        <p><strong>Họ tên:</strong> {selectedOrder.tenNguoiNhan}</p>
                                        <p><strong>Số điện thoại:</strong> {selectedOrder.soDienThoai}</p>
                                        <p><strong>Địa chỉ:</strong> {selectedOrder.diaChiGiao}</p>
                                    </div>
                                    <div className="info-section payment-info-section">
                                        <h5><i className="ti-credit-card"></i> Thanh toán</h5>
                                        <p><strong>Phương thức:</strong> {formatPaymentMethod(selectedOrder.phuongThucThanhToan)}</p>
                                        <p>
                                            <strong>Trạng thái:</strong>
                                            <span
                                                className={`payment-status ${isPaymentPaid(selectedOrder.trangThaiThanhToan) ? 'payment-status-paid' : 'payment-status-pending'}`}
                                            >
                                                {formatPaymentStatus(selectedOrder.trangThaiThanhToan)}
                                            </span>
                                        </p>

                                        {isBankTransfer(selectedOrder.phuongThucThanhToan) && isPaymentWaitingForConfirmation(selectedOrder.trangThaiThanhToan) && (
                                            <div className="bank-transfer-confirmation">
                                                <p>Đơn chuyển khoản này chưa được xác nhận tiền. Xác nhận sau khi bạn đã đối chiếu khoản tiền nhận được.</p>
                                                <button
                                                    type="button"
                                                    className="btn-confirm-bank-transfer"
                                                    onClick={handleConfirmBankTransfer}
                                                    disabled={isConfirmingPayment}
                                                >
                                                    <i className="ti-check"></i>{' '}
                                                    {isConfirmingPayment ? 'Đang xác nhận...' : 'Xác nhận đã nhận tiền'}
                                                </button>
                                            </div>
                                        )}

                                        {isBankTransfer(selectedOrder.phuongThucThanhToan) && isPaymentPaid(selectedOrder.trangThaiThanhToan) && (
                                            <p className="payment-confirmed-note"><i className="ti-check-box"></i> Đã xác nhận thanh toán. Có thể chuyển đơn sang Đang giao.</p>
                                        )}
                                    </div>
                                </div>

                                <h5><i className="ti-layout-list-thumb"></i> Danh sách sản phẩm</h5>
                                <table className="order-items-table">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th style={{ textAlign: 'center' }}>Số lượng</th>
                                            <th style={{ textAlign: 'right' }}>Đơn giá</th>
                                            <th style={{ textAlign: 'right' }}>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.chiTiet.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="item-info">
                                                        <img 
                                                            src={item.hinhAnh || '/assets/images/no-image.svg'}
                                                            alt={item.tenTacPham} 
                                                            className="item-thumb" 
                                                        />
                                                        <div>
                                                            <span className="item-name">{item.tenTacPham}</span>
                                                            <span className="item-artist">Họa sĩ: {item.tenHoaSi}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{item.soLuong}</td>
                                                <td style={{ textAlign: 'right' }}>{formatPrice(item.donGia)}</td>
                                                <td style={{ textAlign: 'right' }}>{formatPrice(item.thanhTien)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="order-summary">
                                    <p>Tổng số lượng: <strong>{selectedOrder.chiTiet.reduce((sum: number, item: any) => sum + item.soLuong, 0)}</strong></p>
                                    <p className="total-amount">Tổng cộng: {formatPrice(selectedOrder.tongTien)}</p>
                                </div>

                                <div className="modal-buttons">
                                    {selectedOrder.trangThai === 3 && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-confirm-bank-transfer"
                                                style={{ backgroundColor: '#059669', borderColor: '#059669', marginRight: '8px', cursor: 'pointer' }}
                                                onClick={() => setIsInvoiceModalOpen(true)}
                                            >
                                                <i className="ti-receipt"></i> Xem hóa đơn
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-confirm-bank-transfer"
                                                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', marginRight: '8px', cursor: 'pointer' }}
                                                disabled={isDownloadingInvoice}
                                                onClick={async () => {
                                                    try {
                                                        setIsDownloadingInvoice(true);
                                                        const inv = await invoiceService.getByOrderId(selectedOrder.maDonHang);
                                                        if (inv) {
                                                            await invoiceService.downloadPdf(inv.maHoaDon);
                                                        } else {
                                                            alert('Chưa có hóa đơn cho đơn hàng này');
                                                        }
                                                    } catch (err: any) {
                                                        alert(err.response?.data?.message || err.message || 'Lỗi khi tải hóa đơn PDF');
                                                    } finally {
                                                        setIsDownloadingInvoice(false);
                                                    }
                                                }}
                                            >
                                                <i className="ti-download"></i> {isDownloadingInvoice ? 'Đang tải...' : 'Tải PDF'}
                                            </button>
                                        </>
                                    )}
                                    <button className="cancel" onClick={() => setIsModalOpen(false)}>Đóng</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px' }}>Không tìm thấy dữ liệu đơn hàng</div>
                        )}
                    </div>
                </div>
            )}

            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                orderId={selectedOrder?.maDonHang}
            />
        </div>
    );
};

export default AdminOrders;
