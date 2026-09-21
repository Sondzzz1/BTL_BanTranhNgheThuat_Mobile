using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IContentBusiness
{
    // Bài viết
    Task<List<BaiVietResponse>> LayTatCaBaiViet();
    Task<List<BaiVietResponse>> LayTatCaBaiVietAdmin();
    Task<BaiVietResponse> LayBaiVietTheoId(int id);
    Task<int> TaoBaiViet(int maHoaSi, TaoBaiVietRequest request);
    Task<bool> CapNhatBaiViet(int id, int? maHoaSiCuaUser, bool isAdmin, CapNhatBaiVietRequest request);
    Task<bool> XoaBaiViet(int id, int? maHoaSiCuaUser, bool isAdmin);
    Task<bool> PheDuyetBaiViet(int id, DuyetBaiVietRequest request);

    // Chi tiết tác phẩm
    Task<List<NoiDungResponse>> LayTatCaChiTietTacPham(string? loai);
    Task<List<NoiDungResponse>> LayChiTietTheoTacPham(int maTacPham);
    Task<int> TaoChiTietTacPham(TaoNoiDungRequest request);
    Task<bool> CapNhatChiTietTacPham(int id, CapNhatNoiDungRequest request);
    Task<bool> XoaChiTietTacPham(int id);
}
