import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { formatVnd } from '../../utils/currency';

const UserOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(parseInt(id));
    }
  }, [id]);

  const loadOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Không thể tải chi tiết đơn hàng');
      navigate('/user/orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      success: 'Đã giao',
      canceled: 'Đã hủy',
      cancel_pending: 'Yêu cầu hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-badge ${status}`;
  };

  const formatPrice = formatVnd;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method?.trim().toUpperCase()) {
      case 'COD':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'BANKTRANSFER':
      case 'BANK_TRANSFER':
      case 'CHUYENKHOAN':
        return 'Chuyển khoản ngân hàng';
      default:
        return method?.trim() || 'Chưa cập nhật';
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status?.trim().toUpperCase()) {
      case 'DATHANHTOAN':
        return 'Đã thanh toán';
      case 'CHOTHANHTOAN':
        return 'Chờ xác nhận thanh toán';
      case 'THATBAI':
        return 'Thanh toán thất bại';
      case 'CHOHOANTIEN':
        return 'Chờ hoàn tiền';
      case 'HOANTIEN':
        return 'Đã hoàn tiền';
      default:
        return 'Chưa cập nhật';
    }
  };

  const handleConfirmReceived = async () => {
    if (!order) return;
    const accepted = window.confirm(
      `Xác nhận bạn đã nhận đầy đủ hàng của đơn #${order.maHD}? Sau khi xác nhận, đơn sẽ hoàn tất.`
    );
    if (!accepted) return;

    try {
      setIsConfirmingReceived(true);
      const message = await orderService.confirmReceived(Number(order.id));
      alert(message);
      await loadOrder(Number(order.id));
    } catch (error: any) {
      alert(error.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setIsConfirmingReceived(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Đang tải chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return <div className="empty-state">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="user-order-detail">
      <div className="detail-header">
        <Link to="/user/orders" className="btn-back">
          <i className="ti-arrow-left"></i> Quay lại
        </Link>
        <h1>Chi Tiết Đơn Hàng #{order.maHD}</h1>
      </div>

      <div className="order-status-card">
        <div className="status-info">
          <h3>Trạng thái đơn hàng</h3>
          <div className="status-badge-container">
            <span className={getStatusClass(order.trangThai)}>
              {getStatusText(order.trangThai)}
            </span>
          </div>
          {order.trangThai === 'cancel_pending' && (
            <p className="cancel-note" style={{ color: '#b45309', marginTop: '10px', fontSize: '0.9rem' }}>
              Đơn hàng của bạn đang được admin xem xét hủy.
            </p>
          )}
          {order.trangThai === 'shipping' && (
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn-received"
                onClick={handleConfirmReceived}
                disabled={isConfirmingReceived}
              >
                <i className="ti-check"></i>{' '}
                {isConfirmingReceived ? 'Đang xác nhận...' : 'Tôi đã nhận được hàng'}
              </button>
            </div>
          )}
          {order.trangThai === 'confirmed' && (
            <p className="delivery-status-note" style={{ marginTop: '16px' }}>
              <i className="ti-truck"></i> Đơn chưa ở trạng thái đang giao. Bạn sẽ có thể xác nhận sau khi đơn vị giao hàng bàn giao hàng cho bạn.
            </p>
          )}
          {order.trangThai === 'success' && (
            <p className="delivery-status-note completed" style={{ marginTop: '16px' }}>
              <i className="ti-check"></i> Đơn đã hoàn tất. Bạn không cần xác nhận nhận hàng thêm lần nữa.
            </p>
          )}
        </div>
        <div className="order-date-info">
          <p><strong>Ngày đặt:</strong> {formatDate(order.ngayLap)}</p>
        </div>
      </div>

      <div className="order-info-grid">
        <div className="info-card">
          <h3>Thông tin người nhận</h3>
          <p><strong>Họ tên:</strong> {order.tenKH}</p>
          <p><strong>Số điện thoại:</strong> {order.phone}</p>
          <p><strong>Địa chỉ giao hàng:</strong> {order.address}</p>
        </div>
        <div className="info-card payment-info-card">
          <h3>Thông tin thanh toán</h3>
          <p><strong>Phương thức:</strong> {getPaymentMethodText(order.phuongThucThanhToan)}</p>
          <p>
            <strong>Trạng thái:</strong>{' '}
            <span className={`customer-payment-status ${order.trangThaiThanhToan?.toLowerCase() === 'dathanhtoan' ? 'paid' : 'pending'}`}>
              {getPaymentStatusText(order.trangThaiThanhToan)}
            </span>
          </p>
          {order.phuongThucThanhToan?.toUpperCase() === 'BANKTRANSFER'
            && order.trangThaiThanhToan?.toUpperCase() === 'CHOTHANHTOAN' && (
              <p className="customer-payment-hint">
                Khoản chuyển khoản đang chờ quản trị viên xác nhận. Bạn không cần thực hiện thêm thao tác.
              </p>
            )}
        </div>
      </div>

      <div className="order-items-card">
        <h3>Sản phẩm đã đặt</h3>
        <div className="items-list">
          {order.items.map((item, index) => (
            <div key={index} className="order-detail-item">
              <img src={item.image} alt={item.name} />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-price">{formatPrice(item.price)}</p>
                <p className="item-quantity">Số lượng: {item.quantity}</p>
              </div>
              <div className="item-total">
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="order-summary">
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <strong>{formatPrice(order.tongTien)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetail;
