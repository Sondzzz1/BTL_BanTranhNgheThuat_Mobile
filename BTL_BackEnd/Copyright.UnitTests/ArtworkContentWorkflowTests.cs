using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.Controllers;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Copyright.UnitTests;

public class ArtworkContentWorkflowTests
{
    private static T Fake<T>(Func<string, object?[], object?> handle) where T : class
    {
        var proxy = DispatchProxy.Create<T, RepositoryProxy>();
        ((RepositoryProxy)(object)proxy).Handle = handle;
        return proxy;
    }
    public class RepositoryProxy : DispatchProxy
    {
        public Func<string, object?[], object?> Handle { get; set; } = null!;
        protected override object? Invoke(MethodInfo? method, object?[]? args) => Handle(method!.Name, args!);
    }
    private static T Business<T>(params object[] repositories)
    {
        var constructor = typeof(T).GetConstructors().Single();
        return (T)constructor.Invoke(constructor.GetParameters().Select(p =>
            repositories.FirstOrDefault(p.ParameterType.IsInstanceOfType)).ToArray());
    }

    [Fact]
    public async Task DescriptionOnlyCreatesAndApprovesArtworkWithoutContent()
    {
        TacPham? saved = null;
        var artworkRepo = Fake<ITacPhamRepository>((name, args) => name switch
        {
            "Create" => Save((TacPham)args[0]!),
            "GetById" => Task.FromResult(saved),
            "UpdateWithArtistNotification" => Task.FromResult(true),
            _ => throw new InvalidOperationException("Unexpected repository operation: " + name)
        });
        Task<int> Save(TacPham artwork) { saved = artwork; artwork.MaTacPham = 7; return Task.FromResult(7); }
        var artist = Business<HoaSiBusiness>(artworkRepo);
        await artist.TaoTacPham(3, new TaoTacPhamRequest { TenTacPham = "Hoa ly", Gia = 100,
            SoLuong = 1, LaTacPhamDocBan = true, MoTa = " Tranh hoa ly... " });
        Assert.Equal("Tranh hoa ly...", saved!.MoTa);
        Assert.Equal(TacPhamStatus.PendingApproval, saved.TrangThai);
        var edits = Fake<ITacPhamChinhSuaRepository>((_, _) => Task.FromResult<TacPhamChinhSua?>(null));
        var admin = Business<AdminBusiness>(artworkRepo, edits);
        Assert.True(await admin.DuyetTacPham(7, new DuyetTacPhamRequest { PheDuyet = true }));
        Assert.Equal(TacPhamStatus.OnSale, saved.TrangThai);
        Assert.Equal("Tranh hoa ly...", saved.MoTa);
        // Only the artwork repository is usable: accidental detail creation cannot be hidden by a fake.
    }

    [Theory]
    [InlineData(false)][InlineData(true)]
    public async Task EmptyOrTechnicalOnlyDetailIsRejectedBeforeWriting(bool update)
    {
        var business = Business<ChiTietTacPhamBusiness>();
        var request = new TaoChiTietTacPhamRequest { CauChuyenSangTac = " \t\r\n ", ThongTinBosung = "   ",
            HinhAnh1 = " ", KichThuoc = "60x80", ChatLieu = "Sơn dầu" };
        await Assert.ThrowsAsync<ArgumentException>(() => update
            ? business.CapNhatChiTiet(3, 7, request)
            : business.TaoChiTiet(3, 7, request));
    }

    [Theory]
    [InlineData(true)][InlineData(false)]
    public async Task ContentHasIndependentApprovalAndPublicVisibility(bool approve)
    {
        var artwork = new TacPham { MaTacPham = 7, MaHoaSi = 3, TenTacPham = "Hoa ly",
            MoTa = "Mô tả cơ bản", TrangThai = TacPhamStatus.OnSale };
        ChiTietTacPham? detail = null;
        var artworkRepo = Fake<ITacPhamRepository>((_, _) => Task.FromResult<TacPham?>(artwork));
        var details = Fake<IChiTietTacPhamRepository>((name, args) => name switch
        {
            "GetByMaTacPham" or "GetCongKhai" => Task.FromResult(detail),
            "Create" => Create((ChiTietTacPham)args[2]!),
            "Update" => Update((ChiTietTacPham)args[2]!),
            "Duyet" => Review((bool)args[2]!),
            _ => throw new InvalidOperationException(name)
        });
        Task<int> Create(ChiTietTacPham value) { detail = value; detail.MaChiTiet = 1; return Task.FromResult(1); }
        Task<bool> Update(ChiTietTacPham value) { detail = value; return Task.FromResult(true); }
        Task<bool> Review(bool approved) { detail!.TrangThai = (byte)(approved ? 1 : 2); return Task.FromResult(true); }
        var artistRepo = Fake<IHoaSiRepository>((_, _) => Task.FromResult<HoaSi?>(null));
        var business = Business<ChiTietTacPhamBusiness>(details, artworkRepo, artistRepo);
        await business.TaoChiTiet(3, 7, new TaoChiTietTacPhamRequest { CauChuyenSangTac = " Ý tưởng mới ", HinhAnh1 = "https://example.com/detail.jpg" });
        Assert.Equal("Mô tả cơ bản", artwork.MoTa);
        Assert.Equal((byte)0, detail!.TrangThai);
        Assert.Null(detail.ThongTinBosung); // Never falls back to artwork.MoTa.
        Assert.Null(await business.GetChiTietCongKhai(7));
        Assert.True(await business.DuyetChiTiet(7, 1, new DuyetChiTietTacPhamRequest { PheDuyet = approve, LyDoTuChoi = approve ? null : "Cần bổ sung" }));
        Assert.Equal(TacPhamStatus.OnSale, artwork.TrangThai);
        var published = await business.GetChiTietCongKhai(7);
        if (approve) Assert.Equal("Ý tưởng mới", published!.CauChuyenSangTac);
        else Assert.Null(published);
        await business.CapNhatChiTiet(3, 7, new TaoChiTietTacPhamRequest { ThongTinBosung = "Nội dung mới" });
        Assert.Equal("Mô tả cơ bản", artwork.MoTa);
        Assert.Equal((byte)0, detail!.TrangThai);
        Assert.Null(await business.GetChiTietCongKhai(7));
        Assert.Equal(TacPhamStatus.OnSale, artwork.TrangThai);
    }

    [Fact]
    public async Task LegacyTextIsReturnedUnchangedWithoutMutation()
    {
        var artwork = new TacPham { MaTacPham = 7, MaHoaSi = 3, MoTa = "Nội dung trùng", TrangThai = 1 };
        var oldDetail = new ChiTietTacPham { MaTacPham = 7, ThongTinBosung = artwork.MoTa, TrangThai = 0 };
        var details = Fake<IChiTietTacPhamRepository>((name, _) => name == "GetByMaTacPham"
            ? Task.FromResult<ChiTietTacPham?>(oldDetail) : throw new InvalidOperationException("Unexpected write"));
        var artworks = Fake<ITacPhamRepository>((_, _) => Task.FromResult<TacPham?>(artwork));
        var artists = Fake<IHoaSiRepository>((_, _) => Task.FromResult<HoaSi?>(null));
        var response = await Business<ChiTietTacPhamBusiness>(details, artworks, artists).GetChiTiet(7);
        Assert.Equal("Nội dung trùng", response!.ThongTinBosung);
        Assert.Equal((byte)0, oldDetail.TrangThai);
    }

    [Theory]
    [InlineData(false)][InlineData(true)]
    public async Task UpdatingDescriptionAndReviewingBasicEditNeverTouchesExistingDetail(bool published)
    {
        var artwork = new TacPham { MaTacPham = 7, MaHoaSi = 3, TenTacPham = "Test",
            MoTa = "Mo ta cu", Gia = 100, SoLuong = 1, SoLuongBanDau = 1,
            LaTacPhamDocBan = true, TrangThai = (byte)(published ? 1 : 0) };
        var detail = new ChiTietTacPham { MaChiTiet = 6, MaTacPham = 7, TrangThai = 1,
            CauChuyenSangTac = "Noi dung nghe thuat rieng", NgayDuyet = DateTime.UtcNow,
            HinhAnh1 = "https://example.com/detail.jpg", MaNguoiDuyet = 1 };
        var snapshot = JsonSerializer.Serialize(detail);
        TacPhamChinhSua? edit = null;
        var artworks = Fake<ITacPhamRepository>((name, _) => name switch
        {
            "GetById" => Task.FromResult<TacPham?>(artwork),
            "Update" or "UpdateWithArtistNotification" => Task.FromResult(true),
            _ => throw new InvalidOperationException(name)
        });
        var edits = Fake<ITacPhamChinhSuaRepository>((name, args) => name switch
        {
            "GetByMaTacPhamChoDuyet" => Task.FromResult(edit),
            "Create" => Save((TacPhamChinhSua)args[0]!),
            "Update" => Task.FromResult(true),
            _ => throw new InvalidOperationException(name)
        });
        Task<int> Save(TacPhamChinhSua value) { edit = value; return Task.FromResult(1); }
        var artist = Business<HoaSiBusiness>(artworks, edits);
        Assert.True(await artist.CapNhatTacPham(3, 7, new CapNhatTacPhamRequest
            { TenTacPham = "Test", MoTa = "Mo ta moi", Gia = 100, SoLuong = 1 }));
        Assert.Equal(published ? "Mo ta cu" : "Mo ta moi", artwork.MoTa);
        if (published)
        {
            Assert.Equal("Mo ta moi", edit!.MoTa);
            Assert.True(await Business<AdminBusiness>(artworks, edits).DuyetTacPham(7,
                new DuyetTacPhamRequest { PheDuyet = true }));
        }
        Assert.Equal("Mo ta moi", artwork.MoTa);
        Assert.Equal(snapshot, JsonSerializer.Serialize(detail));
        // No detail repository is provided; unintended synchronization fails loudly.
    }

    [Theory]
    [InlineData(null)][InlineData("")][InlineData("   ")]
    public async Task EmptyTextCannotCreateOrUpdateDetail(string? content)
    {
        var business = Business<ChiTietTacPhamBusiness>();
        var request = new TaoChiTietTacPhamRequest { ThongTinBosung = content };
        await Assert.ThrowsAsync<ArgumentException>(() => business.TaoChiTiet(3, 7, request));
        await Assert.ThrowsAsync<ArgumentException>(() => business.CapNhatChiTiet(3, 7, request));
    }

    [Fact]
    public async Task ImageOnlyDetailIsAllowedWithoutCopyingDescription()
    {
        var artwork = new TacPham { MaTacPham = 7, MaHoaSi = 3, MoTa = "Basic" };
        ChiTietTacPham? created = null;
        var artworks = Fake<ITacPhamRepository>((_, _) => Task.FromResult<TacPham?>(artwork));
        var details = Fake<IChiTietTacPhamRepository>((name, args) => name switch
        {
            "GetByMaTacPham" => Task.FromResult<ChiTietTacPham?>(null),
            "Create" => Save((ChiTietTacPham)args[2]!),
            _ => throw new InvalidOperationException(name)
        });
        Task<int> Save(ChiTietTacPham value) { created = value; return Task.FromResult(1); }
        await Business<ChiTietTacPhamBusiness>(artworks, details).TaoChiTiet(3, 7,
            new TaoChiTietTacPhamRequest { HinhAnh1 = "https://example.com/detail.jpg" });
        Assert.Null(created!.ThongTinBosung);
        Assert.Equal("Basic", artwork.MoTa);
    }

    [Theory]
    [InlineData(0)][InlineData(1)][InlineData(2)]
    public async Task ArtistReadsOwnDetailAtEveryStatusAndCannotReadOrWriteAnotherArtists(int status)
    {
        var artwork = new TacPham { MaTacPham = 7, MaHoaSi = 3, TrangThai = 0 };
        var detail = new ChiTietTacPham { MaTacPham = 7, TrangThai = (byte)status };
        var artworks = Fake<ITacPhamRepository>((_, _) => Task.FromResult<TacPham?>(artwork));
        var details = Fake<IChiTietTacPhamRepository>((name, _) => name == "GetByMaTacPham"
            ? Task.FromResult<ChiTietTacPham?>(detail) : throw new InvalidOperationException("Unexpected write"));
        var artists = Fake<IHoaSiRepository>((_, _) => Task.FromResult<HoaSi?>(null));
        var business = Business<ChiTietTacPhamBusiness>(artworks, details, artists);
        var controller = new ChiTietTacPhamController(business, null!);
        void SetArtist(int id) => controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim("MaHoaSi", id.ToString()), new Claim(ClaimTypes.Role, "HoaSi") }, "test")) }
        };
        SetArtist(3);
        var own = Assert.IsType<OkObjectResult>((await controller.GetChiTiet(7)).Result);
        Assert.Equal((byte)status, Assert.IsType<ChiTietTacPhamResponse>(own.Value).TrangThai);
        SetArtist(4);
        Assert.Equal(403, Assert.IsType<ObjectResult>((await controller.GetChiTiet(7)).Result).StatusCode);
        var request = new TaoChiTietTacPhamRequest { CauChuyenSangTac = "New story" };
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => business.TaoChiTiet(4, 7, request));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => business.CapNhatChiTiet(4, 7, request));
        Assert.False(await business.CoQuyenQuanLy(4, 7));
        // Admin reads the same private endpoint, not the public approved-only API.
        Assert.IsType<OkObjectResult>((await controller.AdminGetChiTiet(7)).Result);
    }

    [Theory]
    [InlineData(0)][InlineData(2)][InlineData(3)][InlineData(99)]
    public async Task ApprovedDetailCannotPublishANonPublicArtwork(int artworkStatus)
    {
        var artwork = new TacPham { MaTacPham = 7, TrangThai = (byte)artworkStatus };
        var artworks = Fake<ITacPhamRepository>((_, _) => Task.FromResult<TacPham?>(artwork));
        var details = Fake<IChiTietTacPhamRepository>((_, _) => Task.FromResult<ChiTietTacPham?>(
            new ChiTietTacPham { MaTacPham = 7, TrangThai = 1 }));
        Assert.Null(await Business<ChiTietTacPhamBusiness>(artworks, details).GetChiTietCongKhai(7));
    }
}
