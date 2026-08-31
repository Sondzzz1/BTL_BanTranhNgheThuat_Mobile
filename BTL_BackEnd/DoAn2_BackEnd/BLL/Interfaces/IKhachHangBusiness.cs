using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IKhachHangBusiness
{
    // Thông tin cá nhân
    Task<ThongTinKhachHangResponse?> GetThongTin(int maNguoiDung);
    Task<bool> CapNhatThongTin(int maNguoiDung, CapNhatThongTinRequest request);

    // Giỏ hàng
    Task<GioHangResponse> GetGioHang(int maNguoiDung);
    Task<bool> ThemVaoGioHang(int maNguoiDung, ThemVaoGioHangRequest request);
    Task<bool> CapNhatGioHang(int maNguoiDung, int maChiTietGH, CapNhatGioHangRequest request);
    Task<bool> XoaKhoiGioHang(int maNguoiDung, int maChiTietGH);
    Task<bool> XoaToanBoGioHang(int maNguoiDung);

    // Đơn hàng
    Task<int> TaoDonHang(int maNguoiDung, TaoDonHangRequest request);
    Task<List<DonHangResponse>> GetDonHangCuaToi(int maNguoiDung);
    Task<DonHangResponse?> GetDonHangById(int maNguoiDung, int maDonHang);
    Task<bool> HuyDonHang(int maNguoiDung, int maDonHang, string? lyDo = null);
}
