namespace DoAn2_BackEnd.DTO;

public class TaiKhoanLoginDTO
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
}

public class TaiKhoanRegisterDTO
{
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public byte VaiTro { get; set; }
}

public class TaiKhoanViewDTO
{
    public int MaTaiKhoan { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public byte VaiTro { get; set; }
    public bool TrangThai { get; set; }
}
