using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IDanhGiaBusiness
{
    Task<List<DanhGiaResponse>> GetByArtwork(int maTacPham);
    Task<List<DanhGiaResponse>> GetFiveStars();
    Task<TongHopDanhGiaResponse> GetSummary(int maTacPham);
    Task<QuyenDanhGiaResponse> GetPermission(int maNguoiDung, int maTacPham);
    Task<DanhGiaResponse> Create(int maNguoiDung, TaoDanhGiaRequest request);
    Task<DanhGiaResponse> Update(int maNguoiDung, int maDanhGia, CapNhatDanhGiaRequest request);
    Task Delete(int maNguoiDung, int maDanhGia);
}
