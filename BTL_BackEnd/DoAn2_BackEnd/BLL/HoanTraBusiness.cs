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

        // 2. Validate lý do khác khi chọn LY_DO_KHAC
        if (request.LyDo == "LY_DO_KHAC" && string.IsNullOrWhiteSpace(request.LyDoKhac))
            throw new ArgumentException("Vui lòng nhập lý do cụ thể");

        // 3. Kiểm tra đơn hàng hợp lệ (thuộc user, đã hoàn thành, chứa sản phẩm)
        var hopLe = await _hoanTraRepository.KiemTraDonHangHopLe(
            request.MaDonHang, maNguoiDung, request.MaTacPham);

        if (!hopLe)
            throw new InvalidOperationException("Đơn hàng không hợp lệ hoặc chưa đủ điều kiện hoàn trả. Đơn hàng phải ở trạng thái Hoàn thành.");

        // 4. Kiểm tra chưa có yêu cầu hoàn trả đang xử lý cho sản phẩm này
        var daCoYeuCau = await _hoanTraRepository.KiemTraDaCoYeuCau(
            request.MaDonHang, request.MaTacPham, maNguoiDung);

        if (daCoYeuCau)
            throw new InvalidOperationException("Sản phẩm này trong đơn hàng đã có yêu cầu hoàn trả đang được xử lý.");

        // 5. Tạo yêu cầu
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
    public async Task DuyetYeuCau(int maYeuCau, DuyetHoanTraRequest request)
    {
        // Nếu từ chối phải có lý do
        if (!request.ChapNhan && string.IsNullOrWhiteSpace(request.LyDoTuChoi))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");

        var success = await _hoanTraRepository.DuyetYeuCau(
            maYeuCau, request.ChapNhan, request.LyDoTuChoi);

        if (!success)
            throw new InvalidOperationException("Không thể duyệt. Yêu cầu không ở trạng thái Chờ duyệt.");
    }

    /// <summary>Admin cập nhật trạng thái theo quy trình</summary>
    public async Task CapNhatTrangThai(int maYeuCau, CapNhatTrangThaiHoanTraRequest request)
    {
        var trangThaiHopLe = new[] { "DANG_HOAN_TRA", "DA_NHAN_HANG", "DA_HOAN_TIEN", "HOAN_TAT" };
        if (!trangThaiHopLe.Contains(request.TrangThai))
            throw new ArgumentException($"Trạng thái không hợp lệ: {request.TrangThai}");

        var success = await _hoanTraRepository.CapNhatTrangThai(maYeuCau, request.TrangThai);
        if (!success)
            throw new InvalidOperationException("Không thể cập nhật trạng thái. Kiểm tra thứ tự chuyển trạng thái.");
    }

    /// <summary>Admin hoàn tất toàn bộ quy trình hoàn trả</summary>
    public async Task HoanTat(int maYeuCau)
    {
        var success = await _hoanTraRepository.HoanTat(maYeuCau);
        if (!success)
            throw new InvalidOperationException("Không thể hoàn tất. Yêu cầu phải ở trạng thái Đã hoàn tiền.");
    }
}
