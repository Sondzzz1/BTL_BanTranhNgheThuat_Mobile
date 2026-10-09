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
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  get.mockRejectedValue({ response: { status: 404 } });
});
afterEach(() => jest.restoreAllMocks());

test('artist uses private API and cannot submit whitespace-only content', async () => {
  const { container } = render(<ArtworkDetailContent />);
  await screen.findByRole('button', { name: /Tạo & Gửi Duyệt/ });
  expect(get).toHaveBeenCalledWith('/hoa-si/tac-pham/7/chi-tiet');
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
  expect(screen.getByRole('button', { name: /Tạo & Gửi Duyệt/ })).toBeDisabled();
  await act(async () => { finish({}); });
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Tạo chi tiết thành công')));
});
