namespace DoAn2_BackEnd.DTO;

public class BaiVietResponse
{
    public int MaBaiViet { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public int? MaHoaSi { get; set; }
    public int? MaTaiKhoanTacGia { get; set; }
    public string TenHoaSi { get; set; } = null!; // giữ tương thích client cũ
    public string TenTacGia { get; set; } = null!;
    public string? TomTat { get; set; }
    public int? MaDanhMucBaiViet { get; set; }
    public string? TenDanhMuc { get; set; }
    public DateTime NgayDang { get; set; }
    public byte TrangThai { get; set; }
    public string? LyDo { get; set; }
    public string? AnhTieuDe { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayXuatBan { get; set; }
    public DateTime? NgayBatDauSuKien { get; set; }
    public DateTime? NgayKetThucSuKien { get; set; }
    public string? DiaDiemSuKien { get; set; }
    public string? NguonNoiDung { get; set; }
    public List<HinhAnhBaiVietResponse> HinhAnhNoiDung { get; set; } = new();
    public List<TacPhamLienKetResponse> TacPhamLienQuan { get; set; } = new();
}

public class TaoBaiVietRequest
{
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public string? AnhTieuDe { get; set; }
    public string? TomTat { get; set; }
    public int? MaDanhMucBaiViet { get; set; }
    public DateTime? NgayBatDauSuKien { get; set; }
    public DateTime? NgayKetThucSuKien { get; set; }
    public string? DiaDiemSuKien { get; set; }
    public string? NguonNoiDung { get; set; }
    public List<int> MaTacPhamLienQuan { get; set; } = new();
}

public class CapNhatBaiVietRequest
{
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public string? AnhTieuDe { get; set; }
    public string? TomTat { get; set; }
    public int? MaDanhMucBaiViet { get; set; }
    public DateTime? NgayBatDauSuKien { get; set; }
    public DateTime? NgayKetThucSuKien { get; set; }
    public string? DiaDiemSuKien { get; set; }
    public string? NguonNoiDung { get; set; }
    public List<int> MaTacPhamLienQuan { get; set; } = new();
}

public class HinhAnhBaiVietResponse
{
    public int MaHinhAnh { get; set; }
    public string DuongDan { get; set; } = null!;
    public string? ChuThich { get; set; }
    public int ThuTu { get; set; }
}

public class TacPhamLienKetResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? HinhAnh { get; set; }
    public decimal Gia { get; set; }
    public string TenHoaSi { get; set; } = null!;
}

public class DanhMucBaiVietResponse
{
    public int MaDanhMucBaiViet { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public bool TrangThai { get; set; } = true;
}

public class CapNhatDanhMucBaiVietRequest
{
    public string TenDanhMuc { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public bool TrangThai { get; set; } = true;
}

public class PagedBaiVietResponse
{
    public List<BaiVietResponse> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
