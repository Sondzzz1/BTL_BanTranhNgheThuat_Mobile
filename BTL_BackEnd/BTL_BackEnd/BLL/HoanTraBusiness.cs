using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL;

/// <summary>
/// Business logic layer cho module hoàn trả.
/// Xử lý validate nghiệp vụ trước khi gọi repository.
/// </summary>
public class HoanTraBusiness : IHoanTraBusiness
{
    private static readonly HashSet<string> LyDoHopLe = new(StringComparer.OrdinalIgnoreCase)
    {
        "SAN_PHAM_HU_HONG", "SAI_MO_TA", "GIAO_SAI", "LOI_SAN_PHAM", "KHONG_DUNG_DAT", "LY_DO_KHAC"
    };
    private readonly IHoanTraRepository _hoanTraRepository;

    public HoanTraBusiness(IHoanTraRepository hoanTraRepository)
    {
        _hoanTraRepository = hoanTraRepository;
    }

    // ================================================================
    // CUSTOMER
    // ================================================================

    /// <summary>Tạo yêu cầu hoàn trả với đầy đủ validate nghiệp vụ</summary>
    public async Task<TaoHoanTraResponse> TaoYeuCauHoanTra(int maNguoiDung, TaoHoanTraRequest request)
    {
        // 1. Validate lý do không được rỗng
        if (string.IsNullOrWhiteSpace(request.LyDo))
            throw new ArgumentException("Vui lòng chọn lý do hoàn trả");
        request.LyDo = request.LyDo.Trim().ToUpperInvariant();
        if (!LyDoHopLe.Contains(request.LyDo))
            throw new ArgumentException("Lý do hoàn trả không hợp lệ");
        if (request.SoLuongTra <= 0)
            throw new ArgumentException("Số lượng hoàn trả phải lớn hơn 0");

        // 2. Validate lý do khác khi chọn LY_DO_KHAC
        if (request.LyDo == "LY_DO_KHAC" && string.IsNullOrWhiteSpace(request.LyDoKhac))
            throw new ArgumentException("Vui lòng nhập lý do cụ thể");
        if (request.LyDoKhac?.Length > 500 || request.MoTa?.Length > 2000)
            throw new ArgumentException("Nội dung mô tả hoàn trả quá dài");
        if (request.HinhAnh?.Any(path => path.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
                                           || path.StartsWith("file:", StringComparison.OrdinalIgnoreCase)
                                           || path.StartsWith("content:", StringComparison.OrdinalIgnoreCase)
                                           || path.StartsWith("ph:", StringComparison.OrdinalIgnoreCase)) == true)
            throw new ArgumentException("Ảnh bằng chứng phải được upload thành tệp thật lên server");

        if (request.LyDo == "LY_DO_KHAC" && await _hoanTraRepository.LaTranhDatVe(maNguoiDung, request))
            throw new InvalidOperationException("Tranh đặt vẽ chỉ được hoàn trả khi hư hỏng, giao sai hoặc không đúng mô tả/thỏa thuận");

        // Repository thực hiện kiểm tra đơn, dòng hàng, thời hạn, số lượng và chống request trùng
        // trong cùng SERIALIZABLE transaction để tránh race condition.
        var maYeuCau = await _hoanTraRepository.TaoYeuCauHoanTra(maNguoiDung, request);

        return new TaoHoanTraResponse
        {
            Message = "Gửi yêu cầu hoàn trả thành công. Chúng tôi sẽ xem xét trong 1-3 ngày làm việc.",
            MaYeuCau = maYeuCau,
        };
    }

    /// <summary>Lấy danh sách yêu cầu hoàn trả của người dùng</summary>
    public async Task<List<HoanTraSummaryResponse>> GetHoanTraCuaToi(int maNguoiDung)
    {
        return await _hoanTraRepository.GetByNguoiDung(maNguoiDung);
    }

    /// <summary>Lấy chi tiết yêu cầu hoàn trả của người dùng</summary>
    public async Task<HoanTraDetailResponse> GetChiTiet(int maYeuCau, int maNguoiDung)
    {
        var result = await _hoanTraRepository.GetById(maYeuCau, maNguoiDung);
        if (result == null)
            throw new KeyNotFoundException("Không tìm thấy yêu cầu hoàn trả");
        return result;
    }

    /// <summary>Khách hàng xác nhận đã gửi hàng về - chuyển sang DANG_HOAN_TRA</summary>
    public async Task XacNhanDaGuiHang(int maYeuCau, int maNguoiDung)
    {
        var success = await _hoanTraRepository.XacNhanDaGuiHang(maYeuCau, maNguoiDung);
        if (!success)
            throw new InvalidOperationException("Không thể xác nhận. Yêu cầu chưa được duyệt hoặc không thuộc về bạn.");
    }

    public async Task HuyYeuCau(int maYeuCau, int maNguoiDung)
    {
        if (!await _hoanTraRepository.HuyYeuCau(maYeuCau, maNguoiDung))
            throw new InvalidOperationException("Chỉ có thể hủy yêu cầu của bạn khi đang chờ duyệt");
    }

    // ================================================================
    // ADMIN
    // ================================================================

    /// <summary>Lấy tất cả yêu cầu hoàn trả (Admin)</summary>
    public async Task<List<HoanTraSummaryResponse>> GetAllHoanTra(
        string? trangThai, DateTime? tuNgay, DateTime? denNgay, string? keyword)
    {
        return await _hoanTraRepository.GetAll(trangThai, tuNgay, denNgay, keyword);
    }

    /// <summary>Admin xem chi tiết yêu cầu hoàn trả (không giới hạn theo user)</summary>
    public async Task<HoanTraDetailResponse> GetChiTietAdmin(int maYeuCau)
    {
        var result = await _hoanTraRepository.GetById(maYeuCau, null);
        if (result == null)
            throw new KeyNotFoundException("Không tìm thấy yêu cầu hoàn trả");
        return result;
    }

    /// <summary>Admin duyệt hoặc từ chối yêu cầu hoàn trả</summary>
    public async Task DuyetYeuCau(int maYeuCau, int maTaiKhoan, DuyetHoanTraRequest request)
    {
        // Nếu từ chối phải có lý do
        if (!request.ChapNhan && string.IsNullOrWhiteSpace(request.LyDoTuChoi))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");

        var success = await _hoanTraRepository.DuyetYeuCau(
            maYeuCau, maTaiKhoan, request.ChapNhan, request.LyDoTuChoi?.Trim());

        if (!success)
            throw new InvalidOperationException("Không thể duyệt. Yêu cầu không ở trạng thái Chờ duyệt.");
    }

    /// <summary>Admin cập nhật trạng thái theo quy trình</summary>
    public async Task CapNhatTrangThai(int maYeuCau, CapNhatTrangThaiHoanTraRequest request)
    {
        request.TrangThai = request.TrangThai.Trim().ToUpperInvariant();
        var trangThaiHopLe = new[] { "DANG_HOAN_TRA", "HOAN_TAT" };
        if (!trangThaiHopLe.Contains(request.TrangThai))
            throw new ArgumentException("Hãy dùng API xác nhận nhận hàng hoặc xác nhận hoàn tiền cho bước nghiệp vụ tương ứng");

        var success = await _hoanTraRepository.CapNhatTrangThai(maYeuCau, request.TrangThai);
        if (!success)
            throw new InvalidOperationException("Không thể cập nhật trạng thái. Kiểm tra thứ tự chuyển trạng thái.");
    }

    public async Task XacNhanNhanHang(int maYeuCau, int maTaiKhoan, XacNhanNhanHangHoanTraRequest request)
    {
        if (!await _hoanTraRepository.XacNhanNhanHang(maYeuCau, maTaiKhoan, request.CoTheBanLai))
            throw new InvalidOperationException("Yêu cầu không ở trạng thái đang hoàn trả hoặc đã được xử lý");
    }

    public async Task XacNhanHoanTien(int maYeuCau, int maTaiKhoan, XacNhanHoanTienRequest request)
    {
        var methods = new[] { "COD", "BANKTRANSFER", "MOMO", "VNPAY", "CHUYEN_KHOAN", "TIEN_MAT" };
        request.PhuongThucHoanTien = request.PhuongThucHoanTien.Trim().ToUpperInvariant();
        if (!methods.Contains(request.PhuongThucHoanTien))
            throw new ArgumentException("Phương thức hoàn tiền không hợp lệ");
        if (request.SoTienHoan.HasValue && request.SoTienHoan <= 0)
            throw new ArgumentException("Số tiền hoàn phải lớn hơn 0");
        if (!await _hoanTraRepository.XacNhanHoanTien(maYeuCau, maTaiKhoan, request))
            throw new InvalidOperationException("Yêu cầu chưa được nhận lại, số tiền không hợp lệ hoặc đã hoàn tiền");
    }

    /// <summary>Admin hoàn tất toàn bộ quy trình hoàn trả</summary>
    public async Task HoanTat(int maYeuCau)
    {
        var success = await _hoanTraRepository.HoanTat(maYeuCau);
        if (!success)
            throw new InvalidOperationException("Không thể hoàn tất. Yêu cầu phải ở trạng thái Đã hoàn tiền.");
    }
}
