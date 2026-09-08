namespace DoAn2_BackEnd.DTO;

// ================================================================
// REQUEST DTOs - Từ Client gửi lên
// ================================================================

/// <summary>Request tạo yêu cầu hoàn trả (Customer)</summary>
public class TaoHoanTraRequest
{
    public int MaDonHang { get; set; }
    public int MaTacPham { get; set; }
    /// <summary>
    /// Lý do: SAN_PHAM_HU_HONG | SAI_MO_TA | GIAO_SAI | LOI_SAN_PHAM | KHONG_DUNG_DAT | LY_DO_KHAC
    /// </summary>
    public string LyDo { get; set; } = string.Empty;
    public string? LyDoKhac { get; set; }
    public string? MoTa { get; set; }
    /// <summary>Danh sách URL hình ảnh minh chứng (upload riêng hoặc base64)</summary>
    public List<string>? HinhAnh { get; set; }
}

/// <summary>Request Admin duyệt/từ chối yêu cầu hoàn trả</summary>
public class DuyetHoanTraRequest
{
    /// <summary>true = chấp nhận, false = từ chối</summary>
    public bool ChapNhan { get; set; }
    /// <summary>Bắt buộc khi ChapNhan = false</summary>
    public string? LyDoTuChoi { get; set; }
}

/// <summary>Request Admin cập nhật trạng thái hoàn trả</summary>
public class CapNhatTrangThaiHoanTraRequest
{
    /// <summary>
    /// Trạng thái mới: DANG_HOAN_TRA | DA_NHAN_HANG | DA_HOAN_TIEN | HOAN_TAT
    /// </summary>
    public string TrangThai { get; set; } = string.Empty;
}

// ================================================================
// RESPONSE DTOs - Server trả về Client
// ================================================================

/// <summary>Thông tin tóm tắt yêu cầu hoàn trả (dùng cho danh sách)</summary>
public class HoanTraSummaryResponse
{
    public int MaYeuCau { get; set; }
    public int MaDonHang { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public string? HinhAnhTacPham { get; set; }
    public decimal GiaTacPham { get; set; }
    public string LyDo { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
}

/// <summary>Thông tin chi tiết yêu cầu hoàn trả (dùng cho màn hình chi tiết)</summary>
public class HoanTraDetailResponse
{
    public int MaYeuCau { get; set; }
    public int MaDonHang { get; set; }
    public int MaNguoiDung { get; set; }
    public string? TenNguoiDung { get; set; }
    public string? EmailNguoiDung { get; set; }
    public string? SoDienThoaiNguoiDung { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public string? HinhAnhTacPham { get; set; }
    public decimal GiaTacPham { get; set; }
    public int SoLuong { get; set; }
    public string LyDo { get; set; } = string.Empty;
    public string? LyDoKhac { get; set; }
    public string? MoTa { get; set; }
    /// <summary>Danh sách URL hình ảnh minh chứng</summary>
    public List<string> HinhAnh { get; set; } = new();
    public string TrangThai { get; set; } = string.Empty;
    public string? LyDoTuChoi { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime NgayCapNhat { get; set; }
    // Thông tin đơn hàng
    public DateTime NgayDatHang { get; set; }
    public decimal TongTienDonHang { get; set; }
}

/// <summary>Response sau khi tạo yêu cầu hoàn trả thành công</summary>
public class TaoHoanTraResponse
{
    public string Message { get; set; } = string.Empty;
    public int MaYeuCau { get; set; }
}
