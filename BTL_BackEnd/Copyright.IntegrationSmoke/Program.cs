using Microsoft.Data.SqlClient;

var connectionString = Environment.GetEnvironmentVariable("COPYRIGHT_TEST_CONNECTION");
var backupConfirmed = Environment.GetEnvironmentVariable("COPYRIGHT_TEST_BACKUP_CONFIRMED");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Set COPYRIGHT_TEST_CONNECTION to an isolated copy of the real database schema.");
if (!string.Equals(backupConfirmed, "YES", StringComparison.Ordinal))
    throw new InvalidOperationException("Set COPYRIGHT_TEST_BACKUP_CONFIRMED=YES only after the test database backup has been verified.");

await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

await AssertScalar(connection, "SELECT CASE WHEN COL_LENGTH(N'dbo.TacPham',N'SoLuongBanDau') IS NOT NULL THEN 1 ELSE 0 END", 1,
    "TacPham.SoLuongBanDau exists");
await AssertScalar(connection, "SELECT CASE WHEN COL_LENGTH(N'dbo.LichSuSoHuu',N'EventKey') IS NOT NULL THEN 1 ELSE 0 END", 1,
    "Ownership EventKey exists");
await AssertScalar(connection, "SELECT CASE WHEN COL_LENGTH(N'dbo.ChungNhan',N'CertificateCode') IS NOT NULL THEN 1 ELSE 0 END", 1,
    "Public certificate code exists");
await AssertScalar(connection, "SELECT COUNT(*) FROM sys.triggers WHERE name IN (N'TR_NhatKyHeThong_BlockUpdate',N'TR_NhatKyHeThong_BlockDelete')", 2,
    "Immutable application audit triggers exist");

await AssertScalar(connection, @"
    SELECT COUNT(*) FROM (
      SELECT EventKey FROM LichSuSoHuu WHERE EventKey IS NOT NULL
      GROUP BY EventKey HAVING COUNT_BIG(*) > 1
    ) duplicates", 0, "Ownership event keys are unique");
await AssertScalar(connection, @"
    SELECT COUNT(*) FROM (
      SELECT MaTacPham FROM LichSuSoHuu WHERE TrangThai=1
      GROUP BY MaTacPham HAVING COUNT_BIG(*) > 1
    ) duplicates", 0, "At most one current physical owner per artwork");
await AssertScalar(connection, @"
    SELECT COUNT(*) FROM (
      SELECT MaLichSuSoHuu FROM ChungNhan WHERE TrangThai=1
      GROUP BY MaLichSuSoHuu HAVING COUNT_BIG(*) > 1
    ) duplicates", 0, "At most one active certificate per ownership event");
await AssertScalar(connection, @"
    SELECT COUNT(*) FROM TacPham
    WHERE LaTacPhamDocBan=1 AND (SoLuongBanDau<>1 OR SoLuong<0 OR SoLuong>1)", 0,
    "Exclusive artwork quantity invariants hold");
await AssertScalar(connection, @"
    SELECT COUNT(*) FROM ChungNhan c
    INNER JOIN TacPham t ON t.MaTacPham=c.MaTacPham
    LEFT JOIN BanQuyen b ON b.MaTacPham=t.MaTacPham
    WHERE c.TrangThai=1 AND (t.LaTacPhamDocBan=0 OR t.SoLuongBanDau<>1 OR ISNULL(b.TrangThai,255)<>2
       OR ISNULL(b.LaDuLieuCu,0)=1 OR ISNULL(b.BiChanBan,0)=1)", 0,
    "Certificates are limited to eligible verified exclusive artworks");

Console.WriteLine("PASS: COPYRIGHT READ-ONLY INTEGRATION CHECKS COMPLETED");

static async Task AssertScalar(SqlConnection connection, string sql, int expected, string label)
{
    await using var command = new SqlCommand(sql, connection) { CommandTimeout = 30 };
    var actual = Convert.ToInt32(await command.ExecuteScalarAsync());
    if (actual != expected) throw new Exception($"FAILED: {label}. Expected {expected}, actual {actual}.");
    Console.WriteLine("PASS: " + label);
}
