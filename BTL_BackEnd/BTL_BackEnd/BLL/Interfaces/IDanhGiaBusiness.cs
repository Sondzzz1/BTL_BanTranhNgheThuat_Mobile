using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IDanhGiaBusiness
{
    Task<List<DanhGiaResponse>> GetByArtwork(int maTacPham);
    Task<List<DanhGiaResponse>> GetFiveStars();
    Task<TongHopDanhGiaResponse> GetSummary(int maTacPham);
    Task<QuyenDanhGiaResponse> GetPermission(int maNguoiDung, int maTacPham);
    Task<DanhGiaResponse> Create(int maNguoiDung, TaoDanhGiaRequest request);
    Task<DanhGiaResponse> CreateWithImage(int maNguoiDung, TaoDanhGiaRequest request, string? hinhAnhDanhGia);
    Task<DanhGiaResponse> Update(int maNguoiDung, int maDanhGia, CapNhatDanhGiaRequest request);
    Task<(DanhGiaResponse Review, string? PreviousImageName)> UpdateWithImage(
        int maNguoiDung,
        int maDanhGia,
        CapNhatDanhGiaRequest request,
        string? hinhAnhDanhGia);
    Task<string?> GetImageName(int maDanhGia);
    Task Delete(int maNguoiDung, int maDanhGia);
}
