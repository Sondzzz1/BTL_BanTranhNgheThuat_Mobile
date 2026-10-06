namespace DoAn2_BackEnd.Models;

public static class TacPhamStatus
{
    public const byte PendingApproval = 0;
    public const byte OnSale = 1;
    public const byte Hidden = 2;
    public const byte Rejected = 3;
    public const byte Deleted = 99;
}

public class TacPham
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int MaHoaSi { get; set; }
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    /// <summary>NULL với dữ liệu cũ chưa được đối soát; chỉ giá trị 1 mới đủ điều kiện đánh dấu độc bản.</summary>
    public int? SoLuongBanDau { get; set; }
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
    public string? TenTacPhamGoc { get; set; }
    public bool KhongXacDinhTacGiaGoc { get; set; }
    public string? NguonThamKhao { get; set; }
    public int? MaYeuCauVeTranh { get; set; }
    public string? MoTaNguonGoc { get; set; }
    /// <summary>Chỉ tác phẩm độc bản mới tham gia ownership/certificate theo MaTacPham.</summary>
    public bool LaTacPhamDocBan { get; set; }
}
