import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminCustomArt from './Admin/AdminCustomArt';
import ArtistCustomArt from './Artist/ArtistCustomArt';
import CustomArtRequirements from '../components/CustomArtRequirements';
import { CustomArtRequestApi, customArtService, getAuthenticatedCustomArtFileUrl } from '../services/customArtService';

let mockSearch = '';
jest.mock('react-router-dom', () => ({ useLocation: () => ({ search: mockSearch }) }), { virtual: true });
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: '7' } }) }));
jest.mock('../services/api', () => ({ __esModule: true, default: {} }));
jest.mock('../services/customArtService', () => ({
  ...jest.requireActual('../services/customArtService'),
  getAuthenticatedCustomArtFileUrl: jest.fn(),
  customArtService: {
    getAllRequests: jest.fn(), getArtistRequests: jest.fn(), getById: jest.fn(), getPayments: jest.fn(),
    approve: jest.fn(), requestPermission: jest.fn(), reject: jest.fn(), claimRequest: jest.fn(),
    createQuote: jest.fn(), createProgress: jest.fn(), complete: jest.fn(), updateStatus: jest.fn(),
  },
}));

const service = customArtService as jest.Mocked<typeof customArtService>;
const fileUrl = getAuthenticatedCustomArtFileUrl as jest.MockedFunction<typeof getAuthenticatedCustomArtFileUrl>;
const request: CustomArtRequestApi = {
  maYeuCau: 35, maKhachHang: 8, tenKhachHang: 'Khách Mobile', maHoaSi: 7,
  tieuDe: 'Vẽ khu vườn theo yêu cầu', type: 'ORIGINAL_COMMISSION',
  loaiTranh: 'Sơn mài theo lựa chọn Khác', kichThuoc: '75x120 cm',
  chuDe: 'Khu vườn', phongCach: 'Phong cách phối hợp riêng', mauSac: 'Xanh ngọc và vàng nhạt',
  chatLieu: 'Lụa thủ công', moTa: 'Giữ lại cây cổ thụ.\nKhông vẽ người trong tranh.',
  giaDuKien: 4500000, ngayHoanThanhDuKien: '2030-12-15T00:00:00',
  trangThai: 'ACCEPTED', trangThaiNoiBo: 'Quoted', ngayTao: '2030-11-01T10:00:00', progress: [],
  quote: { maBaoGia: 1, maYeuCau: 35, maHoaSi: 7, giaBaoGia: 6000000,
    thoiGianHoanThanh: '2030-12-20', trangThai: 'CustomerAccepted', ngayTao: '2030-11-02T10:00:00' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSearch = '';
  service.getAllRequests.mockResolvedValue([request]);
  service.getArtistRequests.mockResolvedValue([request]);
  service.getById.mockResolvedValue(request);
  service.getPayments.mockResolvedValue([]);
  fileUrl.mockReset().mockImplementation(async (path) => path ? `blob:${path}` : undefined);
  URL.revokeObjectURL = jest.fn();
});

test('Admin notification opens the exact request and assigned artist even outside the list', async () => {
  mockSearch = '?requestId=35';
  service.getAllRequests.mockResolvedValue([]);
  service.getById.mockResolvedValue({ ...request, tenHoaSiThucHien: 'Trịnh Tuấn', trangThaiNoiBo: 'Assigned' });
  render(<AdminCustomArt />);
  expect(await screen.findByRole('region', { name: 'Yêu cầu của khách hàng' })).toBeInTheDocument();
  expect(screen.getByText('Trịnh Tuấn')).toBeInTheDocument();
  expect(service.getById).toHaveBeenCalledWith(35);
});

test.each(['0', '-1', 'abc', '2147483648', '35&requestId=36'])('invalid notification target %s does not fetch a request', async (value) => {
  mockSearch = `?requestId=${value}`;
  render(<AdminCustomArt />);
  expect(await screen.findByText('Liên kết yêu cầu vẽ tranh không hợp lệ.')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument());
  expect(service.getById).not.toHaveBeenCalled();
});

test('a late response for an older notification cannot replace the currently selected request', async () => {
  mockSearch = '?requestId=35';
  let finishOld!: (value: CustomArtRequestApi) => void;
  service.getById.mockImplementation(async (id) => id === 35
    ? new Promise((resolve) => { finishOld = resolve; })
    : { ...request, maYeuCau: 36, tieuDe: 'Yêu cầu mới hơn', tenHoaSiThucHien: 'Họa sĩ mới' });
  const { rerender } = render(<AdminCustomArt />);
  await waitFor(() => expect(service.getById).toHaveBeenCalledWith(35));
  mockSearch = '?requestId=36';
  rerender(<AdminCustomArt />);
  await screen.findByRole('heading', { name: 'Yêu cầu mới hơn' });
  await act(async () => { finishOld(request); });
  expect(screen.getByRole('heading', { name: 'Yêu cầu mới hơn' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: request.tieuDe })).not.toBeInTheDocument();
});

const expectField = (region: HTMLElement, label: string, value: string) => {
  expect(within(region).getByText(label).closest('div')).toHaveTextContent(value);
};

describe.each([
  { role: 'Admin', Page: AdminCustomArt },
  { role: 'Họa sĩ', Page: ArtistCustomArt },
])('$role xem yêu cầu Mobile', ({ role, Page }) => {
  const openDetail = async () => {
    render(<Page />);
    if (role === 'Admin') fireEvent.click(await screen.findByText(request.tieuDe));
    else fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }));
    return screen.findByRole('region', { name: 'Yêu cầu của khách hàng' });
  };

  test('hiển thị mọi thông số, cả giá trị Khác, riêng với báo giá của họa sĩ', async () => {
    const region = await openDetail();
    expectField(region, 'Khách hàng', 'Khách Mobile');
    expectField(region, 'Loại yêu cầu', 'Ý tưởng mới');
    expectField(region, 'Loại tranh', request.loaiTranh);
    expectField(region, 'Kích thước', request.kichThuoc);
    expectField(region, 'Phong cách', request.phongCach!);
    expectField(region, 'Màu sắc', request.mauSac!);
    expectField(region, 'Chất liệu', request.chatLieu!);
    expectField(region, 'Chủ đề', request.chuDe!);
    expectField(region, 'Ngân sách dự kiến', '4.500.000 ₫');
    expectField(region, 'Hạn mong muốn', '15/12/2030');
    expect(within(region).getByText(/Giữ lại cây cổ thụ/)).toHaveTextContent('Không vẽ người trong tranh.');
    expect(screen.getByText('6.000.000 ₫')).toBeInTheDocument();
    expect(within(region).queryByText('6.000.000 ₫')).not.toBeInTheDocument();
    expect(service.getById).toHaveBeenCalledWith(35);
  });

  test('hiển thị khai báo quyền và ảnh cá nhân', async () => {
    service.getById.mockResolvedValue({ ...request, type: 'PERSONAL_REFERENCE',
      daXacNhanQuyenTaiLieu: true, anhThamKhao: '/api/commission/35/reference' });
    const region = await openDetail();
    expectField(region, 'Loại yêu cầu', 'Ảnh/tài liệu cá nhân');
    expect(within(region).getByText(/Khách hàng đã xác nhận có quyền/)).toBeInTheDocument();
    expect(await within(region).findByRole('img', { name: 'Ảnh tham khảo' })).toHaveAttribute('src', 'blob:/api/commission/35/reference');
    expect(within(region).queryByText('Tác giả gốc')).not.toBeInTheDocument();
  });

  test('hiển thị đầy đủ tác phẩm gốc, quyền, cả hai ảnh và bằng chứng', async () => {
    service.getById.mockResolvedValue({ ...request, type: 'EXISTING_ARTWORK',
      referenceArtworkId: 12, referenceArtworkName: 'Vườn xưa', referenceArtistName: 'Nguyễn Nguồn',
      nguonTacPhamGoc: 'https://example.com/tac-pham-goc', tinhTrangQuyenSuDung: 'PermissionGranted',
      moTaQuyenSuDung: 'Đã được tác giả cho phép vẽ theo mẫu.',
      anhThamKhao: '/api/commission/35/reference', referenceImageUrl: '/api/commission/35/source',
      bangChungQuyenSuDung: '/api/commission/35/evidence' });
    const region = await openDetail();
    expectField(region, 'Loại yêu cầu', 'Dựa trên tác phẩm có sẵn');
    expectField(region, 'Tác phẩm gốc', 'Vườn xưa');
    expectField(region, 'Tác giả gốc', 'Nguyễn Nguồn');
    expectField(region, 'Mã tác phẩm gốc', '#12');
    expectField(region, 'Nguồn tác phẩm gốc', 'https://example.com/tac-pham-goc');
    expectField(region, 'Tình trạng quyền sử dụng', 'Tôi đã được cho phép');
    expectField(region, 'Mô tả quyền sử dụng', 'Đã được tác giả cho phép vẽ theo mẫu.');
    expect(await within(region).findByRole('link', { name: 'Mở bằng chứng quyền sử dụng' })).toHaveAttribute('href', 'blob:/api/commission/35/evidence');
    expect(within(region).getByRole('img', { name: 'Ảnh tham khảo' })).toBeInTheDocument();
    expect(within(region).getByRole('img', { name: 'Ảnh tác phẩm gốc' })).toBeInTheDocument();
    expect(fileUrl).toHaveBeenCalledWith('/api/commission/35/reference');
    expect(fileUrl).toHaveBeenCalledWith('/api/commission/35/source');
    expect(fileUrl).toHaveBeenCalledWith('/api/commission/35/evidence');
  });

  test('dữ liệu cũ thiếu trường không bị thay bằng lựa chọn mặc định', async () => {
    service.getById.mockResolvedValue({ ...request, phongCach: undefined, mauSac: '', chatLieu: ' ',
      chuDe: undefined, giaDuKien: undefined, ngayHoanThanhDuKien: null, moTa: null });
    const region = await openDetail();
    ['Phong cách', 'Màu sắc', 'Chất liệu', 'Chủ đề', 'Ngân sách dự kiến', 'Hạn mong muốn', 'Mô tả yêu cầu']
      .forEach((label) => expectField(region, label, 'Chưa cung cấp'));
  });

  test('tệp lỗi không chặn thông số và các tệp khác', async () => {
    service.getById.mockResolvedValue({ ...request, anhThamKhao: '/missing', referenceImageUrl: '/source' });
    fileUrl.mockImplementation(async (path) => {
      if (path === '/missing') throw new Error('404');
      return path ? `blob:${path}` : undefined;
    });
    const region = await openDetail();
    expectField(region, 'Kích thước', '75x120 cm');
    expect(await within(region).findByText(/Không tải được tệp/)).toBeInTheDocument();
    expect(within(region).getByRole('img', { name: 'Ảnh tác phẩm gốc' })).toHaveAttribute('src', 'blob:/source');
  });
});

test.each([
  ['AuthorOrRightsOwner', 'Tôi là tác giả/chủ sở hữu quyền'],
  ['PERMISSION_GRANTED', 'Tôi đã được cho phép'],
  ['PermittedScope', 'Tác phẩm thuộc phạm vi có thể sử dụng'],
  ['UNSURE', 'Tôi không chắc về quyền sử dụng'],
])('dịch tình trạng quyền sử dụng %s', async (permission, label) => {
  render(<CustomArtRequirements request={{ ...request, type: 'EXISTING_ARTWORK', tinhTrangQuyenSuDung: permission }} />);
  expectField(screen.getByRole('region'), 'Tình trạng quyền sử dụng', label);
  await waitFor(() => expect(fileUrl).not.toHaveBeenCalled());
});

test('không biến xác nhận quyền tài liệu còn thiếu thành đã xác nhận', async () => {
  render(<CustomArtRequirements request={{ ...request, type: 'PERSONAL_REFERENCE', daXacNhanQuyenTaiLieu: false }} />);
  expect(screen.getByText('Khách hàng chưa xác nhận quyền sử dụng ảnh/tài liệu.')).toBeInTheDocument();
  await waitFor(() => expect(fileUrl).not.toHaveBeenCalled());
});

test('thu hồi URL riêng tư khi đóng chi tiết', async () => {
  const { unmount } = render(<CustomArtRequirements request={{ ...request, anhThamKhao: '/reference' }} />);
  await screen.findByRole('img', { name: 'Ảnh tham khảo' });
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:/reference');
});

test('thu hồi cả URL của tệp tải xong sau khi đã đóng chi tiết', async () => {
  let resolveFile!: (value: string) => void;
  fileUrl.mockImplementation(() => new Promise((resolve) => { resolveFile = resolve; }));
  const { unmount } = render(<CustomArtRequirements request={{ ...request, anhThamKhao: '/reference' }} />);
  unmount();
  await act(async () => { resolveFile('blob:late-reference'); });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:late-reference');
});
