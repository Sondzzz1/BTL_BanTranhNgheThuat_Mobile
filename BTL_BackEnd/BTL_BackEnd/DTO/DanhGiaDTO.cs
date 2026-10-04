namespace DoAn2_BackEnd.DTO;

public class TaoDanhGiaRequest
{
    public int MaTacPham { get; set; }
    public int DanhGia { get; set; }
    public string? BinhLuan { get; set; }
}

public class TaoDanhGiaForm : TaoDanhGiaRequest
{
    public IFormFile? HinhAnhDanhGiaFile { get; set; }
}

public class CapNhatDanhGiaRequest
{
    public int DanhGia { get; set; }
    public string? BinhLuan { get; set; }
}

public class CapNhatDanhGiaForm : CapNhatDanhGiaRequest
{
    public IFormFile? HinhAnhDanhGiaFile { get; set; }
    public bool XoaHinhAnh { get; set; }
}

public class DanhGiaResponse
{
    public int MaDanhGia { get; set; }
    public int MaTacPham { get; set; }
    public string? TenTacPham { get; set; }
    public string? HinhAnhTacPham { get; set; }
    public int MaNguoiDung { get; set; }
    public string TenNguoiDung { get; set; } = string.Empty;
    public int DanhGia { get; set; }
    public string? BinhLuan { get; set; }
    public string? HinhAnhDanhGia { get; set; }
    public DateTime NgayDanhGia { get; set; }
}

public class TongHopDanhGiaResponse
{
    public int MaTacPham { get; set; }
    public int TongSoDanhGia { get; set; }
    public decimal DiemTrungBinh { get; set; }
    public int SoLuong1Sao { get; set; }
    public int SoLuong2Sao { get; set; }
    public int SoLuong3Sao { get; set; }
    public int SoLuong4Sao { get; set; }
    public int SoLuong5Sao { get; set; }
}

public class QuyenDanhGiaResponse
{
    public bool CanReview { get; set; }
    public string? Reason { get; set; }
    public DanhGiaResponse? ExistingReview { get; set; }
}
