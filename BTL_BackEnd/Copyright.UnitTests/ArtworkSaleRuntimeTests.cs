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
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Xunit;
using Xunit.Abstractions;

public class SaleRuntimeFactAttribute : FactAttribute
{
    public SaleRuntimeFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("SALE_RUNTIME_TESTS") != "1") Skip = "Opt-in local SQL/HTTP fixture.";
    }
}

namespace Copyright.UnitTests
{
[Collection("Local SQL workflow")]
public class ArtworkSaleRuntimeTests(ITestOutputHelper output)
{
    [SaleRuntimeFact]
    public async Task RightsAreRequiredAtSubmitCartAndOrderWithoutChangingHistoricalData()
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
        var adminId = await Int("SELECT TOP 1 MaTaiKhoan FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1 ORDER BY MaTaiKhoan");
        var category = await Int("SELECT MIN(MaDanhMuc) FROM DanhMuc");
        var name = "TEST_SALE_" + Guid.NewGuid().ToString("N");
        var accountName = "SALE_" + Guid.NewGuid().ToString("N");
        var tables = new[] { "TacPham", "BanQuyen", "GioHang", "ChiTietGioHang", "DonHang", "ChiTietDonHang", "ThanhToan", "ThongBao", "NguoiDung", "TaiKhoan", "LichSuSoHuu", "ChungNhan" };
        var originals = new Dictionary<string, string>();
        foreach (var table in tables) originals[table] = await Snapshot(table);
        var artworkId = 0; var rightsId = 0; var customerId = 0; var accountId = 0;
        using var artist = Client("HoaSi", ownerId, "MaHoaSi", artistId);
        using var admin = Client("Admin", adminId, null, 0);
        using var publicClient = new HttpClient { BaseAddress = url };
        var copyrights = new CopyrightRepository(config);
        try
        {
            using (var insert = new SqlCommand(@"INSERT INTO TaiKhoan(TenDangNhap,MatKhau,VaiTro,TrangThai)
                OUTPUT INSERTED.MaTaiKhoan VALUES(@Name,N'Fixture cannot log in',1,1);", db))
            {
                insert.Parameters.AddWithValue("@Name", accountName);
                accountId = Convert.ToInt32(await insert.ExecuteScalarAsync());
            }
            using (var insert = new SqlCommand("INSERT INTO NguoiDung(MaTaiKhoan,Ten) OUTPUT INSERTED.MaNguoiDung VALUES(@Account,@Name);", db))
            {
                insert.Parameters.AddWithValue("@Account", accountId); insert.Parameters.AddWithValue("@Name", name);
                customerId = Convert.ToInt32(await insert.ExecuteScalarAsync());
            }
            using var customer = Client("NguoiDung", accountId, "MaNguoiDung", customerId);
            await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", new {
                tenTacPham = name, gia = 100000, soLuong = 3, laTacPhamDocBan = false, loaiTacPham = 0,
            }, HttpStatusCode.BadRequest);
            Assert.Equal(0, await Int($"SELECT COUNT(*) FROM TacPham WHERE TenTacPham='{name}'"));
            artworkId = (await Send(artist, HttpMethod.Post, "hoa-si/tac-pham/create", new {
                tenTacPham = name, maDanhMuc = category, gia = 100000, soLuong = 3, laTacPhamDocBan = false,
                loaiTacPham = 0, canCuSuDung = 1, xacNhanQuyenSuDung = true, khaiBaoNguonGoc = "Fixture: tác giả tự sáng tác",
            })).GetProperty("maTacPham").GetInt32();
            rightsId = await Int($"SELECT MaBanQuyen FROM BanQuyen WHERE MaTacPham={artworkId}");
            Assert.Equal(0, await Int($"SELECT TrangThai FROM BanQuyen WHERE MaBanQuyen={rightsId}"));
            await Send(publicClient, HttpMethod.Get, $"tranh/{artworkId}", null, HttpStatusCode.NotFound);
            await Approve();
            await Public(false, "RIGHTS_PENDING");
            await Add(HttpStatusCode.Conflict);
            Assert.Equal(0, await Int($"SELECT COUNT(*) FROM ChiTietGioHang c JOIN GioHang g ON g.MaGioHang=c.MaGioHang WHERE g.MaNguoiDung={customerId}"));

            // Safely simulate an older approved artwork with no rights: only this fixture.
            await Exec($"DELETE FROM ThongBao WHERE LoaiDoiTuong='BanQuyen' AND MaDoiTuong={rightsId}; DELETE FROM BanQuyen WHERE MaBanQuyen={rightsId} AND MaTacPham={artworkId};");
            await Public(false, "RIGHTS_NOT_DECLARED");
            await Add(HttpStatusCode.Conflict);
            await Exec($"UPDATE TacPham SET TrangThai=3 WHERE MaTacPham={artworkId} AND TenTacPham='{name}';");
            await Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{artworkId}/gui-duyet-lai", null, HttpStatusCode.BadRequest);
            Assert.Equal(3, await Int($"SELECT TrangThai FROM TacPham WHERE MaTacPham={artworkId}"));
            rightsId = (await Send(artist, HttpMethod.Post, "ban-quyen", new {
                maTacPham = artworkId, tacGia = "Fixture artist", nguonGoc = "Fixture source", canCuSuDung = 1,
                loaiTacPham = 0, laTacPhamDocBan = false,
            })).GetProperty("maBanQuyen").GetInt32();
            await Send(artist, HttpMethod.Put, $"hoa-si/tac-pham/{artworkId}/gui-duyet-lai", null);
            await Approve();
            await Send(admin, HttpMethod.Post, $"ban-quyen/admin/{rightsId}/yeu-cau-bo-sung", new { ghiChu = "Fixture cần hai bằng chứng" });
            await Public(false, "RIGHTS_NEED_INFO"); await Add(HttpStatusCode.Conflict);
            await Send(artist, HttpMethod.Put, $"ban-quyen/{rightsId}", new { tacGia = "Fixture artist", nguonGoc = "Fixture source", canCuSuDung = 1, loaiTacPham = 0 });
            for (var index = 1; index <= 2; index++) await copyrights.AddEvidence(rightsId, artistId, ownerId,
                new CopyrightEvidenceFile($"fixture{index}.png", $"fixture{index}.png", $"fixture{index}.png", "image/png", 100, new string('a', 64), "Metadata only; no disk file"));

            await Exec($"UPDATE TacPham SET TrangThai=0 WHERE MaTacPham={artworkId} AND TenTacPham='{name}';");
            await Send(admin, HttpMethod.Post, $"ban-quyen/admin/{rightsId}/xac-minh", new { ghiChu = "Fixture review" });
            Assert.Equal(0, await Int($"SELECT COUNT(*) FROM ThongBao WHERE Loai='COPYRIGHT_VERIFIED' AND MaDoiTuong={rightsId} AND NoiDung LIKE N'%và đủ điều kiện mở bán%'"));
            Assert.Equal(0, await Int($"SELECT COUNT(*) FROM ChungNhan WHERE MaTacPham={artworkId}"));
            await Approve();
            await Public(true, "AVAILABLE");

            await Exec($"UPDATE BanQuyen SET BiChanBan=1 WHERE MaBanQuyen={rightsId} AND MaTacPham={artworkId};");
            await Public(false, "BLOCKED_FROM_SALE"); await Add(HttpStatusCode.Conflict);
            await Exec($"UPDATE BanQuyen SET BiChanBan=0 WHERE MaBanQuyen={rightsId} AND MaTacPham={artworkId}; UPDATE TacPham SET SoLuong=0 WHERE MaTacPham={artworkId} AND TenTacPham='{name}';");
            await Public(false, "OUT_OF_STOCK"); await Add(HttpStatusCode.Conflict);
            await Exec($"UPDATE TacPham SET SoLuong=3,TrangThai=3 WHERE MaTacPham={artworkId} AND TenTacPham='{name}';");
            await Send(publicClient, HttpMethod.Get, $"tranh/{artworkId}", null, HttpStatusCode.NotFound);
            await Add(HttpStatusCode.Conflict);
            await Exec($"UPDATE TacPham SET TrangThai=1 WHERE MaTacPham={artworkId} AND TenTacPham='{name}';");
            await Public(true, "AVAILABLE");
            var order = await Send(customer, HttpMethod.Post, "don-hang/tao", Order("BUY_NOW"));
            Assert.True(order.GetProperty("maDonHang").GetInt32() > 0);
            Assert.Equal(2, await Int($"SELECT SoLuong FROM TacPham WHERE MaTacPham={artworkId}"));
            await Add(HttpStatusCode.OK);
            var cart = await Send(customer, HttpMethod.Get, "gio-hang", null);
            var line = cart.GetProperty("danhSachSanPham")[0];
            Assert.True(line.GetProperty("canCheckout").GetBoolean());
            var lineId = line.GetProperty("maChiTietGH").GetInt32();
            await Send(admin, HttpMethod.Post, $"ban-quyen/admin/{rightsId}/thu-hoi-xac-minh", new { lyDo = "Fixture revoke after checkout page load", tamAnTacPham = false });
            await Public(false, "RIGHTS_REVOKED"); await Add(HttpStatusCode.Conflict);
            cart = await Send(customer, HttpMethod.Get, "gio-hang", null);
            Assert.False(cart.GetProperty("danhSachSanPham")[0].GetProperty("canCheckout").GetBoolean());
            Assert.Equal(0, cart.GetProperty("tongTien").GetDecimal());
            await Send(customer, HttpMethod.Put, $"gio-hang/cap-nhat/{lineId}", new { soLuong = 1 }, HttpStatusCode.Conflict);
            await Send(customer, HttpMethod.Post, "don-hang/tao", Order("CART", lineId), HttpStatusCode.Conflict);
            await Send(customer, HttpMethod.Post, "don-hang/tao", Order("BUY_NOW"), HttpStatusCode.Conflict);
            Assert.Equal(1, await Int($"SELECT COUNT(*) FROM DonHang WHERE MaNguoiDung={customerId}"));
            Assert.Equal(0, await Int($"SELECT TrangThai FROM DonHang WHERE MaNguoiDung={customerId}"));
            Assert.Equal(2, await Int($"SELECT SoLuong FROM TacPham WHERE MaTacPham={artworkId}"));
            Assert.Equal(1, await Int($"SELECT COUNT(*) FROM ChiTietGioHang c JOIN GioHang g ON g.MaGioHang=c.MaGioHang WHERE g.MaNguoiDung={customerId}"));
            output.WriteLine("PASS runtime: submit validation; approved rights missing/pending/need-info; verified sale; blocked/stock/rejected; revoke rejects stale cart/update/CART/BUY_NOW without touching previous order.");

            object Order(string mode, int lineId = 0) => new { tenNguoiNhan = "Fixture buyer", soDienThoai = "0901234567", diaChiGiao = "Fixture address", phuongThucThanhToan = "COD", mode, maTacPham = artworkId, soLuong = 1, cartItemIds = mode == "CART" ? new[] { lineId } : null };
            Task<JsonElement> Add(HttpStatusCode expected) => Send(customer, HttpMethod.Post, "gio-hang/them", new { maTacPham = artworkId, soLuong = 1 }, expected);
        }
        finally
        {
            // Never delete audit rows or disable immutable audit triggers.
            using var cleanup = new SqlCommand(@"
                SET XACT_ABORT ON; SET QUOTED_IDENTIFIER ON; BEGIN TRAN;
                IF @Artwork>0 AND EXISTS(SELECT 1 FROM TacPham WHERE MaTacPham=@Artwork AND TenTacPham=@Name AND MaHoaSi=@Artist)
                BEGIN
                    DELETE FROM ThongBao WHERE (LoaiDoiTuong IN ('TacPham','ChiTietTacPham') AND MaDoiTuong=@Artwork)
                        OR (LoaiDoiTuong='BanQuyen' AND MaDoiTuong IN(SELECT MaBanQuyen FROM BanQuyen WHERE MaTacPham=@Artwork));
                    DELETE FROM BangChungBanQuyen WHERE MaBanQuyen IN(SELECT MaBanQuyen FROM BanQuyen WHERE MaTacPham=@Artwork);
                    DELETE FROM BanQuyen WHERE MaTacPham=@Artwork;
                    DELETE FROM TacPhamChinhSua WHERE MaTacPham=@Artwork;
                    DELETE FROM ChiTietTacPham WHERE MaTacPham=@Artwork;
                END;
                IF @Customer>0 AND EXISTS(SELECT 1 FROM NguoiDung WHERE MaNguoiDung=@Customer AND Ten=@Name AND MaTaiKhoan=@Account)
                BEGIN
                    DELETE FROM ThanhToan WHERE MaDonHang IN(SELECT MaDonHang FROM DonHang WHERE MaNguoiDung=@Customer);
                    DELETE FROM ChiTietDonHang WHERE MaDonHang IN(SELECT MaDonHang FROM DonHang WHERE MaNguoiDung=@Customer);
                    DELETE FROM DonHang WHERE MaNguoiDung=@Customer;
                    DELETE FROM ChiTietGioHang WHERE MaGioHang IN(SELECT MaGioHang FROM GioHang WHERE MaNguoiDung=@Customer);
                    DELETE FROM GioHang WHERE MaNguoiDung=@Customer;
                    DELETE FROM NguoiDung WHERE MaNguoiDung=@Customer AND Ten=@Name;
                END;
                DELETE FROM TacPham WHERE MaTacPham=@Artwork AND TenTacPham=@Name AND MaHoaSi=@Artist;
                DELETE FROM TaiKhoan WHERE MaTaiKhoan=@Account AND TenDangNhap=@AccountName;
                COMMIT;", db);
            cleanup.Parameters.AddWithValue("@Artwork", artworkId); cleanup.Parameters.AddWithValue("@Artist", artistId);
            cleanup.Parameters.AddWithValue("@Customer", customerId); cleanup.Parameters.AddWithValue("@Account", accountId);
            cleanup.Parameters.AddWithValue("@Name", name); cleanup.Parameters.AddWithValue("@AccountName", accountName);
            await cleanup.ExecuteNonQueryAsync();
            foreach (var table in tables) Assert.Equal(originals[table], await Snapshot(table));
            output.WriteLine("PASS cleanup: only GUID-scoped artwork/customer/account/cart/order/evidence/inbox fixtures removed; historical tables unchanged. Append-only audit retained.");
        }

        Task<JsonElement> Approve() => Send(admin, HttpMethod.Put, $"admin/tac-pham/{artworkId}/update/duyet", new { pheDuyet = true });
        async Task Public(bool available, string reason) { var value = await Send(publicClient, HttpMethod.Get, $"tranh/{artworkId}", null); Assert.Equal(available, value.GetProperty("canSell").GetBoolean()); Assert.Equal(reason, value.GetProperty("saleReason").GetString()); }
        async Task<int> Int(string sql) { using var cmd = new SqlCommand(sql, db); return Convert.ToInt32(await cmd.ExecuteScalarAsync()); }
        async Task Exec(string sql) { using var cmd = new SqlCommand(sql, db); await cmd.ExecuteNonQueryAsync(); }
        async Task<string> Snapshot(string table) { using var cmd = new SqlCommand($"SELECT (SELECT * FROM [{table}] ORDER BY 1 FOR JSON PATH,INCLUDE_NULL_VALUES)", db); return Convert.ToString(await cmd.ExecuteScalarAsync())!; }
        HttpClient Client(string role, int account, string? key, int id)
        {
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, account.ToString()), new(ClaimTypes.Role, role), new("VaiTro", role == "Admin" ? "0" : role == "HoaSi" ? "2" : "1") };
            if (key != null) claims.Add(new(key, id.ToString()));
            var token = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
            var client = new HttpClient { BaseAddress = url };
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token)); return client;
        }
    }

    private static async Task<JsonElement> Send(HttpClient client, HttpMethod method, string path, object? body, HttpStatusCode expected = HttpStatusCode.OK)
    {
        using var request = new HttpRequestMessage(method, path);
        if (body != null) request.Content = JsonContent.Create(body);
        using var response = await client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expected, $"{method} {path}: expected {expected}, got {response.StatusCode}: {text}");
        return string.IsNullOrWhiteSpace(text) ? default : JsonDocument.Parse(text).RootElement.Clone();
    }
}
}
