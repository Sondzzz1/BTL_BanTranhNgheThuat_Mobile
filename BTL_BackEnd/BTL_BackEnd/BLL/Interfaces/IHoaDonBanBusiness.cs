using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IHoaDonBanBusiness
{
    /// <summary>Lấy hóa đơn theo mã hóa đơn. Kiểm tra ownership cho khách hàng.</summary>
    Task<HoaDonBanResponse?> GetByMaHoaDon(int maHoaDon, int maNguoiDung, bool isAdmin);

    /// <summary>Lấy hóa đơn theo mã đơn hàng. Kiểm tra ownership cho khách hàng.</summary>
    Task<HoaDonBanResponse?> GetByMaDonHang(int maDonHang, int maNguoiDung, bool isAdmin);

    /// <summary>Danh sách hóa đơn của khách hàng.</summary>
    Task<List<HoaDonBanSummaryResponse>> GetHoaDonCuaToi(int maNguoiDung);

    /// <summary>Tạo hóa đơn cho đơn hàng (idempotent). Kiểm tra trạng thái và quyền sở hữu.</summary>
    Task<HoaDonBanResponse> CreateInvoiceForOrder(int maDonHang, int maNguoiDung, bool isAdmin);

    /// <summary>Tạo PDF hóa đơn. Kiểm tra ownership cho khách hàng.</summary>
    Task<byte[]?> TaoPdf(int maHoaDon, int maNguoiDung, bool isAdmin);
}
