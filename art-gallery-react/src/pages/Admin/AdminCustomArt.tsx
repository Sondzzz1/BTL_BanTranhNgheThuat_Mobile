import React, { useEffect, useMemo, useState } from 'react';
import { customArtService, CustomArtRequestApi, getCustomArtStatusLabel } from '../../services/customArtService';

type CustomArtRequestView = {
  id: number;
  khachHang: string;
  tieuDe: string;
  hoasi: string;
  trangThai: string;
  ngayTao: string;
  gia: string;
  assignedTo?: string;
};

const mapApiToView = (item: CustomArtRequestApi): CustomArtRequestView => ({
  id: item.maYeuCau,
  khachHang: `Khách hàng #${item.maKhachHang}`,
  tieuDe: item.tieuDe,
  hoasi: item.maHoaSi ? `Họa sĩ #${item.maHoaSi}` : 'Chưa giao',
  trangThai: item.trangThai,
  ngayTao: new Date(item.ngayTao).toLocaleDateString('vi-VN'),
  gia: item.giaDuKien ? `${item.giaDuKien.toLocaleString('vi-VN')}đ` : 'Chưa có',
  assignedTo: item.maHoaSi ? `Họa sĩ #${item.maHoaSi}` : undefined,
});

const AdminCustomArt: React.FC = () => {
  const [status, setStatus] = useState<'all' | 'pending' | 'active' | 'done'>('all');
  const [requests, setRequests] = useState<CustomArtRequestView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await customArtService.getAllRequests();
        setRequests(data.map(mapApiToView));
      } catch (error) {
        console.error('Lỗi khi tải danh sách custom art:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    if (status === 'pending') return requests.filter((x) => x.trangThai === 'Submitted' || x.trangThai === 'PendingArtist');
    if (status === 'active') return requests.filter((x) => x.trangThai === 'Assigned' || x.trangThai === 'InProgress' || x.trangThai === 'PreviewSent');
    if (status === 'done') return requests.filter((x) => x.trangThai === 'Completed');
    return requests;
  }, [requests, status]);

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
            <option value="pending">Chờ xử lý</option>
            <option value="active">Đã nhận / đang làm</option>
            <option value="done">Hoàn thành</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
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
                  <td>{item.assignedTo ? `${item.assignedTo} (đã nhận)` : item.hoasi}</td>
                  <td>
                    <span className={`status-badge ${item.trangThai === 'Completed' ? 'success' : item.trangThai === 'Assigned' || item.trangThai === 'InProgress' || item.trangThai === 'Quoted' ? 'warning' : 'neutral'}`}>
                      {getCustomArtStatusLabel(item.trangThai)}
                    </span>
                  </td>
                  <td>{item.ngayTao}</td>
                  <td>{item.gia}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCustomArt;
