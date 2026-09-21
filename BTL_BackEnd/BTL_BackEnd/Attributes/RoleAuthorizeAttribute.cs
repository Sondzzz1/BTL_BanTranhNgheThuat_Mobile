using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using DoAn2_BackEnd.Helpers;

namespace DoAn2_BackEnd.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RoleAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    private readonly byte[] _allowedRoles;

    public RoleAuthorizeAttribute(params byte[] allowedRoles)
    {
        _allowedRoles = allowedRoles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Chưa đăng nhập" });
            return;
        }

        var vaiTro = JwtHelper.GetVaiTro(user);
        if (vaiTro == null || !_allowedRoles.Contains(vaiTro.Value))
        {
            context.Result = new ForbidResult();
        }
    }
}

// Convenience attributes
public class AdminOnlyAttribute : RoleAuthorizeAttribute
{
    public AdminOnlyAttribute() : base(0) { }
}

public class NguoiDungOnlyAttribute : RoleAuthorizeAttribute
{
    public NguoiDungOnlyAttribute() : base(1) { }
}

public class HoaSiOnlyAttribute : RoleAuthorizeAttribute
{
    public HoaSiOnlyAttribute() : base(2) { }
}

public class NguoiDungOrHoaSiAttribute : RoleAuthorizeAttribute
{
    public NguoiDungOrHoaSiAttribute() : base(1, 2) { }
}
