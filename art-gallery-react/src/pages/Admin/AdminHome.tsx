import React, { useState, useEffect } from 'react';
import { adminService, DashboardResponse, ThongKeNhanhResponse } from '../../services/adminService';
import './Admin.css';

const AdminHome: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [quickStats, setQuickStats] = useState<ThongKeNhanhResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dash, quick] = await Promise.all([
                adminService.getDashboard(),
                adminService.getThongKeNhanh(new Date())
            ]);
            setDashboardData(dash);
            setQuickStats(quick);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dashboard:', error);
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

    if (loading) return <div className="page"><div className="loading">Đang tải dữ liệu...</div></div>;

    return (
        <div id="home" className="page">
            <div className="header">
                <h4><i className="ti-info-alt"></i> Tổng quan hệ thống</h4>
            </div>
            
            <div className="dashboard">
                <div className="card bg-primary">
                    <i className="ti-package"></i>
                    <p>Tác phẩm</p>
                    <h3>{dashboardData?.tongTacPham || 0}</h3>
                </div>
                <div className="card bg-success">
                    <i className="ti-shopping-cart-full"></i>
                    <p>Đơn hàng</p>
                    <h3>{dashboardData?.tongDonHang || 0}</h3>
                </div>
                <div className="card bg-warning">
                    <i className="ti-user"></i>
                    <p>Khách hàng</p>
                    <h3>{dashboardData?.tongKhachHang || 0}</h3>
                </div>
                <div className="card bg-danger">
                    <i className="ti-bar-chart"></i>
                    <p>Doanh thu tháng</p>
                    <h3>{formatCurrency(dashboardData?.doanhThuThang || 0)}</h3>
                </div>
            </div>

            <div className="block">
                <h4><i className="ti-time"></i> Hoạt động gần đây</h4>
                <div className="activity">
                    <div><i className="ti-plus"></i> Đơn hàng mới: {dashboardData?.donHangMoi || 0} đơn cần xử lý</div>
                    <div><i className="ti-user"></i> Khách hàng mới hôm nay: {quickStats?.soKhachHangMoi || 0} người</div>
                    <div><i className="ti-shopping-cart"></i> Doanh thu hôm nay: {formatCurrency(quickStats?.doanhThu || 0)}</div>
                </div>
            </div>

            <div className="block">
                <h4><i className="ti-bar-chart"></i> Thống kê nhanh hôm nay</h4>
                <div className="stats">
                    <div className="stat">
                        <p>Doanh thu</p>
                        <h3>{formatCurrency(quickStats?.doanhThu || 0)}</h3>
                    </div>
                    <div className="stat">
                        <p>Số đơn hàng</p>
                        <h3>{quickStats?.soDonHang || 0}</h3>
                    </div>
                    <div className="stat">
                        <p>Khách hàng mới</p>
                        <h3>{quickStats?.soKhachHangMoi || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="block" id="ghichu">
                <h4><i className="ti-notepad"></i> Ghi chú quản trị</h4>
                <textarea placeholder="Nhập ghi chú hoặc công việc cần làm..."></textarea>
            </div>
        </div>
    );
};

export default AdminHome;
