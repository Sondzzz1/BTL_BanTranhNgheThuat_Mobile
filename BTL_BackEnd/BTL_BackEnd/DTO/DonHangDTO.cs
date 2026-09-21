namespace DoAn2_BackEnd.DTO;

public class DonHangCreateDTO
{
    public int MaNguoiDung { get; set; }
    public string? TenNguoiNhan { get; set; }
    public string? SoDienThoai { get; set; }
    public string? DiaChiGiao { get; set; }
    public List<ChiTietDonHangCreateDTO> ChiTiet { get; set; } = new();
}

public class DonHangUpdateDTO
{
    public int MaDonHang { get; set; }
    public string? TenNguoiNhan { get; set; }
    public string? SoDienThoai { get; set; }
    public string? DiaChiGiao { get; set; }
    public byte TrangThai { get; set; }
    public string? LyDoHuy { get; set; }
}

public class DonHangViewDTO
{
    public int MaDonHang { get; set; }
    public int MaNguoiDung { get; set; }
    public string? TenNguoiDung { get; set; }
    public DateTime NgayDat { get; set; }
    public decimal TongTien { get; set; }
    public string? TenNguoiNhan { get; set; }
    public string? SoDienThoai { get; set; }
    public string? DiaChiGiao { get; set; }
    public byte TrangThai { get; set; }
    public string? LyDoHuy { get; set; }
    public List<ChiTietDonHangViewDTO> ChiTiet { get; set; } = new();
}

public class ChiTietDonHangCreateDTO
{
    public int MaTacPham { get; set; }
    public int SoLuong { get; set; }
}

public class ChiTietDonHangViewDTO
{
    public int MaChiTietDH { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public string? HinhAnh { get; set; }
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
}
