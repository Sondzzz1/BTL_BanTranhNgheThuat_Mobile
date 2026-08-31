using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface INoiDungRepository
{
    Task<List<NoiDung>> GetAll(string? loai = null);
    Task<NoiDung?> GetById(int id);
    Task<List<NoiDung>> GetByTacPham(int maTacPham);
    Task<int> Create(NoiDung noiDung);
    Task<bool> Update(NoiDung noiDung);
    Task<bool> Delete(int id);
}
