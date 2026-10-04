using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/danh-gia")]
public class DanhGiaController : ControllerBase
{
    private readonly IDanhGiaBusiness _business;
    private readonly ReviewImageFileHelper _reviewImageFileHelper;

    public DanhGiaController(IDanhGiaBusiness business, ReviewImageFileHelper reviewImageFileHelper)
    {
        _business = business;
        _reviewImageFileHelper = reviewImageFileHelper;
    }

    [HttpGet("tac-pham/{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<DanhGiaResponse>>> GetByArtwork(int id) =>
        await Execute(() => _business.GetByArtwork(id));

    [HttpGet("tac-pham/{id:int}/tong-hop")]
    [AllowAnonymous]
    public async Task<ActionResult<TongHopDanhGiaResponse>> GetSummary(int id) =>
        await Execute(() => _business.GetSummary(id));

    [HttpGet("5-sao")]
    [AllowAnonymous]
    public async Task<ActionResult<List<DanhGiaResponse>>> GetFiveStars() =>
        Ok(await _business.GetFiveStars());

    [HttpGet("tac-pham/{id:int}/quyen-cua-toi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<QuyenDanhGiaResponse>> GetPermission(int id)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await Execute(() => _business.GetPermission(userId.Value, id));
    }

    [HttpPost]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<DanhGiaResponse>> Create([FromBody] TaoDanhGiaRequest request)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        try
        {
            var result = await _business.Create(userId.Value, request);
            return CreatedAtAction(nameof(GetByArtwork), new { id = result.MaTacPham }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (BusinessConflictException ex) { return Conflict(new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi tạo đánh giá" }); }
    }

    [HttpPost("co-anh")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "NguoiDung")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<DanhGiaResponse>> CreateWithImage(
        [FromForm] TaoDanhGiaForm request,
        CancellationToken cancellationToken)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });

        string? savedImageName = null;
        try
        {
            if (request.HinhAnhDanhGiaFile != null)
                savedImageName = await _reviewImageFileHelper.SaveAsync(request.HinhAnhDanhGiaFile, cancellationToken);

            var result = await _business.CreateWithImage(userId.Value, request, savedImageName);
            return CreatedAtAction(nameof(GetByArtwork), new { id = result.MaTacPham }, result);
        }
        catch (ArgumentException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return StatusCode(403, new { message = ex.Message }); }
        catch (BusinessConflictException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return Conflict(new { message = ex.Message }); }
        catch { _reviewImageFileHelper.DeleteIfExists(savedImageName); return StatusCode(500, new { message = "Lỗi server khi tạo đánh giá" }); }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<DanhGiaResponse>> Update(int id, [FromBody] CapNhatDanhGiaRequest request)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        try { return Ok(await _business.Update(userId.Value, id, request)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi cập nhật đánh giá" }); }
    }

    [HttpPut("{id:int}/co-anh")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "NguoiDung")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<DanhGiaResponse>> UpdateWithImage(
        int id,
        [FromForm] CapNhatDanhGiaForm request,
        CancellationToken cancellationToken)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });

        string? savedImageName = null;
        try
        {
            if (request.HinhAnhDanhGiaFile != null)
                savedImageName = await _reviewImageFileHelper.SaveAsync(request.HinhAnhDanhGiaFile, cancellationToken);

            var imageChanged = savedImageName != null || request.XoaHinhAnh;
            if (!imageChanged)
                return Ok(await _business.Update(userId.Value, id, request));

            var result = await _business.UpdateWithImage(userId.Value, id, request, savedImageName);
            try { _reviewImageFileHelper.DeleteIfExists(result.PreviousImageName); }
            catch { /* Keep an orphaned file rather than failing a committed review update. */ }
            return Ok(result.Review);
        }
        catch (ArgumentException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { _reviewImageFileHelper.DeleteIfExists(savedImageName); return StatusCode(403, new { message = ex.Message }); }
        catch { _reviewImageFileHelper.DeleteIfExists(savedImageName); return StatusCode(500, new { message = "Lỗi server khi cập nhật đánh giá" }); }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        try
        {
            var imageName = await _business.GetImageName(id);
            await _business.Delete(userId.Value, id);
            try { _reviewImageFileHelper.DeleteIfExists(imageName); }
            catch { /* The database delete is authoritative; a failed cleanup can be handled separately. */ }
            return Ok(new { message = "Đã xóa đánh giá" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi xóa đánh giá" }); }
    }

    [HttpGet("{id:int}/hinh-anh")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImage(int id)
    {
        try
        {
            var storedImageName = await _business.GetImageName(id);
            if (string.IsNullOrWhiteSpace(storedImageName))
                return NotFound(new { message = "Đánh giá chưa có ảnh" });
            var file = _reviewImageFileHelper.OpenRead(storedImageName);
            return File(file.Stream, file.ContentType, enableRangeProcessing: true);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Không tìm thấy ảnh đánh giá" });
        }
        catch (ArgumentException)
        {
            return NotFound(new { message = "Không tìm thấy ảnh đánh giá" });
        }
    }

    private async Task<ActionResult<T>> Execute<T>(Func<Task<T>> action)
    {
        try { return Ok(await action()); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi tải đánh giá" }); }
    }
}
