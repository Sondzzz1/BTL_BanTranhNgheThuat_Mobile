using DoAn2_BackEnd.Attributes;
using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

public class HuyDonHangRequest
{
    public string? LyDo { get; set; }
}

[ApiController]
[Route("api")]
[Authorize(Roles = "Admin,NguoiDung")]
public class KhachHangController : ControllerBase
{
    private readonly IKhachHangBusiness _khachHangBusiness;

    public KhachHangController(IKhachHangBusiness khachHangBusiness)
    {
        _khachHangBusiness = khachHangBusiness;
    }

    // Thông tin cá nhân
    [HttpGet("khach-hang/thong-tin")]
    public async Task<ActionResult<ThongTinKhachHangResponse>> GetThongTin()
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var result = await _khachHangBusiness.GetThongTin(maNguoiDung.Value);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy thông tin" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("khach-hang/cap-nhat")]
    public async Task<ActionResult> CapNhatThongTin([FromBody] CapNhatThongTinRequest request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var success = await _khachHangBusiness.CapNhatThongTin(maNguoiDung.Value, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy hồ sơ" });
            
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Giỏ hàng
    [HttpGet("gio-hang")]
    public async Task<ActionResult<GioHangResponse>> GetGioHang()
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var result = await _khachHangBusiness.GetGioHang(maNguoiDung.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("gio-hang/them")]
    public async Task<ActionResult> ThemVaoGioHang([FromBody] ThemVaoGioHangRequest request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var success = await _khachHangBusiness.ThemVaoGioHang(maNguoiDung.Value, request);
            if (!success)
                return BadRequest(new { message = "Thêm vào giỏ hàng thất bại" });
            
            return Ok(new { message = "Đã thêm vào giỏ hàng" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("gio-hang/cap-nhat/{itemId}")]
    public async Task<ActionResult> CapNhatGioHang(int itemId, [FromBody] CapNhatGioHangRequest request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var success = await _khachHangBusiness.CapNhatGioHang(maNguoiDung.Value, itemId, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy mục giỏ hàng" });
            
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("gio-hang/xoa/{itemId}")]
    public async Task<ActionResult> XoaKhoiGioHang(int itemId)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var success = await _khachHangBusiness.XoaKhoiGioHang(maNguoiDung.Value, itemId);
            if (!success)
                return NotFound(new { message = "Không tìm thấy mục giỏ hàng" });
            
            return Ok(new { message = "Đã xóa khỏi giỏ hàng" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("gio-hang/xoa-toan-bo")]
    public async Task<ActionResult> XoaToanBoGioHang()
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            await _khachHangBusiness.XoaToanBoGioHang(maNguoiDung.Value);
            return Ok(new { message = "Đã xoá toàn bộ giỏ hàng" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Đơn hàng
    [HttpPost("don-hang/tao")]
    public async Task<ActionResult> TaoDonHang([FromBody] TaoDonHangRequest request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var maDonHang = await _khachHangBusiness.TaoDonHang(maNguoiDung.Value, request);
            return Ok(new { message = "Đặt hàng thành công", maDonHang });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/cua-toi")]
    public async Task<ActionResult<List<DonHangResponse>>> GetDonHangCuaToi()
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            
            var result = await _khachHangBusiness.GetDonHangCuaToi(maNguoiDung.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/{id}")]
    public async Task<ActionResult<DonHangResponse>> GetDonHangById(int id)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var result = await _khachHangBusiness.GetDonHangById(maNguoiDung.Value, id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("don-hang/{id}/huy")]
    public async Task<ActionResult> HuyDonHang(int id, [FromBody] HuyDonHangRequest? request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var success = await _khachHangBusiness.HuyDonHang(maNguoiDung.Value, id, request?.LyDo);
            if (!success)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            
            return Ok(new { message = "Đã gửi yêu cầu hủy đơn hàng" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}
