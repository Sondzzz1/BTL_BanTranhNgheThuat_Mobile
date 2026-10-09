import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ArtworkDetailSection from './ArtworkDetailSection';
import apiClient from '../services/api';

jest.mock('../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = apiClient.get as jest.Mock;
afterEach(() => jest.restoreAllMocks());

test('optional detail 404 retains basic description and does not show empty detail or log an error', async () => {
  get.mockRejectedValue({ response: { status: 404 } });
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  render(<ArtworkDetailSection artworkId={7} artworkName="Test" artworkDescription="Mo ta co ban" />);
  await screen.findByText(/Mo ta co ban/);
  expect(screen.queryByText('Câu Chuyện & Chi Tiết Tác Phẩm')).toBeNull();
  // Testing Library v13 emits its own React act deprecation diagnostic.
  expect(error.mock.calls.filter(([message]) => !String(message).includes('ReactDOMTestUtils.act'))).toHaveLength(0);
  expect(warning).not.toHaveBeenCalled();
});

test('absent description and optional detail render no empty section', async () => {
  get.mockRejectedValue({ response: { status: 404 } });
  const { container } = render(<ArtworkDetailSection artworkId={7} />);
  await waitFor(() => expect(container).toBeEmptyDOMElement());
});

test('approved detail is displayed separately from the basic description', async () => {
  get.mockResolvedValue({ data: { tenHoaSi: 'Artist', cauChuyenSangTac: 'Noi dung nghe thuat rieng' } });
  render(<ArtworkDetailSection artworkId={7} artworkDescription="Mo ta co ban" />);
  await screen.findByText('Noi dung nghe thuat rieng');
  expect(screen.getByText(/Mo ta co ban/)).toBeInTheDocument();
});
