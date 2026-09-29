using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using System.Globalization;

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
        var validation = ValidateAndNormalize(request);
        var result = await _customArtRepo.CreateRequest(maKhachHang, request, validation.Status, validation.Permission);
        return MapRequest(result);
    }

    public async Task<List<CustomArtRequestResponse>> LayYeuCauCuaToi(int maKhachHang) =>
        (await _customArtRepo.GetByCustomer(maKhachHang)).Select(MapRequest).ToList();

    public async Task<List<CustomArtRequestResponse>> LayYeuCauChoAdmin(string? type, string? status)
    {
        CustomArtType? parsedType = string.IsNullOrWhiteSpace(type) ? null : NormalizeType(type);
        CustomArtStatus? parsedStatus = string.IsNullOrWhiteSpace(status) ? null : NormalizeStatusFilter(status);
        return (await _customArtRepo.GetForAdmin(parsedType, parsedStatus)).Select(MapRequest).ToList();
    }

    public async Task<List<CustomArtRequestResponse>> LayYeuCauChoHoaSi(int maHoaSi) =>
        (await _customArtRepo.GetForArtist(maHoaSi)).Select(MapRequest).ToList();

    public async Task<CustomArtRequestResponse?> LayChiTiet(int maYeuCau, int? maNguoiDung, int? maHoaSi, bool isAdmin)
    {
        var item = await _customArtRepo.GetById(maYeuCau);
        if (item == null) return null;

        var mayView = isAdmin
            || (maNguoiDung.HasValue && item.MaKhachHang == maNguoiDung.Value)
            || (maHoaSi.HasValue && (item.MaHoaSi == maHoaSi.Value || item.TrangThai == CustomArtStatus.PendingArtist));
        if (!mayView) throw new UnauthorizedAccessException("Bạn không có quyền xem yêu cầu này");
        var response = MapRequest(item);
        var quote = await _customArtRepo.GetLatestQuoteByRequest(maYeuCau);
        response.Quote = quote == null ? null : MapQuote(quote);
        response.Progress = (await _customArtRepo.GetProgressByRequest(maYeuCau)).Select(MapProgress).ToList();
        return response;
    }

    public async Task<bool> CapNhatYeuCau(int maYeuCau, int maKhachHang, CapNhatYeuCauTranhRequest request)
    {
        var validation = ValidateAndNormalize(request);
        return await _customArtRepo.UpdateByCustomer(maYeuCau, maKhachHang, request, validation.Status, validation.Permission);
    }

    public Task<bool> HuyYeuCau(int maYeuCau, int maKhachHang) =>
        _customArtRepo.CancelByCustomer(maYeuCau, maKhachHang);

    public Task<bool> NhanYeuCau(int maYeuCau, int maHoaSi) =>
        _customArtRepo.AssignRequest(maYeuCau, maHoaSi);

    public Task<bool> DuyetYeuCau(int maYeuCau, int maTaiKhoan, string? note) =>
        _customArtRepo.ReviewRequest(maYeuCau, maTaiKhoan, CustomArtStatus.PendingArtist, note);

    public Task<bool> YeuCauBoSungQuyen(int maYeuCau, int maTaiKhoan, string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            throw new ArgumentException("Ghi chú yêu cầu bổ sung quyền sử dụng không được để trống");
        return _customArtRepo.ReviewRequest(maYeuCau, maTaiKhoan, CustomArtStatus.WaitingPermission, note.Trim());
    }

    public Task<bool> TuChoiYeuCau(int maYeuCau, int maTaiKhoan, string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            throw new ArgumentException("Lý do từ chối không được để trống");
        return _customArtRepo.ReviewRequest(maYeuCau, maTaiKhoan, CustomArtStatus.Rejected, note.Trim());
    }

    public Task<bool> CapNhatTrangThai(int maYeuCau, int maHoaSi, string status)
    {
        if (!status.Equals("IN_PROGRESS", StringComparison.OrdinalIgnoreCase) &&
            !status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Artist chỉ có thể chuyển yêu cầu sang IN_PROGRESS tại API này");
        return _customArtRepo.UpdateArtistStatus(maYeuCau, maHoaSi, CustomArtStatus.InProgress);
    }

    public Task<int?> HoanThanhYeuCau(int maYeuCau, int maHoaSi, HoanThanhYeuCauRequest request) =>
        _customArtRepo.CompleteRequest(maYeuCau, maHoaSi, request);

    public async Task<CustomArtQuoteResponse> TaoBaoGia(BaoGiaTranhRequest request, int maHoaSi)
    {
        if (request.GiaBaoGia <= 0) throw new ArgumentException("Giá báo giá phải lớn hơn 0");
        if (!DateOnly.TryParseExact(request.ThoiGianHoanThanh?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var completionDate))
            throw new ArgumentException("Ngày hoàn thành dự kiến phải có định dạng YYYY-MM-DD");
        if (completionDate < DateOnly.FromDateTime(DateTime.Today))
            throw new ArgumentException("Ngày hoàn thành dự kiến không được ở trong quá khứ");
        request.ThoiGianHoanThanh = completionDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var item = await _customArtRepo.GetById(request.MaYeuCau);
        if (item == null || item.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Bạn không phụ trách yêu cầu này");
        if (item.TrangThai is not (CustomArtStatus.Assigned or CustomArtStatus.Quoted))
            throw new ArgumentException("Chỉ có thể báo giá sau khi nhận yêu cầu và trước khi khách hàng chấp nhận");

        return MapQuote(await _customArtRepo.CreateQuote(request, maHoaSi));
    }

    public Task<bool> XacNhanBaoGia(int maBaoGia, int maKhachHang) =>
        _customArtRepo.ConfirmQuote(maBaoGia, maKhachHang);

    public Task<bool> DatCoc(int maYeuCau, int maKhachHang, decimal soTien)
    {
        if (soTien <= 0) throw new ArgumentException("Số tiền đặt cọc không hợp lệ");
        return _customArtRepo.CreateDeposit(maYeuCau, maKhachHang, soTien);
    }

    public async Task<bool> ThemTienDo(TaoTienDoRequest request, int maHoaSi)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe) || string.IsNullOrWhiteSpace(request.MoTa))
            throw new ArgumentException("Tiêu đề và mô tả tiến độ không được để trống");
        return await _customArtRepo.CreateProgress(request, maHoaSi);
    }

    public async Task<string?> LayTepTienDo(int maYeuCau, int maTienDo, int? maNguoiDung, int? maHoaSi, bool isAdmin)
    {
        _ = await LayChiTiet(maYeuCau, maNguoiDung, maHoaSi, isAdmin);
        var progress = await _customArtRepo.GetProgressById(maYeuCau, maTienDo);
        return progress?.AnhPreview;
    }

    public Task<bool> GuiPhanHoi(TaoPhanHoiRequest request, int maKhachHang)
    {
        if (string.IsNullOrWhiteSpace(request.NoiDung))
            throw new ArgumentException("Nội dung phản hồi không được để trống");
        return _customArtRepo.CreateFeedback(request, maKhachHang);
    }

    public Task<bool> XacNhanHoanThanh(int maYeuCau, int maKhachHang) =>
        _customArtRepo.ConfirmComplete(maYeuCau, maKhachHang);

    public Task<bool> LuuDuongDanTep(int maYeuCau, int maKhachHang, string fileKind, string storedPath) =>
        _customArtRepo.UpdateStoredFilePath(maYeuCau, maKhachHang, fileKind, storedPath);

    public async Task<string?> LayDuongDanTep(int maYeuCau, string fileKind, int? maNguoiDung, int? maHoaSi, bool isAdmin)
    {
        _ = await LayChiTiet(maYeuCau, maNguoiDung, maHoaSi, isAdmin);
        var item = await _customArtRepo.GetById(maYeuCau);
        return fileKind.ToLowerInvariant() switch
        {
            "reference" => item?.AnhThamKhao,
            "source" => item?.ReferenceImageUrl,
            "evidence" => item?.BangChungQuyenSuDung,
            _ => throw new ArgumentException("Loại tệp không hợp lệ")
        };
    }

    private static (CustomArtType Type, CustomArtStatus Status, PermissionUsageStatus? Permission) ValidateAndNormalize(TaoYeuCauTranhRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe)) throw new ArgumentException("Tiêu đề yêu cầu không được để trống");
        if (string.IsNullOrWhiteSpace(request.MoTa)) throw new ArgumentException("Mô tả yêu cầu không được để trống");
        if (string.IsNullOrWhiteSpace(request.LoaiTranh) || string.IsNullOrWhiteSpace(request.KichThuoc))
            throw new ArgumentException("Vui lòng nhập loại tranh và kích thước");
        if (request.GiaDuKien < 0) throw new ArgumentException("Ngân sách dự kiến không hợp lệ");
        if (request.ReferenceArtworkId.HasValue && request.ReferenceArtworkId <= 0)
            throw new ArgumentException("Mã tác phẩm nguồn không hợp lệ");
        RejectLocalDeviceUri(request.AnhThamKhao);
        RejectLocalDeviceUri(request.ReferenceImageUrl);
        RejectLocalDeviceUri(request.BangChungQuyenSuDung);

        var type = NormalizeType(request.Type);
        PermissionUsageStatus? permission = null;
        CustomArtStatus status;

        switch (type)
        {
            case CustomArtType.Original:
                ClearOriginalArtworkFields(request);
                request.DaXacNhanQuyenTaiLieu = false;
                status = CustomArtStatus.Submitted;
                request.Type = "ORIGINAL_COMMISSION";
                break;

            case CustomArtType.PersonalReference:
                if (!request.DaXacNhanQuyenTaiLieu)
                    throw new ArgumentException("Bạn phải xác nhận có quyền sử dụng ảnh hoặc tài liệu cá nhân");
                request.ReferenceArtworkId = null;
                request.ReferenceArtworkName = null;
                request.ReferenceArtistName = null;
                request.NguonTacPhamGoc = null;
                request.TinhTrangQuyenSuDung = null;
                request.MoTaQuyenSuDung = null;
                request.BangChungQuyenSuDung = null;
                status = CustomArtStatus.Submitted;
                request.Type = "PERSONAL_REFERENCE";
                break;

            default:
                if (string.IsNullOrWhiteSpace(request.ReferenceArtworkName))
                    throw new ArgumentException("Tên tác phẩm gốc không được để trống");
                if (string.IsNullOrWhiteSpace(request.ReferenceArtistName))
                    throw new ArgumentException("Tên tác giả gốc không được để trống");
                if (string.IsNullOrWhiteSpace(request.ReferenceImageUrl) &&
                    string.IsNullOrWhiteSpace(request.AnhThamKhao) &&
                    string.IsNullOrWhiteSpace(request.NguonTacPhamGoc))
                    throw new ArgumentException("Phải có ảnh hoặc nguồn tham khảo của tác phẩm gốc");
                permission = NormalizePermission(request.TinhTrangQuyenSuDung);
                status = CustomArtStatus.Submitted;
                request.DaXacNhanQuyenTaiLieu = false;
                request.Type = type == CustomArtType.Reproduction ? "REPRODUCTION" : "EXISTING_ARTWORK";
                break;
        }

        return (type, status, permission);
    }

    private static void RejectLocalDeviceUri(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        if (value.StartsWith("file:", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("content:", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("ph:", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Không được lưu URI cục bộ của thiết bị; hãy tải tệp thật lên máy chủ");
    }

    private static void ClearOriginalArtworkFields(TaoYeuCauTranhRequest request)
    {
        request.ReferenceArtworkId = null;
        request.ReferenceArtworkName = null;
        request.ReferenceArtistName = null;
        request.ReferenceImageUrl = null;
        request.NguonTacPhamGoc = null;
        request.TinhTrangQuyenSuDung = null;
        request.MoTaQuyenSuDung = null;
        request.BangChungQuyenSuDung = null;
    }

    private static CustomArtType NormalizeType(string? type) => type?.Trim().ToUpperInvariant() switch
    {
        null or "" or "ORIGINAL" or "ORIGINAL_COMMISSION" => CustomArtType.Original,
        "PERSONALREFERENCE" or "PERSONAL_REFERENCE" => CustomArtType.PersonalReference,
        "BASEDONARTWORK" or "EXISTING_ARTWORK" => CustomArtType.BasedOnArtwork,
        "REPRODUCTION" => CustomArtType.Reproduction,
        _ => throw new ArgumentException("Loại yêu cầu không hợp lệ")
    };

    private static PermissionUsageStatus NormalizePermission(string? status) => status?.Trim().ToUpperInvariant() switch
    {
        "1" or "AUTHOR_OR_RIGHTS_OWNER" or "OWNER" => PermissionUsageStatus.AuthorOrRightsOwner,
        "2" or "PERMISSION_GRANTED" => PermissionUsageStatus.PermissionGranted,
        "3" or "PERMITTED_SCOPE" or "PUBLIC_DOMAIN" => PermissionUsageStatus.PermittedScope,
        "4" or "UNSURE" => PermissionUsageStatus.Unsure,
        _ => throw new ArgumentException("Phải khai báo tình trạng quyền sử dụng tác phẩm gốc")
    };

    private static CustomArtStatus NormalizeStatusFilter(string status) => status.Trim().ToUpperInvariant() switch
    {
        "DRAFT" => CustomArtStatus.Draft,
        "PENDING" => CustomArtStatus.Submitted,
        "APPROVED" => CustomArtStatus.PendingArtist,
        "ACCEPTED" => CustomArtStatus.Assigned,
        "IN_PROGRESS" => CustomArtStatus.InProgress,
        "COMPLETED" => CustomArtStatus.Completed,
        "REJECTED" => CustomArtStatus.Rejected,
        "CANCELLED" => CustomArtStatus.Cancelled,
        "WAITING_PERMISSION" => CustomArtStatus.WaitingPermission,
        _ when Enum.TryParse<CustomArtStatus>(status, true, out var parsed) => parsed,
        _ => throw new ArgumentException("Trạng thái lọc không hợp lệ")
    };

    private static CustomArtRequestResponse MapRequest(CustomArtRequest model) => new()
    {
        MaYeuCau = model.MaYeuCau,
        MaKhachHang = model.MaKhachHang,
        TenKhachHang = model.TenKhachHang,
        MaHoaSi = model.MaHoaSi,
        TenHoaSiThucHien = model.TenHoaSiThucHien,
        TieuDe = model.TieuDe,
        Type = GetTypeName(model.Type),
        LoaiTranh = model.LoaiTranh,
        KichThuoc = model.KichThuoc,
        ChuDe = model.ChuDe,
        MauSac = model.MauSac,
        PhongCach = model.PhongCach,
        ChatLieu = model.ChatLieu,
        MoTa = model.MoTa,
        AnhThamKhao = GetFileUrl(model.MaYeuCau, "reference", model.AnhThamKhao),
        ReferenceArtworkId = model.ReferenceArtworkId,
        ReferenceArtworkName = model.ReferenceArtworkName,
        ReferenceArtistName = model.ReferenceArtistName,
        ReferenceImageUrl = GetFileUrl(model.MaYeuCau, "source", model.ReferenceImageUrl),
        NguonTacPhamGoc = model.NguonTacPhamGoc,
        TinhTrangQuyenSuDung = model.TinhTrangQuyenSuDung?.ToString(),
        DaXacNhanQuyenTaiLieu = model.DaXacNhanQuyenTaiLieu,
        MoTaQuyenSuDung = model.MoTaQuyenSuDung,
        BangChungQuyenSuDung = GetFileUrl(model.MaYeuCau, "evidence", model.BangChungQuyenSuDung),
        GhiChuKiemDuyet = model.GhiChuKiemDuyet,
        TienDatCoc = model.TienDatCoc,
        GiaDuKien = model.GiaDuKien,
        TrangThai = GetBusinessStatus(model.TrangThai),
        TrangThaiNoiBo = model.TrangThai.ToString(),
        NgayTao = model.NgayTao,
        NgayCapNhat = model.NgayCapNhat,
        NgayHoanThanhDuKien = model.NgayHoanThanhDuKien,
        MaTacPhamKetQua = model.MaTacPhamKetQua
    };

    private static string GetTypeName(CustomArtType type) => type switch
    {
        CustomArtType.Original => "ORIGINAL_COMMISSION",
        CustomArtType.PersonalReference => "PERSONAL_REFERENCE",
        _ => "EXISTING_ARTWORK"
    };

    private static string? GetFileUrl(int requestId, string kind, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (Uri.TryCreate(value, UriKind.Absolute, out _)) return value;
        if (value.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)) return value;
        return $"/api/tranh-theo-yeu-cau/yeu-cau/{requestId}/tep/{kind}";
    }

    private static string GetBusinessStatus(CustomArtStatus status) => status switch
    {
        CustomArtStatus.Draft => "DRAFT",
        CustomArtStatus.Submitted => "PENDING",
        CustomArtStatus.PendingArtist => "APPROVED",
        CustomArtStatus.Assigned or CustomArtStatus.Quoted or CustomArtStatus.CustomerAccepted or CustomArtStatus.DepositPaid => "ACCEPTED",
        CustomArtStatus.InProgress or CustomArtStatus.PreviewSent or CustomArtStatus.RevisionRequested => "IN_PROGRESS",
        CustomArtStatus.Completed => "COMPLETED",
        CustomArtStatus.Rejected => "REJECTED",
        CustomArtStatus.Cancelled => "CANCELLED",
        CustomArtStatus.WaitingPermission => "WAITING_PERMISSION",
        _ => status.ToString().ToUpperInvariant()
    };

    private static CustomArtQuoteResponse MapQuote(CustomArtQuote model) => new()
    {
        MaBaoGia = model.MaBaoGia,
        MaYeuCau = model.MaYeuCau,
        MaHoaSi = model.MaHoaSi,
        GiaBaoGia = model.GiaBaoGia,
        ThoiGianHoanThanh = model.ThoiGianHoanThanh,
        GhiChu = model.GhiChu,
        TrangThai = model.TrangThai,
        NgayTao = model.NgayTao
    };

    private static CustomArtProgressResponse MapProgress(CustomArtProgress model) => new()
    {
        MaTienDo = model.MaTienDo,
        MaYeuCau = model.MaYeuCau,
        TieuDe = model.TieuDe,
        MoTa = model.MoTa,
        AnhPreview = GetProgressFileUrl(model),
        TrangThai = model.TrangThai,
        NgayTao = model.NgayTao
    };

    private static string? GetProgressFileUrl(CustomArtProgress progress)
    {
        var value = progress.AnhPreview;
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (value.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)) return value;
        if (Uri.TryCreate(value, UriKind.Absolute, out _)) return value;
        if (value.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)) return value;
        return $"/api/tranh-theo-yeu-cau/yeu-cau/{progress.MaYeuCau}/tien-do/{progress.MaTienDo}/tep";
    }
}
