namespace DoAn2_BackEnd.Models;

/// <summary>
/// Tranh chấp bản quyền (Copyright Dispute)
/// Lưu ý: Tên bảng là "TranhChapBanQuyen" không phải "TraanhChapBanQuyen"
/// </summary>
public class TranhChapBanQuyen
{
    public int MaTranhChap { get; set; }
    public int MaBanQuyen { get; set; }
    public int MaNguoiKhieuNai { get; set; } // MaTaiKhoan
    public string TenNguoiKhieuNai { get; set; } = null!;
    public string EmailLienHe { get; set; } = null!;
    public string? DienThoaiLienHe { get; set; }
    public string LyDoKhieuNai { get; set; } = null!;
    public string? BangChungKhieuNai { get; set; } // JSON array các đường dẫn file
    
    /// <summary>
    /// 0=OPEN, 1=UNDER_REVIEW, 2=RESOLVED, 3=DISMISSED
    /// </summary>
    public byte TrangThai { get; set; }
    
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    
    // Phản hồi từ họa sĩ
    public string? PhanHoiHoaSi { get; set; }
    public string? BangChungPhanHoi { get; set; } // JSON array
    public DateTime? NgayPhanHoi { get; set; }
    
    // Quyết định của Admin
    public int? NguoiXuLy { get; set; } // MaTaiKhoan (Admin)
    public string? KetQua { get; set; }
    public DateTime? NgayGiaiQuyet { get; set; }
}
