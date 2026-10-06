// User Orders - Lịch sử đơn hàng
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import CancelOrderModal from '../../components/CancelOrderModal';
import InvoiceModal from '../../components/InvoiceModal';
import { invoiceService } from '../../services/invoiceService';
import { formatVnd } from '../../utils/currency';

const UserOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<{ id: string, maHD: string } | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

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

  const handleCancelOrder = (orderId: string, maHD: string) => {
    setOrderToCancel({ id: orderId, maHD });
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!orderToCancel) return;
    
    try {
      await orderService.cancelOrder(parseInt(orderToCancel.id), reason);
      alert('Hủy đơn hàng thành công');
      loadOrders();
    } catch (error: any) {
      alert(error.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  const handleConfirmReceived = async (orderId: string, maHD: string) => {
    const accepted = window.confirm(
      `Xác nhận bạn đã nhận đầy đủ hàng của đơn #${maHD}? Sau khi xác nhận, đơn sẽ hoàn tất và không thể chuyển lại trạng thái đang giao.`
    );
    if (!accepted) return;

    try {
      setConfirmingOrderId(orderId);
      const message = await orderService.confirmReceived(Number(orderId));
      alert(message);
      await loadOrders();
    } catch (error: any) {
      alert(error.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setConfirmingOrderId(null);
    }
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
          Chờ xác nhận
        </button>
        <button
          className={filter === 'confirmed' ? 'active' : ''}
          onClick={() => setFilter('confirmed')}
        >
          Đã xác nhận
        </button>
        <button
          className={filter === 'shipping' ? 'active' : ''}
          onClick={() => setFilter('shipping')}
        >
          Đang giao
        </button>
        <button
          className={filter === 'success' ? 'active' : ''}
          onClick={() => setFilter('success')}
        >
          Đã giao
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
                  {order.trangThai === 'shipping' && (
                    <button
                      className="btn-received"
                      onClick={() => handleConfirmReceived(order.id, order.maHD)}
                      disabled={confirmingOrderId === order.id}
                    >
                      <i className="ti-check"></i>{' '}
                      {confirmingOrderId === order.id ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                    </button>
                  )}
                  {order.trangThai === 'confirmed' && (
                    <span className="delivery-status-note">
                      <i className="ti-truck"></i> Chờ đơn chuyển sang đang giao
                    </span>
                  )}
                  {order.trangThai === 'success' && (
                    <>
                      <button
                        className="btn-detail"
                        style={{ backgroundColor: '#059669', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => setSelectedInvoiceOrderId(Number(order.id))}
                        title="Xem hóa đơn bán hàng"
                      >
                        <i className="ti-receipt"></i> Xem hóa đơn
                      </button>
                      <button
                        className="btn-detail"
                        style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
                        disabled={downloadingInvoiceId === order.id}
                        onClick={async () => {
                          try {
                            setDownloadingInvoiceId(order.id);
                            const inv = await invoiceService.getByOrderId(Number(order.id));
                            if (inv) {
                              await invoiceService.downloadPdf(inv.maHoaDon);
                            } else {
                              alert('Chưa có hóa đơn cho đơn hàng này');
                            }
                          } catch (err: any) {
                            alert(err.response?.data?.message || err.message || 'Lỗi khi tải hóa đơn PDF');
                          } finally {
                            setDownloadingInvoiceId(null);
                          }
                        }}
                        title="Tải hóa đơn PDF"
                      >
                        <i className="ti-download"></i> {downloadingInvoiceId === order.id ? 'Đang tải...' : 'Tải PDF'}
                      </button>
                      <span className="delivery-status-note completed">
                        <i className="ti-check"></i> Đã hoàn tất nhận hàng
                      </span>
                    </>
                  )}
                  {(order.trangThai === 'pending' || order.trangThai === 'confirmed') && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelOrder(order.id, order.maHD)}
                    >
                      Yêu Cầu Hủy
                    </button>
                  )}
                  {order.trangThai === 'cancel_pending' && (
                    <span className="cancel-pending-note">⏳ Chờ admin duyệt hủy</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InvoiceModal
        isOpen={selectedInvoiceOrderId !== null}
        onClose={() => setSelectedInvoiceOrderId(null)}
        orderId={selectedInvoiceOrderId ?? undefined}
      />

      {orderToCancel && (
        <CancelOrderModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
          orderCode={orderToCancel.maHD}
        />
      )}
    </div>
  );
};

export default UserOrders;
