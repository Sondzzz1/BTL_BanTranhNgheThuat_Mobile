namespace DoAn2_BackEnd.Models;

/// <summary>
/// Lịch sử sở hữu vật chất của tác phẩm
/// Lưu ý: MaNguoiDung và MaHoaSi đều nullable, đúng một trong hai phải NOT NULL (CHECK constraint)
/// </summary>
public class LichSuSoHuu
{
    public int MaLichSuSoHuu { get; set; }
    public int MaTacPham { get; set; }
    
    /// <summary>
    /// ID người dùng (khách hàng) sở hữu. NULL nếu chủ sở hữu là họa sĩ.
    /// CHECK constraint: (MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL)
    /// </summary>
    public int? MaNguoiDung { get; set; }
    
    /// <summary>
    /// ID họa sĩ sở hữu. NULL nếu chủ sở hữu là khách hàng.
    /// CHECK constraint: (MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL)
    /// </summary>
    public int? MaHoaSi { get; set; }
    
    public DateTime NgayNhan { get; set; } // Ngày nhận sở hữu
    public DateTime? NgayChuyenGiao { get; set; } // Ngày chuyển giao cho người khác
    
    /// <summary>
    /// 0=CREATION, 1=SALE, 2=RESALE, 3=RETURN
    /// </summary>
    public byte LoaiChuyenGiao { get; set; }
    
    /// <summary>
    /// 1=CURRENT, 2=TRANSFERRED, 3=REVERSED
    /// </summary>
    public byte TrangThai { get; set; }
    
    public int? MaDonHang { get; set; } // Nếu có giao dịch
    public string? GhiChu { get; set; }
    public DateTime NgayTao { get; set; }
}
