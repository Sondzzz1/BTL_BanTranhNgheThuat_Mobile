using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class AdminRepository : IAdminRepository
{
    private readonly string _connectionString;

    public AdminRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    // ================================================================
    // DASHBOARD TỔNG QUAN
    // ================================================================

    public async Task<DashboardResponse> GetDashboard()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Đơn hàng: 0=Chờ xác nhận, 1=Đã xác nhận, 2=Đang giao, 3=Đã giao, 4=Yêu cầu hủy, 5=Đã hủy
        // BaiViet: 0=Draft, 1=Pending, 2=Published, 3=Rejected, 4=Archived
        var query = @"
            SELECT 
                (SELECT ISNULL(SUM(TongTien), 0) FROM DonHang WHERE TrangThai = 3) AS TongDoanhThu,
                (SELECT COUNT(*) FROM DonHang) AS TongDonHang,
                (SELECT COUNT(*) FROM NguoiDung) AS TongKhachHang,
                (SELECT COUNT(*) FROM HoaSi WHERE TrangThai = 1) AS TongHoaSi,
                (SELECT COUNT(*) FROM TacPham WHERE TrangThai = 1) AS TongTacPham,
                (SELECT COUNT(*) FROM DonHang WHERE TrangThai IN (0, 1, 4)) AS DonHangChoXuLy,
                (SELECT COUNT(*) FROM TacPham WHERE TrangThai = 0) AS TacPhamChoDuyet,
                (SELECT COUNT(*) FROM BaiViet WHERE TrangThai = 1) AS BaiVietChoDuyet
        ";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new DashboardResponse
            {
                TongDoanhThu = reader.IsDBNull(0) ? 0 : reader.GetDecimal(0),
                TongDonHang = reader.GetInt32(1),
                TongKhachHang = reader.GetInt32(2),
                TongHoaSi = reader.GetInt32(3),
                TongTacPham = reader.GetInt32(4),
                DonHangChoXuLy = reader.GetInt32(5),
                TacPhamChoDuyet = reader.GetInt32(6),
                BaiVietChoDuyet = reader.GetInt32(7)
            };
        }

        return new DashboardResponse();
    }

    // ================================================================
    // THỐNG KÊ TỔNG QUAN (cho AdminReport.tsx)
    // ================================================================

    public async Task<ThongKeTongQuanResponse> GetThongKeTongQuan()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var result = new ThongKeTongQuanResponse();

        // Doanh thu theo tháng (năm hiện tại)
        var queryDTTT = @"
            SELECT 
                MONTH(NgayDat) AS Thang,
                YEAR(NgayDat) AS Nam,
                ISNULL(SUM(TongTien), 0) AS TongDoanhThu,
                COUNT(*) AS SoDonHang
            FROM DonHang
            WHERE TrangThai = 3 AND YEAR(NgayDat) = YEAR(GETDATE())
            GROUP BY MONTH(NgayDat), YEAR(NgayDat)
            ORDER BY Thang";

        using (var cmd = new SqlCommand(queryDTTT, connection))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            var list = new List<DoanhThuTheoThang>();
            while (await reader.ReadAsync())
            {
                list.Add(new DoanhThuTheoThang
                {
                    Thang = reader.GetInt32(0),
                    Nam = reader.GetInt32(1),
                    TongDoanhThu = reader.GetDecimal(2),
                    SoDonHang = reader.GetInt32(3)
                });
            }
            result.DoanhThuTheoThang = list.ToArray();
        }

        // Top 10 tác phẩm bán chạy
        var queryTop10TP = @"
            SELECT TOP 10
                tp.MaTacPham,
                tp.TenTacPham,
                hs.TenHoaSi,
                ISNULL(SUM(ct.SoLuong), 0) AS SoLuongBan,
                ISNULL(SUM(ct.SoLuong * ct.DonGia), 0) AS DoanhThu
            FROM TacPham tp
            LEFT JOIN ChiTietDonHang ct ON tp.MaTacPham = ct.MaTacPham
            LEFT JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang AND dh.TrangThai = 3
            LEFT JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
            GROUP BY tp.MaTacPham, tp.TenTacPham, hs.TenHoaSi
            ORDER BY SoLuongBan DESC";

        using (var cmd = new SqlCommand(queryTop10TP, connection))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            var list = new List<TacPhamBanChay>();
            while (await reader.ReadAsync())
            {
                list.Add(new TacPhamBanChay
                {
                    MaTacPham = reader.GetInt32(0),
                    TenTacPham = reader.GetString(1),
                    TenHoaSi = reader.IsDBNull(2) ? "N/A" : reader.GetString(2),
                    SoLuongBan = reader.GetInt32(3),
                    DoanhThu = reader.GetDecimal(4)
                });
            }
            result.Top10TacPham = list.ToArray();
        }

        // Top 10 khách hàng chi tiêu nhiều nhất
        var queryTop10KH = @"
            SELECT TOP 10
                nd.MaNguoiDung,
                nd.Ten,
                COUNT(dh.MaDonHang) AS SoDonHang,
                ISNULL(SUM(dh.TongTien), 0) AS TongChiTieu
            FROM NguoiDung nd
            LEFT JOIN DonHang dh ON nd.MaNguoiDung = dh.MaNguoiDung AND dh.TrangThai = 3
            GROUP BY nd.MaNguoiDung, nd.Ten
            ORDER BY TongChiTieu DESC";

        using (var cmd = new SqlCommand(queryTop10KH, connection))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            var list = new List<KhachHangTop>();
            while (await reader.ReadAsync())
            {
                list.Add(new KhachHangTop
                {
                    MaNguoiDung = reader.GetInt32(0),
                    Ten = reader.GetString(1),
                    SoDonHang = reader.GetInt32(2),
                    TongChiTieu = reader.GetDecimal(3)
                });
            }
            result.Top10KhachHang = list.ToArray();
        }

        // Top 10 họa sĩ doanh thu cao nhất
        var queryTop10HS = @"
            SELECT TOP 10
                hs.MaHoaSi,
                hs.TenHoaSi,
                COUNT(DISTINCT tp.MaTacPham) AS SoTacPham,
                ISNULL(SUM(ct.SoLuong), 0) AS SoLuongBan,
                ISNULL(SUM(ct.SoLuong * ct.DonGia), 0) AS DoanhThu
            FROM HoaSi hs
            LEFT JOIN TacPham tp ON hs.MaHoaSi = tp.MaHoaSi
            LEFT JOIN ChiTietDonHang ct ON tp.MaTacPham = ct.MaTacPham
            LEFT JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang AND dh.TrangThai = 3
            GROUP BY hs.MaHoaSi, hs.TenHoaSi
            ORDER BY DoanhThu DESC";

        using (var cmd = new SqlCommand(queryTop10HS, connection))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            var list = new List<HoaSiTop>();
            while (await reader.ReadAsync())
            {
                list.Add(new HoaSiTop
                {
                    MaHoaSi = reader.GetInt32(0),
                    TenHoaSi = reader.GetString(1),
                    SoTacPham = reader.GetInt32(2),
                    SoLuongBan = reader.GetInt32(3),
                    DoanhThu = reader.GetDecimal(4)
                });
            }
            result.Top10HoaSi = list.ToArray();
        }

        return result;
    }

    // ================================================================
    // THỐNG KÊ NHANH
    // ================================================================

    public async Task<ThongKeNhanhResponse> GetThongKeNhanh(DateTime ngay)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Đơn hàng: 3 = Đã giao (hoàn thành)
        var query = @"
            SELECT 
                (SELECT COUNT(*) FROM DonHang WHERE CAST(NgayDat AS DATE) = @Ngay) AS DonHangMoi,
                (SELECT COUNT(*) FROM DonHang WHERE CAST(NgayDat AS DATE) = @Ngay AND TrangThai = 3) AS DonHangHoanThanh,
                (SELECT ISNULL(SUM(TongTien), 0) FROM DonHang WHERE CAST(NgayDat AS DATE) = @Ngay AND TrangThai = 3) AS DoanhThuNgay,
                (SELECT COUNT(*) FROM DonHang WHERE TrangThai IN (0, 1, 4)) AS DonHangChoXuLy,
                (SELECT COUNT(*) FROM NguoiDung WHERE EXISTS (
                    SELECT 1 FROM DonHang d WHERE d.MaNguoiDung = NguoiDung.MaNguoiDung
                        AND CAST(d.NgayDat AS DATE) = @Ngay
                )) AS KhachHangMoi,
                (SELECT COUNT(*) FROM TacPham WHERE CAST(NgayTao AS DATE) = @Ngay) AS TacPhamMoi";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Ngay", ngay.Date);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            int donHangMoi = reader.GetInt32(0);
            int donHangHoanThanh = reader.GetInt32(1);
            decimal doanhThu = reader.IsDBNull(2) ? 0 : reader.GetDecimal(2);
            int donHangChoXuLy = reader.GetInt32(3);
            int khachHangMoi = reader.GetInt32(4);
            int tacPhamMoi = reader.GetInt32(5);
            decimal tyLeHoanThanh = donHangMoi == 0
                ? 0m
                : Math.Round((decimal)donHangHoanThanh * 100m / donHangMoi, 2);

            return new ThongKeNhanhResponse
            {
                Ngay = ngay,
                DonHangMoi = donHangMoi,
                DonHangHoanThanh = donHangHoanThanh,
                DoanhThuNgay = doanhThu,
                KhachHangMoi = khachHangMoi,
                TacPhamMoi = tacPhamMoi,
                DonHangChoXuLy = donHangChoXuLy,
                TyLeHoanThanh = tyLeHoanThanh
            };
        }

        return new ThongKeNhanhResponse { Ngay = ngay };
    }

    // ================================================================
    // DOANH THU THEO THÁNG
    // ================================================================

    public async Task<List<DoanhThuTheoThangResponse>> GetDoanhThuTheoThang(int nam)
    {
        var list = new List<DoanhThuTheoThangResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // TrangThai=3 là "Hoàn thành"
        var query = @"
            SELECT 
                MONTH(NgayDat) AS Thang,
                @Nam AS Nam,
                ISNULL(SUM(TongTien), 0) AS TongDoanhThu,
                COUNT(*) AS SoDonHang
            FROM DonHang
            WHERE TrangThai = 3 AND YEAR(NgayDat) = @Nam
            GROUP BY MONTH(NgayDat)
            ORDER BY Thang";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Nam", nam);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new DoanhThuTheoThangResponse
            {
                Thang = reader.GetInt32(0),
                Nam = reader.GetInt32(1),
                TongDoanhThu = reader.GetDecimal(2),
                SoDonHang = reader.GetInt32(3)
            });
        }

        return list;
    }

    // ================================================================
    // DOANH THU THEO HỌA SĨ
    // ================================================================

    public async Task<List<DoanhThuTheoHoaSiResponse>> GetDoanhThuTheoHoaSi(DateTime? tuNgay, DateTime? denNgay)
    {
        var list = new List<DoanhThuTheoHoaSiResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var whereClause = "";
        if (tuNgay.HasValue && denNgay.HasValue)
            whereClause = "AND dh.NgayDat BETWEEN @TuNgay AND @DenNgay";
        else if (tuNgay.HasValue)
            whereClause = "AND dh.NgayDat >= @TuNgay";
        else if (denNgay.HasValue)
            whereClause = "AND dh.NgayDat <= @DenNgay";

        // Dùng CASE WHEN dh.MaDonHang IS NOT NULL để chỉ tính doanh thu và số lượng
        // từ các đơn hàng đã hoàn thành (TrangThai=3). LEFT JOIN giữ lại tất cả họa sĩ
        // kể cả chưa bán được gì (doanhThu = 0).
        var query = $@"
            SELECT 
                hs.MaHoaSi,
                hs.TenHoaSi,
                COUNT(DISTINCT tp.MaTacPham) AS SoTacPham,
                ISNULL(SUM(CASE WHEN dh.MaDonHang IS NOT NULL THEN ct.SoLuong ELSE 0 END), 0) AS SoLuongBan,
                ISNULL(SUM(CASE WHEN dh.MaDonHang IS NOT NULL THEN ct.SoLuong * ct.DonGia ELSE 0 END), 0) AS DoanhThu
            FROM HoaSi hs
            LEFT JOIN TacPham tp ON hs.MaHoaSi = tp.MaHoaSi
            LEFT JOIN ChiTietDonHang ct ON tp.MaTacPham = ct.MaTacPham
            LEFT JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang AND dh.TrangThai = 3 {whereClause}
            GROUP BY hs.MaHoaSi, hs.TenHoaSi
            ORDER BY DoanhThu DESC";

        using var command = new SqlCommand(query, connection);
        if (tuNgay.HasValue) command.Parameters.AddWithValue("@TuNgay", tuNgay.Value);
        if (denNgay.HasValue) command.Parameters.AddWithValue("@DenNgay", denNgay.Value);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new DoanhThuTheoHoaSiResponse
            {
                MaHoaSi = reader.GetInt32(0),
                TenHoaSi = reader.GetString(1),
                SoTacPham = reader.GetInt32(2),
                SoLuongBan = reader.IsDBNull(3) ? 0 : reader.GetInt32(3),
                DoanhThu = reader.IsDBNull(4) ? 0 : reader.GetDecimal(4)
            });
        }

        return list;
    }

    // ================================================================
    // TÁC PHẨM BÁN CHẠY
    // ================================================================

    public async Task<List<TacPhamBanChayResponse>> GetTacPhamBanChay(int top)
    {
        var list = new List<TacPhamBanChayResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = $@"
            SELECT TOP {top}
                tp.MaTacPham,
                tp.TenTacPham,
                ISNULL(hs.TenHoaSi, N'N/A') AS TenHoaSi,
                ISNULL(SUM(ct.SoLuong), 0) AS SoLuongBan,
                ISNULL(SUM(ct.SoLuong * ct.DonGia), 0) AS DoanhThu
            FROM TacPham tp
            LEFT JOIN HoaSi hs ON tp.MaHoaSi = hs.MaHoaSi
            LEFT JOIN ChiTietDonHang ct ON tp.MaTacPham = ct.MaTacPham
            LEFT JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang AND dh.TrangThai = 3
            GROUP BY tp.MaTacPham, tp.TenTacPham, hs.TenHoaSi
            ORDER BY SoLuongBan DESC";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new TacPhamBanChayResponse
            {
                MaTacPham = reader.GetInt32(0),
                TenTacPham = reader.GetString(1),
                TenHoaSi = reader.GetString(2),
                SoLuongBan = reader.GetInt32(3),
                DoanhThu = reader.GetDecimal(4)
            });
        }

        return list;
    }

    // ================================================================
    // KHÁCH HÀNG TIỀM NĂNG
    // ================================================================

    public async Task<List<KhachHangTiemNangResponse>> GetKhachHangTiemNang(int top)
    {
        var list = new List<KhachHangTiemNangResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = $@"
            SELECT TOP {top}
                nd.MaNguoiDung,
                nd.Ten,
                COUNT(dh.MaDonHang) AS SoDonHang,
                ISNULL(SUM(dh.TongTien), 0) AS TongChiTieu
            FROM NguoiDung nd
            LEFT JOIN DonHang dh ON nd.MaNguoiDung = dh.MaNguoiDung AND dh.TrangThai = 3
            GROUP BY nd.MaNguoiDung, nd.Ten
            ORDER BY TongChiTieu DESC";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new KhachHangTiemNangResponse
            {
                MaNguoiDung = reader.GetInt32(0),
                Ten = reader.GetString(1),
                SoDonHang = reader.GetInt32(2),
                TongChiTieu = reader.GetDecimal(3)
            });
        }

        return list;
    }

    // ================================================================
    // THỐNG KÊ TRẠNG THÁI ĐƠN HÀNG
    // ================================================================

    public async Task<ThongKeTrangThaiDonHangResponse> GetThongKeTrangThaiDonHang()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Đơn hàng: 0=Chờ xác nhận, 1=Đã xác nhận, 2=Đang giao, 3=Đã giao, 4=Yêu cầu hủy, 5=Đã hủy
        var query = @"
            SELECT 
                COUNT(CASE WHEN TrangThai IN (0, 1, 4) THEN 1 END) AS ChoXuLy,
                COUNT(CASE WHEN TrangThai = 2 THEN 1 END) AS DangGiao,
                COUNT(CASE WHEN TrangThai = 3 THEN 1 END) AS HoanThanh,
                COUNT(CASE WHEN TrangThai = 5 THEN 1 END) AS DaHuy,
                ISNULL(SUM(CASE WHEN TrangThai = 3 THEN TongTien ELSE 0 END), 0) AS TongDoanhThu
            FROM DonHang";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new ThongKeTrangThaiDonHangResponse
            {
                ChoXuLy = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                DangGiao = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                HoanThanh = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                DaHuy = reader.IsDBNull(3) ? 0 : reader.GetInt32(3),
                TongDoanhThu = reader.IsDBNull(4) ? 0 : reader.GetDecimal(4)
            };
        }

        return new ThongKeTrangThaiDonHangResponse();
    }
}
