using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using DoAn2_BackEnd.DAL;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;
using Xunit.Abstractions;

public class NotificationRuntimeFactAttribute : FactAttribute
{
    public NotificationRuntimeFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("NOTIFICATION_RUNTIME_TESTS") != "1")
            Skip = "Opt-in local SQL/HTTP fixture; never operates on an existing artwork.";
    }
}

namespace Copyright.UnitTests
{
[Collection("Local SQL workflow")]
public class NotificationWorkflowRuntimeTests(ITestOutputHelper output)
{
    [NotificationRuntimeFact]
    public async Task TwoWayWorkflowRecipientsRetriesOwnershipAndRollback()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "art-gallery-react"))) root = root.Parent;
        Assert.NotNull(root);
        var config = new ConfigurationBuilder().SetBasePath(Path.Combine(root!.FullName, "BTL_BackEnd", "BTL_BackEnd"))
            .AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", true).Build();
        var url = new Uri(Environment.GetEnvironmentVariable("ARTWORK_CONTENT_TEST_URL") ?? "http://localhost:5284/api/");
        Assert.True(url.IsLoopback);
        await using var db = new SqlConnection(config.GetConnectionString("DefaultConnection"));
        await db.OpenAsync(); Assert.Equal("HeThongBanTranh", db.Database);
        var artistId = await Int("SELECT TOP 1 h.MaHoaSi FROM HoaSi h JOIN TaiKhoan a ON a.MaTaiKhoan=h.MaTaiKhoan WHERE a.VaiTro=2 AND a.TrangThai=1 ORDER BY h.MaHoaSi");
        var ownerId = await Int($"SELECT MaTaiKhoan FROM HoaSi WHERE MaHoaSi={artistId}");
        var otherId = await Int($"SELECT TOP 1 MaTaiKhoan FROM TaiKhoan WHERE VaiTro=2 AND TrangThai=1 AND MaTaiKhoan<>{ownerId}");
        var adminId = await Int("SELECT TOP 1 MaTaiKhoan FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1 ORDER BY MaTaiKhoan");
        var admins = await Int("SELECT COUNT(*) FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1");
        Assert.True(admins > 0);
        using var artist = Client("HoaSi", ownerId, artistId);
        using var admin = Client("Admin", adminId, null);
        using var other = Client("HoaSi", otherId, null);
        var name = "TEST_NOTIFICATION_" + Guid.NewGuid().ToString("N");
        var initialInbox = await Text("SELECT (SELECT * FROM ThongBao ORDER BY MaThongBao FOR JSON PATH,INCLUDE_NULL_VALUES)");
        var id = 0; var copyrightId = 0; var removedId = 0;
        var removedName = name + "_DELETE"; var removedKey = Guid.NewGuid().ToString();
        var key = Guid.NewGuid().ToString();
        artist.DefaultRequestHeaders.Add("Idempotency-Key", key);
        try
        {
            var body = new { tenTacPham = name, maDanhMuc = 1, gia = 100000, soLuong = 3,
                laTacPhamDocBan = false, moTa = "Only basic description", loaiTacPham = 0 };
            var concurrentCreates = await Task.WhenAll(Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", body),
                Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", body));
            id = concurrentCreates[0].GetProperty("maTacPham").GetInt32();
            Assert.Equal(id, concurrentCreates[1].GetProperty("maTacPham").GetInt32());
            await Event("ARTWORK_SUBMITTED", admins);
            var retry = await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", body);
            Assert.Equal(id, retry.GetProperty("maTacPham").GetInt32()); await Event("ARTWORK_SUBMITTED", admins);
            await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", new { tenTacPham = name, maDanhMuc = 1, gia = 999999, soLuong = 3,
                laTacPhamDocBan = false, moTa = "Changed body under same key", loaiTacPham = 0 }, HttpStatusCode.BadRequest);
            await Event("ARTWORK_SUBMITTED", admins);
            await Send(admin, HttpMethod.Put, Review(), new { pheDuyet = false, lyDo = "Fixture reason <b>plain text</b>" });
            await Event("ARTWORK_REJECTED", 1, ownerId);
            await Send(admin, HttpMethod.Put, Review(), new { pheDuyet = false, lyDo = "Fixture reason" });
            await Event("ARTWORK_REJECTED", 1, ownerId);
            await Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{id}/gui-duyet-lai", null);
            await Event("ARTWORK_RESUBMITTED", admins);
            await Task.WhenAll(Send(admin, HttpMethod.Put, Review(), new { pheDuyet = true }), Send(admin, HttpMethod.Put, Review(), new { pheDuyet = true }));
            await Event("ARTWORK_APPROVED", 1, ownerId);
            var edit = new { tenTacPham = name, maDanhMuc = 1, gia = 120000, soLuong = 3, moTa = "Edit description" };
            await Task.WhenAll(Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{id}/update", edit), Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{id}/update", edit));
            await Event("ARTWORK_EDIT_SUBMITTED", admins);
            var editId = await Int($"SELECT TOP 1 MaChinhSua FROM TacPhamChinhSua WHERE MaTacPham={id} AND TrangThai=0");
            await Send(admin, HttpMethod.Put, $"admin/tac-pham-chinh-sua/{editId}/duyet", new { pheDuyet = false, lyDo = "Fixture edit rejected" });
            await Event("ARTWORK_EDIT_REJECTED", 1, ownerId);
            await Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{id}/update", edit);
            await Event("ARTWORK_EDIT_SUBMITTED", admins * 2);
            await Send(admin, HttpMethod.Put, Review(), new { pheDuyet = true });
            await Event("ARTWORK_EDIT_APPROVED", 1, ownerId);

            await Send(artist, HttpMethod.Post, Detail(), new { cauChuyenSangTac = "  " }, HttpStatusCode.BadRequest);
            await Event("DETAIL_SUBMITTED", 0);
            var detail = new { cauChuyenSangTac = "Separate meaningful detail" };
            await Send(artist, HttpMethod.Post, Detail(), detail);
            await Event("DETAIL_SUBMITTED", admins);
            await Send(artist, HttpMethod.Get, Detail(), null);
            await Event("DETAIL_SUBMITTED", admins); // reads/drafts do not submit
            await Send(admin, HttpMethod.Put, DetailReview(), new { pheDuyet = true });
            await Event("ARTWORK_CONTENT_APPROVED", 1, ownerId);
            await Send(artist, HttpMethod.Put, Detail(), new { cauChuyenSangTac = "Approved detail edited" });
            await Send(artist, HttpMethod.Put, Detail(), new { cauChuyenSangTac = "Approved detail edited" });
            await Event("DETAIL_SUBMITTED", admins * 2);
            await Send(admin, HttpMethod.Put, DetailReview(), new { pheDuyet = false, lyDoTuChoi = "Detail rejection reason" });
            await Event("ARTWORK_CONTENT_REJECTED", 1, ownerId);
            Assert.Equal(1, await Int($"SELECT TrangThai FROM TacPham WHERE MaTacPham={id}"));
            await Send(artist, HttpMethod.Put, Detail(), new { cauChuyenSangTac = "Resubmitted detail" });
            await Send(admin, HttpMethod.Put, DetailReview(), new { pheDuyet = true });
            await Event("ARTWORK_CONTENT_APPROVED", 2, ownerId);

            var repo = new CopyrightRepository(config);
            copyrightId = await repo.Create(artistId, ownerId, new TaoBanQuyenRequest { MaTacPham = id,
                TacGia = "Fixture author", NguonGoc = "Fixture original", CanCuSuDung = 1, LoaiTacPham = 0, LaTacPhamDocBan = false });
            await Event("COPYRIGHT_SUBMITTED", admins);
            Assert.True(await repo.Review(copyrightId, adminId, CopyrightStatuses.NeedInfo, "Add evidence"));
            await Event("COPYRIGHT_NEED_INFO", 1, ownerId);
            var copyrightEdit = new CapNhatBanQuyenRequest { TacGia = "Fixture author", NguonGoc = "Updated origin", CanCuSuDung = 1, LoaiTacPham = 0 };
            Assert.True(await repo.Update(copyrightId, artistId, ownerId, copyrightEdit));
            Assert.True(await repo.Update(copyrightId, artistId, ownerId, copyrightEdit));
            await Event("COPYRIGHT_SUBMITTED", admins * 2);
            Assert.True(await repo.Review(copyrightId, adminId, CopyrightStatuses.Rejected, "Rejected proof"));
            await Event("COPYRIGHT_REJECTED", 1, ownerId);
            Assert.True(await repo.Update(copyrightId, artistId, ownerId, copyrightEdit));
            Assert.True(await repo.Review(copyrightId, adminId, CopyrightStatuses.NeedInfo, "Need evidence again"));
            // Repository metadata fixtures only; no files are uploaded/created.
            await repo.AddEvidence(copyrightId, artistId, ownerId, new CopyrightEvidenceFile("fixture.png", "fixture1.png", "fixture1.png", "image/png", 1, "fixture-hash-1", "Fixture"));
            await Event("COPYRIGHT_SUBMITTED", admins * 4);
            await repo.AddEvidence(copyrightId, artistId, ownerId, new CopyrightEvidenceFile("fixture.png", "fixture2.png", "fixture2.png", "image/png", 1, "fixture-hash-2", "Fixture"));
            await Event("COPYRIGHT_SUBMITTED", admins * 4); // plain upload while pending is not another event
            Assert.True(await repo.Review(copyrightId, adminId, CopyrightStatuses.Verified, null));
            await Event("COPYRIGHT_VERIFIED", 1, ownerId);
            Assert.False(await repo.Review(copyrightId, adminId, CopyrightStatuses.Verified, null));
            await Event("COPYRIGHT_VERIFIED", 1, ownerId);
            Assert.True(await repo.RevokeVerification(copyrightId, adminId, "Fixture revoke", false));
            await Event("COPYRIGHT_REVOKED", 1, ownerId);

            await Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/hide", null);
            await Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/hide", null);
            await Event("ARTWORK_HIDDEN", 1, ownerId);
            await Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/show", null);
            await Event("ARTWORK_SHOWN", 1, ownerId);
            var artworkRepo = new TacPhamRepository(config);
            var edits = new TacPhamChinhSuaRepository(config);
            await edits.Create(new TacPhamChinhSua { MaTacPham = id, TenTacPham = name, MaDanhMuc = 1, Gia = 130000, SoLuong = 3, TrangThai = 0 });
            var pendingEdit = (await edits.GetByMaTacPhamChoDuyet(id))!;
            pendingEdit.TrangThai = 1;
            var stored = (await artworkRepo.GetById(id))!;
            stored.ExpectedStatus = stored.TrangThai; stored.TrangThai = 2;
            var before = await Int($"SELECT COUNT(*) FROM ThongBao WHERE LoaiDoiTuong='TacPham' AND MaDoiTuong={id}");
            await Assert.ThrowsAsync<SqlException>(() => artworkRepo.UpdateWithArtistNotification(stored,
                new ThongBao { Loai = "ROLLBACK_FIXTURE", TieuDe = new string('X', 500), NoiDung = "Must rollback", LoaiDoiTuong = "TacPham", MaDoiTuong = id }, pendingEdit));
            Assert.Equal(0, (await edits.GetById(pendingEdit.MaChinhSua))!.TrangThai);
            Assert.Equal(1, await Int($"SELECT TrangThai FROM TacPham WHERE MaTacPham={id}"));
            Assert.Equal(before, await Int($"SELECT COUNT(*) FROM ThongBao WHERE LoaiDoiTuong='TacPham' AND MaDoiTuong={id}"));
            var notificationId = await Long($"SELECT TOP 1 MaThongBao FROM ThongBao WHERE LoaiDoiTuong='TacPham' AND MaDoiTuong={id} AND MaTaiKhoan={ownerId} ORDER BY MaThongBao DESC");
            await Send(other, HttpMethod.Put, $"thong-bao/{notificationId}/da-doc", null, HttpStatusCode.NotFound);
            await Send(admin, HttpMethod.Put, $"thong-bao/{notificationId}/da-doc", null, HttpStatusCode.NotFound);
            Assert.Equal(0, await Int($"SELECT CAST(DaDoc AS INT) FROM ThongBao WHERE MaThongBao={notificationId}"));
            await Send(artist, HttpMethod.Put, $"thong-bao/{notificationId}/da-doc", null);
            await Send(artist, HttpMethod.Put, $"thong-bao/{notificationId}/da-doc", null);
            Assert.Equal(1, await Int($"SELECT CAST(DaDoc AS INT) FROM ThongBao WHERE MaThongBao={notificationId}"));
            var otherInbox = await Send(other, HttpMethod.Get, "thong-bao?pageSize=50", null);
            Assert.DoesNotContain(otherInbox.GetProperty("items").EnumerateArray(), n => n.GetProperty("maThongBao").GetInt64() == notificationId);
            artist.DefaultRequestHeaders.Remove("Idempotency-Key"); artist.DefaultRequestHeaders.Add("Idempotency-Key", removedKey);
            removedId = (await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", new {
                tenTacPham = removedName, maDanhMuc = 1, gia = 100000, soLuong = 3, laTacPhamDocBan = false, loaiTacPham = 0
            })).GetProperty("maTacPham").GetInt32();
            await Send(admin, HttpMethod.Delete, $"admin/tac-pham/{removedId}/delete", null);
            Assert.Equal(0, await Int($"SELECT COUNT(*) FROM TacPham WHERE MaTacPham={removedId}"));
            Assert.Equal(1, await Int($"SELECT COUNT(*) FROM ThongBao WHERE Loai='ARTWORK_REMOVED' AND MaDoiTuong={removedId} AND MaTaiKhoan={ownerId} AND DuongDan='/artist/artworks'"));
            output.WriteLine($"PASS workflow events, {admins} active Admin recipients, owner authorization, retries, rollback; fixture {id}");
        }
        finally
        {
            if (id == 0)
                id = await Int($"SELECT ISNULL(MAX(MaTacPham),0) FROM TacPham WHERE SubmitRequestKey='{key}' AND TenTacPham='{name}' AND MaHoaSi={artistId}");
            if (id > 0)
            {
                using var cleanup = new SqlCommand(@"SET XACT_ABORT ON; BEGIN TRAN;
                    IF NOT EXISTS (SELECT 1 FROM TacPham WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@Id AND TenTacPham=@Name AND MaHoaSi=@Artist AND SubmitRequestKey=@Key)
                        THROW 51000,'Refuse cleanup: fixture identity mismatch',1;
                    DELETE ThongBao WHERE (LoaiDoiTuong IN ('TacPham','ChiTietTacPham') AND MaDoiTuong=@Id)
                        OR (LoaiDoiTuong='BanQuyen' AND MaDoiTuong IN (SELECT MaBanQuyen FROM BanQuyen WHERE MaTacPham=@Id));
                    DELETE e FROM BangChungBanQuyen e JOIN BanQuyen b ON b.MaBanQuyen=e.MaBanQuyen WHERE b.MaTacPham=@Id;
                    DELETE BanQuyen WHERE MaTacPham=@Id;
                    DELETE ChiTietTacPham WHERE MaTacPham=@Id;
                    DELETE TacPhamChinhSua WHERE MaTacPham=@Id;
                    DELETE TacPham WHERE MaTacPham=@Id AND TenTacPham=@Name AND MaHoaSi=@Artist; COMMIT;", db);
                cleanup.Parameters.AddWithValue("@Id", id); cleanup.Parameters.AddWithValue("@Name", name);
                cleanup.Parameters.AddWithValue("@Artist", artistId); cleanup.Parameters.AddWithValue("@Key", Guid.Parse(key));
                await cleanup.ExecuteNonQueryAsync();
                if (removedId > 0)
                {
                    using var removedCleanup = new SqlCommand(@"SET XACT_ABORT ON; BEGIN TRAN;
                        IF EXISTS (SELECT 1 FROM TacPham WHERE MaTacPham=@Id) THROW 51000,'Removed fixture still exists; refuse notification-only cleanup',1;
                        IF EXISTS (SELECT 1 FROM ThongBao WHERE LoaiDoiTuong='TacPham' AND MaDoiTuong=@Id AND NoiDung NOT LIKE @Name)
                            THROW 51000,'Removed fixture notification identity mismatch',1;
                        DELETE ThongBao WHERE LoaiDoiTuong='TacPham' AND MaDoiTuong=@Id AND NoiDung LIKE @Name;
                        COMMIT;", db);
                    removedCleanup.Parameters.AddWithValue("@Id", removedId);
                    removedCleanup.Parameters.AddWithValue("@Name", "%" + removedName + "%");
                    await removedCleanup.ExecuteNonQueryAsync();
                }
                Assert.Equal(initialInbox, await Text("SELECT (SELECT * FROM ThongBao ORDER BY MaThongBao FOR JSON PATH,INCLUDE_NULL_VALUES)"));
                output.WriteLine("Append-only NhatKyHeThong fixture audit entries intentionally retained; trigger never disabled.");
                output.WriteLine("PASS cleanup: only fixture rows removed; historical inbox byte-for-byte unchanged");
            }
        }

        string Review() => $"admin/tac-pham/{id}/update/duyet";
        string Detail() => $"hoa-si/tac-pham/{id}/chi-tiet";
        string DetailReview() => $"admin/chi-tiet-tac-pham/{id}/duyet";
        async Task Event(string type, int count, int? recipient = null)
        {
            var entity = type.StartsWith("COPYRIGHT_") ? "BanQuyen" : type == "DETAIL_SUBMITTED" || type.StartsWith("ARTWORK_CONTENT_") ? "ChiTietTacPham" : "TacPham";
            var entityId = entity == "BanQuyen" ? copyrightId : id;
            var filter = $"Loai='{type}' AND LoaiDoiTuong='{entity}' AND MaDoiTuong={entityId}";
            Assert.Equal(count, await Int($"SELECT COUNT(*) FROM ThongBao WHERE {filter}"));
            if (recipient.HasValue) Assert.Equal(0, await Int($"SELECT COUNT(*) FROM ThongBao WHERE {filter} AND MaTaiKhoan<>{recipient}"));
            else Assert.Equal(0, await Int($"SELECT COUNT(*) FROM ThongBao n JOIN TaiKhoan a ON a.MaTaiKhoan=n.MaTaiKhoan WHERE {filter} AND (a.VaiTro<>0 OR a.TrangThai<>1)"));
        }
        async Task<int> Int(string sql) => Convert.ToInt32(await Long(sql));
        async Task<long> Long(string sql) { using var cmd = new SqlCommand(sql, db); return Convert.ToInt64(await cmd.ExecuteScalarAsync()); }
        async Task<string> Text(string sql) { using var cmd = new SqlCommand(sql, db); return (string)(await cmd.ExecuteScalarAsync())!; }
        HttpClient Client(string role, int account, int? artistKey)
        {
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, account.ToString()), new(ClaimTypes.Role, role), new("VaiTro", role == "Admin" ? "0" : "2") };
            if (artistKey.HasValue) claims.Add(new Claim("MaHoaSi", artistKey.Value.ToString()));
            var token = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
            var client = new HttpClient { BaseAddress = url };
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token)); return client;
        }
    }

    private static async Task<JsonElement> Send(HttpClient client, HttpMethod method, string route, object? payload, HttpStatusCode expected = HttpStatusCode.OK)
    {
        using var req = new HttpRequestMessage(method, route);
        if (payload != null) req.Content = JsonContent.Create(payload);
        using var response = await client.SendAsync(req); var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expected, $"{method} {route}: {(int)response.StatusCode}; {body}");
        return JsonDocument.Parse(body).RootElement.Clone();
    }
}
}
