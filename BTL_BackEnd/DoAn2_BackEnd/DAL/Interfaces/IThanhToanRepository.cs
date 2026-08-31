using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IThanhToanRepository
{
    Task<ThanhToan?> GetByDonHang(int maDonHang);
    Task<ThanhToan?> GetById(int maThanhToan);
    Task<int> Create(ThanhToan thanhToan);
    Task<bool> Update(ThanhToan thanhToan);
}
