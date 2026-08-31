namespace DoAn2_BackEnd.Models;

/// <summary>
/// Model lưu trữ nội dung chỉnh sửa tác phẩm đang chờ duyệt
/// </summary>
public class TacPhamChinhSua
{
    public int MaChinhSua { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public DateTime NgayChinhSua { get; set; }
    public byte TrangThai { get; set; } // 0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối
    public string? LyDo { get; set; }
    
    // Navigation properties
    public TacPham? TacPham { get; set; }
    public DanhMuc? DanhMuc { get; set; }
}
