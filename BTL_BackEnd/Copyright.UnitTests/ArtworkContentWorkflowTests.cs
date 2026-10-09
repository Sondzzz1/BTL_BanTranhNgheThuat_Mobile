using System.Reflection;
using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Xunit;

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
        Assert.Equal((byte)0, detail!.TrangThai);
        Assert.Null(detail.ThongTinBosung); // Never falls back to artwork.MoTa.
        Assert.Null(await business.GetChiTietCongKhai(7));
        Assert.True(await business.DuyetChiTiet(7, 1, new DuyetChiTietTacPhamRequest { PheDuyet = approve, LyDoTuChoi = approve ? null : "Cần bổ sung" }));
        Assert.Equal(TacPhamStatus.OnSale, artwork.TrangThai);
        var published = await business.GetChiTietCongKhai(7);
        if (approve) Assert.Equal("Ý tưởng mới", published!.CauChuyenSangTac);
        else Assert.Null(published);
        await business.CapNhatChiTiet(3, 7, new TaoChiTietTacPhamRequest { ThongTinBosung = "Nội dung mới" });
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
}
