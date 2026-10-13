using DoAn2_BackEnd.DAL;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Xunit;
using Xunit.Abstractions;

namespace Copyright.UnitTests;

public class CustomArtNotificationSqlFactAttribute : FactAttribute
{
    public CustomArtNotificationSqlFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("CUSTOM_ART_NOTIFICATION_SQL_TESTS") != "1")
            Skip = "Opt-in local SQL test; creates and removes only GUID-identified fixtures.";
    }
}

[Collection("Local SQL workflow")]
public class CustomArtClaimNotificationSqlTests(ITestOutputHelper output)
{
    [CustomArtNotificationSqlFact]
    public async Task ClaimNotifiesAllActiveAdminsOnceAndConcurrentLoserDoesNotNotify()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "art-gallery-react"))) root = root.Parent;
        Assert.NotNull(root);
        var configuration = new ConfigurationBuilder().SetBasePath(Path.Combine(root!.FullName, "BTL_BackEnd", "BTL_BackEnd"))
            .AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", true).Build();
        await using var db = new SqlConnection(configuration.GetConnectionString("DefaultConnection"));
        await db.OpenAsync();
        Assert.Equal("HeThongBanTranh", db.Database);

        var artists = new List<(int Id, int Account, string Name)>();
        using (var command = new SqlCommand(@"SELECT TOP (2) h.MaHoaSi,h.MaTaiKhoan,h.TenHoaSi
            FROM HoaSi h JOIN TaiKhoan a ON a.MaTaiKhoan=h.MaTaiKhoan
            WHERE a.VaiTro=2 AND a.TrangThai=1 ORDER BY h.MaHoaSi;", db))
        await using (var reader = await command.ExecuteReaderAsync())
            while (await reader.ReadAsync()) artists.Add((reader.GetInt32(0), reader.GetInt32(1), reader.GetString(2)));
        Assert.Equal(2, artists.Count);
        var adminIds = new List<int>();
        using (var command = new SqlCommand("SELECT MaTaiKhoan FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1 ORDER BY MaTaiKhoan;", db))
        await using (var reader = await command.ExecuteReaderAsync())
            while (await reader.ReadAsync()) adminIds.Add(reader.GetInt32(0));
        Assert.NotEmpty(adminIds);
        var notifications = new ThongBaoRepository(configuration);
        var unreadBefore = new Dictionary<int, int>();
        foreach (var admin in adminIds) unreadBefore[admin] = await notifications.CountUnread(admin);
        var originalInbox = await Snapshot("ThongBao");
        var originalRequests = await Snapshot("YeuCauVeTranh");
        var repository = new CustomArtRepository(configuration);
        var marker = Guid.NewGuid().ToString("N");
        var accountName = "CNOTE_" + marker;
        var title = "TEST_CUSTOM_ART_NOTIFY_" + marker;
        var pendingTitle = title + "_PENDING";
        var customerId = 0;
        var accountId = 0;
        try
        {
            using (var command = new SqlCommand(@"INSERT INTO TaiKhoan(TenDangNhap,MatKhau,VaiTro,TrangThai)
                OUTPUT INSERTED.MaTaiKhoan VALUES(@Name,N'Fixture cannot log in',1,1);", db))
            {
                command.Parameters.AddWithValue("@Name", accountName);
                accountId = Convert.ToInt32(await command.ExecuteScalarAsync());
            }
            using (var command = new SqlCommand("INSERT INTO NguoiDung(MaTaiKhoan,Ten) OUTPUT INSERTED.MaNguoiDung VALUES(@Account,@Name);", db))
            {
                command.Parameters.AddWithValue("@Account", accountId);
                command.Parameters.AddWithValue("@Name", title);
                customerId = Convert.ToInt32(await command.ExecuteScalarAsync());
            }

            var approved = await repository.CreateRequest(customerId, NewRequest(title), CustomArtStatus.PendingArtist, null);
            var pending = await repository.CreateRequest(customerId, NewRequest(pendingTitle), CustomArtStatus.Submitted, null);
            Assert.False(await repository.AssignRequest(pending.MaYeuCau, artists[0].Id));
            Assert.False(await repository.AssignRequest(int.MaxValue, artists[0].Id));
            Assert.Equal(0, await EventCount(pending.MaYeuCau));

            // A failed write rolls back and cannot create a success notification.
            await Assert.ThrowsAsync<SqlException>(() => repository.AssignRequest(approved.MaYeuCau, int.MaxValue));
            Assert.Null((await repository.GetById(approved.MaYeuCau))!.MaHoaSi);
            Assert.Equal(0, await EventCount(approved.MaYeuCau));

            var claims = await Task.WhenAll(repository.AssignRequest(approved.MaYeuCau, artists[0].Id),
                repository.AssignRequest(approved.MaYeuCau, artists[1].Id));
            Assert.Single(claims, result => result);
            var winner = artists[claims[0] ? 0 : 1];
            var assigned = (await repository.GetById(approved.MaYeuCau))!;
            Assert.Equal(winner.Id, assigned.MaHoaSi);
            Assert.Equal(CustomArtStatus.Assigned, assigned.TrangThai);
            Assert.Equal(adminIds.Count, await EventCount(approved.MaYeuCau));

            foreach (var admin in adminIds)
            {
                var inbox = await notifications.GetByTaiKhoan(admin, 1, 100);
                var item = Assert.Single(inbox.Items, item => item.LoaiDoiTuong == "YeuCauVeTranh" && item.MaDoiTuong == approved.MaYeuCau);
                Assert.Equal("CUSTOM_ART_CLAIMED", item.Loai);
                Assert.Contains(winner.Name.Trim(), item.NoiDung);
                Assert.Contains(title, item.NoiDung);
                Assert.Contains($"#{approved.MaYeuCau}", item.NoiDung);
                Assert.Equal($"/admin/custom-art?requestId={approved.MaYeuCau}", item.DuongDan);
                Assert.False(item.DaDoc);
                Assert.Equal(unreadBefore[admin] + 1, await notifications.CountUnread(admin));
                Assert.False(await notifications.MarkAsRead(item.MaThongBao, winner.Account));
            }

            Assert.False(await repository.AssignRequest(approved.MaYeuCau, winner.Id));
            Assert.False(await repository.AssignRequest(approved.MaYeuCau, artists[claims[0] ? 1 : 0].Id));
            Assert.Equal(adminIds.Count, await EventCount(approved.MaYeuCau));
            using (var command = new SqlCommand(@"SELECT COUNT(*) FROM ThongBao n JOIN TaiKhoan a ON a.MaTaiKhoan=n.MaTaiKhoan
                WHERE n.LoaiDoiTuong=N'YeuCauVeTranh' AND n.MaDoiTuong=@Id AND (a.VaiTro<>0 OR a.TrangThai<>1);", db))
            {
                command.Parameters.AddWithValue("@Id", approved.MaYeuCau);
                Assert.Equal(0, Convert.ToInt32(await command.ExecuteScalarAsync()));
            }
            output.WriteLine($"PASS: one winning artist, {adminIds.Count} active Admin recipients, unread counts, retries, failed/unapproved claims and owner-safe read.");
        }
        finally
        {
            if (accountId > 0)
            {
                using var cleanup = new SqlCommand(@"SET XACT_ABORT ON; BEGIN TRAN;
                    IF NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE MaTaiKhoan=@Account AND TenDangNhap=@AccountName AND VaiTro=1)
                        THROW 51000,'Refuse cleanup: fixture account identity mismatch',1;
                    IF @Customer<>0 AND NOT EXISTS (SELECT 1 FROM NguoiDung WHERE MaNguoiDung=@Customer AND MaTaiKhoan=@Account AND Ten=@Title)
                        THROW 51000,'Refuse cleanup: fixture customer identity mismatch',1;
                    DELETE ThongBao WHERE LoaiDoiTuong=N'YeuCauVeTranh' AND MaDoiTuong IN
                        (SELECT MaYeuCau FROM YeuCauVeTranh WHERE MaKhachHang=@Customer AND TieuDe IN (@Title,@PendingTitle));
                    DELETE YeuCauVeTranh WHERE MaKhachHang=@Customer AND TieuDe IN (@Title,@PendingTitle);
                    DELETE NguoiDung WHERE MaNguoiDung=@Customer AND MaTaiKhoan=@Account AND Ten=@Title;
                    DELETE TaiKhoan WHERE MaTaiKhoan=@Account AND TenDangNhap=@AccountName AND VaiTro=1;
                    COMMIT;", db);
                cleanup.Parameters.AddWithValue("@Account", accountId);
                cleanup.Parameters.AddWithValue("@Customer", customerId);
                cleanup.Parameters.AddWithValue("@AccountName", accountName);
                cleanup.Parameters.AddWithValue("@Title", title);
                cleanup.Parameters.AddWithValue("@PendingTitle", pendingTitle);
                await cleanup.ExecuteNonQueryAsync();
                Assert.Equal(originalInbox, await Snapshot("ThongBao"));
                Assert.Equal(originalRequests, await Snapshot("YeuCauVeTranh"));
                output.WriteLine("PASS cleanup: only GUID fixture rows removed; historical requests and notification inbox unchanged.");
            }
        }

        static TaoYeuCauTranhRequest NewRequest(string name) => new()
        {
            TieuDe = name, Type = "ORIGINAL_COMMISSION", LoaiTranh = "Sơn dầu", KichThuoc = "60x80 cm",
            MoTa = "Fixture kiểm tra thông báo nhận vẽ tranh", GiaDuKien = 1000000,
        };
        async Task<int> EventCount(int id)
        {
            using var command = new SqlCommand("SELECT COUNT(*) FROM ThongBao WHERE Loai=N'CUSTOM_ART_CLAIMED' AND LoaiDoiTuong=N'YeuCauVeTranh' AND MaDoiTuong=@Id;", db);
            command.Parameters.AddWithValue("@Id", id);
            return Convert.ToInt32(await command.ExecuteScalarAsync());
        }
        async Task<string> Snapshot(string table)
        {
            // Table names are constants from this test, never user input.
            var identity = table == "ThongBao" ? "MaThongBao" : "MaYeuCau";
            using var command = new SqlCommand($"SELECT (SELECT * FROM {table} ORDER BY {identity} FOR JSON PATH,INCLUDE_NULL_VALUES);", db);
            return (string)(await command.ExecuteScalarAsync())!;
        }
    }
}
