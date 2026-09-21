using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/consultation")]
[Authorize]
public class ConsultationController : ControllerBase
{
    private readonly IConsultationBusiness _consultationBusiness;

    public ConsultationController(IConsultationBusiness consultationBusiness)
    {
        _consultationBusiness = consultationBusiness;
    }

    [HttpPost("book")]
    public async Task<ActionResult<ConsultationBookingResponse>> DatLichTuVan([FromBody] TaoLichTuVanRequest request)
    {
        try
        {
            var maKhachHang = JwtHelper.GetMaNguoiDung(User);
            if (maKhachHang == null)
                return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

            var result = await _consultationBusiness.DatLichTuVan(maKhachHang.Value, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-bookings")]
    public async Task<ActionResult<List<ConsultationBookingResponse>>> LayLichTuVanCuaToi()
    {
        var maKhachHang = JwtHelper.GetMaNguoiDung(User);
        if (maKhachHang == null)
            return BadRequest(new { message = "Không tìm thấy thông tin khách hàng" });

        var result = await _consultationBusiness.LayLichTuVanCuaToi(maKhachHang.Value);
        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult<List<ConsultationBookingResponse>>> LayTatCaLichTuVan()
    {
        var result = await _consultationBusiness.LayTatCaLichTuVan();
        return Ok(result);
    }

    [HttpPost("assign/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> GanHoaSiChoLichTuVan(int id)
    {
        var maHoaSi = JwtHelper.GetMaHoaSi(User);
        if (maHoaSi == null)
            return BadRequest(new { message = "Không tìm thấy thông tin họa sĩ" });

        var success = await _consultationBusiness.GanHoaSiChoLichTuVan(id, maHoaSi.Value);
        if (!success) return NotFound(new { message = "Không tìm thấy lịch tư vấn" });
        return Ok(new { message = "Đã gán họa sĩ cho lịch tư vấn" });
    }

    [HttpPost("result")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> ThemKetQuaTuVan([FromBody] TaoKetQuaTuVanRequest request)
    {
        var success = await _consultationBusiness.ThemKetQuaTuVan(request.MaLichTuVan, request.KetQuaTuVan);
        if (!success) return NotFound(new { message = "Lịch tư vấn không tồn tại" });
        return Ok(new { message = "Đã ghi nhận kết quả tư vấn" });
    }

    [HttpPost("recommendation")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> ThemDeXuat([FromBody] TaoDeXuatTranhRequest request)
    {
        var success = await _consultationBusiness.ThemDeXuat(request.MaLichTuVan, request);
        if (!success) return NotFound(new { message = "Lịch tư vấn không tồn tại" });
        return Ok(new { message = "Đã đề xuất sản phẩm phù hợp" });
    }

    [HttpPost("criteria")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult> ThemTieuChiTuVan([FromBody] ConsultationCriteria criteria)
    {
        try
        {
            var success = await _consultationBusiness.ThemTieuChiTuVan(criteria);
            if (!success) return NotFound(new { message = "Lịch tư vấn không tồn tại" });
            return Ok(new { message = "Đã lưu tiêu chí tư vấn" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
