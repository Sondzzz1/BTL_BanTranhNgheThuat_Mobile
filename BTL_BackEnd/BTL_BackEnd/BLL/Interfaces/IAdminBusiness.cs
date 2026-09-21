using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IAdminBusiness
{
    Task<DashboardResponse> GetDashboard();
    Task<ThongKeTongQuanResponse> GetThongKeTongQuan();
    Task<ThongKeNhanhResponse> GetThongKeNhanh(DateTime ngay);
    
    Task<List<DonHangAdminResponse>> GetAllDonHang(byte? trangThai = null, DateTime? tuNgay = null, DateTime? denNgay = null);
    Task<DonHangResponse> GetDonHangById(int id);
    Task<bool> CapNhatTrangThaiDonHang(int id, CapNhatTrangThaiDonHangRequest request);
    Task<bool> XoaDonHang(int id);
    Task<List<DonHangAdminResponse>> TimKiemDonHang(string? keyword, byte? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuGia, decimal? denGia, int pageNumber, int pageSize);
    
    Task<List<ThongTinKhachHangResponse>> GetAllKhachHang();
    Task<ThongTinKhachHangResponse> GetKhachHangById(int id);
    Task<List<DonHangResponse>> GetDonHangCuaKhachHang(int id);
    Task<bool> KhoaKhachHang(int id);
    Task<bool> MoKhoaKhachHang(int id);
    Task<List<ThongTinKhachHangResponse>> TimKiemKhachHang(string? keyword, bool? trangThai, decimal? tuChiTieu, decimal? denChiTieu, int? tuSoDonHang, int? denSoDonHang, int pageNumber, int pageSize);
    Task<List<ThongTinKhachHangResponse>> LocKhachHangTheoHoatDong(string loai);
    
    Task<List<HoSoHoaSiResponse>> GetAllHoaSi();
    Task<HoSoHoaSiResponse> GetHoaSiById(int id);
    Task<List<TacPhamHoaSiResponse>> GetTacPhamCuaHoaSi(int id);
    Task<bool> KhoaHoaSi(int id);
    Task<bool> MoKhoaHoaSi(int id);
    Task<TaoTaiKhoanHoaSiResponse> TaoTaiKhoanHoaSi(TaoTaiKhoanHoaSiRequest request);
    Task<List<HoSoHoaSiResponse>> TimKiemHoaSi(string? keyword, bool? trangThai, int? tuSoTacPham, int? denSoTacPham, decimal? tuDoanhThu, decimal? denDoanhThu, int pageNumber, int pageSize);
    Task<List<HoaSiXepHangResponse>> XepHangHoaSi(string tieuChi, int top);
    
    Task<List<TacPhamHoaSiResponse>> GetAllTacPham(byte? trangThai = null);
    Task<bool> DuyetTacPham(int id, DuyetTacPhamRequest request);
    Task<bool> HideTacPham(int id);
    Task<bool> ShowTacPham(int id);
    Task<bool> XoaTacPham(int id);
    Task<List<TacPhamHoaSiResponse>> TimKiemTacPham(string? keyword, int? maDanhMuc, int? maHoaSi, byte? trangThai, decimal? tuGia, decimal? denGia, int? tuSoLuong, int? denSoLuong, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize);
    Task<List<TacPhamHoaSiResponse>> LocTacPhamTheoTieuChi(string tieuChi);
    
    Task<List<TacPhamChinhSuaResponse>> GetAllTacPhamChinhSua();
    Task<bool> DuyetTacPhamChinhSua(int maChinhSua, DuyetTacPhamChinhSuaRequest request);
    
    Task<List<BaiVietResponse>> GetAllBaiViet(byte? trangThai = null);
    Task<bool> DuyetBaiViet(int id, DuyetBaiVietRequest request);
    Task<bool> ArchiveBaiViet(int id);
    Task<bool> XoaBaiViet(int id);
    Task<List<BaiVietResponse>> TimKiemBaiViet(string? keyword, int? maHoaSi, bool? trangThai, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize);
    
    Task<List<DanhMucResponse>> GetAllDanhMuc();
    Task<DanhMucResponse> GetDanhMucById(int id);
    Task<int> TaoDanhMuc(TaoDanhMucRequest request);
    Task<bool> CapNhatDanhMuc(int id, CapNhatDanhMucRequest request);
    Task<bool> XoaDanhMuc(int id);
    Task<List<DanhMucResponse>> TimKiemDanhMuc(string? keyword);
    
    Task<List<ThanhToanResponse>> GetAllThanhToan(string? trangThai, DateTime? tuNgay, DateTime? denNgay);
    Task<ThanhToanResponse> GetThanhToanById(int id);
    Task<bool> XacNhanThanhToan(int id);
    
    Task<List<DoanhThuTheoThangResponse>> GetDoanhThuTheoThang(int nam);
    Task<List<DoanhThuTheoHoaSiResponse>> GetDoanhThuTheoHoaSi(DateTime? tuNgay, DateTime? denNgay);
    Task<List<TacPhamBanChayResponse>> GetTacPhamBanChay(int top);
    Task<List<KhachHangTiemNangResponse>> GetKhachHangTiemNang(int top);
    Task<ThongKeTrangThaiDonHangResponse> GetThongKeTrangThaiDonHang();

    Task<List<HoaDonResponse>> GetAllHoaDon(DateTime? tuNgay, DateTime? denNgay);
    Task<HoaDonChiTietResponse> GetHoaDonById(int id);
    Task<int> TaoHoaDonTuDonHang(int maDonHang);
    Task<bool> HuyHoaDon(int id, string lyDo);
    Task<List<NoiDungResponse>> GetAllNoiDung(string? loai);
    Task<int> TaoNoiDung(TaoNoiDungRequest request);
    Task<bool> CapNhatNoiDung(int id, CapNhatNoiDungRequest request);
    Task<bool> XoaNoiDung(int id);
    Task<TimKiemTongHopResponse> TimKiemTongHop(string keyword);
    Task<byte[]> XuatBaoCaoDoanhThu(DateTime tuNgay, DateTime denNgay, string format);
    Task<byte[]> XuatBaoCaoDonHang(DateTime tuNgay, DateTime denNgay, string format);
    Task<TimKiemDonHangResponse> TimKiemDonHangNangCao(TimKiemDonHangRequest request);
    Task<List<ThanhToanResponse>> TimKiemThanhToan(string? keyword, string? phuongThuc, string? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuSoTien, decimal? denSoTien, int pageNumber, int pageSize);
    Task<List<HoaDonResponse>> TimKiemHoaDon(string? keyword, string? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuSoTien, decimal? denSoTien, int pageNumber, int pageSize);
    Task<ThongKeSoSanhResponse> GetThongKeSoSanh(DateTime tuNgay1, DateTime denNgay1, DateTime tuNgay2, DateTime denNgay2);
    Task<List<DonHangAdminResponse>> SapXepDonHang(string sapXepTheo, string thuTu);
    Task<List<TacPhamHoaSiResponse>> SapXepTacPham(string sapXepTheo, string thuTu);
}
