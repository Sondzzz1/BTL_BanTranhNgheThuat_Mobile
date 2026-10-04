using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ITacPhamRepository
{
    Task<List<TacPham>> GetAll();
    Task<TacPham?> GetById(int maTacPham);
    Task<List<TacPham>> GetByHoaSi(int maHoaSi);
    Task<List<TacPham>> GetByDanhMuc(int maDanhMuc);
    Task<List<TacPham>> GetMarketplaceAll();
    Task<List<TacPham>> GetMarketplaceBestSelling(int top);
    Task<TacPham?> GetMarketplaceById(int maTacPham);
    Task<List<TacPham>> GetMarketplaceByArtist(int maHoaSi);
    Task<List<TacPham>> GetMarketplaceByCategory(int maDanhMuc);
    Task<(List<TacPham> Items, int TotalItems)> GetAdminPage(AdminArtworkQuery query);
    Task<int> Create(TacPham tacPham);
    Task<bool> Update(TacPham tacPham);
    Task<bool> UpdateWithArtistNotification(TacPham tacPham, ThongBao thongBao);
    Task<bool> Delete(int maTacPham);
    Task<bool> HasDeliveredOrders(int maTacPham);
}
