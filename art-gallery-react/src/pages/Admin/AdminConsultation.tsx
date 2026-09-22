import React, { useMemo, useState } from 'react';

const mockConsultations = [
  {
    id: 201,
    khachHang: 'Nguyễn Văn A',
    ngay: '2026-10-15',
    gio: '09:30',
    diaChi: '123 Nguyễn Huệ, Quận 1',
    hoasi: 'Họa sĩ Minh Anh',
    trangThai: 'Đã xác nhận',
  },
  {
    id: 202,
    khachHang: 'Trần Thị B',
    ngay: '2026-10-20',
    gio: '14:00',
    diaChi: '56 Lê Lợi, Quận 1',
    hoasi: 'Chưa giao',
    trangThai: 'Chờ xác nhận',
  },
  {
    id: 203,
    khachHang: 'Lê Văn C',
    ngay: '2026-10-25',
    gio: '10:15',
    diaChi: '88 Trần Hưng Đạo',
    hoasi: 'Họa sĩ Lan Hương',
    trangThai: 'Hoàn thành',
  },
];

const AdminConsultation: React.FC = () => {
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'done'>('all');

  const filtered = useMemo(() => {
    if (status === 'pending') return mockConsultations.filter((x) => x.trangThai === 'Chờ xác nhận');
    if (status === 'confirmed') return mockConsultations.filter((x) => x.trangThai === 'Đã xác nhận');
    if (status === 'done') return mockConsultations.filter((x) => x.trangThai === 'Hoàn thành');
    return mockConsultations;
  }, [status]);

  return (
    <div className="page">
      <div className="page-header">
        <h4><i className="ti-calendar"></i> Quản lý Tư vấn nghệ thuật</h4>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
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
              <th>Ngày</th>
              <th>Giờ</th>
              <th>Địa chỉ</th>
              <th>Họa sĩ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.khachHang}</td>
                <td>{item.ngay}</td>
                <td>{item.gio}</td>
                <td>{item.diaChi}</td>
                <td>{item.hoasi}</td>
                <td>
                  <span className={`status-badge ${item.trangThai === 'Hoàn thành' ? 'success' : item.trangThai === 'Đã xác nhận' ? 'warning' : 'neutral'}`}>
                    {item.trangThai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminConsultation;
