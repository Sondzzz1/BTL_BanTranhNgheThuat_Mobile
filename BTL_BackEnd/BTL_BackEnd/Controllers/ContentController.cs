using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

/// <summary>
/// Endpoint tương thích tạm thời cho module NoiDung cũ. Dữ liệu lịch sử được giữ
/// nguyên, nhưng HTTP API bị khóa để không lộ bản nháp/commission hoặc cho phép
/// ghi dữ liệu khi chưa kiểm tra ownership.
/// </summary>
[ApiController]
[Route("api/noi-dung")]
[AllowAnonymous]
public class ContentController : ControllerBase
{
    [AcceptVerbs("GET", "POST", "PUT", "DELETE", "PATCH")]
    [Route("")]
    [Route("{**legacyPath}")]
    public ActionResult LegacyEndpointDisabled(string? legacyPath = null) =>
        StatusCode(StatusCodes.Status410Gone, new
        {
            message = "API nội dung cũ đã ngừng hoạt động. Vui lòng dùng API ChiTietTacPham hoặc /api/bai-viet chính thức."
        });
}
