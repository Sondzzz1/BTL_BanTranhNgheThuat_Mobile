using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;
using Xunit.Abstractions;

namespace Copyright.UnitTests;

public class ArtworkRuntimeFactAttribute : FactAttribute
{
    public ArtworkRuntimeFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("ARTWORK_CONTENT_RUNTIME_TESTS") != "1")
            Skip = "Opt-in: local HTTP/SQL test creates and cleans up only its uniquely named fixture.";
    }
}

// Real controller -> BLL -> DAL -> local SQL. Never targets an existing artwork.
// JWTs are short-lived in-memory test fixtures; login/password issuance is not tested.
[Collection("Local SQL workflow")]
public class ArtworkContentRuntimeTests(ITestOutputHelper output)
{
    [ArtworkRuntimeFact]
    public async Task DescriptionAndDetailRemainIndependentThroughRealApiAndDatabase()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root != null && !Directory.Exists(Path.Combine(root.FullName, "art-gallery-react"))) root = root.Parent;
        Assert.NotNull(root);
        var config = new ConfigurationBuilder().SetBasePath(Path.Combine(root!.FullName, "BTL_BackEnd", "BTL_BackEnd"))
            .AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", optional: true).Build();
        var baseUri = new Uri(Environment.GetEnvironmentVariable("ARTWORK_CONTENT_TEST_URL") ?? "http://localhost:5284/api/");
        Assert.True(baseUri.IsLoopback, "Runtime writes must target a local server only.");
        await using var db = new SqlConnection(config.GetConnectionString("DefaultConnection"));
        await db.OpenAsync();
        Assert.Equal("HeThongBanTranh", db.Database);
        var artistId = await ScalarInt("SELECT TOP 1 h.MaHoaSi FROM HoaSi h JOIN TaiKhoan a ON a.MaTaiKhoan=h.MaTaiKhoan WHERE a.VaiTro=2 AND a.TrangThai=1 ORDER BY h.MaHoaSi");
        var otherArtistId = await ScalarInt($"SELECT TOP 1 h.MaHoaSi FROM HoaSi h JOIN TaiKhoan a ON a.MaTaiKhoan=h.MaTaiKhoan WHERE a.VaiTro=2 AND a.TrangThai=1 AND h.MaHoaSi<>{artistId} ORDER BY h.MaHoaSi");
        var artistAccount = await ScalarInt($"SELECT MaTaiKhoan FROM HoaSi WHERE MaHoaSi={artistId}");
        var otherArtistAccount = await ScalarInt($"SELECT MaTaiKhoan FROM HoaSi WHERE MaHoaSi={otherArtistId}");
        var adminAccount = await ScalarInt("SELECT TOP 1 MaTaiKhoan FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1 ORDER BY MaTaiKhoan");
        using var artist = Client("HoaSi", artistAccount, artistId);
        using var other = Client("HoaSi", otherArtistAccount, otherArtistId);
        using var admin = Client("Admin", adminAccount, null);
        using var publicClient = new HttpClient { BaseAddress = baseUri };
        var name = "TEST_TACH_MOTA_RUNTIME_" + Guid.NewGuid().ToString("N");
        var id = 0;
        var originalArtworks = await Snapshot("TacPham", 0);
        var originalDetails = await Snapshot("ChiTietTacPham", 0);
        try
        {
            var created = await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", new
            {
                tenTacPham = name, maDanhMuc = 1, gia = 100000, soLuong = 1, laTacPhamDocBan = true,
                moTa = "Mo ta co ban runtime test", loaiTacPham = 0
            }, HttpStatusCode.OK);
            id = created.GetProperty("maTacPham").GetInt32();
            Assert.True(id > 0);
            Assert.Equal("Mo ta co ban runtime test", await Description());
            Assert.Equal(0, await DetailCount());
            output.WriteLine($"PASS CREATE: MaTacPham={id}; TenTacPham={name}; MoTa=Mo ta co ban runtime test; ChiTietTacPham COUNT=0");
            foreach (var text in new string?[] { null, "", "   " })
                await Send(artist, HttpMethod.Post, ArtistDetail(), new { thongTinBosung = text }, HttpStatusCode.BadRequest);
            Assert.Equal(0, await DetailCount());
            await ReviewArtwork(true);
            await PublicArtwork("Mo ta co ban runtime test");
            await PublicDetail(HttpStatusCode.NotFound);
            output.WriteLine("PASS CASE A: approved artwork + description visible; detail absent");

            var detailPayload = new { cauChuyenSangTac = "Noi dung nghe thuat rieng" };
            // Concurrent submissions exercise both the SQL unique guard and API error handling.
            var submissions = await Task.WhenAll(artist.PostAsJsonAsync(ArtistDetail(), detailPayload),
                artist.PostAsJsonAsync(ArtistDetail(), detailPayload));
            Assert.Equal(new[] { HttpStatusCode.OK, HttpStatusCode.BadRequest }, submissions.Select(r => r.StatusCode).OrderBy(s => (int)s).ToArray());
            foreach (var response in submissions) response.Dispose();
            Assert.Equal(1, await DetailCount());
            Assert.Equal("Mo ta co ban runtime test", await Description());
            var privateDetail = await Send(artist, HttpMethod.Get, ArtistDetail(), null, HttpStatusCode.OK);
            var detailId = privateDetail.GetProperty("maChiTiet").GetInt32();
            Assert.Equal(0, privateDetail.GetProperty("trangThai").GetInt32());
            await Send(admin, HttpMethod.Get, $"admin/chi-tiet-tac-pham/{id}", null, HttpStatusCode.OK);
            await Send(other, HttpMethod.Get, ArtistDetail(), null, HttpStatusCode.Forbidden);
            await Send(other, HttpMethod.Post, ArtistDetail(), detailPayload, HttpStatusCode.Forbidden);
            await Send(other, HttpMethod.Put, ArtistDetail(), detailPayload, HttpStatusCode.Forbidden);
            await Send(publicClient, HttpMethod.Get, ArtistDetail(), null, HttpStatusCode.Unauthorized);
            await Send(artist, HttpMethod.Get, $"admin/chi-tiet-tac-pham/{id}", null, HttpStatusCode.Forbidden);
            await PublicArtwork("Mo ta co ban runtime test");
            await PublicDetail(HttpStatusCode.NotFound);
            output.WriteLine($"PASS CASE B + ownership + double submit: MaChiTiet={detailId}; COUNT=1; Pending private=200, public=404, other artist=403");

            await ReviewDetail(true);
            var published = await PublicDetail(HttpStatusCode.OK);
            Assert.Equal("Noi dung nghe thuat rieng", published.GetProperty("cauChuyenSangTac").GetString());
            await PublicArtwork("Mo ta co ban runtime test");
            output.WriteLine("PASS CASE C: both approved, public description + separate detail visible");
            var detailBefore = await Snapshot("ChiTietTacPham", -id);
            await Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{id}/update", new
            {
                tenTacPham = name, maDanhMuc = 1, gia = 100000, soLuong = 1, moTa = "Mo ta moi"
            }, HttpStatusCode.OK);
            Assert.Equal("Mo ta co ban runtime test", await Description()); // Existing basic-edit moderation rule.
            Assert.Equal(detailBefore, await Snapshot("ChiTietTacPham", -id));
            await ReviewArtwork(true);
            Assert.Equal("Mo ta moi", await Description());
            Assert.Equal(detailBefore, await Snapshot("ChiTietTacPham", -id));
            output.WriteLine("PASS UPDATE DESCRIPTION: basic edit approved; detail full-row snapshot unchanged 100%");

            await Send(artist, HttpMethod.Put, ArtistDetail(), new { cauChuyenSangTac = "Cau chuyen moi" }, HttpStatusCode.OK);
            Assert.Equal("Mo ta moi", await Description());
            Assert.Equal(0, (await Send(artist, HttpMethod.Get, ArtistDetail(), null, HttpStatusCode.OK)).GetProperty("trangThai").GetInt32());
            await PublicDetail(HttpStatusCode.NotFound);
            await ReviewDetail(false);
            Assert.Equal(2, (await Send(artist, HttpMethod.Get, ArtistDetail(), null, HttpStatusCode.OK)).GetProperty("trangThai").GetInt32());
            await PublicArtwork("Mo ta moi");
            await PublicDetail(HttpStatusCode.NotFound);
            output.WriteLine("PASS CASE D + inverse update: detail rejected, artwork remains public; MoTa unchanged; old approved detail disappears while Pending");

            await Send(artist, HttpMethod.Put, ArtistDetail(), new { cauChuyenSangTac = "Cau chuyen moi" }, HttpStatusCode.OK);
            await ReviewDetail(true);
            await Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/hide", new { }, HttpStatusCode.OK);
            await Send(publicClient, HttpMethod.Get, $"tranh/{id}", null, HttpStatusCode.NotFound);
            await PublicDetail(HttpStatusCode.NotFound);
            await Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/show", new { }, HttpStatusCode.OK);
            await ReviewArtwork(false);
            await Send(publicClient, HttpMethod.Get, $"tranh/{id}", null, HttpStatusCode.NotFound);
            await PublicDetail(HttpStatusCode.NotFound);
            output.WriteLine("PASS CASE E: hidden/rejected artwork cannot publish even with approved detail");
            Assert.Equal(originalArtworks, await Snapshot("TacPham", id));
            Assert.Equal(originalDetails, await Snapshot("ChiTietTacPham", id));
            output.WriteLine("PASS HISTORICAL DATA: all pre-existing artwork/detail rows unchanged");
        }
        finally
        {
            // The API-returned ID plus random exact name and owner are all required.
            // Any unrelated FK reference makes DELETE fail/rollback, not cascade.
            if (id > 0)
            {
                await using var cleanup = new SqlCommand(@"
                    SET XACT_ABORT ON; BEGIN TRANSACTION;
                    IF NOT EXISTS (SELECT 1 FROM TacPham WITH (UPDLOCK,HOLDLOCK)
                        WHERE MaTacPham=@Id AND TenTacPham=@Name AND MaHoaSi=@Artist)
                        THROW 51000, 'Fixture identity changed; refuse cleanup.', 1;
                    DELETE FROM ThongBao WHERE LoaiDoiTuong IN ('TacPham','ChiTietTacPham') AND MaDoiTuong=@Id;
                    DELETE FROM TacPhamChinhSua WHERE MaTacPham=@Id;
                    DELETE FROM ChiTietTacPham WHERE MaTacPham=@Id;
                    DELETE FROM TacPham WHERE MaTacPham=@Id AND TenTacPham=@Name AND MaHoaSi=@Artist;
                    COMMIT;", db);
                cleanup.Parameters.AddWithValue("@Id", id);
                cleanup.Parameters.AddWithValue("@Name", name);
                cleanup.Parameters.AddWithValue("@Artist", artistId);
                await cleanup.ExecuteNonQueryAsync();
                Assert.Equal(0, await ScalarInt($"SELECT COUNT(*) FROM TacPham WHERE MaTacPham={id}"));
                Assert.Equal(originalArtworks, await Snapshot("TacPham", 0));
                Assert.Equal(originalDetails, await Snapshot("ChiTietTacPham", 0));
                output.WriteLine($"PASS CLEANUP: removed ONLY fixture MaTacPham={id}, its detail/edit/notifications; historical rows unchanged");
            }
        }

        string ArtistDetail() => $"hoa-si/tac-pham/{id}/chi-tiet";
        Task<int> DetailCount() => ScalarInt($"SELECT COUNT(*) FROM ChiTietTacPham WHERE MaTacPham={id}");
        Task<string> Description() => ScalarText($"SELECT MoTa FROM TacPham WHERE MaTacPham={id}");
        async Task PublicArtwork(string expectedDescription) => Assert.Equal(expectedDescription,
            (await Send(publicClient, HttpMethod.Get, $"tranh/{id}", null, HttpStatusCode.OK)).GetProperty("moTa").GetString());
        Task<JsonElement> PublicDetail(HttpStatusCode status) => Send(publicClient, HttpMethod.Get, $"public/tac-pham/{id}/chi-tiet", null, status);
        Task<JsonElement> ReviewArtwork(bool approve) => Send(admin, HttpMethod.Put, $"admin/tac-pham/{id}/update/duyet",
            new { pheDuyet = approve, lyDo = approve ? null : "Runtime fixture rejection" }, HttpStatusCode.OK);
        Task<JsonElement> ReviewDetail(bool approve) => Send(admin, HttpMethod.Put, $"admin/chi-tiet-tac-pham/{id}/duyet",
            new { pheDuyet = approve, lyDoTuChoi = approve ? null : "Runtime fixture rejection" }, HttpStatusCode.OK);
        async Task<int> ScalarInt(string sql) { await using var cmd = new SqlCommand(sql, db); return Convert.ToInt32(await cmd.ExecuteScalarAsync()); }
        async Task<string> ScalarText(string sql) { await using var cmd = new SqlCommand(sql, db); return Convert.ToString(await cmd.ExecuteScalarAsync())!; }
        // Negative id selects ONLY that fixture; positive id excludes it.
        Task<string> Snapshot(string table, int exclude) => ScalarText($"SELECT (SELECT * FROM {table} WHERE MaTacPham{(exclude < 0 ? "=" : "<>")}{Math.Abs(exclude)} ORDER BY MaTacPham FOR JSON PATH, INCLUDE_NULL_VALUES)");
        HttpClient Client(string role, int account, int? artistKey)
        {
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, account.ToString()), new(ClaimTypes.Role, role),
                new("VaiTro", role == "Admin" ? "0" : "2") };
            if (artistKey.HasValue) claims.Add(new Claim("MaHoaSi", artistKey.Value.ToString()));
            var token = new JwtSecurityToken(config["Jwt:Issuer"] ?? "DoAn2_BackEnd", config["Jwt:Audience"] ?? "DoAn2_FrontEnd", claims,
                expires: DateTime.UtcNow.AddMinutes(10), signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
            var client = new HttpClient { BaseAddress = baseUri };
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
            return client;
        }
    }

    private static async Task<JsonElement> Send(HttpClient client, HttpMethod method, string route, object? payload, HttpStatusCode expected)
    {
        using var request = new HttpRequestMessage(method, route);
        if (payload != null) request.Content = JsonContent.Create(payload);
        using var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expected, $"{method} {route}: expected {(int)expected}, actual {(int)response.StatusCode}; {body}");
        return string.IsNullOrWhiteSpace(body) ? default : JsonDocument.Parse(body).RootElement.Clone();
    }
}
