namespace DoAn2_BackEnd.Models;

public enum CustomArtStatus
{
    Draft = 0,
    Submitted = 1,
    PendingArtist = 2,
    Assigned = 3,
    Quoted = 4,
    CustomerAccepted = 5,
    DepositPaid = 6,
    InProgress = 7,
    PreviewSent = 8,
    RevisionRequested = 9,
    Completed = 10,
    Rejected = 11,
    Cancelled = 12
}

public class CustomArtRequest
{
    public int MaYeuCau { get; set; }
    public int MaKhachHang { get; set; }
    public int? MaHoaSi { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string LoaiTranh { get; set; } = string.Empty;
    public string KichThuoc { get; set; } = string.Empty;
    public string ChuDe { get; set; } = string.Empty;
    public string MauSac { get; set; } = string.Empty;
    public string PhongCach { get; set; } = string.Empty;
    public string ChatLieu { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public string? AnhThamKhao { get; set; }
    public decimal TienDatCoc { get; set; }
    public decimal GiaDuKien { get; set; }
    public CustomArtStatus TrangThai { get; set; } = CustomArtStatus.Submitted;
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayHoanThanhDuKien { get; set; }
}

public class CustomArtImage
{
    public int MaHinhAnh { get; set; }
    public int MaYeuCau { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

public class CustomArtQuote
{
    public int MaBaoGia { get; set; }
    public int MaYeuCau { get; set; }
    public int MaHoaSi { get; set; }
    public decimal GiaBaoGia { get; set; }
    public string ThoiGianHoanThanh { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
    public string TrangThai { get; set; } = "PendingCustomerApproval";
}

public class CustomArtProgress
{
    public int MaTienDo { get; set; }
    public int MaYeuCau { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTa { get; set; } = string.Empty;
    public string? AnhPreview { get; set; }
    public string TrangThai { get; set; } = "InProgress";
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

public class CustomArtFeedback
{
    public int MaPhanHoi { get; set; }
    public int MaYeuCau { get; set; }
    public int MaKhachHang { get; set; }
    public int MaHoaSi { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string LoaiPhanHoi { get; set; } = "ChinhSua";
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

public class CustomArtPayment
{
    public int MaThanhToan { get; set; }
    public int MaYeuCau { get; set; }
    public string LoaiThanhToan { get; set; } = "DatCoc";
    public decimal SoTien { get; set; }
    public string PhuongThuc { get; set; } = "ChuyenKhoan";
    public string TrangThai { get; set; } = "Pending";
    public DateTime NgayThanhToan { get; set; } = DateTime.UtcNow;
}
