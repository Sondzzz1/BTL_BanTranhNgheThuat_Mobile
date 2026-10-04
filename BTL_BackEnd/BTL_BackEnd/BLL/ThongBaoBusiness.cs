using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class ThongBaoBusiness : IThongBaoBusiness
{
    private readonly IThongBaoRepository _thongBaoRepository;
    private readonly IHoaSiRepository _hoaSiRepository;

    public ThongBaoBusiness(IThongBaoRepository thongBaoRepository, IHoaSiRepository hoaSiRepository)
    {
        _thongBaoRepository = thongBaoRepository;
        _hoaSiRepository = hoaSiRepository;
    }

    public async Task NotifyArtist(int maHoaSi, string loai, string tieuDe, string noiDung, string? duongDan = null)
    {
        var hoaSi = await _hoaSiRepository.GetById(maHoaSi);
        if (hoaSi?.MaTaiKhoan is not int accountId)
            throw new InvalidOperationException("Không tìm được tài khoản nhận thông báo của họa sĩ");

        await NotifyAccount(new ThongBao
        {
            MaTaiKhoan = accountId,
            Loai = loai,
            TieuDe = tieuDe,
            NoiDung = noiDung,
            DuongDan = duongDan
        });
    }

    public Task<long> NotifyAccount(ThongBao thongBao)
    {
        if (thongBao.MaTaiKhoan <= 0) throw new ArgumentException("Tài khoản nhận thông báo không hợp lệ");
        thongBao.Loai = Required(thongBao.Loai, "Loại thông báo", 80);
        thongBao.TieuDe = Required(thongBao.TieuDe, "Tiêu đề thông báo", 200);
        thongBao.NoiDung = Required(thongBao.NoiDung, "Nội dung thông báo", 2000);
        thongBao.LoaiDoiTuong = Optional(thongBao.LoaiDoiTuong, 50);
        thongBao.DuongDan = SafeRelativePath(thongBao.DuongDan);
        thongBao.EventKey = Optional(thongBao.EventKey, 180);
        return _thongBaoRepository.Create(thongBao);
    }

    public async Task<ThongBaoPageResponse> GetForAccount(int maTaiKhoan, int page, int pageSize)
    {
        page = Math.Clamp(page, 1, 100_000);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var result = await _thongBaoRepository.GetByTaiKhoan(maTaiKhoan, page, pageSize);
        return new ThongBaoPageResponse
        {
            Items = result.Items.Select(Map).ToList(),
            Total = result.Total,
            Page = page,
            PageSize = pageSize
        };
    }

    public Task<int> CountUnread(int maTaiKhoan) => _thongBaoRepository.CountUnread(maTaiKhoan);

    public async Task<bool> MarkAsRead(long maThongBao, int maTaiKhoan)
    {
        if (maThongBao <= 0) throw new ArgumentException("Mã thông báo không hợp lệ");
        return await _thongBaoRepository.MarkAsRead(maThongBao, maTaiKhoan);
    }

    public Task<int> MarkAllAsRead(int maTaiKhoan) => _thongBaoRepository.MarkAllAsRead(maTaiKhoan);

    private static string Required(string value, string field, int maxLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalized)) throw new ArgumentException($"{field} không được để trống");
        if (normalized.Length > maxLength) throw new ArgumentException($"{field} không được vượt quá {maxLength} ký tự");
        return normalized;
    }

    private static string? Optional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim();
        if (normalized.Length > maxLength) throw new ArgumentException($"Đường dẫn thông báo không được vượt quá {maxLength} ký tự");
        return normalized;
    }

    private static string? SafeRelativePath(string? value)
    {
        var normalized = Optional(value, 500);
        if (normalized is null) return null;
        if (!normalized.StartsWith("/", StringComparison.Ordinal) || normalized.StartsWith("//", StringComparison.Ordinal)
            || Uri.TryCreate(normalized, UriKind.Absolute, out _))
            throw new ArgumentException("Đường dẫn thông báo phải là đường dẫn nội bộ an toàn");
        return normalized;
    }

    private static ThongBaoResponse Map(ThongBao item) => new()
    {
        MaThongBao = item.MaThongBao,
        Loai = item.Loai,
        TieuDe = item.TieuDe,
        NoiDung = item.NoiDung,
        LoaiDoiTuong = item.LoaiDoiTuong,
        MaDoiTuong = item.MaDoiTuong,
        DuongDan = item.DuongDan,
        DaDoc = item.DaDoc,
        NgayTao = item.NgayTao
    };
}
