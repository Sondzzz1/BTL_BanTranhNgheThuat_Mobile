using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

/// <summary>
/// API hóa đơn bán hàng. Hóa đơn được tạo tự động khi đơn hàng chuyển sang
/// trạng thái Đã giao + Đã thanh toán. Không có endpoint tạo hóa đơn thủ công.
/// </summary>
[ApiController]
[Route("api/hoa-don")]
[Authorize]
public class HoaDonBanController : ControllerBase
{
    private readonly IHoaDonBanBusiness _hoaDonBusiness;

    public HoaDonBanController(IHoaDonBanBusiness hoaDonBusiness)
    {
        _hoaDonBusiness = hoaDonBusiness;
    }

    /// <summary>Khách hàng: lấy danh sách hóa đơn của tôi.</summary>
    [HttpGet("cua-toi")]
    public async Task<ActionResult> GetHoaDonCuaToi()
    {
        var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
        if (!maNguoiDung.HasValue)
            return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

        var result = await _hoaDonBusiness.GetHoaDonCuaToi(maNguoiDung.Value);
        return Ok(result);
    }

    /// <summary>Lấy hóa đơn theo mã đơn hàng.</summary>
    [HttpGet("don-hang/{maDonHang:int}")]
    public async Task<ActionResult> GetByDonHang(int maDonHang)
    {
        try
        {
            if (!TryGetInvoiceViewer(out var maNguoiDung, out var isAdmin))
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var result = await _hoaDonBusiness.GetByMaDonHang(maDonHang, maNguoiDung, isAdmin);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn cho đơn hàng này" });

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    /// <summary>Lấy hóa đơn theo mã hóa đơn.</summary>
    [HttpGet("{maHoaDon:int}")]
    public async Task<ActionResult> GetByMaHoaDon(int maHoaDon)
    {
        try
        {
            if (!TryGetInvoiceViewer(out var maNguoiDung, out var isAdmin))
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var result = await _hoaDonBusiness.GetByMaHoaDon(maHoaDon, maNguoiDung, isAdmin);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    /// <summary>Tải PDF hóa đơn.</summary>
    [HttpGet("{maHoaDon:int}/pdf")]
    public async Task<ActionResult> DownloadPdf(int maHoaDon)
    {
        try
        {
            if (!TryGetInvoiceViewer(out var maNguoiDung, out var isAdmin))
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var pdfBytes = await _hoaDonBusiness.TaoPdf(maHoaDon, maNguoiDung, isAdmin);
            if (pdfBytes == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });

            return File(pdfBytes, "application/pdf", $"HoaDon_HD{maHoaDon:D6}.pdf");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xác định người xem hóa đơn. Tài khoản quản trị không có MaNguoiDung vì
    /// không thuộc bảng NguoiDung, nhưng vẫn được phép xem mọi hóa đơn.
    /// </summary>
    private bool TryGetInvoiceViewer(out int maNguoiDung, out bool isAdmin)
    {
        // Hỗ trợ JWT cũ dùng role chuẩn và JWT hiện tại dùng claim VaiTro dạng số.
        isAdmin = User.IsInRole("Admin") || JwtHelper.IsAdmin(User);

        var maNguoiDungClaim = JwtHelper.GetMaNguoiDung(User);
        maNguoiDung = maNguoiDungClaim.GetValueOrDefault();

        return isAdmin || maNguoiDungClaim.HasValue;
    }
}
