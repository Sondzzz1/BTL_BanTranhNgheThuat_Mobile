using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ITacPhamRepository
{
    Task<List<TacPham>> GetAll();
    Task<TacPham?> GetById(int maTacPham);
    Task<List<TacPham>> GetByHoaSi(int maHoaSi);
    Task<List<TacPham>> GetByDanhMuc(int maDanhMuc);
    Task<int> Create(TacPham tacPham);
    Task<bool> Update(TacPham tacPham);
    Task<bool> Delete(int maTacPham);
    Task<bool> HasDeliveredOrders(int maTacPham);
}
