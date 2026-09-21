namespace DoAn2_BackEnd.DTO;

public class BaiVietResponse
{
    public int MaBaiViet { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public DateTime NgayDang { get; set; }
    public byte TrangThai { get; set; }
    public string? LyDo { get; set; }
    public string? AnhTieuDe { get; set; }
}

public class TaoBaiVietRequest
{
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public string? AnhTieuDe { get; set; }
}

public class CapNhatBaiVietRequest
{
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public string? AnhTieuDe { get; set; }
}
