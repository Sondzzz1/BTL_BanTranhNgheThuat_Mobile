import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

const UserOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
      pending: 'Chờ xử lý',
      shipped: 'Đang giao',
      success: 'Hoàn thành',
      canceled: 'Đã hủy',
      cancel_pending: 'Đang xử lý hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-badge ${status}`;
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
