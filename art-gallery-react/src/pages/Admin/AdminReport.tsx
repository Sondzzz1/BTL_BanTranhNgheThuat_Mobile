import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import './Admin.css';

interface SummaryData {
    tongDoanhThu: number;
    tongDonHang: number;
    tongKhachHang: number;
    tongHoaSi: number;
    tongTacPham: number;
    donHangChoXuLy: number;
}

interface MonthlyItem {
    thang: number;
    nam: number;
    tongDoanhThu: number;
    soDonHang: number;
}

interface BestSellingItem {
    maTacPham: number;
    tenTacPham: string;
    tenHoaSi: string;
    soLuongBan: number;
    doanhThu: number;
}

interface AuthorRevenueItem {
    maHoaSi: number;
    tenHoaSi: string;
    soTacPham: number;
    soLuongBan: number;
    doanhThu: number;
}

interface OrderStats {
    choXuLy: number;
    dangGiao: number;
    hoanThanh: number;
    daHuy: number;
    tongDoanhThu: number;
}

const AdminReport: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyItem[]>([]);
    const [bestSelling, setBestSelling] = useState<BestSellingItem[]>([]);
    const [authorRevenue, setAuthorRevenue] = useState<AuthorRevenueItem[]>([]);
    const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const loadReportData = useCallback(async () => {
        setLoading(true);
        setErrors({});

        const newErrors: Record<string, string> = {};

        // Load dashboard summary
        try {
            const dashData = await adminService.getDashboard();
            setSummary({
                tongDoanhThu: (dashData as any).tongDoanhThu ?? 0,
                tongDonHang: (dashData as any).tongDonHang ?? 0,
                tongKhachHang: (dashData as any).tongKhachHang ?? 0,
                tongHoaSi: (dashData as any).tongHoaSi ?? 0,
                tongTacPham: (dashData as any).tongTacPham ?? 0,
                donHangChoXuLy: (dashData as any).donHangChoXuLy ?? 0,
            });
        } catch (e: any) {
            newErrors['summary'] = 'Không thể tải thông tin tổng quan';
            console.error('Dashboard error:', e);
        }

        // Load monthly revenue
        try {
            const monthly = await adminService.getDoanhThuTheoThang(selectedYear);
            const mapped = (monthly as any[]).map((item: any) => ({
                thang: item.thang ?? item.Thang ?? 0,
                nam: item.nam ?? item.Nam ?? selectedYear,
                tongDoanhThu: item.tongDoanhThu ?? item.TongDoanhThu ?? 0,
                soDonHang: item.soDonHang ?? item.SoDonHang ?? 0,
            }));
            setMonthlyRevenue(mapped);
        } catch (e: any) {
            newErrors['monthly'] = 'Không thể tải doanh thu theo tháng';
            console.error('Monthly revenue error:', e);
        }

        // Load best selling artworks
        try {
            const top = await adminService.getTacPhamBanChay(5);
            const mapped = (top as any[]).map((item: any) => ({
                maTacPham: item.maTacPham ?? item.MaTacPham ?? item.tacPhamId ?? 0,
                tenTacPham: item.tenTacPham ?? item.TenTacPham ?? 'N/A',
                tenHoaSi: item.tenHoaSi ?? item.TenHoaSi ?? item.hoaSi ?? 'N/A',
                soLuongBan: item.soLuongBan ?? item.SoLuongBan ?? 0,
                doanhThu: item.doanhThu ?? item.DoanhThu ?? 0,
            }));
            setBestSelling(mapped);
        } catch (e: any) {
            newErrors['bestSelling'] = 'Không thể tải tác phẩm bán chạy';
            console.error('Best selling error:', e);
        }

        // Load author revenue
        try {
            const authors = await adminService.getDoanhThuTheoHoaSi({});
            const mapped = (authors as any[]).map((item: any) => ({
                maHoaSi: item.maHoaSi ?? item.MaHoaSi ?? 0,
                tenHoaSi: item.tenHoaSi ?? item.TenHoaSi ?? 'N/A',
                soTacPham: item.soTacPham ?? item.SoTacPham ?? 0,
                soLuongBan: item.soLuongBan ?? item.SoLuongBan ?? 0,
                doanhThu: item.doanhThu ?? item.DoanhThu ?? 0,
            }));
            setAuthorRevenue(mapped);
        } catch (e: any) {
            newErrors['authors'] = 'Không thể tải doanh thu họa sĩ';
            console.error('Author revenue error:', e);
        }

        // Load order stats
        try {
            const stats = await adminService.getThongKeTrangThaiDonHang();
            setOrderStats({
                choXuLy: (stats as any).choXuLy ?? 0,
                dangGiao: (stats as any).dangGiao ?? 0,
                hoanThanh: (stats as any).hoanThanh ?? 0,
                daHuy: (stats as any).daHuy ?? 0,
                tongDoanhThu: (stats as any).tongDoanhThu ?? 0,
            });
        } catch (e: any) {
            newErrors['orderStats'] = 'Không thể tải thống kê đơn hàng';
            console.error('Order stats error:', e);
        }

        setErrors(newErrors);
        setLoading(false);
    }, [selectedYear]);

    useEffect(() => {
        loadReportData();
    }, [loadReportData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatNumber = (n: number) =>
        new Intl.NumberFormat('vi-VN').format(n);

    // Tính max doanh thu để vẽ bar chart tương đối
    const maxMonthlyRevenue = monthlyRevenue.length > 0
        ? Math.max(...monthlyRevenue.map(m => m.tongDoanhThu))
        : 1;

    const totalOrders = orderStats
        ? (orderStats.choXuLy + orderStats.dangGiao + orderStats.hoanThanh + orderStats.daHuy) || 1
        : 1;

    if (loading) {
        return (
            <div className="page">
                <div className="loading-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <h3 style={{ color: '#6c757d' }}>Đang tải báo cáo thống kê...</h3>
                    <p style={{ color: '#adb5bd' }}>Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        );
    }

    return (
        <div id="report" className="page">
            {/* Header */}
            <div className="page-header">
                <h4><i className="ti-bar-chart"></i> Báo cáo &amp; Thống kê</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="add-btn" onClick={loadReportData}>
                        <i className="ti-reload"></i> Làm mới
                    </button>
                </div>
            </div>

            {/* Global error */}
            {Object.keys(errors).length > 0 && (
                <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#856404'
                }}>
                    <strong>⚠️ Một số dữ liệu không tải được:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                        {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Summary Cards */}
            <div className="dashboard report-summary">
                <div className="card bg-success">
                    <i className="ti-money"></i>
                    <p>Tổng Doanh thu</p>
                    <h3>{formatCurrency(summary?.tongDoanhThu ?? 0)}</h3>
                </div>
                <div className="card bg-primary">
                    <i className="ti-shopping-cart-full"></i>
                    <p>Tổng Đơn hàng</p>
                    <h3>{formatNumber(summary?.tongDonHang ?? 0)}</h3>
                    {(summary?.donHangChoXuLy ?? 0) > 0 && (
                        <small style={{ opacity: 0.85 }}>
                            {summary!.donHangChoXuLy} chờ xử lý
                        </small>
                    )}
                </div>
                <div className="card bg-warning">
                    <i className="ti-user"></i>
                    <p>Khách hàng</p>
                    <h3>{formatNumber(summary?.tongKhachHang ?? 0)}</h3>
                </div>
                <div className="card bg-danger">
                    <i className="ti-palette"></i>
                    <p>Số Họa sĩ</p>
                    <h3>{formatNumber(summary?.tongHoaSi ?? 0)}</h3>
                </div>
            </div>

            <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Monthly Revenue với mini bar chart */}
                <div className="block report-detail">
                    <h4>📅 Doanh Thu Theo Tháng ({selectedYear})</h4>
                    {errors['monthly'] ? (
                        <div className="error-state" style={{ padding: '30px', textAlign: 'center', color: '#dc3545' }}>
                            <i className="ti-alert"></i> {errors['monthly']}
                        </div>
                    ) : monthlyRevenue.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                            <i className="ti-info-alt"></i> Chưa có dữ liệu doanh thu cho năm {selectedYear}
                        </div>
                    ) : (
                        <div style={{ padding: '8px 0' }}>
                            {monthlyRevenue.map((item) => (
                                <div key={item.thang} style={{ marginBottom: '10px', padding: '0 4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                        <span style={{ fontWeight: 500 }}>Tháng {item.thang}</span>
                                        <span style={{ color: '#6c757d' }}>{item.soDonHang} đơn</span>
                                        <span style={{ fontWeight: 600, color: '#28a745' }}>{formatCurrency(item.tongDoanhThu)}</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #28a745, #5cb85c)',
                                            width: `${(item.tongDoanhThu / maxMonthlyRevenue) * 100}%`,
                                            borderRadius: '3px',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Best Selling Artworks */}
                <div className="block report-detail">
                    <h4>🏆 Top 5 Tác Phẩm Bán Chạy</h4>
                    {errors['bestSelling'] ? (
                        <div className="error-state" style={{ padding: '30px', textAlign: 'center', color: '#dc3545' }}>
                            <i className="ti-alert"></i> {errors['bestSelling']}
                        </div>
                    ) : bestSelling.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                            <i className="ti-info-alt"></i> Chưa có tác phẩm nào được bán
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Tên tác phẩm</th>
                                        <th>Số lượng</th>
                                        <th>Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bestSelling.map((item, idx) => (
                                        <tr key={item.maTacPham || idx}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: idx === 0 ? '#ffc107' : idx === 1 ? '#adb5bd' : idx === 2 ? '#cd7f32' : '#e9ecef',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: idx < 3 ? '#fff' : '#495057'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{item.tenTacPham}</strong>
                                                <br />
                                                <small style={{ color: '#6c757d' }}>{item.tenHoaSi}</small>
                                            </td>
                                            <td>{formatNumber(item.soLuongBan)}</td>
                                            <td style={{ color: '#28a745', fontWeight: 600 }}>{formatCurrency(item.doanhThu)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Author Performance */}
                <div className="block report-detail">
                    <h4>🎨 Hiệu Suất Họa Sĩ (Top 5)</h4>
                    {errors['authors'] ? (
                        <div className="error-state" style={{ padding: '30px', textAlign: 'center', color: '#dc3545' }}>
                            <i className="ti-alert"></i> {errors['authors']}
                        </div>
                    ) : authorRevenue.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                            <i className="ti-info-alt"></i> Chưa có dữ liệu họa sĩ
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Họa sĩ</th>
                                        <th>Số tranh</th>
                                        <th>Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {authorRevenue.slice(0, 5).map((item, idx) => (
                                        <tr key={item.maHoaSi || idx}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: idx === 0 ? '#ffc107' : idx === 1 ? '#adb5bd' : idx === 2 ? '#cd7f32' : '#e9ecef',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: idx < 3 ? '#fff' : '#495057'
                                                }}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td>{item.tenHoaSi}</td>
                                            <td>{formatNumber(item.soTacPham)}</td>
                                            <td style={{ color: '#17a2b8', fontWeight: 600 }}>{formatCurrency(item.doanhThu)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Order Status Stats */}
                <div className="block report-detail">
                    <h4>📦 Phân Bố Trạng Thái Đơn Hàng</h4>
                    {errors['orderStats'] ? (
                        <div className="error-state" style={{ padding: '30px', textAlign: 'center', color: '#dc3545' }}>
                            <i className="ti-alert"></i> {errors['orderStats']}
                        </div>
                    ) : (
                        <div style={{ padding: '16px' }}>
                            {/* Tổng doanh thu */}
                            {orderStats?.tongDoanhThu ? (
                                <div style={{
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '13px' }}>💰 Tổng doanh thu</span>
                                    <strong style={{ color: '#28a745' }}>{formatCurrency(orderStats.tongDoanhThu)}</strong>
                                </div>
                            ) : null}

                            {/* Progress bars */}
                            {[
                                { label: 'Chờ xử lý', value: orderStats?.choXuLy ?? 0, color: '#ffc107', icon: '⏳' },
                                { label: 'Đang giao', value: orderStats?.dangGiao ?? 0, color: '#17a2b8', icon: '🚚' },
                                { label: 'Hoàn thành', value: orderStats?.hoanThanh ?? 0, color: '#28a745', icon: '✅' },
                                { label: 'Đã hủy', value: orderStats?.daHuy ?? 0, color: '#dc3545', icon: '❌' },
                            ].map(stat => (
                                <div key={stat.label} style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '13px' }}>{stat.icon} {stat.label}</span>
                                        <div>
                                            <strong style={{ color: stat.color }}>{formatNumber(stat.value)}</strong>
                                            <span style={{ color: '#adb5bd', fontSize: '12px', marginLeft: '6px' }}>
                                                ({Math.round((stat.value / totalOrders) * 100)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            background: stat.color,
                                            width: `${(stat.value / totalOrders) * 100}%`,
                                            borderRadius: '4px',
                                            transition: 'width 0.6s ease'
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReport;
