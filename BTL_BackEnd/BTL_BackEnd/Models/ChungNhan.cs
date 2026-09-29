namespace DoAn2_BackEnd.Models;

/// <summary>
/// Chứng nhận tác phẩm (Certificate of Authenticity)
/// </summary>
public class ChungNhan
{
    public int MaChungNhan { get; set; }
    public int MaLichSuSoHuu { get; set; }
    public int? MaTacPham { get; set; }
    public int? MaNguoiDung { get; set; }
    public string CertificateCode { get; set; } = null!; // COA-2026-XXXXXXXXXXXX
    public string? ContentHash { get; set; } // Legacy; module hiện tại không sử dụng hash/QR
    public DateTime NgayCap { get; set; }
    
    /// <summary>
    /// 1=ACTIVE, 2=SUPERSEDED, 3=REVOKED, 4=EXPIRED
    /// </summary>
    public byte TrangThai { get; set; }
    
    public string? NguoiCap { get; set; } // "Hệ thống tự động" hoặc tên Admin
    public DateTime? NgayThuHoi { get; set; }
    public string? LyDoThuHoi { get; set; }
    public string? DuongDanPDF { get; set; } // /certificates/COA-2026-XXXX.pdf
    public string? DuongDanQR { get; set; } // Legacy; không dùng trong module mới
    
    /// <summary>
    /// Cho phép chủ sở hữu hiển thị tên công khai khi verify. Mặc định = false (che tên).
    /// </summary>
    public bool HienThiChuSoHuu { get; set; }
    
    public DateTime NgayTao { get; set; }
}
