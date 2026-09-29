using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IHoanTraRepository
{
    // Customer
    Task<int> TaoYeuCauHoanTra(int maNguoiDung, TaoHoanTraRequest request);
    Task<bool> LaTranhDatVe(int maNguoiDung, TaoHoanTraRequest request);
    Task<List<HoanTraSummaryResponse>> GetByNguoiDung(int maNguoiDung);
    Task<HoanTraDetailResponse?> GetById(int maYeuCau, int? maNguoiDung = null);
    Task<bool> XacNhanDaGuiHang(int maYeuCau, int maNguoiDung);
    Task<bool> HuyYeuCau(int maYeuCau, int maNguoiDung);
    Task<bool> KiemTraDonHangHopLe(int maDonHang, int maNguoiDung, int maTacPham);
    Task<bool> KiemTraDaCoYeuCau(int maDonHang, int maTacPham, int maNguoiDung);

    // Admin
    Task<List<HoanTraSummaryResponse>> GetAll(string? trangThai = null, DateTime? tuNgay = null, DateTime? denNgay = null, string? keyword = null);
    Task<bool> DuyetYeuCau(int maYeuCau, int maTaiKhoan, bool chapNhan, string? lyDoTuChoi = null);
    Task<bool> CapNhatTrangThai(int maYeuCau, string trangThai);
    Task<bool> XacNhanNhanHang(int maYeuCau, int maTaiKhoan, bool coTheBanLai);
    Task<bool> XacNhanHoanTien(int maYeuCau, int maTaiKhoan, XacNhanHoanTienRequest request);
    Task<bool> HoanTat(int maYeuCau);
}
