import { Product } from '../types/product';
import { CartItem } from '../types/cart';

// The backend is authoritative; missing permission fails closed on older APIs.
export const canPurchase = (product: Product) => product.canSell === true && product.soLuong > 0;
export const canCheckoutItem = (item: CartItem) => item.canCheckout === true && item.canSell === true
  && item.soLuong > 0 && item.soLuong <= (item.soLuongTon ?? 0);
export const saleMessage = (item: { saleMessage?: string }) => item.saleMessage || 'Tác phẩm hiện chưa đủ điều kiện mở bán.';
