namespace DoAn2_BackEnd.DTO;

// ================================================================
// TÌM KIẾM ĐƠN HÀNG DTOs
// ================================================================

public class TimKiemDonHangRequest
{
    public string? Keyword { get; set; }
    public byte? TrangThai { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
    public decimal? TuGia { get; set; }
    public decimal? DenGia { get; set; }
    public int? MaNguoiDung { get; set; }
    public string? DiaChiGiao { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class TimKiemDonHangResponse
{
    public List<DonHangAdminResponse> DanhSach { get; set; } = new();
    public int TongSo { get; set; }
    public int TongTrang { get; set; }
    public int TrangHienTai { get; set; }
    public decimal TongGiaTri { get; set; }
}

// ================================================================
// XẾP HẠNG HỌA SĨ DTOs
// ================================================================

public class HoaSiXepHangResponse
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? AnhDaiDien { get; set; }
    public int XepHang { get; set; }
    public int SoTacPham { get; set; }
    public int SoLuongBan { get; set; }
    public decimal TongDoanhThu { get; set; }
    public decimal DiemDanhGia { get; set; }
}

// ================================================================
// THỐNG KÊ NHANH DTOs
// ================================================================

public class ThongKeNhanhResponse
{
    public DateTime Ngay { get; set; }
    public int DonHangMoi { get; set; }
    public int DonHangHoanThanh { get; set; }
    public decimal DoanhThuNgay { get; set; }
    public int KhachHangMoi { get; set; }
    public int TacPhamMoi { get; set; }
    public int DonHangChoXuLy { get; set; }
    public decimal TyLeHoanThanh { get; set; }
}

// ================================================================
// THỐNG KÊ SO SÁNH DTOs
// ================================================================

public class ThongKeSoSanhResponse
{
    public KhoangThoiGianThongKe KyTruoc { get; set; } = new();
    public KhoangThoiGianThongKe KySau { get; set; } = new();
    public SoSanhChiTiet SoSanh { get; set; } = new();
}

public class KhoangThoiGianThongKe
{
    public DateTime TuNgay { get; set; }
    public DateTime DenNgay { get; set; }
    public int SoDonHang { get; set; }
    public decimal DoanhThu { get; set; }
    public int SoKhachHang { get; set; }
    public int SoTacPhamBan { get; set; }
    public decimal GiaTriTrungBinh { get; set; }
}

public class SoSanhChiTiet
{
    public decimal TyLeDonHang { get; set; }
    public decimal TyLeDoanhThu { get; set; }
    public decimal TyLeKhachHang { get; set; }
    public decimal TyLeTacPhamBan { get; set; }
    public string NhanXet { get; set; } = null!;
}

// ================================================================
// LỌC TÁC PHẨM DTOs
// ================================================================

public class LocTacPhamResponse
{
    public List<TacPhamHoaSiResponse> DanhSach { get; set; } = new();
    public int TongSo { get; set; }
    public string TieuChi { get; set; } = null!;
    public string MoTa { get; set; } = null!;
}

// ================================================================
// LỌC KHÁCH HÀNG DTOs
// ================================================================

public class LocKhachHangResponse
{
    public List<ThongTinKhachHangResponse> DanhSach { get; set; } = new();
    public int TongSo { get; set; }
    public string LoaiKhachHang { get; set; } = null!;
    public string MoTa { get; set; } = null!;
}
