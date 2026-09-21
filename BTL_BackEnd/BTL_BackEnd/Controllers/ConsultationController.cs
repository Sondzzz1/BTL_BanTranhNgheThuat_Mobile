using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/consultation")]
[Authorize]
public class ConsultationController : ControllerBase
{
    private static readonly List<ConsultationBooking> _bookings = new();
    private static readonly List<ConsultationCriteria> _criteria = new();
    private static readonly List<ConsultationRecommendation> _recommendations = new();

    [HttpPost("book")]
    public ActionResult<ConsultationBookingResponse> DatLichTuVan([FromBody] TaoLichTuVanRequest request)
    {
        if (request.Ngay.Date <= DateTime.UtcNow.Date)
            return BadRequest(new { message = "Ngày tư vấn phải lớn hơn ngày hiện tại" });

        var booking = new ConsultationBooking
        {
            MaLichTuVan = _bookings.Count + 1,
            MaKhachHang = GetCurrentCustomerId(),
            Ngay = request.Ngay,
            Gio = request.Gio,
            DiaChi = request.DiaChi,
            NhuCau = request.NhuCau,
            GhiChu = request.GhiChu,
            KetQuaTuVan = request.KetQuaTuVan,
            TrangThai = ConsultationStatus.Submitted
        };

        _bookings.Add(booking);

        return Ok(new ConsultationBookingResponse
        {
            MaLichTuVan = booking.MaLichTuVan,
            MaKhachHang = booking.MaKhachHang,
            MaHoaSi = booking.MaHoaSi,
            MaNhanVien = booking.MaNhanVien,
            Ngay = booking.Ngay,
            Gio = booking.Gio,
            DiaChi = booking.DiaChi,
            NhuCau = booking.NhuCau,
            GhiChu = booking.GhiChu,
            TrangThai = booking.TrangThai.ToString(),
            KetQuaTuVan = booking.KetQuaTuVan,
            NgayTao = booking.NgayTao
        });
    }

    [HttpGet("my-bookings")]
    public ActionResult<List<ConsultationBookingResponse>> LayLichTuVanCuaToi()
    {
        var result = _bookings
            .Where(x => x.MaKhachHang == GetCurrentCustomerId())
            .Select(x => new ConsultationBookingResponse
            {
                MaLichTuVan = x.MaLichTuVan,
                MaKhachHang = x.MaKhachHang,
                MaHoaSi = x.MaHoaSi,
                MaNhanVien = x.MaNhanVien,
                Ngay = x.Ngay,
                Gio = x.Gio,
                DiaChi = x.DiaChi,
                NhuCau = x.NhuCau,
                GhiChu = x.GhiChu,
                TrangThai = x.TrangThai.ToString(),
                KetQuaTuVan = x.KetQuaTuVan,
                NgayTao = x.NgayTao
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult<List<ConsultationBookingResponse>> LayTatCaLichTuVan()
    {
        var result = _bookings
            .Select(x => new ConsultationBookingResponse
            {
                MaLichTuVan = x.MaLichTuVan,
                MaKhachHang = x.MaKhachHang,
                MaHoaSi = x.MaHoaSi,
                MaNhanVien = x.MaNhanVien,
                Ngay = x.Ngay,
                Gio = x.Gio,
                DiaChi = x.DiaChi,
                NhuCau = x.NhuCau,
                GhiChu = x.GhiChu,
                TrangThai = x.TrangThai.ToString(),
                KetQuaTuVan = x.KetQuaTuVan,
                NgayTao = x.NgayTao
            })
            .ToList();

        return Ok(result);
    }

    [HttpPost("assign/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult GanHoaSiChoLichTuVan(int id)
    {
        var booking = _bookings.FirstOrDefault(x => x.MaLichTuVan == id);
        if (booking == null)
            return NotFound(new { message = "Không tìm thấy lịch tư vấn" });

        booking.MaHoaSi = GetCurrentArtistId();
        booking.TrangThai = ConsultationStatus.Confirmed;

        return Ok(new { message = "Đã gán họa sĩ cho lịch tư vấn" });
    }

    [HttpPost("result")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult ThemKetQuaTuVan([FromBody] TaoKetQuaTuVanRequest request)
    {
        var booking = _bookings.FirstOrDefault(x => x.MaLichTuVan == request.MaLichTuVan);
        if (booking == null)
            return NotFound(new { message = "Lịch tư vấn không tồn tại" });

        booking.KetQuaTuVan = request.KetQuaTuVan;
        booking.TrangThai = ConsultationStatus.Completed;

        return Ok(new { message = "Đã ghi nhận kết quả tư vấn" });
    }

    [HttpPost("recommendation")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult ThemDeXuat([FromBody] TaoDeXuatTranhRequest request)
    {
        var booking = _bookings.FirstOrDefault(x => x.MaLichTuVan == request.MaLichTuVan);
        if (booking == null)
            return NotFound(new { message = "Lịch tư vấn không tồn tại" });

        var recommendation = new ConsultationRecommendation
        {
            MaDeXuat = _recommendations.Count + 1,
            MaLichTuVan = request.MaLichTuVan,
            MaTacPham = request.MaTacPham,
            GiaDeXuat = request.GiaDeXuat,
            GhiChu = request.GhiChu,
            TrangThai = "Pending"
        };

        _recommendations.Add(recommendation);
        booking.TrangThai = ConsultationStatus.InProgress;

        return Ok(new { message = "Đã đề xuất sản phẩm phù hợp" });
    }

    [HttpPost("criteria")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult ThemTieuChiTuVan([FromBody] ConsultationCriteria criteria)
    {
        var booking = _bookings.FirstOrDefault(x => x.MaLichTuVan == criteria.MaLichTuVan);
        if (booking == null)
            return NotFound(new { message = "Lịch tư vấn không tồn tại" });

        _criteria.Add(criteria);
        return Ok(new { message = "Đã lưu tiêu chí tư vấn" });
    }

    private static int GetCurrentCustomerId()
    {
        return 1;
    }

    private static int GetCurrentArtistId()
    {
        return 2;
    }
}
