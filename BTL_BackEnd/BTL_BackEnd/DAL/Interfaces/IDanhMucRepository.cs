using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IDanhMucRepository
{
    Task<List<DanhMuc>> GetAll();
    Task<DanhMuc?> GetById(int maDanhMuc);
    Task<int> Create(DanhMuc danhMuc);
    Task<bool> Update(DanhMuc danhMuc);
    Task<bool> Delete(int maDanhMuc);
}
