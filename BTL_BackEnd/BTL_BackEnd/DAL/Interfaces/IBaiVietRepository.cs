using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IBaiVietRepository
{
    Task<List<BaiViet>> GetAll();
    Task<(List<BaiViet> Items, int Total)> GetPublished(string? keyword, int? maDanhMuc, int page, int pageSize);
    Task<List<BaiViet>> GetByHoaSi(int maHoaSi);
    Task<BaiViet?> GetById(int maBaiViet);
    Task<BaiViet?> GetPublishedById(int maBaiViet);
    Task<int> Create(BaiViet baiViet);
    Task<bool> Update(BaiViet baiViet);
    Task<bool> Delete(int maBaiViet);
    Task<List<DanhMucBaiViet>> GetCategories(bool onlyActive = true);
    Task<int> CreateCategory(string name, string slug);
    Task<bool> UpdateCategory(int id, string name, string slug, bool active);
    Task<List<HinhAnhBaiViet>> GetImages(int maBaiViet);
    Task<int> AddImage(int maBaiViet, string path, string? caption, int order);
    Task<HinhAnhBaiViet?> GetImage(int maBaiViet, int maHinhAnh);
    Task<bool> DeleteImage(int maBaiViet, int maHinhAnh);
    Task<List<TacPham>> GetPublicLinkedArtworks(int maBaiViet);
    Task ReplaceArtworkLinks(int maBaiViet, IReadOnlyCollection<int> maTacPhams);
}
