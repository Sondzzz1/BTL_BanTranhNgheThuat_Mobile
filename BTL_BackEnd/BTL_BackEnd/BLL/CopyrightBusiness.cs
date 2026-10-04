using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class CopyrightBusiness : ICopyrightBusiness
{
    private readonly ICopyrightRepository _repository;
    private readonly CopyrightOptions _options;

    public CopyrightBusiness(
        ICopyrightRepository repository,
        IConfiguration configuration)
    {
        _repository = repository;
        _options = CopyrightOptions.From(configuration);
    }

    public Task<int> Create(int maHoaSi, int maTaiKhoan, TaoBanQuyenRequest request)
    {
        NormalizeAndValidate(request);
        return _repository.Create(maHoaSi, maTaiKhoan, request);
    }

    public Task<BanQuyenResponse?> GetForArtist(int maTacPham, int maHoaSi) =>
        _repository.GetForArtist(maTacPham, maHoaSi);

    public async Task Update(int maBanQuyen, int maHoaSi, int maTaiKhoan, CapNhatBanQuyenRequest request)
    {
        NormalizeAndValidate(request);
        if (!await _repository.Update(maBanQuyen, maHoaSi, maTaiKhoan, request))
            throw new UnauthorizedAccessException("Khai báo không tồn tại hoặc không thuộc họa sĩ hiện tại");
    }

    public Task<int> AddEvidence(int maBanQuyen, int maHoaSi, int maTaiKhoan, CopyrightEvidenceFile file) =>
        _repository.AddEvidence(maBanQuyen, maHoaSi, maTaiKhoan, file);

    public Task<(BangChungBanQuyen Evidence, int ArtistId)?> GetEvidence(int maBanQuyen, int maBangChung) =>
        _repository.GetEvidence(maBanQuyen, maBangChung);

    public async Task<BangChungBanQuyen> DeleteEvidence(int maBanQuyen, int maBangChung, int maHoaSi, int maTaiKhoan) =>
        await _repository.DeleteEvidence(maBanQuyen, maBangChung, maHoaSi, maTaiKhoan)
        ?? throw new KeyNotFoundException("Không tìm thấy bằng chứng hoặc bạn không có quyền xóa");

    public Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword) =>
        _repository.GetForAdmin(status, keyword);

    public async Task<BanQuyenResponse> GetForAdminById(int maBanQuyen) =>
        await _repository.GetForAdminById(maBanQuyen)
        ?? throw new KeyNotFoundException("Không tìm thấy khai báo bản quyền");

    public async Task VerifyInitialQuantity(
        int maTacPham,
        int maTaiKhoan,
        XacMinhSoLuongBanDauRequest request)
    {
        if (maTacPham <= 0) throw new ArgumentException("Mã tác phẩm không hợp lệ");
        if (request.SoLuongBanDau <= 0) throw new ArgumentException("Số lượng ban đầu phải lớn hơn 0");
        request.CanCuXacMinh = Required(request.CanCuXacMinh, "Căn cứ xác minh", 2000);

        if (!await _repository.VerifyInitialQuantity(
                maTacPham,
                maTaiKhoan,
                request.SoLuongBanDau,
                request.CanCuXacMinh))
            throw new KeyNotFoundException("Không tìm thấy tác phẩm");
    }

    public async Task CorrectPublicationDeclaration(
        int maTacPham,
        int maTaiKhoan,
        DieuChinhPhatHanhRequest request)
    {
        if (maTacPham <= 0) throw new ArgumentException("Mã tác phẩm không hợp lệ");
        request.CanCuXacMinh = Required(request.CanCuXacMinh, "Căn cứ hiệu chỉnh", 2000);
        if (!await _repository.CorrectPublicationDeclaration(
                maTacPham, maTaiKhoan, request.LaTacPhamDocBan,
                request.SoLuongBanDau, request.CanCuXacMinh))
            throw new KeyNotFoundException("Không tìm thấy tác phẩm");
    }

    public async Task Review(int maBanQuyen, int maTaiKhoan, byte status, string? note)
    {
        if (status is not (CopyrightStatuses.NeedInfo or CopyrightStatuses.Verified or CopyrightStatuses.Rejected))
            throw new ArgumentException("Trạng thái kiểm duyệt không hợp lệ");
        note = note?.Trim();
        if (status is CopyrightStatuses.NeedInfo or CopyrightStatuses.Rejected && string.IsNullOrWhiteSpace(note))
            throw new ArgumentException("Vui lòng nhập ghi chú khi yêu cầu bổ sung hoặc từ chối");
        if (note?.Length > 1000) throw new ArgumentException("Ghi chú kiểm duyệt không được vượt quá 1000 ký tự");
        if (!await _repository.Review(maBanQuyen, maTaiKhoan, status, note))
            throw new InvalidOperationException("Khai báo không tồn tại hoặc không còn ở trạng thái chờ duyệt");

    }

    public async Task RevokeVerification(int maBanQuyen, int maTaiKhoan, ThuHoiXacMinhRequest request)
    {
        request.LyDo = Required(request.LyDo, "Lý do thu hồi", 1000);
        if (!await _repository.RevokeVerification(maBanQuyen, maTaiKhoan, request.LyDo, request.TamAnTacPham))
            throw new KeyNotFoundException("Không tìm thấy khai báo bản quyền");
    }

    public Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham) => _repository.GetPublic(maTacPham);

    public Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung) =>
        _repository.GetCertificates(maNguoiDung);

    public Task<List<ChungNhanChoCapResponse>> GetPendingCertificates(int maNguoiDung) =>
        _repository.GetPendingCertificates(maNguoiDung);

    public Task<List<ChungNhanResponse>> GetCertificatesForAdmin(string? status, string? keyword) =>
        _repository.GetCertificatesForAdmin(status, keyword);

    public async Task<ChungNhanResponse> GetCertificate(int maChungNhan, int maNguoiDung) =>
        await _repository.GetCertificate(maChungNhan, maNguoiDung)
        ?? throw new UnauthorizedAccessException("Bạn không có quyền xem chứng nhận này");

    public Task<ChungNhanCongKhaiResponse> VerifyCertificate(string code)
    {
        code = Required(code, "Mã chứng nhận", 80).ToUpperInvariant();
        return _repository.VerifyCertificate(code, _options.RequireCertificateKey());
    }

    public async Task RevokeCertificate(int maChungNhan, int maTaiKhoan, string reason)
    {
        reason = Required(reason, "Lý do thu hồi", 1000);
        if (!await _repository.RevokeCertificate(maChungNhan, maTaiKhoan, reason))
            throw new InvalidOperationException("Chứng nhận không tồn tại hoặc không còn hiệu lực");
    }

    public async Task SetCertificateOwnerVisibility(int maChungNhan, int maNguoiDung, bool visible)
    {
        if (!await _repository.SetCertificateOwnerVisibility(maChungNhan, maNguoiDung, visible))
            throw new UnauthorizedAccessException("Bạn không có quyền thay đổi chế độ hiển thị của chứng nhận này");
    }

    public Task<List<CopyrightAuditResponse>> GetAuditLogs(string? objectName, int? objectId)
    {
        objectName = Optional(objectName, "Tên đối tượng", 100);
        if (objectId.HasValue && objectId.Value <= 0) throw new ArgumentException("Mã đối tượng không hợp lệ");
        return _repository.GetAuditLogs(objectName, objectId);
    }

    private static void NormalizeAndValidate(TaoBanQuyenRequest request)
    {
        if (request.MaTacPham <= 0) throw new ArgumentException("Mã tác phẩm không hợp lệ");
        request.TacGia = Required(request.TacGia, "Tác giả", 200);
        request.NguonGoc = Required(request.NguonGoc, "Nguồn gốc", 500);
        request.MoTaBanQuyen = Optional(request.MoTaBanQuyen, "Mô tả bản quyền", 2000);
        request.GhiChu = Optional(request.GhiChu, "Ghi chú", 1000);
        NormalizeOrigin(request);
        ValidateDate(request.NgaySangTac);
    }

    private static void NormalizeAndValidate(CapNhatBanQuyenRequest request)
    {
        request.TacGia = Required(request.TacGia, "Tác giả", 200);
        request.NguonGoc = Required(request.NguonGoc, "Nguồn gốc", 500);
        request.MoTaBanQuyen = Optional(request.MoTaBanQuyen, "Mô tả bản quyền", 2000);
        request.GhiChu = Optional(request.GhiChu, "Ghi chú", 1000);
        NormalizeOrigin(request);
        ValidateDate(request.NgaySangTac);
    }

    private static void NormalizeOrigin(TaoBanQuyenRequest request)
    {
        ValidateArtworkType(request.LoaiTacPham);
        request.TacGiaGoc = Optional(request.TacGiaGoc, "Tác giả gốc", 255);
        request.MoTaNguonGoc = Optional(request.MoTaNguonGoc, "Mô tả nguồn gốc", 4000);
        request.NguonThamKhao = Optional(request.NguonThamKhao, "Nguồn tham khảo", 1000);
        request.SoDangKy = Optional(request.SoDangKy, "Số đăng ký", 100);
        ValidateUsageBasis(request.CanCuSuDung);
        ValidateDerivativeOrigin(request.LoaiTacPham, request.TacGiaGoc, request.MaTacPhamGoc, request.MoTaNguonGoc);
    }

    private static void NormalizeOrigin(CapNhatBanQuyenRequest request)
    {
        ValidateArtworkType(request.LoaiTacPham);
        request.TacGiaGoc = Optional(request.TacGiaGoc, "Tác giả gốc", 255);
        request.MoTaNguonGoc = Optional(request.MoTaNguonGoc, "Mô tả nguồn gốc", 4000);
        request.NguonThamKhao = Optional(request.NguonThamKhao, "Nguồn tham khảo", 1000);
        request.SoDangKy = Optional(request.SoDangKy, "Số đăng ký", 100);
        ValidateUsageBasis(request.CanCuSuDung);
        ValidateDerivativeOrigin(request.LoaiTacPham, request.TacGiaGoc, request.MaTacPhamGoc, request.MoTaNguonGoc);
    }

    private static void ValidateArtworkType(byte value)
    {
        if (value > 4) throw new ArgumentException("Loại tác phẩm không hợp lệ");
    }

    private static void ValidateUsageBasis(byte? value)
    {
        if (!CopyrightUsageBases.IsValid(value))
            throw new ArgumentException("Vui lòng chọn căn cứ sử dụng hợp lệ");
    }

    private static void ValidateDerivativeOrigin(byte type, string? originalAuthor, int? originalArtworkId, string? originDescription)
    {
        if (type == 2 && string.IsNullOrWhiteSpace(originalAuthor) && originalArtworkId is null
            && string.IsNullOrWhiteSpace(originDescription))
            throw new ArgumentException("Phiên bản vẽ lại phải khai báo tác giả gốc, tác phẩm gốc hoặc mô tả nguồn gốc");
        if (originalArtworkId <= 0) throw new ArgumentException("Mã tác phẩm gốc không hợp lệ");
    }

    private static void ValidateDate(DateTime? date)
    {
        if (date?.Date > DateTime.UtcNow.Date)
            throw new ArgumentException("Ngày sáng tác không được ở tương lai");
    }

    private static string Required(string? value, string field, int maxLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized)) throw new ArgumentException($"{field} không được để trống");
        if (normalized.Length > maxLength) throw new ArgumentException($"{field} không được vượt quá {maxLength} ký tự");
        return normalized;
    }

    private static string? Optional(string? value, string field, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (normalized?.Length > maxLength) throw new ArgumentException($"{field} không được vượt quá {maxLength} ký tự");
        return normalized;
    }
}
