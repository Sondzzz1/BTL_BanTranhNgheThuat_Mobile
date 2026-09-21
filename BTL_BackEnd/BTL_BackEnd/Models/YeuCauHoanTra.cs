namespace DoAn2_BackEnd.Models;

/// <summary>
/// Entity đại diện cho yêu cầu hoàn trả sản phẩm của khách hàng
/// </summary>
public class YeuCauHoanTra
{
    public int MaYeuCau { get; set; }

    /// <summary>Mã đơn hàng liên quan</summary>
    public int MaDonHang { get; set; }

    /// <summary>Mã người dùng gửi yêu cầu</summary>
    public int MaNguoiDung { get; set; }

    /// <summary>Mã tác phẩm muốn hoàn trả</summary>
    public int MaTacPham { get; set; }

    /// <summary>
    /// Lý do hoàn trả được chọn từ danh sách:
    /// SAN_PHAM_HU_HONG, SAI_MO_TA, GIAO_SAI, LOI_SAN_PHAM, KHONG_DUNG_DAT, LY_DO_KHAC
    /// </summary>
    public string LyDo { get; set; } = string.Empty;

    /// <summary>Mô tả chi tiết từ khách hàng (nếu chọn lý do khác)</summary>
    public string? LyDoKhac { get; set; }

    /// <summary>Mô tả chi tiết vấn đề</summary>
    public string? MoTa { get; set; }

    /// <summary>Danh sách URL hình ảnh minh chứng (lưu dạng JSON)</summary>
    public string? HinhAnh { get; set; }

    /// <summary>
    /// Trạng thái xử lý:
    /// CHO_DUYET | DA_DUYET | TU_CHOI | DANG_HOAN_TRA | DA_NHAN_HANG | DA_HOAN_TIEN | HOAN_TAT
    /// </summary>
    public string TrangThai { get; set; } = "CHO_DUYET";

    /// <summary>Lý do từ chối (nếu Admin từ chối)</summary>
    public string? LyDoTuChoi { get; set; }

    public DateTime NgayTao { get; set; } = DateTime.Now;
    public DateTime NgayCapNhat { get; set; } = DateTime.Now;

    // Navigation properties
    public DonHang? DonHang { get; set; }
    public NguoiDung? NguoiDung { get; set; }
    public TacPham? TacPham { get; set; }
}
