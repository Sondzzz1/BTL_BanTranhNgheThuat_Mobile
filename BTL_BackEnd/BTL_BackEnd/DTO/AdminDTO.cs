namespace DoAn2_BackEnd.DTO;

// Dashboard & Thống kê
public class DashboardResponse
{
    public decimal TongDoanhThu { get; set; }
    public int TongDonHang { get; set; }
    public int TongKhachHang { get; set; }
    public int TongHoaSi { get; set; }
    public int TongTacPham { get; set; }
    public int DonHangChoXuLy { get; set; }
    public int TacPhamChoDuyet { get; set; }
    public int BaiVietChoDuyet { get; set; }
}

public class ThongKeTongQuanResponse
{
    public DoanhThuTheoThang[] DoanhThuTheoThang { get; set; } = Array.Empty<DoanhThuTheoThang>();
    public TacPhamBanChay[] Top10TacPham { get; set; } = Array.Empty<TacPhamBanChay>();
    public KhachHangTop[] Top10KhachHang { get; set; } = Array.Empty<KhachHangTop>();
    public HoaSiTop[] Top10HoaSi { get; set; } = Array.Empty<HoaSiTop>();
}

public class DoanhThuTheoThang
{
    public int Nam { get; set; }
    public int Thang { get; set; }
    public decimal TongDoanhThu { get; set; }
    public int SoDonHang { get; set; }
}

public class TacPhamBanChay
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public int SoLuongBan { get; set; }
    public decimal DoanhThu { get; set; }
}

public class KhachHangTop
{
    public int MaNguoiDung { get; set; }
    public string Ten { get; set; } = null!;
    public int SoDonHang { get; set; }
    public decimal TongChiTieu { get; set; }
}

public class HoaSiTop
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public int SoTacPham { get; set; }
    public int SoLuongBan { get; set; }
    public decimal DoanhThu { get; set; }
}

// Quản lý đơn hàng
public class DonHangAdminResponse
{
    public int MaDonHang { get; set; }
    public string TenKhachHang { get; set; } = null!;
    public DateTime NgayDat { get; set; }
    public decimal TongTien { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public byte TrangThai { get; set; }
    public string? TrangThaiThanhToan { get; set; }
    public string? LyDoHuy { get; set; }
}

public class CapNhatTrangThaiDonHangRequest
{
    public byte TrangThai { get; set; } // 0-5
    public string? GhiChu { get; set; }
}

public class CapNhatTrangThaiThanhToanRequest
{
    public string TrangThai { get; set; } = null!; // ChoThanhToan, DaThanhToan, ThatBai, HoanTien
}

// Quản lý tác phẩm
public class DuyetTacPhamRequest
{
    public bool PheDuyet { get; set; }
    public string? LyDo { get; set; }
}

// Quản lý bài viết
public class DuyetBaiVietRequest
{
    public bool PheDuyet { get; set; }
    public string? LyDo { get; set; }
}
