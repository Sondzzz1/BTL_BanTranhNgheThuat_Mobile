import React, { useMemo, useState } from 'react';

const mockRequests = [
  {
    id: 101,
    khachHang: 'Nguyễn Văn A',
    tieuDe: 'Tranh treo phòng khách hiện đại',
    hoasi: 'Họa sĩ Minh Anh',
    trangThai: 'Chờ báo giá',
    ngayTao: '2026-09-12',
    gia: '8.500.000đ',
  },
  {
    id: 102,
    khachHang: 'Trần Thị B',
    tieuDe: 'Tranh phong cách tối giản',
    hoasi: 'Chưa giao',
    trangThai: 'Đã nhận',
    ngayTao: '2026-09-11',
    gia: 'Chưa có',
  },
  {
    id: 103,
    khachHang: 'Lê Văn C',
    tieuDe: 'Tranh gia đình nền nâu ấm',
    hoasi: 'Họa sĩ Lan Hương',
    trangThai: 'Hoàn thành',
    ngayTao: '2026-09-09',
    gia: '12.000.000đ',
  },
];

const AdminCustomArt: React.FC = () => {
  const [status, setStatus] = useState<'all' | 'pending' | 'active' | 'done'>('all');

  const filtered = useMemo(() => {
    if (status === 'pending') return mockRequests.filter((x) => x.trangThai === 'Chờ báo giá');
    if (status === 'active') return mockRequests.filter((x) => x.trangThai === 'Đã nhận');
    if (status === 'done') return mockRequests.filter((x) => x.trangThai === 'Hoàn thành');
    return mockRequests;
  }, [status]);

  return (
    <div className="page">
      <div className="page-header">
        <h4><i className="ti-paint-bucket"></i> Quản lý Tranh theo yêu cầu</h4>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="pending">Chờ báo giá</option>
            <option value="active">Đã nhận</option>
            <option value="done">Hoàn thành</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách hàng</th>
              <th>Tiêu đề</th>
              <th>Họa sĩ</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.khachHang}</td>
                <td>{item.tieuDe}</td>
                <td>{item.hoasi}</td>
                <td>
                  <span className={`status-badge ${item.trangThai === 'Hoàn thành' ? 'success' : item.trangThai === 'Đã nhận' ? 'warning' : 'neutral'}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td>{item.ngayTao}</td>
                <td>{item.gia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomArt;
