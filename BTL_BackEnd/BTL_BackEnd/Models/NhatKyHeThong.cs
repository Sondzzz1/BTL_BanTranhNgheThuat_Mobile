namespace DoAn2_BackEnd.Models;

/// <summary>
/// Nhật ký hệ thống (Audit Log) - CHỈ được INSERT, không cho UPDATE/DELETE
/// </summary>
public class NhatKyHeThong
{
    public long MaNhatKy { get; set; }
    public string TenDoiTuong { get; set; } = null!; // "BanQuyen", "ChungNhan", "LichSuSoHuu", etc.
    public int MaDoiTuong { get; set; } // ID của đối tượng
    public string HanhDong { get; set; } = null!; // "Tao", "Sua", "XacMinh", "TuChoi", "ThuHoi", etc.
    public string? GiaTriTruoc { get; set; } // JSON
    public string? GiaTriSau { get; set; } // JSON
    public int? NguoiThucHien { get; set; } // MaTaiKhoan
    public byte? VaiTro { get; set; } // 0=Admin, 1=NguoiDung, 2=HoaSi
    public DateTime ThoiGian { get; set; }
    public string? DiaChiIP { get; set; }
    public string? LyDo { get; set; }
    public string? ThongTinBoSung { get; set; } // JSON cho thông tin thêm
}
