using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Copyright.UnitTests;

public class CertificateSecurityTests
{
    private const string Key = "unit-test-certificate-key-with-more-than-32-characters";

    [Fact]
    public void IntegrityHash_VerifiesOriginalAndRejectsTampering()
    {
        var issued = new DateTime(2026, 10, 2, 8, 30, 0, DateTimeKind.Utc);
        var hash = CertificateIntegrityHelper.CreateHash(Key, 12, 34, 56, issued, "COA-2026-TEST");

        Assert.True(CertificateIntegrityHelper.Verify(Key, 12, 34, 56, issued, "COA-2026-TEST", hash));
        Assert.False(CertificateIntegrityHelper.Verify(Key, 12, 99, 56, issued, "COA-2026-TEST", hash));
        Assert.False(CertificateIntegrityHelper.Verify(Key, 12, 34, 56, issued, "COA-2026-TEST", "not-hex"));
    }

    [Fact]
    public void PublicCode_IsUniqueAndHasExpectedPrefix()
    {
        var issued = new DateTime(2026, 10, 2, 0, 0, 0, DateTimeKind.Utc);
        var first = CertificateIntegrityHelper.CreateCode(issued);
        var second = CertificateIntegrityHelper.CreateCode(issued);

        Assert.StartsWith("COA-2026-", first);
        Assert.NotEqual(first, second);
    }

    [Theory]
    [InlineData("Nguyễn Văn An", "N*** V*** An")]
    [InlineData("An", "A***")]
    [InlineData(null, "Không công khai")]
    public void MaskOwner_DoesNotExposeFullPrivateName(string? source, string expected) =>
        Assert.Equal(expected, CertificateIntegrityHelper.MaskOwner(source));

    [Fact]
    public void CertificateKey_FailsClosedWhenMissingOrShort()
    {
        var options = new CopyrightOptions { CertificateHashKey = "short" };
        Assert.Throws<InvalidOperationException>(() => options.RequireCertificateKey());
    }

    [Fact]
    public void QrAndPdf_AreGeneratedWithValidFileSignatures()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Copyright:BaseUrl"] = "https://gallery.example",
            ["Copyright:CertificateHashKey"] = Key
        }).Build();
        var service = new CertificateDocumentService(configuration);
        var qr = service.CreateQr("COA-2026-TEST");
        var pdf = service.CreatePdf(new ChungNhanResponse
        {
            MaChungNhanCongKhai = "COA-2026-TEST",
            MaTacPham = 12,
            TenTacPham = "Bình minh",
            TacGia = "Họa sĩ thử nghiệm",
            ChuSoHuu = "N*** V*** An",
            NgayCap = new DateTime(2026, 10, 2, 8, 30, 0, DateTimeKind.Utc),
            TrangThai = "ACTIVE",
            LoaiTacPhamText = "Tác phẩm tự sáng tác"
        });

        Assert.Equal(new byte[] { 0x89, 0x50, 0x4E, 0x47 }, qr.Take(4).ToArray());
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(pdf.Take(4).ToArray()));
    }

    [Fact]
    public void StatusMappings_KeepRejectedRevokedAndLegacyDistinct()
    {
        Assert.Equal("REJECTED", CopyrightStatuses.ToCode(CopyrightStatuses.Rejected));
        Assert.Equal("REVOKED", CopyrightStatuses.ToCode(CopyrightStatuses.Revoked));
        Assert.Equal("LEGACY", CopyrightStatuses.ToCode(CopyrightStatuses.Legacy));
        Assert.Equal("REVOKED", CertificateStatuses.ToCode(CertificateStatuses.Revoked));
    }
}
