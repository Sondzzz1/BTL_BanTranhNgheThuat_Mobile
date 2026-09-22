import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const STORAGE_KEY = 'artgallery_customart_claims';

const mockRequests = [
  {
    id: 101,
    khachHang: 'Nguyễn Văn A',
    tieuDe: 'Tranh treo phòng khách hiện đại',
    loaiTranh: 'Sơn dầu',
    kichThuoc: '80x100',
    moTa: 'Yêu cầu màu nâu ấm, phong cách hiện đại, tông tối giản.',
    trangThai: 'Chờ báo giá',
    ngayTao: '2026-09-12',
  },
  {
    id: 102,
    khachHang: 'Trần Thị B',
    tieuDe: 'Tranh phong cách tối giản',
    loaiTranh: 'Acrylic',
    kichThuoc: '60x80',
    moTa: 'Màu trắng, gỗ và nhã nhặn, phù hợp phòng làm việc.',
    trangThai: 'Đã nhận',
    ngayTao: '2026-09-11',
  },
  {
    id: 103,
    khachHang: 'Lê Văn C',
    tieuDe: 'Tranh gia đình nền nâu ấm',
    loaiTranh: 'Sơn dầu',
    kichThuoc: '90x120',
    moTa: 'Tạo cảm giác ấm áp, gia đình và không gian sống.',
    trangThai: 'Hoàn thành',
    ngayTao: '2026-09-09',
  },
];

const getClaimMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const ArtistCustomArt: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'all' | 'available' | 'claimed' | 'done'>('all');
  const [notice, setNotice] = useState<string>('');

  const requests = useMemo(() => {
    const claimMap = getClaimMap();

    return mockRequests.map((item) => {
      const claim = claimMap[item.id];
      if (claim) {
        return {
          ...item,
          assignedArtist: claim.artistName,
          isClaimed: true,
          trangThai: claim.artistName ? 'Đã nhận' : item.trangThai,
        };
      }
      return {
        ...item,
        assignedArtist: null,
        isClaimed: false,
      };
    });
  }, [status]);

  const filtered = useMemo(() => {
    if (status === 'available') return requests.filter((x) => !x.isClaimed);
    if (status === 'claimed') return requests.filter((x) => x.isClaimed);
    if (status === 'done') return requests.filter((x) => x.trangThai === 'Hoàn thành');
    return requests;
  }, [requests, status]);

  const handleClaim = (requestId: number) => {
    const claimMap = getClaimMap();
    if (claimMap[requestId]) {
      setNotice(`Yêu cầu #${requestId} đã được ${claimMap[requestId].artistName} nhận trước đó.`);
      return;
    }

    const artistName = user?.name || 'Họa sĩ của bạn';
    const updated = { ...claimMap, [requestId]: { artistName, claimedAt: new Date().toISOString() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotice(`Bạn đã nhận yêu cầu #${requestId}. Họa sĩ khác không thể nhận tiếp.`);
    window.location.reload();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h4><i className="ti-paint-bucket"></i> Yêu cầu tranh theo yêu cầu</h4>
      </div>

      {notice && (
        <div style={{
          background: '#e8f7ee',
          color: '#0d5c3c',
          border: '1px solid #bfe3cf',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px',
          fontWeight: 600,
        }}>
          {notice}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">Tất cả</option>
            <option value="available">Còn trống</option>
            <option value="claimed">Đã được nhận</option>
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
              <th>Loại tranh</th>
              <th>Kích thước</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.khachHang}</td>
                <td>
                  <strong>{item.tieuDe}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{item.moTa}</div>
                </td>
                <td>{item.loaiTranh}</td>
                <td>{item.kichThuoc}</td>
                <td>
                  <span className={`status-badge ${item.isClaimed ? 'warning' : item.trangThai === 'Hoàn thành' ? 'success' : 'neutral'}`}>
                    {item.isClaimed ? `Đã nhận bởi ${item.assignedArtist}` : item.trangThai}
                  </span>
                </td>
                <td>
                  {item.isClaimed ? (
                    <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                      Đã nhận
                    </button>
                  ) : (
                    <button onClick={() => handleClaim(item.id)}>
                      Nhận yêu cầu
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArtistCustomArt;
