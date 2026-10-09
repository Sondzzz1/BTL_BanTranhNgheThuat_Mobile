using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.Controllers;
using DoAn2_BackEnd.DTO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Copyright.UnitTests;

public class AdminReportHttpTests
{
    [Fact]
    public async Task ReportRouteEnforcesJwtRolesAndValidatesDatesOverHttp()
    {
        // Actual MVC controller + JWT middleware; only the data boundary is replaced.
        var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(32));
        var builder = WebApplication.CreateBuilder();
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Services.AddControllers().AddApplicationPart(typeof(AdminController).Assembly);
        builder.Services.AddSingleton(DispatchProxy.Create<IAdminBusiness, ReportBusinessProxy>());
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true, IssuerSigningKey = key, ValidateIssuer = true,
                ValidIssuer = "report-test", ValidateAudience = true, ValidAudience = "report-test", ValidateLifetime = true
            });
        builder.Services.AddAuthorization();
        await using var app = builder.Build();
        app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
        await app.StartAsync();
        try
        {
            using var client = new HttpClient { BaseAddress = new Uri(app.Urls.Single()) };
            const string route = "/api/admin/bao-cao/doanh-thu?fromDate=2026-10-09&toDate=2026-10-09";
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(route)).StatusCode);
            foreach (var (role, code) in new[] { ("NguoiDung", "1"), ("HoaSi", "2"), ("Admin", "0") })
            {
                var token = new JwtSecurityToken("report-test", "report-test", new[] { new Claim(ClaimTypes.Role, role), new Claim("VaiTro", code) },
                    expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
                Assert.Equal(role == "Admin" ? HttpStatusCode.OK : HttpStatusCode.Forbidden, (await client.GetAsync(route)).StatusCode);
            }
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/admin/bao-cao/don-hang?fromDate=2026-10-10&toDate=2026-10-09")).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/admin/bao-cao/don-hang")).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/admin/bao-cao/don-hang?fromDate=wrong&toDate=2026-10-09")).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/admin/bao-cao/unknown?fromDate=2026-10-09&toDate=2026-10-09")).StatusCode);
        }
        finally { await app.StopAsync(); }
    }

    public class ReportBusinessProxy : DispatchProxy
    {
        protected override object? Invoke(MethodInfo? method, object?[]? args)
        {
            if (method?.Name != "GetReport") throw new NotSupportedException();
            try { return Task.FromResult(AdminReportBuilder.Build((string)args![0]!, (DateTime)args[1]!, (DateTime)args[2]!, Array.Empty<AdminReportSource>())); }
            catch (Exception ex) { return Task.FromException<AdminReportResponse>(ex); }
        }
    }
}
