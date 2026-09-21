using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace DoAn2_BackEnd.Helpers;

public static class JwtHelper
{
    public static int? GetMaTaiKhoan(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier);
        if (claim != null && int.TryParse(claim.Value, out int maTaiKhoan))
        {
            return maTaiKhoan;
        }
        return null;
    }

    public static int? GetMaNguoiDung(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("MaNguoiDung");
        if (claim != null && int.TryParse(claim.Value, out int maNguoiDung))
        {
            return maNguoiDung;
        }
        return null;
    }

    public static int? GetMaHoaSi(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("MaHoaSi");
        if (claim != null && int.TryParse(claim.Value, out int maHoaSi))
        {
            return maHoaSi;
        }
        return null;
    }

    public static byte? GetVaiTro(ClaimsPrincipal user)
    {
        var claim = user.FindFirst("VaiTro");
        if (claim != null && byte.TryParse(claim.Value, out byte vaiTro))
        {
            return vaiTro;
        }
        return null;
    }

    public static string? GetTenDangNhap(ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Name)?.Value;
    }

    public static bool IsAdmin(ClaimsPrincipal user)
    {
        return GetVaiTro(user) == 0;
    }

    public static bool IsNguoiDung(ClaimsPrincipal user)
    {
        return GetVaiTro(user) == 1;
    }

    public static bool IsHoaSi(ClaimsPrincipal user)
    {
        return GetVaiTro(user) == 2;
    }
}
