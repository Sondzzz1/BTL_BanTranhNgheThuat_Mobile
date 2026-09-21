using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ITacPhamChinhSuaRepository
{
    Task<TacPhamChinhSua?> GetById(int maChinhSua);
    Task<TacPhamChinhSua?> GetByMaTacPhamChoDuyet(int maTacPham);
    Task<List<TacPhamChinhSua>> GetAllChoDuyet();
    Task<int> Create(TacPhamChinhSua chinhSua);
    Task<bool> Update(TacPhamChinhSua chinhSua);
    Task<bool> Delete(int maChinhSua);
}
