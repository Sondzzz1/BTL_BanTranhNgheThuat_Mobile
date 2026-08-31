using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Attributes;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/hoa-si")]
[Authorize(Roles = "Admin,HoaSi")]
public class HoaSiController : ControllerBase
{
    private readonly IHoaSiBusiness _hoaSiBusiness;

    public HoaSiController(IHoaSiBusiness hoaSiBusiness)
    {
        _hoaSiBusiness = hoaSiBusiness;
    }

    // Hồ sơ
    [HttpGet("ho-so")]
    public async Task<ActionResult<HoSoHoaSiResponse>> GetHoSo()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetHoSo(maHoaSi.Value);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("cap-nhat-ho-so")]
    public async Task<ActionResult> CapNhatHoSo([FromBody] CapNhatHoSoHoaSiRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var success = await _hoaSiBusiness.CapNhatHoSo(maHoaSi.Value, request);
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

    [HttpPost("upload-avatar")]
    public async Task<ActionResult> UploadAvatar([FromBody] UploadAvatarRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var success = await _hoaSiBusiness.UploadAvatar(maHoaSi.Value, request.AvatarUrl);
            if (!success)
                return BadRequest(new { message = "Upload thất bại" });
            
            return Ok(new { message = "Upload thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Tác phẩm
    [HttpGet("tac-pham/get-all")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> GetTacPhamCuaToi()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetTacPhamCuaToi(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tac-pham/{id}")]
    public async Task<ActionResult<TacPhamHoaSiResponse>> GetTacPhamById(int id)
    {
        try
        {
            var result = await _hoaSiBusiness.GetTacPhamById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("tac-pham/create")]
    public async Task<ActionResult> TaoTacPham([FromBody] TaoTacPhamRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var maTacPham = await _hoaSiBusiness.TaoTacPham(maHoaSi.Value, request);
            return Ok(new { message = "Tạo tác phẩm thành công", maTacPham });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham/{id}/update")]
    public async Task<ActionResult> CapNhatTacPham(int id, [FromBody] CapNhatTacPhamRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.CapNhatTacPham(maHoaSi.Value, id, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("tac-pham/{id}/delete")]
    public async Task<ActionResult> XoaTacPham(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.XoaTacPham(maHoaSi.Value, id);
            if (!success)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
        {
            return BadRequest(new { message = "Không thể xóa tác phẩm vì đang có dữ liệu liên quan (đơn hàng, giỏ hàng...)" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tac-pham-da-xoa")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> GetTacPhamDaXoa()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetTacPhamDaXoa(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham/{id}/khoi-phuc")]
    public async Task<ActionResult> KhoiPhucTacPham(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.KhoiPhucTacPham(maHoaSi.Value, id);
            if (!success)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
            return Ok(new { message = "Khôi phục thành công" });
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

    [HttpPut("tac-pham/{id}/update/trang-thai")]
    public async Task<ActionResult> CapNhatTrangThaiTacPham(int id, [FromBody] CapNhatTrangThaiTacPhamRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.CapNhatTrangThaiTacPham(maHoaSi.Value, id, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
            return Ok(new { message = "Cập nhật trạng thái thành công" });
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

    [HttpPut("tac-pham/{id}/gui-duyet-lai")]
    public async Task<ActionResult> GuiDuyetLaiTacPham(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.GuiDuyetLaiTacPham(maHoaSi.Value, id);
            if (!success)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
            return Ok(new { message = "Đã gửi duyệt lại tác phẩm thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
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

    // Bài viết
    [HttpGet("bai-viet/get-all")]
    public async Task<ActionResult<List<BaiVietResponse>>> GetBaiVietCuaToi()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetBaiVietCuaToi(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bai-viet/{id}")]
    public async Task<ActionResult<BaiVietResponse>> GetBaiVietById(int id)
    {
        try
        {
            var result = await _hoaSiBusiness.GetBaiVietById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy bài viết" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("bai-viet/create")]
    public async Task<ActionResult> TaoBaiViet([FromBody] TaoBaiVietRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var maBaiViet = await _hoaSiBusiness.TaoBaiViet(maHoaSi.Value, request);
            return Ok(new { message = "Tạo bài viết thành công", maBaiViet });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("bai-viet/{id}/update")]
    public async Task<ActionResult> CapNhatBaiViet(int id, [FromBody] CapNhatBaiVietRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.CapNhatBaiViet(maHoaSi.Value, id, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy bài viết" });
            
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("bai-viet/{id}/delete")]
    public async Task<ActionResult> XoaBaiViet(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.XoaBaiViet(maHoaSi.Value, id);
            if (!success)
                return NotFound(new { message = "Không tìm thấy bài viết" });
            
            return Ok(new { message = "Xóa thành công" });
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

    [HttpPut("bai-viet/{id}/gui-duyet")]
    public async Task<ActionResult> GuiDuyetBaiViet(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _hoaSiBusiness.GuiDuyetBaiViet(maHoaSi.Value, id);
            if (!success)
                return BadRequest(new { message = "Gửi duyệt thất bại" });

            return Ok(new { message = "Đã gửi duyệt bài viết" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Doanh thu
    [HttpGet("doanh-thu/tong-quan")]
    public async Task<ActionResult<DoanhThuTongQuanResponse>> GetDoanhThuTongQuan()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetDoanhThuTongQuan(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("doanh-thu/chi-tiet")]
    public async Task<ActionResult<List<DoanhThuChiTietResponse>>> GetDoanhThuChiTiet()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetDoanhThuChiTiet(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("doanh-thu/theo-thang")]
    public async Task<ActionResult<List<DoanhThuTheoThang>>> GetDoanhThuTheoThang([FromQuery] int nam = 2026)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetDoanhThuTheoThang(maHoaSi.Value, nam);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("doanh-thu/theo-tac-pham")]
    public async Task<ActionResult<List<DoanhThuTheoTacPhamResponse>>> GetDoanhThuTheoTacPham()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetDoanhThuTheoTacPham(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang")]
    public async Task<ActionResult<List<DonHangResponse>>> GetDonHangCuaToi()
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetDonHangCuaToi(maHoaSi.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Chi tiết tác phẩm - Thống kê
    [HttpGet("tac-pham/{id}/thong-ke")]
    public async Task<ActionResult<TacPhamThongKeResponse>> GetTacPhamThongKe(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetTacPhamThongKe(maHoaSi.Value, id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            
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

    // Chi tiết tác phẩm - Đơn hàng
    [HttpGet("tac-pham/{id}/don-hang")]
    public async Task<ActionResult<List<TacPhamDonHangResponse>>> GetTacPhamDonHang(int id)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetTacPhamDonHang(maHoaSi.Value, id);
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

    // Chi tiết tác phẩm - Doanh thu theo tháng
    [HttpGet("tac-pham/{id}/doanh-thu-theo-thang")]
    public async Task<ActionResult<List<TacPhamDoanhThuTheoThangResponse>>> GetTacPhamDoanhThuTheoThang(int id, [FromQuery] int nam = 2026)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });
            
            var result = await _hoaSiBusiness.GetTacPhamDoanhThuTheoThang(maHoaSi.Value, id, nam);
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
}

public class UploadAvatarRequest
{
    public string AvatarUrl { get; set; } = null!;
}
