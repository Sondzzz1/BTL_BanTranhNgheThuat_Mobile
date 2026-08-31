using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IBaiVietRepository
{
    Task<List<BaiViet>> GetAll();
    Task<List<BaiViet>> GetByHoaSi(int maHoaSi);
    Task<BaiViet?> GetById(int maBaiViet);
    Task<int> Create(BaiViet baiViet);
    Task<bool> Update(BaiViet baiViet);
    Task<bool> Delete(int maBaiViet);
}
