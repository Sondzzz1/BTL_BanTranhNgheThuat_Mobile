using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IHoaSiBusiness
{
    // Hồ sơ
    Task<HoSoHoaSiResponse?> GetHoSo(int maHoaSi);
    Task<bool> CapNhatHoSo(int maHoaSi, CapNhatHoSoHoaSiRequest request);
    Task<bool> UploadAvatar(int maHoaSi, string avatarUrl);

    // Tác phẩm
    Task<List<TacPhamHoaSiResponse>> GetTacPhamCuaToi(int maHoaSi);
    Task<TacPhamHoaSiResponse?> GetTacPhamById(int maTacPham);
    Task<int> TaoTacPham(int maHoaSi, TaoTacPhamRequest request);
    Task<bool> CapNhatTacPham(int maHoaSi, int maTacPham, CapNhatTacPhamRequest request);
    Task<bool> XoaTacPham(int maHoaSi, int maTacPham);
    Task<bool> KhoiPhucTacPham(int maHoaSi, int maTacPham);
    Task<List<TacPhamHoaSiResponse>> GetTacPhamDaXoa(int maHoaSi);
    Task<bool> CapNhatTrangThaiTacPham(int maHoaSi, int maTacPham, CapNhatTrangThaiTacPhamRequest request);
    Task<bool> GuiDuyetLaiTacPham(int maHoaSi, int maTacPham);

    // Bài viết
    Task<List<BaiVietResponse>> GetBaiVietCuaToi(int maHoaSi);
    Task<BaiVietResponse?> GetBaiVietById(int maBaiViet);
    Task<int> TaoBaiViet(int maHoaSi, TaoBaiVietRequest request);
    Task<bool> CapNhatBaiViet(int maHoaSi, int maBaiViet, CapNhatBaiVietRequest request);
    Task<bool> XoaBaiViet(int maHoaSi, int maBaiViet);
    // Draft -> Pending (Gửi duyệt)
    Task<bool> GuiDuyetBaiViet(int maHoaSi, int maBaiViet);

    // Doanh thu
    Task<DoanhThuTongQuanResponse> GetDoanhThuTongQuan(int maHoaSi);
    Task<List<DoanhThuChiTietResponse>> GetDoanhThuChiTiet(int maHoaSi);
    Task<List<DoanhThuTheoThang>> GetDoanhThuTheoThang(int maHoaSi, int nam);
    Task<List<DoanhThuTheoTacPhamResponse>> GetDoanhThuTheoTacPham(int maHoaSi);
    Task<List<DonHangResponse>> GetDonHangCuaToi(int maHoaSi);

    // Chi tiết tác phẩm
    Task<TacPhamThongKeResponse?> GetTacPhamThongKe(int maHoaSi, int maTacPham);
    Task<List<TacPhamDonHangResponse>> GetTacPhamDonHang(int maHoaSi, int maTacPham);
    Task<List<TacPhamDoanhThuTheoThangResponse>> GetTacPhamDoanhThuTheoThang(int maHoaSi, int maTacPham, int nam);
}
