namespace DoAn2_BackEnd.DTO;

public class TaoThanhToanRequest
{
    public int MaDonHang { get; set; }
    public string PhuongThuc { get; set; } = "COD"; // COD, BankTransfer, Momo, VNPay
}

public class ThanhToanResponse
{
    public int MaThanhToan { get; set; }
    public int MaDonHang { get; set; }
    public string PhuongThuc { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public DateTime? NgayThanhToan { get; set; }
    public string? MaGiaoDich { get; set; }
    public decimal SoTien { get; set; }
    public string? TenKhachHang { get; set; }
}
