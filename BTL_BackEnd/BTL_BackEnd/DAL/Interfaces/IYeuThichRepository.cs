using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IYeuThichRepository
{
    Task<List<YeuThich>> GetByNguoiDung(int maNguoiDung);
    Task<YeuThich?> GetByNguoiDungAndTacPham(int maNguoiDung, int maTacPham);
    Task<bool> Exists(int maNguoiDung, int maTacPham);
    Task<YeuThich> Add(YeuThich yeuThich);
    Task<bool> Delete(int maNguoiDung, int maTacPham);
    Task<int> CountByTacPham(int maTacPham);
}
