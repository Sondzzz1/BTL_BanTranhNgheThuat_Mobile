using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class ChiTietTacPhamBusiness : IChiTietTacPhamBusiness
{
    private readonly IChiTietTacPhamRepository _chiTietRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly ITaiKhoanRepository _taiKhoanRepo;

    public ChiTietTacPhamBusiness(
        IChiTietTacPhamRepository chiTietRepo,
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        ITaiKhoanRepository taiKhoanRepo)
    {
        _chiTietRepo = chiTietRepo;
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _taiKhoanRepo = taiKhoanRepo;
    }

    // ================================================================
    // HỌA SĨ - TẠO CHI TIẾT
    // ================================================================
    public async Task<int> TaoChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request)
    {
        ValidateRequest(request);
        // Kiểm tra tác phẩm có thuộc họa sĩ không
        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        if (tacPham == null)
            throw new ArgumentException("Không tìm thấy tác phẩm");
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền tạo chi tiết cho tác phẩm này");

        // Kiểm tra đã có chi tiết chưa
        var existing = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (existing != null)
            throw new InvalidOperationException("Tác phẩm đã có chi tiết. Vui lòng cập nhật thay vì tạo mới");

        var chiTiet = new ChiTietTacPham
        {
            MaTacPham = maTacPham,
            CauChuyenSangTac = request.CauChuyenSangTac?.Trim(),
            YNghiaNghiThuat = request.YNghiaNghiThuat?.Trim(),
            KyThuatThucHien = request.KyThuatThucHien?.Trim(),
            CamHungSangTao = request.CamHungSangTao?.Trim(),
            ThongTinBosung = request.ThongTinBosung?.Trim(),
            // TacPham is the canonical source for technical sales data. These
            // legacy columns are kept only for schema compatibility.
            KichThuoc = tacPham.KichThuoc,
            ChatLieu = tacPham.ChatLieu,
            ChatLieuKhung = tacPham.ChatLieuKhung,
            NamSangTac = request.NamSangTac,
            DiaDiemSangTac = request.DiaDiemSangTac?.Trim(),
            HinhAnh1 = request.HinhAnh1?.Trim(),
            HinhAnh2 = request.HinhAnh2?.Trim(),
            HinhAnh3 = request.HinhAnh3?.Trim(),
            HinhAnh4 = request.HinhAnh4?.Trim(),
            TrangThai = 0, // Chờ duyệt
            NgayTao = DateTime.UtcNow
        };

        var id = await _chiTietRepo.Create(maHoaSi, maTacPham, chiTiet);
        if (id <= 0) throw new InvalidOperationException("Không thể tạo nội dung hoặc tác phẩm đã có nội dung chi tiết");
        return id;
    }

    // ================================================================
    // HỌA SĨ - CẬP NHẬT CHI TIẾT
    // ================================================================
    public async Task<bool> CapNhatChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request)
    {
        ValidateRequest(request);
        // Kiểm tra quyền
        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        if (tacPham == null)
            throw new ArgumentException("Không tìm thấy tác phẩm");
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền cập nhật chi tiết tác phẩm này");

        // Kiểm tra chi tiết có tồn tại không
        var existing = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (existing == null)
            throw new ArgumentException("Chi tiết tác phẩm chưa tồn tại. Vui lòng tạo mới");

        var chiTiet = new ChiTietTacPham
        {
            MaTacPham = maTacPham,
            CauChuyenSangTac = request.CauChuyenSangTac?.Trim(),
            YNghiaNghiThuat = request.YNghiaNghiThuat?.Trim(),
            KyThuatThucHien = request.KyThuatThucHien?.Trim(),
            CamHungSangTao = request.CamHungSangTao?.Trim(),
            ThongTinBosung = request.ThongTinBosung?.Trim(),
            KichThuoc = tacPham.KichThuoc,
            ChatLieu = tacPham.ChatLieu,
            ChatLieuKhung = tacPham.ChatLieuKhung,
            NamSangTac = request.NamSangTac,
            DiaDiemSangTac = request.DiaDiemSangTac?.Trim(),
            HinhAnh1 = request.HinhAnh1?.Trim(),
            HinhAnh2 = request.HinhAnh2?.Trim(),
            HinhAnh3 = request.HinhAnh3?.Trim(),
            HinhAnh4 = request.HinhAnh4?.Trim()
        };

        return await _chiTietRepo.Update(maHoaSi, maTacPham, chiTiet);
    }

    // ================================================================
    // HỌA SĨ - XÓA CHI TIẾT
    // ================================================================
    public async Task<bool> XoaChiTiet(int maHoaSi, int maTacPham)
    {
        // Kiểm tra quyền
        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        if (tacPham == null)
            throw new ArgumentException("Không tìm thấy tác phẩm");
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền xóa chi tiết tác phẩm này");

        return await _chiTietRepo.Delete(maHoaSi, maTacPham);
    }

    public async Task<bool> CoQuyenQuanLy(int maHoaSi, int maTacPham)
    {
        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        return tacPham != null && tacPham.MaHoaSi == maHoaSi;
    }

    // ================================================================
    // LẤY CHI TIẾT (Họa sĩ/Admin)
    // ================================================================
    public async Task<ChiTietTacPhamResponse?> GetChiTiet(int maTacPham)
    {
        var chiTiet = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (chiTiet == null) return null;

        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        if (tacPham == null) return null;

        var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);

        string? tenNguoiDuyet = null;
        if (chiTiet.MaNguoiDuyet.HasValue)
        {
            var nguoiDuyet = await _taiKhoanRepo.GetById(chiTiet.MaNguoiDuyet.Value);
            tenNguoiDuyet = nguoiDuyet?.TenDangNhap;
        }

        return new ChiTietTacPhamResponse
        {
            MaChiTiet = chiTiet.MaChiTiet,
            MaTacPham = chiTiet.MaTacPham,
            TenTacPham = tacPham.TenTacPham,
            MaHoaSi = tacPham.MaHoaSi,
            TenHoaSi = hoaSi?.TenHoaSi ?? "",
            CauChuyenSangTac = chiTiet.CauChuyenSangTac,
            YNghiaNghiThuat = chiTiet.YNghiaNghiThuat,
            KyThuatThucHien = chiTiet.KyThuatThucHien,
            CamHungSangTao = chiTiet.CamHungSangTao,
            // Các bản ghi cũ từng tự sao chép MoTa của tác phẩm vào đây khi tạo tranh.
            // MoTa là thông tin hồ sơ tác phẩm, không phải nội dung chi tiết để xét duyệt.
            ThongTinBosung = GetThongTinBoSungRieng(chiTiet.ThongTinBosung, tacPham.MoTa),
            KichThuoc = tacPham.KichThuoc,
            ChatLieu = tacPham.ChatLieu,
            ChatLieuKhung = tacPham.ChatLieuKhung,
            NamSangTac = chiTiet.NamSangTac,
            DiaDiemSangTac = chiTiet.DiaDiemSangTac,
            HinhAnh1 = chiTiet.HinhAnh1,
            HinhAnh2 = chiTiet.HinhAnh2,
            HinhAnh3 = chiTiet.HinhAnh3,
            HinhAnh4 = chiTiet.HinhAnh4,
            TrangThai = chiTiet.TrangThai,
            TrangThaiText = GetTrangThaiText(chiTiet.TrangThai),
            LyDoTuChoi = chiTiet.LyDoTuChoi,
            NgayTao = chiTiet.NgayTao,
            NgayCapNhat = chiTiet.NgayCapNhat,
            NgayDuyet = chiTiet.NgayDuyet,
            TenNguoiDuyet = tenNguoiDuyet
        };
    }

    // ================================================================
    // ADMIN - LẤY DANH SÁCH CHỜ DUYỆT
    // ================================================================
    public async Task<List<ChiTietChoDuyetResponse>> GetDanhSachChoDuyet()
    {
        var list = await _chiTietRepo.GetAllChoDuyet();
        var result = new List<ChiTietChoDuyetResponse>();

        foreach (var chiTiet in list)
        {
            var tacPham = await GetMarketplaceArtworkInternal(chiTiet.MaTacPham);
            if (tacPham == null) continue;

            var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);

            result.Add(new ChiTietChoDuyetResponse
            {
                MaChiTiet = chiTiet.MaChiTiet,
                MaTacPham = chiTiet.MaTacPham,
                TenTacPham = tacPham.TenTacPham,
                HinhAnh = tacPham.HinhAnh,
                MaHoaSi = tacPham.MaHoaSi,
                TenHoaSi = hoaSi?.TenHoaSi ?? "",
                NgayTao = chiTiet.NgayTao,
                NgayCapNhat = chiTiet.NgayCapNhat,
                TrangThai = chiTiet.TrangThai,
                TrangThaiText = GetTrangThaiText(chiTiet.TrangThai)
            });
        }

        return result;
    }

    // ================================================================
    // ADMIN - LẤY TẤT CẢ CHI TIẾT
    // ================================================================
    public async Task<List<ChiTietTacPhamResponse>> GetTatCaChiTiet(int trangThai = -1)
    {
        var list = await _chiTietRepo.GetAll(trangThai);
        var result = new List<ChiTietTacPhamResponse>();

        foreach (var chiTiet in list)
        {
            var response = await GetChiTiet(chiTiet.MaTacPham);
            if (response != null)
            {
                result.Add(response);
            }
        }

        return result;
    }

    // ================================================================
    // ADMIN - DUYỆT CHI TIẾT
    // ================================================================
    public async Task<bool> DuyetChiTiet(int maTacPham, int maNguoiDuyet, DuyetChiTietTacPhamRequest request)
    {
        var tacPham = await GetMarketplaceArtworkInternal(maTacPham);
        if (tacPham == null)
            throw new ArgumentException("Không tìm thấy tác phẩm marketplace");
        var chiTiet = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (chiTiet == null)
            throw new ArgumentException("Không tìm thấy chi tiết tác phẩm");

        if (!request.PheDuyet && string.IsNullOrWhiteSpace(request.LyDoTuChoi))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");

        if (chiTiet.TrangThai != 0)
            throw new InvalidOperationException("Chỉ nội dung đang chờ duyệt mới có thể được xử lý");

        ThongBao? notification = null;
        if (!request.PheDuyet)
        {
            var reason = request.LyDoTuChoi!.Trim();
            notification = new ThongBao
            {
                Loai = "ARTWORK_CONTENT_REJECTED",
                TieuDe = "Nội dung tác phẩm cần chỉnh sửa",
                NoiDung = $"Tác phẩm “{tacPham.TenTacPham}” chưa được duyệt. Lý do: {reason}",
                LoaiDoiTuong = "TacPham",
                MaDoiTuong = maTacPham,
                DuongDan = $"/artist/artworks/{maTacPham}",
                EventKey = $"ARTWORK_CONTENT_REVIEW:{maTacPham}:REJECTED"
            };
        }
        return await _chiTietRepo.Duyet(maTacPham, maNguoiDuyet, request.PheDuyet, request.LyDoTuChoi?.Trim(), notification);
    }

    // ================================================================
    // PUBLIC - LẤY CHI TIẾT CÔNG KHAI
    // ================================================================
    public async Task<ChiTietTacPhamCongKhaiResponse?> GetChiTietCongKhai(int maTacPham)
    {
        var chiTiet = await _chiTietRepo.GetCongKhai(maTacPham);
        if (chiTiet == null) return null;

        var tacPham = await _tacPhamRepo.GetMarketplaceById(maTacPham);
        if (tacPham == null || tacPham.TrangThai != TacPhamStatus.OnSale) return null;

        var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);

        return new ChiTietTacPhamCongKhaiResponse
        {
            MaChiTiet = chiTiet.MaChiTiet,
            MaTacPham = chiTiet.MaTacPham,
            TenTacPham = tacPham.TenTacPham,
            TenHoaSi = hoaSi?.TenHoaSi ?? "",
            AvatarHoaSi = hoaSi?.AnhDaiDien,
            CauChuyenSangTac = chiTiet.CauChuyenSangTac,
            YNghiaNghiThuat = chiTiet.YNghiaNghiThuat,
            KyThuatThucHien = chiTiet.KyThuatThucHien,
            CamHungSangTao = chiTiet.CamHungSangTao,
            ThongTinBosung = GetThongTinBoSungRieng(chiTiet.ThongTinBosung, tacPham.MoTa),
            KichThuoc = tacPham.KichThuoc,
            ChatLieu = tacPham.ChatLieu,
            ChatLieuKhung = tacPham.ChatLieuKhung,
            NamSangTac = chiTiet.NamSangTac,
            DiaDiemSangTac = chiTiet.DiaDiemSangTac,
            HinhAnh1 = chiTiet.HinhAnh1,
            HinhAnh2 = chiTiet.HinhAnh2,
            HinhAnh3 = chiTiet.HinhAnh3,
            HinhAnh4 = chiTiet.HinhAnh4
        };
    }

    // ================================================================
    // HELPER
    // ================================================================
    private string GetTrangThaiText(byte trangThai)
    {
        return trangThai switch
        {
            0 => "Chờ duyệt",
            1 => "Đã duyệt",
            2 => "Từ chối",
            _ => "Không xác định"
        };
    }

    private static string? GetThongTinBoSungRieng(string? thongTinBosung, string? moTaTacPham)
    {
        var detail = string.IsNullOrWhiteSpace(thongTinBosung) ? null : thongTinBosung.Trim();
        var basicDescription = string.IsNullOrWhiteSpace(moTaTacPham) ? null : moTaTacPham.Trim();

        // Không xóa dữ liệu lịch sử; chỉ không trả về bản sao mô tả cơ bản như nội dung chi tiết.
        return detail != null && string.Equals(detail, basicDescription, StringComparison.Ordinal)
            ? null
            : detail;
    }

    /// <summary>
    /// Artist/Admin management must see a newly created marketplace artwork while it is
    /// pending approval. GetMarketplaceById is intentionally sellable/public-facing and
    /// therefore cannot be used for this private workflow.
    /// </summary>
    private async Task<TacPham?> GetMarketplaceArtworkInternal(int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        return tacPham?.MaYeuCauVeTranh == null ? tacPham : null;
    }

    private static void ValidateRequest(TaoChiTietTacPhamRequest request)
    {
        static void Check(string? value, int max, string name)
        {
            if (value?.Trim().Length > max) throw new ArgumentException($"{name} không được vượt quá {max} ký tự");
            if (value?.StartsWith("data:", StringComparison.OrdinalIgnoreCase) == true)
                throw new ArgumentException($"{name} không được lưu dưới dạng Base64");
        }

        Check(request.CauChuyenSangTac, 5000, "Câu chuyện sáng tác");
        Check(request.YNghiaNghiThuat, 5000, "Ý nghĩa nghệ thuật");
        Check(request.KyThuatThucHien, 5000, "Kỹ thuật thực hiện");
        Check(request.CamHungSangTao, 5000, "Cảm hứng sáng tạo");
        Check(request.ThongTinBosung, 5000, "Thông tin bổ sung");
        Check(request.DiaDiemSangTac, 300, "Địa điểm sáng tác");
        Check(request.HinhAnh1, 500, "Ảnh 1"); Check(request.HinhAnh2, 500, "Ảnh 2");
        Check(request.HinhAnh3, 500, "Ảnh 3"); Check(request.HinhAnh4, 500, "Ảnh 4");
        if (request.NamSangTac.HasValue && (request.NamSangTac < 1000 || request.NamSangTac > DateTime.UtcNow.Year))
            throw new ArgumentException("Năm sáng tác không hợp lệ");
    }
}
