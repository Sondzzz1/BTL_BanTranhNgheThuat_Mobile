// Custom Hook cho Cart Management - Đồng bộ với Backend
import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CartItem } from '../types';
import { cartService } from '../services/cartService';

export const useCart = () => {
  const { cart, setCart, user } = useAppContext();

  // Tổng số lượng (đếm theo từng sản phẩm chứ không cộng quantity, để badge không to bất thường)
  const cartCount = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((t, i) => t + i.price * i.quantity, 0),
    [cart]
  );

  // Reload cart từ server và set state
  const reload = useCallback(async () => {
    if (!user || user.role === 'admin') {
      setCart([]);
      return;
    }
    const serverCart = await cartService.getGioHang();
    setCart(serverCart);
  }, [user, setCart]);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = useCallback(
    async (item: CartItem): Promise<boolean> => {
      if (!user) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        return false;
      }
      if (user.role === 'admin' || user.role === 'author') {
        alert('Tài khoản này không thể mua hàng');
        return false;
      }

      try {
        await cartService.addToCart(parseInt(item.id), item.quantity || 1);
        await reload();
        return true;
      } catch (error: any) {
        alert(error?.message || 'Lỗi khi thêm vào giỏ hàng');
        return false;
      }
    },
    [user, reload]
  );

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = useCallback(
    async (id: string) => {
      const item = cart.find((i) => i.id === id);
      if (!item?.dbId) return;
      try {
        await cartService.removeFromCart(item.dbId);
        await reload();
      } catch (error: any) {
        alert(error?.message || 'Không thể xoá sản phẩm');
      }
    },
    [cart, reload]
  );

  // Cập nhật số lượng (giá trị tuyệt đối)
  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1) return;
      const item = cart.find((i) => i.id === id);
      if (!item?.dbId) return;
      try {
        await cartService.updateQuantity(item.dbId, quantity);
        await reload();
      } catch (error: any) {
        alert(error?.message || 'Không thể cập nhật số lượng');
      }
    },
    [cart, reload]
  );

  const increaseQuantity = useCallback(
    async (id: string) => {
      const item = cart.find((i) => i.id === id);
      if (!item) return;
      await updateQuantity(id, item.quantity + 1);
    },
    [cart, updateQuantity]
  );

  const decreaseQuantity = useCallback(
    async (id: string) => {
      const item = cart.find((i) => i.id === id);
      if (!item || item.quantity <= 1) return;
      await updateQuantity(id, item.quantity - 1);
    },
    [cart, updateQuantity]
  );

  // Xóa toàn bộ giỏ hàng (gọi API)
  const clearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
      setCart([]);
    } catch (error: any) {
      alert(error?.message || 'Không thể xoá giỏ hàng');
    }
  }, [setCart]);

  return {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    reload,
  };
};
