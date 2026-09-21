using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ITaiKhoanRepository
{
    Task<TaiKhoan?> GetByTenDangNhap(string tenDangNhap);
    Task<TaiKhoan?> GetById(int maTaiKhoan);
    Task<int> Create(TaiKhoan taiKhoan);
    Task<bool> Update(TaiKhoan taiKhoan);
    Task<bool> CheckTenDangNhapExists(string tenDangNhap);
}
