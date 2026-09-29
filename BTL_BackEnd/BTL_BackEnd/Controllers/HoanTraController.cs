using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

/// <summary>
/// Controller xử lý yêu cầu hoàn trả sản phẩm.
/// - Customer: POST /api/hoan-tra, GET /api/hoan-tra/cua-toi, v.v.
/// - Admin: GET /api/admin/hoan-tra/get-all, v.v.
/// </summary>
[ApiController]
[Authorize]
public class HoanTraController : ControllerBase
{
    private readonly IHoanTraBusiness _hoanTraBusiness;
    private readonly ReturnFileHelper _returnFileHelper;

    public HoanTraController(IHoanTraBusiness hoanTraBusiness, ReturnFileHelper returnFileHelper)
    {
        _hoanTraBusiness = hoanTraBusiness;
        _returnFileHelper = returnFileHelper;
    }

    // ================================================================
    // CUSTOMER ENDPOINTS
    // ================================================================

    /// <summary>Tạo yêu cầu hoàn trả sản phẩm</summary>
    [HttpPost("api/hoan-tra")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<TaoHoanTraResponse>> TaoHoanTra([FromBody] TaoHoanTraRequest request)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });
            if (request.HinhAnh is { Count: > 0 })
                return BadRequest(new { message = "Ảnh bằng chứng phải được tải lên qua endpoint multipart /api/hoan-tra/co-tep" });

            var result = await _hoanTraBusiness.TaoYeuCauHoanTra(maNguoiDung.Value, request);
            return Ok(result);
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

    /// <summary>Tạo yêu cầu hoàn trả và tải ảnh bằng chứng thật lên server.</summary>
    [HttpPost("api/hoan-tra/co-tep")]
    [Authorize(Roles = "NguoiDung")]
    [RequestSizeLimit(26 * 1024 * 1024)]
    public async Task<ActionResult<TaoHoanTraResponse>> TaoHoanTraCoTep(
        [FromForm] TaoHoanTraForm request,
        CancellationToken cancellationToken)
    {
        var savedFiles = new List<string>();
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return Unauthorized(new { message = "Token không có MaNguoiDung" });

            if (request.HinhAnhFiles?.Count > 5)
                return BadRequest(new { message = "Mỗi yêu cầu chỉ được tải lên tối đa 5 ảnh bằng chứng" });

            foreach (var file in request.HinhAnhFiles ?? Enumerable.Empty<IFormFile>())
                savedFiles.Add(await _returnFileHelper.SaveAsync(file, cancellationToken));

            // Không nhận URI/base64 do client gửi. Chỉ lưu tên tệp do server vừa tạo.
            request.HinhAnh = savedFiles;
            var result = await _hoanTraBusiness.TaoYeuCauHoanTra(maNguoiDung.Value, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            foreach (var file in savedFiles) _returnFileHelper.DeleteIfExists(file);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            foreach (var file in savedFiles) _returnFileHelper.DeleteIfExists(file);
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            foreach (var file in savedFiles) _returnFileHelper.DeleteIfExists(file);
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>Đọc ảnh bằng chứng sau khi kiểm tra quyền sở hữu yêu cầu.</summary>
    [HttpGet("api/hoan-tra/{id}/tep/{fileName}")]
    [Authorize(Roles = "NguoiDung,Admin")]
    public async Task<IActionResult> GetTepBangChung(int id, string fileName)
    {
        try
        {
            HoanTraDetailResponse detail;
            if (User.IsInRole("Admin"))
            {
                detail = await _hoanTraBusiness.GetChiTietAdmin(id);
            }
            else
            {
                var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
                if (!maNguoiDung.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
                detail = await _hoanTraBusiness.GetChiTiet(id, maNguoiDung.Value);
            }

            var safeName = Path.GetFileName(fileName);
            var belongsToRequest = detail.HinhAnh.Any(path =>
                Uri.UnescapeDataString(path.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? string.Empty)
                    .Equals(safeName, StringComparison.OrdinalIgnoreCase));
            if (!belongsToRequest) return NotFound(new { message = "Không tìm thấy ảnh bằng chứng" });

            var opened = _returnFileHelper.OpenRead(safeName);
            return File(opened.Stream, opened.ContentType);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Không tìm thấy yêu cầu hoàn trả" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Không tìm thấy ảnh bằng chứng" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Lấy danh sách yêu cầu hoàn trả của khách hàng hiện tại</summary>
    [HttpGet("api/hoan-tra/cua-toi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<List<HoanTraSummaryResponse>>> GetHoanTraCuaToi()
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var result = await _hoanTraBusiness.GetHoanTraCuaToi(maNguoiDung.Value);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>Lấy chi tiết yêu cầu hoàn trả (Customer chỉ xem được của mình)</summary>
    [HttpGet("api/hoan-tra/{id}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<HoanTraDetailResponse>> GetChiTiet(int id)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            var result = await _hoanTraBusiness.GetChiTiet(id, maNguoiDung.Value);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Không tìm thấy yêu cầu hoàn trả" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>Khách hàng xác nhận đã gửi hàng về cửa hàng</summary>
    [HttpPut("api/hoan-tra/{id}/xac-nhan-da-gui")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> XacNhanDaGuiHang(int id)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue)
                return BadRequest(new { message = "Không tìm thấy thông tin người dùng" });

            await _hoanTraBusiness.XacNhanDaGuiHang(id, maNguoiDung.Value);
            return Ok(new { message = "Đã xác nhận gửi hàng. Chúng tôi sẽ kiểm tra và hoàn tiền cho bạn." });
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

    [HttpPost("api/hoan-tra/{id}/huy")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> HuyYeuCau(int id)
    {
        try
        {
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            if (!maNguoiDung.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
            await _hoanTraBusiness.HuyYeuCau(id, maNguoiDung.Value);
            return Ok(new { message = "Đã hủy yêu cầu hoàn trả" });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // ================================================================
    // ADMIN ENDPOINTS
    // ================================================================

    /// <summary>Admin lấy tất cả yêu cầu hoàn trả, hỗ trợ lọc</summary>
    [HttpGet("api/admin/hoan-tra/get-all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<HoanTraSummaryResponse>>> GetAllHoanTra(
        [FromQuery] string? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] string? keyword = null)
    {
        try
        {
            var result = await _hoanTraBusiness.GetAllHoanTra(trangThai, tuNgay, denNgay, keyword);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>Admin xem chi tiết yêu cầu hoàn trả</summary>
    [HttpGet("api/admin/hoan-tra/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HoanTraDetailResponse>> GetChiTietAdmin(int id)
    {
        try
        {
            var result = await _hoanTraBusiness.GetChiTietAdmin(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Không tìm thấy yêu cầu hoàn trả" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>Admin duyệt hoặc từ chối yêu cầu hoàn trả</summary>
    [HttpPut("api/admin/hoan-tra/{id}/duyet")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DuyetHoanTra(int id, [FromBody] DuyetHoanTraRequest request)
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            if (!maTaiKhoan.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
            await _hoanTraBusiness.DuyetYeuCau(id, maTaiKhoan.Value, request);
            var message = request.ChapNhan
                ? "Đã chấp nhận yêu cầu hoàn trả"
                : "Đã từ chối yêu cầu hoàn trả";
            return Ok(new { message });
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

    [HttpPut("api/admin/hoan-tra/{id}/xac-nhan-da-nhan")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> XacNhanDaNhan(int id, [FromBody] XacNhanNhanHangHoanTraRequest request)
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            if (!maTaiKhoan.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
            await _hoanTraBusiness.XacNhanNhanHang(id, maTaiKhoan.Value, request);
            return Ok(new { message = "Đã xác nhận nhận lại tác phẩm" });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("api/admin/hoan-tra/{id}/xac-nhan-hoan-tien")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> XacNhanHoanTien(int id, [FromBody] XacNhanHoanTienRequest request)
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            if (!maTaiKhoan.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
            await _hoanTraBusiness.XacNhanHoanTien(id, maTaiKhoan.Value, request);
            return Ok(new { message = "Đã ghi nhận hoàn tiền" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Admin cập nhật trạng thái hoàn trả theo quy trình</summary>
    [HttpPut("api/admin/hoan-tra/{id}/cap-nhat-trang-thai")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CapNhatTrangThai(int id, [FromBody] CapNhatTrangThaiHoanTraRequest request)
    {
        try
        {
            await _hoanTraBusiness.CapNhatTrangThai(id, request);
            return Ok(new { message = "Cập nhật trạng thái thành công" });
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

    /// <summary>Admin hoàn tất toàn bộ quy trình hoàn trả</summary>
    [HttpPut("api/admin/hoan-tra/{id}/hoan-tat")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> HoanTat(int id)
    {
        try
        {
            await _hoanTraBusiness.HoanTat(id);
            return Ok(new { message = "Đã hoàn tất quy trình hoàn trả" });
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
