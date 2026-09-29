using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface ICustomArtBusiness
{
    Task<CustomArtRequestResponse> TaoYeuCau(int maKhachHang, TaoYeuCauTranhRequest request);
    Task<List<CustomArtRequestResponse>> LayYeuCauCuaToi(int maKhachHang);
    Task<List<CustomArtRequestResponse>> LayYeuCauChoAdmin(string? type, string? status);
    Task<List<CustomArtRequestResponse>> LayYeuCauChoHoaSi(int maHoaSi);
    Task<CustomArtRequestResponse?> LayChiTiet(int maYeuCau, int? maNguoiDung, int? maHoaSi, bool isAdmin);
    Task<bool> CapNhatYeuCau(int maYeuCau, int maKhachHang, CapNhatYeuCauTranhRequest request);
    Task<bool> HuyYeuCau(int maYeuCau, int maKhachHang);
    Task<bool> NhanYeuCau(int maYeuCau, int maHoaSi);
    Task<bool> DuyetYeuCau(int maYeuCau, int maTaiKhoan, string? note);
    Task<bool> YeuCauBoSungQuyen(int maYeuCau, int maTaiKhoan, string? note);
    Task<bool> TuChoiYeuCau(int maYeuCau, int maTaiKhoan, string? note);
    Task<bool> CapNhatTrangThai(int maYeuCau, int maHoaSi, string status);
    Task<int?> HoanThanhYeuCau(int maYeuCau, int maHoaSi, HoanThanhYeuCauRequest request);
    Task<CustomArtQuoteResponse> TaoBaoGia(BaoGiaTranhRequest request, int maHoaSi);
    Task<bool> XacNhanBaoGia(int maBaoGia, int maKhachHang);
    Task<bool> DatCoc(int maYeuCau, int maKhachHang, decimal soTien);
    Task<bool> ThemTienDo(TaoTienDoRequest request, int maHoaSi);
    Task<string?> LayTepTienDo(int maYeuCau, int maTienDo, int? maNguoiDung, int? maHoaSi, bool isAdmin);
    Task<bool> GuiPhanHoi(TaoPhanHoiRequest request, int maKhachHang);
    Task<bool> XacNhanHoanThanh(int maYeuCau, int maKhachHang);
    Task<bool> LuuDuongDanTep(int maYeuCau, int maKhachHang, string fileKind, string storedPath);
    Task<string?> LayDuongDanTep(int maYeuCau, string fileKind, int? maNguoiDung, int? maHoaSi, bool isAdmin);
}
