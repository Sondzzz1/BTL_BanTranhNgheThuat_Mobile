using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/thong-bao")]
[Authorize]
public class ThongBaoController : ControllerBase
{
    private readonly IThongBaoBusiness _thongBaoBusiness;

    public ThongBaoController(IThongBaoBusiness thongBaoBusiness) => _thongBaoBusiness = thongBaoBusiness;

    [HttpGet]
    [HttpGet("cua-toi")]
    public async Task<ActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        return Ok(await _thongBaoBusiness.GetForAccount(accountId.Value, page, pageSize));
    }

    [HttpGet("chua-doc/dem")]
    public async Task<ActionResult> CountUnread()
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        return Ok(new { soLuong = await _thongBaoBusiness.CountUnread(accountId.Value) });
    }

    [HttpPut("{id:long}/da-doc")]
    public async Task<ActionResult> MarkAsRead(long id)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _thongBaoBusiness.MarkAsRead(id, accountId.Value);
        return Ok(new { message = "Đã đánh dấu đã đọc" });
    }

    [HttpPut("da-doc-tat-ca")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        var updated = await _thongBaoBusiness.MarkAllAsRead(accountId.Value);
        return Ok(new { message = "Đã đánh dấu tất cả là đã đọc", soLuong = updated });
    }
}
