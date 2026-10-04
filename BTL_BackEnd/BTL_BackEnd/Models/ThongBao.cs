namespace DoAn2_BackEnd.Models;

/// <summary>Thông báo trong ứng dụng, gửi tới một tài khoản cụ thể.</summary>
public class ThongBao
{
    public long MaThongBao { get; set; }
    public int MaTaiKhoan { get; set; }
    public string Loai { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string NoiDung { get; set; } = null!;
    public string? LoaiDoiTuong { get; set; }
    public int? MaDoiTuong { get; set; }
    public string? DuongDan { get; set; }
    /// <summary>Khóa chống trùng cho sự kiện có định danh ổn định (nếu có).</summary>
    public string? EventKey { get; set; }
    public bool DaDoc { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayDoc { get; set; }
}
