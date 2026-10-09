import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminReport from './AdminReport';
import { getAdminReport, presetDates, ReportType, reportTypes, validateReportDates } from '../../services/adminReportService';

jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../services/adminReportService', () => ({ ...jest.requireActual('../../services/adminReportService'), getAdminReport: jest.fn() }));
const getReport = getAdminReport as jest.MockedFunction<typeof getAdminReport>;
const empty = { type: 'doanh-thu' as const, fromDate: '2026-10-09', toDate: '2026-10-09', dateBasis: 'Ngày giao', hasData: false, summary: [], rows: [] };
beforeEach(() => getReport.mockReset());

test('today, seven days, month, custom and same-day validation', () => {
  const now = new Date(2026, 9, 9, 0, 30);
  expect(presetDates('today', now)).toEqual({ fromDate: '2026-10-09', toDate: '2026-10-09' });
  expect(presetDates('week', now)).toEqual({ fromDate: '2026-10-03', toDate: '2026-10-09' });
  expect(presetDates('month', now)).toEqual({ fromDate: '2026-10-01', toDate: '2026-10-09' });
  expect(validateReportDates('2026-09-15', '2026-10-09')).toBe('');
  expect(validateReportDates('2026-10-09', '2026-10-09')).toBe('');
  expect(validateReportDates('2026-10-10', '2026-10-09')).not.toBe('');
});
test('explicit submit, empty state, switch report type and refresh', async () => {
  getReport.mockResolvedValue(empty);
  render(<AdminReport />);
  expect(getReport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  expect(await screen.findByText('Không có dữ liệu trong khoảng thời gian đã chọn.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới báo cáo' }));
  await waitFor(() => expect(getReport).toHaveBeenCalledTimes(2));
  await screen.findByRole('button', { name: 'Làm mới báo cáo' });
  fireEvent.change(screen.getByLabelText('Loại báo cáo'), { target: { value: 'don-hang' } });
  expect(screen.queryByText('Không có dữ liệu trong khoảng thời gian đã chọn.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  await waitFor(() => expect(getReport).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'don-hang' })));
  await screen.findByRole('button', { name: 'Làm mới báo cáo' });
});
test('invalid custom range prevents request; API error is visible', async () => {
  render(<AdminReport />);
  fireEvent.click(screen.getByRole('button', { name: 'Tùy chọn' }));
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-10-10' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-10-09' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Từ ngày không được lớn hơn đến ngày.');
  expect(getReport).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-10-09' } });
  getReport.mockRejectedValue(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải báo cáo');
});
test('ignores a stale response after filter changes', async () => {
  let resolve!: (value: typeof empty) => void;
  getReport.mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<AdminReport />);
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  expect(screen.getByText('Đang tổng hợp báo cáo…')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Loại báo cáo'), { target: { value: 'tac-pham' } });
  resolve(empty);
  await waitFor(() => expect(screen.queryByText('Không có dữ liệu trong khoảng thời gian đã chọn.')).not.toBeInTheDocument());
});

test.each(Object.keys(reportTypes) as ReportType[])('renders the selected %s report with its own cards and table', async type => {
  getReport.mockResolvedValue({ ...empty, type, hasData: true,
    summary: [{ label: 'Chỉ số của loại đang chọn', value: 3, format: 'number' }],
    rows: [{ key: '1', label: 'Dữ liệu kiểm thử', orders: 1, quantity: 3, gross: 500, refund: 200, net: 300 }] });
  render(<AdminReport />);
  fireEvent.change(screen.getByLabelText('Loại báo cáo'), { target: { value: type } });
  fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }));
  expect(await screen.findByText('Chỉ số của loại đang chọn')).toBeInTheDocument();
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: `Báo cáo: ${reportTypes[type]}` })).toBeInTheDocument();
});
