namespace DoAn2_BackEnd.DTO;

public class HoaSiCreateDTO
{
    public int? MaTaiKhoan { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
}

public class HoaSiUpdateDTO
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
}

public class HoaSiViewDTO
{
    public int MaHoaSi { get; set; }
    public int? MaTaiKhoan { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public string? TenDangNhap { get; set; }
}

// Hồ sơ họa sĩ chi tiết
public class HoSoHoaSiResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public int SoTacPham { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("doanhThu")]
    public decimal TongDoanhThu { get; set; }
    public bool TrangThai { get; set; }
}

public class CapNhatHoSoHoaSiRequest
{
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
}

// Doanh thu
public class DoanhThuTongQuanResponse
{
    /// <summary>Doanh thu của các dòng tranh thuộc họa sĩ trước khi trừ hoàn trả.</summary>
    public decimal DoanhThuGop { get; set; }
    /// <summary>Phần giá trị bị trừ do số lượng đã hoàn trên từng dòng đơn hàng.</summary>
    public decimal GiaTriHoan { get; set; }
    /// <summary>Doanh thu của họa sĩ sau khi trừ phần đã hoàn.</summary>
    public decimal DoanhThuSauHoan { get; set; }
    /// <summary>
    /// Doanh thu của đơn đã giao và có thanh toán hợp lệ. Đây là số tiền đủ điều kiện
    /// để đối soát với họa sĩ, không phải xác nhận đã chuyển tiền.
    /// </summary>
    public decimal DoanhThuDuDieuKienChiTra { get; set; }
    /// <summary>Phí nền tảng hiện áp dụng. Hệ thống mặc định 0 cho đến khi có chính sách phí.</summary>
    public decimal PhiNenTang { get; set; }
    /// <summary>Phí thanh toán hiện áp dụng. Hệ thống mặc định 0 cho đến khi có chính sách phí.</summary>
    public decimal PhiThanhToan { get; set; }
    /// <summary>Thuế khấu trừ hiện áp dụng. Hệ thống mặc định 0 cho đến khi có chính sách thuế.</summary>
    public decimal ThueKhauTru { get; set; }
    /// <summary>Số tiền dự kiến nhận sau phí và thuế; chưa đồng nghĩa đã chi trả.</summary>
    public decimal ThucNhanDuKien { get; set; }
    /// <summary>Hệ thống chưa có sổ chi trả cho họa sĩ nên luôn là 0.</summary>
    public decimal DaChiTra { get; set; }
    public decimal ConChoChiTra { get; set; }

    // Giữ lại các trường cũ để không làm hỏng các màn hình/API client đang sử dụng.
    // TongDoanhThu có cùng ý nghĩa với DoanhThuSauHoan.
    public decimal TongDoanhThu { get; set; }
    public int SoDonHang { get; set; }
    public int SoTacPhamDaBan { get; set; }
    public decimal DoanhThuThangNay { get; set; }
}

public class DoanhThuChiTietResponse
{
    public int MaDonHang { get; set; }
    public DateTime NgayDat { get; set; }
    public DateTime? NgayGiao { get; set; }
    public string TenKhachHang { get; set; } = null!;
    /// <summary>Chỉ gồm giá trị các tác phẩm của họa sĩ trong đơn.</summary>
    public decimal DoanhThuGop { get; set; }
    public decimal GiaTriHoan { get; set; }
    public decimal DoanhThuSauHoan { get; set; }
    public decimal DoanhThuDuDieuKienChiTra { get; set; }
    /// <summary>
    /// Khoản thanh toán của đơn đã được chốt hợp lệ trong lịch sử. Giá trị này vẫn đúng
    /// với đơn đã hoàn tiền, vì đơn đó từng được thanh toán trước khi hoàn trả.
    /// </summary>
    public bool DaThanhToanHopLe { get; set; }
    /// <summary>Toàn bộ khoản thanh toán của đơn đã được hoàn lại cho khách hàng.</summary>
    public bool DaHoanTien { get; set; }
    /// <summary>
    /// Phần doanh thu còn lại của họa sĩ có thể đưa vào đối soát. Đơn hoàn toàn bộ
    /// vẫn xuất hiện trong lịch sử nhưng không đủ điều kiện đối soát.
    /// </summary>
    public bool DaDuDieuKienDoiSoat { get; set; }
    public decimal TongTien { get; set; }
    public string TrangThai { get; set; } = null!;
}

public class DoanhThuTheoTacPhamResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int SoLuongBan { get; set; }
    public decimal DoanhThu { get; set; }
}

// Tác phẩm của họa sĩ
public class TacPhamHoaSiResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public int? SoLuongBanDau { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    public string LoaiPhatHanhText => LaTacPhamDocBan ? "Tranh độc bản" : "Tranh nhiều bản";
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public string? TenHoaSi { get; set; }
    public string? LyDo { get; set; }
}

public class TacPhamAdminPageResponse
{
    public List<TacPhamHoaSiResponse> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
}

public class TaoTacPhamRequest
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; } = 1;
    /// <summary>Được khai báo duy nhất tại thời điểm tạo. Không được suy ra từ tồn kho.</summary>
    public bool LaTacPhamDocBan { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
}

public class CapNhatTacPhamRequest
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
}

public class CapNhatTrangThaiTacPhamRequest
{
    // 0=Pending, 1=Approved, 2=Hidden, 3=Rejected
    public byte TrangThai { get; set; }
}

// Chi tiết tác phẩm - Thống kê
public class TacPhamThongKeResponse
{
    public int TongSoLuongBan { get; set; }
    public decimal TongDoanhThu { get; set; }
    public int SoDonHang { get; set; }
    public int SoLuongConLai { get; set; }
    public decimal DoanhThuThangNay { get; set; }
    public int SoLuongBanThangNay { get; set; }
}

// Chi tiết tác phẩm - Đơn hàng
public class TacPhamDonHangResponse
{
    public int MaDonHang { get; set; }
    public string MaHD { get; set; } = null!;
    public DateTime NgayDat { get; set; }
    public string TenKhachHang { get; set; } = null!;
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal ThanhTien { get; set; }
    public string TrangThai { get; set; } = null!;
    public string TrangThaiClass { get; set; } = null!;
}

// Chi tiết tác phẩm - Doanh thu theo tháng
public class TacPhamDoanhThuTheoThangResponse
{
    public string Thang { get; set; } = null!;
    public decimal DoanhThu { get; set; }
    public int SoLuong { get; set; }
}

// Tác phẩm chỉnh sửa chờ duyệt
public class TacPhamChinhSuaResponse
{
    public int MaChinhSua { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? TenHoaSi { get; set; }
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? HinhAnh { get; set; }
    public byte TrangThai { get; set; }
    public DateTime NgayChinhSua { get; set; }
    public string? LyDo { get; set; }
}

public class DuyetTacPhamChinhSuaRequest
{
    public bool PheDuyet { get; set; }
    public string? LyDo { get; set; }
}
