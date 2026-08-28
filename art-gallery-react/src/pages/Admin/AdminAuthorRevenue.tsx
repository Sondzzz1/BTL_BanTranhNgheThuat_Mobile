import React, { useEffect, useState } from 'react';
import { adminService, DoanhThuTheoHoaSiResponse } from '../../services/adminService';
import './Admin.css';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const formatNumber = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(n || 0);

const AdminAuthorRevenue: React.FC = () => {
    const [data, setData] = useState<DoanhThuTheoHoaSiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tuNgay, setTuNgay] = useState('');
    const [denNgay, setDenNgay] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: { tuNgay?: string; denNgay?: string } = {};
            if (tuNgay) params.tuNgay = new Date(tuNgay).toISOString();
            if (denNgay) params.denNgay = new Date(denNgay).toISOString();
            const list = await adminService.getDoanhThuTheoHoaSi(params);
            setData(list);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể tải doanh thu họa sĩ');
        } finally {
            setLoading(false);
        }
    };

    const tongDoanhThu = data.reduce((sum, x) => sum + (x.doanhThu || 0), 0);
    const tongSoLuongBan = data.reduce((sum, x) => sum + (x.soLuongBan || 0), 0);

    return (
        <div id="revenue" className="page">
            <div className="page-header">
                <h4><i className="ti-money"></i> Doanh thu theo Họa sĩ</h4>
                <button className="btn-refresh" onClick={loadData}>
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            <div className="filter-bar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="filter-item">
                    <label>Từ ngày:</label>
                    <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
                </div>
                <div className="filter-item">
                    <label>Đến ngày:</label>
                    <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
                </div>
                <button className="add-btn" onClick={loadData}>
                    <i className="ti-search"></i> Lọc
                </button>
                {(tuNgay || denNgay) && (
                    <button
                        className="cancel"
                        onClick={() => {
                            setTuNgay('');
                            setDenNgay('');
                            setTimeout(loadData, 0);
                        }}
                    >
                        Xoá lọc
                    </button>
                )}
            </div>

            <div className="dashboard" style={{ marginTop: 20 }}>
                <div className="card bg-success">
                    <i className="ti-money"></i>
                    <p>Tổng doanh thu</p>
                    <h3>{formatCurrency(tongDoanhThu)}</h3>
                </div>
                <div className="card bg-primary">
                    <i className="ti-user"></i>
                    <p>Số họa sĩ có doanh thu</p>
                    <h3>{formatNumber(data.filter((x) => (x.doanhThu || 0) > 0).length)}</h3>
                </div>
                <div className="card bg-warning">
                    <i className="ti-shopping-cart-full"></i>
                    <p>Tổng số lượng đã bán</p>
                    <h3>{formatNumber(tongSoLuongBan)}</h3>
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#fee', color: '#c0392b', padding: '10px 12px',
                    borderRadius: 6, margin: '15px 0', fontSize: 14,
                    borderLeft: '4px solid #e74c3c'
                }}>
                    {error}
                </div>
            )}

            <div className="block">
                <h4><i className="ti-list"></i> Chi tiết</h4>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu doanh thu.</div>
                ) : (
                    <div className="table-container">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Họa sĩ</th>
                                    <th>Số tác phẩm</th>
                                    <th>Số lượng đã bán</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) => (
                                    <tr key={row.maHoaSi}>
                                        <td>{idx + 1}</td>
                                        <td><strong>{row.tenHoaSi}</strong></td>
                                        <td>{formatNumber(row.soTacPham)}</td>
                                        <td>{formatNumber(row.soLuongBan)}</td>
                                        <td style={{ color: '#28a745', fontWeight: 600 }}>
                                            {formatCurrency(row.doanhThu)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAuthorRevenue;
