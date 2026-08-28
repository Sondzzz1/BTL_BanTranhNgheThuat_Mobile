namespace DoAn2_BackEnd.Models;

public class TaiKhoan
{
    public int MaTaiKhoan { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public byte VaiTro { get; set; } // 0=Admin, 1=NguoiDung, 2=HoaSi
    public bool TrangThai { get; set; }
}
