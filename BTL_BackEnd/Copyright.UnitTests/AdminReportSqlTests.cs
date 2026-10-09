using DoAn2_BackEnd.DAL;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Copyright.UnitTests;

// Opt-in: uses the configured local database read-only and connection-scoped #tables.
public class ReportSqlFactAttribute : FactAttribute
{
    public ReportSqlFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("ADMIN_REPORT_SQL_TESTS") != "1")
            Skip = "Set ADMIN_REPORT_SQL_TESTS=1 to run SQL Server read-only / temporary-table checks.";
    }
}

public class AdminReportSqlTests
{
    [ReportSqlFact]
    public async Task RealRepositoryMappingAndExactSqlEndDayBoundary()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "art-gallery-react"))) root = root.Parent;
        Assert.NotNull(root);
        var config = new ConfigurationBuilder().SetBasePath(Path.Combine(root!.FullName, "BTL_BackEnd", "BTL_BackEnd"))
            .AddJsonFile("appsettings.json").Build();
        var repository = new AdminRepository(config);
        // Exercise actual reader types against the existing schema without changing business data.
        foreach (var type in new[] { "don-hang", "doanh-thu", "tac-pham", "hoa-si", "khach-hang" })
        {
            var rows = await repository.GetReportSource(type, new DateTime(2000, 1, 1), new DateTime(2099, 12, 31));
            Assert.All(rows, row => Assert.InRange(row.Date, new DateTime(2000, 1, 1), new DateTime(2100, 1, 1).AddTicks(-1)));
        }
        await using var connection = new SqlConnection(config.GetConnectionString("DefaultConnection"));
        await connection.OpenAsync();
        // No persistent CREATE/INSERT/UPDATE: these fixtures disappear when this connection closes.
        const string fixture = @"
            CREATE TABLE #DonHang (MaDonHang int, NgayDat datetime, NgayGiao datetime2, TrangThai tinyint, MaNguoiDung int);
            CREATE TABLE #ChiTietDonHang (MaChiTietDH int, MaDonHang int, MaTacPham int, SoLuong int, SoLuongDaHoan int, DonGia decimal(18,2));
            CREATE TABLE #TacPham (MaTacPham int, TenTacPham nvarchar(100), MaHoaSi int, MaYeuCauVeTranh int);
            CREATE TABLE #HoaSi (MaHoaSi int, TenHoaSi nvarchar(100));
            CREATE TABLE #NguoiDung (MaNguoiDung int, Ten nvarchar(100));
            CREATE TABLE #ThanhToan (MaDonHang int, TrangThai nvarchar(30));
            INSERT #DonHang VALUES
                (1,'2026-10-08','2026-10-09 23:59:59',3,1),
                (2,'2026-10-09 23:59:59','2026-10-10',3,1),
                (3,'2026-10-09 12:00',NULL,3,1),
                (4,'2026-10-10',NULL,0,1);
            INSERT #ChiTietDonHang VALUES (1,1,1,5,2,100),(2,2,1,1,0,100),(3,3,1,2,0,100);
            INSERT #TacPham VALUES (1,N'Test artwork',1,NULL);
            INSERT #HoaSi VALUES (1,N'Test artist'); INSERT #NguoiDung VALUES (1,N'Test customer');
            INSERT #ThanhToan VALUES (1,N'DaThanhToan'),(2,N'DaThanhToan'),(3,N'DaThanhToan'),(3,N'DaThanhToan');";
        await using (var setup = new SqlCommand(fixture, connection)) await setup.ExecuteNonQueryAsync();
        foreach (var ordersOnly in new[] { true, false })
        {
            var sql = AdminRepository.GetReportQuery(ordersOnly);
            foreach (var table in new[] { "ChiTietDonHang", "DonHang", "ThanhToan", "TacPham", "HoaSi", "NguoiDung" })
                sql = System.Text.RegularExpressions.Regex.Replace(sql, $@"\b{table}\b", "#" + table);
            await using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@FromDate", new DateTime(2026, 10, 9));
            command.Parameters.AddWithValue("@EndExclusive", new DateTime(2026, 10, 10));
            command.Parameters.AddWithValue("@Delivered", (byte)3);
            await using var reader = await command.ExecuteReaderAsync();
            var ids = new List<int>();
            while (await reader.ReadAsync())
            {
                ids.Add(reader.GetInt32(0));
                if (!ordersOnly && reader.GetInt32(0) == 3) Assert.Equal(2, reader.GetInt32(reader.GetOrdinal("PaymentCount")));
            }
            // Orders use NgayDat; sales use NgayGiao with legacy fallback. Duplicate payments do not multiply lines.
            Assert.Equal(ordersOnly ? new[] { 3, 2 } : new[] { 1, 3 }, ids);
        }
    }
}
