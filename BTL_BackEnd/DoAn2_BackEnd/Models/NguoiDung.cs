namespace DoAn2_BackEnd.Models;

public class NguoiDung
{
    public int MaNguoiDung { get; set; }
    public int? MaTaiKhoan { get; set; }
    public string Ten { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public bool TrangThai { get; set; }
}
