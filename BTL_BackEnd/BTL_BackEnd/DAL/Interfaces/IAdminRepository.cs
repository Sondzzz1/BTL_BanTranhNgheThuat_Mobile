using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IAdminRepository
{
    Task<DashboardResponse> GetDashboard();
    Task<ThongKeTongQuanResponse> GetThongKeTongQuan();
    Task<ThongKeNhanhResponse> GetThongKeNhanh(DateTime ngay);
    
    Task<List<DoanhThuTheoThangResponse>> GetDoanhThuTheoThang(int nam);
    Task<List<DoanhThuTheoHoaSiResponse>> GetDoanhThuTheoHoaSi(DateTime? tuNgay, DateTime? denNgay);
    Task<List<TacPhamBanChayResponse>> GetTacPhamBanChay(int top);
    Task<List<KhachHangTiemNangResponse>> GetKhachHangTiemNang(int top);
    Task<ThongKeTrangThaiDonHangResponse> GetThongKeTrangThaiDonHang();
}
