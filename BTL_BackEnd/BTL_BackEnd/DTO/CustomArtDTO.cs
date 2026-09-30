namespace DoAn2_BackEnd.DTO;

public class TaoYeuCauTranhRequest
{
    public string TieuDe { get; set; } = string.Empty;
    public string Type { get; set; } = "ORIGINAL_COMMISSION";
    public string LoaiTranh { get; set; } = string.Empty;
    public string KichThuoc { get; set; } = string.Empty;
    public string ChuDe { get; set; } = string.Empty;
    public string MauSac { get; set; } = string.Empty;
    public string PhongCach { get; set; } = string.Empty;
    public string ChatLieu { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public string? AnhThamKhao { get; set; }
    public int? ReferenceArtworkId { get; set; }
    public string? ReferenceArtworkName { get; set; }
    public string? ReferenceArtistName { get; set; }
    public string? ReferenceImageUrl { get; set; }
    public string? NguonTacPhamGoc { get; set; }
    public string? TinhTrangQuyenSuDung { get; set; }
    public bool DaXacNhanQuyenTaiLieu { get; set; }
    public string? MoTaQuyenSuDung { get; set; }
    public string? BangChungQuyenSuDung { get; set; }
    public decimal GiaDuKien { get; set; }
    public DateTime? NgayHoanThanhDuKien { get; set; }
}

public class CapNhatYeuCauTranhRequest : TaoYeuCauTranhRequest
{
}

public class XuLyYeuCauRequest
{
    public string? GhiChu { get; set; }
}

public class CapNhatTrangThaiYeuCauRequest
{
    public string TrangThai { get; set; } = string.Empty;
}

public class HoanThanhYeuCauRequest
{
    public string? TenTacPhamMoi { get; set; }
    public string? HinhAnhTacPham { get; set; }
    public string? MoTaNguonGoc { get; set; }
    public string? GhiChuHoanThien { get; set; }
}

public class HoanThanhYeuCauForm : HoanThanhYeuCauRequest
{
    public IFormFile? AnhTacPhamFile { get; set; }
}

public class TaoYeuCauTranhForm : TaoYeuCauTranhRequest
{
    public IFormFile? AnhThamKhaoFile { get; set; }
    public IFormFile? AnhTacPhamGocFile { get; set; }
    public IFormFile? BangChungQuyenSuDungFile { get; set; }
}

public class BaoGiaTranhRequest
{
    public int MaYeuCau { get; set; }
    // Kept for old clients. Backend ignores it and uses the artist id from JWT.
    public int MaHoaSi { get; set; }
    public decimal GiaBaoGia { get; set; }
    public string ThoiGianHoanThanh { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
}

public class TaoTienDoRequest
{
    public int MaYeuCau { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTa { get; set; } = string.Empty;
    public string? AnhPreview { get; set; }
    public string TrangThai { get; set; } = "InProgress";
}

public class TaoTienDoForm : TaoTienDoRequest
{
    public IFormFile? AnhPreviewFile { get; set; }
}

public class TaoPhanHoiRequest
{
    public int MaYeuCau { get; set; }
    // Kept for old clients. Repository resolves the assigned artist from the request.
    public int MaHoaSi { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string LoaiPhanHoi { get; set; } = "ChinhSua";
}

public class CustomArtRequestResponse
{
    public int MaYeuCau { get; set; }
    public int MaKhachHang { get; set; }
    public string? TenKhachHang { get; set; }
    public int? MaHoaSi { get; set; }
    public string? TenHoaSiThucHien { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string Type { get; set; } = "ORIGINAL_COMMISSION";
    public string LoaiTranh { get; set; } = string.Empty;
    public string KichThuoc { get; set; } = string.Empty;
    public string ChuDe { get; set; } = string.Empty;
    public string MauSac { get; set; } = string.Empty;
    public string PhongCach { get; set; } = string.Empty;
    public string ChatLieu { get; set; } = string.Empty;
    public string? MoTa { get; set; }
    public string? AnhThamKhao { get; set; }
    public int? ReferenceArtworkId { get; set; }
    public string? ReferenceArtworkName { get; set; }
    public string? ReferenceArtistName { get; set; }
    public string? ReferenceImageUrl { get; set; }
    public string? NguonTacPhamGoc { get; set; }
    public string? TinhTrangQuyenSuDung { get; set; }
    public bool DaXacNhanQuyenTaiLieu { get; set; }
    public string? MoTaQuyenSuDung { get; set; }
    public string? BangChungQuyenSuDung { get; set; }
    public string? GhiChuKiemDuyet { get; set; }
    public decimal TienDatCoc { get; set; }
    public decimal GiaDuKien { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public string TrangThaiNoiBo { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public DateTime? NgayHoanThanhDuKien { get; set; }
    public int? MaTacPhamKetQua { get; set; }
    public CustomArtQuoteResponse? Quote { get; set; }
    public List<CustomArtProgressResponse> Progress { get; set; } = new();
}

public class CustomArtQuoteResponse
{
    public int MaBaoGia { get; set; }
    public int MaYeuCau { get; set; }
    public int MaHoaSi { get; set; }
    public decimal GiaBaoGia { get; set; }
    public string ThoiGianHoanThanh { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
}

public class CustomArtProgressResponse
{
    public int MaTienDo { get; set; }
    public int MaYeuCau { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTa { get; set; } = string.Empty;
    public string? AnhPreview { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
}
