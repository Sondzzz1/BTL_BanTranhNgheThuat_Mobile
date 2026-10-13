import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import ArtworkDetailManagement from './ArtworkDetailManagement';
import apiClient from '../../services/api';
import { artistDashboardService } from '../../services/artistDashboardService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '7' }), useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../services/artistDashboardService', () => ({ artistDashboardService: { getTacPhamCuaToi: jest.fn() } }));
jest.mock('../../services/categoryService', () => ({ categoryService: { getAllCategories: async () => [] } }));

const get = apiClient.get as jest.Mock;
const service = artistDashboardService as jest.Mocked<typeof artistDashboardService>;
const artwork = { maTacPham: 7, tenTacPham: 'Mùa hè oi ả', gia: 1500000, soLuong: 14,
  trangThai: 1, ngayTao: '2026-05-18T16:31:00', canSell: false, saleMessage: 'Đang xác minh nguồn gốc.' };
let metrics = { tongSoLuongBan: 6, tongDoanhThu: 9000000, soDonHang: 4, soLuongConLai: 14,
  doanhThuThangNay: 3000000, soLuongBanThangNay: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  service.getTacPhamCuaToi.mockResolvedValue([artwork] as any);
  metrics = { tongSoLuongBan: 6, tongDoanhThu: 9000000, soDonHang: 4, soLuongConLai: 14,
    doanhThuThangNay: 3000000, soLuongBanThangNay: 2 };
  get.mockImplementation(async (url: string) => ({ data: url.endsWith('/thong-ke') ? metrics : [] }));
});

const expectValue = (region: HTMLElement, label: string, value: string) => {
  const card = within(region).getByRole('group', { name: label });
  expect(within(card).getByText(label)).toHaveClass('artwork-sales-label');
  expect(card.querySelector('.artwork-sales-value')).toHaveTextContent(value);
  return card;
};

test('renders all six metrics, with separate overall and monthly grids', async () => {
  render(<ArtworkDetailManagement />);
  const region = await screen.findByRole('region', { name: 'Thống Kê Bán Hàng' });
  expect(region).toHaveClass('artwork-sales-stats');
  expect(within(region).getAllByRole('group')).toHaveLength(6);
  expectValue(region, 'Đã bán', '6');
  expectValue(region, 'Tổng doanh thu', '9.000.000 ₫');
  expectValue(region, 'Đơn hàng', '4');
  expectValue(region, 'Còn lại', '14');
  expectValue(region, 'Doanh thu tháng này', '3.000.000 ₫');
  expectValue(region, 'Số lượng bán tháng này', '2');
  expect(region.querySelector('.artwork-sales-grid')?.children).toHaveLength(4);
  expect(region.querySelector('.artwork-sales-monthly')?.children).toHaveLength(2);
  expect(region.querySelector('.stats-section, .stats-grid, .stat-card, .stat-content, .bg-primary')).toBeNull();
  expect(get).toHaveBeenCalledWith('/hoa-si/tac-pham/7/thong-ke');
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('zero statistics remain visible instead of missing labels or values', async () => {
  metrics = { tongSoLuongBan: 0, tongDoanhThu: 0, soDonHang: 0, soLuongConLai: 0,
    doanhThuThangNay: 0, soLuongBanThangNay: 0 };
  render(<ArtworkDetailManagement />);
  const region = await screen.findByRole('region', { name: 'Thống Kê Bán Hàng' });
  ['Đã bán', 'Đơn hàng', 'Còn lại', 'Số lượng bán tháng này'].forEach((label) => expectValue(region, label, '0'));
  ['Tổng doanh thu', 'Doanh thu tháng này'].forEach((label) => expectValue(region, label, '0 ₫'));
});

test('large revenues keep the full formatted amount, not ellipses or abbreviations', async () => {
  metrics.tongDoanhThu = 1234567890123;
  metrics.doanhThuThangNay = 987654321000;
  render(<ArtworkDetailManagement />);
  const region = await screen.findByRole('region', { name: 'Thống Kê Bán Hàng' });
  expectValue(region, 'Tổng doanh thu', '1.234.567.890.123 ₫');
  expectValue(region, 'Doanh thu tháng này', '987.654.321.000 ₫');
});

test('real stylesheet resists conflicting admin/dashboard rules and lets long text wrap', async () => {
  const ownStyle = document.createElement('style');
  ownStyle.textContent = fs.readFileSync(path.resolve(__dirname, 'ArtworkDetailManagement.css'), 'utf8');
  const foreignStyle = document.createElement('style');
  foreignStyle.textContent = `
    .stats-section { display: grid; grid-template-columns: repeat(3, 1fr); }
    .stat-card { width: 90px; height: 90px; }
    .stat-card i { color: orange; }
    .stat-content p { color: #999; }
    .page h4 { color: #2c7be5; }
  `;
  document.head.append(ownStyle, foreignStyle);
  try {
    render(<ArtworkDetailManagement />);
    const region = await screen.findByRole('region', { name: 'Thống Kê Bán Hàng' });
    const card = expectValue(region, 'Tổng doanh thu', '9.000.000 ₫');
    const value = card.querySelector('.artwork-sales-value')!;
    const label = within(card).getByText('Tổng doanh thu');
    expect(getComputedStyle(region).display).toBe('block');
    expect(getComputedStyle(region.querySelector('.artwork-sales-grid')!).display).toBe('grid');
    expect(getComputedStyle(card).minWidth).toBe('0');
    expect(getComputedStyle(card.querySelector('.artwork-sales-copy')!).minWidth).toBe('0');
    expect(getComputedStyle(value).color).toBe('rgb(15, 23, 42)');
    expect(getComputedStyle(label).color).toBe('rgb(71, 85, 105)');
    expect(getComputedStyle(value).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(value).whiteSpace).toBe('normal');
    expect(getComputedStyle(value).textOverflow).not.toBe('ellipsis');
  } finally {
    ownStyle.remove();
    foreignStyle.remove();
  }
});
