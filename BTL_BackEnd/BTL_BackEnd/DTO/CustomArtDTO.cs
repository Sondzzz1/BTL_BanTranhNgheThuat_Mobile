namespace DoAn2_BackEnd.DTO;

public class TaoYeuCauTranhRequest
{
    public string TieuDe { get; set; } = string.Empty;
    public string Type { get; set; } = "Original";
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
    public DateTime? NgayHoanThanhDuKien { get; set; }
}

public class BaoGiaTranhRequest
{
    public int MaYeuCau { get; set; }
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

public class TaoPhanHoiRequest
{
    public int MaYeuCau { get; set; }
    public int MaHoaSi { get; set; }
    public string NoiDung { get; set; } = string.Empty;
    public string LoaiPhanHoi { get; set; } = "ChinhSua";
}

public class CustomArtRequestResponse
{
    public int MaYeuCau { get; set; }
    public int MaKhachHang { get; set; }
    public int? MaHoaSi { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string Type { get; set; } = "Original";
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
    public decimal TienDatCoc { get; set; }
    public decimal GiaDuKien { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime NgayTao { get; set; }
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
}
