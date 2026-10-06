namespace DoAn2_BackEnd.Models;

public class HoaDonBan
{
    public int MaHoaDon { get; set; }
    public int MaDonHang { get; set; }
    public int MaNguoiDung { get; set; }
    public DateTime NgayXuatHD { get; set; }
    public decimal TongTienHang { get; set; }
    public string? TenNguoiMua { get; set; }
    public string? DiaChiNguoiMua { get; set; }
    public string? SoDienThoaiNguoiMua { get; set; }
    public string? Email { get; set; }
    public string? PhuongThucThanhToan { get; set; }
    public string? TrangThaiThanhToan { get; set; }
    public string? GhiChu { get; set; }
    public string TrangThai { get; set; } = "HopLe"; // HopLe, DaHuy

    public List<ChiTietHoaDonBan> ChiTiet { get; set; } = new();
}

public class ChiTietHoaDonBan
{
    public int MaChiTietHD { get; set; }
    public int MaHoaDon { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
}
