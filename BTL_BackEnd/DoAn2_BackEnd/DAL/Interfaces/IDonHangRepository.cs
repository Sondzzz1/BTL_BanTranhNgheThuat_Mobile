using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IDonHangRepository
{
    Task<List<DonHang>> GetAll();
    Task<DonHang?> GetById(int maDonHang);
    Task<List<DonHang>> GetByNguoiDung(int maNguoiDung);
    Task<int> Create(DonHang donHang);
    Task<bool> Update(DonHang donHang);
    Task<bool> UpdateTrangThai(int maDonHang, byte trangThai, string? lyDoHuy = null);
    Task<List<ChiTietDonHang>> GetChiTiet(int maDonHang);
    Task<int> CreateChiTiet(ChiTietDonHang chiTiet);
}
