namespace DoAn2_BackEnd.Models;

public class YeuThich
{
    public int MaYeuThich { get; set; }
    public int MaNguoiDung { get; set; }
    public int MaTacPham { get; set; }
    public DateTime NgayThem { get; set; }
    public string? GhiChu { get; set; }

    // Navigation properties
    public virtual NguoiDung? NguoiDung { get; set; }
    public virtual TacPham? TacPham { get; set; }
}
