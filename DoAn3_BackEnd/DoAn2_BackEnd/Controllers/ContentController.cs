using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/noi-dung")]
[Authorize]
public class ContentController : ControllerBase
{
    private readonly IContentBusiness _contentBusiness;

    public ContentController(IContentBusiness contentBusiness)
    {
        _contentBusiness = contentBusiness;
    }

    // ==========================================
    // BÀI VIẾT
    // ==========================================

    [HttpGet("bai-viet")]
    [AllowAnonymous]
    public async Task<ActionResult<List<BaiVietResponse>>> LayTatCaBaiViet()
    {
        var result = await _contentBusiness.LayTatCaBaiViet();
        return Ok(result);
    }

    // Admin - lấy tất cả bài viết (hỗ trợ filter trangThai)
    [HttpGet("bai-viet/get-all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<BaiVietResponse>>> LayTatCaBaiVietAdmin([FromQuery] byte? trangThai)
    {
        var result = await _contentBusiness.LayTatCaBaiVietAdmin();
        if (trangThai.HasValue)
        {
            result = result.Where(x => x.TrangThai == trangThai.Value).ToList();
        }
        return Ok(result);
    }

    [HttpGet("bai-viet/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<BaiVietResponse>> LayBaiVietTheoId(int id)
    {
        var result = await _contentBusiness.LayBaiVietTheoId(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("bai-viet")]
    [Authorize(Roles = "HoaSi,Admin")]
    public async Task<ActionResult> TaoBaiViet([FromBody] TaoBaiVietRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null || maHoaSi.Value <= 0)
                return BadRequest(new { message = "Chỉ Họa sĩ mới có thể tạo bài viết. Admin vui lòng tạo tài khoản họa sĩ trước." });

            var id = await _contentBusiness.TaoBaiViet(maHoaSi.Value, request);
            return Ok(new { message = "Đã tạo bài viết", id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("bai-viet/{id}")]
    [Authorize(Roles = "HoaSi,Admin")]
    public async Task<ActionResult> CapNhatBaiViet(int id, [FromBody] CapNhatBaiVietRequest request)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin");
            var maHoaSi = JwtHelper.GetMaHoaSi(User);

            var success = await _contentBusiness.CapNhatBaiViet(id, maHoaSi, isAdmin, request);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết" });
            return Ok(new { message = "Đã cập nhật bài viết" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("bai-viet/{id}/delete")]
    [Authorize(Roles = "HoaSi,Admin")]
    public async Task<ActionResult> XoaBaiViet(int id)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin");
            var maHoaSi = JwtHelper.GetMaHoaSi(User);

            var success = await _contentBusiness.XoaBaiViet(id, maHoaSi, isAdmin);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết" });
            return Ok(new { message = "Đã xóa bài viết" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPut("bai-viet/{id}/update/duyet")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> PheDuyetBaiViet(int id, [FromBody] DuyetBaiVietRequest request)
    {
        try
        {
            var success = await _contentBusiness.PheDuyetBaiViet(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết" });
            return Ok(new { message = request.PheDuyet ? "Đã duyệt bài viết" : "Đã từ chối bài viết" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ==========================================
    // CHI TIẾT TÁC PHẨM
    // ==========================================

    [HttpGet("chi-tiet-tac-pham")]
    [AllowAnonymous]
    public async Task<ActionResult<List<NoiDungResponse>>> LayTatCaChiTietTacPham([FromQuery] string? loai)
    {
        var result = await _contentBusiness.LayTatCaChiTietTacPham(loai);
        return Ok(result);
    }

    [HttpGet("chi-tiet-tac-pham/theo-tac-pham/{maTacPham}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<NoiDungResponse>>> LayChiTietTheoTacPham(int maTacPham)
    {
        var result = await _contentBusiness.LayChiTietTheoTacPham(maTacPham);
        return Ok(result);
    }

    [HttpPost("chi-tiet-tac-pham")]
    public async Task<ActionResult> TaoChiTietTacPham([FromBody] TaoNoiDungRequest request)
    {
        var id = await _contentBusiness.TaoChiTietTacPham(request);
        return Ok(new { message = "Đã tạo chi tiết tác phẩm", id });
    }

    [HttpPut("chi-tiet-tac-pham/{id}")]
    public async Task<ActionResult> CapNhatChiTietTacPham(int id, [FromBody] CapNhatNoiDungRequest request)
    {
        var success = await _contentBusiness.CapNhatChiTietTacPham(id, request);
        if (!success) return NotFound();
        return Ok(new { message = "Đã cập nhật chi tiết tác phẩm" });
    }

    [HttpDelete("chi-tiet-tac-pham/{id}")]
    public async Task<ActionResult> XoaChiTietTacPham(int id)
    {
        var success = await _contentBusiness.XoaChiTietTacPham(id);
        if (!success) return NotFound();
        return Ok(new { message = "Đã xóa chi tiết tác phẩm" });
    }
}
