using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.DAL;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

var backendDirectory = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "BTL_BackEnd"));
var configuration = new ConfigurationBuilder()
    .SetBasePath(backendDirectory)
    .AddJsonFile("appsettings.json", optional: false)
    .Build();
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing test connection string");

var orders = new DonHangRepository(configuration);
var carts = new GioHangRepository(configuration);
var artworks = new TacPhamRepository(configuration);
var reviews = new DanhGiaRepository(configuration);
var reviewBusiness = new DanhGiaBusiness(reviews, artworks);
var createdOrderIds = new List<int>();

await using var setupConnection = new SqlConnection(connectionString);
await setupConnection.OpenAsync();
var fixture = await ReadFixture(setupConnection);
var originalCart = await ReadCartState(setupConnection, fixture.UserId, fixture.ArtworkId);

try
{
    await Execute(setupConnection,
        "UPDATE TacPham SET SoLuong=5,TrangThai=1 WHERE MaTacPham=@id",
        ("@id", fixture.ArtworkId));

    // Cùng thêm một tác phẩm: chỉ một dòng, số lượng tăng đúng hai.
    var addResults = await Task.WhenAll(
        Task.Run(() => carts.AddOrIncrementTransactional(fixture.UserId, fixture.ArtworkId, 1)),
        Task.Run(() => carts.AddOrIncrementTransactional(fixture.UserId, fixture.ArtworkId, 1)));
    Assert(addResults.All(x => x), "Cart concurrent add did not fully succeed");
    var cartState = await ReadCartState(setupConnection, fixture.UserId, fixture.ArtworkId);
    Assert(cartState.LineCount == 1, "Cart contains duplicate lines");
    Assert(cartState.Quantity == originalCart.Quantity + 2, "Cart quantity was not incremented exactly twice");
    Pass("Cart duplicate concurrency: one line and exact quantity");

    await Execute(setupConnection,
        "UPDATE TacPham SET SoLuong=1,TrangThai=1 WHERE MaTacPham=@id",
        ("@id", fixture.ArtworkId));

    // Hai checkout cùng tranh stock=1: đúng một đơn commit, đơn còn lại rollback.
    var checkoutTasks = new[]
    {
        TryCreateOrder(orders, fixture.UserId, fixture.ArtworkId),
        TryCreateOrder(orders, fixture.UserId, fixture.ArtworkId)
    };
    var checkoutResults = await Task.WhenAll(checkoutTasks);
    var successfulOrders = checkoutResults.Where(x => x.OrderId.HasValue).Select(x => x.OrderId!.Value).ToList();
    createdOrderIds.AddRange(successfulOrders);
    Assert(successfulOrders.Count == 1, "Oversell test did not produce exactly one successful order");
    Assert(checkoutResults.Count(x => x.Error is BusinessConflictException) == 1, "Losing checkout did not return a stock conflict");
    Assert(await ScalarInt(setupConnection, "SELECT SoLuong FROM TacPham WHERE MaTacPham=@id", ("@id", fixture.ArtworkId)) == 0,
        "Stock became invalid after concurrent checkout");
    Assert(await ScalarInt(setupConnection, "SELECT COUNT(*) FROM DonHang WHERE MaDonHang IN (" + string.Join(',', successfulOrders) + ")") == 1,
        "Unexpected committed order count");
    Pass("Oversell concurrency: stock=1 produces one order, one conflict, stock=0");

    // Hủy đồng thời: conditional status update chỉ cho hoàn kho đúng một lần.
    var orderToCancel = successfulOrders.Single();
    var cancelResults = await Task.WhenAll(
        TryCancel(orders, orderToCancel, fixture.AdminAccountId),
        TryCancel(orders, orderToCancel, fixture.AdminAccountId));
    Assert(cancelResults.Count(x => x.Success) == 1, "Double cancel did not have exactly one winner");
    Assert(cancelResults.Count(x => x.Error is BusinessConflictException) == 1, "Repeated cancel did not return conflict");
    Assert(await ScalarInt(setupConnection, "SELECT SoLuong FROM TacPham WHERE MaTacPham=@id", ("@id", fixture.ArtworkId)) == 1,
        "Stock was restored more or less than once");
    Pass("Double cancel: stock restored exactly once");

    // Tạo một đơn đã giao để test toàn bộ policy review.
    await Execute(setupConnection,
        "UPDATE TacPham SET SoLuong=5,TrangThai=1 WHERE MaTacPham=@id",
        ("@id", fixture.ArtworkId));
    var deliveredOrderId = await orders.CreateTransactional(fixture.UserId, NewBuyNow(fixture.ArtworkId));
    createdOrderIds.Add(deliveredOrderId);
    await Expect<UnauthorizedAccessException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 5 }),
        "Order not delivered cannot review");
    Assert(await orders.UpdateStatusTransactional(deliveredOrderId, DonHangStatus.DaXacNhan, null, fixture.AdminAccountId), "Confirm failed");
    Assert(await orders.UpdateStatusTransactional(deliveredOrderId, DonHangStatus.DangGiao, null, fixture.AdminAccountId), "Ship failed");
    Assert(await orders.UpdateStatusTransactional(deliveredOrderId, DonHangStatus.DaGiao, null, fixture.AdminAccountId), "Delivery failed");

    await Expect<UnauthorizedAccessException>(() => reviewBusiness.Create(
        fixture.IneligibleUserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 5 }),
        "Not purchased cannot review");
    await Expect<ArgumentException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 0 }), "Rating 0 rejected");
    await Expect<ArgumentException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 6 }), "Rating 6 rejected");
    await Expect<ArgumentException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 5, BinhLuan = new string('x', 501) }),
        "Comment >500 rejected");

    var review = await reviewBusiness.Create(fixture.UserId,
        new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 5, BinhLuan = "  Tốt  " });
    Assert(review.BinhLuan == "Tốt", "Review comment was not trimmed");
    await Expect<BusinessConflictException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 4 }),
        "Second create returns conflict and does not duplicate");
    await Expect<UnauthorizedAccessException>(() => reviewBusiness.Update(
        fixture.IneligibleUserId, review.MaDanhGia, new CapNhatDanhGiaRequest { DanhGia = 4 }),
        "Other customer cannot edit review");
    var updated = await reviewBusiness.Update(fixture.UserId, review.MaDanhGia,
        new CapNhatDanhGiaRequest { DanhGia = 4, BinhLuan = "Đã sửa" });
    Assert(updated.DanhGia == 4, "Review update failed");

    await Execute(setupConnection,
        "UPDATE ChiTietDonHang SET SoLuongDaHoan=SoLuong WHERE MaDonHang=@orderId AND MaTacPham=@artworkId",
        ("@orderId", deliveredOrderId), ("@artworkId", fixture.ArtworkId));
    Assert(await reviews.GetById(review.MaDanhGia) != null, "Existing review was removed after full return");
    var permissionAfterReturn = await reviewBusiness.GetPermission(fixture.UserId, fixture.ArtworkId);
    Assert(permissionAfterReturn.CanReview && permissionAfterReturn.ExistingReview?.MaDanhGia == review.MaDanhGia,
        "Existing review was not editable after full return");
    await reviewBusiness.Delete(fixture.UserId, review.MaDanhGia);
    Assert(await reviews.GetById(review.MaDanhGia) == null, "Review delete failed");
    await Expect<UnauthorizedAccessException>(() => reviewBusiness.Create(
        fixture.UserId, new TaoDanhGiaRequest { MaTacPham = fixture.ArtworkId, DanhGia = 5 }),
        "Full return blocks a new review");
    Pass("Review authorization, validation, duplicate, update, delete and full-return policy");
}
finally
{
    await Cleanup(setupConnection, createdOrderIds, fixture, originalCart);
}

Console.WriteLine("ALL COMMERCE INTEGRATION SMOKE TESTS PASSED");

static TaoDonHangRequest NewBuyNow(int artworkId) => new()
{
    TenNguoiNhan = "Commerce Smoke Test",
    SoDienThoai = "0912345678",
    DiaChiGiao = "Test address",
    PhuongThucThanhToan = "COD",
    Mode = "BUY_NOW",
    MaTacPham = artworkId,
    SoLuong = 1
};

static async Task<(int? OrderId, Exception? Error)> TryCreateOrder(DonHangRepository repository, int userId, int artworkId)
{
    try { return (await repository.CreateTransactional(userId, NewBuyNow(artworkId)), null); }
    catch (Exception ex) { return (null, ex); }
}

static async Task<(bool Success, Exception? Error)> TryCancel(DonHangRepository repository, int orderId, int adminId)
{
    try { return (await repository.UpdateStatusTransactional(orderId, DonHangStatus.DaHuy, "smoke", adminId), null); }
    catch (Exception ex) { return (false, ex); }
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

static void Pass(string name) => Console.WriteLine("PASS: " + name);

static async Task<(int UserId, int IneligibleUserId, int ArtworkId, int AdminAccountId, int OriginalStock, byte OriginalStatus)> ReadFixture(SqlConnection connection)
{
    const string sql = @"
        SELECT TOP 1 n.MaNguoiDung
        FROM NguoiDung n ORDER BY n.MaNguoiDung;
        SELECT TOP 1 t.MaTacPham,t.SoLuong,t.TrangThai
        FROM TacPham t WHERE t.TrangThai=1 AND t.SoLuong>=5 ORDER BY t.MaTacPham;
        SELECT TOP 1 tk.MaTaiKhoan FROM TaiKhoan tk WHERE tk.VaiTro=0 AND tk.TrangThai=1 ORDER BY tk.MaTaiKhoan;";
    await using var command = new SqlCommand(sql, connection);
    await using var reader = await command.ExecuteReaderAsync();
    await reader.ReadAsync();
    var userId = reader.GetInt32(0);
    await reader.NextResultAsync();
    await reader.ReadAsync();
    var artworkId = reader.GetInt32(0);
    var stock = reader.GetInt32(1);
    var status = reader.GetByte(2);
    await reader.NextResultAsync();
    await reader.ReadAsync();
    var adminId = reader.GetInt32(0);
    await reader.CloseAsync();

    const string otherSql = @"
        SELECT TOP 1 n.MaNguoiDung FROM NguoiDung n
        WHERE n.MaNguoiDung<>@userId AND NOT EXISTS
        (
            SELECT 1 FROM DonHang d JOIN ChiTietDonHang c ON c.MaDonHang=d.MaDonHang
            WHERE d.MaNguoiDung=n.MaNguoiDung AND d.TrangThai=3 AND c.MaTacPham=@artworkId
              AND c.SoLuong-ISNULL(c.SoLuongDaHoan,0)>0
        ) ORDER BY n.MaNguoiDung DESC;";
    await using var other = new SqlCommand(otherSql, connection);
    other.Parameters.AddWithValue("@userId", userId);
    other.Parameters.AddWithValue("@artworkId", artworkId);
    var ineligible = Convert.ToInt32(await other.ExecuteScalarAsync());
    return (userId, ineligible, artworkId, adminId, stock, status);
}

static async Task<(bool CartExisted, int? CartId, int LineCount, int Quantity)> ReadCartState(SqlConnection connection, int userId, int artworkId)
{
    const string sql = @"
        SELECT g.MaGioHang,COUNT(c.MaChiTietGH),ISNULL(SUM(c.SoLuong),0)
        FROM GioHang g LEFT JOIN ChiTietGioHang c ON c.MaGioHang=g.MaGioHang AND c.MaTacPham=@artworkId
        WHERE g.MaNguoiDung=@userId GROUP BY g.MaGioHang;";
    await using var command = new SqlCommand(sql, connection);
    command.Parameters.AddWithValue("@userId", userId);
    command.Parameters.AddWithValue("@artworkId", artworkId);
    await using var reader = await command.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return (false, null, 0, 0);
    return (true, reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2));
}

static async Task Cleanup(
    SqlConnection connection,
    List<int> orderIds,
    (int UserId, int IneligibleUserId, int ArtworkId, int AdminAccountId, int OriginalStock, byte OriginalStatus) fixture,
    (bool CartExisted, int? CartId, int LineCount, int Quantity) originalCart)
{
    if (orderIds.Count > 0)
    {
        var ids = string.Join(',', orderIds.Distinct());
        await Execute(connection, $"DELETE FROM DanhGia WHERE MaNguoiDung=@userId AND MaTacPham=@artworkId; DELETE FROM ThanhToan WHERE MaDonHang IN ({ids}); DELETE FROM ChiTietDonHang WHERE MaDonHang IN ({ids}); DELETE FROM DonHang WHERE MaDonHang IN ({ids});",
            ("@userId", fixture.UserId), ("@artworkId", fixture.ArtworkId));
    }

    var currentCart = await ReadCartState(connection, fixture.UserId, fixture.ArtworkId);
    if (originalCart.LineCount > 0)
    {
        await Execute(connection,
            "UPDATE ChiTietGioHang SET SoLuong=@quantity WHERE MaGioHang=@cartId AND MaTacPham=@artworkId",
            ("@quantity", originalCart.Quantity), ("@cartId", originalCart.CartId!), ("@artworkId", fixture.ArtworkId));
    }
    else if (currentCart.CartId.HasValue)
    {
        await Execute(connection,
            "DELETE FROM ChiTietGioHang WHERE MaGioHang=@cartId AND MaTacPham=@artworkId",
            ("@cartId", currentCart.CartId.Value), ("@artworkId", fixture.ArtworkId));
    }
    if (!originalCart.CartExisted && currentCart.CartId.HasValue)
        await Execute(connection, "DELETE FROM GioHang WHERE MaGioHang=@cartId AND NOT EXISTS(SELECT 1 FROM ChiTietGioHang WHERE MaGioHang=@cartId)", ("@cartId", currentCart.CartId.Value));

    await Execute(connection, "UPDATE TacPham SET SoLuong=@stock,TrangThai=@status WHERE MaTacPham=@id",
        ("@stock", fixture.OriginalStock), ("@status", fixture.OriginalStatus), ("@id", fixture.ArtworkId));
}

static async Task Execute(SqlConnection connection, string sql, params (string Name, object? Value)[] parameters)
{
    await using var command = new SqlCommand(sql, connection);
    foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Name, parameter.Value ?? DBNull.Value);
    await command.ExecuteNonQueryAsync();
}

static async Task<int> ScalarInt(SqlConnection connection, string sql, params (string Name, object? Value)[] parameters)
{
    await using var command = new SqlCommand(sql, connection);
    foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Name, parameter.Value ?? DBNull.Value);
    return Convert.ToInt32(await command.ExecuteScalarAsync());
}
