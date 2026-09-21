using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class ConsultationBusiness : IConsultationBusiness
{
    private static readonly List<ConsultationBookingResponse> _bookings = new();

    public Task<ConsultationBookingResponse> DatLichTuVan(int maKhachHang, TaoLichTuVanRequest request)
    {
        if (request.Ngay.Date <= DateTime.UtcNow.Date)
            throw new ArgumentException("Ngày tư vấn phải lớn hơn ngày hiện tại");

        var item = new ConsultationBookingResponse
        {
            MaLichTuVan = _bookings.Count + 1,
            MaKhachHang = maKhachHang,
            Ngay = request.Ngay,
            Gio = request.Gio,
            DiaChi = request.DiaChi,
            NhuCau = request.NhuCau,
            GhiChu = request.GhiChu,
            TrangThai = "Submitted",
            KetQuaTuVan = request.KetQuaTuVan,
            NgayTao = DateTime.UtcNow
        };

        _bookings.Add(item);
        return Task.FromResult(item);
    }

    public Task<List<ConsultationBookingResponse>> LayLichTuVanCuaToi(int maKhachHang)
    {
        return Task.FromResult(_bookings.Where(x => x.MaKhachHang == maKhachHang).ToList());
    }

    public Task<List<ConsultationBookingResponse>> LayTatCaLichTuVan()
    {
        return Task.FromResult(_bookings);
    }

    public Task<bool> GanHoaSiChoLichTuVan(int maLichTuVan, int maHoaSi)
    {
        var item = _bookings.FirstOrDefault(x => x.MaLichTuVan == maLichTuVan);
        if (item == null) return Task.FromResult(false);
        item.MaHoaSi = maHoaSi;
        item.TrangThai = "Confirmed";
        return Task.FromResult(true);
    }

    public Task<bool> ThemKetQuaTuVan(int maLichTuVan, string ketQua)
    {
        var item = _bookings.FirstOrDefault(x => x.MaLichTuVan == maLichTuVan);
        if (item == null) return Task.FromResult(false);
        item.KetQuaTuVan = ketQua;
        item.TrangThai = "Completed";
        return Task.FromResult(true);
    }

    public Task<bool> ThemDeXuat(int maLichTuVan, TaoDeXuatTranhRequest request)
    {
        var item = _bookings.FirstOrDefault(x => x.MaLichTuVan == maLichTuVan);
        if (item == null) return Task.FromResult(false);
        item.TrangThai = "InProgress";
        return Task.FromResult(true);
    }

    public Task<bool> ThemTieuChiTuVan(ConsultationCriteria criteria)
    {
        if (criteria.MaLichTuVan <= 0 || string.IsNullOrWhiteSpace(criteria.LoaiTieuChi))
            throw new ArgumentException("Dữ liệu tiêu chí tư vấn không hợp lệ");
        return Task.FromResult(true);
    }
}
