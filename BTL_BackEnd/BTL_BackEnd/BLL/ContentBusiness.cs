using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class ContentBusiness : IContentBusiness
{
    private readonly INoiDungRepository _noiDungRepo;
    private readonly IBaiVietRepository _baiVietRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly ITacPhamRepository _tacPhamRepo;

    public ContentBusiness(
        INoiDungRepository noiDungRepo,
        IBaiVietRepository baiVietRepo,
        IHoaSiRepository hoaSiRepo,
        ITacPhamRepository tacPhamRepo)
    {
        _noiDungRepo = noiDungRepo;
        _baiVietRepo = baiVietRepo;
        _hoaSiRepo = hoaSiRepo;
        _tacPhamRepo = tacPhamRepo;
    }

    // ==========================================
    // BÀI VIẾT (ARTICLES)
    // ==========================================

    public async Task<List<BaiVietResponse>> LayTatCaBaiViet()
    {
        var list = await _baiVietRepo.GetAll();
        var hoaSis = await _hoaSiRepo.GetAll();
        var dictHoaSi = hoaSis.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);

        // Chỉ trả về những bài đã duyệt (TrangThai = 2)
        return list.Where(x => x.TrangThai == 2)
                   .Select(x => MapToBaiVietResponse(x, dictHoaSi)).ToList();
    }

    public async Task<List<BaiVietResponse>> LayTatCaBaiVietAdmin()
    {
        var list = await _baiVietRepo.GetAll();
        var hoaSis = await _hoaSiRepo.GetAll();
        var dictHoaSi = hoaSis.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);

        return list.Select(x => MapToBaiVietResponse(x, dictHoaSi)).ToList();
    }

    public async Task<BaiVietResponse> LayBaiVietTheoId(int id)
    {
        var item = await _baiVietRepo.GetById(id);
        if (item == null) return null!;
        var hoaSi = await _hoaSiRepo.GetById(item.MaHoaSi);
        var dictHoaSi = new Dictionary<int, string>();
        if (hoaSi != null) dictHoaSi[hoaSi.MaHoaSi] = hoaSi.TenHoaSi;

        return MapToBaiVietResponse(item, dictHoaSi);
    }

    public async Task<int> TaoBaiViet(int maHoaSi, TaoBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");
        if (maHoaSi <= 0)
            throw new InvalidOperationException("Tài khoản hiện tại không thể tạo bài viết với tư cách họa sĩ");

        var item = new BaiViet
        {
            MaHoaSi = maHoaSi,
            TieuDe = request.TieuDe.Trim(),
            NoiDung = request.NoiDung?.Trim(),
            AnhTieuDe = request.AnhTieuDe?.Trim(),
            NgayDang = DateTime.UtcNow,
            TrangThai = 0 // Draft
        };
        return await _baiVietRepo.Create(item);
    }

    public async Task<bool> CapNhatBaiViet(int id, int? maHoaSiCuaUser, bool isAdmin, CapNhatBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");

        var item = await _baiVietRepo.GetById(id);
        if (item == null) return false;

        // Ownership check: artist chỉ được sửa bài của chính mình; admin được sửa tất cả.
        if (!isAdmin && (!maHoaSiCuaUser.HasValue || item.MaHoaSi != maHoaSiCuaUser.Value))
            throw new UnauthorizedAccessException("Không có quyền sửa bài viết này");

        item.TieuDe = request.TieuDe.Trim();
        item.NoiDung = request.NoiDung?.Trim();
        item.AnhTieuDe = request.AnhTieuDe?.Trim();

        // Khi artist sửa bài đã được duyệt -> đưa về Pending để admin duyệt lại.
        // Admin sửa thì giữ nguyên trạng thái (chỉnh sửa nội dung).
        if (!isAdmin && (item.TrangThai == 2 || item.TrangThai == 3))
        {
            item.TrangThai = 1;
            item.LyDo = null;
        }

        return await _baiVietRepo.Update(item);
    }

    public async Task<bool> XoaBaiViet(int id, int? maHoaSiCuaUser, bool isAdmin)
    {
        var item = await _baiVietRepo.GetById(id);
        if (item == null) return false;

        if (!isAdmin && (!maHoaSiCuaUser.HasValue || item.MaHoaSi != maHoaSiCuaUser.Value))
            throw new UnauthorizedAccessException("Không có quyền xoá bài viết này");

        return await _baiVietRepo.Delete(id);
    }

    public async Task<bool> PheDuyetBaiViet(int id, DuyetBaiVietRequest request)
    {
        var item = await _baiVietRepo.GetById(id);
        if (item == null) return false;

        // Chỉ duyệt được khi bài đang Pending (1)
        if (item.TrangThai != 1)
            throw new InvalidOperationException("Bài viết không ở trạng thái chờ duyệt");

        if (request.PheDuyet)
        {
            item.TrangThai = 2; // Published
            item.LyDo = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.LyDo))
                throw new ArgumentException("Vui lòng nhập lý do từ chối");
            item.TrangThai = 3; // Rejected
            item.LyDo = request.LyDo.Trim();
        }
        return await _baiVietRepo.Update(item);
    }

    // ==========================================
    // CHI TIẾT TÁC PHẨM (ARTWORK DETAILS)
    // ==========================================

    public async Task<List<NoiDungResponse>> LayTatCaChiTietTacPham(string? loai)
    {
        var list = await _noiDungRepo.GetAll(loai);
        var tacPhamList = await _tacPhamRepo.GetAll();
        var dict = tacPhamList.ToDictionary(t => t.MaTacPham, t => t.TenTacPham);
        return list.Select(x => MapToNoiDungResponse(x, dict)).ToList();
    }

    public async Task<List<NoiDungResponse>> LayChiTietTheoTacPham(int maTacPham)
    {
        var list = await _noiDungRepo.GetByTacPham(maTacPham);
        var tp = await _tacPhamRepo.GetById(maTacPham);
        var dict = new Dictionary<int, string>();
        if (tp != null) dict[tp.MaTacPham] = tp.TenTacPham;
        return list.Select(x => MapToNoiDungResponse(x, dict)).ToList();
    }

    public async Task<int> TaoChiTietTacPham(TaoNoiDungRequest request)
    {
        var item = new NoiDung
        {
            MaTacPham = request.MaTacPham,
            TieuDe = request.TieuDe,
            NoiDungText = request.MoTa,
            Loai = request.Loai,
            NgayCapNhat = DateTime.Now,
            TrangThai = request.TrangThai
        };
        return await _noiDungRepo.Create(item);
    }

    public async Task<bool> CapNhatChiTietTacPham(int id, CapNhatNoiDungRequest request)
    {
        var item = await _noiDungRepo.GetById(id);
        if (item == null) return false;
        item.TieuDe = request.TieuDe;
        item.NoiDungText = request.MoTa;
        item.Loai = request.Loai;
        item.NgayCapNhat = DateTime.Now;
        item.TrangThai = request.TrangThai;
        return await _noiDungRepo.Update(item);
    }

    public async Task<bool> XoaChiTietTacPham(int id)
    {
        return await _noiDungRepo.Delete(id);
    }

    // --- MAPPING HELPERS ---
    private BaiVietResponse MapToBaiVietResponse(BaiViet x, Dictionary<int, string>? dictHoaSi = null) => new BaiVietResponse
    {
        MaBaiViet = x.MaBaiViet,
        TieuDe = x.TieuDe,
        NoiDung = x.NoiDung,
        MaHoaSi = x.MaHoaSi,
        TenHoaSi = dictHoaSi != null && dictHoaSi.ContainsKey(x.MaHoaSi) ? dictHoaSi[x.MaHoaSi] : "N/A",
        NgayDang = x.NgayDang,
        TrangThai = x.TrangThai,
        LyDo = x.LyDo,
        AnhTieuDe = x.AnhTieuDe
    };

    private NoiDungResponse MapToNoiDungResponse(NoiDung x, Dictionary<int, string>? dictTenTP = null) => new NoiDungResponse
    {
        MaNoiDung = x.MaNoiDung,
        MaTacPham = x.MaTacPham,
        TenTacPham = dictTenTP != null && dictTenTP.TryGetValue(x.MaTacPham, out var tenTP)
            ? tenTP
            : $"Tác phẩm #{x.MaTacPham}",
        TieuDe = x.TieuDe,
        MoTa = x.NoiDungText,
        Loai = x.Loai,
        TrangThai = x.TrangThai
    };
}
