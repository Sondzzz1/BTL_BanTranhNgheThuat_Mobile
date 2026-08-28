namespace DoAn2_BackEnd.Models;

public class BaiViet
{
    public int MaBaiViet { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public int MaHoaSi { get; set; }
    public DateTime NgayDang { get; set; }
    // 0 = Draft, 1 = Pending, 2 = Published, 3 = Rejected, 4 = Archived
    public byte TrangThai { get; set; }
    public string? LyDo { get; set; } // dùng khi trạng thái = Rejected (tuỳ chọn)
    public string? AnhTieuDe { get; set; }
}
