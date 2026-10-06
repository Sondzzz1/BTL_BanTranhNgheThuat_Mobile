using System.Reflection;
using DoAn2_BackEnd.BLL;
using DoAn2_BackEnd.Controllers;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Xunit;

namespace Copyright.UnitTests;

public class CreativeOriginTests
{
    private static TaoBanQuyenRequest Request(byte type) => new()
    {
        MaTacPham = 10,
        TacGia = "Họa sĩ",
        NguonGoc = "Khai báo nguồn gốc",
        CanCuSuDung = 1,
        LoaiTacPham = type
    };

    private static void Validate(TaoBanQuyenRequest request)
    {
        var method = typeof(CopyrightBusiness).GetMethod("NormalizeAndValidate",
            BindingFlags.NonPublic | BindingFlags.Static, null, [typeof(TaoBanQuyenRequest)], null)!;
        try { method.Invoke(null, [request]); }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(ex.InnerException).Throw();
        }
    }

    private static NguonGocSangTaoResponse Map(TacPham artwork) =>
        (NguonGocSangTaoResponse)typeof(PublicController)
            .GetMethod("MapOrigin", BindingFlags.NonPublic | BindingFlags.Static)!
            .Invoke(null, [artwork])!;

    [Fact]
    public void Original_DoesNotRequireOrLeakSourceFields()
    {
        var request = Request(0);
        request.TenTacPhamGoc = "Dữ liệu cũ";
        Validate(request);
        Assert.Null(request.TenTacPhamGoc);
        Assert.Equal("ORIGINAL", Map(new TacPham { LoaiTacPham = 0 }).Loai);
    }

    [Fact]
    public void Derivative_LinkedArtworkNeedsNoDuplicateNameOrAuthor()
    {
        var request = Request(2);
        request.MaTacPhamGoc = 9;
        Validate(request);
        Assert.Null(request.TenTacPhamGoc);
        Assert.Null(request.TacGiaGoc);
        Assert.Equal("DERIVATIVE", Map(new TacPham { LoaiTacPham = 2, MaTacPhamGoc = 9 }).Loai);
    }

    [Fact]
    public void Derivative_ExternalArtworkKeepsNameAndAuthor()
    {
        var request = Request(2);
        request.TenTacPhamGoc = "  The Starry Night  ";
        request.TacGiaGoc = "  Vincent van Gogh  ";
        Validate(request);
        Assert.Equal("The Starry Night", request.TenTacPhamGoc);
        Assert.Equal("Vincent van Gogh", request.TacGiaGoc);
    }

    [Fact]
    public void Derivative_InsufficientExternalOriginIsRejected()
    {
        var request = Request(2);
        request.TenTacPhamGoc = "Tác phẩm gốc";
        Assert.Throws<ArgumentException>(() => Validate(request));
    }

    [Fact]
    public void LegacyNullFields_MapWithoutFailure()
    {
        var origin = Map(new TacPham());
        Assert.Equal("ORIGINAL", origin.Loai);
        Assert.Null(origin.NguonThamKhao);
    }

    [Fact]
    public void LinkedArtwork_CannotPointToItself()
    {
        var request = Request(2);
        request.MaTacPhamGoc = request.MaTacPham;
        Assert.Throws<ArgumentException>(() => Validate(request));
    }

    [Fact]
    public void OptionalReference_RemainsNullForDerivative()
    {
        var origin = Map(new TacPham { LoaiTacPham = 2, TenTacPhamGoc = "Tranh gốc", TacGiaGoc = "Tác giả" });
        Assert.Null(origin.NguonThamKhao);
        Assert.Equal("Tranh gốc", origin.TenTacPhamGocNgoaiHeThong);
    }

    [Fact]
    public void Reference_RequiresSourceAndExplanation()
    {
        var request = Request(4);
        request.NguonThamKhao = "Ảnh cá nhân";
        Assert.Throws<ArgumentException>(() => Validate(request));
        request.MoTaNguonGoc = "Tham khảo bố cục";
        Validate(request);
        Assert.Equal("REFERENCE", Map(new TacPham { LoaiTacPham = 4 }).Loai);
    }

    [Fact]
    public void Migration_IsAdditiveAndIdempotent()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        string? path = null;
        while (directory != null && path == null)
        {
            var candidate = Path.Combine(directory.FullName, "BTL_BackEnd", "BTL_BackEnd", "SQL",
                "Migrations", "013_ArtworkCreativeOrigin.sql");
            if (File.Exists(candidate)) path = candidate;
            directory = directory.Parent;
        }
        Assert.NotNull(path);
        var sql = File.ReadAllText(path!).ToUpperInvariant();
        Assert.Contains("COL_LENGTH", sql);
        Assert.Contains("BEGIN TRANSACTION", sql);
        Assert.DoesNotContain("DROP TABLE", sql);
        Assert.DoesNotContain("DROP COLUMN", sql);
        Assert.DoesNotContain("TRUNCATE TABLE", sql);
    }
}
