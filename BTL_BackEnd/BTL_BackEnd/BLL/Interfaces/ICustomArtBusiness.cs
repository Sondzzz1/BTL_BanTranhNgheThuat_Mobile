using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface ICustomArtBusiness
{
    Task<CustomArtRequestResponse> TaoYeuCau(int maKhachHang, TaoYeuCauTranhRequest request);
    Task<List<CustomArtRequestResponse>> LayYeuCauCuaToi(int maKhachHang);
    Task<List<CustomArtRequestResponse>> LayTatCaYeuCau();
    Task<bool> NhanYeuCau(int maYeuCau, int maHoaSi);
    Task<bool> TuChoiYeuCau(int maYeuCau);
    Task<CustomArtQuoteResponse> TaoBaoGia(BaoGiaTranhRequest request);
    Task<bool> XacNhanBaoGia(int maBaoGia);
    Task<bool> DatCoc(int maYeuCau, int maKhachHang, decimal soTien);
    Task<bool> ThemTienDo(TaoTienDoRequest request, int maHoaSi);
    Task<bool> GuiPhanHoi(TaoPhanHoiRequest request, int maKhachHang);
    Task<bool> XacNhanHoanThanh(int maYeuCau, int maKhachHang);
}
