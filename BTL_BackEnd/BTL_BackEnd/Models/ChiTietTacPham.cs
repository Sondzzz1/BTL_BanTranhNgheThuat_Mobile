namespace DoAn2_BackEnd.Models;

public class ChiTietTacPham
{
    public int MaChiTiet { get; set; }
    public int MaTacPham { get; set; }
    
    // Nội dung chi tiết
    public string? CauChuyenSangTac { get; set; }
    public string? YNghiaNghiThuat { get; set; }
    public string? KyThuatThucHien { get; set; }
    public string? CamHungSangTao { get; set; }
    public string? ThongTinBosung { get; set; }
    
    // Thông tin kỹ thuật chi tiết
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public int? NamSangTac { get; set; }
    public string? DiaDiemSangTac { get; set; }
    
    // Hình ảnh bổ sung
    public string? HinhAnh1 { get; set; }
    public string? HinhAnh2 { get; set; }
    public string? HinhAnh3 { get; set; }
    public string? HinhAnh4 { get; set; }
    
    // Trạng thái duyệt
    public byte TrangThai { get; set; } // 0=Chờ duyệt, 1=Đã duyệt, 2=Từ chối
    public string? LyDoTuChoi { get; set; }
    
    // Thời gian
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayDuyet { get; set; }
    public int? MaNguoiDuyet { get; set; }
}
