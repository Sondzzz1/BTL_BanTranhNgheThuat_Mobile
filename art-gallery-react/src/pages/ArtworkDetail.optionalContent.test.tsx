import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtworkDetail from './ArtworkDetail';
import apiClient from '../services/api';

jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '7' }), useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../context/AppContext', () => ({ useAppContext: () => ({ artworks: [] }) }));
jest.mock('../hooks/useCart', () => ({ useCart: () => ({ addToCart: jest.fn() }) }));
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock('../components/RecommendedArtworks', () => () => null);
jest.mock('../components/FavoriteButton', () => () => null);
jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../services/artworkService', () => ({ artworkService: { getArtworkById: async () => ({
  id: '7', tenTranh: 'Public artwork', giaBan: 100000, soLuongTon: 1,
  anhTranh: 'https://example.com/art.jpg', moTa: 'Basic description remains visible', danhMuc: 'Sơn dầu', tenHoaSi: 'Artist',
}) } }));

test('artwork 200 with optional detail 404 does not fail the entire public page', async () => {
  (apiClient.get as jest.Mock).mockRejectedValue({ response: { status: 404 } });
  render(<ArtworkDetail />);
  await screen.findByText('Public artwork');
  await screen.findByText(/Basic description remains visible/);
  expect(screen.queryByText('Không tìm thấy tác phẩm')).toBeNull();
  expect(screen.getByRole('button', { name: /Thêm vào giỏ/i })).toBeInTheDocument();
});
