namespace DoAn2_BackEnd.DTO;

// Request DTOs
public class DangNhapRequest
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
}

public class DangKyRequest
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public string Ten { get; set; } = null!;
    public string? Email { get; set; }
    public string? DienThoai { get; set; }
    public string? DiaChi { get; set; }
    public byte VaiTro { get; set; } = 1; // Mặc định là NguoiDung (1)
}

// Response DTOs
public class DangNhapResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public UserInfo? User { get; set; }
}

public class UserInfo
{
    public int MaTaiKhoan { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public byte VaiTro { get; set; }
    public string VaiTroText { get; set; } = null!;
    public int? MaNguoiDung { get; set; }
    public int? MaHoaSi { get; set; }
    public string? Ten { get; set; }
    public string? Email { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = null!;
}

public class DoiMatKhauRequest
{
    public string MatKhauCu { get; set; } = null!;
    public string MatKhauMoi { get; set; } = null!;
}

// Admin tạo tài khoản họa sĩ (chỉ admin gọi được)
public class TaoTaiKhoanHoaSiRequest
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public string? Email { get; set; }
    public string? DienThoai { get; set; }
    public string? DiaChi { get; set; }
}

public class TaoTaiKhoanHoaSiResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int? MaTaiKhoan { get; set; }
    public int? MaHoaSi { get; set; }
}
