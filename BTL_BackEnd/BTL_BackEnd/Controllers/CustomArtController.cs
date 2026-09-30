using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/tranh-theo-yeu-cau")]
[Authorize]
public class CustomArtController : ControllerBase
{
    private readonly ICustomArtBusiness _customArtBusiness;
    private readonly CommissionFileHelper _fileHelper;

    public CustomArtController(ICustomArtBusiness customArtBusiness, CommissionFileHelper fileHelper)
    {
        _customArtBusiness = customArtBusiness;
        _fileHelper = fileHelper;
    }

    [HttpPost("tao-yeu-cau-co-tep")]
    [Authorize(Roles = "NguoiDung")]
    [RequestSizeLimit(16 * 1024 * 1024)]
    public async Task<ActionResult<CustomArtRequestResponse>> TaoYeuCauCoTep([FromForm] TaoYeuCauTranhForm form, CancellationToken cancellationToken)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });

        var savedFiles = new List<string>();
        try
        {
            if (form.AnhThamKhaoFile != null)
            {
                form.AnhThamKhao = await _fileHelper.SaveAsync(form.AnhThamKhaoFile, "reference", cancellationToken);
                savedFiles.Add(form.AnhThamKhao);
            }
            if (form.AnhTacPhamGocFile != null)
            {
                form.ReferenceImageUrl = await _fileHelper.SaveAsync(form.AnhTacPhamGocFile, "source", cancellationToken);
                savedFiles.Add(form.ReferenceImageUrl);
            }
            if (form.BangChungQuyenSuDungFile != null)
            {
                form.BangChungQuyenSuDung = await _fileHelper.SaveAsync(form.BangChungQuyenSuDungFile, "evidence", cancellationToken);
                savedFiles.Add(form.BangChungQuyenSuDung);
            }
            var result = await _customArtBusiness.TaoYeuCau(maKhachHang.Value, form);
            var retainedFiles = new[] { form.AnhThamKhao, form.ReferenceImageUrl, form.BangChungQuyenSuDung }
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var savedFile in savedFiles.Where(file => !retainedFiles.Contains(file)))
                _fileHelper.DeleteIfExists(savedFile);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            savedFiles.ForEach(_fileHelper.DeleteIfExists);
            return BadRequest(new { message = ex.Message });
        }
        catch
        {
            savedFiles.ForEach(_fileHelper.DeleteIfExists);
            throw;
        }
    }

    [HttpPost("tao-yeu-cau")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<CustomArtRequestResponse>> TaoYeuCau([FromBody] TaoYeuCauTranhRequest request)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await Execute(() => _customArtBusiness.TaoYeuCau(maKhachHang.Value, request));
    }

    [HttpGet("yeu-cau-cua-toi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayYeuCauCuaToi()
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return Ok(await _customArtBusiness.LayYeuCauCuaToi(maKhachHang.Value));
    }

    [HttpGet("yeu-cau/{id:int}")]
    public async Task<ActionResult<CustomArtRequestResponse>> LayChiTiet(int id)
    {
        try
        {
            var result = await _customArtBusiness.LayChiTiet(
                id,
                JwtHelper.GetMaNguoiDung(User),
                JwtHelper.GetMaHoaSi(User),
                JwtHelper.IsAdmin(User));
            return result == null ? NotFound(new { message = "Không tìm thấy yêu cầu" }) : Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    [HttpPut("yeu-cau/{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> CapNhatYeuCau(int id, [FromBody] CapNhatYeuCauTranhRequest request)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.CapNhatYeuCau(id, maKhachHang.Value, request),
            "Cập nhật yêu cầu thành công",
            "Yêu cầu không tồn tại, đã được họa sĩ nhận hoặc không còn được phép sửa");
    }

    [HttpPost("yeu-cau/{id:int}/huy")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> HuyYeuCau(int id)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.HuyYeuCau(id, maKhachHang.Value),
            "Đã hủy yêu cầu",
            "Yêu cầu không tồn tại, đã được họa sĩ nhận hoặc không thể hủy");
    }

    [HttpPost("yeu-cau/{id:int}/tep/{kind}")]
    [Authorize(Roles = "NguoiDung")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult> TaiTep(int id, string kind, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        string? savedName = null;
        try
        {
            savedName = await _fileHelper.SaveAsync(file, kind, cancellationToken);
            var updated = await _customArtBusiness.LuuDuongDanTep(id, maKhachHang.Value, kind, savedName);
            if (!updated)
            {
                _fileHelper.DeleteIfExists(savedName);
                return Conflict(new { message = "Yêu cầu không tồn tại, đã được nhận hoặc không còn được sửa" });
            }
            return Ok(new { message = "Tải tệp thành công", url = $"/api/tranh-theo-yeu-cau/yeu-cau/{id}/tep/{kind}" });
        }
        catch (ArgumentException ex)
        {
            _fileHelper.DeleteIfExists(savedName);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("yeu-cau/{id:int}/tep/{kind}")]
    public async Task<IActionResult> XemTep(int id, string kind)
    {
        try
        {
            var storedName = await _customArtBusiness.LayDuongDanTep(
                id, kind, JwtHelper.GetMaNguoiDung(User), JwtHelper.GetMaHoaSi(User), JwtHelper.IsAdmin(User));
            if (string.IsNullOrWhiteSpace(storedName)) return NotFound(new { message = "Yêu cầu chưa có tệp này" });
            if (Uri.TryCreate(storedName, UriKind.Absolute, out var externalUri)) return Redirect(externalUri.ToString());
            var file = _fileHelper.OpenRead(storedName);
            return File(file.Stream, file.ContentType, enableRangeProcessing: true);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Tệp không còn tồn tại trên máy chủ" });
        }
    }

    [HttpGet("admin/danh-sach")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayYeuCauChoAdmin([FromQuery] string? type, [FromQuery] string? status) =>
        await Execute(() => _customArtBusiness.LayYeuCauChoAdmin(type, status));

    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public Task<ActionResult<CustomArtRequestResponse>> LayChiTietAdmin(int id) => LayChiTiet(id);

    [HttpPost("admin/{id:int}/duyet")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DuyetYeuCau(int id, [FromBody] XuLyYeuCauRequest request)
    {
        var adminId = JwtHelper.GetMaTaiKhoan(User);
        if (!adminId.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
        return await ExecuteBoolean(
            () => _customArtBusiness.DuyetYeuCau(id, adminId.Value, request.GhiChu),
            "Đã duyệt yêu cầu",
            "Yêu cầu không ở trạng thái có thể duyệt");
    }

    [HttpPost("admin/{id:int}/yeu-cau-quyen-su-dung")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> YeuCauQuyenSuDung(int id, [FromBody] XuLyYeuCauRequest request)
    {
        var adminId = JwtHelper.GetMaTaiKhoan(User);
        if (!adminId.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
        return await ExecuteBoolean(
            () => _customArtBusiness.YeuCauBoSungQuyen(id, adminId.Value, request.GhiChu),
            "Đã yêu cầu bổ sung quyền sử dụng",
            "Yêu cầu không ở trạng thái có thể xử lý");
    }

    [HttpPost("admin/{id:int}/tu-choi")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> TuChoiYeuCauAdmin(int id, [FromBody] XuLyYeuCauRequest request)
    {
        var adminId = JwtHelper.GetMaTaiKhoan(User);
        if (!adminId.HasValue) return Unauthorized(new { message = "Token không có MaTaiKhoan" });
        return await ExecuteBoolean(
            () => _customArtBusiness.TuChoiYeuCau(id, adminId.Value, request.GhiChu),
            "Đã từ chối yêu cầu",
            "Yêu cầu không ở trạng thái có thể từ chối");
    }

    [HttpGet("hoa-si/danh-sach")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayYeuCauChoHoaSi()
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        return Ok(await _customArtBusiness.LayYeuCauChoHoaSi(maHoaSi.Value));
    }

    [HttpGet("hoa-si/{id:int}")]
    [Authorize(Roles = "HoaSi")]
    public Task<ActionResult<CustomArtRequestResponse>> LayChiTietHoaSi(int id) => LayChiTiet(id);

    [HttpPost("nhan-yeu-cau/{id:int}")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> NhanYeuCau(int id)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        var success = await _customArtBusiness.NhanYeuCau(id, maHoaSi.Value);
        return success
            ? Ok(new { message = "Đã nhận yêu cầu" })
            : Conflict(new { message = "Yêu cầu chưa được duyệt, đã có họa sĩ nhận hoặc không tồn tại" });
    }

    [HttpPut("hoa-si/{id:int}/trang-thai")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> CapNhatTrangThai(int id, [FromBody] CapNhatTrangThaiYeuCauRequest request)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        return await ExecuteBoolean(
            () => _customArtBusiness.CapNhatTrangThai(id, maHoaSi.Value, request.TrangThai),
            "Cập nhật trạng thái thành công",
            "Yêu cầu không thuộc họa sĩ hoặc không ở trạng thái hợp lệ");
    }

    [HttpPost("hoa-si/{id:int}/hoan-thanh")]
    [Authorize(Roles = "HoaSi")]
    public ActionResult HoanThanhYeuCauCu(int id)
    {
        return BadRequest(new { message = "Hoàn thành tác phẩm bắt buộc tải ảnh qua endpoint multipart /hoan-thanh-co-tep" });
    }

    [HttpPost("hoa-si/{id:int}/hoan-thanh-co-tep")]
    [Authorize(Roles = "HoaSi")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult> HoanThanhYeuCauCoTep(
        int id,
        [FromForm] HoanThanhYeuCauForm request,
        CancellationToken cancellationToken)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        if (request.AnhTacPhamFile == null)
            return BadRequest(new { message = "Ảnh tác phẩm hoàn thiện là bắt buộc" });

        string? savedName = null;
        try
        {
            savedName = await _fileHelper.SaveAsync(request.AnhTacPhamFile, "final-artwork", cancellationToken);
            request.HinhAnhTacPham = savedName;
            var artworkId = await _customArtBusiness.HoanThanhYeuCau(id, maHoaSi.Value, request);
            if (!artworkId.HasValue)
            {
                _fileHelper.DeleteIfExists(savedName);
                return Conflict(new { message = "Yêu cầu không thuộc họa sĩ hoặc không ở trạng thái IN_PROGRESS" });
            }
            return Ok(new { message = "Đã lưu tác phẩm hoàn thiện", maTacPham = artworkId.Value });
        }
        catch (ArgumentException ex)
        {
            _fileHelper.DeleteIfExists(savedName);
            return BadRequest(new { message = ex.Message });
        }
        catch
        {
            _fileHelper.DeleteIfExists(savedName);
            throw;
        }
    }

    // Route cũ được giữ để không làm hỏng Web hiện tại, nhưng kết quả vẫn lọc theo role/JWT.
    [HttpGet("danh-sach-yeu-cau")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<ActionResult<List<CustomArtRequestResponse>>> LayDanhSachTuongThich()
    {
        if (JwtHelper.IsAdmin(User)) return Ok(await _customArtBusiness.LayYeuCauChoAdmin(null, null));
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        return Ok(await _customArtBusiness.LayYeuCauChoHoaSi(maHoaSi.Value));
    }

    [HttpPost("tao-bao-gia")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult<CustomArtQuoteResponse>> TaoBaoGia([FromBody] BaoGiaTranhRequest request)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        return await Execute(() => _customArtBusiness.TaoBaoGia(request, maHoaSi.Value));
    }

    [HttpPost("bao-gia/{quoteId:int}/xac-nhan")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> XacNhanBaoGia(int quoteId)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.XacNhanBaoGia(quoteId, maKhachHang.Value),
            "Đã xác nhận báo giá",
            "Báo giá không tồn tại hoặc không thuộc khách hàng");
    }

    [HttpPost("dat-coc")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> DatCoc([FromBody] CustomArtPayment payment)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.DatCoc(payment.MaYeuCau, maKhachHang.Value, payment.SoTien),
            "Đặt cọc thành công",
            "Yêu cầu không tồn tại hoặc không thuộc khách hàng");
    }

    [HttpPost("cap-nhat-tien-do")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> ThemTienDo([FromBody] TaoTienDoRequest request)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        return await ExecuteBoolean(
            () => _customArtBusiness.ThemTienDo(request, maHoaSi.Value),
            "Cập nhật tiến độ thành công",
            "Yêu cầu không tồn tại hoặc không thuộc họa sĩ");
    }

    [HttpPost("hoa-si/{id:int}/tien-do-co-tep")]
    [Authorize(Roles = "HoaSi")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult> ThemTienDoCoTep(
        int id,
        [FromForm] TaoTienDoForm request,
        CancellationToken cancellationToken)
    {
        var maHoaSi = RequireArtistId();
        if (!maHoaSi.HasValue) return Unauthorized(new { message = "Token không có MaHoaSi" });
        string? savedName = null;
        try
        {
            request.MaYeuCau = id;
            if (request.AnhPreviewFile != null)
            {
                savedName = await _fileHelper.SaveAsync(request.AnhPreviewFile, "progress", cancellationToken);
                request.AnhPreview = savedName;
            }
            if (!await _customArtBusiness.ThemTienDo(request, maHoaSi.Value))
            {
                _fileHelper.DeleteIfExists(savedName);
                return Conflict(new { message = "Yêu cầu chưa bắt đầu, không tồn tại hoặc không thuộc họa sĩ" });
            }
            return Ok(new { message = "Cập nhật tiến độ thành công" });
        }
        catch (ArgumentException ex)
        {
            _fileHelper.DeleteIfExists(savedName);
            return BadRequest(new { message = ex.Message });
        }
        catch
        {
            _fileHelper.DeleteIfExists(savedName);
            throw;
        }
    }

    [HttpGet("yeu-cau/{id:int}/tien-do/{progressId:int}/tep")]
    public async Task<IActionResult> XemTepTienDo(int id, int progressId)
    {
        try
        {
            var storedName = await _customArtBusiness.LayTepTienDo(
                id, progressId, JwtHelper.GetMaNguoiDung(User), JwtHelper.GetMaHoaSi(User), JwtHelper.IsAdmin(User));
            if (string.IsNullOrWhiteSpace(storedName)) return NotFound(new { message = "Tiến độ chưa có ảnh" });
            if (Uri.TryCreate(storedName, UriKind.Absolute, out var externalUri)) return Redirect(externalUri.ToString());
            var file = _fileHelper.OpenRead(storedName);
            return File(file.Stream, file.ContentType, enableRangeProcessing: true);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Ảnh tiến độ không còn tồn tại trên máy chủ" });
        }
    }

    [HttpPost("gui-phan-hoi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> GuiPhanHoi([FromBody] TaoPhanHoiRequest request)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.GuiPhanHoi(request, maKhachHang.Value),
            "Đã gửi phản hồi",
            "Yêu cầu không tồn tại hoặc không thuộc khách hàng");
    }

    [HttpPost("xac-nhan-hoan-thanh/{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> XacNhanHoanThanh(int id)
    {
        var maKhachHang = RequireCustomerId();
        if (!maKhachHang.HasValue) return Unauthorized(new { message = "Token không có MaNguoiDung" });
        return await ExecuteBoolean(
            () => _customArtBusiness.XacNhanHoanThanh(id, maKhachHang.Value),
            "Đã xác nhận hoàn thành",
            "Yêu cầu không tồn tại, không thuộc khách hàng hoặc chưa thể hoàn thành");
    }

    private int? RequireCustomerId() => JwtHelper.GetMaNguoiDung(User);
    private int? RequireArtistId() => JwtHelper.GetMaHoaSi(User);

    private async Task<ActionResult<T>> Execute<T>(Func<Task<T>> action)
    {
        try { return Ok(await action()); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message }); }
    }

    private async Task<ActionResult> ExecuteBoolean(Func<Task<bool>> action, string successMessage, string failureMessage)
    {
        try { return await action() ? Ok(new { message = successMessage }) : Conflict(new { message = failureMessage }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message }); }
    }
}
