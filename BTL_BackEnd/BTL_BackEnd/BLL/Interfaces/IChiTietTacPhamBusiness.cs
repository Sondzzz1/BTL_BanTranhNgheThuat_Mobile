using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IChiTietTacPhamBusiness
{
    // Họa sĩ
    Task<int> TaoChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request);
    Task<bool> CapNhatChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request);
    Task<bool> XoaChiTiet(int maHoaSi, int maTacPham);
    Task<ChiTietTacPhamResponse?> GetChiTiet(int maTacPham);
    
    // Admin
    Task<List<ChiTietChoDuyetResponse>> GetDanhSachChoDuyet();
    Task<List<ChiTietTacPhamResponse>> GetTatCaChiTiet(int trangThai = -1);
    Task<bool> DuyetChiTiet(int maTacPham, int maNguoiDuyet, DuyetChiTietTacPhamRequest request);
    
    // Public
    Task<ChiTietTacPhamCongKhaiResponse?> GetChiTietCongKhai(int maTacPham);
}
