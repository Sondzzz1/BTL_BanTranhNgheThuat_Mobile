using System;
using System.Collections.Generic;
using System.Linq;
using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class AdminBusiness : IAdminBusiness
{
    private readonly IAdminRepository _adminRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly INguoiDungRepository _nguoiDungRepo;
    private readonly IDonHangRepository _donHangRepo;
    private readonly IBaiVietRepository _baiVietRepo;
    private readonly IDanhMucRepository _danhMucRepo;
    private readonly IThanhToanRepository _thanhToanRepo;
    private readonly INoiDungRepository _noiDungRepo;
    private readonly ITaiKhoanRepository _taiKhoanRepo;
    private readonly ITacPhamChinhSuaRepository _tacPhamChinhSuaRepo;

    public AdminBusiness(
        IAdminRepository adminRepo,
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        INguoiDungRepository nguoiDungRepo,
        IDonHangRepository donHangRepo,
        IBaiVietRepository baiVietRepo,
        IDanhMucRepository danhMucRepo,
        IThanhToanRepository thanhToanRepo,
        INoiDungRepository noiDungRepo,
        ITaiKhoanRepository taiKhoanRepo,
        ITacPhamChinhSuaRepository tacPhamChinhSuaRepo)
    {
        _adminRepo = adminRepo;
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _nguoiDungRepo = nguoiDungRepo;
        _donHangRepo = donHangRepo;
        _baiVietRepo = baiVietRepo;
        _danhMucRepo = danhMucRepo;
        _thanhToanRepo = thanhToanRepo;
        _noiDungRepo = noiDungRepo;
        _taiKhoanRepo = taiKhoanRepo;
        _tacPhamChinhSuaRepo = tacPhamChinhSuaRepo;
    }

    // ==========================================
    // THỐNG KÊ - GỌI ADMIN REPO
    // ==========================================
    public async Task<DashboardResponse> GetDashboard() => await _adminRepo.GetDashboard();
    public async Task<ThongKeTongQuanResponse> GetThongKeTongQuan() => await _adminRepo.GetThongKeTongQuan();
    public async Task<ThongKeNhanhResponse> GetThongKeNhanh(DateTime ngay) => await _adminRepo.GetThongKeNhanh(ngay);
    public async Task<List<DoanhThuTheoThangResponse>> GetDoanhThuTheoThang(int nam) => await _adminRepo.GetDoanhThuTheoThang(nam);
    public async Task<List<DoanhThuTheoHoaSiResponse>> GetDoanhThuTheoHoaSi(DateTime? tuNgay, DateTime? denNgay) => await _adminRepo.GetDoanhThuTheoHoaSi(tuNgay, denNgay);
    public async Task<List<TacPhamBanChayResponse>> GetTacPhamBanChay(int top) => await _adminRepo.GetTacPhamBanChay(top);
    public async Task<List<KhachHangTiemNangResponse>> GetKhachHangTiemNang(int top) => await _adminRepo.GetKhachHangTiemNang(top);
    public async Task<ThongKeTrangThaiDonHangResponse> GetThongKeTrangThaiDonHang() => await _adminRepo.GetThongKeTrangThaiDonHang();

    // Các hàm thống kê nâng cao
    public Task<ThongKeSoSanhResponse> GetThongKeSoSanh(DateTime tuNgay1, DateTime denNgay1, DateTime tuNgay2, DateTime denNgay2) => throw new NotImplementedException("Chưa triển khai");
    public Task<byte[]> XuatBaoCaoDoanhThu(DateTime tuNgay, DateTime denNgay, string format) => throw new NotImplementedException("Chưa triển khai");
    public Task<byte[]> XuatBaoCaoDonHang(DateTime tuNgay, DateTime denNgay, string format) => throw new NotImplementedException("Chưa triển khai");

    // ==========================================
    // TÁC PHẨM
    // ==========================================
    public async Task<List<TacPhamHoaSiResponse>> GetAllTacPham(byte? trangThai = null)
    {
        var list = await _tacPhamRepo.GetMarketplaceAll();
        if (trangThai.HasValue)
            list = list.Where(x => x.TrangThai == trangThai.Value).ToList();
        
        var hoaSis = await _hoaSiRepo.GetAll();
        var danhMucs = await _danhMucRepo.GetAll();

        return MapTacPhamHoaSiResponses(list, hoaSis, danhMucs);
    }

    public async Task<TacPhamAdminPageResponse> GetTacPhamQuanLy(AdminArtworkQuery query)
    {
        query ??= new AdminArtworkQuery();
        query.Page = Math.Clamp(query.Page, 1, 100_000);
        query.PageSize = Math.Clamp(query.PageSize, 10, 100);

        var result = await _tacPhamRepo.GetAdminPage(query);
        var hoaSis = await _hoaSiRepo.GetAll();
        var danhMucs = await _danhMucRepo.GetAll();
        return new TacPhamAdminPageResponse
        {
            Items = MapTacPhamHoaSiResponses(result.Items, hoaSis, danhMucs),
            TotalItems = result.TotalItems,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<AdminArtworkFilterOptionsResponse> GetBoLocQuanLyTacPham()
    {
        var hoaSiTask = _hoaSiRepo.GetAll();
        var danhMucTask = _danhMucRepo.GetAll();
        await Task.WhenAll(hoaSiTask, danhMucTask);
        var hoaSis = await hoaSiTask;
        var danhMucs = await danhMucTask;

        return new AdminArtworkFilterOptionsResponse
        {
            HoaSi = hoaSis
                .OrderBy(x => x.TenHoaSi)
                .Select(x => new AdminArtworkFilterOption { Id = x.MaHoaSi, Ten = x.TenHoaSi })
                .ToList(),
            DanhMuc = danhMucs
                .OrderBy(x => x.TenDanhMuc)
                .Select(x => new AdminArtworkFilterOption { Id = x.MaDanhMuc, Ten = x.TenDanhMuc })
                .ToList()
        };
    }

    private static List<TacPhamHoaSiResponse> MapTacPhamHoaSiResponses(
        IEnumerable<TacPham> list,
        IEnumerable<HoaSi> hoaSis,
        IEnumerable<DanhMuc> danhMucs)
    {
        return list.Select(x => new TacPhamHoaSiResponse
        { 
            MaTacPham = x.MaTacPham, 
            TenTacPham = x.TenTacPham, 
            Gia = x.Gia, 
            SoLuong = x.SoLuong,
            SoLuongBanDau = x.SoLuongBanDau,
            LaTacPhamDocBan = x.LaTacPhamDocBan,
            MoTa = x.MoTa,
            KichThuoc = x.KichThuoc,
            ChatLieu = x.ChatLieu,
            ChatLieuKhung = x.ChatLieuKhung,
            TrangThai = x.TrangThai,
            TrangThaiText = x.TrangThai switch {
                0 => "Chờ duyệt",
                1 => "Đang bán",
                2 => "Ẩn (ngừng bán tạm thời)",
                3 => "Từ chối",
                99 => "Đã xóa (Bởi họa sĩ)",
                _ => "Không xác định"
            },
            NgayTao = x.NgayTao,
            HinhAnh = x.HinhAnh,
            TenHoaSi = hoaSis.FirstOrDefault(h => h.MaHoaSi == x.MaHoaSi)?.TenHoaSi ?? "N/A",
            TenDanhMuc = danhMucs.FirstOrDefault(d => d.MaDanhMuc == x.MaDanhMuc)?.TenDanhMuc ?? "N/A",
            LyDo = x.LyDo
        }).ToList();
    }

    public async Task<bool> DuyetTacPham(int id, DuyetTacPhamRequest request)
    {
        var tacPham = await GetMarketplaceArtworkForMutation(id);
        if (tacPham == null) return false;
        if (!request.PheDuyet && string.IsNullOrWhiteSpace(request.LyDo))
            throw new ArgumentException("Vui lòng nhập lý do từ chối");
        
        // Kiểm tra xem có bản chỉnh sửa chờ duyệt không
        var chinhSua = await _tacPhamChinhSuaRepo.GetByMaTacPhamChoDuyet(id);
        if (chinhSua == null && ((request.PheDuyet && tacPham.TrangThai == TacPhamStatus.OnSale)
            || (!request.PheDuyet && tacPham.TrangThai == TacPhamStatus.Rejected)))
            return true; // Retry cùng trạng thái không phải một sự kiện kiểm duyệt mới.
        
        if (request.PheDuyet)
        {
            // Nếu có bản chỉnh sửa, áp dụng nội dung mới vào tác phẩm
            if (chinhSua != null)
            {
                tacPham.TenTacPham = chinhSua.TenTacPham;
                tacPham.MaDanhMuc = chinhSua.MaDanhMuc;
                tacPham.Gia = chinhSua.Gia;
                tacPham.SoLuong = chinhSua.SoLuong;
                tacPham.MoTa = chinhSua.MoTa;
                tacPham.HinhAnh = chinhSua.HinhAnh;
                tacPham.KichThuoc = chinhSua.KichThuoc;
                tacPham.ChatLieu = chinhSua.ChatLieu;
                tacPham.ChatLieuKhung = chinhSua.ChatLieuKhung;
                
                // Đánh dấu bản chỉnh sửa đã được duyệt
                chinhSua.TrangThai = 1; // Đã duyệt
                if (!await _tacPhamChinhSuaRepo.Update(chinhSua))
                    throw new InvalidOperationException("Không thể lưu kết quả duyệt bản chỉnh sửa tác phẩm");
            }
            
            // Duyệt tác phẩm
            tacPham.TrangThai = 1; // Approved (bán)
            tacPham.LyDo = null; // Xoá lý do từ chối (nếu có)
        }
        else
        {
            // Từ chối
            if (chinhSua != null)
            {
                // Từ chối bản chỉnh sửa
                chinhSua.TrangThai = 2; // Từ chối
                chinhSua.LyDo = string.IsNullOrWhiteSpace(request.LyDo) ? null : request.LyDo.Trim();
                if (!await _tacPhamChinhSuaRepo.Update(chinhSua))
                    throw new InvalidOperationException("Không thể lưu kết quả từ chối bản chỉnh sửa tác phẩm");
                
                // Tác phẩm gốc vẫn giữ nguyên trạng thái (vẫn đang bán)
                // KHÔNG thay đổi tacPham.TrangThai
            }
            else
            {
                // Từ chối tác phẩm mới (chưa từng được duyệt)
                tacPham.TrangThai = 3; // Rejected
                tacPham.LyDo = string.IsNullOrWhiteSpace(request.LyDo) ? null : request.LyDo.Trim();
            }
        }
        
        var isEditReview = chinhSua != null;
        var notification = new ThongBao
        {
            Loai = request.PheDuyet ? "ARTWORK_APPROVED" : "ARTWORK_REJECTED",
            TieuDe = request.PheDuyet ? "Tác phẩm đã được phê duyệt" : "Tác phẩm bị từ chối",
            NoiDung = request.PheDuyet
                ? $"Tác phẩm “{tacPham.TenTacPham}” của bạn đã được phê duyệt."
                : $"Tác phẩm “{tacPham.TenTacPham}” đã bị từ chối. Lý do: {request.LyDo!.Trim()}",
            LoaiDoiTuong = "TacPham",
            MaDoiTuong = tacPham.MaTacPham,
            DuongDan = $"/artist/artworks/{tacPham.MaTacPham}",
            EventKey = $"ARTWORK_REVIEW:{tacPham.MaTacPham}:{(isEditReview ? chinhSua!.MaChinhSua : 0)}:{(request.PheDuyet ? "APPROVED" : "REJECTED")}"
        };
        return await _tacPhamRepo.UpdateWithArtistNotification(tacPham, notification);
    }

    public async Task<bool> HideTacPham(int id)
    {
        var tacPham = await GetMarketplaceArtworkForMutation(id);
        if (tacPham == null) return false;
        tacPham.TrangThai = 2; // Hidden
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> ShowTacPham(int id)
    {
        var tacPham = await GetMarketplaceArtworkForMutation(id);
        if (tacPham == null) return false;
        tacPham.TrangThai = 1; // Approved
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> XoaTacPham(int id)
    {
        var tacPham = await GetMarketplaceArtworkForMutation(id);
        return tacPham != null && await _tacPhamRepo.Delete(id);
    }

    public async Task<List<TacPhamHoaSiResponse>> TimKiemTacPham(string? keyword, int? maDanhMuc, int? maHoaSi, byte? trangThai, decimal? tuGia, decimal? denGia, int? tuSoLuong, int? denSoLuong, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize)
    {
        var result = await GetAllTacPham();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            result = result.Where(x => x.TenTacPham.Contains(value, StringComparison.OrdinalIgnoreCase)
                || (x.TenHoaSi?.Contains(value, StringComparison.OrdinalIgnoreCase) ?? false)
                || (x.TenDanhMuc?.Contains(value, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
        }
        if (maDanhMuc.HasValue)
        {
            var ids = (await _tacPhamRepo.GetMarketplaceByCategory(maDanhMuc.Value)).Select(x => x.MaTacPham).ToHashSet();
            result = result.Where(x => ids.Contains(x.MaTacPham)).ToList();
        }
        if (maHoaSi.HasValue)
        {
            var ids = (await _tacPhamRepo.GetMarketplaceByArtist(maHoaSi.Value)).Select(x => x.MaTacPham).ToHashSet();
            result = result.Where(x => ids.Contains(x.MaTacPham)).ToList();
        }
        if (trangThai.HasValue) result = result.Where(x => x.TrangThai == trangThai.Value).ToList();
        if (tuGia.HasValue) result = result.Where(x => x.Gia >= tuGia.Value).ToList();
        if (denGia.HasValue) result = result.Where(x => x.Gia <= denGia.Value).ToList();
        if (tuSoLuong.HasValue) result = result.Where(x => x.SoLuong >= tuSoLuong.Value).ToList();
        if (denSoLuong.HasValue) result = result.Where(x => x.SoLuong <= denSoLuong.Value).ToList();
        if (tuNgay.HasValue) result = result.Where(x => x.NgayTao >= tuNgay.Value.Date).ToList();
        if (denNgay.HasValue) result = result.Where(x => x.NgayTao < denNgay.Value.Date.AddDays(1)).ToList();
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);
        return result.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
    }

    public async Task<List<TacPhamHoaSiResponse>> LocTacPhamTheoTieuChi(string tieuChi)
    {
        var result = await GetAllTacPham();
        return tieuChi.Trim().ToLowerInvariant() switch
        {
            "dangban" or "đang bán" => result.Where(x => x.TrangThai == TacPhamStatus.OnSale).ToList(),
            "choduyet" or "chờ duyệt" => result.Where(x => x.TrangThai == TacPhamStatus.PendingApproval).ToList(),
            "an" or "ẩn" => result.Where(x => x.TrangThai == TacPhamStatus.Hidden).ToList(),
            "tuchoi" or "từ chối" => result.Where(x => x.TrangThai == TacPhamStatus.Rejected).ToList(),
            _ => result
        };
    }

    public async Task<List<TacPhamHoaSiResponse>> SapXepTacPham(string sapXepTheo, string thuTu)
    {
        var result = await GetAllTacPham();
        var descending = thuTu.Equals("desc", StringComparison.OrdinalIgnoreCase);
        return sapXepTheo.Trim().ToLowerInvariant() switch
        {
            "ten" or "tentacpham" => descending ? result.OrderByDescending(x => x.TenTacPham).ToList() : result.OrderBy(x => x.TenTacPham).ToList(),
            "gia" => descending ? result.OrderByDescending(x => x.Gia).ToList() : result.OrderBy(x => x.Gia).ToList(),
            "soluong" => descending ? result.OrderByDescending(x => x.SoLuong).ToList() : result.OrderBy(x => x.SoLuong).ToList(),
            _ => descending ? result.OrderByDescending(x => x.NgayTao).ToList() : result.OrderBy(x => x.NgayTao).ToList()
        };
    }

    // ==========================================
    // DANH MỤC
    // ==========================================
    public async Task<List<DanhMucResponse>> GetAllDanhMuc()
    {
        var list = await _danhMucRepo.GetAll();
        var allTacPham = await _tacPhamRepo.GetMarketplaceAll();
        return list.Select(x => new DanhMucResponse
        {
            MaDanhMuc = x.MaDanhMuc,
            TenDanhMuc = x.TenDanhMuc,
            MoTa = x.MoTa,
            SoTacPham = allTacPham.Count(tp => tp.MaDanhMuc == x.MaDanhMuc)
        }).ToList();
    }

    public async Task<DanhMucResponse> GetDanhMucById(int id)
    {
        var dm = await _danhMucRepo.GetById(id);
        if (dm == null) return null!;
        var allTacPham = await _tacPhamRepo.GetMarketplaceAll();
        return new DanhMucResponse
        {
            MaDanhMuc = dm.MaDanhMuc,
            TenDanhMuc = dm.TenDanhMuc,
            MoTa = dm.MoTa,
            SoTacPham = allTacPham.Count(tp => tp.MaDanhMuc == dm.MaDanhMuc)
        };
    }

    public async Task<int> TaoDanhMuc(TaoDanhMucRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDanhMuc))
            throw new ArgumentException("Tên danh mục không được để trống");
        return await _danhMucRepo.Create(new DanhMuc { TenDanhMuc = request.TenDanhMuc.Trim(), MoTa = request.MoTa?.Trim() });
    }

    public async Task<bool> CapNhatDanhMuc(int id, CapNhatDanhMucRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDanhMuc))
            throw new ArgumentException("Tên danh mục không được để trống");
        return await _danhMucRepo.Update(new DanhMuc { MaDanhMuc = id, TenDanhMuc = request.TenDanhMuc.Trim(), MoTa = request.MoTa?.Trim() });
    }

    public async Task<bool> XoaDanhMuc(int id) => await _danhMucRepo.Delete(id);
    public Task<List<DanhMucResponse>> TimKiemDanhMuc(string? keyword) => throw new NotImplementedException();

    // ==========================================
    // BÀI VIẾT
    // ==========================================
    public async Task<List<BaiVietResponse>> GetAllBaiViet(byte? trangThai = null)
    {
        var list = await _baiVietRepo.GetAll();
        if (trangThai.HasValue)
            list = list.Where(x => x.TrangThai == trangThai.Value).ToList();

        var hoaSis = await _hoaSiRepo.GetAll();
        
        var categories = (await _baiVietRepo.GetCategories(false)).ToDictionary(x => x.MaDanhMucBaiViet, x => x.TenDanhMuc);
        var result = new List<BaiVietResponse>();
        foreach (var x in list)
        {
            var artistName = x.MaHoaSi.HasValue ? hoaSis.FirstOrDefault(h => h.MaHoaSi == x.MaHoaSi.Value)?.TenHoaSi : null;
            var accountName = x.MaTaiKhoanTacGia.HasValue ? (await _taiKhoanRepo.GetById(x.MaTaiKhoanTacGia.Value))?.TenDangNhap : null;
            result.Add(MapBaiViet(x, artistName ?? accountName ?? "N/A", categories.GetValueOrDefault(x.MaDanhMucBaiViet ?? 0)));
        }
        return result;
    }

    public async Task<BaiVietResponse?> GetBaiVietById(int id)
    {
        var item = await _baiVietRepo.GetById(id); if (item == null) return null;
        var name = item.MaHoaSi.HasValue ? (await _hoaSiRepo.GetById(item.MaHoaSi.Value))?.TenHoaSi : null;
        name ??= item.MaTaiKhoanTacGia.HasValue ? (await _taiKhoanRepo.GetById(item.MaTaiKhoanTacGia.Value))?.TenDangNhap : null;
        var categories = (await _baiVietRepo.GetCategories(false)).ToDictionary(x => x.MaDanhMucBaiViet, x => x.TenDanhMuc);
        var response = MapBaiViet(item, name ?? "N/A", categories.GetValueOrDefault(item.MaDanhMucBaiViet ?? 0));
        response.HinhAnhNoiDung = (await _baiVietRepo.GetImages(id)).Select(x => new HinhAnhBaiVietResponse { MaHinhAnh=x.MaHinhAnh,DuongDan=x.DuongDan,ChuThich=x.ChuThich,ThuTu=x.ThuTu }).ToList();
        response.TacPhamLienQuan = await MapLinkedArtworks(id);
        return response;
    }

    public async Task<int> TaoBaiViet(int maTaiKhoan, TaoBaiVietRequest request)
    {
        ValidateBlog(request.TieuDe, request.TomTat, request.NgayBatDauSuKien, request.NgayKetThucSuKien);
        var content = BlogContentValidator.Validate(request.NoiDung);
        if (content.ImageIds.Count > 0)
            throw new ArgumentException("Hãy lưu bản nháp trước khi tải và chèn ảnh vào nội dung");
        await ValidateBlogCategorySelection(request.MaDanhMucBaiViet);
        await ValidatePublicArtworkLinks(request.MaTacPhamLienQuan ?? new List<int>());
        var item = new BaiViet { TieuDe=request.TieuDe.Trim(),NoiDung=content.Content,AnhTieuDe=request.AnhTieuDe?.Trim(),TomTat=request.TomTat?.Trim(),MaDanhMucBaiViet=request.MaDanhMucBaiViet,MaTaiKhoanTacGia=maTaiKhoan,NgayDang=DateTime.UtcNow,TrangThai=0,NgayBatDauSuKien=request.NgayBatDauSuKien,NgayKetThucSuKien=request.NgayKetThucSuKien,DiaDiemSuKien=request.DiaDiemSuKien?.Trim(),NguonNoiDung=request.NguonNoiDung?.Trim() };
        var id=await _baiVietRepo.Create(item); await _baiVietRepo.ReplaceArtworkLinks(id,request.MaTacPhamLienQuan ?? new List<int>()); return id;
    }

    public async Task<bool> CapNhatBaiViet(int maTaiKhoan, int id, CapNhatBaiVietRequest request)
    {
        ValidateBlog(request.TieuDe, request.TomTat, request.NgayBatDauSuKien, request.NgayKetThucSuKien);
        await ValidateBlogCategorySelection(request.MaDanhMucBaiViet);
        await ValidatePublicArtworkLinks(request.MaTacPhamLienQuan ?? new List<int>());
        var item=await _baiVietRepo.GetById(id); if(item==null)return false;
        if(item.MaHoaSi.HasValue || item.MaTaiKhoanTacGia!=maTaiKhoan) throw new UnauthorizedAccessException("Admin chỉ được sửa bài do chính tài khoản mình tạo");
        var content=BlogContentValidator.Validate(request.NoiDung);
        await ValidateBlogContentImages(id,content);
        item.TieuDe=request.TieuDe.Trim();item.NoiDung=content.Content;item.AnhTieuDe=request.AnhTieuDe?.Trim();item.TomTat=request.TomTat?.Trim();item.MaDanhMucBaiViet=request.MaDanhMucBaiViet;item.NgayBatDauSuKien=request.NgayBatDauSuKien;item.NgayKetThucSuKien=request.NgayKetThucSuKien;item.DiaDiemSuKien=request.DiaDiemSuKien?.Trim();item.NguonNoiDung=request.NguonNoiDung?.Trim();item.NgayCapNhat=DateTime.UtcNow;
        var ok=await _baiVietRepo.Update(item);if(ok)await _baiVietRepo.ReplaceArtworkLinks(id,request.MaTacPhamLienQuan ?? new List<int>());return ok;
    }

    public async Task<bool> DuyetBaiViet(int id, DuyetBaiVietRequest request)
    {
        var bv = await _baiVietRepo.GetById(id);
        if (bv == null) return false;
        if (bv.TrangThai != 1) throw new InvalidOperationException("Chỉ bài đang chờ duyệt mới được xử lý");
        if (!request.PheDuyet && string.IsNullOrWhiteSpace(request.LyDo)) throw new ArgumentException("Vui lòng nhập lý do từ chối");
        if (request.PheDuyet)
            await ValidateBlogContentImages(id, BlogContentValidator.Validate(bv.NoiDung));
        return await _baiVietRepo.ReviewWithNotification(id, request.PheDuyet, request.LyDo?.Trim());
    }

    public async Task<bool> XuatBanBaiViet(int maTaiKhoan, int id)
    {
        var bv=await _baiVietRepo.GetById(id);if(bv==null)return false;
        if(bv.MaHoaSi.HasValue || bv.MaTaiKhoanTacGia!=maTaiKhoan) throw new UnauthorizedAccessException("Chỉ được xuất bản bài do tài khoản Admin hiện tại tạo");
        if(bv.TrangThai is not (0 or 1 or 3)) throw new InvalidOperationException("Bài viết không ở trạng thái có thể xuất bản");
        await ValidateBlogContentImages(id, BlogContentValidator.Validate(bv.NoiDung));
        bv.TrangThai=2;bv.LyDo=null;bv.NgayXuatBan=DateTime.UtcNow;bv.NgayCapNhat=DateTime.UtcNow;return await _baiVietRepo.Update(bv);
    }

    public async Task<bool> ArchiveBaiViet(int id)
    {
        var bv = await _baiVietRepo.GetById(id);
        if (bv == null) return false;
        return await _baiVietRepo.ArchiveWithNotification(id);
    }

    public async Task<bool> XoaBaiViet(int id) => await _baiVietRepo.Delete(id);
    public async Task<List<DanhMucBaiVietResponse>> GetDanhMucBaiViet() =>
        (await _baiVietRepo.GetCategories(false)).Select(x => new DanhMucBaiVietResponse
        {
            MaDanhMucBaiViet = x.MaDanhMucBaiViet,
            TenDanhMuc = x.TenDanhMuc,
            Slug = x.Slug,
            TrangThai = x.TrangThai
        }).ToList();

    public async Task<int> TaoDanhMucBaiViet(CapNhatDanhMucBaiVietRequest request)
    {
        ValidateBlogCategory(request);
        return await _baiVietRepo.CreateCategory(request.TenDanhMuc.Trim(), request.Slug.Trim().ToLowerInvariant());
    }

    public async Task<bool> CapNhatDanhMucBaiViet(int id, CapNhatDanhMucBaiVietRequest request)
    {
        ValidateBlogCategory(request);
        return await _baiVietRepo.UpdateCategory(id, request.TenDanhMuc.Trim(), request.Slug.Trim().ToLowerInvariant(), request.TrangThai);
    }

    public Task<List<BaiVietResponse>> TimKiemBaiViet(string? keyword, int? maHoaSi, bool? trangThai, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize) => throw new NotImplementedException();

    private static void ValidateBlog(string title,string? summary,DateTime? start,DateTime? end)
    { if(string.IsNullOrWhiteSpace(title))throw new ArgumentException("Tiêu đề không được để trống");if(title.Trim().Length>250)throw new ArgumentException("Tiêu đề không vượt quá 250 ký tự");if(summary?.Trim().Length>500)throw new ArgumentException("Tóm tắt không vượt quá 500 ký tự");if(start.HasValue&&end.HasValue&&end<start)throw new ArgumentException("Ngày kết thúc sự kiện phải sau ngày bắt đầu"); }
    private static void ValidateBlogCategory(CapNhatDanhMucBaiVietRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDanhMuc) || request.TenDanhMuc.Trim().Length > 150)
            throw new ArgumentException("Tên danh mục không hợp lệ");
        var slug = request.Slug?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 120 || !System.Text.RegularExpressions.Regex.IsMatch(slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            throw new ArgumentException("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang");
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
    private static BaiVietResponse MapBaiViet(BaiViet x,string author,string? category)=>new(){MaBaiViet=x.MaBaiViet,TieuDe=x.TieuDe,NoiDung=x.NoiDung,MaHoaSi=x.MaHoaSi,MaTaiKhoanTacGia=x.MaTaiKhoanTacGia,TenHoaSi=author,TenTacGia=author,NgayDang=x.NgayDang,TrangThai=x.TrangThai,LyDo=x.LyDo,AnhTieuDe=x.AnhTieuDe,TomTat=x.TomTat,MaDanhMucBaiViet=x.MaDanhMucBaiViet,TenDanhMuc=category,NgayCapNhat=x.NgayCapNhat,NgayXuatBan=x.NgayXuatBan,NgayBatDauSuKien=x.NgayBatDauSuKien,NgayKetThucSuKien=x.NgayKetThucSuKien,DiaDiemSuKien=x.DiaDiemSuKien,NguonNoiDung=x.NguonNoiDung};
    private async Task<List<TacPhamLienKetResponse>> MapLinkedArtworks(int id)
    {var items=await _baiVietRepo.GetPublicLinkedArtworks(id);var result=new List<TacPhamLienKetResponse>();foreach(var x in items){result.Add(new TacPhamLienKetResponse{MaTacPham=x.MaTacPham,TenTacPham=x.TenTacPham,HinhAnh=x.HinhAnh,Gia=x.Gia,TenHoaSi=(await _hoaSiRepo.GetById(x.MaHoaSi))?.TenHoaSi??""});}return result;}

    // ==========================================
    // NỘI DUNG (Content Management)
    // ==========================================
    public async Task<List<NoiDungResponse>> GetAllNoiDung(string? loai)
    {
        var list = await _noiDungRepo.GetAll(loai);
        return list.Select(x => new NoiDungResponse 
        { 
            MaNoiDung = x.MaNoiDung, 
            MaTacPham = x.MaTacPham,
            TieuDe = x.TieuDe, 
            MoTa = x.NoiDungText, 
            Loai = x.Loai,
            TrangThai = x.TrangThai
        }).ToList();
    }

    public async Task<int> TaoNoiDung(TaoNoiDungRequest request)
    {
        return await _noiDungRepo.Create(new NoiDung 
        { 
            TieuDe = request.TieuDe, 
            NoiDungText = request.MoTa, 
            Loai = request.Loai, 
            NgayCapNhat = DateTime.Now 
        });
    }

    public async Task<bool> CapNhatNoiDung(int id, CapNhatNoiDungRequest request)
    {
        var nd = await _noiDungRepo.GetById(id);
        if (nd == null) return false;
        nd.TieuDe = request.TieuDe;
        nd.NoiDungText = request.MoTa;
        nd.Loai = request.Loai;
        nd.NgayCapNhat = DateTime.Now;
        return await _noiDungRepo.Update(nd);
    }

    public async Task<bool> XoaNoiDung(int id) => await _noiDungRepo.Delete(id);

    // ==========================================
    // HỌA SĨ
    // ==========================================
    public async Task<List<HoSoHoaSiResponse>> GetAllHoaSi()
    {
        var list = await _hoaSiRepo.GetAll();
        var result = new List<HoSoHoaSiResponse>();
        
        // Lấy tất cả đơn hàng đã hoàn thành (TrangThai = 3)
        var allOrders = await _donHangRepo.GetAll();
        var completedOrders = allOrders.Where(o => o.TrangThai == 3).ToList();
        
        foreach (var x in list)
        {
            var tacPhams = await _tacPhamRepo.GetMarketplaceByArtist(x.MaHoaSi);
            var tacPhamIds = tacPhams.Select(tp => tp.MaTacPham).ToHashSet();
            
            // Tính doanh thu từ các đơn hàng đã hoàn thành
            decimal doanhThu = 0;
            foreach (var order in completedOrders)
            {
                var chiTiet = await _donHangRepo.GetChiTiet(order.MaDonHang);
                doanhThu += chiTiet
                    .Where(ct => tacPhamIds.Contains(ct.MaTacPham))
                    .Sum(ct => ct.SoLuong * ct.DonGia);
            }
            
            result.Add(new HoSoHoaSiResponse 
            { 
                MaHoaSi = x.MaHoaSi, 
                TenHoaSi = x.TenHoaSi, 
                Email = x.Email,
                SoDienThoai = x.DienThoai,
                TieuSu = x.TieuSu, 
                AnhDaiDien = x.AnhDaiDien,
                SoTacPham = tacPhams.Count,
                TongDoanhThu = doanhThu,
                TrangThai = x.TrangThai
            });
        }
        return result;
    }

    public async Task<HoSoHoaSiResponse> GetHoaSiById(int id)
    {
        var x = await _hoaSiRepo.GetById(id);
        if (x == null) return null!;
        var tacPhams = await _tacPhamRepo.GetMarketplaceByArtist(id);
        var tacPhamIds = tacPhams.Select(tp => tp.MaTacPham).ToHashSet();
        
        // Tính doanh thu từ các đơn hàng đã hoàn thành (TrangThai = 3)
        var allOrders = await _donHangRepo.GetAll();
        var completedOrders = allOrders.Where(o => o.TrangThai == 3).ToList();
        
        decimal doanhThu = 0;
        foreach (var order in completedOrders)
        {
            var chiTiet = await _donHangRepo.GetChiTiet(order.MaDonHang);
            doanhThu += chiTiet
                .Where(ct => tacPhamIds.Contains(ct.MaTacPham))
                .Sum(ct => ct.SoLuong * ct.DonGia);
        }
        
        return new HoSoHoaSiResponse 
        { 
            MaHoaSi = x.MaHoaSi, 
            TenHoaSi = x.TenHoaSi, 
            Email = x.Email,
            SoDienThoai = x.DienThoai,
            TieuSu = x.TieuSu, 
            AnhDaiDien = x.AnhDaiDien,
            SoTacPham = tacPhams.Count,
            TongDoanhThu = doanhThu,
            TrangThai = x.TrangThai
        };
    }
    
    public async Task<List<TacPhamHoaSiResponse>> GetTacPhamCuaHoaSi(int id)
    {
        var list = await _tacPhamRepo.GetMarketplaceByArtist(id);
        var hoaSi = await _hoaSiRepo.GetById(id);
        var danhMucs = await _danhMucRepo.GetAll();

        return list.Select(x => new TacPhamHoaSiResponse 
        { 
            MaTacPham = x.MaTacPham, 
            TenTacPham = x.TenTacPham, 
            Gia = x.Gia,
            SoLuong = x.SoLuong,
            MoTa = x.MoTa,
            KichThuoc = x.KichThuoc,
            ChatLieu = x.ChatLieu,
            ChatLieuKhung = x.ChatLieuKhung,
            TrangThai = x.TrangThai,
            TrangThaiText = x.TrangThai switch {
                0 => "Chờ duyệt",
                1 => "Đang bán",
                2 => "Ẩn (ngừng bán tạm thời)",
                3 => "Từ chối",
                _ => "Không xác định"
            },
            NgayTao = x.NgayTao,
            HinhAnh = x.HinhAnh,
            TenHoaSi = hoaSi?.TenHoaSi ?? "N/A",
            TenDanhMuc = danhMucs.FirstOrDefault(d => d.MaDanhMuc == x.MaDanhMuc)?.TenDanhMuc ?? "N/A",
            LyDo = x.LyDo
        }).ToList();
    }

    public async Task<bool> KhoaHoaSi(int id) => await SetTrangThaiHoaSi(id, false);
    public async Task<bool> MoKhoaHoaSi(int id) => await SetTrangThaiHoaSi(id, true);

    private async Task<bool> SetTrangThaiHoaSi(int maHoaSi, bool trangThai)
    {
        var hs = await _hoaSiRepo.GetById(maHoaSi);
        if (hs == null) return false;

        // Cập nhật trạng thái cả ở HoaSi (nếu có) và TaiKhoan
        hs.TrangThai = trangThai;
        await _hoaSiRepo.Update(hs);

        if (hs.MaTaiKhoan.HasValue)
        {
            var tk = await _taiKhoanRepo.GetById(hs.MaTaiKhoan.Value);
            if (tk != null)
            {
                tk.TrangThai = trangThai;
                await _taiKhoanRepo.Update(tk);
            }
        }
        return true;
    }
    public Task<List<HoSoHoaSiResponse>> TimKiemHoaSi(string? keyword, bool? trangThai, int? tuSoTacPham, int? denSoTacPham, decimal? tuDoanhThu, decimal? denDoanhThu, int pageNumber, int pageSize) => throw new NotImplementedException();
    public Task<List<HoaSiXepHangResponse>> XepHangHoaSi(string tieuChi, int top) => throw new NotImplementedException();

    // ==========================================
    // ĐƠN HÀNG & THANH TOÁN
    // ==========================================
    public async Task<List<DonHangAdminResponse>> GetAllDonHang(byte? trangThai = null, DateTime? tuNgay = null, DateTime? denNgay = null)
    {
        var list = await _donHangRepo.GetAll();
        if (trangThai.HasValue) list = list.Where(x => x.TrangThai == trangThai.Value).ToList();
        
        var users = await _nguoiDungRepo.GetAll();
        var paymentsByOrder = (await _thanhToanRepo.GetAll())
            .GroupBy(payment => payment.MaDonHang)
            .ToDictionary(group => group.Key, group => group.First());

        return list.Select(x =>
        {
            paymentsByOrder.TryGetValue(x.MaDonHang, out var payment);
            return new DonHangAdminResponse
            {
                MaDonHang = x.MaDonHang,
                NgayDat = x.NgayDat,
                TongTien = x.TongTien,
                TrangThai = x.TrangThai,
                TrangThaiText = x.TrangThai switch {
                    0 => "Chờ xác nhận",
                    1 => "Đã xác nhận",
                    2 => "Đang giao",
                    3 => "Đã giao",
                    4 => "Yêu cầu hủy",
                    5 => "Đã hủy",
                    _ => "Không xác định"
                },
                TrangThaiThanhToan = payment?.TrangThai,
                PhuongThucThanhToan = payment?.PhuongThuc,
                LyDoHuy = x.LyDoHuy,
                TenKhachHang = users.FirstOrDefault(u => u.MaNguoiDung == x.MaNguoiDung)?.Ten ?? "Khách hàng"
            };
        }).ToList();
    }
    public async Task<DonHangResponse> GetDonHangById(int id)
    {
        var order = await _donHangRepo.GetById(id);
        if (order == null) return null!;

        var chiTiets = await _donHangRepo.GetChiTiet(id);
        var thanhToan = await _thanhToanRepo.GetByDonHang(id);
        var result = new DonHangResponse
        {
            MaDonHang = order.MaDonHang,
            NgayDat = order.NgayDat,
            NgayGiao = order.NgayGiao,
            TongTien = order.TongTien,
            TenNguoiNhan = order.TenNguoiNhan ?? "",
            SoDienThoai = order.SoDienThoai ?? "",
            DiaChiGiao = order.DiaChiGiao ?? "",
            TrangThai = order.TrangThai,
            TrangThaiText = order.TrangThai switch
            {
                0 => "Chờ xác nhận",
                1 => "Đã xác nhận",
                2 => "Đang giao",
                3 => "Đã giao",
                4 => "Yêu cầu hủy",
                5 => "Đã hủy",
                _ => "Không xác định"
            },
            TrangThaiThanhToan = thanhToan?.TrangThai,
            PhuongThucThanhToan = thanhToan?.PhuongThuc,
            ChiTiet = new List<ChiTietDonHangResponse>()
        };

        foreach (var item in chiTiets)
        {
            var tacPham = await _tacPhamRepo.GetById(item.MaTacPham);
            string tenHoaSi = "N/A";
            if (tacPham != null)
            {
                var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);
                tenHoaSi = hoaSi?.TenHoaSi ?? "N/A";
            }

            result.ChiTiet.Add(new ChiTietDonHangResponse
            {
                MaChiTietDH = item.MaChiTietDH,
                MaTacPham = item.MaTacPham,
                TenTacPham = tacPham?.TenTacPham ?? "Sản phẩm đã xóa",
                TenHoaSi = tenHoaSi,
                SoLuong = item.SoLuong,
                DonGia = item.DonGia,
                ThanhTien = item.SoLuong * item.DonGia,
                HinhAnh = tacPham?.HinhAnh
            });
        }

        return result;
    }
    public async Task<bool> CapNhatTrangThaiDonHang(int id, int maTaiKhoan, CapNhatTrangThaiDonHangRequest request)
    {
        var allowed = new byte[]
        {
            DonHangStatus.ChoXacNhan, DonHangStatus.DaXacNhan, DonHangStatus.DangGiao,
            DonHangStatus.YeuCauHuy, DonHangStatus.DaHuy
        };
        if (!allowed.Contains(request.TrangThai))
            throw new ArgumentException(request.TrangThai == DonHangStatus.DaGiao
                ? "Khách hàng cần xác nhận đã nhận hàng để hoàn tất đơn"
                : "Trạng thái không hợp lệ");
        var note = string.IsNullOrWhiteSpace(request.GhiChu) ? null : request.GhiChu.Trim();
        if (note?.Length > 500) throw new ArgumentException("Ghi chú quá dài");
        return await _donHangRepo.UpdateStatusTransactional(id, request.TrangThai, note, maTaiKhoan);
    }
    public Task<bool> XoaDonHang(int id) => throw new NotImplementedException("IDonHangRepository does not have a Delete method");
    public Task<List<DonHangAdminResponse>> TimKiemDonHang(string? keyword, byte? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuGia, decimal? denGia, int pageNumber, int pageSize) => throw new NotImplementedException();
    public Task<TimKiemDonHangResponse> TimKiemDonHangNangCao(TimKiemDonHangRequest request) => throw new NotImplementedException();
    public Task<List<DonHangAdminResponse>> SapXepDonHang(string sapXepTheo, string thuTu) => throw new NotImplementedException();

    public async Task<List<ThanhToanResponse>> GetAllThanhToan(string? trangThai, DateTime? tuNgay, DateTime? denNgay)
    {
        var payments = await _thanhToanRepo.GetAll();
        if (!string.IsNullOrWhiteSpace(trangThai))
            payments = payments.Where(x => x.TrangThai.Equals(trangThai.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
        if (tuNgay.HasValue) payments = payments.Where(x => x.NgayThanhToan >= tuNgay.Value.Date).ToList();
        if (denNgay.HasValue) payments = payments.Where(x => x.NgayThanhToan < denNgay.Value.Date.AddDays(1)).ToList();

        var result = new List<ThanhToanResponse>();
        foreach (var payment in payments)
            result.Add(await MapPayment(payment));
        return result;
    }

    public async Task<ThanhToanResponse> GetThanhToanById(int id)
    {
        var payment = await _thanhToanRepo.GetById(id);
        return payment == null ? null! : await MapPayment(payment);
    }

    public async Task<bool> XacNhanThanhToan(int id, int maTaiKhoan, string? maGiaoDich)
    {
        var payment = await _thanhToanRepo.GetById(id);
        if (payment == null) return false;
        var transactionCode = string.IsNullOrWhiteSpace(maGiaoDich) ? null : maGiaoDich.Trim();
        if (transactionCode?.Length > 100) throw new ArgumentException("Mã giao dịch quá dài");
        return await XacNhanThanhToanChuyenKhoan(payment, maTaiKhoan, transactionCode);
    }

    public async Task<bool> XacNhanThanhToanTheoDonHang(int maDonHang, int maTaiKhoan)
    {
        var order = await _donHangRepo.GetById(maDonHang);
        if (order == null) return false;

        var payment = await _thanhToanRepo.GetByDonHang(maDonHang);
        if (payment == null)
            throw new BusinessConflictException("Đơn hàng chưa có thông tin thanh toán");

        return await XacNhanThanhToanChuyenKhoan(payment, maTaiKhoan, null);
    }

    /// <summary>
    /// Xác nhận chuyển khoản theo cách idempotent. Khi một yêu cầu đồng thời đã xác nhận
    /// trước đó, lần gọi sau vẫn thành công nhưng không ghi đè ngày/người xác nhận.
    /// </summary>
    private async Task<bool> XacNhanThanhToanChuyenKhoan(ThanhToan payment, int maTaiKhoan, string? maGiaoDich)
    {
        if (!string.Equals(payment.PhuongThuc, "BankTransfer", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Chỉ thanh toán chuyển khoản mới cần Admin xác nhận");

        if (string.Equals(payment.TrangThai, "DaThanhToan", StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.Equals(payment.TrangThai, "ChoThanhToan", StringComparison.OrdinalIgnoreCase))
            throw new BusinessConflictException("Thanh toán không ở trạng thái chờ xác nhận");

        if (await _thanhToanRepo.ConfirmBankTransfer(payment.MaThanhToan, maTaiKhoan, maGiaoDich))
            return true;

        // Có thể một Admin khác vừa xác nhận trong khoảng giữa thao tác đọc và UPDATE.
        // Đọc lại để giữ endpoint an toàn khi gọi lặp thay vì tạo bản ghi hoặc lỗi dữ liệu.
        var latestPayment = await _thanhToanRepo.GetById(payment.MaThanhToan);
        if (latestPayment != null
            && string.Equals(latestPayment.PhuongThuc, "BankTransfer", StringComparison.OrdinalIgnoreCase)
            && string.Equals(latestPayment.TrangThai, "DaThanhToan", StringComparison.OrdinalIgnoreCase))
            return true;

        throw new BusinessConflictException("Thanh toán đã được xử lý bởi một yêu cầu khác");
    }
    public Task<List<ThanhToanResponse>> TimKiemThanhToan(string? keyword, string? phuongThuc, string? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuSoTien, decimal? denSoTien, int pageNumber, int pageSize) => throw new NotImplementedException();

    private async Task<ThanhToanResponse> MapPayment(ThanhToan payment)
    {
        var order = await _donHangRepo.GetById(payment.MaDonHang);
        var customer = order == null ? null : await _nguoiDungRepo.GetById(order.MaNguoiDung);
        return new ThanhToanResponse
        {
            MaThanhToan = payment.MaThanhToan,
            MaDonHang = payment.MaDonHang,
            PhuongThuc = payment.PhuongThuc,
            TrangThai = payment.TrangThai,
            NgayThanhToan = payment.NgayThanhToan,
            MaGiaoDich = payment.MaGiaoDich,
            NguoiXacNhan = payment.NguoiXacNhan,
            SoTien = order?.TongTien ?? 0,
            TenKhachHang = customer?.Ten
        };
    }

    public Task<List<HoaDonResponse>> GetAllHoaDon(DateTime? tuNgay, DateTime? denNgay) => throw new NotImplementedException();
    public Task<HoaDonChiTietResponse> GetHoaDonById(int id) => throw new NotImplementedException();
    public Task<int> TaoHoaDonTuDonHang(int maDonHang) => throw new NotImplementedException();
    public Task<bool> HuyHoaDon(int id, string lyDo) => throw new NotImplementedException();
    public Task<List<HoaDonResponse>> TimKiemHoaDon(string? keyword, string? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuSoTien, decimal? denSoTien, int pageNumber, int pageSize) => throw new NotImplementedException();

    // ==========================================
    // KHÁCH HÀNG
    // ==========================================
    public async Task<List<ThongTinKhachHangResponse>> GetAllKhachHang()
    {
        var list = await _nguoiDungRepo.GetAll();
        var result = new List<ThongTinKhachHangResponse>();
        foreach (var x in list)
        {
            bool trangThai = true;
            if (x.MaTaiKhoan.HasValue)
            {
                var tk = await _taiKhoanRepo.GetById(x.MaTaiKhoan.Value);
                if (tk != null) trangThai = tk.TrangThai;
            }
            result.Add(new ThongTinKhachHangResponse
            {
                MaNguoiDung = x.MaNguoiDung,
                Ten = x.Ten,
                Email = x.Email,
                DienThoai = x.DienThoai,
                DiaChi = x.DiaChi,
                TrangThai = trangThai
            });
        }
        return result;
    }
    public async Task<ThongTinKhachHangResponse> GetKhachHangById(int id)
    {
        var x = await _nguoiDungRepo.GetById(id);
        if (x == null) return null!;
        bool trangThai = true;
        if (x.MaTaiKhoan.HasValue)
        {
            var tk = await _taiKhoanRepo.GetById(x.MaTaiKhoan.Value);
            if (tk != null) trangThai = tk.TrangThai;
        }
        return new ThongTinKhachHangResponse
        {
            MaNguoiDung = x.MaNguoiDung,
            Ten = x.Ten,
            Email = x.Email,
            DienThoai = x.DienThoai,
            DiaChi = x.DiaChi,
            TrangThai = trangThai
        };
    }
    public Task<List<DonHangResponse>> GetDonHangCuaKhachHang(int id) => throw new NotImplementedException();
    public async Task<bool> KhoaKhachHang(int id) => await SetTrangThaiTaiKhoanCuaNguoiDung(id, false);
    public async Task<bool> MoKhoaKhachHang(int id) => await SetTrangThaiTaiKhoanCuaNguoiDung(id, true);

    private async Task<bool> SetTrangThaiTaiKhoanCuaNguoiDung(int maNguoiDung, bool trangThai)
    {
        var nd = await _nguoiDungRepo.GetById(maNguoiDung);
        if (nd == null || !nd.MaTaiKhoan.HasValue) return false;
        var tk = await _taiKhoanRepo.GetById(nd.MaTaiKhoan.Value);
        if (tk == null) return false;
        tk.TrangThai = trangThai;
        return await _taiKhoanRepo.Update(tk);
    }
    public Task<List<ThongTinKhachHangResponse>> TimKiemKhachHang(string? keyword, bool? trangThai, decimal? tuChiTieu, decimal? denChiTieu, int? tuSoDonHang, int? denSoDonHang, int pageNumber, int pageSize) => throw new NotImplementedException();
    public Task<List<ThongTinKhachHangResponse>> LocKhachHangTheoHoatDong(string loai) => throw new NotImplementedException();

    // ==========================================
    // ADMIN TẠO TÀI KHOẢN HỌA SĨ
    // ==========================================
    public async Task<TaoTaiKhoanHoaSiResponse> TaoTaiKhoanHoaSi(TaoTaiKhoanHoaSiRequest request)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(request.TenDangNhap))
            return new TaoTaiKhoanHoaSiResponse { Success = false, Message = "Tên đăng nhập không được để trống" };
        if (string.IsNullOrWhiteSpace(request.MatKhau) || request.MatKhau.Length < 6)
            return new TaoTaiKhoanHoaSiResponse { Success = false, Message = "Mật khẩu phải có ít nhất 6 ký tự" };
        if (string.IsNullOrWhiteSpace(request.TenHoaSi))
            return new TaoTaiKhoanHoaSiResponse { Success = false, Message = "Tên họa sĩ không được để trống" };

        var tenDangNhap = request.TenDangNhap.Trim();
        if (await _taiKhoanRepo.CheckTenDangNhapExists(tenDangNhap))
            return new TaoTaiKhoanHoaSiResponse { Success = false, Message = "Tên đăng nhập đã tồn tại" };

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.MatKhau);

        var taiKhoan = new TaiKhoan
        {
            TenDangNhap = tenDangNhap,
            MatKhau = hashedPassword,
            VaiTro = 2, // Họa sĩ
            TrangThai = true
        };
        var maTaiKhoan = await _taiKhoanRepo.Create(taiKhoan);

        var hoaSi = new HoaSi
        {
            MaTaiKhoan = maTaiKhoan,
            TenHoaSi = request.TenHoaSi.Trim(),
            Email = request.Email?.Trim(),
            DienThoai = request.DienThoai?.Trim(),
            DiaChi = request.DiaChi?.Trim(),
            TieuSu = null,
            AnhDaiDien = null,
            TrangThai = true
        };
        var maHoaSi = await _hoaSiRepo.Create(hoaSi);

        return new TaoTaiKhoanHoaSiResponse
        {
            Success = true,
            Message = "Tạo tài khoản họa sĩ thành công",
            MaTaiKhoan = maTaiKhoan,
            MaHoaSi = maHoaSi
        };
    }

    // TÌM KIẾM TỔNG HỢP
    public Task<TimKiemTongHopResponse> TimKiemTongHop(string keyword) => throw new NotImplementedException();

    // ==========================================
    // TÁC PHẨM CHỈNH SỬA
    // ==========================================
    public async Task<List<TacPhamChinhSuaResponse>> GetAllTacPhamChinhSua()
    {
        var list = await _tacPhamChinhSuaRepo.GetAllChoDuyet();
        
        // Lấy thông tin họa sĩ và danh mục
        var hoaSis = await _hoaSiRepo.GetAll();
        var danhMucs = await _danhMucRepo.GetAll();
        var tacPhams = await _tacPhamRepo.GetMarketplaceAll();
        
        var result = new List<TacPhamChinhSuaResponse>();
        
        foreach (var chinhSua in list)
        {
            var tacPham = tacPhams.FirstOrDefault(tp => tp.MaTacPham == chinhSua.MaTacPham);
            if (tacPham == null) continue;
            var hoaSi = tacPham != null ? hoaSis.FirstOrDefault(h => h.MaHoaSi == tacPham.MaHoaSi) : null;
            var danhMuc = danhMucs.FirstOrDefault(d => d.MaDanhMuc == chinhSua.MaDanhMuc);
            
            result.Add(new TacPhamChinhSuaResponse
            {
                MaChinhSua = chinhSua.MaChinhSua,
                MaTacPham = chinhSua.MaTacPham,
                TenTacPham = chinhSua.TenTacPham,
                TenHoaSi = hoaSi?.TenHoaSi ?? "N/A",
                TenDanhMuc = danhMuc?.TenDanhMuc,
                Gia = chinhSua.Gia,
                SoLuong = chinhSua.SoLuong,
                HinhAnh = chinhSua.HinhAnh,
                TrangThai = chinhSua.TrangThai,
                NgayChinhSua = chinhSua.NgayChinhSua,
                LyDo = chinhSua.LyDo
            });
        }
        
        return result;
    }
    
    public async Task<bool> DuyetTacPhamChinhSua(int maChinhSua, DuyetTacPhamChinhSuaRequest request)
    {
        var chinhSua = await _tacPhamChinhSuaRepo.GetById(maChinhSua);
        if (chinhSua == null) return false;
        
        var tacPham = await GetMarketplaceArtworkForMutation(chinhSua.MaTacPham);
        if (tacPham == null) return false;
        
        if (request.PheDuyet)
        {
            // Áp dụng thay đổi vào tác phẩm gốc
            tacPham.TenTacPham = chinhSua.TenTacPham;
            tacPham.MaDanhMuc = chinhSua.MaDanhMuc;
            tacPham.Gia = chinhSua.Gia;
            tacPham.SoLuong = chinhSua.SoLuong;
            tacPham.MoTa = chinhSua.MoTa;
            tacPham.HinhAnh = chinhSua.HinhAnh;
            tacPham.KichThuoc = chinhSua.KichThuoc;
            tacPham.ChatLieu = chinhSua.ChatLieu;
            tacPham.ChatLieuKhung = chinhSua.ChatLieuKhung;
            
            await _tacPhamRepo.Update(tacPham);
            
            // Đánh dấu bản chỉnh sửa đã được duyệt
            chinhSua.TrangThai = 1; // Đã duyệt
            chinhSua.LyDo = null;
        }
        else
        {
            // Từ chối chỉnh sửa
            chinhSua.TrangThai = 2; // Từ chối
            chinhSua.LyDo = string.IsNullOrWhiteSpace(request.LyDo) ? "Không đạt yêu cầu" : request.LyDo.Trim();
        }
        
        return await _tacPhamChinhSuaRepo.Update(chinhSua);
    }

    private async Task<TacPham?> GetMarketplaceArtworkForMutation(int id)
    {
        var tacPham = await _tacPhamRepo.GetById(id);
        if (tacPham?.MaYeuCauVeTranh != null)
            throw new BusinessConflictException("Tác phẩm nội bộ của yêu cầu vẽ tranh không thuộc nghiệp vụ marketplace");
        return tacPham;
    }
}
