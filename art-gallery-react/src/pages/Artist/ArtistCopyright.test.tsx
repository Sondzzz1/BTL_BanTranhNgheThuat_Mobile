import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArtistCopyright from './ArtistCopyright';
import { CopyrightEvidence, CopyrightRecord, copyrightService } from '../../services/copyrightService';

jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '7' }), useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../services/copyrightService', () => ({ copyrightService: {
  artistGet: jest.fn(), artistAddEvidence: jest.fn(), artistDeleteEvidence: jest.fn(),
  artistCreate: jest.fn(), artistUpdate: jest.fn(), downloadEvidence: jest.fn(),
} }));
jest.mock('../../services/artistDashboardService', () => ({ artistDashboardService: {
  getPublicOriginalArtwork: jest.fn(), searchOriginalArtworks: jest.fn(),
} }));

const service = copyrightService as jest.Mocked<typeof copyrightService>;
let record: CopyrightRecord;
let nextEvidenceId: number;
const evidence = (id: number, name = `evidence-${id}.pdf`): CopyrightEvidence => ({
  maBangChung: id, tenTepGoc: name, loaiTep: 'application/pdf', kichThuoc: 100,
  ngayTao: '2026-10-12', duongDanTai: `/api/ban-quyen/3/bang-chung/${id}/tep`,
});
const file = (name: string, type = 'image/png') => new File(['content'], name, { type, lastModified: 1234 });
const choose = (...files: File[]) => fireEvent.change(screen.getByLabelText('Chọn tệp bằng chứng'), { target: { files } });
const uploadButton = () => screen.getByRole('button', { name: /^Tải lên/ });

async function openPage() {
  render(<ArtistCopyright />);
  await screen.findByRole('heading', { name: 'Tranh fixture' });
}

beforeEach(() => {
  jest.resetAllMocks();
  nextEvidenceId = 100;
  record = {
    maBanQuyen: 3, maTacPham: 7, tenTacPham: 'Tranh fixture', maHoaSi: 2, tenHoaSi: 'Họa sĩ fixture',
    tacGia: 'Tác giả fixture', nguonGoc: 'Tự sáng tác', trangThai: 'PENDING', trangThaiSo: 0,
    laTacPhamDocBan: false, soLuongBanDau: 20, soLuongTon: 20, soDonHang: 0,
    loaiTacPhamText: 'Tự sáng tác', loaiTacPham: 0, canCuSuDung: 'AUTHOR_OR_RIGHTS_OWNER',
    laDuLieuCu: false, biChanBan: false, bangChung: [evidence(1)],
  };
  service.artistGet.mockImplementation(async () => record);
  service.artistAddEvidence.mockImplementation(async (_id, selected, note) => {
    record = { ...record, trangThai: 'PENDING', bangChung: [...record.bangChung, {
      ...evidence(nextEvidenceId++, selected.name), moTa: note,
    }] };
  });
  service.artistDeleteEvidence.mockImplementation(async (_id, id) => {
    record = { ...record, bangChung: record.bangChung.filter(item => item.maBangChung !== id) };
  });
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => jest.restoreAllMocks());

test('add-evidence button opens the multi-file picker without changing existing evidence', async () => {
  await openPage();
  const picker = screen.getByLabelText('Chọn tệp bằng chứng') as HTMLInputElement;
  const click = jest.spyOn(picker, 'click');
  fireEvent.click(screen.getByRole('button', { name: /Thêm bằng chứng/ }));
  expect(click).toHaveBeenCalledTimes(1);
  expect(picker.multiple).toBe(true);
  expect(screen.getByRole('heading', { name: 'Bằng chứng (1/10)' })).toBeInTheDocument();
  expect(service.artistAddEvidence).not.toHaveBeenCalled();
});

test('multiple files can be added across selections and uploaded again without losing form edits', async () => {
  await openPage();
  expect(screen.getByLabelText('Chọn tệp bằng chứng')).toHaveAttribute('multiple');
  const first = file('process.png');
  const second = file('permission.pdf', 'application/pdf');
  const third = file('signature.webp', 'image/webp');
  choose(first, second);
  choose(third);
  expect(service.artistAddEvidence).not.toHaveBeenCalled();
  expect(screen.getByText(/đã chọn 3 tệp chưa tải/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Mô tả cho process.png'), { target: { value: '  Quá trình sáng tác  ' } });
  fireEvent.change(screen.getByLabelText('Mô tả cho permission.pdf'), { target: { value: 'Giấy cho phép' } });
  fireEvent.change(screen.getByLabelText('Ghi chú'), { target: { value: 'Chưa lưu ghi chú này' } });
  fireEvent.click(uploadButton());
  await screen.findByRole('heading', { name: 'Bằng chứng (4/10)' });
  expect(service.artistAddEvidence.mock.calls).toEqual([
    [3, first, 'Quá trình sáng tác'], [3, second, 'Giấy cho phép'], [3, third, undefined],
  ]);
  expect(screen.getByLabelText('Ghi chú')).toHaveValue('Chưa lưu ghi chú này');
  expect(screen.queryByLabelText('Mô tả cho process.png')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Thêm bằng chứng/ })).toBeEnabled();
  choose(file('extra.jpg', 'image/jpeg'));
  fireEvent.click(uploadButton());
  await screen.findByRole('heading', { name: 'Bằng chứng (5/10)' });
  expect(service.artistAddEvidence).toHaveBeenCalledTimes(4);
  expect(screen.getByText('evidence-1.pdf')).toBeInTheDocument();
});

test('successful files are not resent after a partial upload failure', async () => {
  await openPage();
  const first = file('first.png');
  const failed = file('failed.png');
  const last = file('last.png');
  const uploadNormally = service.artistAddEvidence.getMockImplementation()!;
  service.artistAddEvidence
    .mockImplementationOnce(uploadNormally)
    .mockRejectedValueOnce({ response: { data: { message: 'Lỗi mạng thử nghiệm' } } });
  choose(first, failed, last);
  fireEvent.change(screen.getByLabelText('Mô tả cho failed.png'), { target: { value: 'Giữ mô tả khi thử lại' } });
  fireEvent.click(uploadButton());
  await screen.findByRole('alert');
  await waitFor(() => expect(uploadButton()).toBeEnabled());
  expect(screen.getByRole('alert')).toHaveTextContent('failed.png');
  expect(screen.getByRole('alert')).toHaveTextContent('Lỗi mạng thử nghiệm');
  expect(screen.queryByLabelText('Mô tả cho first.png')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Mô tả cho failed.png')).toHaveValue('Giữ mô tả khi thử lại');
  expect(screen.getByLabelText('Mô tả cho last.png')).toBeInTheDocument();
  fireEvent.click(uploadButton());
  await screen.findByRole('heading', { name: 'Bằng chứng (4/10)' });
  expect(service.artistAddEvidence.mock.calls.map(call => call[1].name)).toEqual(['first.png', 'failed.png', 'failed.png', 'last.png']);
});

test('upload controls prevent concurrent duplicate submissions', async () => {
  await openPage();
  let finish!: () => void;
  service.artistAddEvidence.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  choose(file('slow.png'));
  fireEvent.click(uploadButton());
  const progressButton = screen.getByRole('button', { name: 'Đang tải 0/1 tệp…' });
  expect(progressButton).toBeDisabled();
  expect(screen.getByRole('button', { name: /Thêm bằng chứng/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cập nhật và gửi lại kiểm tra' })).toBeDisabled();
  fireEvent.click(progressButton);
  expect(service.artistAddEvidence).toHaveBeenCalledTimes(1);
  await act(async () => { finish(); });
  await waitFor(() => expect(screen.getByRole('button', { name: /Thêm bằng chứng/ })).toBeEnabled());
});

test('existing and selected evidence together cannot exceed ten files', async () => {
  record.bangChung = Array.from({ length: 9 }, (_, index) => evidence(index + 1));
  await openPage();
  choose(file('one.png'), file('two.png'));
  expect(screen.getByRole('alert')).toHaveTextContent('chỉ có thể chọn thêm 1 tệp');
  expect(uploadButton()).toBeDisabled();
  choose(file('one.png'));
  expect(screen.getByRole('button', { name: /Thêm bằng chứng/ })).toBeDisabled();
  fireEvent.click(uploadButton());
  await screen.findByRole('heading', { name: 'Bằng chứng (10/10)' });
  expect(screen.getByRole('button', { name: /Thêm bằng chứng/ })).toBeDisabled();
  expect(service.artistAddEvidence).toHaveBeenCalledTimes(1);
});

test('selection can be removed and selecting the same queued file does not duplicate it', async () => {
  await openPage();
  const selected = file('one.png');
  choose(selected);
  choose(selected);
  expect(screen.getByText(/đã chọn 1 tệp chưa tải/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ tệp one.png' }));
  expect(uploadButton()).toBeDisabled();
  choose(selected);
  expect(screen.getByLabelText('Mô tả cho one.png')).toBeInTheDocument();
  expect(service.artistAddEvidence).not.toHaveBeenCalled();
});

test.each(['type', 'empty', 'size'])('rejects invalid files before uploading: %s', async invalid => {
  await openPage();
  const selected = invalid === 'empty' ? new File([], 'empty.png', { type: 'image/png' })
    : file('invalid.png', invalid === 'type' ? 'text/plain' : 'image/png');
  if (invalid === 'size') Object.defineProperty(selected, 'size', { value: 5 * 1024 * 1024 + 1 });
  choose(selected);
  expect(screen.getByRole('alert')).toHaveTextContent('không hợp lệ');
  expect(uploadButton()).toBeDisabled();
  expect(service.artistAddEvidence).not.toHaveBeenCalled();
});

test.each(['VERIFIED', 'DISPUTED', 'REVOKED'])('locked record cannot add evidence: %s', async status => {
  record.trangThai = status;
  await openPage();
  expect(screen.queryByRole('button', { name: /Thêm bằng chứng/ })).not.toBeInTheDocument();
  expect(screen.getByText(/không được thêm hay thay đổi bằng chứng/)).toBeInTheDocument();
  expect(service.artistAddEvidence).not.toHaveBeenCalled();
});

test.each(['NEED_INFO', 'REJECTED', 'LEGACY'])('record that permits supplementation can add more than one file: %s', async status => {
  record.trangThai = status;
  await openPage();
  choose(file('process.png'), file('signature.png'));
  fireEvent.click(uploadButton());
  await screen.findByRole('heading', { name: 'Bằng chứng (3/10)' });
  expect(service.artistAddEvidence).toHaveBeenCalledTimes(2);
});

test('deleting saved evidence keeps pending files and unsaved form fields', async () => {
  await openPage();
  choose(file('waiting.png'));
  fireEvent.change(screen.getByLabelText('Ghi chú'), { target: { value: 'Giữ nội dung chưa lưu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
  await screen.findByRole('heading', { name: 'Bằng chứng (0/10)' });
  expect(screen.getByLabelText('Mô tả cho waiting.png')).toBeInTheDocument();
  expect(screen.getByLabelText('Ghi chú')).toHaveValue('Giữ nội dung chưa lưu');
  expect(service.artistDeleteEvidence).toHaveBeenCalledWith(3, 1);
});

test('refresh failure does not put successfully uploaded files back into the retry queue', async () => {
  await openPage();
  service.artistGet.mockRejectedValueOnce(new Error('Refresh unavailable'));
  choose(file('saved.png'));
  fireEvent.click(uploadButton());
  await screen.findByRole('alert');
  await waitFor(() => expect(uploadButton()).toBeDisabled());
  expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng tải lại trang');
  expect(screen.queryByLabelText('Mô tả cho saved.png')).not.toBeInTheDocument();
  expect(service.artistAddEvidence).toHaveBeenCalledTimes(1);
});
