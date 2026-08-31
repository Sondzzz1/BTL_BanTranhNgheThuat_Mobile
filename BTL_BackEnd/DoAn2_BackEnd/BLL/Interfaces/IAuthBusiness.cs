using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IAuthBusiness
{
    Task<DangNhapResponse> DangNhap(DangNhapRequest request);
    Task<DangNhapResponse> DangKy(DangKyRequest request);
    Task<bool> DangXuat(int maTaiKhoan);
    Task<DangNhapResponse> LamMoiToken(string refreshToken);
    Task<(bool Success, string Message)> DoiMatKhau(int maTaiKhoan, string matKhauCu, string matKhauMoi);
}
