namespace DoAn2_BackEnd.DTO;

public class HoaSiCreateDTO
{
    public int? MaTaiKhoan { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
}

public class HoaSiUpdateDTO
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
}

public class HoaSiViewDTO
{
    public int MaHoaSi { get; set; }
    public int? MaTaiKhoan { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public string? TenDangNhap { get; set; }
}

// Hồ sơ họa sĩ chi tiết
public class HoSoHoaSiResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public int SoTacPham { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("doanhThu")]
    public decimal TongDoanhThu { get; set; }
    public bool TrangThai { get; set; }
}

public class CapNhatHoSoHoaSiRequest
{
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
}

// Doanh thu
public class DoanhThuTongQuanResponse
{
    public decimal TongDoanhThu { get; set; }
    public int SoDonHang { get; set; }
    public int SoTacPhamDaBan { get; set; }
    public decimal DoanhThuThangNay { get; set; }
}

public class DoanhThuChiTietResponse
{
    public int MaDonHang { get; set; }
    public DateTime NgayDat { get; set; }
    public string TenKhachHang { get; set; } = null!;
    public decimal TongTien { get; set; }
    public string TrangThai { get; set; } = null!;
}

public class DoanhThuTheoTacPhamResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int SoLuongBan { get; set; }
    public decimal DoanhThu { get; set; }
}

// Tác phẩm của họa sĩ
public class TacPhamHoaSiResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public string? TenHoaSi { get; set; }
    public string? LyDo { get; set; }
}

public class TaoTacPhamRequest
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; } = 1;
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
}

public class CapNhatTacPhamRequest
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
}

public class CapNhatTrangThaiTacPhamRequest
{
    // 0=Pending, 1=Approved, 2=Hidden, 3=Rejected
    public byte TrangThai { get; set; }
}

// Chi tiết tác phẩm - Thống kê
public class TacPhamThongKeResponse
{
    public int TongSoLuongBan { get; set; }
    public decimal TongDoanhThu { get; set; }
    public int SoDonHang { get; set; }
    public int SoLuongConLai { get; set; }
    public decimal DoanhThuThangNay { get; set; }
    public int SoLuongBanThangNay { get; set; }
}

// Chi tiết tác phẩm - Đơn hàng
public class TacPhamDonHangResponse
{
    public int MaDonHang { get; set; }
    public string MaHD { get; set; } = null!;
    public DateTime NgayDat { get; set; }
    public string TenKhachHang { get; set; } = null!;
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
    public string TrangThai { get; set; } = null!;
    public string TrangThaiClass { get; set; } = null!;
}

// Chi tiết tác phẩm - Doanh thu theo tháng
public class TacPhamDoanhThuTheoThangResponse
{
    public string Thang { get; set; } = null!;
    public decimal DoanhThu { get; set; }
    public int SoLuong { get; set; }
}

// Tác phẩm chỉnh sửa chờ duyệt
public class TacPhamChinhSuaResponse
{
    public int MaChinhSua { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? TenHoaSi { get; set; }
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? HinhAnh { get; set; }
    public byte TrangThai { get; set; }
    public DateTime NgayChinhSua { get; set; }
    public string? LyDo { get; set; }
}

public class DuyetTacPhamChinhSuaRequest
{
    public bool PheDuyet { get; set; }
    public string? LyDo { get; set; }
}
