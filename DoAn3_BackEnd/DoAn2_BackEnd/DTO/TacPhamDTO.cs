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
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public string? KichThuoc { get; set; }
    public byte TrangThai { get; set; }
    public string TrangThaiText { get; set; } = null!;
    public DateTime NgayTao { get; set; }
}

public class TacPhamCreateDTO
{
    public string TenTacPham { get; set; } = null!;
    public int? MaDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; } = 1;
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
