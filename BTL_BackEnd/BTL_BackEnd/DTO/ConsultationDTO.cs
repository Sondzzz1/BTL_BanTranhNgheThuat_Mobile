namespace DoAn2_BackEnd.DTO;

public class TaoLichTuVanRequest
{
    public DateTime Ngay { get; set; }
    public TimeSpan Gio { get; set; }
    public string DiaChi { get; set; } = string.Empty;
    public string NhuCau { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public string? KetQuaTuVan { get; set; }
}

public class TaoKetQuaTuVanRequest
{
    public int MaLichTuVan { get; set; }
    public string KetQuaTuVan { get; set; } = string.Empty;
}

public class TaoDeXuatTranhRequest
{
    public int MaLichTuVan { get; set; }
    public int MaTacPham { get; set; }
    public decimal GiaDeXuat { get; set; }
    public string? GhiChu { get; set; }
}

public class ConsultationBookingResponse
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
    public string TrangThai { get; set; } = string.Empty;
    public string? KetQuaTuVan { get; set; }
    public DateTime NgayTao { get; set; }
}
