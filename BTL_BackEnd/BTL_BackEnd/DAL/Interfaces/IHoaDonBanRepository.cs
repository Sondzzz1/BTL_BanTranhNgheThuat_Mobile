using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IHoaDonBanRepository
{
    /// <summary>Lấy hóa đơn theo mã hóa đơn (bao gồm chi tiết).</summary>
    Task<HoaDonBan?> GetByMaHoaDon(int maHoaDon);

    /// <summary>Lấy hóa đơn theo mã đơn hàng (bao gồm chi tiết). Một đơn chỉ có 1 hóa đơn.</summary>
    Task<HoaDonBan?> GetByMaDonHang(int maDonHang);

    /// <summary>Lấy danh sách hóa đơn của khách hàng (không bao gồm chi tiết).</summary>
    Task<List<HoaDonBan>> GetByMaNguoiDung(int maNguoiDung);

    /// <summary>Lấy tất cả hóa đơn (admin, không bao gồm chi tiết).</summary>
    Task<List<HoaDonBan>> GetAll();

    /// <summary>Tạo hóa đơn cho đơn hàng một cách idempotent trong transaction. Nếu đã có thì trả về hóa đơn hiện tại.</summary>
    Task<HoaDonBan> CreateInvoiceForOrderAsync(int maDonHang);
}
