namespace DoAn2_BackEnd.Models;

public class NoiDung
{
    public int MaNoiDung { get; set; }
    public int MaTacPham { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDungText { get; set; } // We will map this to the 'NoiDung' column or 'ChiTiet'
    public string Loai { get; set; } = "MoTa"; 
    public DateTime NgayCapNhat { get; set; }
    public bool TrangThai { get; set; }
}
