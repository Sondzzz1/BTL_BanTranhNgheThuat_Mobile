using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/tranh-theo-yeu-cau")]
[Authorize]
public class CustomArtController : ControllerBase
{
    private readonly ICustomArtBusiness _customArtBusiness;

    public CustomArtController(ICustomArtBusiness customArtBusiness)
    {
        _customArtBusiness = customArtBusiness;
    }

    [HttpPost("tao-yeu-cau")]
    public async Task<ActionResult<CustomArtRequestResponse>> TaoYeuCau([FromBody] TaoYeuCauTranhRequest request)
    {
        try
        {
            var maKhachHang = JwtHelper.GetMaNguoiDung(User);
            if (maKhachHang == null)
                return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

            var result = await _customArtBusiness.TaoYeuCau(maKhachHang.Value, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("yeu-cau-cua-toi")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayYeuCauCuaToi()
    {
        var maKhachHang = JwtHelper.GetMaNguoiDung(User);
        if (maKhachHang == null)
            return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

        var result = await _customArtBusiness.LayYeuCauCuaToi(maKhachHang.Value);
        return Ok(result);
    }

    [HttpGet("danh-sach-yeu-cau")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayTatCaYeuCau()
    {
        var result = await _customArtBusiness.LayTatCaYeuCau();
        return Ok(result);
    }

    [HttpPost("nhan-yeu-cau/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> CapNhatNhanYeuCau(int id)
    {
        var maHoaSi = JwtHelper.GetMaHoaSi(User);
        if (maHoaSi == null)
            return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

        var success = await _customArtBusiness.NhanYeuCau(id, maHoaSi.Value);
        if (!success)
            return Conflict(new { message = "Yêu cầu này đã được nhận bởi họa sĩ khác hoặc không tồn tại." });

        return Ok(new { message = "Đã nhận yêu cầu và chuyển sang trạng thái đang xử lý" });
    }

    [HttpPost("tu-choi-yeu-cau/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> TuChoiYeuCau(int id)
    {
        var success = await _customArtBusiness.TuChoiYeuCau(id);
        if (!success) return NotFound(new { message = "Không tìm thấy yêu cầu" });
        return Ok(new { message = "Đã từ chối yêu cầu" });
    }

    [HttpPost("tao-bao-gia")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult<CustomArtQuoteResponse>> TaoBaoGia([FromBody] BaoGiaTranhRequest request)
    {
        try
        {
            var result = await _customArtBusiness.TaoBaoGia(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("bao-gia/{quoteId}/xac-nhan")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public async Task<ActionResult> XacNhanBaoGia(int quoteId)
    {
        var success = await _customArtBusiness.XacNhanBaoGia(quoteId);
        if (!success) return NotFound(new { message = "Báo giá không tồn tại" });
        return Ok(new { message = "Khách hàng đã xác nhận báo giá" });
    }

    [HttpPost("dat-coc")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public async Task<ActionResult> DatCoc([FromBody] CustomArtPayment payment)
    {
        try
        {
            var maKhachHang = JwtHelper.GetMaNguoiDung(User);
            if (maKhachHang == null)
                return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

            var success = await _customArtBusiness.DatCoc(payment.MaYeuCau, maKhachHang.Value, payment.SoTien);
            if (!success) return NotFound(new { message = "Yêu cầu không tồn tại" });
            return Ok(new { message = "Đặt cọc thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("cap-nhat-tien-do")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> ThemTienDo([FromBody] TaoTienDoRequest request)
    {
        var maHoaSi = JwtHelper.GetMaHoaSi(User);
        if (maHoaSi == null)
            return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

        var success = await _customArtBusiness.ThemTienDo(request, maHoaSi.Value);
        if (!success) return NotFound(new { message = "Yêu cầu không tồn tại" });
        return Ok(new { message = "Cập nhật tiến độ thành công" });
    }

    [HttpPost("gui-phan-hoi")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public async Task<ActionResult> GuiPhanHoi([FromBody] TaoPhanHoiRequest request)
    {
        var maKhachHang = JwtHelper.GetMaNguoiDung(User);
        if (maKhachHang == null)
            return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

        var success = await _customArtBusiness.GuiPhanHoi(request, maKhachHang.Value);
        if (!success) return NotFound(new { message = "Yêu cầu không tồn tại" });
        return Ok(new { message = "Đã gửi phản hồi chỉnh sửa" });
    }

    [HttpPost("xac-nhan-hoan-thanh/{id}")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public async Task<ActionResult> XacNhanHoanThanh(int id)
    {
        var maKhachHang = JwtHelper.GetMaNguoiDung(User);
        if (maKhachHang == null)
            return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

        var success = await _customArtBusiness.XacNhanHoanThanh(id, maKhachHang.Value);
        if (!success) return NotFound(new { message = "Không tìm thấy yêu cầu" });
        return Ok(new { message = "Khách hàng đã xác nhận hoàn thành" });
    }
}
