using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class HoaSiBusiness : IHoaSiBusiness
{
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IBaiVietRepository _baiVietRepo;
    private readonly IDonHangRepository _donHangRepo;
    private readonly IDanhMucRepository _danhMucRepo;
    private readonly INguoiDungRepository _nguoiDungRepo;
    private readonly ITacPhamChinhSuaRepository _tacPhamChinhSuaRepo;

    public HoaSiBusiness(
        IHoaSiRepository hoaSiRepo,
        ITacPhamRepository tacPhamRepo,
        IBaiVietRepository baiVietRepo,
        IDonHangRepository donHangRepo,
        IDanhMucRepository danhMucRepo,
        INguoiDungRepository nguoiDungRepo,
        ITacPhamChinhSuaRepository tacPhamChinhSuaRepo)
    {
        _hoaSiRepo = hoaSiRepo;
        _tacPhamRepo = tacPhamRepo;
        _baiVietRepo = baiVietRepo;
        _donHangRepo = donHangRepo;
        _danhMucRepo = danhMucRepo;
        _nguoiDungRepo = nguoiDungRepo;
        _tacPhamChinhSuaRepo = tacPhamChinhSuaRepo;
    }

    // Hồ sơ
    public async Task<HoSoHoaSiResponse?> GetHoSo(int maHoaSi)
    {
        var hoaSi = await _hoaSiRepo.GetById(maHoaSi);
        if (hoaSi == null) return null;

        var tacPhamList = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var tongDoanhThu = await TinhTongDoanhThu(maHoaSi);

        return new HoSoHoaSiResponse
        {
            MaHoaSi = hoaSi.MaHoaSi,
            TenHoaSi = hoaSi.TenHoaSi,
            TieuSu = hoaSi.TieuSu,
            AnhDaiDien = hoaSi.AnhDaiDien,
            SoTacPham = tacPhamList.Count,
            TongDoanhThu = tongDoanhThu
        };
    }

    public async Task<bool> CapNhatHoSo(int maHoaSi, CapNhatHoSoHoaSiRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenHoaSi))
            throw new ArgumentException("Tên họa sĩ không được để trống");

        var hoaSi = await _hoaSiRepo.GetById(maHoaSi);
        if (hoaSi == null) return false;

        hoaSi.TenHoaSi = request.TenHoaSi.Trim();
        hoaSi.TieuSu = string.IsNullOrWhiteSpace(request.TieuSu) ? null : request.TieuSu.Trim();

        return await _hoaSiRepo.Update(hoaSi);
    }

    public async Task<bool> UploadAvatar(int maHoaSi, string avatarUrl)
    {
        var hoaSi = await _hoaSiRepo.GetById(maHoaSi);
        if (hoaSi == null) return false;

        hoaSi.AnhDaiDien = avatarUrl;
        return await _hoaSiRepo.Update(hoaSi);
    }

    // Tác phẩm
    public async Task<List<TacPhamHoaSiResponse>> GetTacPhamCuaToi(int maHoaSi)
    {
        var tacPhamList = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var result = new List<TacPhamHoaSiResponse>();

        foreach (var tacPham in tacPhamList.Where(tp => tp.TrangThai != 99))
        {
            string? tenDanhMuc = null;
            if (tacPham.MaDanhMuc.HasValue)
            {
                var danhMuc = await _danhMucRepo.GetById(tacPham.MaDanhMuc.Value);
                tenDanhMuc = danhMuc?.TenDanhMuc;
            }

            result.Add(new TacPhamHoaSiResponse
            {
                MaTacPham = tacPham.MaTacPham,
                TenTacPham = tacPham.TenTacPham,
                TenDanhMuc = tenDanhMuc,
                Gia = tacPham.Gia,
                SoLuong = tacPham.SoLuong,
                MoTa = tacPham.MoTa,
                HinhAnh = tacPham.HinhAnh,
                KichThuoc = tacPham.KichThuoc,
                ChatLieu = tacPham.ChatLieu,
                ChatLieuKhung = tacPham.ChatLieuKhung,
                TrangThai = tacPham.TrangThai,
                TrangThaiText = GetTrangThaiTacPhamText(tacPham.TrangThai),
                NgayTao = tacPham.NgayTao,
                LyDo = tacPham.LyDo
            });
        }

        return result;
    }

    public async Task<TacPhamHoaSiResponse?> GetTacPhamById(int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return null;

        string? tenDanhMuc = null;
        if (tacPham.MaDanhMuc.HasValue)
        {
            var danhMuc = await _danhMucRepo.GetById(tacPham.MaDanhMuc.Value);
            tenDanhMuc = danhMuc?.TenDanhMuc;
        }

        return new TacPhamHoaSiResponse
        {
            MaTacPham = tacPham.MaTacPham,
            TenTacPham = tacPham.TenTacPham,
            TenDanhMuc = tenDanhMuc,
            Gia = tacPham.Gia,
            SoLuong = tacPham.SoLuong,
            MoTa = tacPham.MoTa,
            HinhAnh = tacPham.HinhAnh,
            KichThuoc = tacPham.KichThuoc,
            ChatLieu = tacPham.ChatLieu,
            ChatLieuKhung = tacPham.ChatLieuKhung,
            TrangThai = tacPham.TrangThai,
            TrangThaiText = GetTrangThaiTacPhamText(tacPham.TrangThai),
            NgayTao = tacPham.NgayTao,
            LyDo = tacPham.LyDo
        };
    }

    public async Task<int> TaoTacPham(int maHoaSi, TaoTacPhamRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenTacPham))
            throw new ArgumentException("Tên tác phẩm không được để trống");
        if (request.Gia <= 0)
            throw new ArgumentException("Giá phải lớn hơn 0");
        if (request.SoLuong < 0)
            throw new ArgumentException("Số lượng không được âm");

        var tacPham = new TacPham
        {
            TenTacPham = request.TenTacPham.Trim(),
            MaHoaSi = maHoaSi,
            MaDanhMuc = request.MaDanhMuc,
            Gia = request.Gia,
            SoLuong = request.SoLuong,
            MoTa = request.MoTa?.Trim(),
            HinhAnh = request.HinhAnh?.Trim(),
            KichThuoc = request.KichThuoc?.Trim(),
            ChatLieu = request.ChatLieu?.Trim(),
            ChatLieuKhung = request.ChatLieuKhung?.Trim(),
            TrangThai = 0, // 0: Chờ duyệt (Pending Approval)
            NgayTao = DateTime.UtcNow
        };

        return await _tacPhamRepo.Create(tacPham);
    }

    public async Task<bool> CapNhatTacPham(int maHoaSi, int maTacPham, CapNhatTacPhamRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenTacPham))
            throw new ArgumentException("Tên tác phẩm không được để trống");
        if (request.Gia <= 0)
            throw new ArgumentException("Giá phải lớn hơn 0");
        if (request.SoLuong < 0)
            throw new ArgumentException("Số lượng không được âm");

        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return false;
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền sửa tác phẩm này");

        // Nếu tác phẩm đang bán (TrangThai = 1), lưu thay đổi vào bảng TacPhamChinhSua
        // để admin duyệt, KHÔNG thay đổi nội dung hiện tại
        if (tacPham.TrangThai == 1)
        {
            // Kiểm tra xem đã có bản chỉnh sửa chờ duyệt chưa
            var chinhSuaCu = await _tacPhamChinhSuaRepo.GetByMaTacPhamChoDuyet(maTacPham);
            
            if (chinhSuaCu != null)
            {
                // Cập nhật bản chỉnh sửa hiện có
                chinhSuaCu.TenTacPham = request.TenTacPham.Trim();
                chinhSuaCu.MaDanhMuc = request.MaDanhMuc;
                chinhSuaCu.Gia = request.Gia;
                chinhSuaCu.SoLuong = request.SoLuong;
                chinhSuaCu.MoTa = request.MoTa?.Trim();
                chinhSuaCu.HinhAnh = request.HinhAnh?.Trim();
                chinhSuaCu.KichThuoc = request.KichThuoc?.Trim();
                chinhSuaCu.ChatLieu = request.ChatLieu?.Trim();
                chinhSuaCu.ChatLieuKhung = request.ChatLieuKhung?.Trim();
                chinhSuaCu.NgayChinhSua = DateTime.UtcNow;
                chinhSuaCu.TrangThai = 0; // Chờ duyệt
                chinhSuaCu.LyDo = null;
                
                return await _tacPhamChinhSuaRepo.Update(chinhSuaCu);
            }
            else
            {
                // Tạo bản chỉnh sửa mới
                var chinhSuaMoi = new TacPhamChinhSua
                {
                    MaTacPham = maTacPham,
                    TenTacPham = request.TenTacPham.Trim(),
                    MaDanhMuc = request.MaDanhMuc,
                    Gia = request.Gia,
                    SoLuong = request.SoLuong,
                    MoTa = request.MoTa?.Trim(),
                    HinhAnh = request.HinhAnh?.Trim(),
                    KichThuoc = request.KichThuoc?.Trim(),
                    ChatLieu = request.ChatLieu?.Trim(),
                    ChatLieuKhung = request.ChatLieuKhung?.Trim(),
                    NgayChinhSua = DateTime.UtcNow,
                    TrangThai = 0, // Chờ duyệt
                    LyDo = null
                };
                
                var maChinhSua = await _tacPhamChinhSuaRepo.Create(chinhSuaMoi);
                return maChinhSua > 0;
            }
        }
        else
        {
            // Nếu tác phẩm chưa được duyệt hoặc bị từ chối, cập nhật trực tiếp
            tacPham.TenTacPham = request.TenTacPham.Trim();
            tacPham.MaDanhMuc = request.MaDanhMuc;
            tacPham.Gia = request.Gia;
            tacPham.SoLuong = request.SoLuong;
            tacPham.MoTa = request.MoTa?.Trim();
            tacPham.HinhAnh = request.HinhAnh?.Trim();
            tacPham.KichThuoc = request.KichThuoc?.Trim();
            tacPham.ChatLieu = request.ChatLieu?.Trim();
            tacPham.ChatLieuKhung = request.ChatLieuKhung?.Trim();

            // Nếu bị từ chối mà sửa -> đưa về Pending để admin duyệt lại
            if (tacPham.TrangThai == 3)
            {
                tacPham.TrangThai = 0;
                tacPham.LyDo = null;
            }

            return await _tacPhamRepo.Update(tacPham);
        }
    }

    public async Task<bool> XoaTacPham(int maHoaSi, int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return false;
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền xoá tác phẩm này");

        if (await _tacPhamRepo.HasDeliveredOrders(maTacPham))
            throw new InvalidOperationException("Không thể xoá tác phẩm này vì tác phẩm đã được bán và giao thành công cho khách hàng");
        
        // Soft delete: Đổi trạng thái thành 99 (Đã xóa) thay vì xóa hẳn
        tacPham.TrangThai = 99;
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> KhoiPhucTacPham(int maHoaSi, int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) 
            return false;
            
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền khôi phục tác phẩm này");
        
        if (tacPham.TrangThai != 99)
            throw new Exception("Tác phẩm này chưa bị xóa");
        
        // Khôi phục về trạng thái Chờ duyệt
        tacPham.TrangThai = 0;
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<List<TacPhamHoaSiResponse>> GetTacPhamDaXoa(int maHoaSi)
    {
        var tacPhams = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var result = new List<TacPhamHoaSiResponse>();
        
        foreach (var tp in tacPhams.Where(tp => tp.TrangThai == 99))
        {
            string? tenDanhMuc = null;
            if (tp.MaDanhMuc.HasValue)
            {
                var danhMuc = await _danhMucRepo.GetById(tp.MaDanhMuc.Value);
                tenDanhMuc = danhMuc?.TenDanhMuc;
            }
            
            result.Add(new TacPhamHoaSiResponse
            {
                MaTacPham = tp.MaTacPham,
                TenTacPham = tp.TenTacPham,
                TenDanhMuc = tenDanhMuc,
                Gia = tp.Gia,
                SoLuong = tp.SoLuong,
                MoTa = tp.MoTa,
                HinhAnh = tp.HinhAnh,
                KichThuoc = tp.KichThuoc,
                ChatLieu = tp.ChatLieu,
                ChatLieuKhung = tp.ChatLieuKhung,
                TrangThai = tp.TrangThai,
                TrangThaiText = "Đã xóa",
                NgayTao = tp.NgayTao,
                LyDo = null
            });
        }
        
        return result;
    }

    public async Task<bool> CapNhatTrangThaiTacPham(int maHoaSi, int maTacPham, CapNhatTrangThaiTacPhamRequest request)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) return false;
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền cập nhật trạng thái tác phẩm này");

        // Họa sĩ chỉ được tự ẩn (2) hoặc bật bán lại (1) tác phẩm đã từng được duyệt.
        // KHÔNG được tự đặt 0/3, không được duyệt từ Pending sang Approved (đó là việc của admin).
        if (request.TrangThai != 1 && request.TrangThai != 2)
            throw new ArgumentException("Họa sĩ chỉ được ẩn hoặc bật bán lại tác phẩm");

        // Chỉ cho chuyển trạng thái nếu hiện tại là 1 hoặc 2 (đã từng được duyệt)
        if (tacPham.TrangThai != 1 && tacPham.TrangThai != 2)
            throw new InvalidOperationException("Tác phẩm chưa được duyệt, không thể đổi trạng thái này");

        tacPham.TrangThai = request.TrangThai;
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> GuiDuyetLaiTacPham(int maHoaSi, int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null) 
            return false;
            
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền gửi duyệt tác phẩm này");
        
        // Chỉ cho phép gửi duyệt lại nếu đang bị từ chối (TrangThai = 3)
        if (tacPham.TrangThai != 3)
            throw new InvalidOperationException("Chỉ có thể gửi duyệt lại tác phẩm đã bị từ chối");
        
        // Đổi về trạng thái Chờ duyệt
        tacPham.TrangThai = 0;
        tacPham.LyDo = null; // Xóa lý do từ chối cũ
        
        return await _tacPhamRepo.Update(tacPham);
    }

    // Bài viết
    public async Task<List<BaiVietResponse>> GetBaiVietCuaToi(int maHoaSi)
    {
        var baiVietList = await _baiVietRepo.GetByHoaSi(maHoaSi);
        var hoaSi = await _hoaSiRepo.GetById(maHoaSi);
        var result = new List<BaiVietResponse>();

        foreach (var baiViet in baiVietList)
        {
            result.Add(new BaiVietResponse
            {
                MaBaiViet = baiViet.MaBaiViet,
                TieuDe = baiViet.TieuDe,
                NoiDung = baiViet.NoiDung,
                MaHoaSi = baiViet.MaHoaSi,
                TenHoaSi = hoaSi?.TenHoaSi ?? "",
                NgayDang = baiViet.NgayDang,
                TrangThai = baiViet.TrangThai,
                LyDo = baiViet.LyDo,
                AnhTieuDe = baiViet.AnhTieuDe
            });
        }

        return result;
    }

    public async Task<BaiVietResponse?> GetBaiVietById(int maBaiViet)
    {
        var baiViet = await _baiVietRepo.GetById(maBaiViet);
        if (baiViet == null) return null;

        var hoaSi = await _hoaSiRepo.GetById(baiViet.MaHoaSi);

        return new BaiVietResponse
        {
            MaBaiViet = baiViet.MaBaiViet,
            TieuDe = baiViet.TieuDe,
            NoiDung = baiViet.NoiDung,
            MaHoaSi = baiViet.MaHoaSi,
            TenHoaSi = hoaSi?.TenHoaSi ?? "",
            NgayDang = baiViet.NgayDang,
            TrangThai = baiViet.TrangThai,
            LyDo = baiViet.LyDo,
            AnhTieuDe = baiViet.AnhTieuDe
        };
    }

    public async Task<int> TaoBaiViet(int maHoaSi, TaoBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");

        var baiViet = new BaiViet
        {
            TieuDe = request.TieuDe.Trim(),
            NoiDung = request.NoiDung?.Trim(),
            AnhTieuDe = request.AnhTieuDe?.Trim(),
            MaHoaSi = maHoaSi,
            NgayDang = DateTime.UtcNow,
            TrangThai = 0 // Draft
        };

        return await _baiVietRepo.Create(baiViet);
    }

    public async Task<bool> CapNhatBaiViet(int maHoaSi, int maBaiViet, CapNhatBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");

        var baiViet = await _baiVietRepo.GetById(maBaiViet);
        if (baiViet == null) return false;
        if (baiViet.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền sửa bài viết này");

        baiViet.TieuDe = request.TieuDe.Trim();
        baiViet.NoiDung = request.NoiDung?.Trim();
        baiViet.AnhTieuDe = request.AnhTieuDe?.Trim();

        // Nếu bài đã Published mà sửa thì đưa về Pending để admin duyệt lại
        if (baiViet.TrangThai == 2 || baiViet.TrangThai == 3)
        {
            baiViet.TrangThai = 1;
            baiViet.LyDo = null;
        }

        return await _baiVietRepo.Update(baiViet);
    }

    public async Task<bool> XoaBaiViet(int maHoaSi, int maBaiViet)
    {
        var baiViet = await _baiVietRepo.GetById(maBaiViet);
        if (baiViet == null) return false;
        if (baiViet.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền xoá bài viết này");
        return await _baiVietRepo.Delete(maBaiViet);
    }

    // Draft -> Pending (Gửi duyệt)
    public async Task<bool> GuiDuyetBaiViet(int maHoaSi, int maBaiViet)
    {
        var bv = await _baiVietRepo.GetById(maBaiViet);
        if (bv == null) return false;
        if (bv.MaHoaSi != maHoaSi) return false;

        // Cho phép gửi duyệt lại nếu đang Draft hoặc Rejected
        if (bv.TrangThai != 0 && bv.TrangThai != 3) return false;

        bv.TrangThai = 1; // Pending
        bv.LyDo = null; // gửi duyệt lại thì xoá lý do từ chối cũ (nếu có)
        return await _baiVietRepo.Update(bv);
    }

    // Doanh thu
    public async Task<DoanhThuTongQuanResponse> GetDoanhThuTongQuan(int maHoaSi)
    {
        var allDonHang = await GetDonHangCoTacPhamCuaHoaSi(maHoaSi);
        var donHangDaGiao = allDonHang.Where(dh => dh.TrangThai == DonHangStatus.DaGiao).ToList();

        var tongDoanhThu = await TinhTongDoanhThu(maHoaSi);

        var now = DateTime.UtcNow;
        var doanhThuThangNay = donHangDaGiao
            .Where(dh => dh.NgayDat.Year == now.Year && dh.NgayDat.Month == now.Month)
            .Sum(dh => dh.TongTien);

        var soTacPhamDaBan = await TinhSoTacPhamDaBan(maHoaSi);

        return new DoanhThuTongQuanResponse
        {
            TongDoanhThu = tongDoanhThu,
            SoDonHang = donHangDaGiao.Count,
            SoTacPhamDaBan = soTacPhamDaBan,
            DoanhThuThangNay = doanhThuThangNay
        };
    }

    public async Task<List<DoanhThuChiTietResponse>> GetDoanhThuChiTiet(int maHoaSi)
    {
        var donHangList = (await GetDonHangCoTacPhamCuaHoaSi(maHoaSi))
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();
        var result = new List<DoanhThuChiTietResponse>();

        foreach (var donHang in donHangList)
        {
            var nd = await _nguoiDungRepo.GetById(donHang.MaNguoiDung);
            result.Add(new DoanhThuChiTietResponse
            {
                MaDonHang = donHang.MaDonHang,
                NgayDat = donHang.NgayDat,
                TenKhachHang = donHang.TenNguoiNhan ?? nd?.Ten ?? "Khách hàng",
                TongTien = donHang.TongTien,
                TrangThai = DonHangStatus.GetText(donHang.TrangThai)
            });
        }

        return result;
    }

    public async Task<List<DoanhThuTheoThang>> GetDoanhThuTheoThang(int maHoaSi, int nam)
    {
        var donHangList = (await GetDonHangCoTacPhamCuaHoaSi(maHoaSi))
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();
        var result = new List<DoanhThuTheoThang>();

        for (int thang = 1; thang <= 12; thang++)
        {
            var donHangThang = donHangList
                .Where(dh => dh.NgayDat.Year == nam && dh.NgayDat.Month == thang)
                .ToList();

            result.Add(new DoanhThuTheoThang
            {
                Nam = nam,
                Thang = thang,
                TongDoanhThu = donHangThang.Sum(dh => dh.TongTien),
                SoDonHang = donHangThang.Count
            });
        }

        return result;
    }

    public async Task<List<DoanhThuTheoTacPhamResponse>> GetDoanhThuTheoTacPham(int maHoaSi)
    {
        var tacPhamList = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var result = new List<DoanhThuTheoTacPhamResponse>();

        foreach (var tacPham in tacPhamList)
        {
            var (soLuongBan, doanhThu) = await TinhDoanhThuTacPham(tacPham.MaTacPham);

            result.Add(new DoanhThuTheoTacPhamResponse
            {
                MaTacPham = tacPham.MaTacPham,
                TenTacPham = tacPham.TenTacPham,
                SoLuongBan = soLuongBan,
                DoanhThu = doanhThu
            });
        }

        return result.OrderByDescending(x => x.DoanhThu).ToList();
    }

    public async Task<List<DonHangResponse>> GetDonHangCuaToi(int maHoaSi)
    {
        var donHangList = await GetDonHangCoTacPhamCuaHoaSi(maHoaSi);
        var result = new List<DonHangResponse>();

        foreach (var donHang in donHangList)
        {
            result.Add(new DonHangResponse
            {
                MaDonHang = donHang.MaDonHang,
                NgayDat = donHang.NgayDat,
                TongTien = donHang.TongTien,
                TenNguoiNhan = donHang.TenNguoiNhan ?? "",
                SoDienThoai = donHang.SoDienThoai ?? "",
                DiaChiGiao = donHang.DiaChiGiao ?? "",
                TrangThai = donHang.TrangThai,
                TrangThaiText = GetTrangThaiDonHangText(donHang.TrangThai),
                ChiTiet = new List<ChiTietDonHangResponse>()
            });
        }

        return result;
    }

    // Helper methods
    private async Task<decimal> TinhTongDoanhThu(int maHoaSi)
    {
        var donHangList = (await GetDonHangCoTacPhamCuaHoaSi(maHoaSi))
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();

        // Doanh thu của họa sĩ chỉ tính phần các tác phẩm của họ trong đơn
        var tacPhamCuaHoaSi = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var maTacPhamSet = tacPhamCuaHoaSi.Select(tp => tp.MaTacPham).ToHashSet();

        decimal tong = 0;
        foreach (var dh in donHangList)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(dh.MaDonHang);
            tong += chiTiet
                .Where(ct => maTacPhamSet.Contains(ct.MaTacPham))
                .Sum(ct => ct.SoLuong * ct.DonGia);
        }
        return tong;
    }

    private async Task<int> TinhSoTacPhamDaBan(int maHoaSi)
    {
        var tacPhamList = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        int tongSoLuong = 0;

        foreach (var tacPham in tacPhamList)
        {
            var (soLuongBan, _) = await TinhDoanhThuTacPham(tacPham.MaTacPham);
            tongSoLuong += soLuongBan;
        }

        return tongSoLuong;
    }

    private async Task<List<DonHang>> GetDonHangCoTacPhamCuaHoaSi(int maHoaSi)
    {
        var allDonHang = await _donHangRepo.GetAll();
        var tacPhamCuaHoaSi = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        var maTacPhamList = tacPhamCuaHoaSi.Select(tp => tp.MaTacPham).ToList();

        var result = new List<DonHang>();
        foreach (var donHang in allDonHang)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(donHang.MaDonHang);
            if (chiTiet.Any(ct => maTacPhamList.Contains(ct.MaTacPham)))
            {
                result.Add(donHang);
            }
        }

        return result;
    }

    private async Task<(int soLuongBan, decimal doanhThu)> TinhDoanhThuTacPham(int maTacPham)
    {
        var allDonHang = (await _donHangRepo.GetAll())
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();
        int soLuongBan = 0;
        decimal doanhThu = 0;

        foreach (var donHang in allDonHang)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(donHang.MaDonHang);
            var chiTietTacPham = chiTiet.Where(ct => ct.MaTacPham == maTacPham);
            
            foreach (var ct in chiTietTacPham)
            {
                soLuongBan += ct.SoLuong;
                doanhThu += ct.SoLuong * ct.DonGia;
            }
        }

        return (soLuongBan, doanhThu);
    }

    private string GetTrangThaiTacPhamText(byte trangThai)
    {
        return trangThai switch
        {
            0 => "Chờ duyệt",
            1 => "Đang bán",
            2 => "Ẩn (ngừng bán tạm thời)",
            3 => "Từ chối",
            _ => "Không xác định"
        };
    }

    private string GetTrangThaiDonHangText(byte trangThai) => DonHangStatus.GetText(trangThai);

    // Chi tiết tác phẩm - Thống kê
    public async Task<TacPhamThongKeResponse?> GetTacPhamThongKe(int maHoaSi, int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi) return null;

        var allDonHang = (await _donHangRepo.GetAll())
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();

        int tongSoLuongBan = 0;
        decimal tongDoanhThu = 0;
        int soDonHang = 0;
        decimal doanhThuThangNay = 0;
        int soLuongBanThangNay = 0;
        var now = DateTime.UtcNow;

        foreach (var donHang in allDonHang)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(donHang.MaDonHang);
            var chiTietTacPham = chiTiet.Where(ct => ct.MaTacPham == maTacPham).ToList();

            if (chiTietTacPham.Count > 0)
            {
                soDonHang++;
                foreach (var ct in chiTietTacPham)
                {
                    tongSoLuongBan += ct.SoLuong;
                    tongDoanhThu += ct.SoLuong * ct.DonGia;

                    if (donHang.NgayDat.Year == now.Year && donHang.NgayDat.Month == now.Month)
                    {
                        soLuongBanThangNay += ct.SoLuong;
                        doanhThuThangNay += ct.SoLuong * ct.DonGia;
                    }
                }
            }
        }

        return new TacPhamThongKeResponse
        {
            TongSoLuongBan = tongSoLuongBan,
            TongDoanhThu = tongDoanhThu,
            SoDonHang = soDonHang,
            SoLuongConLai = tacPham.SoLuong,
            DoanhThuThangNay = doanhThuThangNay,
            SoLuongBanThangNay = soLuongBanThangNay
        };
    }

    // Chi tiết tác phẩm - Đơn hàng
    public async Task<List<TacPhamDonHangResponse>> GetTacPhamDonHang(int maHoaSi, int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi)
            return new List<TacPhamDonHangResponse>();

        var allDonHang = await _donHangRepo.GetAll();
        var result = new List<TacPhamDonHangResponse>();

        foreach (var donHang in allDonHang)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(donHang.MaDonHang);
            var chiTietTacPham = chiTiet.Where(ct => ct.MaTacPham == maTacPham).ToList();

            if (chiTietTacPham.Count > 0)
            {
                var nd = await _nguoiDungRepo.GetById(donHang.MaNguoiDung);
                string tenKhachHang = donHang.TenNguoiNhan ?? nd?.Ten ?? "Khách hàng";

                foreach (var ct in chiTietTacPham)
                {
                    result.Add(new TacPhamDonHangResponse
                    {
                        MaDonHang = donHang.MaDonHang,
                        MaHD = "DH" + donHang.MaDonHang.ToString("D6"),
                        NgayDat = donHang.NgayDat,
                        TenKhachHang = tenKhachHang,
                        SoLuong = ct.SoLuong,
                        DonGia = ct.DonGia,
                        ThanhTien = ct.SoLuong * ct.DonGia,
                        TrangThai = DonHangStatus.GetText(donHang.TrangThai),
                        TrangThaiClass = GetTrangThaiClass(donHang.TrangThai)
                    });
                }
            }
        }

        return result.OrderByDescending(x => x.NgayDat).ToList();
    }

    // Chi tiết tác phẩm - Doanh thu theo tháng
    public async Task<List<TacPhamDoanhThuTheoThangResponse>> GetTacPhamDoanhThuTheoThang(int maHoaSi, int maTacPham, int nam)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi)
            return new List<TacPhamDoanhThuTheoThangResponse>();

        var allDonHang = (await _donHangRepo.GetAll())
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao && dh.NgayDat.Year == nam)
            .ToList();

        var result = new List<TacPhamDoanhThuTheoThangResponse>();

        for (int thang = 1; thang <= 12; thang++)
        {
            decimal doanhThu = 0;
            int soLuong = 0;

            var donHangThang = allDonHang.Where(dh => dh.NgayDat.Month == thang).ToList();
            foreach (var dh in donHangThang)
            {
                var chiTiet = await _donHangRepo.GetChiTiet(dh.MaDonHang);
                var chiTietTacPham = chiTiet.Where(ct => ct.MaTacPham == maTacPham);
                foreach (var ct in chiTietTacPham)
                {
                    doanhThu += ct.SoLuong * ct.DonGia;
                    soLuong += ct.SoLuong;
                }
            }

            result.Add(new TacPhamDoanhThuTheoThangResponse
            {
                Thang = "Tháng " + thang,
                DoanhThu = doanhThu,
                SoLuong = soLuong
            });
        }

        return result;
    }

    private string GetTrangThaiClass(byte trangThai) => trangThai switch
    {
        0 => "pending",
        1 => "confirmed",
        2 => "shipping",
        3 => "success",
        4 => "canceling",
        5 => "canceled",
        _ => "unknown"
    };
}
