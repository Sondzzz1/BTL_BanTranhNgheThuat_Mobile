namespace DoAn2_BackEnd.Models;

/// <summary>
/// Bản ghi quản lý bản quyền (Copyright) của tác phẩm
/// </summary>
public class BanQuyen
{
    public int MaBanQuyen { get; set; }
    public int MaTacPham { get; set; }
    public int? MaTacGia { get; set; } // MaHoaSi nếu tác giả là họa sĩ trong hệ thống
    public int? MaNguoiGiuQuyen { get; set; } // Không đồng nghĩa chủ sở hữu vật chất
    public string? TacGia { get; set; }
    
    /// <summary>
    /// 0=PENDING, 1=NEED_INFO, 2=VERIFIED, 3=REJECTED, 4=DISPUTED, 5=LEGACY
    /// </summary>
    public byte TrangThai { get; set; }
    
    /// <summary>
    /// Trạng thái trước khi bị tranh chấp (dùng để khôi phục khi DISMISSED/RESOLVED)
    /// </summary>
    public byte? TrangThaiTruocTranhChap { get; set; }
    
    public DateTime? NgaySangTac { get; set; }
    public string? NguonGoc { get; set; }
    public string? MoTa { get; set; }
    public string? GhiChu { get; set; }
    public string? SoDangKy { get; set; } // Số đăng ký bản quyền tại cơ quan nhà nước (nếu có)
    public DateTime NgayTao { get; set; }
    public DateTime NgayCapNhat { get; set; }
    public int? NguoiTao { get; set; } // MaTaiKhoan
    public int? NguoiCapNhat { get; set; } // MaTaiKhoan
    public string? LyDo { get; set; } // Lý do từ chối hoặc yêu cầu bổ sung
    public string? GhiChuKiemDuyet { get; set; }
    public int? NguoiKiemDuyet { get; set; }
    public DateTime? NgayKiemDuyet { get; set; }
}
