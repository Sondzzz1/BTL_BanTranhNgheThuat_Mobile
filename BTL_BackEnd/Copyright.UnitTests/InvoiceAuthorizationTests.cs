using System.Security.Claims;
using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.Controllers;
using DoAn2_BackEnd.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Copyright.UnitTests;

public class InvoiceAuthorizationTests
{
    [Fact]
    public async Task AdminCanGetInvoiceByOrderWithoutCustomerClaim()
    {
        var business = new RecordingInvoiceBusiness();
        var controller = CreateController(business, new Claim(ClaimTypes.Role, "Admin"));

        var result = await controller.GetByDonHang(35);

        Assert.IsType<OkObjectResult>(result);
        Assert.True(business.GetByOrderArguments.HasValue);
        Assert.Equal((35, 0, true), business.GetByOrderArguments.Value);
    }

    [Fact]
    public async Task AdminCanDownloadPdfWithoutCustomerClaim()
    {
        var business = new RecordingInvoiceBusiness();
        var controller = CreateController(business, new Claim(ClaimTypes.Role, "Admin"));

        var result = await controller.DownloadPdf(7);

        var file = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", file.ContentType);
        Assert.True(business.DownloadPdfArguments.HasValue);
        Assert.Equal((7, 0, true), business.DownloadPdfArguments.Value);
    }

    [Fact]
    public async Task NonAdminWithoutCustomerClaimIsRejected()
    {
        var business = new RecordingInvoiceBusiness();
        var controller = CreateController(business, new Claim(ClaimTypes.Role, "HoaSi"));

        var result = await controller.GetByDonHang(35);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Null(business.GetByOrderArguments);
    }

    private static HoaDonBanController CreateController(IHoaDonBanBusiness business, params Claim[] claims)
    {
        var controller = new HoaDonBanController(business);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test", ClaimTypes.Name, ClaimTypes.Role))
            }
        };
        return controller;
    }

    private sealed class RecordingInvoiceBusiness : IHoaDonBanBusiness
    {
        public (int OrderId, int UserId, bool IsAdmin)? GetByOrderArguments { get; private set; }
        public (int InvoiceId, int UserId, bool IsAdmin)? DownloadPdfArguments { get; private set; }

        public Task<HoaDonBanResponse?> GetByMaDonHang(int maDonHang, int maNguoiDung, bool isAdmin)
        {
            GetByOrderArguments = (maDonHang, maNguoiDung, isAdmin);
            return Task.FromResult<HoaDonBanResponse?>(new HoaDonBanResponse { MaDonHang = maDonHang });
        }

        public Task<byte[]?> TaoPdf(int maHoaDon, int maNguoiDung, bool isAdmin)
        {
            DownloadPdfArguments = (maHoaDon, maNguoiDung, isAdmin);
            return Task.FromResult<byte[]?>([0x25, 0x50, 0x44, 0x46]);
        }

        public Task<HoaDonBanResponse?> GetByMaHoaDon(int maHoaDon, int maNguoiDung, bool isAdmin) =>
            throw new NotSupportedException();

        public Task<List<HoaDonBanSummaryResponse>> GetHoaDonCuaToi(int maNguoiDung) =>
            throw new NotSupportedException();

        public Task<HoaDonBanResponse> CreateInvoiceForOrder(int maDonHang, int maNguoiDung, bool isAdmin) =>
            throw new NotSupportedException();
    }
}
