using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api")]
public class ChiTietTacPhamController : ControllerBase
{
    private readonly IChiTietTacPhamBusiness _chiTietBusiness;

    public ChiTietTacPhamController(IChiTietTacPhamBusiness chiTietBusiness)
    {
        _chiTietBusiness = chiTietBusiness;
    }

    // ================================================================
    // HỌA SĨ - QUẢN LÝ CHI TIẾT TÁC PHẨM
    // ================================================================

    /// <summary>
    /// Họa sĩ tạo chi tiết tác phẩm
    /// </summary>
    [HttpPost("hoa-si/tac-pham/{maTacPham}/chi-tiet")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> TaoChiTiet(int maTacPham, [FromBody] TaoChiTietTacPhamRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var maChiTiet = await _chiTietBusiness.TaoChiTiet(maHoaSi.Value, maTacPham, request);
            return Ok(new { message = "Tạo chi tiết thành công. Đang chờ admin duyệt", maChiTiet });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    /// <summary>
    /// Họa sĩ cập nhật chi tiết tác phẩm
    /// </summary>
    [HttpPut("hoa-si/tac-pham/{maTacPham}/chi-tiet")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> CapNhatChiTiet(int maTacPham, [FromBody] TaoChiTietTacPhamRequest request)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _chiTietBusiness.CapNhatChiTiet(maHoaSi.Value, maTacPham, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy chi tiết tác phẩm" });

            return Ok(new { message = "Cập nhật thành công. Nội dung sẽ được admin duyệt lại" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    /// <summary>
    /// Họa sĩ xóa chi tiết tác phẩm
    /// </summary>
    [HttpDelete("hoa-si/tac-pham/{maTacPham}/chi-tiet")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> XoaChiTiet(int maTacPham)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var success = await _chiTietBusiness.XoaChiTiet(maHoaSi.Value, maTacPham);
            if (!success)
                return NotFound(new { message = "Không tìm thấy chi tiết tác phẩm" });

            return Ok(new { message = "Xóa chi tiết thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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

    /// <summary>
    /// Họa sĩ xem chi tiết tác phẩm của mình
    /// </summary>
    [HttpGet("hoa-si/tac-pham/{maTacPham}/chi-tiet")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult<ChiTietTacPhamResponse>> GetChiTiet(int maTacPham)
    {
        try
        {
            var maHoaSi = JwtHelper.GetMaHoaSi(User);
            if (maHoaSi == null)
                return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

            var result = await _chiTietBusiness.GetChiTiet(maTacPham);
            if (result == null)
                return NotFound(new { message = "Chưa có chi tiết cho tác phẩm này" });

            // Kiểm tra quyền xem
            if (result.MaHoaSi != maHoaSi.Value)
                return StatusCode(403, new { message = "Không có quyền xem chi tiết tác phẩm này" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // ADMIN - DUYỆT CHI TIẾT TÁC PHẨM
    // ================================================================

    /// <summary>
    /// Admin lấy danh sách chi tiết chờ duyệt
    /// </summary>
    [HttpGet("admin/chi-tiet-tac-pham/cho-duyet")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ChiTietChoDuyetResponse>>> GetDanhSachChoDuyet()
    {
        try
        {
            var result = await _chiTietBusiness.GetDanhSachChoDuyet();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Admin lấy tất cả chi tiết tác phẩm (có filter)
    /// </summary>
    [HttpGet("admin/chi-tiet-tac-pham")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ChiTietTacPhamResponse>>> GetTatCaChiTiet([FromQuery] int trangThai = -1)
    {
        try
        {
            var result = await _chiTietBusiness.GetTatCaChiTiet(trangThai);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Admin xem chi tiết đầy đủ
    /// </summary>
    [HttpGet("admin/chi-tiet-tac-pham/{maTacPham}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ChiTietTacPhamResponse>> AdminGetChiTiet(int maTacPham)
    {
        try
        {
            var result = await _chiTietBusiness.GetChiTiet(maTacPham);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy chi tiết tác phẩm" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Admin duyệt hoặc từ chối chi tiết tác phẩm
    /// </summary>
    [HttpPut("admin/chi-tiet-tac-pham/{maTacPham}/duyet")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DuyetChiTiet(int maTacPham, [FromBody] DuyetChiTietTacPhamRequest request)
    {
        try
        {
            // Admin không có MaNguoiDung trong JWT (Admin không thuộc bảng NguoiDung)
            // Dùng MaTaiKhoan làm ID người duyệt thay thế
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);

            // Ưu tiên MaNguoiDung nếu có, nếu không dùng MaTaiKhoan
            var maNguoiDuyet = maNguoiDung ?? maTaiKhoan;

            if (maNguoiDuyet == null)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var success = await _chiTietBusiness.DuyetChiTiet(maTacPham, maNguoiDuyet.Value, request);
            if (!success)
                return NotFound(new { message = "Không tìm thấy chi tiết tác phẩm" });

            var message = request.PheDuyet 
                ? "Đã phê duyệt chi tiết tác phẩm" 
                : "Đã từ chối chi tiết tác phẩm";

            return Ok(new { message });
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


    // ================================================================
    // PUBLIC - XEM CHI TIẾT CÔNG KHAI
    // ================================================================

    /// <summary>
    /// Lấy chi tiết tác phẩm công khai (chỉ hiển thị nếu đã duyệt)
    /// </summary>
    [HttpGet("public/tac-pham/{maTacPham}/chi-tiet")]
    [AllowAnonymous]
    public async Task<ActionResult<ChiTietTacPhamCongKhaiResponse>> GetChiTietCongKhai(int maTacPham)
    {
        try
        {
            var result = await _chiTietBusiness.GetChiTietCongKhai(maTacPham);
            if (result == null)
                return NotFound(new { message = "Tác phẩm chưa có chi tiết hoặc chưa được duyệt" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}
