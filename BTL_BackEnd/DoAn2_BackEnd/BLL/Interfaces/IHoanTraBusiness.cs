using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IHoanTraBusiness
{
    // Customer
    Task<TaoHoanTraResponse> TaoYeuCauHoanTra(int maNguoiDung, TaoHoanTraRequest request);
    Task<List<HoanTraSummaryResponse>> GetHoanTraCuaToi(int maNguoiDung);
    Task<HoanTraDetailResponse> GetChiTiet(int maYeuCau, int maNguoiDung);
    Task XacNhanDaGuiHang(int maYeuCau, int maNguoiDung);

    // Admin
    Task<List<HoanTraSummaryResponse>> GetAllHoanTra(string? trangThai, DateTime? tuNgay, DateTime? denNgay, string? keyword);
    Task<HoanTraDetailResponse> GetChiTietAdmin(int maYeuCau);
    Task DuyetYeuCau(int maYeuCau, DuyetHoanTraRequest request);
    Task CapNhatTrangThai(int maYeuCau, CapNhatTrangThaiHoanTraRequest request);
    Task HoanTat(int maYeuCau);
}
