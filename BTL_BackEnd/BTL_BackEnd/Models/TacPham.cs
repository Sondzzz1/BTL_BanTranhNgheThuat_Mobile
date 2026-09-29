namespace DoAn2_BackEnd.Models;

public class TacPham
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int MaHoaSi { get; set; }
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public string? KichThuoc { get; set; }
    public byte TrangThai { get; set; }
    public DateTime NgayTao { get; set; }
    public string? LyDo { get; set; }
    /// <summary>0=ORIGINAL, 1=COMMISSION_ORIGINAL, 2=DERIVATIVE, 3=COMMISSION_FROM_EXISTING, 4=PERSONAL_REFERENCE.</summary>
    public byte LoaiTacPham { get; set; }
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public int? MaYeuCauVeTranh { get; set; }
    public string? MoTaNguonGoc { get; set; }
}
