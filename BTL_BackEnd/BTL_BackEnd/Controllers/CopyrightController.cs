using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/ban-quyen")]
public class CopyrightController : ControllerBase
{
    private readonly ICopyrightBusiness _business;
    private readonly CopyrightFileHelper _files;

    public CopyrightController(ICopyrightBusiness business, CopyrightFileHelper files)
    {
        _business = business;
        _files = files;
    }

    [HttpPost]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> Create([FromBody] TaoBanQuyenRequest request)
    {
        var artistId = JwtHelper.GetMaHoaSi(User);
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!artistId.HasValue || !accountId.HasValue) return Unauthorized(new { message = "Token thiếu thông tin họa sĩ" });
        return Ok(new { maBanQuyen = await _business.Create(artistId.Value, accountId.Value, request) });
    }

    [HttpGet("tac-pham/{artworkId:int}")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> GetForArtist(int artworkId)
    {
        var artistId = JwtHelper.GetMaHoaSi(User);
        if (!artistId.HasValue) return Unauthorized(new { message = "Token thiếu thông tin họa sĩ" });
        var result = await _business.GetForArtist(artworkId, artistId.Value);
        return result == null ? NotFound(new { message = "Chưa có khai báo bản quyền" }) : Ok(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> Update(int id, [FromBody] CapNhatBanQuyenRequest request)
    {
        var artistId = JwtHelper.GetMaHoaSi(User);
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!artistId.HasValue || !accountId.HasValue) return Unauthorized(new { message = "Token thiếu thông tin họa sĩ" });
        await _business.Update(id, artistId.Value, accountId.Value, request);
        return Ok(new { message = "Đã cập nhật khai báo" });
    }

    [HttpPost("{id:int}/bang-chung")]
    [Authorize(Roles = "HoaSi")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult> AddEvidence(int id, [FromForm] IFormFile file, [FromForm] string? moTa,
        CancellationToken cancellationToken)
    {
        var artistId = JwtHelper.GetMaHoaSi(User);
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!artistId.HasValue || !accountId.HasValue) return Unauthorized(new { message = "Token thiếu thông tin họa sĩ" });
        var hash = await CopyrightFileHelper.ComputeSha256Async(file, cancellationToken);
        string? storedName = null;
        try
        {
            storedName = await _files.SaveAsync(file, cancellationToken);
            var evidenceId = await _business.AddEvidence(id, artistId.Value, accountId.Value,
                new CopyrightEvidenceFile(file.FileName, storedName, storedName, file.ContentType, file.Length, hash, moTa?.Trim()));
            return Ok(new { maBangChung = evidenceId, sha256 = hash });
        }
        catch
        {
            _files.DeleteIfExists(storedName);
            throw;
        }
    }

    [HttpDelete("{id:int}/bang-chung/{evidenceId:int}")]
    [Authorize(Roles = "HoaSi")]
    public async Task<ActionResult> DeleteEvidence(int id, int evidenceId)
    {
        var artistId = JwtHelper.GetMaHoaSi(User);
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!artistId.HasValue || !accountId.HasValue) return Unauthorized(new { message = "Token thiếu thông tin họa sĩ" });
        var evidence = await _business.DeleteEvidence(id, evidenceId, artistId.Value, accountId.Value);
        _files.DeleteIfExists(evidence.TenTepLuu);
        return Ok(new { message = "Đã xóa bằng chứng" });
    }

    [HttpGet("{id:int}/bang-chung/{evidenceId:int}/tep")]
    [Authorize(Roles = "Admin,HoaSi")]
    public async Task<IActionResult> DownloadEvidence(int id, int evidenceId)
    {
        var result = await _business.GetEvidence(id, evidenceId);
        if (result == null) return NotFound(new { message = "Không tìm thấy bằng chứng" });
        if (!JwtHelper.IsAdmin(User) && JwtHelper.GetMaHoaSi(User) != result.Value.ArtistId)
            return Forbid();
        var file = _files.OpenRead(result.Value.Evidence.TenTepLuu);
        return File(file.Stream, file.ContentType, result.Value.Evidence.TenTepGoc, enableRangeProcessing: true);
    }

    [HttpGet("cong-khai/tac-pham/{artworkId:int}")]
    [AllowAnonymous]
    [EnableRateLimiting("public-certificate")]
    public async Task<ActionResult> GetPublic(int artworkId) => Ok(await _business.GetPublic(artworkId));

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetForAdmin([FromQuery] string? status, [FromQuery] string? keyword) =>
        Ok(await _business.GetForAdmin(status, keyword));

    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetForAdminById(int id) => Ok(await _business.GetForAdminById(id));

    [HttpGet("admin/tac-pham/{artworkId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetForAdminByArtworkId(int artworkId)
    {
        var result = await _business.GetForAdminByArtworkId(artworkId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("admin/nhat-ky")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Audit([FromQuery] string? objectName, [FromQuery] int? objectId) =>
        Ok(await _business.GetAuditLogs(objectName, objectId));

    [HttpPost("admin/tac-pham/{artworkId:int}/xac-minh-so-luong-ban-dau")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> VerifyInitialQuantity(
        int artworkId,
        [FromBody] XacMinhSoLuongBanDauRequest request)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _business.VerifyInitialQuantity(artworkId, accountId.Value, request);
        return Ok(new
        {
            message = "Đã đối soát số lượng ban đầu; tồn kho và cờ độc bản được giữ nguyên"
        });
    }

    [HttpPost("admin/tac-pham/{artworkId:int}/dieu-chinh-phat-hanh")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CorrectPublicationDeclaration(
        int artworkId,
        [FromBody] DieuChinhPhatHanhRequest request)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _business.CorrectPublicationDeclaration(artworkId, accountId.Value, request);
        return Ok(new { message = "Đã hiệu chỉnh loại phát hành. Hồ sơ đã xác minh trước đó (nếu có) phải được xác minh lại." });
    }

    [HttpPost("admin/{id:int}/yeu-cau-bo-sung")]
    [Authorize(Roles = "Admin")]
    public Task<ActionResult> NeedInfo(int id, [FromBody] KiemDuyetBanQuyenRequest request) =>
        Review(id, CopyrightStatuses.NeedInfo, request.GhiChu);

    [HttpPost("admin/{id:int}/xac-minh")]
    [Authorize(Roles = "Admin")]
    public Task<ActionResult> Verify(int id, [FromBody] KiemDuyetBanQuyenRequest request) =>
        Review(id, CopyrightStatuses.Verified, request.GhiChu);

    [HttpPost("admin/{id:int}/tu-choi")]
    [Authorize(Roles = "Admin")]
    public Task<ActionResult> Reject(int id, [FromBody] KiemDuyetBanQuyenRequest request) =>
        Review(id, CopyrightStatuses.Rejected, request.GhiChu);

    [HttpPost("admin/{id:int}/thu-hoi-xac-minh")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> RevokeVerification(int id, [FromBody] ThuHoiXacMinhRequest request)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _business.RevokeVerification(id, accountId.Value, request);
        return Ok(new { message = "Đã thu hồi xác minh và chặn bán tác phẩm" });
    }

    private async Task<ActionResult> Review(int id, byte status, string? note)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _business.Review(id, accountId.Value, status, note);
        return Ok(new { message = "Đã cập nhật kết quả kiểm duyệt" });
    }
}

[ApiController]
[Route("api/chung-nhan")]
public class CertificateController : ControllerBase
{
    private readonly ICopyrightBusiness _business;
    private readonly CertificateDocumentService _documents;

    public CertificateController(ICopyrightBusiness business, CertificateDocumentService documents)
    {
        _business = business;
        _documents = documents;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminList([FromQuery] string? status, [FromQuery] string? keyword) =>
        Ok(await _business.GetCertificatesForAdmin(status, keyword));

    [HttpGet("cua-toi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> Mine()
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        return ownerId.HasValue
            ? Ok(await _business.GetCertificates(ownerId.Value))
            : Unauthorized(new { message = "Token thiếu mã người dùng" });
    }

    /// <summary>
    /// Các tranh độc bản đã giao của chính khách hàng nhưng chưa có chứng nhận,
    /// kèm điều kiện còn thiếu. Chỉ đọc, không kích hoạt cấp chứng nhận.
    /// </summary>
    [HttpGet("tinh-trang-cua-toi")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> MyPendingStatuses()
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        return ownerId.HasValue
            ? Ok(await _business.GetPendingCertificates(ownerId.Value))
            : Unauthorized(new { message = "Token thiếu mã người dùng" });
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> Detail(int id)
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        return ownerId.HasValue
            ? Ok(await _business.GetCertificate(id, ownerId.Value))
            : Unauthorized(new { message = "Token thiếu mã người dùng" });
    }

    [HttpGet("xac-minh/{code}")]
    [AllowAnonymous]
    [EnableRateLimiting("public-certificate")]
    public async Task<ActionResult> PublicVerify(string code) => Ok(await _business.VerifyCertificate(code));

    [HttpGet("xac-minh/{code}/pdf")]
    [AllowAnonymous]
    [EnableRateLimiting("public-certificate")]
    public async Task<IActionResult> PublicPdf(string code)
    {
        var certificate = await _business.VerifyCertificate(code);
        if (!certificate.TimThay) return NotFound(new { message = "Không tìm thấy chứng nhận" });
        if (!certificate.ToanVen) return Conflict(new { message = "Dữ liệu chứng nhận không toàn vẹn" });
        var printable = new ChungNhanResponse
        {
            MaChungNhanCongKhai = certificate.MaChungNhan,
            TenTacPham = certificate.TenTacPham ?? string.Empty,
            TacGia = certificate.HoaSiThucHien ?? string.Empty,
            ChuSoHuu = certificate.ChuSoHuuHienThi ?? "Không công khai",
            NgayCap = certificate.NgayCap ?? DateTime.MinValue,
            TrangThai = certificate.TrangThai,
            LoaiTacPham = certificate.LoaiTacPham ?? 0,
            LoaiTacPhamText = certificate.LoaiTacPhamText ?? string.Empty,
            TacGiaGoc = certificate.TacGiaGoc
        };
        // Không truyền tên tệp để trình duyệt/Safari hiển thị PDF trực tiếp thay vì
        // cố tải xuống một attachment không có trình xem trong ứng dụng Mobile.
        return File(_documents.CreatePdf(printable), "application/pdf");
    }

    [HttpGet("{id:int}/qr")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<IActionResult> Qr(int id)
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        if (!ownerId.HasValue) return Unauthorized(new { message = "Token thiếu mã người dùng" });
        var certificate = await _business.GetCertificate(id, ownerId.Value);
        return File(_documents.CreateQr(certificate.MaChungNhanCongKhai), "image/png",
            $"{certificate.MaChungNhanCongKhai}.png");
    }

    [HttpGet("{id:int}/pdf")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<IActionResult> Pdf(int id)
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        if (!ownerId.HasValue) return Unauthorized(new { message = "Token thiếu mã người dùng" });
        var certificate = await _business.GetCertificate(id, ownerId.Value);
        return File(_documents.CreatePdf(certificate), "application/pdf",
            $"{certificate.MaChungNhanCongKhai}.pdf");
    }

    [HttpPut("{id:int}/hien-thi-chu-so-huu")]
    [Authorize(Roles = "NguoiDung")]
    public async Task<ActionResult> SetVisibility(int id, [FromBody] CertificateVisibilityRequest request)
    {
        var ownerId = JwtHelper.GetMaNguoiDung(User);
        if (!ownerId.HasValue) return Unauthorized(new { message = "Token thiếu mã người dùng" });
        await _business.SetCertificateOwnerVisibility(id, ownerId.Value, request.HienThi);
        return Ok(new { message = "Đã cập nhật quyền riêng tư" });
    }

    [HttpPost("admin/{id:int}/thu-hoi")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Revoke(int id, [FromBody] CertificateRevokeRequest request)
    {
        var accountId = JwtHelper.GetMaTaiKhoan(User);
        if (!accountId.HasValue) return Unauthorized(new { message = "Token thiếu mã tài khoản" });
        await _business.RevokeCertificate(id, accountId.Value, request.LyDo);
        return Ok(new { message = "Đã thu hồi chứng nhận" });
    }
}

public sealed class CertificateVisibilityRequest
{
    public bool HienThi { get; set; }
}

public sealed class CertificateRevokeRequest
{
    public string LyDo { get; set; } = string.Empty;
}
