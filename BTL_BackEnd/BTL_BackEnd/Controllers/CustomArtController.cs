using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/custom-art")]
[Authorize]
public class CustomArtController : ControllerBase
{
    private static readonly List<CustomArtRequest> _requests = new();
    private static readonly List<CustomArtQuote> _quotes = new();
    private static readonly List<CustomArtProgress> _progresses = new();
    private static readonly List<CustomArtFeedback> _feedbacks = new();
    private static readonly List<CustomArtPayment> _payments = new();

    [HttpPost("create")]
    public ActionResult<CustomArtRequestResponse> TaoYeuCau([FromBody] TaoYeuCauTranhRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            return BadRequest(new { message = "Tiêu đề yêu cầu không được để trống" });

        if (string.IsNullOrWhiteSpace(request.LoaiTranh) || string.IsNullOrWhiteSpace(request.KichThuoc))
            return BadRequest(new { message = "Vui lòng nhập loại tranh và kích thước" });

        var entity = new CustomArtRequest
        {
            MaYeuCau = _requests.Count + 1,
            MaKhachHang = GetCurrentCustomerId(),
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
            TrangThai = CustomArtStatus.Submitted,
            NgayHoanThanhDuKien = request.NgayHoanThanhDuKien
        };

        _requests.Add(entity);

        return Ok(new CustomArtRequestResponse
        {
            MaYeuCau = entity.MaYeuCau,
            MaKhachHang = entity.MaKhachHang,
            MaHoaSi = entity.MaHoaSi,
            TieuDe = entity.TieuDe,
            LoaiTranh = entity.LoaiTranh,
            KichThuoc = entity.KichThuoc,
            ChuDe = entity.ChuDe,
            MauSac = entity.MauSac,
            PhongCach = entity.PhongCach,
            ChatLieu = entity.ChatLieu,
            MoTa = entity.MoTa,
            AnhThamKhao = entity.AnhThamKhao,
            TienDatCoc = entity.TienDatCoc,
            GiaDuKien = entity.GiaDuKien,
            TrangThai = entity.TrangThai.ToString(),
            NgayTao = entity.NgayTao
        });
    }

    [HttpGet("my-requests")]
    public ActionResult<List<CustomArtRequestResponse>> LayYeuCauCuaToi()
    {
        var result = _requests
            .Where(x => x.MaKhachHang == GetCurrentCustomerId())
            .Select(x => new CustomArtRequestResponse
            {
                MaYeuCau = x.MaYeuCau,
                MaKhachHang = x.MaKhachHang,
                MaHoaSi = x.MaHoaSi,
                TieuDe = x.TieuDe,
                LoaiTranh = x.LoaiTranh,
                KichThuoc = x.KichThuoc,
                ChuDe = x.ChuDe,
                MauSac = x.MauSac,
                PhongCach = x.PhongCach,
                ChatLieu = x.ChatLieu,
                MoTa = x.MoTa,
                AnhThamKhao = x.AnhThamKhao,
                TienDatCoc = x.TienDatCoc,
                GiaDuKien = x.GiaDuKien,
                TrangThai = x.TrangThai.ToString(),
                NgayTao = x.NgayTao
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("requests")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult<List<CustomArtRequestResponse>> LayTatCaYeuCau()
    {
        var result = _requests
            .Select(x => new CustomArtRequestResponse
            {
                MaYeuCau = x.MaYeuCau,
                MaKhachHang = x.MaKhachHang,
                MaHoaSi = x.MaHoaSi,
                TieuDe = x.TieuDe,
                LoaiTranh = x.LoaiTranh,
                KichThuoc = x.KichThuoc,
                ChuDe = x.ChuDe,
                MauSac = x.MauSac,
                PhongCach = x.PhongCach,
                ChatLieu = x.ChatLieu,
                MoTa = x.MoTa,
                AnhThamKhao = x.AnhThamKhao,
                TienDatCoc = x.TienDatCoc,
                GiaDuKien = x.GiaDuKien,
                TrangThai = x.TrangThai.ToString(),
                NgayTao = x.NgayTao
            })
            .ToList();

        return Ok(result);
    }

    [HttpPost("accept/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult CapNhatNhanYeuCau(int id)
    {
        var request = _requests.FirstOrDefault(x => x.MaYeuCau == id);
        if (request == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu vẽ tranh" });

        request.MaHoaSi = GetCurrentArtistId();
        request.TrangThai = CustomArtStatus.Assigned;
        request.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Đã nhận yêu cầu và chuyển sang trạng thái đang xử lý" });
    }

    [HttpPost("reject/{id}")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult TuChoiYeuCau(int id)
    {
        var request = _requests.FirstOrDefault(x => x.MaYeuCau == id);
        if (request == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu" });

        request.TrangThai = CustomArtStatus.Rejected;
        request.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Đã từ chối yêu cầu" });
    }

    [HttpPost("quote")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult<CustomArtQuoteResponse> TaoBaoGia([FromBody] BaoGiaTranhRequest request)
    {
        var existing = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau);
        if (existing == null)
            return NotFound(new { message = "Yêu cầu không tồn tại" });

        var quote = new CustomArtQuote
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
        existing.TrangThai = CustomArtStatus.Quoted;
        existing.NgayCapNhat = DateTime.UtcNow;

        return Ok(new CustomArtQuoteResponse
        {
            MaBaoGia = quote.MaBaoGia,
            MaYeuCau = quote.MaYeuCau,
            MaHoaSi = quote.MaHoaSi,
            GiaBaoGia = quote.GiaBaoGia,
            ThoiGianHoanThanh = quote.ThoiGianHoanThanh,
            GhiChu = quote.GhiChu,
            TrangThai = quote.TrangThai
        });
    }

    [HttpPost("quote/{quoteId}/accept")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public ActionResult XacNhanBaoGia(int quoteId)
    {
        var quote = _quotes.FirstOrDefault(x => x.MaBaoGia == quoteId);
        if (quote == null)
            return NotFound(new { message = "Báo giá không tồn tại" });

        quote.TrangThai = "CustomerAccepted";

        var request = _requests.FirstOrDefault(x => x.MaYeuCau == quote.MaYeuCau);
        if (request != null)
        {
            request.TrangThai = CustomArtStatus.CustomerAccepted;
            request.NgayCapNhat = DateTime.UtcNow;
        }

        return Ok(new { message = "Khách hàng đã xác nhận báo giá" });
    }

    [HttpPost("deposit")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public ActionResult DatCoc([FromBody] CustomArtPayment payment)
    {
        if (payment.SoTien <= 0)
            return BadRequest(new { message = "Số tiền đặt cọc phải lớn hơn 0" });

        var request = _requests.FirstOrDefault(x => x.MaYeuCau == payment.MaYeuCau);
        if (request == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu" });

        payment.LoaiThanhToan = "DatCoc";
        payment.TrangThai = "Completed";
        _payments.Add(payment);

        request.TienDatCoc = payment.SoTien;
        request.TrangThai = CustomArtStatus.DepositPaid;
        request.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Đặt cọc thành công" });
    }

    [HttpPost("progress")]
    [Authorize(Roles = "Admin,HoaSi")]
    public ActionResult ThemTienDo([FromBody] TaoTienDoRequest request)
    {
        var existing = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau);
        if (existing == null)
            return NotFound(new { message = "Yêu cầu không tồn tại" });

        var progress = new CustomArtProgress
        {
            MaTienDo = _progresses.Count + 1,
            MaYeuCau = request.MaYeuCau,
            TieuDe = request.TieuDe,
            MoTa = request.MoTa,
            AnhPreview = request.AnhPreview,
            TrangThai = request.TrangThai,
            NgayTao = DateTime.UtcNow
        };

        _progresses.Add(progress);
        existing.TrangThai = request.TrangThai == "PreviewSent" ? CustomArtStatus.PreviewSent : CustomArtStatus.InProgress;
        existing.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Cập nhật tiến độ thành công" });
    }

    [HttpPost("feedback")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public ActionResult GuiPhanHoi([FromBody] TaoPhanHoiRequest request)
    {
        var existing = _requests.FirstOrDefault(x => x.MaYeuCau == request.MaYeuCau);
        if (existing == null)
            return NotFound(new { message = "Yêu cầu không tồn tại" });

        var feedback = new CustomArtFeedback
        {
            MaPhanHoi = _feedbacks.Count + 1,
            MaYeuCau = request.MaYeuCau,
            MaKhachHang = GetCurrentCustomerId(),
            MaHoaSi = request.MaHoaSi,
            NoiDung = request.NoiDung,
            LoaiPhanHoi = request.LoaiPhanHoi,
            NgayTao = DateTime.UtcNow
        };

        _feedbacks.Add(feedback);
        existing.TrangThai = CustomArtStatus.RevisionRequested;
        existing.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Đã gửi phản hồi chỉnh sửa" });
    }

    [HttpPost("confirm-complete/{id}")]
    [Authorize(Roles = "Admin,NguoiDung")]
    public ActionResult XacNhanHoanThanh(int id)
    {
        var request = _requests.FirstOrDefault(x => x.MaYeuCau == id);
        if (request == null)
            return NotFound(new { message = "Không tìm thấy yêu cầu" });

        request.TrangThai = CustomArtStatus.Completed;
        request.NgayCapNhat = DateTime.UtcNow;

        return Ok(new { message = "Khách hàng đã xác nhận hoàn thành" });
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
