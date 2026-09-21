using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class ConsultationBusiness : IConsultationBusiness
{
    private readonly IConsultationRepository _consultationRepo;

    public ConsultationBusiness(IConsultationRepository consultationRepo)
    {
        _consultationRepo = consultationRepo;
    }

    public async Task<ConsultationBookingResponse> DatLichTuVan(int maKhachHang, TaoLichTuVanRequest request)
    {
        if (request.Ngay.Date <= DateTime.UtcNow.Date)
            throw new ArgumentException("Ngày tư vấn phải lớn hơn ngày hiện tại");

        var item = await _consultationRepo.CreateBooking(maKhachHang, request);
        return MapBooking(item);
    }

    public async Task<List<ConsultationBookingResponse>> LayLichTuVanCuaToi(int maKhachHang)
    {
        var result = await _consultationRepo.GetByCustomer(maKhachHang);
        return result.Select(MapBooking).ToList();
    }

    public async Task<List<ConsultationBookingResponse>> LayTatCaLichTuVan()
    {
        var result = await _consultationRepo.GetAll();
        return result.Select(MapBooking).ToList();
    }

    public Task<bool> GanHoaSiChoLichTuVan(int maLichTuVan, int maHoaSi)
    {
        return _consultationRepo.AssignArtist(maLichTuVan, maHoaSi);
    }

    public Task<bool> ThemKetQuaTuVan(int maLichTuVan, string ketQua)
    {
        return _consultationRepo.SaveResult(maLichTuVan, ketQua);
    }

    public Task<bool> ThemDeXuat(int maLichTuVan, TaoDeXuatTranhRequest request)
    {
        return _consultationRepo.CreateRecommendation(request);
    }

    public Task<bool> ThemTieuChiTuVan(ConsultationCriteria criteria)
    {
        if (criteria.MaLichTuVan <= 0 || string.IsNullOrWhiteSpace(criteria.LoaiTieuChi))
            throw new ArgumentException("Dữ liệu tiêu chí tư vấn không hợp lệ");

        return _consultationRepo.CreateCriteria(criteria);
    }

    private static ConsultationBookingResponse MapBooking(ConsultationBooking model)
    {
        return new ConsultationBookingResponse
        {
            MaLichTuVan = model.MaLichTuVan,
            MaKhachHang = model.MaKhachHang,
            MaHoaSi = model.MaHoaSi,
            MaNhanVien = model.MaNhanVien,
            Ngay = model.Ngay,
            Gio = model.Gio,
            DiaChi = model.DiaChi,
            NhuCau = model.NhuCau,
            GhiChu = model.GhiChu,
            TrangThai = model.TrangThai.ToString(),
            KetQuaTuVan = model.KetQuaTuVan,
            NgayTao = model.NgayTao
        };
    }
}
