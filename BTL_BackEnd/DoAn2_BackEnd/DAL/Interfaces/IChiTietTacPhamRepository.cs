using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IChiTietTacPhamRepository
{
    // Họa sĩ
    Task<int> Create(int maHoaSi, int maTacPham, ChiTietTacPham chiTiet);
    Task<bool> Update(int maHoaSi, int maTacPham, ChiTietTacPham chiTiet);
    Task<bool> Delete(int maHoaSi, int maTacPham);
    Task<ChiTietTacPham?> GetByMaTacPham(int maTacPham);
    
    // Admin
    Task<List<ChiTietTacPham>> GetAllChoDuyet();
    Task<List<ChiTietTacPham>> GetAll(int trangThai = -1);
    Task<bool> Duyet(int maTacPham, int maNguoiDuyet, bool pheDuyet, string? lyDoTuChoi);
    
    // Public
    Task<ChiTietTacPham?> GetCongKhai(int maTacPham);
}
