namespace DoAn2_BackEnd.Models;

public class DonHang
{
    public int MaDonHang { get; set; }
    public int MaNguoiDung { get; set; }
    public DateTime NgayDat { get; set; }
    public decimal TongTien { get; set; }
    public string? TenNguoiNhan { get; set; }
    public string? SoDienThoai { get; set; }
    public string? DiaChiGiao { get; set; }
    public byte TrangThai { get; set; }
    public string? LyDoHuy { get; set; }
}

public class ChiTietDonHang
{
    public int MaChiTietDH { get; set; }
    public int MaDonHang { get; set; }
    public int MaTacPham { get; set; }
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
}
