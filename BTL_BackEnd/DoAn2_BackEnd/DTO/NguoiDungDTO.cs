namespace DoAn2_BackEnd.DTO;

public class NguoiDungCreateDTO
{
    public int? MaTaiKhoan { get; set; }
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
}

public class NguoiDungUpdateDTO
{
    public int MaNguoiDung { get; set; }
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
}

public class NguoiDungViewDTO
{
    public int MaNguoiDung { get; set; }
    public int? MaTaiKhoan { get; set; }
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public string? TenDangNhap { get; set; }
}
