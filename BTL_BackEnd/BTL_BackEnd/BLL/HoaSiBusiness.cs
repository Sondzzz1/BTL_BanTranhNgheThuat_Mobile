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
    private readonly IThanhToanRepository _thanhToanRepo;

    public HoaSiBusiness(
        IHoaSiRepository hoaSiRepo,
        ITacPhamRepository tacPhamRepo,
        IBaiVietRepository baiVietRepo,
        IDonHangRepository donHangRepo,
        IDanhMucRepository danhMucRepo,
        INguoiDungRepository nguoiDungRepo,
        ITacPhamChinhSuaRepository tacPhamChinhSuaRepo,
        IThanhToanRepository thanhToanRepo)
    {
        _hoaSiRepo = hoaSiRepo;
        _tacPhamRepo = tacPhamRepo;
        _baiVietRepo = baiVietRepo;
        _donHangRepo = donHangRepo;
        _danhMucRepo = danhMucRepo;
        _nguoiDungRepo = nguoiDungRepo;
        _tacPhamChinhSuaRepo = tacPhamChinhSuaRepo;
        _thanhToanRepo = thanhToanRepo;
    }

    // Hồ sơ
    public async Task<HoSoHoaSiResponse?> GetHoSo(int maHoaSi)
    {
        var hoaSi = await _hoaSiRepo.GetById(maHoaSi);
        if (hoaSi == null) return null;

        var tacPhamList = await GetManagedArtworksForArtist(maHoaSi);
        var tongDoanhThu = await TinhTongDoanhThu(maHoaSi);

        return new HoSoHoaSiResponse
        {
            MaHoaSi = hoaSi.MaHoaSi,
            TenHoaSi = hoaSi.TenHoaSi,
            TieuSu = hoaSi.TieuSu,
            AnhDaiDien = hoaSi.AnhDaiDien,
            SoTacPham = tacPhamList.Count(tp => tp.TrangThai != TacPhamStatus.Deleted),
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
        // Đây là danh sách quản lý riêng của họa sĩ, không phải marketplace.
        // Vì vậy phải nhìn thấy cả tranh chờ duyệt, ẩn và bị từ chối.
        var tacPhamList = await GetManagedArtworksForArtist(maHoaSi);
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
                SoLuongBanDau = tacPham.SoLuongBanDau,
                LaTacPhamDocBan = tacPham.LaTacPhamDocBan,
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

    public async Task<TacPhamHoaSiResponse?> GetTacPhamById(int maHoaSi, int maTacPham)
    {
        var tacPham = await GetManagedArtworkForArtistRead(maTacPham);
        if (tacPham == null) return null;
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền xem tác phẩm này");

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
            SoLuongBanDau = tacPham.SoLuongBanDau,
            LaTacPhamDocBan = tacPham.LaTacPhamDocBan,
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
        ExclusiveArtworkPolicy.EnsureCreateDeclaration(request.LaTacPhamDocBan, request.SoLuong);

        var tacPham = new TacPham
        {
            TenTacPham = request.TenTacPham.Trim(),
            MaHoaSi = maHoaSi,
            MaDanhMuc = request.MaDanhMuc,
            Gia = request.Gia,
            SoLuong = request.SoLuong,
            SoLuongBanDau = request.SoLuong,
            LaTacPhamDocBan = request.LaTacPhamDocBan,
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

        var tacPham = await GetManagedArtworkForArtistMutation(maTacPham);
        if (tacPham == null) return false;
        if (tacPham.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền sửa tác phẩm này");

        // The initial publication declaration is intentionally immutable in the artist edit API.
        // This prevents a many-edition artwork with one remaining unit from becoming "exclusive".
        ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(
            tacPham.LaTacPhamDocBan,
            tacPham.SoLuongBanDau,
            request.SoLuong);

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
        var tacPham = await GetManagedArtworkForArtistMutation(maTacPham);
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
        var tacPham = await GetManagedArtworkForArtistMutation(maTacPham);
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
        var tacPhams = await GetManagedArtworksForArtist(maHoaSi);
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
                SoLuongBanDau = tp.SoLuongBanDau,
                LaTacPhamDocBan = tp.LaTacPhamDocBan,
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
        var tacPham = await GetManagedArtworkForArtistMutation(maTacPham);
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
        var tacPham = await GetManagedArtworkForArtistMutation(maTacPham);
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
                TenTacGia = hoaSi?.TenHoaSi ?? "",
                MaTaiKhoanTacGia = baiViet.MaTaiKhoanTacGia,
                TomTat = baiViet.TomTat,
                MaDanhMucBaiViet = baiViet.MaDanhMucBaiViet,
                NgayDang = baiViet.NgayDang,
                TrangThai = baiViet.TrangThai,
                LyDo = baiViet.LyDo,
                AnhTieuDe = baiViet.AnhTieuDe,
                NgayCapNhat = baiViet.NgayCapNhat,
                NgayXuatBan = baiViet.NgayXuatBan,
                NgayBatDauSuKien = baiViet.NgayBatDauSuKien,
                NgayKetThucSuKien = baiViet.NgayKetThucSuKien,
                DiaDiemSuKien = baiViet.DiaDiemSuKien,
                NguonNoiDung = baiViet.NguonNoiDung
            });
        }

        return result;
    }

    public async Task<BaiVietResponse?> GetBaiVietById(int maBaiViet)
    {
        var baiViet = await _baiVietRepo.GetById(maBaiViet);
        if (baiViet == null) return null;

        var hoaSi = baiViet.MaHoaSi.HasValue ? await _hoaSiRepo.GetById(baiViet.MaHoaSi.Value) : null;

        var categories = (await _baiVietRepo.GetCategories(false)).ToDictionary(x => x.MaDanhMucBaiViet, x => x.TenDanhMuc);
        var response = new BaiVietResponse
        {
            MaBaiViet = baiViet.MaBaiViet,
            TieuDe = baiViet.TieuDe,
            NoiDung = baiViet.NoiDung,
            MaHoaSi = baiViet.MaHoaSi,
            TenHoaSi = hoaSi?.TenHoaSi ?? "",
            TenTacGia = hoaSi?.TenHoaSi ?? "",
            MaTaiKhoanTacGia = baiViet.MaTaiKhoanTacGia,
            TomTat = baiViet.TomTat,
            MaDanhMucBaiViet = baiViet.MaDanhMucBaiViet,
            NgayDang = baiViet.NgayDang,
            TrangThai = baiViet.TrangThai,
            LyDo = baiViet.LyDo,
            AnhTieuDe = baiViet.AnhTieuDe,
            NgayCapNhat = baiViet.NgayCapNhat,
            NgayXuatBan = baiViet.NgayXuatBan,
            NgayBatDauSuKien = baiViet.NgayBatDauSuKien,
            NgayKetThucSuKien = baiViet.NgayKetThucSuKien,
            DiaDiemSuKien = baiViet.DiaDiemSuKien,
            NguonNoiDung = baiViet.NguonNoiDung,
            TenDanhMuc = categories.GetValueOrDefault(baiViet.MaDanhMucBaiViet ?? 0),
            HinhAnhNoiDung = (await _baiVietRepo.GetImages(maBaiViet)).Select(x => new HinhAnhBaiVietResponse
                { MaHinhAnh=x.MaHinhAnh,DuongDan=x.DuongDan,ChuThich=x.ChuThich,ThuTu=x.ThuTu }).ToList()
        };
        response.TacPhamLienQuan = await MapLinkedArtworks(maBaiViet);
        return response;
    }

    public async Task<int> TaoBaiViet(int maHoaSi, TaoBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");
        if (request.TieuDe.Trim().Length > 250)
            throw new ArgumentException("Tiêu đề không vượt quá 250 ký tự");
        var content = BlogContentValidator.Validate(request.NoiDung);
        if (content.ImageIds.Count > 0)
            throw new ArgumentException("Hãy lưu bản nháp trước khi tải và chèn ảnh vào nội dung");
        await ValidateBlogCategorySelection(request.MaDanhMucBaiViet);
        await ValidatePublicArtworkLinks(request.MaTacPhamLienQuan ?? new List<int>());

        var baiViet = new BaiViet
        {
            TieuDe = request.TieuDe.Trim(),
            NoiDung = content.Content,
            AnhTieuDe = request.AnhTieuDe?.Trim(),
            TomTat = request.TomTat?.Trim(),
            MaDanhMucBaiViet = request.MaDanhMucBaiViet,
            MaTaiKhoanTacGia = (await _hoaSiRepo.GetById(maHoaSi))?.MaTaiKhoan,
            NgayBatDauSuKien = request.NgayBatDauSuKien,
            NgayKetThucSuKien = request.NgayKetThucSuKien,
            DiaDiemSuKien = request.DiaDiemSuKien?.Trim(),
            NguonNoiDung = request.NguonNoiDung?.Trim(),
            MaHoaSi = maHoaSi,
            NgayDang = DateTime.UtcNow,
            TrangThai = 0 // Draft
        };

        ValidateBaiViet(request.TomTat, request.NgayBatDauSuKien, request.NgayKetThucSuKien);
        var id = await _baiVietRepo.Create(baiViet);
        await _baiVietRepo.ReplaceArtworkLinks(id, request.MaTacPhamLienQuan ?? new List<int>());
        return id;
    }

    public async Task<bool> CapNhatBaiViet(int maHoaSi, int maBaiViet, CapNhatBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TieuDe))
            throw new ArgumentException("Tiêu đề không được để trống");
        if (request.TieuDe.Trim().Length > 250)
            throw new ArgumentException("Tiêu đề không vượt quá 250 ký tự");
        await ValidateBlogCategorySelection(request.MaDanhMucBaiViet);
        await ValidatePublicArtworkLinks(request.MaTacPhamLienQuan ?? new List<int>());

        var baiViet = await _baiVietRepo.GetById(maBaiViet);
        if (baiViet == null) return false;
        if (baiViet.MaHoaSi != maHoaSi)
            throw new UnauthorizedAccessException("Không có quyền sửa bài viết này");
        var content = BlogContentValidator.Validate(request.NoiDung);
        await ValidateBlogContentImages(maBaiViet, content);

        baiViet.TieuDe = request.TieuDe.Trim();
        baiViet.NoiDung = content.Content;
        baiViet.AnhTieuDe = request.AnhTieuDe?.Trim();
        baiViet.TomTat = request.TomTat?.Trim();
        baiViet.MaDanhMucBaiViet = request.MaDanhMucBaiViet;
        baiViet.NgayBatDauSuKien = request.NgayBatDauSuKien;
        baiViet.NgayKetThucSuKien = request.NgayKetThucSuKien;
        baiViet.DiaDiemSuKien = request.DiaDiemSuKien?.Trim();
        baiViet.NguonNoiDung = request.NguonNoiDung?.Trim();
        baiViet.NgayCapNhat = DateTime.UtcNow;
        ValidateBaiViet(request.TomTat, request.NgayBatDauSuKien, request.NgayKetThucSuKien);

        // Nếu bài đã Published mà sửa thì đưa về Pending để admin duyệt lại
        if (baiViet.TrangThai == 2 || baiViet.TrangThai == 3)
        {
            baiViet.TrangThai = 1;
            baiViet.LyDo = null;
        }

        var updated = await _baiVietRepo.Update(baiViet);
        if (updated) await _baiVietRepo.ReplaceArtworkLinks(maBaiViet, request.MaTacPhamLienQuan ?? new List<int>());
        return updated;
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

        await ValidateBlogContentImages(maBaiViet, BlogContentValidator.Validate(bv.NoiDung));

        bv.TrangThai = 1; // Pending
        bv.LyDo = null; // gửi duyệt lại thì xoá lý do từ chối cũ (nếu có)
        return await _baiVietRepo.Update(bv);
    }

    private static void ValidateBaiViet(string? tomTat, DateTime? batDau, DateTime? ketThuc)
    {
        if (tomTat?.Trim().Length > 500) throw new ArgumentException("Tóm tắt không được vượt quá 500 ký tự");
        if (batDau.HasValue && ketThuc.HasValue && ketThuc < batDau) throw new ArgumentException("Ngày kết thúc sự kiện phải sau ngày bắt đầu");
    }

    private async Task ValidateBlogCategorySelection(int? categoryId)
    {
        if (!categoryId.HasValue) return;
        if (!(await _baiVietRepo.GetCategories()).Any(x => x.MaDanhMucBaiViet == categoryId.Value))
            throw new ArgumentException("Danh mục bài viết không tồn tại hoặc đã bị ẩn");
    }

    private async Task ValidatePublicArtworkLinks(IEnumerable<int> artworkIds)
    {
        foreach (var id in artworkIds.Distinct())
        {
            var artwork = await _tacPhamRepo.GetMarketplaceById(id);
            if (artwork == null || artwork.TrangThai != TacPhamStatus.OnSale)
                throw new ArgumentException($"Tác phẩm #{id} không công khai hoặc là commission riêng tư");
        }
    }

    private async Task ValidateBlogContentImages(int articleId, BlogContentValidationResult content)
    {
        if (content.ImageIds.Count == 0) return;
        var ownedIds = (await _baiVietRepo.GetImages(articleId)).Select(x => x.MaHinhAnh).ToHashSet();
        var invalidIds = content.ImageIds.Where(x => !ownedIds.Contains(x)).ToArray();
        if (invalidIds.Length > 0)
            throw new ArgumentException($"Ảnh #{string.Join(", #", invalidIds)} không thuộc bài viết này");
    }

    private async Task<List<TacPhamLienKetResponse>> MapLinkedArtworks(int articleId)
    {
        var items = await _baiVietRepo.GetPublicLinkedArtworks(articleId);
        var result = new List<TacPhamLienKetResponse>();
        foreach (var item in items)
            result.Add(new TacPhamLienKetResponse
            {
                MaTacPham=item.MaTacPham,TenTacPham=item.TenTacPham,HinhAnh=item.HinhAnh,Gia=item.Gia,
                TenHoaSi=(await _hoaSiRepo.GetById(item.MaHoaSi))?.TenHoaSi ?? ""
            });
        return result;
    }

    // Doanh thu
    public async Task<DoanhThuTongQuanResponse> GetDoanhThuTongQuan(int maHoaSi)
    {
        var revenueLines = await GetArtistRevenueLines(maHoaSi);
        var now = DateTime.UtcNow;
        var doanhThuGop = revenueLines.Sum(line => line.DoanhThuGop);
        var giaTriHoan = revenueLines.Sum(line => line.GiaTriHoan);
        var doanhThuSauHoan = revenueLines.Sum(line => line.DoanhThuSauHoan);
        var doanhThuDuDieuKienChiTra = revenueLines
            .Where(line => line.DaDuDieuKienDoiSoat)
            .Sum(line => line.DoanhThuSauHoan);
        var doanhThuThangNay = revenueLines
            .Where(line => line.DaDuDieuKienDoiSoat
                && line.NgayGhiNhan.Year == now.Year
                && line.NgayGhiNhan.Month == now.Month)
            .Sum(line => line.DoanhThuSauHoan);

        return new DoanhThuTongQuanResponse
        {
            DoanhThuGop = doanhThuGop,
            GiaTriHoan = giaTriHoan,
            DoanhThuSauHoan = doanhThuSauHoan,
            DoanhThuDuDieuKienChiTra = doanhThuDuDieuKienChiTra,
            // Chưa có bảng chính sách phí/thuế, vì vậy không được âm thầm trừ tiền của họa sĩ.
            PhiNenTang = 0,
            PhiThanhToan = 0,
            ThueKhauTru = 0,
            ThucNhanDuKien = doanhThuDuDieuKienChiTra,
            DaChiTra = 0,
            ConChoChiTra = doanhThuDuDieuKienChiTra,
            TongDoanhThu = doanhThuSauHoan,
            SoDonHang = revenueLines
                .Where(line => line.DaDuDieuKienDoiSoat)
                .Select(line => line.DonHang.MaDonHang)
                .Distinct()
                .Count(),
            SoTacPhamDaBan = revenueLines
                .Where(line => line.DaDuDieuKienDoiSoat)
                .Sum(line => line.SoLuongSauHoan),
            DoanhThuThangNay = doanhThuThangNay
        };
    }

    public async Task<List<DoanhThuChiTietResponse>> GetDoanhThuChiTiet(int maHoaSi)
    {
        var revenueLines = await GetArtistRevenueLines(maHoaSi);
        var result = new List<DoanhThuChiTietResponse>();

        foreach (var group in revenueLines.GroupBy(line => line.DonHang.MaDonHang))
        {
            var donHang = group.First().DonHang;
            var nd = await _nguoiDungRepo.GetById(donHang.MaNguoiDung);
            var doanhThuGop = group.Sum(line => line.DoanhThuGop);
            var giaTriHoan = group.Sum(line => line.GiaTriHoan);
            var doanhThuSauHoan = group.Sum(line => line.DoanhThuSauHoan);
            var daThanhToanHopLe = group.All(line => line.DaThanhToanHopLe);
            var daHoanTien = group.All(line => line.DaHoanTien);
            var daDuDieuKienDoiSoat = group.Any(line => line.DaDuDieuKienDoiSoat);

            result.Add(new DoanhThuChiTietResponse
            {
                MaDonHang = donHang.MaDonHang,
                NgayDat = donHang.NgayDat,
                NgayGiao = donHang.NgayGiao,
                TenKhachHang = donHang.TenNguoiNhan ?? nd?.Ten ?? "Khách hàng",
                DoanhThuGop = doanhThuGop,
                GiaTriHoan = giaTriHoan,
                DoanhThuSauHoan = doanhThuSauHoan,
                DoanhThuDuDieuKienChiTra = daDuDieuKienDoiSoat ? doanhThuSauHoan : 0,
                DaThanhToanHopLe = daThanhToanHopLe,
                DaHoanTien = daHoanTien,
                DaDuDieuKienDoiSoat = daDuDieuKienDoiSoat,
                // Trường tương thích ngược: chỉ là phần doanh thu của họa sĩ sau hoàn,
                // tuyệt đối không phải tổng tiền toàn bộ đơn hàng.
                TongTien = doanhThuSauHoan,
                TrangThai = GetTrangThaiDoanhThu(
                    daThanhToanHopLe,
                    daHoanTien,
                    giaTriHoan,
                    doanhThuSauHoan)
            });
        }

        return result
            .OrderByDescending(item => item.NgayGiao ?? item.NgayDat)
            .ThenByDescending(item => item.MaDonHang)
            .ToList();
    }

    public async Task<List<DoanhThuTheoThang>> GetDoanhThuTheoThang(int maHoaSi, int nam)
    {
        var revenueLines = await GetArtistRevenueLines(maHoaSi);
        var result = new List<DoanhThuTheoThang>();

        for (int thang = 1; thang <= 12; thang++)
        {
            var donHangThang = revenueLines
                .Where(line => line.NgayGhiNhan.Year == nam && line.NgayGhiNhan.Month == thang)
                .ToList();

            result.Add(new DoanhThuTheoThang
            {
                Nam = nam,
                Thang = thang,
                TongDoanhThu = donHangThang
                    .Where(line => line.DaDuDieuKienDoiSoat)
                    .Sum(line => line.DoanhThuSauHoan),
                SoDonHang = donHangThang
                    .Where(line => line.DaDuDieuKienDoiSoat)
                    .Select(line => line.DonHang.MaDonHang)
                    .Distinct()
                    .Count()
            });
        }

        return result;
    }

    public async Task<List<DoanhThuTheoTacPhamResponse>> GetDoanhThuTheoTacPham(int maHoaSi)
    {
        var revenueLines = await GetArtistRevenueLines(maHoaSi);
        var artworks = await GetManagedArtworksForArtist(maHoaSi);

        return artworks
            .Select(tacPham =>
            {
                var lines = revenueLines.Where(line => line.ChiTiet.MaTacPham == tacPham.MaTacPham);
                return new DoanhThuTheoTacPhamResponse
                {
                    MaTacPham = tacPham.MaTacPham,
                    TenTacPham = tacPham.TenTacPham,
                    SoLuongBan = lines
                        .Where(line => line.DaDuDieuKienDoiSoat)
                        .Sum(line => line.SoLuongSauHoan),
                    DoanhThu = lines
                        .Where(line => line.DaDuDieuKienDoiSoat)
                        .Sum(line => line.DoanhThuSauHoan)
                };
            })
            .OrderByDescending(item => item.DoanhThu)
            .ToList();
    }

    public async Task<List<DonHangResponse>> GetDonHangCuaToi(int maHoaSi)
    {
        var revenueLines = await GetArtistRevenueLines(maHoaSi);
        var tenHoaSi = (await _hoaSiRepo.GetById(maHoaSi))?.TenHoaSi ?? "Họa sĩ";
        var result = new List<DonHangResponse>();

        foreach (var group in revenueLines.GroupBy(line => line.DonHang.MaDonHang))
        {
            var donHang = group.First().DonHang;
            result.Add(new DonHangResponse
            {
                MaDonHang = donHang.MaDonHang,
                NgayDat = donHang.NgayDat,
                NgayGiao = donHang.NgayGiao,
                TongTien = group.Sum(line => line.DoanhThuSauHoan),
                TenNguoiNhan = donHang.TenNguoiNhan ?? "",
                SoDienThoai = donHang.SoDienThoai ?? "",
                DiaChiGiao = donHang.DiaChiGiao ?? "",
                TrangThai = donHang.TrangThai,
                TrangThaiText = GetTrangThaiDonHangText(donHang.TrangThai),
                TrangThaiThanhToan = group.All(line => line.DaHoanTien)
                    ? "Đã hoàn tiền"
                    : group.All(line => line.DaThanhToanHopLe)
                        ? "Đã thanh toán"
                        : "Chờ xác nhận thanh toán",
                SoSanPham = group.Sum(line => line.SoLuongSauHoan),
                ChiTiet = group.Select(line => new ChiTietDonHangResponse
                {
                    MaChiTietDH = line.ChiTiet.MaChiTietDH,
                    MaTacPham = line.ChiTiet.MaTacPham,
                    TenTacPham = line.TacPham.TenTacPham,
                    TenHoaSi = tenHoaSi,
                    SoLuong = line.SoLuongSauHoan,
                    DonGia = line.ChiTiet.DonGia,
                    ThanhTien = line.DoanhThuSauHoan,
                    HinhAnh = line.TacPham.HinhAnh
                }).ToList()
            });
        }

        return result.OrderByDescending(item => item.NgayGiao ?? item.NgayDat).ToList();
    }

    // Helper methods
    private async Task<decimal> TinhTongDoanhThu(int maHoaSi)
    {
        return (await GetArtistRevenueLines(maHoaSi)).Sum(line => line.DoanhThuSauHoan);
    }

    private async Task<List<ArtistRevenueLine>> GetArtistRevenueLines(int maHoaSi)
    {
        // Dùng danh sách quản lý thay vì marketplace để doanh thu lịch sử không bị mất
        // khi một tranh đã bị ẩn, từ chối hoặc ngừng bán sau khi giao hàng.
        var artworks = await GetManagedArtworksForArtist(maHoaSi);
        var artworksById = artworks.ToDictionary(item => item.MaTacPham);
        if (artworksById.Count == 0) return new List<ArtistRevenueLine>();

        var deliveredOrders = (await _donHangRepo.GetAll())
            .Where(dh => dh.TrangThai == DonHangStatus.DaGiao)
            .ToList();

        var deliveredOrderIds = deliveredOrders.Select(order => order.MaDonHang).ToHashSet();
        var paymentsByOrder = (await _thanhToanRepo.GetAll())
            .Where(payment => deliveredOrderIds.Contains(payment.MaDonHang))
            .GroupBy(payment => payment.MaDonHang)
            .ToDictionary(group => group.Key, group => group.ToList());
        var result = new List<ArtistRevenueLine>();

        foreach (var donHang in deliveredOrders)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(donHang.MaDonHang);
            var payment = paymentsByOrder.TryGetValue(donHang.MaDonHang, out var payments)
                && payments.Count == 1
                ? payments[0]
                : null;
            var daThanhToan = payment?.TrangThai.Equals("DaThanhToan", StringComparison.OrdinalIgnoreCase) == true;
            var daHoanTien = payment?.TrangThai.Equals("HoanTien", StringComparison.OrdinalIgnoreCase) == true;

            // Chỉ nhận dữ liệu của đơn đã giao và đã có một khoản thanh toán được chốt.
            // "HoanTien" được giữ lại như một chứng từ lịch sử để họa sĩ thấy đơn hoàn,
            // nhưng không được phép làm phát sinh doanh thu có thể đối soát.
            if (!daThanhToan && !daHoanTien) continue;

            // Hoàn tiền toàn bộ phải đi kèm dữ liệu hoàn tất ở các dòng hàng. Điều này
            // vừa loại trừ bản ghi cũ/bất thường, vừa bảo đảm đơn hoàn toàn bộ có doanh
            // thu sau hoàn bằng 0 thay vì vô tình ghi nhận lại doanh thu ban đầu.
            var daHoanToanBoTheoDong = daHoanTien
                && chiTiet.Count > 0
                && chiTiet.All(item => item.SoLuong > 0
                    && Math.Clamp(item.SoLuongDaHoan, 0, item.SoLuong) == item.SoLuong);
            if (daHoanTien && !daHoanToanBoTheoDong) continue;

            foreach (var ct in chiTiet.Where(item => artworksById.ContainsKey(item.MaTacPham)))
            {
                // Chỉ trừ khoản hoàn đã được ghi nhận ở dòng đơn; yêu cầu hoàn đang chờ
                // không được trừ trước vì chưa phải khoản hoàn cuối cùng.
                var soLuongDaHoan = Math.Clamp(ct.SoLuongDaHoan, 0, ct.SoLuong);
                result.Add(new ArtistRevenueLine(
                    donHang,
                    ct,
                    artworksById[ct.MaTacPham],
                    ct.SoLuong - soLuongDaHoan,
                    ct.SoLuong * ct.DonGia,
                    soLuongDaHoan * ct.DonGia,
                    daThanhToan || daHoanTien,
                    daHoanTien));
            }
        }

        return result;
    }

    private sealed record ArtistRevenueLine(
        DonHang DonHang,
        ChiTietDonHang ChiTiet,
        TacPham TacPham,
        int SoLuongSauHoan,
        decimal DoanhThuGop,
        decimal GiaTriHoan,
        bool DaThanhToanHopLe,
        bool DaHoanTien)
    {
        public decimal DoanhThuSauHoan => DoanhThuGop - GiaTriHoan;
        public bool DaDuDieuKienDoiSoat =>
            DaThanhToanHopLe && !DaHoanTien && SoLuongSauHoan > 0 && DoanhThuSauHoan > 0;
        public DateTime NgayGhiNhan => DonHang.NgayGiao ?? DonHang.NgayDat;
    }

    private static string GetTrangThaiDoanhThu(
        bool daThanhToanHopLe,
        bool daHoanTien,
        decimal giaTriHoan,
        decimal doanhThuSauHoan)
    {
        if (daHoanTien) return "Đã hoàn tiền toàn bộ";
        if (giaTriHoan > 0 && doanhThuSauHoan <= 0) return "Đã hoàn toàn bộ";
        if (giaTriHoan > 0) return "Đã giao · hoàn một phần";
        return daThanhToanHopLe
            ? "Đã giao · thanh toán hợp lệ"
            : "Đã giao · chờ xác nhận thanh toán";
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

    /// <summary>
    /// Tác phẩm thuộc mục quản lý của họa sĩ: bao gồm mọi trạng thái nội bộ,
    /// nhưng loại trừ tác phẩm sinh ra từ yêu cầu đặt vẽ riêng.
    /// </summary>
    private async Task<List<TacPham>> GetManagedArtworksForArtist(int maHoaSi)
    {
        var artworks = await _tacPhamRepo.GetByHoaSi(maHoaSi);
        return artworks.Where(tp => tp.MaYeuCauVeTranh == null).ToList();
    }

    private async Task<TacPham?> GetManagedArtworkForArtistRead(int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        return tacPham?.MaYeuCauVeTranh == null ? tacPham : null;
    }

    private async Task<TacPham?> GetManagedArtworkForArtistMutation(int maTacPham)
    {
        var tacPham = await _tacPhamRepo.GetById(maTacPham);
        if (tacPham?.MaYeuCauVeTranh != null)
            throw new UnauthorizedAccessException("Tác phẩm nội bộ của yêu cầu vẽ tranh không thể thao tác trong mục Tác phẩm");
        return tacPham;
    }

    private string GetTrangThaiDonHangText(byte trangThai) => DonHangStatus.GetText(trangThai);

    // Chi tiết tác phẩm - Thống kê
    public async Task<TacPhamThongKeResponse?> GetTacPhamThongKe(int maHoaSi, int maTacPham)
    {
        var tacPham = await GetManagedArtworkForArtistRead(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi) return null;

        var revenueLines = (await GetArtistRevenueLines(maHoaSi))
            .Where(line => line.ChiTiet.MaTacPham == maTacPham)
            .ToList();
        var now = DateTime.UtcNow;
        var revenueLinesDuDieuKien = revenueLines
            .Where(line => line.DaDuDieuKienDoiSoat)
            .ToList();
        var revenueLinesThisMonth = revenueLinesDuDieuKien
            .Where(line => line.NgayGhiNhan.Year == now.Year && line.NgayGhiNhan.Month == now.Month)
            .ToList();

        return new TacPhamThongKeResponse
        {
            TongSoLuongBan = revenueLinesDuDieuKien.Sum(line => line.SoLuongSauHoan),
            TongDoanhThu = revenueLinesDuDieuKien.Sum(line => line.DoanhThuSauHoan),
            SoDonHang = revenueLinesDuDieuKien
                .Select(line => line.DonHang.MaDonHang)
                .Distinct()
                .Count(),
            SoLuongConLai = tacPham.SoLuong,
            DoanhThuThangNay = revenueLinesThisMonth.Sum(line => line.DoanhThuSauHoan),
            SoLuongBanThangNay = revenueLinesThisMonth.Sum(line => line.SoLuongSauHoan)
        };
    }

    // Chi tiết tác phẩm - Đơn hàng
    public async Task<List<TacPhamDonHangResponse>> GetTacPhamDonHang(int maHoaSi, int maTacPham)
    {
        var tacPham = await GetManagedArtworkForArtistRead(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi)
            return new List<TacPhamDonHangResponse>();

        var revenueLines = (await GetArtistRevenueLines(maHoaSi))
            .Where(line => line.ChiTiet.MaTacPham == maTacPham)
            .ToList();
        var result = new List<TacPhamDonHangResponse>();

        foreach (var line in revenueLines)
        {
            var nd = await _nguoiDungRepo.GetById(line.DonHang.MaNguoiDung);
            result.Add(new TacPhamDonHangResponse
            {
                MaDonHang = line.DonHang.MaDonHang,
                MaHD = "DH" + line.DonHang.MaDonHang.ToString("D6"),
                NgayDat = line.DonHang.NgayDat,
                TenKhachHang = line.DonHang.TenNguoiNhan ?? nd?.Ten ?? "Khách hàng",
                SoLuong = line.SoLuongSauHoan,
                DonGia = line.ChiTiet.DonGia,
                ThanhTien = line.DoanhThuSauHoan,
                TrangThai = GetTrangThaiDoanhThu(
                    line.DaThanhToanHopLe,
                    line.DaHoanTien,
                    line.GiaTriHoan,
                    line.DoanhThuSauHoan),
                TrangThaiClass = line.GiaTriHoan > 0
                    ? "danger"
                    : line.DaDuDieuKienDoiSoat ? "success" : "pending"
            });
        }

        return result.OrderByDescending(x => x.NgayDat).ToList();
    }

    // Chi tiết tác phẩm - Doanh thu theo tháng
    public async Task<List<TacPhamDoanhThuTheoThangResponse>> GetTacPhamDoanhThuTheoThang(int maHoaSi, int maTacPham, int nam)
    {
        var tacPham = await GetManagedArtworkForArtistRead(maTacPham);
        if (tacPham == null || tacPham.MaHoaSi != maHoaSi)
            return new List<TacPhamDoanhThuTheoThangResponse>();

        var revenueLines = (await GetArtistRevenueLines(maHoaSi))
            .Where(line => line.ChiTiet.MaTacPham == maTacPham && line.NgayGhiNhan.Year == nam)
            .ToList();

        var result = new List<TacPhamDoanhThuTheoThangResponse>();

        for (int thang = 1; thang <= 12; thang++)
        {
            var revenueLinesThisMonth = revenueLines
                .Where(line => line.DaDuDieuKienDoiSoat
                    && line.NgayGhiNhan.Month == thang)
                .ToList();

            result.Add(new TacPhamDoanhThuTheoThangResponse
            {
                Thang = "Tháng " + thang,
                DoanhThu = revenueLinesThisMonth.Sum(line => line.DoanhThuSauHoan),
                SoLuong = revenueLinesThisMonth.Sum(line => line.SoLuongSauHoan)
            });
        }

        return result;
    }

}
