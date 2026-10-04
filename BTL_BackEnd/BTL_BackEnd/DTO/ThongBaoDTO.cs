namespace DoAn2_BackEnd.DTO;

public class ThongBaoResponse
{
    public long MaThongBao { get; set; }
    public string Loai { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string NoiDung { get; set; } = null!;
    public string? LoaiDoiTuong { get; set; }
    public int? MaDoiTuong { get; set; }
    public string? DuongDan { get; set; }
    public bool DaDoc { get; set; }
    public DateTime NgayTao { get; set; }
}

public class ThongBaoPageResponse
{
    public List<ThongBaoResponse> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
