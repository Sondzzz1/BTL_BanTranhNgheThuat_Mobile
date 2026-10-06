using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class HoaDonBanBusiness : IHoaDonBanBusiness
{
    private readonly IHoaDonBanRepository _hoaDonRepo;
    private readonly IDonHangRepository _donHangRepo;
    private readonly IThanhToanRepository _thanhToanRepo;
    private readonly InvoiceDocumentService _pdfService;

    public HoaDonBanBusiness(
        IHoaDonBanRepository hoaDonRepo,
        IDonHangRepository donHangRepo,
        IThanhToanRepository thanhToanRepo,
        InvoiceDocumentService pdfService)
    {
        _hoaDonRepo = hoaDonRepo;
        _donHangRepo = donHangRepo;
        _thanhToanRepo = thanhToanRepo;
        _pdfService = pdfService;
    }

    public async Task<HoaDonBanResponse?> GetByMaHoaDon(int maHoaDon, int maNguoiDung, bool isAdmin)
    {
        var hoaDon = await _hoaDonRepo.GetByMaHoaDon(maHoaDon);
        if (hoaDon == null) return null;

        if (!isAdmin && hoaDon.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Bạn không có quyền xem hóa đơn này");

        return MapToResponse(hoaDon);
    }

    public async Task<HoaDonBanResponse?> GetByMaDonHang(int maDonHang, int maNguoiDung, bool isAdmin)
    {
        var hoaDon = await _hoaDonRepo.GetByMaDonHang(maDonHang);
        if (hoaDon != null)
        {
            if (!isAdmin && hoaDon.MaNguoiDung != maNguoiDung)
                throw new UnauthorizedAccessException("Bạn không có quyền xem hóa đơn này");

            return MapToResponse(hoaDon);
        }

        // Nếu chưa có hóa đơn: kiểm tra đơn hàng xem đã Đã giao & Đã thanh toán chưa để tự động tạo (resilient fallback)
        var donHang = await _donHangRepo.GetById(maDonHang);
        if (donHang == null) return null;

        if (!isAdmin && donHang.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Bạn không có quyền xem hóa đơn này");

        if (donHang.TrangThai == DonHangStatus.DaGiao)
        {
            var thanhToan = await _thanhToanRepo.GetByDonHang(maDonHang);
            if (thanhToan != null && string.Equals(thanhToan.TrangThai, "DaThanhToan", StringComparison.OrdinalIgnoreCase))
            {
                var created = await _hoaDonRepo.CreateInvoiceForOrderAsync(maDonHang);
                return MapToResponse(created);
            }
        }

        return null;
    }

    public async Task<HoaDonBanResponse> CreateInvoiceForOrder(int maDonHang, int maNguoiDung, bool isAdmin)
    {
        var donHang = await _donHangRepo.GetById(maDonHang);
        if (donHang == null)
            throw new KeyNotFoundException($"Không tìm thấy đơn hàng {maDonHang}");

        if (!isAdmin && donHang.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Bạn không có quyền tạo hóa đơn cho đơn hàng này");

        if (donHang.TrangThai != DonHangStatus.DaGiao)
            throw new BusinessConflictException("Chỉ đơn hàng đã giao mới được tạo hóa đơn");

        var thanhToan = await _thanhToanRepo.GetByDonHang(maDonHang);
        if (thanhToan == null || !string.Equals(thanhToan.TrangThai, "DaThanhToan", StringComparison.OrdinalIgnoreCase))
            throw new BusinessConflictException("Chỉ đơn hàng đã thanh toán mới được tạo hóa đơn");

        var invoice = await _hoaDonRepo.CreateInvoiceForOrderAsync(maDonHang);
        return MapToResponse(invoice);
    }

    public async Task<List<HoaDonBanSummaryResponse>> GetHoaDonCuaToi(int maNguoiDung)
    {
        var list = await _hoaDonRepo.GetByMaNguoiDung(maNguoiDung);
        return list.Select(h => new HoaDonBanSummaryResponse
        {
            MaHoaDon = h.MaHoaDon,
            MaDonHang = h.MaDonHang,
            NgayXuatHD = h.NgayXuatHD,
            TongTienHang = h.TongTienHang,
            TenNguoiMua = h.TenNguoiMua,
            PhuongThucThanhToan = h.PhuongThucThanhToan,
            TrangThai = h.TrangThai
        }).ToList();
    }

    public async Task<byte[]?> TaoPdf(int maHoaDon, int maNguoiDung, bool isAdmin)
    {
        var hoaDon = await _hoaDonRepo.GetByMaHoaDon(maHoaDon);
        if (hoaDon == null) return null;

        if (!isAdmin && hoaDon.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Bạn không có quyền tải hóa đơn này");

        return _pdfService.CreatePdf(hoaDon);
    }

    // ── Private helpers ──

    private static HoaDonBanResponse MapToResponse(HoaDonBan h) => new()
    {
        MaHoaDon = h.MaHoaDon,
        MaDonHang = h.MaDonHang,
        NgayXuatHD = h.NgayXuatHD,
        TongTienHang = h.TongTienHang,
        TenNguoiMua = h.TenNguoiMua,
        DiaChiNguoiMua = h.DiaChiNguoiMua,
        SoDienThoaiNguoiMua = h.SoDienThoaiNguoiMua,
        Email = h.Email,
        PhuongThucThanhToan = h.PhuongThucThanhToan,
        TrangThaiThanhToan = h.TrangThaiThanhToan,
        TrangThai = h.TrangThai,
        ChiTiet = h.ChiTiet.Select(c => new ChiTietHoaDonBanResponse
        {
            MaChiTietHD = c.MaChiTietHD,
            MaTacPham = c.MaTacPham,
            TenTacPham = c.TenTacPham,
            SoLuong = c.SoLuong,
            DonGia = c.DonGia,
            ThanhTien = c.ThanhTien
        }).ToList()
    };
}
