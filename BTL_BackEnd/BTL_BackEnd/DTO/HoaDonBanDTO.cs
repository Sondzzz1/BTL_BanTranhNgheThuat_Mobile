namespace DoAn2_BackEnd.DTO;

// ── Responses ──

public class HoaDonBanResponse
{
    public int MaHoaDon { get; set; }
    public int MaDonHang { get; set; }
    public DateTime NgayXuatHD { get; set; }
    public decimal TongTienHang { get; set; }

    // Snapshot thông tin khách hàng
    public string? TenNguoiMua { get; set; }
    public string? DiaChiNguoiMua { get; set; }
    public string? SoDienThoaiNguoiMua { get; set; }
    public string? Email { get; set; }

    // Thanh toán
    public string? PhuongThucThanhToan { get; set; }
    public string? TrangThaiThanhToan { get; set; }
    public string TrangThai { get; set; } = "HopLe";

    // Chi tiết
    public List<ChiTietHoaDonBanResponse> ChiTiet { get; set; } = new();
}

public class ChiTietHoaDonBanResponse
{
    public int MaChiTietHD { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
}

/// <summary>
/// Tóm tắt hóa đơn cho danh sách (không bao gồm chi tiết).
/// </summary>
public class HoaDonBanSummaryResponse
{
    public int MaHoaDon { get; set; }
    public int MaDonHang { get; set; }
    public DateTime NgayXuatHD { get; set; }
    public decimal TongTienHang { get; set; }
    public string? TenNguoiMua { get; set; }
    public string? PhuongThucThanhToan { get; set; }
    public string TrangThai { get; set; } = "HopLe";
}
