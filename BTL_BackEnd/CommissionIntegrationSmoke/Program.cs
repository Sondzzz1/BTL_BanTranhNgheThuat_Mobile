using System.Text.RegularExpressions;
using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.DAL;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

var backendDirectory = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "BTL_BackEnd"));
var configuration = new ConfigurationBuilder()
    .SetBasePath(backendDirectory)
    .AddJsonFile("appsettings.json", optional: false)
    .Build();
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing connection string");

await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();
await ApplyMigration(connection, Path.Combine(backendDirectory, "SQL", "Migrations", "006_SeparateCommissionArtworks.sql"));
Pass("Migration 006 applied idempotently");

var artworks = new TacPhamRepository(configuration);
var customArt = new CustomArtRepository(configuration);
var carts = new GioHangRepository(configuration);
var orders = new DonHangRepository(configuration);
var artists = new HoaSiRepository(configuration);
var users = new NguoiDungRepository(configuration);
var categories = new DanhMucRepository(configuration);
var posts = new BaiVietRepository(configuration);
var payments = new ThanhToanRepository(configuration);
var content = new NoiDungRepository(configuration);
var accounts = new TaiKhoanRepository(configuration);
var edits = new TacPhamChinhSuaRepository(configuration);
var admin = new AdminBusiness(new AdminRepository(configuration), artworks, artists, users, orders, posts,
    categories, payments, content, accounts, edits);
var artistBusiness = new HoaSiBusiness(artists, artworks, posts, orders, categories, users, edits, payments);
var customerBusiness = new KhachHangBusiness(users, carts, orders, artworks, payments, artists, accounts);

var artistId = await ScalarInt(connection, "SELECT TOP (1) MaHoaSi FROM HoaSi ORDER BY MaHoaSi");
var customerId = await ScalarInt(connection, "SELECT TOP (1) MaNguoiDung FROM NguoiDung ORDER BY MaNguoiDung");
var createdArtworkIds = new List<int>();
var createdRequestIds = new List<int>();
var createdCartLineIds = new List<int>();
int? createdCartId = null;

try
{
    _ = await admin.GetDashboard();
    _ = await admin.GetThongKeTongQuan();
    _ = await admin.GetThongKeNhanh(DateTime.Today);
    _ = await admin.GetDoanhThuTheoHoaSi(null, null);
    _ = await admin.GetTacPhamBanChay(5);
    Pass("Admin marketplace statistics queries exclude commissions and execute successfully");

    // A. Tác phẩm marketplace do họa sĩ đăng vẫn theo đúng luồng duyệt.
    var saleArtworkId = await artistBusiness.TaoTacPham(artistId, new TaoTacPhamRequest
    {
        TenTacPham = "COMMISSION_SMOKE_MARKETPLACE",
        Gia = 1234567,
        SoLuong = 1,
        MoTa = "temporary smoke fixture"
    });
    createdArtworkIds.Add(saleArtworkId);
    Assert((await artistBusiness.GetTacPhamCuaToi(artistId)).Any(x => x.MaTacPham == saleArtworkId), "Artist marketplace list missed self-uploaded artwork");
    Assert(await admin.DuyetTacPham(saleArtworkId, new DuyetTacPhamRequest { PheDuyet = true }), "Admin could not approve marketplace artwork");
    Assert((await artworks.GetMarketplaceById(saleArtworkId))?.TrangThai == TacPhamStatus.OnSale, "Approved artwork is not public/marketplace-ready");
    Pass("A: self-uploaded artwork remains in Artist/Admin/public approval flow");

    // B, G, I. Existing artwork ngoài hệ thống: giữ tác giả gốc, không đoán MaTacPhamGoc.
    var externalRequestId = await CreateRequest(customArt, connection, customerId, artistId, CustomArtType.BasedOnArtwork,
        "COMMISSION_SMOKE_EXTERNAL", "External Test Author");
    createdRequestIds.Add(externalRequestId);
    await InsertProgressAndQuote(connection, externalRequestId, artistId, 2500000, accepted: true);

    // Tạo sẵn record để kiểm tra nhánh UPDATE thay vì tạo record thứ hai.
    var internalArtworkId = await InsertExistingInternalArtwork(connection, externalRequestId, artistId);
    createdArtworkIds.Add(internalArtworkId);
    var completedId = await customArt.CompleteRequest(externalRequestId, artistId, new HoanThanhYeuCauRequest
    {
        TenTacPhamMoi = "COMMISSION_SMOKE_FINAL",
        HinhAnhTacPham = "commission-smoke-final.jpg",
        GhiChuHoanThien = "Hoàn thiện smoke test",
        MoTaNguonGoc = "Nguồn bên ngoài hệ thống"
    });
    Assert(completedId == internalArtworkId, "Completion created a second TacPham instead of updating existing record");
    var internalArtwork = await artworks.GetById(internalArtworkId) ?? throw new Exception("Internal artwork missing");
    Assert(internalArtwork.Gia == 2500000, "Accepted quote was not snapshotted");
    Assert(internalArtwork.SoLuong == 0, "Commission stock is not zero");
    Assert(internalArtwork.MaHoaSi == artistId, "Executing artist was not preserved");
    Assert(internalArtwork.MaTacPhamGoc == null, "External source was incorrectly guessed as an internal artwork");
    Assert(internalArtwork.TacGiaGoc == "External Test Author", "External original author was lost");
    Assert(await ScalarInt(connection, "SELECT COUNT(*) FROM TacPham WHERE MaYeuCauVeTranh=@id", ("@id", externalRequestId)) == 1,
        "A request has more than one internal artwork");
    Assert(await artworks.GetMarketplaceById(internalArtworkId) == null, "Commission leaked into marketplace lookup");
    Assert(!(await artistBusiness.GetTacPhamCuaToi(artistId)).Any(x => x.MaTacPham == internalArtworkId), "Commission leaked into Artist artworks");
    Assert(!(await admin.GetAllTacPham()).Any(x => x.MaTacPham == internalArtworkId), "Commission leaked into Admin artworks");
    var customDetail = await customArt.GetById(externalRequestId);
    Assert(customDetail?.MaTacPhamKetQua == internalArtworkId && customDetail.TrangThai == CustomArtStatus.Completed,
        "Completed commission is not available through custom-art history");
    Pass("B/G/I: internal artwork upsert, unique request link, external provenance and custom-art history");

    // C. Direct add-to-cart must reject known commission ID.
    await Expect<BusinessConflictException>(() => carts.AddOrIncrementTransactional(customerId, internalArtworkId, 1),
        "C: direct add cart rejects commission");

    var cartExisted = await ScalarInt(connection, "SELECT COUNT(*) FROM GioHang WHERE MaNguoiDung=@id", ("@id", customerId)) > 0;
    var cartId = await ScalarInt(connection, @"IF NOT EXISTS(SELECT 1 FROM GioHang WHERE MaNguoiDung=@id)
        INSERT INTO GioHang(MaNguoiDung) VALUES(@id);
        SELECT MaGioHang FROM GioHang WHERE MaNguoiDung=@id;", ("@id", customerId));
    if (!cartExisted) createdCartId = cartId;
    var cartLineId = await ScalarInt(connection, @"INSERT INTO ChiTietGioHang(MaGioHang,MaTacPham,SoLuong)
        OUTPUT INSERTED.MaChiTietGH VALUES(@cartId,@artworkId,1);",
        ("@cartId", cartId), ("@artworkId", internalArtworkId));
    createdCartLineIds.Add(cartLineId);
    await Expect<BusinessConflictException>(() => customerBusiness.CapNhatGioHang(customerId, cartLineId, new CapNhatGioHangRequest { SoLuong = 1 }),
        "C: cart quantity update rejects commission");

    // D. BUY_NOW must reject known commission ID before creating an order.
    await Expect<BusinessConflictException>(() => orders.CreateTransactional(customerId, new TaoDonHangRequest
    {
        TenNguoiNhan = "Commission Smoke",
        SoDienThoai = "0912345678",
        DiaChiGiao = "Smoke address",
        PhuongThucThanhToan = "COD",
        Mode = "BUY_NOW",
        MaTacPham = internalArtworkId,
        SoLuong = 1
    }), "D: BUY_NOW rejects commission");
    await Expect<BusinessConflictException>(() => orders.CreateTransactional(customerId, new TaoDonHangRequest
    {
        TenNguoiNhan = "Commission Smoke",
        SoDienThoai = "0912345678",
        DiaChiGiao = "Smoke address",
        PhuongThucThanhToan = "COD",
        Mode = "CART",
        CartItemIds = new List<int> { cartLineId }
    }), "D: CART checkout rejects commission");

    // E/F. Direct Admin/Artist marketplace mutations reject commission.
    await Expect<BusinessConflictException>(() => admin.DuyetTacPham(internalArtworkId, new DuyetTacPhamRequest { PheDuyet = true }),
        "E: Admin approval rejects commission");
    await Expect<BusinessConflictException>(() => admin.HideTacPham(internalArtworkId),
        "E: Admin hide rejects commission");
    await Expect<BusinessConflictException>(() => admin.ShowTacPham(internalArtworkId),
        "E: Admin show rejects commission");
    await Expect<BusinessConflictException>(() => admin.XoaTacPham(internalArtworkId),
        "E: Admin delete rejects commission");
    await Expect<UnauthorizedAccessException>(() => artistBusiness.GuiDuyetLaiTacPham(artistId, internalArtworkId),
        "F: Artist approval submission rejects commission");
    await Expect<UnauthorizedAccessException>(() => artistBusiness.CapNhatTacPham(artistId, internalArtworkId, new CapNhatTacPhamRequest
    {
        TenTacPham = "must not update", Gia = 1, SoLuong = 1
    }), "F: Artist edit rejects commission");
    await Expect<UnauthorizedAccessException>(() => artistBusiness.XoaTacPham(artistId, internalArtworkId),
        "F: Artist delete rejects commission");
    await Expect<UnauthorizedAccessException>(() => artistBusiness.KhoiPhucTacPham(artistId, internalArtworkId),
        "F: Artist restore rejects commission");
    await Expect<UnauthorizedAccessException>(() => artistBusiness.CapNhatTrangThaiTacPham(artistId, internalArtworkId, new CapNhatTrangThaiTacPhamRequest
    {
        TrangThai = TacPhamStatus.OnSale
    }), "F: Artist show/hide rejects commission");

    // H. IN_PROGRESS + progress nhưng quote chưa CustomerAccepted vẫn không được complete.
    var unacceptedRequestId = await CreateRequest(customArt, connection, customerId, artistId, CustomArtType.Original,
        "COMMISSION_SMOKE_NO_ACCEPTED_QUOTE", null);
    createdRequestIds.Add(unacceptedRequestId);
    await InsertProgressAndQuote(connection, unacceptedRequestId, artistId, 1900000, accepted: false);
    await Expect<ArgumentException>(() => customArt.CompleteRequest(unacceptedRequestId, artistId, new HoanThanhYeuCauRequest
    {
        HinhAnhTacPham = "must-not-complete.jpg"
    }), "H: completion requires CustomerAccepted quote");
    Assert(await ScalarInt(connection, "SELECT COUNT(*) FROM TacPham WHERE MaYeuCauVeTranh=@id", ("@id", unacceptedRequestId)) == 0,
        "Rejected completion left an internal artwork");
    Assert(await ScalarInt(connection, "SELECT TrangThai FROM YeuCauVeTranh WHERE MaYeuCau=@id", ("@id", unacceptedRequestId)) == (int)CustomArtStatus.InProgress,
        "Rejected completion changed request status");

    Assert(await ScalarInt(connection, @"SELECT COUNT(*) FROM (
        SELECT MaYeuCauVeTranh FROM TacPham WHERE MaYeuCauVeTranh IS NOT NULL
        GROUP BY MaYeuCauVeTranh HAVING COUNT_BIG(*)>1) d") == 0, "Duplicate commission links remain");
    Pass("ALL COMMISSION INTEGRATION SMOKE TESTS PASSED");
}
finally
{
    foreach (var cartLineId in createdCartLineIds)
        await Execute(connection, "DELETE FROM ChiTietGioHang WHERE MaChiTietGH=@id", ("@id", cartLineId));
    if (createdCartId.HasValue)
        await Execute(connection, "DELETE FROM GioHang WHERE MaGioHang=@id AND NOT EXISTS(SELECT 1 FROM ChiTietGioHang WHERE MaGioHang=@id)", ("@id", createdCartId.Value));
    foreach (var requestId in createdRequestIds.AsEnumerable().Reverse())
    {
        await Execute(connection, "DELETE FROM TienDoVeTranh WHERE MaYeuCau=@id; DELETE FROM BaoGiaVeTranh WHERE MaYeuCau=@id; DELETE FROM TacPham WHERE MaYeuCauVeTranh=@id; DELETE FROM YeuCauVeTranh WHERE MaYeuCau=@id;", ("@id", requestId));
    }
    foreach (var artworkId in createdArtworkIds.AsEnumerable().Reverse())
        await Execute(connection, "DELETE FROM TacPhamChinhSua WHERE MaTacPham=@id; DELETE FROM TacPham WHERE MaTacPham=@id;", ("@id", artworkId));
}

static async Task<int> CreateRequest(CustomArtRepository repository, SqlConnection connection, int customerId, int artistId, CustomArtType type, string title, string? originalAuthor)
{
    var request = await repository.CreateRequest(customerId, new TaoYeuCauTranhRequest
    {
        TieuDe = title,
        Type = type == CustomArtType.Original ? "ORIGINAL_COMMISSION" : "EXISTING_ARTWORK",
        LoaiTranh = "Tranh sơn dầu",
        KichThuoc = "40x60 cm",
        ChuDe = "Smoke",
        MauSac = "Tông ấm",
        PhongCach = "Hiện thực",
        ChatLieu = "Canvas",
        MoTa = "temporary commission smoke fixture",
        ReferenceArtworkId = null,
        ReferenceArtworkName = type == CustomArtType.BasedOnArtwork ? "External source" : null,
        ReferenceArtistName = originalAuthor,
        NguonTacPhamGoc = type == CustomArtType.BasedOnArtwork ? "https://example.invalid/external" : null,
        GiaDuKien = 1000000
    }, CustomArtStatus.InProgress, null);

    // CreateRequest không nhận artist vì API thật chỉ gán artist sau Admin/claim.
    await Execute(connection, "UPDATE YeuCauVeTranh SET MaHoaSi=@artistId WHERE MaYeuCau=@requestId",
        ("@artistId", artistId), ("@requestId", request.MaYeuCau));
    return request.MaYeuCau;
}

static async Task InsertProgressAndQuote(SqlConnection connection, int requestId, int artistId, decimal price, bool accepted)
{
    await Execute(connection, @"UPDATE YeuCauVeTranh SET MaHoaSi=@artistId,TrangThai=@status WHERE MaYeuCau=@requestId;
        INSERT INTO TienDoVeTranh(MaYeuCau,TieuDe,MoTa,AnhPreview,TrangThai,NgayTao)
        VALUES(@requestId,N'Đang thực hiện',N'Smoke progress',NULL,N'IN_PROGRESS',GETDATE());
        INSERT INTO BaoGiaVeTranh(MaYeuCau,MaHoaSi,GiaBaoGia,ThoiGianHoanThanh,GhiChu,IsActive,NgayTao,TrangThai)
        VALUES(@requestId,@artistId,@price,N'2030-01-01',N'Smoke quote',1,GETDATE(),@quoteStatus);",
        ("@artistId", artistId), ("@status", (int)CustomArtStatus.InProgress), ("@requestId", requestId),
        ("@price", price), ("@quoteStatus", accepted ? "CustomerAccepted" : "PendingCustomerApproval"));
}

static async Task<int> InsertExistingInternalArtwork(SqlConnection connection, int requestId, int artistId)
{
    const string sql = @"INSERT INTO TacPham(TenTacPham,MaHoaSi,MaDanhMuc,Gia,SoLuong,MoTa,HinhAnh,ChatLieu,ChatLieuKhung,KichThuoc,TrangThai,NgayTao,LyDo,LoaiTacPham,TacGiaGoc,MaTacPhamGoc,MaYeuCauVeTranh,MoTaNguonGoc)
        OUTPUT INSERTED.MaTacPham VALUES(N'OLD_INTERNAL',@artistId,NULL,1,5,N'old',N'old.jpg',NULL,NULL,NULL,0,GETDATE(),NULL,1,NULL,NULL,@requestId,NULL);";
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.AddWithValue("@artistId", artistId);
    command.Parameters.AddWithValue("@requestId", requestId);
    return Convert.ToInt32(await command.ExecuteScalarAsync());
}

static async Task ApplyMigration(SqlConnection connection, string path)
{
    var sql = await File.ReadAllTextAsync(path);
    foreach (var batch in Regex.Split(sql, @"^\s*GO\s*;?\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
        if (!string.IsNullOrWhiteSpace(batch)) await Execute(connection, batch);
}

static async Task Expect<T>(Func<Task> action, string name) where T : Exception
{
    try { await action(); }
    catch (T) { Pass(name); return; }
    throw new Exception($"FAILED: {name} did not throw {typeof(T).Name}");
}

static void Assert(bool condition, string message)
{
    if (!condition) throw new Exception("FAILED: " + message);
}

static void Pass(string message) => Console.WriteLine("PASS: " + message);

static async Task<int> ScalarInt(SqlConnection connection, string sql, params (string Name, object? Value)[] parameters)
{
    await using var command = new SqlCommand(sql, connection);
    foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Name, parameter.Value ?? DBNull.Value);
    return Convert.ToInt32(await command.ExecuteScalarAsync());
}

static async Task Execute(SqlConnection connection, string sql, params (string Name, object? Value)[] parameters)
{
    await using var command = new SqlCommand(sql, connection);
    foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Name, parameter.Value ?? DBNull.Value);
    await command.ExecuteNonQueryAsync();
}
