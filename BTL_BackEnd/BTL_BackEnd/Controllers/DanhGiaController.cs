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

    public DanhGiaController(IDanhGiaBusiness business)
    {
        _business = business;
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

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> Delete(int id)
    {
        var userId = JwtHelper.GetMaNguoiDung(User);
        if (!userId.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        try
        {
            await _business.Delete(userId.Value, id);
            return Ok(new { message = "Đã xóa đánh giá" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi xóa đánh giá" }); }
    }

    private async Task<ActionResult<T>> Execute<T>(Func<Task<T>> action)
    {
        try { return Ok(await action()); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch { return StatusCode(500, new { message = "Lỗi server khi tải đánh giá" }); }
    }
}
