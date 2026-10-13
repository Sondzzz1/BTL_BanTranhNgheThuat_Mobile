using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Xunit;

namespace Copyright.UnitTests;

public class ArtworkSalePolicyTests
{
    [Theory]
    [InlineData(1, null, false, 3, "RIGHTS_NOT_DECLARED")]
    [InlineData(1, 0, false, 3, "RIGHTS_PENDING")]
    [InlineData(1, 1, false, 3, "RIGHTS_NEED_INFO")]
    [InlineData(1, 3, false, 3, "RIGHTS_REJECTED")]
    [InlineData(1, 6, true, 3, "RIGHTS_REVOKED")]
    [InlineData(1, 4, false, 3, "RIGHTS_NOT_VERIFIED")]
    [InlineData(1, 5, false, 3, "RIGHTS_NOT_VERIFIED")]
    [InlineData(1, 2, false, 3, "AVAILABLE")]
    [InlineData(1, 2, true, 3, "BLOCKED_FROM_SALE")]
    [InlineData(1, 2, false, 0, "OUT_OF_STOCK")]
    [InlineData(3, 2, false, 3, "ARTWORK_NOT_APPROVED")]
    [InlineData(2, 2, false, 3, "ARTWORK_NOT_APPROVED")]
    [InlineData(0, 2, false, 3, "ARTWORK_NOT_APPROVED")]
    public void RightsAndPublicationAreIndependent(int publication, int? rights, bool blocked, int stock, string reason)
    {
        var result = ArtworkSalePolicy.Evaluate((byte)publication, rights.HasValue ? (byte)rights.Value : null,
            1, true, blocked, stock, false, false, 20, 100000);
        Assert.Equal(reason, result.SaleReason);
        Assert.Equal(reason == "AVAILABLE", result.CanSell);
    }

    [Fact]
    public void VerifiedIsNotEnoughWithoutACompleteLawfulDeclaration()
    {
        Assert.False(ArtworkSalePolicy.Evaluate(1, 2, null, false, false, 1, false, false, 20, 100).CanSell);
        Assert.False(ArtworkSalePolicy.Evaluate(1, 2, 5, true, false, 1, false, false, 20, 100).CanSell);
    }

    [Fact]
    public void RemainingOneCopyDoesNotBecomeAnExclusiveOriginal()
    {
        Assert.True(ArtworkSalePolicy.Evaluate(1, 2, 1, true, false, 1, false, false, 20, 100).CanSell);
        Assert.True(ArtworkSalePolicy.Evaluate(1, 2, 1, true, false, 1, false, true, 1, 100).CanSell);
        Assert.False(ArtworkSalePolicy.Evaluate(1, 2, 1, true, false, 1, false, true, null, 100).CanSell);
        Assert.False(ArtworkSalePolicy.Evaluate(1, 2, 1, true, false, 2, false, true, 1, 100).CanSell);
        Assert.False(ArtworkSalePolicy.Evaluate(1, 2, 1, true, false, 2, true, false, 20, 100).CanSell);
    }

    [Fact]
    public async Task ArtistCannotSubmitWithoutExplicitMinimumRightsDeclaration()
    {
        var business = new HoaSiBusiness(null!, null!, null!, null!, null!, null!, null!, null!);
        foreach (var request in new[] {
            new TaoTacPhamRequest { TenTacPham = "Test", Gia = 100, SoLuong = 2 },
            new TaoTacPhamRequest { TenTacPham = "Test", Gia = 100, SoLuong = 2, CanCuSuDung = 1, KhaiBaoNguonGoc = "Nguồn gốc" },
            new TaoTacPhamRequest { TenTacPham = "Test", Gia = 100, SoLuong = 2, CanCuSuDung = 99, KhaiBaoNguonGoc = "Nguồn gốc", XacNhanQuyenSuDung = true },
        }) await Assert.ThrowsAsync<ArgumentException>(() => business.TaoTacPham(3, request));
    }
}
