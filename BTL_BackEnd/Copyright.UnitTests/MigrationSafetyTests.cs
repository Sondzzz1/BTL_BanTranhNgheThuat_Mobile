using Xunit;

namespace Copyright.UnitTests;

public class MigrationSafetyTests
{
    private static string ReadMigration()
    {
        var path = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..",
            "BTL_BackEnd", "SQL", "Migrations", "009_HardenCopyrightProvenanceCertificates.sql"));
        return File.ReadAllText(path);
    }

    [Fact]
    public void Migration_IsAdditiveAndDoesNotContainDestructiveTableOperations()
    {
        var sql = ReadMigration().ToUpperInvariant();
        Assert.DoesNotContain("DROP TABLE", sql);
        Assert.DoesNotContain("DROP COLUMN", sql);
        Assert.DoesNotContain("TRUNCATE TABLE", sql);
        Assert.Contains("SET XACT_ABORT ON", sql);
        Assert.Contains("BEGIN TRANSACTION", sql);
    }

    [Fact]
    public void Migration_DefinesIdempotencyAndImmutableAuditGuards()
    {
        var sql = ReadMigration();
        Assert.Contains("UX_LichSuSoHuu_EventKey", sql);
        Assert.Contains("WHERE EventKey IS NOT NULL", sql);
        Assert.Contains("TR_NhatKyHeThong_BlockUpdate", sql);
        Assert.Contains("TR_NhatKyHeThong_BlockDelete", sql);
    }
}
