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
}

public class CapNhatBanQuyenRequest
{
    public string TacGia { get; set; } = string.Empty;
    public DateTime? NgaySangTac { get; set; }
    public string NguonGoc { get; set; } = string.Empty;
    public string? MoTaBanQuyen { get; set; }
    public string? GhiChu { get; set; }
}

public class KiemDuyetBanQuyenRequest
{
    public string? GhiChu { get; set; }
}

public class BangChungBanQuyenResponse
{
    public int MaBangChung { get; set; }
    public string TenTepGoc { get; set; } = string.Empty;
    public string LoaiTep { get; set; } = string.Empty;
    public long KichThuoc { get; set; }
    public DateTime NgayTao { get; set; }
    public string DuongDanTai { get; set; } = string.Empty;
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
}
