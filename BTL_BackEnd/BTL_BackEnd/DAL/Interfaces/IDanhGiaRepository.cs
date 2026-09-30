using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IDanhGiaRepository
{
    Task<List<DanhGiaResponse>> GetByArtwork(int maTacPham);
    Task<List<DanhGiaResponse>> GetFiveStars();
    Task<TongHopDanhGiaResponse> GetSummary(int maTacPham);
    Task<DanhGiaResponse?> GetById(int maDanhGia);
    Task<DanhGiaResponse?> GetByUserAndArtwork(int maNguoiDung, int maTacPham);
    Task<bool> CanCreate(int maNguoiDung, int maTacPham);
    Task<int> Create(int maNguoiDung, TaoDanhGiaRequest request);
    Task<bool> Update(int maDanhGia, int maNguoiDung, CapNhatDanhGiaRequest request);
    Task<bool> Delete(int maDanhGia, int maNguoiDung);
}
