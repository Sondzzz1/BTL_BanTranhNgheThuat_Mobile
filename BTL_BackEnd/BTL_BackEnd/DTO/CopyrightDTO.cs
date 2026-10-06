namespace DoAn2_BackEnd.DTO;

public class TaoBanQuyenRequest
{
    public int MaTacPham { get; set; }
    public string TacGia { get; set; } = string.Empty;
    public DateTime? NgaySangTac { get; set; }
    public string NguonGoc { get; set; } = string.Empty;
    public string? MoTaBanQuyen { get; set; }
    public string? GhiChu { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    public byte LoaiTacPham { get; set; }
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public string? TenTacPhamGoc { get; set; }
    public bool KhongXacDinhTacGiaGoc { get; set; }
    public string? MoTaNguonGoc { get; set; }
    public byte? CanCuSuDung { get; set; }
    public string? NguonThamKhao { get; set; }
    public string? SoDangKy { get; set; }
}

public class CapNhatBanQuyenRequest
{
    public string TacGia { get; set; } = string.Empty;
    public DateTime? NgaySangTac { get; set; }
    public string NguonGoc { get; set; } = string.Empty;
    public string? MoTaBanQuyen { get; set; }
    public string? GhiChu { get; set; }
    public byte LoaiTacPham { get; set; }
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public string? TenTacPhamGoc { get; set; }
    public bool KhongXacDinhTacGiaGoc { get; set; }
    public string? MoTaNguonGoc { get; set; }
    public byte? CanCuSuDung { get; set; }
    public string? NguonThamKhao { get; set; }
    public string? SoDangKy { get; set; }
}

public class KiemDuyetBanQuyenRequest
{
    public string? GhiChu { get; set; }
}

public class XacMinhSoLuongBanDauRequest
{
    public int SoLuongBanDau { get; set; }
    public string CanCuXacMinh { get; set; } = string.Empty;
}

/// <summary>
/// Admin-only correction path for a wrong initial publication declaration.
/// It is intentionally unavailable once an order, ownership event, or certificate exists.
/// </summary>
public class DieuChinhPhatHanhRequest
{
    public bool LaTacPhamDocBan { get; set; }
    public int SoLuongBanDau { get; set; }
    public string CanCuXacMinh { get; set; } = string.Empty;
}

public class ThuHoiXacMinhRequest
{
    public string LyDo { get; set; } = string.Empty;
    public bool TamAnTacPham { get; set; } = true;
}

public class BangChungBanQuyenResponse
{
    public int MaBangChung { get; set; }
    public string TenTepGoc { get; set; } = string.Empty;
    public string LoaiTep { get; set; } = string.Empty;
    public long KichThuoc { get; set; }
    public DateTime NgayTao { get; set; }
    public string DuongDanTai { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public string? Sha256 { get; set; }
}

public class BanQuyenResponse
{
    public int MaBanQuyen { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = string.Empty;
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = string.Empty;
    public string TacGia { get; set; } = string.Empty;
    public DateTime? NgaySangTac { get; set; }
    public string NguonGoc { get; set; } = string.Empty;
    public string? MoTaBanQuyen { get; set; }
    public string? GhiChu { get; set; }
    public byte TrangThaiSo { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChuKiemDuyet { get; set; }
    public DateTime? NgayKiemDuyet { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    public int? SoLuongBanDau { get; set; }
    public int SoLuongTon { get; set; }
    public int SoDonHang { get; set; }
    public byte LoaiTacPham { get; set; }
    public string LoaiTacPhamText { get; set; } = string.Empty;
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public string? TenTacPhamGoc { get; set; }
    public bool KhongXacDinhTacGiaGoc { get; set; }
    public string? MoTaNguonGoc { get; set; }
    public byte? CanCuSuDungSo { get; set; }
    public string CanCuSuDung { get; set; } = string.Empty;
    public string? NguonThamKhao { get; set; }
    public string? SoDangKy { get; set; }
    public bool LaDuLieuCu { get; set; }
    public bool BiChanBan { get; set; }
    public DateTime? NgayThuHoiXacMinh { get; set; }
    public string? LyDoThuHoiXacMinh { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime NgayCapNhat { get; set; }
    public List<BangChungBanQuyenResponse> BangChung { get; set; } = new();
}

public class BanQuyenCongKhaiResponse
{
    public bool DaKhaiBao { get; set; }
    public string TrangThai { get; set; } = "CHUA_KHAI_BAO";
    public string? TacGia { get; set; }
    public DateTime? NgaySangTac { get; set; }
    public string? NguonGoc { get; set; }
    public string? MoTaBanQuyen { get; set; }
    public byte? LoaiTacPham { get; set; }
    public string? LoaiTacPhamText { get; set; }
    public string? TacGiaGoc { get; set; }
    public string? HoaSiThucHien { get; set; }
    public string? MoTaNguonGoc { get; set; }
    public string? CanCuSuDung { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    /// <summary>Only returned after VERIFIED. NULL means legacy quantity was never verified.</summary>
    public int? SoLuongBanDau { get; set; }
    public string LuuYPhapLy { get; set; } =
        "VERIFIED chỉ có nghĩa nền tảng đã kiểm tra thông tin và bằng chứng theo quy trình nội bộ; không phải đăng ký bản quyền do cơ quan nhà nước cấp.";
}

public class ChungNhanResponse
{
    public int MaChungNhan { get; set; }
    public string MaChungNhanCongKhai { get; set; } = string.Empty;
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = string.Empty;
    public string TacGia { get; set; } = string.Empty;
    public string TenHoaSi { get; set; } = string.Empty;
    public string ChuSoHuu { get; set; } = string.Empty;
    public DateTime NgayCap { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public byte LoaiTacPham { get; set; }
    public string LoaiTacPhamText { get; set; } = string.Empty;
    public string? TacGiaGoc { get; set; }
    public string LuuYPhapLy { get; set; } =
        "Chứng nhận này do nền tảng cấp để ghi nhận thông tin tác phẩm và giao dịch, không thay thế việc đăng ký quyền tác giả tại cơ quan nhà nước có thẩm quyền.";
}

/// <summary>
/// Trạng thái chỉ đọc cho một giao dịch tranh độc bản đã giao nhưng chưa có
/// chứng nhận. Dùng để khách hàng biết chính xác điều kiện nào còn thiếu;
/// endpoint này tuyệt đối không tạo quyền sở hữu hoặc chứng nhận.
/// </summary>
public class ChungNhanChoCapResponse
{
    public int MaDonHang { get; set; }
    public int MaChiTietDonHang { get; set; }
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = string.Empty;
    public string? HinhAnh { get; set; }
    public DateTime? NgayGiao { get; set; }
    public int SoLuongTrongDon { get; set; }
    public int? SoLuongBanDau { get; set; }
    public bool DaThanhToanHopLe { get; set; }
    public bool DaGiaoThanhCong { get; set; }
    public bool DangCoYeuCauHoanTra { get; set; }
    public string TrangThaiBanQuyen { get; set; } = "CHUA_KHAI_BAO";
    public string TrangThaiChungNhan { get; set; } = string.Empty;
    public string ThongDiep { get; set; } = string.Empty;
    public bool DaDuDieuKienCap { get; set; }
}

public class ChungNhanCongKhaiResponse
{
    public bool TimThay { get; set; }
    public bool ToanVen { get; set; }
    public string MaChungNhan { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? TenTacPham { get; set; }
    public byte? LoaiTacPham { get; set; }
    public string? LoaiTacPhamText { get; set; }
    public string? TacGiaGoc { get; set; }
    public string? HoaSiThucHien { get; set; }
    public string? ChuSoHuuHienThi { get; set; }
    public DateTime? NgayCap { get; set; }
    public string LuuYPhapLy { get; set; } =
        "Chứng nhận này do nền tảng cấp để ghi nhận thông tin tác phẩm và giao dịch, không thay thế việc đăng ký quyền tác giả tại cơ quan nhà nước có thẩm quyền.";
}

public static class ArtworkTypeNames
{
    public static string Get(byte value) => value switch
    {
        0 => "Tác phẩm tự sáng tác",
        1 => "Tranh đặt vẽ nguyên bản",
        2 => "Phiên bản vẽ lại",
        3 => "Tranh đặt vẽ từ tác phẩm có sẵn",
        4 => "Tranh đặt vẽ từ tư liệu cá nhân",
        _ => "Không xác định"
    };
}

public class CopyrightAuditResponse
{
    public long MaNhatKy { get; set; }
    public string TenDoiTuong { get; set; } = string.Empty;
    public int MaDoiTuong { get; set; }
    public string HanhDong { get; set; } = string.Empty;
    public string? GiaTriTruoc { get; set; }
    public string? GiaTriSau { get; set; }
    public int? NguoiThucHien { get; set; }
    public byte? VaiTroNguoiThucHien { get; set; }
    public string? TenNguoiThucHien { get; set; }
    public DateTime ThoiGian { get; set; }
    public string? LyDo { get; set; }
    public string? ThongTinBoSung { get; set; }
}
