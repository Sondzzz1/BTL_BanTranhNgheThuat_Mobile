using Xunit;

namespace Copyright.UnitTests;

/// <summary>
/// Contract tests intentionally do not require a SQL Server instance. Database-backed
/// workflow tests remain an integration-test concern; these protect the schema/API
/// invariants that make those workflows safe.
/// </summary>
public class NotificationModuleContractTests
{
    private static string Root => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
    private static string Read(params string[] parts) => File.ReadAllText(Path.Combine(new[] { Root }.Concat(parts).ToArray()));

    [Fact]
    public void NotificationMigration_IsAdditiveAndHasRecipientAndRetryGuards()
    {
        var sql = Read("BTL_BackEnd", "SQL", "Migrations", "010_ArtistNotifications.sql").ToUpperInvariant();
        Assert.DoesNotContain("DROP TABLE", sql);
        Assert.DoesNotContain("TRUNCATE TABLE", sql);
        Assert.Contains("FOREIGN KEY (MATAIKHOAN) REFERENCES DBO.TAIKHOAN(MATAIKHOAN)", sql);
        Assert.Contains("IX_THONGBAO_TAIKHOAN_NGAYTAO", sql);
        Assert.Contains("UX_THONGBAO_EVENTKEY", sql);
        Assert.Contains("WHERE EVENTKEY IS NOT NULL", sql);
    }

    [Fact]
    public void NotificationApi_UsesAuthenticatedAccountRatherThanClientSuppliedRecipient()
    {
        var controller = Read("BTL_BackEnd", "Controllers", "ThongBaoController.cs");
        Assert.Contains("[Authorize]", controller);
        Assert.Contains("JwtHelper.GetMaTaiKhoan(User)", controller);
        Assert.DoesNotContain("MaTaiKhoan]", controller);
        Assert.Contains("chua-doc/dem", controller);
    }

    [Fact]
    public void ModerationWriters_InsertNotificationInsideTheirSqlTransaction()
    {
        var artwork = Read("BTL_BackEnd", "DAL", "TacPhamRepository.cs");
        var content = Read("BTL_BackEnd", "DAL", "ChiTietTacPhamRepository.cs");
        var copyright = Read("BTL_BackEnd", "DAL", "CopyrightRepository.Advanced.cs");
        var article = Read("BTL_BackEnd", "DAL", "BaiVietRepository.cs");

        Assert.Contains("UpdateWithArtistNotification", artwork);
        Assert.Contains("ThongBaoSql.InsertAsync(connection, transaction", artwork);
        Assert.Contains("ThongBaoSql.InsertAsync(connection, transaction", content);
        Assert.Contains("COPYRIGHT_VERIFIED", copyright);
        Assert.Contains("COPYRIGHT_REVOKED", copyright);
        Assert.Contains("ThongBaoSql.InsertAsync(connection, transaction", article);
    }
}
