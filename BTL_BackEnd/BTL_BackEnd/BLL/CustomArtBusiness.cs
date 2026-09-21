using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL;

public class CustomArtBusiness : ICustomArtBusiness
{
    private static readonly List<CustomArtRequestResponse> _requests = new();
    private static readonly List<CustomArtQuoteResponse> _quotes = new();

    public Task<CustomArtRequestResponse> TaoYeuCau(int maKhachHang, TaoYeuCauTranhRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề yêu cầu không được để trống");

        if (string.IsNullOrWhiteSpace(request.LoaiTranh) || string.IsNullOrWhiteSpace(request.KichThuoc))
            throw new ArgumentException("Vui lòng nhập loại tranh và kích thước");

        var item = new CustomArtRequestResponse
        {
            MaYeuCau = _requests.Count + 1,
            MaKhachHang = maKhachHang,
            TieuDe = request.TieuDe,
            LoaiTranh = request.LoaiTranh,
            KichThuoc = request.KichThuoc,
            ChuDe = request.ChuDe,
            MauSac = request.MauSac,
            PhongCach = request.PhongCach,
            ChatLieu = request.ChatLieu,
            MoTa = request.MoTa,
            AnhThamKhao = request.AnhThamKhao,
            TienDatCoc = 0,
            GiaDuKien = 0,
            TrangThai = "Submitted",
            NgayTao = DateTime.UtcNow
        };

        _requests.Add(item);
        return Task.FromResult(item);
    }

    public Task<List<CustomArtRequestResponse>> LayYeuCauCuaToi(int maKhachHang)
    {
        return Task.FromResult(_requests.Where(x => x.MaKhachHang == maKhachHang).ToList());
    }

    public Task<List<CustomArtRequestResponse>> LayTatCaYeuCau()
    {
        return Task.FromResult(_requests);
    }

    public Task<bool> NhanYeuCau(int maYeuCau, int maHoaSi)
    {
        var item = _requests.FirstOrDefault(x => x.MaYeuCau == maYeuCau);
        if (item == null) return Task.FromResult(false);
        item.MaHoaSi = maHoaSi;
        item.TrangThai = "Assigned";
        return Task.FromResult(true);
    }

    public Task<bool> TuChoiYeuCau(int maYeuCau)
    {
        var item = _requests.FirstOrDefault(x => x.MaYeuCau == maYeuCau);
        if (item == null) return Task.FromResult(false);
        item.TrangThai = "Rejected";
        return Task.FromResult(true);
    }

    public Task<CustomArtQuoteResponse> TaoBaoGia(BaoGiaTranhRequest request)
    {
        if (request.GiaBaoGia <= 0)
            throw new ArgumentException("Giá báo giá phải lớn hơn 0");

        var quote = new CustomArtQuoteResponse
        {
            MaBaoGia = _quotes.Count + 1,
            MaYeuCau = request.MaYeuCau,
            MaHoaSi = request.MaHoaSi,
            GiaBaoGia = request.GiaBaoGia,
            ThoiGianHoanThanh = request.ThoiGianHoanThanh,
            GhiChu = request.GhiChu,
            TrangThai = "PendingCustomerApproval"
        };

        _quotes.Add(quote);

        var current = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau);
        if (current != null)
        {
            current.GiaDuKien = request.GiaBaoGia;
            current.TrangThai = "Quoted";
        }

        return Task.FromResult(quote);
    }

    public Task<bool> XacNhanBaoGia(int maBaoGia)
    {
        var quote = _quotes.FirstOrDefault(x => x.MaBaoGia == maBaoGia);
        if (quote == null) return Task.FromResult(false);
        quote.TrangThai = "CustomerAccepted";
        var current = _requests.FirstOrDefault(x => x.MaYeuCau == quote.MaYeuCau);
        if (current != null)
            current.TrangThai = "CustomerAccepted";
        return Task.FromResult(true);
    }

    public Task<bool> DatCoc(int maYeuCau, int maKhachHang, decimal soTien)
    {
        if (soTien <= 0)
            throw new ArgumentException("Số tiền đặt cọc không hợp lệ");

        var item = _requests.FirstOrDefault(x => x.MaYeuCau == maYeuCau && x.MaKhachHang == maKhachHang);
        if (item == null) return Task.FromResult(false);

        item.TienDatCoc = soTien;
        item.TrangThai = "DepositPaid";
        return Task.FromResult(true);
    }

    public Task<bool> ThemTienDo(TaoTienDoRequest request, int maHoaSi)
    {
        var item = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau && x.MaHoaSi == maHoaSi);
        if (item == null) return Task.FromResult(false);
        item.TrangThai = request.TrangThai == "PreviewSent" ? "PreviewSent" : "InProgress";
        return Task.FromResult(true);
    }

    public Task<bool> GuiPhanHoi(TaoPhanHoiRequest request, int maKhachHang)
    {
        var item = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau && x.MaKhachHang == maKhachHang);
        if (item == null) return Task.FromResult(false);
        item.TrangThai = "RevisionRequested";
        return Task.FromResult(true);
    }

    public Task<bool> XacNhanHoanThanh(int maYeuCau, int maKhachHang)
    {
        var item = _requests.FirstOrDefault(x => x.MaYeuCau == maYeuCau && x.MaKhachHang == maKhachHang);
        if (item == null) return Task.FromResult(false);
        item.TrangThai = "Completed";
        return Task.FromResult(true);
    }
}
