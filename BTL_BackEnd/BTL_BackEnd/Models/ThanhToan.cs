namespace DoAn2_BackEnd.Models;

public class ThanhToan
{
    public int MaThanhToan { get; set; }
    public int MaDonHang { get; set; }
    public string PhuongThuc { get; set; } = null!; // COD, BankTransfer, Momo, VNPay
    public string TrangThai { get; set; } = "ChoThanhToan"; // ChoThanhToan, DaThanhToan, ThatBai, HoanTien
    public DateTime? NgayThanhToan { get; set; }
    public string? MaGiaoDich { get; set; }
}
