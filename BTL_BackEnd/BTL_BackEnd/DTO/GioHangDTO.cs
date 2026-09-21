namespace DoAn2_BackEnd.DTO;

public class GioHangViewDTO
{
    public int MaGioHang { get; set; }
    public int MaNguoiDung { get; set; }
    public List<ChiTietGioHangViewDTO> ChiTiet { get; set; } = new();
}

public class ChiTietGioHangViewDTO
{
    public int MaChiTietGH { get; set; }
    public int MaGioHang { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public decimal Gia { get; set; }
    public string? HinhAnh { get; set; }
    public int SoLuong { get; set; }
    public int SoLuongTon { get; set; }
    public decimal ThanhTien { get; set; }
}

public class ThemVaoGioHangDTO
{
    public int MaTacPham { get; set; }
    public int SoLuong { get; set; }
}
