namespace DoAn2_BackEnd.DTO;

public class TacPhamViewDTO
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public int MaHoaSi { get; set; }
    public string? TenHoaSi { get; set; }
    public int? MaDanhMuc { get; set; }
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public int? SoLuongBanDau { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public string? KichThuoc { get; set; }
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public byte LoaiTacPham { get; set; }
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public int? MaYeuCauVeTranh { get; set; }
    public string? MoTaNguonGoc { get; set; }
}

public class TacPhamCreateDTO
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; } = 1;
    public bool LaTacPhamDocBan { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public string? KichThuoc { get; set; }
}

public class TacPhamUpdateDTO
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public string? KichThuoc { get; set; }
}

/// <summary>
/// Bộ lọc dành cho màn hình quản trị tác phẩm. Các giá trị lọc được xử lý
/// ngay tại SQL để danh sách vẫn phản hồi tốt khi số lượng tác phẩm lớn.
/// </summary>
public class AdminArtworkQuery
{
    public string? Keyword { get; set; }
    public int? MaHoaSi { get; set; }
    public int? MaDanhMuc { get; set; }
    public byte? TrangThai { get; set; }
    public bool? LaTacPhamDocBan { get; set; }
    /// <summary>con_hang | sap_het | het_hang</summary>
    public string? TonKho { get; set; }
    /// <summary>newest | oldest | price_asc | price_desc | stock_asc | stock_desc | artist</summary>
    public string? SapXep { get; set; } = "newest";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdminArtworkFilterOption
{
    public int Id { get; set; }
    public string Ten { get; set; } = null!;
}

/// <summary>Dữ liệu nhẹ cho các ô chọn ở màn hình quản lý tác phẩm.</summary>
public class AdminArtworkFilterOptionsResponse
{
    public List<AdminArtworkFilterOption> HoaSi { get; set; } = new();
    public List<AdminArtworkFilterOption> DanhMuc { get; set; } = new();
}
