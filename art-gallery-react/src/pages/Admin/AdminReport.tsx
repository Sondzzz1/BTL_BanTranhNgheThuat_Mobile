import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './Admin.css';

const AdminReport: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
    const [bestSelling, setBestSelling] = useState<any[]>([]);
    const [authorRevenue, setAuthorRevenue] = useState<any[]>([]);
    const [orderStats, setOrderStats] = useState<any>(null);

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        try {
            setLoading(true);
            const [
                summaryData,
                monthlyData,
                bestSellingData,
                authorData,
                orderStatsData
            ] = await Promise.all([
                adminService.getThongKeTongQuan(),
                adminService.getDoanhThuTheoThang(2026),
                adminService.getTacPhamBanChay(5),
                adminService.getDoanhThuTheoHoaSi({}),
                adminService.getThongKeTrangThaiDonHang()
            ]);

            setSummary(summaryData);
            setMonthlyRevenue(monthlyData);
            setBestSelling(bestSellingData);
            setAuthorRevenue(authorData);
            setOrderStats(orderStatsData);
        } catch (error) {
            console.error('Lỗi khi tải báo cáo:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (loading) return <div className="page"><div className="loading">Đang tải báo cáo...</div></div>;

    return (
        <div id="report" className="page">
            <div className="page-header">
                <h4><i className="ti-bar-chart"></i> Báo cáo thống kê tổng quát</h4>
                <button className="add-btn" onClick={loadReportData}>
                    <i className="ti-reload"></i> Làm mới
                </button>
            </div>

            {/* Summary Cards */}
            <div className="dashboard report-summary">
                <div className="card bg-success">
                    <i className="ti-money"></i>
                    <p>Tổng Doanh thu</p>
                    <h3>{formatCurrency(summary?.tongDoanhThu || 0)}</h3>
                </div>
                <div className="card bg-primary">
                    <i className="ti-shopping-cart-full"></i>
                    <p>Tổng Đơn hàng</p>
                    <h3>{summary?.tongDonHang || 0}</h3>
                </div>
                <div className="card bg-warning">
                    <i className="ti-user"></i>
                    <p>Khách hàng</p>
                    <h3>{summary?.tongKhachHang || 0}</h3>
                </div>
                <div className="card bg-danger">
                    <i className="ti-palette"></i>
                    <p>Số Họa sĩ</p>
                    <h3>{summary?.tongHoaSi || 0}</h3>
                </div>
            </div>

            <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Monthly Revenue */}
                <div className="block report-detail">
                    <h4>Doanh Thu Theo Tháng (2026)</h4>
                    <div className="table-container">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Tháng</th>
                                    <th>Số đơn</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyRevenue.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>Tháng {item.thang}</td>
                                        <td>{item.soDonHang}</td>
                                        <td>{formatCurrency(item.doanhThu)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Best Selling Artworks */}
                <div className="block report-detail">
                    <h4>Top 5 Tác Phẩm Bán Chạy</h4>
                    <div className="table-container">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Tên tác phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestSelling.map((item, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{item.tenTacPham}</strong></td>
                                        <td>{item.soLuongBan}</td>
                                        <td>{formatCurrency(item.doanhThu)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Author Performance */}
                <div className="block report-detail">
                    <h4>Hiệu Suất Họa Sĩ</h4>
                    <div className="table-container">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Họa sĩ</th>
                                    <th>Số tranh</th>
                                    <th>Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {authorRevenue.slice(0, 5).map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.tenHoaSi}</td>
                                        <td>{item.soTacPham}</td>
                                        <td>{formatCurrency(item.doanhThu)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Status Stats */}
                <div className="block report-detail">
                    <h4>Trạng Thái Đơn Hàng</h4>
                    <div style={{ padding: '20px' }}>
                        <div className="stat-item" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Chờ xử lý</span>
                                <strong>{orderStats?.choXuLy || 0}</strong>
                            </div>
                            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#ffc107', width: `${((orderStats?.choXuLy || 0) / (summary?.tongDonHang || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="stat-item" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Đang giao</span>
                                <strong>{orderStats?.dangGiao || 0}</strong>
                            </div>
                            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#17a2b8', width: `${((orderStats?.dangGiao || 0) / (summary?.tongDonHang || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="stat-item" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Đã giao</span>
                                <strong>{orderStats?.daGiao || 0}</strong>
                            </div>
                            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#28a745', width: `${((orderStats?.daGiao || 0) / (summary?.tongDonHang || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Đã hủy</span>
                                <strong>{orderStats?.daHuy || 0}</strong>
                            </div>
                            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#dc3545', width: `${((orderStats?.daHuy || 0) / (summary?.tongDonHang || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReport;
