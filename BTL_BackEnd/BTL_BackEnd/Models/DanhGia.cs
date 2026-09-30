namespace DoAn2_BackEnd.Models;

public class DanhGia
{
    public int MaDanhGia { get; set; }
    public int MaTacPham { get; set; }
    public int MaNguoiDung { get; set; }
    public int SoSao { get; set; }
    public string? NoiDung { get; set; }
    public string? HinhAnhDanhGia { get; set; }
    public DateTime NgayTao { get; set; }
}
