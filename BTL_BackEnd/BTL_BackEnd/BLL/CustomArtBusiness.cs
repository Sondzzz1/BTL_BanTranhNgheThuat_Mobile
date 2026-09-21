using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class CustomArtBusiness : ICustomArtBusiness
{
    private readonly ICustomArtRepository _customArtRepo;

    public CustomArtBusiness(ICustomArtRepository customArtRepo)
    {
        _customArtRepo = customArtRepo;
    }

    public async Task<CustomArtRequestResponse> TaoYeuCau(int maKhachHang, TaoYeuCauTranhRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề yêu cầu không được để trống");

        if (string.IsNullOrWhiteSpace(request.LoaiTranh) || string.IsNullOrWhiteSpace(request.KichThuoc))
            throw new ArgumentException("Vui lòng nhập loại tranh và kích thước");

        var result = await _customArtRepo.CreateRequest(maKhachHang, request);
        return MapRequest(result);
    }

    public async Task<List<CustomArtRequestResponse>> LayYeuCauCuaToi(int maKhachHang)
    {
        var result = await _customArtRepo.GetByCustomer(maKhachHang);
        return result.Select(MapRequest).ToList();
    }

    public async Task<List<CustomArtRequestResponse>> LayTatCaYeuCau()
    {
        var result = await _customArtRepo.GetAll();
        return result.Select(MapRequest).ToList();
    }

    public Task<bool> NhanYeuCau(int maYeuCau, int maHoaSi)
    {
        return _customArtRepo.AssignRequest(maYeuCau, maHoaSi);
    }

    public Task<bool> TuChoiYeuCau(int maYeuCau)
    {
        return _customArtRepo.RejectRequest(maYeuCau);
    }

    public async Task<CustomArtQuoteResponse> TaoBaoGia(BaoGiaTranhRequest request)
    {
        if (request.GiaBaoGia <= 0)
            throw new ArgumentException("Giá báo giá phải lớn hơn 0");

        var quote = await _customArtRepo.CreateQuote(request);
        return MapQuote(quote);
    }

    public Task<bool> XacNhanBaoGia(int maBaoGia)
    {
        return _customArtRepo.ConfirmQuote(maBaoGia);
    }

    public Task<bool> DatCoc(int maYeuCau, int maKhachHang, decimal soTien)
    {
        if (soTien <= 0)
            throw new ArgumentException("Số tiền đặt cọc không hợp lệ");

        return _customArtRepo.CreateDeposit(maYeuCau, soTien);
    }

    public Task<bool> ThemTienDo(TaoTienDoRequest request, int maHoaSi)
    {
        return _customArtRepo.CreateProgress(request);
    }

    public Task<bool> GuiPhanHoi(TaoPhanHoiRequest request, int maKhachHang)
    {
        return _customArtRepo.CreateFeedback(request, maKhachHang);
    }

    public Task<bool> XacNhanHoanThanh(int maYeuCau, int maKhachHang)
    {
        return _customArtRepo.ConfirmComplete(maYeuCau, maKhachHang);
    }

    private static CustomArtRequestResponse MapRequest(CustomArtRequest model)
    {
        return new CustomArtRequestResponse
        {
            MaYeuCau = model.MaYeuCau,
            MaKhachHang = model.MaKhachHang,
            MaHoaSi = model.MaHoaSi,
            TieuDe = model.TieuDe,
            LoaiTranh = model.LoaiTranh,
            KichThuoc = model.KichThuoc,
            ChuDe = model.ChuDe,
            MauSac = model.MauSac,
            PhongCach = model.PhongCach,
            ChatLieu = model.ChatLieu,
            MoTa = model.MoTa,
            AnhThamKhao = model.AnhThamKhao,
            TienDatCoc = model.TienDatCoc,
            GiaDuKien = model.GiaDuKien,
            TrangThai = model.TrangThai.ToString(),
            NgayTao = model.NgayTao
        };
    }

    private static CustomArtQuoteResponse MapQuote(CustomArtQuote model)
    {
        return new CustomArtQuoteResponse
        {
            MaBaoGia = model.MaBaoGia,
            MaYeuCau = model.MaYeuCau,
            MaHoaSi = model.MaHoaSi,
            GiaBaoGia = model.GiaBaoGia,
            ThoiGianHoanThanh = model.ThoiGianHoanThanh,
            GhiChu = model.GhiChu,
            TrangThai = model.TrangThai
        };
    }
}
