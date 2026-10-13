import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ArtworkDetail from './ArtworkDetail';
import Cart from './Cart';
import Checkout from './Checkout';
import { artworkService } from '../services/artworkService';
import { orderService } from '../services/orderService';

let mockCart: any[] = [];
const mockNavigate = jest.fn();
const mockReload = jest.fn();
jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '7' }), useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../hooks/useCart', () => ({ useCart: () => ({ cart: mockCart, cartTotal: 100000, reload: mockReload,
  addToCart: jest.fn(), removeFromCart: jest.fn(), increaseQuantity: jest.fn(), decreaseQuantity: jest.fn(), updateQuantity: jest.fn(), clearCart: jest.fn(),
}) }));
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, isAdmin: false,
  user: { id: '1', name: 'Fixture', phone: '0901234567', address: 'Fixture address' },
}) }));
jest.mock('../components/RecommendedArtworks', () => () => null);
jest.mock('../components/FavoriteButton', () => () => null);
jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn().mockRejectedValue({ response: { status: 404 } }) } }));
jest.mock('../services/artworkService', () => ({ artworkService: { getArtworkById: jest.fn() } }));
jest.mock('../services/orderService', () => ({ orderService: { createOrder: jest.fn() } }));
const artworks = artworkService as jest.Mocked<typeof artworkService>;
const orders = orderService as jest.Mocked<typeof orderService>;
const artwork: any = { id: '7', tenTranh: 'Approved artwork', giaBan: 100000, soLuongTon: 3, anhTranh: 'https://example.com/a.jpg', danhMuc: 'Sơn dầu' };
beforeEach(() => {
  mockNavigate.mockReset(); mockReload.mockReset().mockResolvedValue(undefined);
  orders.createOrder.mockReset();
  mockCart = [{ id: '7', dbId: 3, name: 'Approved artwork', price: 100000, quantity: 1, image: '', canSell: true, canCheckout: true }];
});

test('verified and otherwise eligible artwork enables purchasing even with optional detail 404', async () => {
  artworks.getArtworkById.mockResolvedValue({ ...artwork, canSell: true });
  render(<ArtworkDetail />);
  await screen.findByText('Approved artwork');
  expect(screen.getByRole('button', { name: 'Mua ngay' })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeEnabled();
});

test('approved rights-pending artwork remains visible but buying controls are disabled', async () => {
  artworks.getArtworkById.mockResolvedValue({ ...artwork, canSell: false, saleReason: 'RIGHTS_PENDING', saleMessage: 'Đang hoàn thiện xác minh nguồn gốc và quyền sử dụng.' });
  render(<ArtworkDetail />);
  await screen.findByText('Approved artwork');
  expect(screen.getByText(/Đang hoàn thiện xác minh nguồn gốc/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mua ngay' })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Thêm vào giỏ/ })).toBeDisabled();
});

test('revoked cart line is kept visible but cannot be checked out', () => {
  mockCart[0] = { ...mockCart[0], canSell: false, canCheckout: false, saleMessage: 'Tác phẩm hiện không khả dụng để mua.' };
  render(<Cart />);
  expect(screen.getByText(/Không còn khả dụng/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tiến hành thanh toán' })).toBeDisabled();
});

test('valid cart can proceed to checkout', () => {
  render(<Cart />);
  fireEvent.click(screen.getByRole('button', { name: 'Tiến hành thanh toán' }));
  expect(mockNavigate).toHaveBeenCalledWith('/checkout');
});

test('backend rejection after the checkout page loaded remains readable without success navigation', async () => {
  orders.createOrder.mockRejectedValue(new Error('Tác phẩm hiện không khả dụng để mua.'));
  const { container } = render(<Checkout />);
  fireEvent.submit(container.querySelector('form')!);
  await screen.findByText('Tác phẩm hiện không khả dụng để mua.');
  expect(mockNavigate).not.toHaveBeenCalledWith('/user/orders');
  expect(orders.createOrder).toHaveBeenCalledTimes(1);
});
