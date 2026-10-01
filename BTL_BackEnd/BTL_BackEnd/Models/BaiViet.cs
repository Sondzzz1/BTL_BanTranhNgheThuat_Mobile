namespace DoAn2_BackEnd.Models;

public class BaiViet
{
    public int MaBaiViet { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public int? MaHoaSi { get; set; }
    public int? MaTaiKhoanTacGia { get; set; }
    public string? TomTat { get; set; }
    public int? MaDanhMucBaiViet { get; set; }
    public DateTime NgayDang { get; set; }
    // 0 = Draft, 1 = Pending, 2 = Published, 3 = Rejected, 4 = Archived
    public byte TrangThai { get; set; }
    public string? LyDo { get; set; } // dùng khi trạng thái = Rejected (tuỳ chọn)
    public string? AnhTieuDe { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayXuatBan { get; set; }
    public DateTime? NgayBatDauSuKien { get; set; }
    public DateTime? NgayKetThucSuKien { get; set; }
    public string? DiaDiemSuKien { get; set; }
    public string? NguonNoiDung { get; set; }
}

public class DanhMucBaiViet
{
    public int MaDanhMucBaiViet { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public bool TrangThai { get; set; }
}

public class HinhAnhBaiViet
{
    public int MaHinhAnh { get; set; }
    public int MaBaiViet { get; set; }
    public string DuongDan { get; set; } = null!;
    public string? ChuThich { get; set; }
    public int ThuTu { get; set; }
}
