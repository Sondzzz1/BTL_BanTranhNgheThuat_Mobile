namespace DoAn2_BackEnd.Models;

public class HoaSi
{
    public int MaHoaSi { get; set; }
    public int? MaTaiKhoan { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? Email { get; set; }
    public string? DienThoai { get; set; }
    public string? DiaChi { get; set; }
    public string? AnhDaiDien { get; set; } // Mapping to Avatar in DB if needed, or keeping name
    public string? TieuSu { get; set; }
    public string? ChuyenMon { get; set; }
    public DateTime NgayTao { get; set; }
    public bool TrangThai { get; set; }
}
