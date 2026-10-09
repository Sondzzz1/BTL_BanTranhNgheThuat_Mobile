using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Attributes;
using DoAn2_BackEnd.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;
using Xunit;

namespace Copyright.UnitTests;

public class AdminReportTests
{
    private static readonly DateTime Day = new(2026, 10, 9);
    private static AdminReportSource Sale(int order = 1, int artwork = 1, int quantity = 5, int returned = 2) => new()
    {
        OrderId = order, ArtworkId = artwork, ArtworkName = $"Tranh {artwork}", ArtistId = artwork,
        ArtistName = $"Họa sĩ {artwork}", CustomerId = order, CustomerName = $"Khách {order}",
        Date = Day.AddHours(23).AddMinutes(59), Status = DonHangStatus.DaGiao,
        Quantity = quantity, Returned = returned, UnitPrice = 100, PaymentCount = 1, PaymentStatus = "DaThanhToan"
    };

    [Theory]
    [InlineData("doanh-thu")]
    [InlineData("tac-pham")]
    [InlineData("hoa-si")]
    [InlineData("khach-hang")]
    public void AggregatesEverySalesReportWithPartialFullAndInvalidRefunds(string type)
    {
        var partial = Sale(); // 500 gross, 200 refunded, 3 units
        var exclusive = Sale(1, 2, 1, 0); // same order, different artwork/artist
        var full = Sale(2, 1, 2, 2); full.PaymentStatus = "HoanTien";
        var invalid = Sale(3); invalid.PaymentStatus = "HoanTien";
        var unpaid = Sale(4); unpaid.PaymentStatus = "ChoThanhToan";
        var duplicate = Sale(5); duplicate.PaymentCount = 2;
        var cancelled = Sale(6); cancelled.Status = DonHangStatus.DaHuy;
        var commission = Sale(7); commission.IsCommission = true;
        var result = AdminReportBuilder.Build(type, Day, Day, new[] { partial, exclusive, full, invalid, unpaid, duplicate, cancelled, commission });
        Assert.True(result.HasData);
        Assert.Equal(800, result.Rows.Sum(r => r.Gross));
        Assert.Equal(400, result.Rows.Sum(r => r.Refund));
        Assert.Equal(400, result.Rows.Sum(r => r.Net));
        Assert.Equal(4, result.Rows.Sum(r => r.Quantity));
        if (type == "doanh-thu") Assert.Equal(2, Assert.Single(result.Rows).Orders);
        if (type == "tac-pham") Assert.Equal("1", result.Rows[0].Key);
    }

    [Fact]
    public void InclusiveEndDayAndExclusiveNextMidnight()
    {
        var previous = Sale(2); previous.Date = Day.AddTicks(-1);
        var next = Sale(3); next.Date = Day.AddDays(1);
        var result = AdminReportBuilder.Build("doanh-thu", Day, Day, new[] { previous, Sale(), next });
        Assert.Equal(300, Assert.Single(result.Rows).Net);
    }

    [Theory]
    [InlineData("doanh-thu")][InlineData("tac-pham")][InlineData("hoa-si")][InlineData("khach-hang")][InlineData("don-hang")]
    public void EmptyRangeAndInvalidDates(string type)
    {
        Assert.False(AdminReportBuilder.Build(type, Day.AddDays(1), Day.AddDays(2), new[] { Sale() }).HasData);
        Assert.Throws<ArgumentException>(() => AdminReportBuilder.Validate(type, Day, Day.AddDays(-1)));
    }

    [Fact]
    public void RejectsUnknownTypeAndUnrepresentableEnd()
    {
        Assert.Throws<ArgumentException>(() => AdminReportBuilder.Validate("invented", Day, Day));
        Assert.Throws<ArgumentException>(() => AdminReportBuilder.Validate("don-hang", Day, DateTime.MaxValue));
    }

    [Fact]
    public void OrderReportUsesAllSixExistingStatusesWithoutRevenue()
    {
        var rows = Enumerable.Range(0, 6).Select(status => { var row = Sale(status); row.Status = (byte)status; return row; }).ToArray();
        var result = AdminReportBuilder.Build("don-hang", Day, Day, rows);
        Assert.Equal(6, result.Rows.Sum(r => r.Orders));
        Assert.Equal(6, result.Rows.Count);
        Assert.Contains(result.Rows, r => r.Label == "Yêu cầu hủy");
        Assert.Equal(100m / 6, result.Summary.Single(m => m.Format == "percent").Value);
    }

    [Theory]
    [InlineData(null, 401)]
    [InlineData("NguoiDung", 403)]
    [InlineData("HoaSi", 403)]
    [InlineData("Admin", 200)]
    public void ActualAdminFilterRejectsNonAdmins(string? role, int expected)
    {
        var controller = typeof(AdminController);
        Assert.Equal("Admin", controller.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().Single().Roles);
        var filter = controller.GetCustomAttributes(typeof(AdminOnlyAttribute), true).Cast<AdminOnlyAttribute>().Single();
        var context = new DefaultHttpContext();
        if (role != null) context.User = new ClaimsPrincipal(new ClaimsIdentity(new[] {
            new Claim(ClaimTypes.Role, role), new Claim("VaiTro", role == "Admin" ? "0" : role == "HoaSi" ? "2" : "1") }, "test"));
        var authorization = new AuthorizationFilterContext(new ActionContext(context, new RouteData(), new ActionDescriptor()), new List<IFilterMetadata>());
        filter.OnAuthorization(authorization);
        Assert.Equal(expected, authorization.Result is UnauthorizedObjectResult ? 401 : authorization.Result is ForbidResult ? 403 : 200);
    }
}
