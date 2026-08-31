using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface INguoiDungRepository
{
    Task<List<NguoiDung>> GetAll();
    Task<NguoiDung?> GetById(int maNguoiDung);
    Task<NguoiDung?> GetByMaTaiKhoan(int maTaiKhoan);
    Task<int> Create(NguoiDung nguoiDung);
    Task<bool> Update(NguoiDung nguoiDung);
    Task<bool> Delete(int maNguoiDung);
}
