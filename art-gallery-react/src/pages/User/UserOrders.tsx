// User Orders - Lịch sử đơn hàng
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

const UserOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await orderService.getOrdersByUserId(parseInt(user.id));
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Không thể tải danh sách đơn hàng');
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

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.trangThai === filter);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="user-orders">
      <h1>Đơn Hàng Của Tôi</h1>

      <div className="orders-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tất cả ({orders.length})
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Chờ xử lý
        </button>
        <button
          className={filter === 'shipped' ? 'active' : ''}
          onClick={() => setFilter('shipped')}
        >
          Đang giao
        </button>
        <button
          className={filter === 'success' ? 'active' : ''}
          onClick={() => setFilter('success')}
        >
          Hoàn thành
        </button>
        <button
          className={filter === 'canceled' ? 'active' : ''}
          onClick={() => setFilter('canceled')}
        >
          Đã hủy
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <i className="ti-shopping-cart"></i>
          <h3>Chưa có đơn hàng nào</h3>
          <p>Hãy mua sắm ngay để tạo đơn hàng đầu tiên!</p>
          <Link to="/" className="btn-primary">
            Mua Sắm Ngay
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Đơn hàng #{order.maHD}</h3>
                  <p className="order-date">
                    Ngày đặt: {formatDate(order.ngayLap)}
                  </p>
                </div>
                <span className={getStatusClass(order.trangThai)}>
                  {getStatusText(order.trangThai)}
                </span>
              </div>

              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>Số lượng: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Tổng tiền:</span>
                  <strong>{formatPrice(order.tongTien)}</strong>
                </div>
                <div className="order-actions">
                  <Link
                    to={`/user/orders/${order.id}`}
                    className="btn-detail"
                  >
                    Xem Chi Tiết
                  </Link>
                  {order.trangThai === 'pending' && (
                    <button 
                      className="btn-cancel"
                      onClick={async () => {
                        const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:');
                        if (reason) {
                          try {
                            await orderService.cancelOrder(parseInt(order.id), reason);
                            alert('Hủy đơn hàng thành công');
                            loadOrders();
                          } catch (error: any) {
                            alert(error.message);
                          }
                        }
                      }}
                    >
                      Hủy Đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
