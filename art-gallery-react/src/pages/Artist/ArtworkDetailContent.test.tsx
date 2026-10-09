import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArtworkDetailContent from './ArtworkDetailContent';
import apiClient from '../../services/api';

jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '7' }), useNavigate: () => jest.fn(),
  Link: ({ children }: any) => <span>{children}</span> }), { virtual: true });
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const put = apiClient.put as jest.Mock;
const artwork = { tenTacPham: 'Hoa ly', kichThuoc: '60x80 cm', chatLieu: 'Sơn dầu trên toan', chatLieuKhung: 'Gỗ sồi' };
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  get.mockImplementation((url: string) => url === '/hoa-si/tac-pham/7'
    ? Promise.resolve({ data: artwork }) : Promise.reject({ response: { status: 404 } }));
});
afterEach(() => jest.restoreAllMocks());

test('artist uses private API and cannot submit whitespace-only content', async () => {
  const { container } = render(<ArtworkDetailContent />);
  await screen.findByRole('button', { name: /Tạo & Gửi Duyệt/ });
  expect(get).toHaveBeenCalledWith('/hoa-si/tac-pham/7/chi-tiet');
  expect(get).toHaveBeenCalledWith('/hoa-si/tac-pham/7');
  expect(screen.getByLabelText('Kích Thước')).toHaveValue(artwork.kichThuoc);
  expect(screen.getByLabelText('Chất Liệu Tranh')).toHaveValue(artwork.chatLieu);
  expect(screen.getByLabelText('Chất Liệu Khung')).toHaveValue(artwork.chatLieuKhung);
  fireEvent.change(container.querySelector('textarea')!, { target: { value: '   ' } });
  fireEvent.submit(container.querySelector('form')!);
  expect(window.alert).toHaveBeenCalledWith('Vui lòng nhập nội dung chi tiết hoặc ảnh bổ sung trước khi gửi duyệt.');
  expect(post).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});

test('double submit makes only one detail POST and never sends a basic description', async () => {
  let finish!: (value: any) => void;
  post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { container } = render(<ArtworkDetailContent />);
  await screen.findByRole('button', { name: /Tạo & Gửi Duyệt/ });
  fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Story only' } });
  fireEvent.submit(container.querySelector('form')!);
  fireEvent.submit(container.querySelector('form')!);
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith('/hoa-si/tac-pham/7/chi-tiet', expect.objectContaining({ cauChuyenSangTac: 'Story only' }));
  expect(post.mock.calls[0][1]).not.toHaveProperty('moTa');
  expect(post.mock.calls[0][1]).not.toHaveProperty('kichThuoc');
  expect(post.mock.calls[0][1]).not.toHaveProperty('chatLieu');
  expect(post.mock.calls[0][1]).not.toHaveProperty('chatLieuKhung');
  expect(screen.getByRole('button', { name: /Đang gửi/ })).toBeDisabled();
  await act(async () => { finish({}); });
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Tạo chi tiết thành công')));
});

test.each([0, 1, 2])('existing detail at status %s displays canonical artwork specifications, not legacy detail values', async trangThai => {
  get.mockImplementation((url: string) => Promise.resolve({ data: url === '/hoa-si/tac-pham/7' ? artwork : {
    maChiTiet: 1, trangThai, trangThaiText: 'Trạng thái nội dung', cauChuyenSangTac: 'Câu chuyện riêng',
    kichThuoc: 'Kích thước cũ', chatLieu: 'Chất liệu cũ', chatLieuKhung: 'Khung cũ',
  } }));
  render(<ArtworkDetailContent />);
  const size = await screen.findByLabelText('Kích Thước');
  expect(size).toHaveValue(artwork.kichThuoc);
  expect(screen.getByLabelText('Chất Liệu Tranh')).toHaveValue(artwork.chatLieu);
  expect(screen.getByLabelText('Chất Liệu Khung')).toHaveValue(artwork.chatLieuKhung);
  expect(size).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Chất Liệu Tranh')).toHaveAttribute('readonly');
  expect(screen.getByLabelText('Chất Liệu Khung')).toHaveAttribute('readonly');
  expect(screen.getByDisplayValue('Câu chuyện riêng')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Câu chuyện riêng')).not.toBeDisabled();
  expect(post).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});

test('missing artwork does not become a new-detail form even when detail is also missing', async () => {
  get.mockRejectedValue({ response: { status: 404, data: { message: 'Không tìm thấy tác phẩm' } } });
  const { container } = render(<ArtworkDetailContent />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy tác phẩm');
  expect(container.querySelector('form')).toBeNull();
  expect(post).not.toHaveBeenCalled();
});

test('unprovided artwork specifications remain blank instead of falling back to unrelated detail', async () => {
  get.mockImplementation((url: string) => url === '/hoa-si/tac-pham/7'
    ? Promise.resolve({ data: { tenTacPham: 'Chưa khai báo thông số', kichThuoc: null, chatLieu: null, chatLieuKhung: null } })
    : Promise.reject({ response: { status: 404 } }));
  render(<ArtworkDetailContent />);
  expect(await screen.findByLabelText('Kích Thước')).toHaveValue('');
  expect(screen.getByLabelText('Chất Liệu Tranh')).toHaveValue('');
  expect(screen.getByLabelText('Chất Liệu Khung')).toHaveValue('');
});

test('artist edits approved content, resubmits it, and edits it again after another approval', async () => {
  let stored: any = { maChiTiet: 9, trangThai: 1, trangThaiText: 'Đã duyệt', cauChuyenSangTac: 'Câu chuyện đã duyệt',
    yNghiaNghiThuat: 'Ý nghĩa cũ', kyThuatThucHien: 'Kỹ thuật cũ', camHungSangTao: 'Cảm hứng cũ',
    thongTinBosung: 'Thông tin cũ', namSangTac: 1880, diaDiemSangTac: 'Hà Nội', hinhAnh1: '/api/public/noi-dung-tep/old.png' };
  get.mockImplementation((url: string) => Promise.resolve({ data: url === '/hoa-si/tac-pham/7' ? artwork : stored }));
  put.mockImplementation(async (_url: string, payload: any) => {
    stored = { ...stored, ...payload, trangThai: 0, trangThaiText: 'Chờ duyệt' };
    return {};
  });
  const first = render(<ArtworkDetailContent />);
  const story = await screen.findByDisplayValue('Câu chuyện đã duyệt');
  expect(story).not.toBeDisabled();
  const newContent = ['Câu chuyện sửa lần 1', 'Ý nghĩa mới', 'Kỹ thuật mới', 'Cảm hứng mới', 'Thông tin mới'];
  first.container.querySelectorAll('textarea').forEach((input, index) => {
    expect(input).not.toBeDisabled();
    fireEvent.change(input, { target: { value: newContent[index] } });
  });
  const year = screen.getByDisplayValue('1880');
  expect(year).not.toBeDisabled();
  expect(year).toBeValid(); // Backend accepts historic creation years from 1000.
  fireEvent.change(screen.getByDisplayValue('Hà Nội'), { target: { value: 'Huế' } });
  fireEvent.submit(first.container.querySelector('form')!);
  await screen.findByText('Chờ duyệt');
  expect(put).toHaveBeenCalledWith('/hoa-si/tac-pham/7/chi-tiet', expect.objectContaining({
    cauChuyenSangTac: newContent[0], yNghiaNghiThuat: newContent[1], kyThuatThucHien: newContent[2],
    camHungSangTao: newContent[3], thongTinBosung: newContent[4], diaDiemSangTac: 'Huế',
    namSangTac: 1880, hinhAnh1: '/api/public/noi-dung-tep/old.png',
  }));
  expect(put.mock.calls[0][1]).not.toHaveProperty('moTa');
  expect(put.mock.calls[0][1]).not.toHaveProperty('kichThuoc');
  expect(post).not.toHaveBeenCalled();
  expect(stored.maChiTiet).toBe(9);
  first.unmount();
  stored = { ...stored, trangThai: 1, trangThaiText: 'Đã duyệt' }; // Simulated Admin approval.
  const second = render(<ArtworkDetailContent />);
  fireEvent.change(await screen.findByDisplayValue(newContent[0]), { target: { value: 'Câu chuyện sửa lần 2' } });
  fireEvent.submit(second.container.querySelector('form')!);
  await screen.findByText('Chờ duyệt');
  expect(put).toHaveBeenCalledTimes(2);
  expect(stored.cauChuyenSangTac).toBe('Câu chuyện sửa lần 2');
  expect(stored.maChiTiet).toBe(9);
  expect(post).not.toHaveBeenCalled();
});

test('approved content still allows replacing supplementary images', async () => {
  get.mockImplementation((url: string) => Promise.resolve({ data: url === '/hoa-si/tac-pham/7' ? artwork : {
    maChiTiet: 9, trangThai: 1, trangThaiText: 'Đã duyệt', cauChuyenSangTac: 'Câu chuyện đã duyệt',
  } }));
  post.mockResolvedValue({ data: { url: '/api/public/noi-dung-tep/new.png' } });
  const { container } = render(<ArtworkDetailContent />);
  await screen.findByDisplayValue('Câu chuyện đã duyệt');
  const upload = container.querySelector('input[type="file"]')!;
  expect(upload).not.toBeDisabled();
  fireEvent.change(upload, { target: { files: [new File(['image'], 'detail.png', { type: 'image/png' })] } });
  await waitFor(() => expect(screen.getByAltText('Hình Ảnh 1')).toHaveAttribute('src', 'http://localhost:5273/api/public/noi-dung-tep/new.png'));
  expect(post).toHaveBeenCalledWith('/hoa-si/tac-pham/7/chi-tiet/anh', expect.any(FormData), expect.any(Object));
  expect(put).not.toHaveBeenCalled(); // Upload does not automatically submit the detail.
});

test('restore discards an unsent draft without creating or updating detail', async () => {
  get.mockImplementation((url: string) => Promise.resolve({ data: url === '/hoa-si/tac-pham/7' ? artwork : {
    maChiTiet: 9, trangThai: 1, trangThaiText: 'Đã duyệt', cauChuyenSangTac: 'Nội dung đã lưu',
  } }));
  render(<ArtworkDetailContent />);
  fireEvent.change(await screen.findByDisplayValue('Nội dung đã lưu'), { target: { value: 'Bản sửa chưa gửi' } });
  fireEvent.click(screen.getByRole('button', { name: 'Khôi phục bản đã lưu' }));
  expect(await screen.findByDisplayValue('Nội dung đã lưu')).not.toBeDisabled();
  expect(put).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();
});
