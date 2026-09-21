namespace DoAn2_BackEnd.DTO;

// Request từ họa sĩ tạo/cập nhật chi tiết
public class TaoChiTietTacPhamRequest
{
    public string? CauChuyenSangTac { get; set; }
    public string? YNghiaNghiThuat { get; set; }
    public string? KyThuatThucHien { get; set; }
    public string? CamHungSangTao { get; set; }
    public string? ThongTinBosung { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public int? NamSangTac { get; set; }
    public string? DiaDiemSangTac { get; set; }
    public string? HinhAnh1 { get; set; }
    public string? HinhAnh2 { get; set; }
    public string? HinhAnh3 { get; set; }
    public string? HinhAnh4 { get; set; }
}

// Response chi tiết tác phẩm (đầy đủ)
public class ChiTietTacPhamResponse
{
    public int MaChiTiet { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    
    // Nội dung
    public string? CauChuyenSangTac { get; set; }
    public string? YNghiaNghiThuat { get; set; }
    public string? KyThuatThucHien { get; set; }
    public string? CamHungSangTao { get; set; }
    public string? ThongTinBosung { get; set; }
    
    // Thông tin kỹ thuật
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public int? NamSangTac { get; set; }
    public string? DiaDiemSangTac { get; set; }
    
    // Hình ảnh
    public string? HinhAnh1 { get; set; }
    public string? HinhAnh2 { get; set; }
    public string? HinhAnh3 { get; set; }
    public string? HinhAnh4 { get; set; }
    
    // Trạng thái
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public string? LyDoTuChoi { get; set; }
    
    // Thời gian
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayDuyet { get; set; }
    public string? TenNguoiDuyet { get; set; }
}

// Response công khai (chỉ hiển thị khi đã duyệt)
public class ChiTietTacPhamCongKhaiResponse
{
    public int MaChiTiet { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public string? AvatarHoaSi { get; set; }
    
    // Nội dung
    public string? CauChuyenSangTac { get; set; }
    public string? YNghiaNghiThuat { get; set; }
    public string? KyThuatThucHien { get; set; }
    public string? CamHungSangTao { get; set; }
    public string? ThongTinBosung { get; set; }
    
    // Thông tin kỹ thuật
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public int? NamSangTac { get; set; }
    public string? DiaDiemSangTac { get; set; }
    
    // Hình ảnh
    public string? HinhAnh1 { get; set; }
    public string? HinhAnh2 { get; set; }
    public string? HinhAnh3 { get; set; }
    public string? HinhAnh4 { get; set; }
}

// Danh sách chi tiết chờ duyệt (Admin)
public class ChiTietChoDuyetResponse
{
    public int MaChiTiet { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? HinhAnh { get; set; }
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
}

// Request duyệt chi tiết (Admin)
public class DuyetChiTietTacPhamRequest
{
    public bool PheDuyet { get; set; }
    public string? LyDoTuChoi { get; set; }
}
