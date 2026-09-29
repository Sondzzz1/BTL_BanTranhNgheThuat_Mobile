// Cart Page - Lifting State Up, Context
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { formatVnd } from '../utils/currency';
import '../assets/css/Cart.css';

const Cart: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { 
    cart, 
    cartTotal, 
    removeFromCart, 
    increaseQuantity, 
    decreaseQuantity,
    updateQuantity,
    clearCart 
  } = useCart();
  const navigate = useNavigate();

  // Lifecycle - Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    if (!isAuthenticated) {
      alert('⚠️ Vui lòng đăng nhập để xem giỏ hàng!');
      navigate('/login');
      return;
    }

    if (isAdmin) {
      alert('⚠️ Tài khoản Admin không thể xem giỏ hàng!');
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Event Handlers
  const handleRemove = (id: string) => {
    if (window.confirm('🗑️ Bạn có chắc muốn xóa sản phẩm này?')) {
      removeFromCart(id);
    }
  };

  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value);
    if (quantity > 0) {
      updateQuantity(id, quantity);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('⚠️ Giỏ hàng của bạn đang trống!');
      return;
    }
    navigate('/checkout');
  };

  // Render với điều kiện
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="cart-page">
      <section className="main">
        <div className="title">Giỏ hàng</div>
        
        <div className="row">
          <div className="col-9">
            <table className="table-prod">
              <thead>
                <tr>
                  <th><i className="ti-trash"></i></th>
                  <th>HÌNH ẢNH</th>
                  <th>SẢN PHẨM</th>
                  <th>GIÁ</th>
                  <th>SỐ LƯỢNG</th>
                  <th>TẠM TÍNH</th>
                </tr>
              </thead>
              <tbody>
                {/* List và Keys - Render danh sách */}
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                      Giỏ hàng của bạn đang trống!
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <i
                          onClick={() => handleRemove(item.id)}
                          className="ti-trash"
                          style={{ fontSize: '18px', color: 'red', cursor: 'pointer' }}
                          title="Xóa sản phẩm"
                        ></i>
                      </td>
                      <td>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '50px', height: '50px', borderRadius: '6px' }}
                        />
                      </td>
                      <td className="ten-sp">{item.name}</td>
                      <td className="gia-sp">{formatVnd(item.price)}</td>
                      <td className="sl-sp">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          style={{
                            backgroundColor: 'orange',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          style={{ width: '40px', textAlign: 'center' }}
                        />
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          style={{
                            backgroundColor: 'orange',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                          }}
                        >
                          +
                        </button>
                      </td>
                      <td>{formatVnd(item.price * item.quantity)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="update">
              <button onClick={handleClearCart}>Xóa giỏ hàng</button>
            </div>
          </div>

          <div className="col-3">
            <table className="table-right">
              <tbody>
                <tr>
                  <td colSpan={2} className="title">CỘNG GIỎ HÀNG</td>
                </tr>
                <tr>
                  <td className="h">Tạm tính</td>
                  <td className="price h">{formatVnd(cartTotal)}</td>
                </tr>
                <tr>
                  <td>Tổng</td>
                  <td className="price">{formatVnd(cartTotal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="pay">
              <button onClick={handleCheckout}>Tiến hành thanh toán</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Cart;
