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
        var list = await _tacPhamRepo.GetAll();
        if (trangThai.HasValue)
            list = list.Where(x => x.TrangThai == trangThai.Value).ToList();
        
        var hoaSis = await _hoaSiRepo.GetAll();
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
        var tacPham = await _tacPhamRepo.GetById(id);
        if (tacPham == null) return false;
        
        // Kiểm tra xem có bản chỉnh sửa chờ duyệt không
        var chinhSua = await _tacPhamChinhSuaRepo.GetByMaTacPhamChoDuyet(id);
        
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
                await _tacPhamChinhSuaRepo.Update(chinhSua);
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
                await _tacPhamChinhSuaRepo.Update(chinhSua);
                
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
        
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> HideTacPham(int id)
    {
        var tacPham = await _tacPhamRepo.GetById(id);
        if (tacPham == null) return false;
        tacPham.TrangThai = 2; // Hidden
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> ShowTacPham(int id)
    {
        var tacPham = await _tacPhamRepo.GetById(id);
        if (tacPham == null) return false;
        tacPham.TrangThai = 1; // Approved
        return await _tacPhamRepo.Update(tacPham);
    }

    public async Task<bool> XoaTacPham(int id) => await _tacPhamRepo.Delete(id);

    public Task<List<TacPhamHoaSiResponse>> TimKiemTacPham(string? keyword, int? maDanhMuc, int? maHoaSi, byte? trangThai, decimal? tuGia, decimal? denGia, int? tuSoLuong, int? denSoLuong, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize) => throw new NotImplementedException();
    public Task<List<TacPhamHoaSiResponse>> LocTacPhamTheoTieuChi(string tieuChi) => throw new NotImplementedException();
    public Task<List<TacPhamHoaSiResponse>> SapXepTacPham(string sapXepTheo, string thuTu) => throw new NotImplementedException();

    // ==========================================
    // DANH MỤC
    // ==========================================
    public async Task<List<DanhMucResponse>> GetAllDanhMuc()
    {
        var list = await _danhMucRepo.GetAll();
        var allTacPham = await _tacPhamRepo.GetAll();
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
        var allTacPham = await _tacPhamRepo.GetAll();
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
        
        return list.Select(x => new BaiVietResponse
        {
            MaBaiViet = x.MaBaiViet,
            TieuDe = x.TieuDe,
            NoiDung = x.NoiDung,
            MaHoaSi = x.MaHoaSi,
            TenHoaSi = hoaSis.FirstOrDefault(h => h.MaHoaSi == x.MaHoaSi)?.TenHoaSi ?? "N/A",
            NgayDang = x.NgayDang,
            TrangThai = x.TrangThai,
            LyDo = x.LyDo,
            AnhTieuDe = x.AnhTieuDe
        }).ToList();
    }

    public async Task<bool> DuyetBaiViet(int id, DuyetBaiVietRequest request)
    {
        var bv = await _baiVietRepo.GetById(id);
        if (bv == null) return false;
        // Published (2) / Rejected (3)
        bv.TrangThai = request.PheDuyet ? (byte)2 : (byte)3;
        bv.LyDo = request.PheDuyet ? null : request.LyDo;
        return await _baiVietRepo.Update(bv);
    }

    public async Task<bool> ArchiveBaiViet(int id)
    {
        var bv = await _baiVietRepo.GetById(id);
        if (bv == null) return false;
        bv.TrangThai = 4; // Archived
        bv.LyDo = null;
        return await _baiVietRepo.Update(bv);
    }

    public async Task<bool> XoaBaiViet(int id) => await _baiVietRepo.Delete(id);
    public Task<List<BaiVietResponse>> TimKiemBaiViet(string? keyword, int? maHoaSi, bool? trangThai, DateTime? tuNgay, DateTime? denNgay, int pageNumber, int pageSize) => throw new NotImplementedException();

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
            var tacPhams = await _tacPhamRepo.GetByHoaSi(x.MaHoaSi);
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
        var tacPhams = await _tacPhamRepo.GetByHoaSi(id);
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
        var list = await _tacPhamRepo.GetByHoaSi(id);
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

        return list.Select(x => new DonHangAdminResponse 
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
            LyDoHuy = x.LyDoHuy,
            TenKhachHang = users.FirstOrDefault(u => u.MaNguoiDung == x.MaNguoiDung)?.Ten ?? "Khách hàng"
        }).ToList();
    }
    public async Task<DonHangResponse> GetDonHangById(int id)
    {
        var order = await _donHangRepo.GetById(id);
        if (order == null) return null!;

        var chiTiets = await _donHangRepo.GetChiTiet(id);
        var result = new DonHangResponse
        {
            MaDonHang = order.MaDonHang,
            NgayDat = order.NgayDat,
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
    public async Task<bool> CapNhatTrangThaiDonHang(int id, CapNhatTrangThaiDonHangRequest request)
    {
        var currentOrder = await _donHangRepo.GetById(id);
        if (currentOrder == null) return false;

        // Đơn đã huỷ/đã giao thì không cho đổi nữa
        if (currentOrder.TrangThai == DonHangStatus.DaHuy || currentOrder.TrangThai == DonHangStatus.DaGiao)
        {
            throw new InvalidOperationException("Đơn hàng đã ở trạng thái cuối, không thể đổi nữa.");
        }

        // Không cho lùi từ Đang giao về Chờ xác nhận / Đã xác nhận
        if (currentOrder.TrangThai == DonHangStatus.DangGiao
            && (request.TrangThai == DonHangStatus.ChoXacNhan || request.TrangThai == DonHangStatus.DaXacNhan))
        {
            throw new InvalidOperationException("Không thể chuyển trạng thái từ 'Đang giao' về 'Chờ xác nhận' hoặc 'Đã xác nhận'.");
        }

        // Validate trạng thái mới
        var allowed = new byte[]
        {
            DonHangStatus.ChoXacNhan, DonHangStatus.DaXacNhan, DonHangStatus.DangGiao,
            DonHangStatus.DaGiao, DonHangStatus.YeuCauHuy, DonHangStatus.DaHuy
        };
        if (!allowed.Contains(request.TrangThai))
            throw new ArgumentException("Trạng thái không hợp lệ");

        // Khi admin chuyển sang "Đã hủy" → hoàn tồn kho
        if (request.TrangThai == DonHangStatus.DaHuy && currentOrder.TrangThai != DonHangStatus.DaHuy)
        {
            var details = await _donHangRepo.GetChiTiet(id);
            foreach (var ct in details)
            {
                var tp = await _tacPhamRepo.GetById(ct.MaTacPham);
                if (tp != null)
                {
                    tp.SoLuong += ct.SoLuong;
                    await _tacPhamRepo.Update(tp);
                }
            }
        }

        return await _donHangRepo.UpdateTrangThai(id, request.TrangThai, request.GhiChu);
    }
    public Task<bool> XoaDonHang(int id) => throw new NotImplementedException("IDonHangRepository does not have a Delete method");
    public Task<List<DonHangAdminResponse>> TimKiemDonHang(string? keyword, byte? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuGia, decimal? denGia, int pageNumber, int pageSize) => throw new NotImplementedException();
    public Task<TimKiemDonHangResponse> TimKiemDonHangNangCao(TimKiemDonHangRequest request) => throw new NotImplementedException();
    public Task<List<DonHangAdminResponse>> SapXepDonHang(string sapXepTheo, string thuTu) => throw new NotImplementedException();

    public Task<List<ThanhToanResponse>> GetAllThanhToan(string? trangThai, DateTime? tuNgay, DateTime? denNgay) => throw new NotImplementedException();
    public Task<ThanhToanResponse> GetThanhToanById(int id) => throw new NotImplementedException();
    public Task<bool> XacNhanThanhToan(int id) => throw new NotImplementedException();
    public Task<List<ThanhToanResponse>> TimKiemThanhToan(string? keyword, string? phuongThuc, string? trangThai, DateTime? tuNgay, DateTime? denNgay, decimal? tuSoTien, decimal? denSoTien, int pageNumber, int pageSize) => throw new NotImplementedException();

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
        var tacPhams = await _tacPhamRepo.GetAll();
        
        var result = new List<TacPhamChinhSuaResponse>();
        
        foreach (var chinhSua in list)
        {
            var tacPham = tacPhams.FirstOrDefault(tp => tp.MaTacPham == chinhSua.MaTacPham);
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
        
        var tacPham = await _tacPhamRepo.GetById(chinhSua.MaTacPham);
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
}
