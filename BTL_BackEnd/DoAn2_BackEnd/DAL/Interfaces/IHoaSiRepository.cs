using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IHoaSiRepository
{
    Task<List<HoaSi>> GetAll();
    Task<HoaSi?> GetById(int maHoaSi);
    Task<HoaSi?> GetByMaTaiKhoan(int maTaiKhoan);
    Task<int> Create(HoaSi hoaSi);
    Task<bool> Update(HoaSi hoaSi);
    Task<bool> Delete(int maHoaSi);
}
