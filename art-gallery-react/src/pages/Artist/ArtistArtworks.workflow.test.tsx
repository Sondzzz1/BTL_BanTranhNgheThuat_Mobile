import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ArtistArtworks from './ArtistArtworks';
import { artistDashboardService } from '../../services/artistDashboardService';
jest.mock('../../utils/requestKey', () => ({ newRequestKey: () => '12345678-1234-4234-9234-123456789012' }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../../services/artistDashboardService', () => ({ artistDashboardService: {
  getTacPhamCuaToi: jest.fn(), getTacPhamById: jest.fn(), taoTacPham: jest.fn(), capNhatTacPham: jest.fn(),
  taoChiTietTacPham: jest.fn(), capNhatChiTietTacPham: jest.fn(), getChiTietTacPham: jest.fn(),
  xoaTacPham: jest.fn(), guiDuyetLaiTacPham: jest.fn(),
} }));
jest.mock('../../services/categoryService', () => ({ categoryService: { getAllCategories: async () => [{ maDanhMuc: 1, tenDanhMuc: 'Sơn dầu' }] } }));
const service = artistDashboardService as jest.Mocked<typeof artistDashboardService>;
const artwork = { maTacPham: 7, tenTacPham: 'Hoa ly', gia: 1000000, maDanhMuc: 1, tenDanhMuc: 'Sơn dầu', soLuong: 1,
  laTacPhamDocBan: true, soLuongBanDau: 1, loaiTacPham: 0, trangThai: 0, moTa: 'Tranh hoa ly...', hinhAnh: 'https://example.com/art.jpg' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(window, 'confirm').mockReturnValue(false);
  service.getTacPhamById.mockResolvedValue(artwork as any);
  service.taoTacPham.mockResolvedValue({ maTacPham: 7 } as any);
  service.capNhatTacPham.mockResolvedValue({} as any);
});

test('all actions stay in one accessible group and preserve navigation', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([artwork] as any);
  render(<ArtistArtworks />);
  const group = await screen.findByRole('group', { name: 'Hành động cho Hoa ly' });
  expect(group).toHaveClass('artwork-row-actions');
  expect(group.closest('td')).toHaveClass('artist-artwork-actions-cell');
  expect(within(group).getAllByRole('button')).toHaveLength(5);
  within(group).getAllByRole('button').forEach((button) => {
    expect(button).toHaveClass('artwork-row-action');
    expect(button).toHaveAttribute('type', 'button');
  });
  fireEvent.click(within(group).getByRole('button', { name: 'Xem thống kê' }));
  expect(mockNavigate).toHaveBeenLastCalledWith('/artist/artworks/7');
  fireEvent.click(within(group).getByRole('button', { name: 'Nội dung chi tiết' }));
  expect(mockNavigate).toHaveBeenLastCalledWith('/artist/artworks/7/content');
  fireEvent.click(within(group).getByRole('button', { name: 'Nguồn gốc và xác minh tác phẩm' }));
  expect(mockNavigate).toHaveBeenLastCalledWith('/artist/artworks/7/copyright');
  fireEvent.click(within(group).getByRole('button', { name: 'Xóa' }));
  expect(window.confirm).toHaveBeenCalledWith('Bạn có chắc muốn xóa tác phẩm này?');
  expect(service.xoaTacPham).not.toHaveBeenCalled();
});

test('rejected artwork keeps the extra resubmit action in the same group', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([{ ...artwork, trangThai: 3, lyDo: 'Cần bổ sung' }] as any);
  render(<ArtistArtworks />);
  const group = await screen.findByRole('group', { name: 'Hành động cho Hoa ly' });
  expect(within(group).getAllByRole('button')).toHaveLength(6);
  expect(within(group).getByRole('button', { name: 'Sửa và gửi duyệt lại' })).toBeInTheDocument();
  fireEvent.click(within(group).getByRole('button', { name: 'Gửi duyệt lại (không sửa)' }));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('gửi duyệt lại tác phẩm "Hoa ly"'));
  expect(service.guiDuyetLaiTacPham).not.toHaveBeenCalled();
});

test('table has its own keyboard-accessible horizontal scrolling region', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([artwork] as any);
  render(<ArtistArtworks />);
  const tableRegion = await screen.findByRole('region', { name: 'Danh sách tác phẩm' });
  expect(tableRegion).toHaveClass('artist-artworks-table-container');
  expect(tableRegion).toHaveAttribute('tabindex', '0');
  expect(within(tableRegion).getByRole('table')).toBeInTheDocument();
});
afterEach(() => jest.restoreAllMocks());

test('basic artwork creation sends description only to the artwork API', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([]);
  const { container } = render(<ArtistArtworks />);
  await screen.findByText('Quản Lý Tác Phẩm');
  fireEvent.click(screen.getByRole('button', { name: /Thêm Tác Phẩm$/ }));
  fireEvent.change(screen.getByPlaceholderText('Ví dụ: Sang Đông'), { target: { value: 'Hoa ly' } });
  fireEvent.change(screen.getByPlaceholderText('Ví dụ: 1000000'), { target: { value: '1000000' } });
  fireEvent.change(screen.getByPlaceholderText('Mô tả về tác phẩm...'), { target: { value: 'Tranh hoa ly...' } });
  fireEvent.change(screen.getByLabelText('Ảnh đại diện tác phẩm'), { target: { value: 'https://example.com/art.jpg' } });
  fireEvent.change(screen.getByLabelText('Căn cứ sử dụng'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Khai báo nguồn gốc/quyền sử dụng'), { target: { value: 'Tôi tự sáng tác và khai báo quyền sử dụng' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Tôi xác nhận khai báo/ }));
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(service.taoTacPham).toHaveBeenCalledWith(expect.objectContaining({ moTa: 'Tranh hoa ly...' }), '12345678-1234-4234-9234-123456789012'));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Thêm tác phẩm thành công')));
  expect(service.taoChiTietTacPham).not.toHaveBeenCalled();
  expect(service.capNhatChiTietTacPham).not.toHaveBeenCalled();
});

test('submitting without a rights declaration is blocked before the create API', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([]);
  const { container } = render(<ArtistArtworks />);
  await screen.findByText('Quản Lý Tác Phẩm');
  fireEvent.click(screen.getByRole('button', { name: /Thêm Tác Phẩm$/ }));
  fireEvent.change(screen.getByPlaceholderText('Ví dụ: Sang Đông'), { target: { value: 'Test' } });
  fireEvent.change(screen.getByPlaceholderText('Ví dụ: 1000000'), { target: { value: '1000000' } });
  fireEvent.change(screen.getByLabelText('Ảnh đại diện tác phẩm'), { target: { value: 'https://example.com/art.jpg' } });
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('khai báo và xác nhận quyền sử dụng')));
  expect(service.taoTacPham).not.toHaveBeenCalled();
});

test('approved artwork that is not sale-eligible displays the distinction and rights link', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([{ ...artwork, trangThai: 1, canSell: false, saleReason: 'RIGHTS_PENDING', saleMessage: 'Đang hoàn thiện xác minh nguồn gốc.' }] as any);
  render(<ArtistArtworks />);
  await screen.findByText('Hoa ly');
  expect(screen.getByText('Tác phẩm đã được duyệt nội dung nhưng chưa đủ điều kiện mở bán.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Nguồn gốc / Bản quyền' })).toBeInTheDocument();
});

test('editing a basic description does not read or resubmit detail content', async () => {
  service.getTacPhamCuaToi.mockResolvedValue([artwork] as any);
  const { container } = render(<ArtistArtworks />);
  await screen.findByText('Hoa ly');
  fireEvent.click(screen.getByTitle('Sửa'));
  fireEvent.change(screen.getByPlaceholderText('Mô tả về tác phẩm...'), { target: { value: 'Mô tả cơ bản mới' } });
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(service.capNhatTacPham).toHaveBeenCalledWith(7, expect.objectContaining({ moTa: 'Mô tả cơ bản mới' })));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Cập nhật tác phẩm thành công!'));
  expect(service.getChiTietTacPham).not.toHaveBeenCalled();
  expect(service.taoChiTietTacPham).not.toHaveBeenCalled();
  expect(service.capNhatChiTietTacPham).not.toHaveBeenCalled();
});
