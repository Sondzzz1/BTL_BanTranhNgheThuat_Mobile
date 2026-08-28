using System;
using System.Collections.Generic;

namespace DoAn2_BackEnd.DTO
{
    // ==========================================
    // DTO NỘI DUNG (CONTENT) - THỰC SỰ THIẾU
    // ==========================================
    
    public class TaoNoiDungRequest
    {
        public int MaTacPham { get; set; }
        public string TieuDe { get; set; } = null!;
        public string? MoTa { get; set; }
        public string Loai { get; set; } = "MoTa"; 
        public bool TrangThai { get; set; }
    }

    public class CapNhatNoiDungRequest
    {
        public string TieuDe { get; set; } = null!;
        public string? MoTa { get; set; }
        public string Loai { get; set; } = "MoTa";
        public bool TrangThai { get; set; }
    }

    public class NoiDungResponse
    {
        public int MaNoiDung { get; set; }
        public int MaTacPham { get; set; }
        public string? TenTacPham { get; set; }
        public string TieuDe { get; set; } = null!;
        public string? MoTa { get; set; }
        public string Loai { get; set; } = null!;
        public bool TrangThai { get; set; }
    }

    // ==========================================
    // ALIAS MAPPING (CHỈ MAP CÁC TÊN BỊ THIẾU)
    // ==========================================

    public class DanhMucResponse : DanhMucViewDTO { }
    public class TaoDanhMucRequest : DanhMucCreateDTO { }
    public class CapNhatDanhMucRequest : DanhMucUpdateDTO { }
    
    public class DoanhThuTheoThangResponse : DoanhThuTheoThang { }
    public class DoanhThuTheoHoaSiResponse : HoaSiTop { }
    public class TacPhamBanChayResponse : TacPhamBanChay { }
    public class KhachHangTiemNangResponse : KhachHangTop { }

    // ==========================================
    // CÁC CLASS MỚI CHO ADMIN (HÓA ĐƠN & TÌM KIẾM TỔNG HỢP)
    // ==========================================

    public class TimKiemTongHopResponse
    {
        public List<TacPhamResponse> TacPhams { get; set; } = new();
        public List<HoaSiResponse> HoaSis { get; set; } = new();
        public List<BaiVietResponse> BaiViets { get; set; } = new();
    }

    public class TacPhamResponse
    {
        public int MaTacPham { get; set; }
        public string TenTacPham { get; set; } = null!;
        public decimal Gia { get; set; }
        public string? HinhAnh { get; set; }
    }

    public class HoaSiResponse
    {
        public int MaHoaSi { get; set; }
        public string TenHoaSi { get; set; } = null!;
        public string? AnhDaiDien { get; set; }
    }

    public class ThongKeTrangThaiDonHangResponse
    {
        public int ChoXuLy { get; set; }
        public int DangGiao { get; set; }
        public int HoanThanh { get; set; }
        public int DaHuy { get; set; }
        public decimal TongDoanhThu { get; set; }
    }

    public class HoaDonResponse
    {
        public int MaDonHang { get; set; }
        public DateTime NgayDat { get; set; }
        public string TenKhachHang { get; set; } = null!;
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = null!;
    }

    public class HoaDonChiTietResponse : HoaDonResponse
    {
        public List<DonHangChiTietResponse> ChiTiet { get; set; } = new();
    }

    public class DonHangChiTietResponse
    {
        public int MaTacPham { get; set; }
        public string TenTacPham { get; set; } = null!;
        public int SoLuong { get; set; }
        public decimal Gia { get; set; }
        public decimal ThanhTien => SoLuong * Gia;
    }

    public class HuyHoaDonRequest
    {
        public string LyDo { get; set; } = null!;
    }
}
