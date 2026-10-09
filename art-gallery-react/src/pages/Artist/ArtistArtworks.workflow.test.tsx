import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArtistArtworks from './ArtistArtworks';
import { artistDashboardService } from '../../services/artistDashboardService';
jest.mock('../../utils/requestKey', () => ({ newRequestKey: () => '12345678-1234-4234-9234-123456789012' }));

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../services/artistDashboardService', () => ({ artistDashboardService: {
  getTacPhamCuaToi: jest.fn(), getTacPhamById: jest.fn(), taoTacPham: jest.fn(), capNhatTacPham: jest.fn(),
  taoChiTietTacPham: jest.fn(), capNhatChiTietTacPham: jest.fn(), getChiTietTacPham: jest.fn(),
} }));
jest.mock('../../services/categoryService', () => ({ categoryService: { getAllCategories: async () => [{ maDanhMuc: 1, tenDanhMuc: 'Sơn dầu' }] } }));
const service = artistDashboardService as jest.Mocked<typeof artistDashboardService>;
const artwork = { maTacPham: 7, tenTacPham: 'Hoa ly', gia: 1000000, maDanhMuc: 1, tenDanhMuc: 'Sơn dầu', soLuong: 1,
  laTacPhamDocBan: true, soLuongBanDau: 1, loaiTacPham: 0, trangThai: 0, moTa: 'Tranh hoa ly...', hinhAnh: 'https://example.com/art.jpg' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  service.getTacPhamById.mockResolvedValue(artwork as any);
  service.taoTacPham.mockResolvedValue({ maTacPham: 7 } as any);
  service.capNhatTacPham.mockResolvedValue({} as any);
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
  fireEvent.submit(container.querySelector('form')!);
  await waitFor(() => expect(service.taoTacPham).toHaveBeenCalledWith(expect.objectContaining({ moTa: 'Tranh hoa ly...' }), '12345678-1234-4234-9234-123456789012'));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Thêm tác phẩm thành công')));
  expect(service.taoChiTietTacPham).not.toHaveBeenCalled();
  expect(service.capNhatChiTietTacPham).not.toHaveBeenCalled();
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
