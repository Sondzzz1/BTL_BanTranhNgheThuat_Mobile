using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthBusiness _authBusiness;

    public AuthController(IAuthBusiness authBusiness)
    {
        _authBusiness = authBusiness;
    }

    [HttpPost("dang-nhap")]
    public async Task<ActionResult<DangNhapResponse>> DangNhap([FromBody] DangNhapRequest request)
    {
        try
        {
            var response = await _authBusiness.DangNhap(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("dang-ky")]
    public async Task<ActionResult<DangNhapResponse>> DangKy([FromBody] DangKyRequest request)
    {
        try
        {
            var response = await _authBusiness.DangKy(request);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("dang-xuat")]
    [Authorize]
    public async Task<ActionResult> DangXuat()
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            if (maTaiKhoan.HasValue)
            {
                await _authBusiness.DangXuat(maTaiKhoan.Value);
            }
            return Ok(new { message = "Đăng xuất thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("lam-moi-token")]
    public async Task<ActionResult<DangNhapResponse>> LamMoiToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authBusiness.LamMoiToken(request.RefreshToken);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult GetCurrentUser()
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            var tenDangNhap = JwtHelper.GetTenDangNhap(User);
            var vaiTro = JwtHelper.GetVaiTro(User);
            var maNguoiDung = JwtHelper.GetMaNguoiDung(User);
            var maHoaSi = JwtHelper.GetMaHoaSi(User);

            return Ok(new
            {
                maTaiKhoan,
                tenDangNhap,
                vaiTro,
                maNguoiDung,
                maHoaSi
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("doi-mat-khau")]
    [Authorize]
    public async Task<ActionResult> DoiMatKhau([FromBody] DoiMatKhauRequest request)
    {
        try
        {
            var maTaiKhoan = JwtHelper.GetMaTaiKhoan(User);
            if (!maTaiKhoan.HasValue)
            {
                return Unauthorized(new { success = false, message = "Token không hợp lệ" });
            }

            var (success, message) = await _authBusiness.DoiMatKhau(
                maTaiKhoan.Value, request.MatKhauCu, request.MatKhauMoi);

            if (!success)
            {
                return BadRequest(new { success, message });
            }
            return Ok(new { success, message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}
