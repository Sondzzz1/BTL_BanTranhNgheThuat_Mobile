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

        var normalizedType = NormalizeType(request.Type);

        if (normalizedType == CustomArtType.Original)
        {
            request.ReferenceArtworkId = null;
            request.ReferenceArtworkName = null;
            request.ReferenceArtistName = null;
            request.ReferenceImageUrl = null;
        }
        else
        {
            if (request.ReferenceArtworkId.HasValue && request.ReferenceArtworkId.Value <= 0)
                throw new ArgumentException("ID tác phẩm tham chiếu không hợp lệ");

            var hasReferenceInfo = !string.IsNullOrWhiteSpace(request.ReferenceArtworkName)
                || !string.IsNullOrWhiteSpace(request.ReferenceArtistName)
                || !string.IsNullOrWhiteSpace(request.ReferenceImageUrl)
                || request.ReferenceArtworkId.HasValue;

            if (!hasReferenceInfo)
                throw new ArgumentException("Vui lòng cung cấp thông tin tác phẩm tham chiếu khi tạo dựa trên tác phẩm có sẵn hoặc tái tạo");

            if (request.ReferenceArtworkId.HasValue && request.ReferenceArtworkId.Value == 0)
                request.ReferenceArtworkId = null;
        }

        request.Type = normalizedType.ToString();

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
            Type = model.Type.ToString(),
            LoaiTranh = model.LoaiTranh,
            KichThuoc = model.KichThuoc,
            ChuDe = model.ChuDe,
            MauSac = model.MauSac,
            PhongCach = model.PhongCach,
            ChatLieu = model.ChatLieu,
            MoTa = model.MoTa,
            AnhThamKhao = model.AnhThamKhao,
            ReferenceArtworkId = model.ReferenceArtworkId,
            ReferenceArtworkName = model.ReferenceArtworkName,
            ReferenceArtistName = model.ReferenceArtistName,
            ReferenceImageUrl = model.ReferenceImageUrl,
            TienDatCoc = model.TienDatCoc,
            GiaDuKien = model.GiaDuKien,
            TrangThai = model.TrangThai.ToString(),
            NgayTao = model.NgayTao
        };
    }

    private static CustomArtType NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
            return CustomArtType.Original;

        var normalized = type.Trim();

        if (normalized.Equals("Original", StringComparison.OrdinalIgnoreCase))
            return CustomArtType.Original;
        if (normalized.Equals("BasedOnArtwork", StringComparison.OrdinalIgnoreCase))
            return CustomArtType.BasedOnArtwork;
        if (normalized.Equals("Reproduction", StringComparison.OrdinalIgnoreCase))
            return CustomArtType.Reproduction;

        throw new ArgumentException("Loại yêu cầu không hợp lệ. Chỉ chấp nhận Original, BasedOnArtwork hoặc Reproduction");
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
