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
    private readonly INguoiDungRepository _nguoiDungRepo;

    public ChiTietTacPhamBusiness(
        IChiTietTacPhamRepository chiTietRepo,
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        INguoiDungRepository nguoiDungRepo)
    {
        _chiTietRepo = chiTietRepo;
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _nguoiDungRepo = nguoiDungRepo;
    }

    // ================================================================
    // HỌA SĨ - TẠO CHI TIẾT
    // ================================================================
    public async Task<int> TaoChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request)
    {
        // Kiểm tra tác phẩm có thuộc họa sĩ không
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
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
            KichThuoc = request.KichThuoc?.Trim(),
            ChatLieu = request.ChatLieu?.Trim(),
            ChatLieuKhung = request.ChatLieuKhung?.Trim(),
            NamSangTac = request.NamSangTac,
            DiaDiemSangTac = request.DiaDiemSangTac?.Trim(),
            HinhAnh1 = request.HinhAnh1?.Trim(),
            HinhAnh2 = request.HinhAnh2?.Trim(),
            HinhAnh3 = request.HinhAnh3?.Trim(),
            HinhAnh4 = request.HinhAnh4?.Trim(),
            TrangThai = 0, // Chờ duyệt
            NgayTao = DateTime.UtcNow
        };

        return await _chiTietRepo.Create(maHoaSi, maTacPham, chiTiet);
    }

    // ================================================================
    // HỌA SĨ - CẬP NHẬT CHI TIẾT
    // ================================================================
    public async Task<bool> CapNhatChiTiet(int maHoaSi, int maTacPham, TaoChiTietTacPhamRequest request)
    {
        // Kiểm tra quyền
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
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
            KichThuoc = request.KichThuoc?.Trim(),
            ChatLieu = request.ChatLieu?.Trim(),
            ChatLieuKhung = request.ChatLieuKhung?.Trim(),
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
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null)
            throw new ArgumentException("Không tìm thấy tác phẩm");
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền xóa chi tiết tác phẩm này");

        return await _chiTietRepo.Delete(maHoaSi, maTacPham);
    }

    // ================================================================
    // LẤY CHI TIẾT (Họa sĩ/Admin)
    // ================================================================
    public async Task<ChiTietTacPhamResponse?> GetChiTiet(int maTacPham)
    {
        var chiTiet = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (chiTiet == null) return null;

        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return null;

        var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);

        string? tenNguoiDuyet = null;
        if (chiTiet.MaNguoiDuyet.HasValue)
        {
            var nguoiDuyet = await _nguoiDungRepo.GetById(chiTiet.MaNguoiDuyet.Value);
            tenNguoiDuyet = nguoiDuyet?.Ten;
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
            ThongTinBosung = chiTiet.ThongTinBosung,
            KichThuoc = chiTiet.KichThuoc,
            ChatLieu = chiTiet.ChatLieu,
            ChatLieuKhung = chiTiet.ChatLieuKhung,
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
            var tacPham = await _tacPhamRepo.GetById(chiTiet.MaTacPham);
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
        var chiTiet = await _chiTietRepo.GetByMaTacPham(maTacPham);
        if (chiTiet == null)
            throw new ArgumentException("Không tìm thấy chi tiết tác phẩm");

        if (!request.PheDuyet && string.IsNullOrWhiteSpace(request.LyDoTuChoi))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");

        return await _chiTietRepo.Duyet(maTacPham, maNguoiDuyet, request.PheDuyet, request.LyDoTuChoi?.Trim());
    }

    // ================================================================
    // PUBLIC - LẤY CHI TIẾT CÔNG KHAI
    // ================================================================
    public async Task<ChiTietTacPhamCongKhaiResponse?> GetChiTietCongKhai(int maTacPham)
    {
        var chiTiet = await _chiTietRepo.GetCongKhai(maTacPham);
        if (chiTiet == null) return null;

        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return null;

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
            ThongTinBosung = chiTiet.ThongTinBosung,
            KichThuoc = chiTiet.KichThuoc,
            ChatLieu = chiTiet.ChatLieu,
            ChatLieuKhung = chiTiet.ChatLieuKhung,
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
}
