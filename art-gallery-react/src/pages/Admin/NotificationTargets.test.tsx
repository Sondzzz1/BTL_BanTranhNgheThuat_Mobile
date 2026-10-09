import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminArt from './AdminArt';
import AdminArtworkDetails from './AdminArtworkDetails';
import AdminCopyright from './AdminCopyright';
import { adminService } from '../../services/adminService';
import { copyrightService } from '../../services/copyrightService';
import apiClient from '../../services/api';

let mockSearch = '';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ search: mockSearch }) }), { virtual: true });
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../services/adminService', () => ({ adminService: {
  getAllTacPham: jest.fn(), getTacPhamQuanLy: jest.fn(), getBoLocTacPhamQuanLy: jest.fn(), getCopyrightByArtworkId: jest.fn(),
} }));
jest.mock('../../services/copyrightService', () => ({ copyrightService: {
  adminList: jest.fn(), adminDetail: jest.fn(), adminAudit: jest.fn(),
} }));
const get = apiClient.get as jest.Mock;
const admin = adminService as jest.Mocked<typeof adminService>;
const copyright = copyrightService as jest.Mocked<typeof copyrightService>;
const artwork: any = { maTacPham: 7, tenTacPham: 'Tranh đúng thông báo', tenHoaSi: 'Họa sĩ fixture',
  trangThai: 0, trangThaiText: 'Chờ duyệt', gia: 100000, soLuong: 1, loaiTacPham: 0 };
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  get.mockResolvedValue({ data: [] });
  admin.getAllTacPham.mockResolvedValue([artwork]);
  admin.getTacPhamQuanLy.mockResolvedValue({ items: [], totalItems: 0, totalPages: 0, page: 1, pageSize: 20 });
  admin.getBoLocTacPhamQuanLy.mockResolvedValue({ hoaSi: [], danhMuc: [] });
  admin.getCopyrightByArtworkId.mockResolvedValue(null);
  copyright.adminList.mockResolvedValue([]);
  copyright.adminAudit.mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

test('artwork notification opens exact artwork even outside current filtered page', async () => {
  mockSearch = '?artworkId=7';
  render(<AdminArt />);
  expect(await screen.findByRole('heading', { name: artwork.tenTacPham })).toBeInTheDocument();
  expect(admin.getAllTacPham).toHaveBeenCalledTimes(1);
  expect(admin.getCopyrightByArtworkId).toHaveBeenCalledWith(7);
});

test('edit notification opens edits tab filtered to the requested artwork', async () => {
  mockSearch = '?artworkId=7&tab=edits';
  get.mockResolvedValue({ data: [{ ...artwork, maChinhSua: 3, ngayChinhSua: '2026-10-09' },
    { ...artwork, maTacPham: 8, tenTacPham: 'Không phải mục tiêu', maChinhSua: 4 }] });
  render(<AdminArt />);
  expect(await screen.findByText(artwork.tenTacPham)).toBeInTheDocument();
  expect(screen.queryByText('Không phải mục tiêu')).not.toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/admin/tac-pham-chinh-sua');
});

test('detail notification immediately opens private Admin detail review modal', async () => {
  mockSearch = '?artworkId=7';
  get.mockImplementation((url: string) => Promise.resolve({ data: url.endsWith('/7')
    ? { ...artwork, maChiTiet: 2, cauChuyenSangTac: 'Nội dung chi tiết mục tiêu' } : [] }));
  render(<AdminArtworkDetails />);
  expect(await screen.findByText('Nội dung chi tiết mục tiêu')).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith('/admin/chi-tiet-tac-pham/7');
});

test('copyright notification opens exact copyright record, independent of list filter', async () => {
  mockSearch = '?copyrightId=3';
  copyright.adminDetail.mockResolvedValue({ ...artwork, maBanQuyen: 3, trangThai: 'PENDING', bangChung: [],
    tacGia: 'Tác giả fixture', canCuSuDung: 'AUTHOR_OR_RIGHTS_OWNER' });
  render(<AdminCopyright />);
  expect(await screen.findByRole('heading', { name: artwork.tenTacPham })).toBeInTheDocument();
  await waitFor(() => expect(copyright.adminDetail).toHaveBeenCalledWith(3));
});
