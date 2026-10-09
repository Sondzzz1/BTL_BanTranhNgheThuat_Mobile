import React, { useEffect, useRef, useState } from 'react';
import { AdminReport as ReportData, DatePreset, getAdminReport, presetDates, ReportFilter, ReportType, reportTypes, validateReportDates } from '../../services/adminReportService';
import { formatVnd } from '../../utils/currency';
import './Admin.css';
import './AdminReport.css';

const number = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);
const displayDate = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
const initialFilter = (): ReportFilter => ({ type: 'doanh-thu', ...presetDates('month') });

const AdminReport: React.FC = () => {
  const [filter, setFilter] = useState<ReportFilter>(initialFilter);
  const [preset, setPreset] = useState<DatePreset>('month');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current += 1; }, []);
  const changeFilter = (next: ReportFilter) => {
    requestId.current += 1;
    setFilter(next); setReport(null); setError(''); setLoading(false);
  };
  const loadReport = async () => {
    const message = validateReportDates(filter.fromDate, filter.toDate);
    if (message) { setError(message); return; }
    const id = ++requestId.current;
    setLoading(true); setError(''); setReport(null);
    try {
      const result = await getAdminReport(filter);
      if (id === requestId.current) setReport(result);
    } catch (err: unknown) {
      if (id === requestId.current) {
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(apiError.response?.data?.message || 'Không thể tải báo cáo. Vui lòng thử lại.');
      }
    } finally { if (id === requestId.current) setLoading(false); }
  };
  const orders = report?.type === 'don-hang';
  const chartRows = report?.rows.slice(0, 10) || [];
  const chartValue = (row: ReportData['rows'][number]) => orders ? row.orders : report?.type === 'tac-pham' ? row.quantity : row.net;
  const max = Math.max(1, ...chartRows.map(chartValue));
  const chartMoney = !orders && report?.type !== 'tac-pham';

  return <div id="report" className="page admin-report">
    <div className="page-header"><h4>Báo cáo - Thống kê</h4></div>
    <p className="report-muted">Theo dõi và tổng hợp hoạt động của hệ thống</p>
    <form className="report-panel report-controls" onSubmit={event => { event.preventDefault(); void loadReport(); }}>
      <label>Loại báo cáo<select value={filter.type} onChange={event => changeFilter({ ...filter, type: event.target.value as ReportType })}>
        {Object.entries(reportTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <fieldset><legend>Thời gian</legend><div className="report-presets">
        {([['today', 'Hôm nay'], ['week', '7 ngày'], ['month', 'Tháng này'], ['custom', 'Tùy chọn']] as [DatePreset, string][]).map(([value, label]) =>
          <button key={value} type="button" aria-pressed={preset === value} onClick={() => {
            setPreset(value); changeFilter({ ...filter, ...(value === 'custom' ? {} : presetDates(value)) });
          }}>{label}</button>)}
      </div></fieldset>
      {preset === 'custom' ? <div className="report-date-fields">
        <label>Từ ngày<input type="date" min="1753-01-01" max="9999-12-30" value={filter.fromDate} onChange={event => changeFilter({ ...filter, fromDate: event.target.value })} /></label>
        <label>Đến ngày<input type="date" min="1753-01-01" max="9999-12-30" value={filter.toDate} onChange={event => changeFilter({ ...filter, toDate: event.target.value })} /></label>
      </div> : <p>{displayDate(filter.fromDate)} – {displayDate(filter.toDate)} {preset === 'month' && '(đến hôm nay)'}</p>}
      <div className="report-actions"><button type="button" onClick={() => { setPreset('month'); changeFilter(initialFilter()); }}>Đặt lại</button>
        <button type="submit" className="report-submit" disabled={loading}>{loading ? 'Đang tải…' : 'Xem báo cáo'}</button></div>
    </form>
    {error && <div role="alert" className="report-error">{error}</div>}
    <section aria-live="polite" aria-busy={loading}>
      {loading && <p className="report-panel">Đang tổng hợp báo cáo…</p>}
      {!loading && !report && !error && <p className="report-panel">Chọn loại và thời gian, sau đó bấm “Xem báo cáo”.</p>}
      {report && <>
        <div className="report-result-heading"><div><h3>Báo cáo: {reportTypes[report.type]}</h3><p>{displayDate(report.fromDate)} – {displayDate(report.toDate)}</p></div>
          <button type="button" onClick={() => void loadReport()}>Làm mới báo cáo</button></div>
        <p className="report-muted">{report.dateBasis}</p>
        {!orders && <p className="report-muted">Giá trị tranh theo đơn giá dòng đơn; không phải tiền đối soát/chi trả họa sĩ. Số đơn của từng nhóm không cộng thành tổng khi một đơn có nhiều tác phẩm hoặc họa sĩ.</p>}
        {!report.hasData ? <p className="report-panel">Không có dữ liệu trong khoảng thời gian đã chọn.</p> : <>
          <div className="report-metrics">{report.summary.map(metric => <div className="report-panel" key={metric.label}><p>{metric.label}</p>
            <strong>{metric.format === 'currency' ? formatVnd(metric.value) : `${number(metric.value)}${metric.format === 'percent' ? '%' : ''}`}</strong></div>)}</div>
          <div className="report-panel"><h4>{orders ? 'Phân bố trạng thái' : report.type === 'doanh-thu' ? 'Doanh thu sau hoàn theo ngày' : 'Xếp hạng trong kỳ'}</h4>
            {report.rows.length > 10 && <p className="report-muted">Biểu đồ hiển thị 10 dòng đầu; bảng bên dưới hiển thị toàn bộ.</p>}
            {chartRows.map(row => <div className="report-bar-row" key={row.key}><div><span>{row.label}</span><strong>{chartMoney ? formatVnd(chartValue(row)) : number(chartValue(row))}</strong></div>
              <div className="report-bar-track"><div style={{ width: `${Math.max(0, chartValue(row)) / max * 100}%` }} /></div></div>)}
          </div>
          <div className="report-panel"><h4>{orders ? 'Chi tiết trạng thái hiện tại' : 'Chi tiết tổng hợp'}</h4><div className="report-table-scroll"><table className="styled-table">
            <thead><tr><th>{orders ? 'Trạng thái' : report.type === 'doanh-thu' ? 'Ngày ghi nhận' : report.type === 'tac-pham' ? 'Tác phẩm — Họa sĩ' : report.type === 'hoa-si' ? 'Họa sĩ' : 'Khách hàng'}</th><th>Số đơn</th>
              {!orders && <><th>Số bản sau hoàn</th><th>Giá trị gộp</th><th>Đã hoàn</th><th>Sau hoàn</th></>}</tr></thead>
            <tbody>{report.rows.map(row => <tr key={row.key}><td>{row.label}</td><td>{number(row.orders)}</td>
              {!orders && <><td>{number(row.quantity)}</td><td>{formatVnd(row.gross)}</td><td>{formatVnd(row.refund)}</td><td>{formatVnd(row.net)}</td></>}</tr>)}</tbody>
          </table></div></div>
        </>}
      </>}
    </section>
  </div>;
};
export default AdminReport;
