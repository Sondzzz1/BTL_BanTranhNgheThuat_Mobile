namespace DoAn2_BackEnd.Models;

public enum ConsultationStatus
{
    Draft = 0,
    Submitted = 1,
    Confirmed = 2,
    Rejected = 3,
    InProgress = 4,
    Completed = 5,
    Cancelled = 6,
}

public class ConsultationBooking
{
    public int MaLichTuVan { get; set; }
    public int MaKhachHang { get; set; }
    public int? MaHoaSi { get; set; }
    public int? MaNhanVien { get; set; }
    public DateTime Ngay { get; set; }
    public TimeSpan Gio { get; set; }
    public string DiaChi { get; set; } = string.Empty;
    public string NhuCau { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public ConsultationStatus TrangThai { get; set; } = ConsultationStatus.Submitted;
    public string? KetQuaTuVan { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

public class ConsultationCriteria
{
    public int MaTieuChi { get; set; }
    public int MaLichTuVan { get; set; }
    public string LoaiTieuChi { get; set; } = string.Empty;
    public string GiaTri { get; set; } = string.Empty;
}

public class ConsultationImage
{
    public int MaHinhAnh { get; set; }
    public int MaLichTuVan { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
}

public class ConsultationRecommendation
{
    public int MaDeXuat { get; set; }
    public int MaLichTuVan { get; set; }
    public int MaTacPham { get; set; }
    public decimal GiaDeXuat { get; set; }
    public string? GhiChu { get; set; }
    public string TrangThai { get; set; } = "Pending";
}
