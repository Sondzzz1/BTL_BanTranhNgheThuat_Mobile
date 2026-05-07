// Checkout Page - Thanh toán đơn hàng
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { orderService } from '../services/orderService';
import '../assets/css/Checkout.css';

const Checkout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  useEffect(() => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thanh toán!');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      navigate('/cart');
    }
  }, [isAuthenticated, cart, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      alert('Không tìm thấy thông tin người dùng!');
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    setLoading(true);
    try {
      await orderService.createOrder(
        parseInt(user.id),
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        },
        cart,
        paymentMethod
      );

      alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
      clearCart();
      navigate('/user/orders');
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (!isAuthenticated || cart.length === 0) {
    return null;
  }

  return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-content">
          {/* Thông tin thanh toán */}
          <div className="checkout-form">
            <div className="section-header">
              <h2>THÔNG TIN THANH TOÁN</h2>
              <p className="step-indicator">(7 Bắt buộc)</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Họ tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="form-group">
                <label>
                  Số điện thoại <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={user?.email || ''}
                  disabled
                  placeholder="Nhập email"
                />
              </div>

              <div className="form-group">
                <label>
                  Địa chỉ <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ghi chú của bạn"
                />
              </div>
            </form>
          </div>

          {/* Đơn hàng */}
          <div className="checkout-order-summary">
            <div className="section-header">
              <h2>ĐƠN HÀNG</h2>
            </div>

            <div className="checkout-order-table">
              <div className="checkout-table-header">
                <span>SẢN PHẨM</span>
                <span>TỔNG</span>
              </div>

              <div className="checkout-order-items">
                {cart.map((item) => (
                  <div key={item.id} className="checkout-order-row">
                    <div className="checkout-product-info">
                      <span className="checkout-product-name">{item.name}</span>
                      <span className="checkout-product-qty">× {item.quantity}</span>
                    </div>
                    <div className="checkout-product-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-order-subtotal">
                <span>Tổng</span>
                <span className="price">{formatPrice(cartTotal)}</span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="btn-checkout"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
              </button>
            </div>

            <div className="checkout-payment-methods">
              <div className="checkout-payment-option">
                <input 
                  type="radio" 
                  id="cod" 
                  name="payment" 
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                />
                <label htmlFor="cod">
                  Thanh toán tiền mặt khi nhận hàng (COD)
                </label>
              </div>
              <div className="checkout-payment-option">
                <input 
                  type="radio" 
                  id="transfer" 
                  name="payment" 
                  value="BankTransfer"
                  checked={paymentMethod === 'BankTransfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <label htmlFor="transfer">
                  Thanh toán qua chuyển khoản ngân hàng
                </label>
                {paymentMethod === 'BankTransfer' && (
                  <p className="checkout-payment-note">Vui lòng chuyển khoản vào STK: 123456789 - Ngân hàng MBBank. Nội dung: [Mã đơn hàng]</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default Checkout;
