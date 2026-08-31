namespace DoAn2_BackEnd.DTO;

// Thông tin cá nhân
public class ThongTinKhachHangResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int MaNguoiDung { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("hoTen")]
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("soDienThoai")]
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public bool TrangThai { get; set; }
}

public class CapNhatThongTinRequest
{
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
}

// Giỏ hàng
public class ThemVaoGioHangRequest
{
    public int MaTacPham { get; set; }
    public int SoLuong { get; set; } = 1;
}

public class CapNhatGioHangRequest
{
    public int SoLuong { get; set; }
}

public class GioHangResponse
{
    public int MaGioHang { get; set; }
    public List<ChiTietGioHangResponse> DanhSachSanPham { get; set; } = new();
    public decimal TongTien { get; set; }
}

public class ChiTietGioHangResponse
{
    public int MaChiTietGH { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public decimal ThanhTien { get; set; }
    public string? HinhAnh { get; set; }
}

// Đơn hàng
public class TaoDonHangRequest
{
    public string TenNguoiNhan { get; set; } = null!;
    public string SoDienThoai { get; set; } = null!;
    public string DiaChiGiao { get; set; } = null!;
    public string PhuongThucThanhToan { get; set; } = "COD"; // COD, BankTransfer, Momo, VNPay
}

public class DonHangResponse
{
    public int MaDonHang { get; set; }
    public DateTime NgayDat { get; set; }
    public decimal TongTien { get; set; }
    public string TenNguoiNhan { get; set; } = null!;
    public string SoDienThoai { get; set; } = null!;
    public string DiaChiGiao { get; set; } = null!;
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public string? TrangThaiThanhToan { get; set; }
    public List<ChiTietDonHangResponse> ChiTiet { get; set; } = new();
}

public class ChiTietDonHangResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
    public string? HinhAnh { get; set; }
}
