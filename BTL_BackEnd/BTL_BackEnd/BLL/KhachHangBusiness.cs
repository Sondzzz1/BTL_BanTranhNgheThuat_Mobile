using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public class KhachHangBusiness : IKhachHangBusiness
{
    private readonly INguoiDungRepository _nguoiDungRepo;
    private readonly IGioHangRepository _gioHangRepo;
    private readonly IDonHangRepository _donHangRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IThanhToanRepository _thanhToanRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly ITaiKhoanRepository _taiKhoanRepo;

    public KhachHangBusiness(
        INguoiDungRepository nguoiDungRepo,
        IGioHangRepository gioHangRepo,
        IDonHangRepository donHangRepo,
        ITacPhamRepository tacPhamRepo,
        IThanhToanRepository thanhToanRepo,
        IHoaSiRepository hoaSiRepo,
        ITaiKhoanRepository taiKhoanRepo)
    {
        _nguoiDungRepo = nguoiDungRepo;
        _gioHangRepo = gioHangRepo;
        _donHangRepo = donHangRepo;
        _tacPhamRepo = tacPhamRepo;
        _thanhToanRepo = thanhToanRepo;
        _hoaSiRepo = hoaSiRepo;
        _taiKhoanRepo = taiKhoanRepo;
    }

    public async Task<ThongTinKhachHangResponse?> GetThongTin(int maNguoiDung)
    {
        var nguoiDung = await _nguoiDungRepo.GetById(maNguoiDung);
        if (nguoiDung == null) return null;

        bool trangThai = true;
        if (nguoiDung.MaTaiKhoan.HasValue)
        {
            var tk = await _taiKhoanRepo.GetById(nguoiDung.MaTaiKhoan.Value);
            if (tk != null) trangThai = tk.TrangThai;
        }

        return new ThongTinKhachHangResponse
        {
            MaNguoiDung = nguoiDung.MaNguoiDung,
            Ten = nguoiDung.Ten,
            DiaChi = nguoiDung.DiaChi,
            DienThoai = nguoiDung.DienThoai,
            Email = nguoiDung.Email,
            TrangThai = trangThai
        };
    }

    public async Task<bool> CapNhatThongTin(int maNguoiDung, CapNhatThongTinRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Ten))
            throw new ArgumentException("Họ tên không được để trống");

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            // Validate email cơ bản
            var email = request.Email.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                throw new ArgumentException("Email không hợp lệ");
        }

        if (!string.IsNullOrWhiteSpace(request.DienThoai))
        {
            var phone = request.DienThoai.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^[0-9]{9,11}$"))
                throw new ArgumentException("Số điện thoại không hợp lệ");
        }

        var nguoiDung = await _nguoiDungRepo.GetById(maNguoiDung);
        if (nguoiDung == null) return false;

        nguoiDung.Ten = request.Ten.Trim();
        nguoiDung.DiaChi = string.IsNullOrWhiteSpace(request.DiaChi) ? null : request.DiaChi.Trim();
        nguoiDung.DienThoai = string.IsNullOrWhiteSpace(request.DienThoai) ? null : request.DienThoai.Trim();
        nguoiDung.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        return await _nguoiDungRepo.Update(nguoiDung);
    }

    public async Task<GioHangResponse> GetGioHang(int maNguoiDung)
    {
        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        
        if (gioHang == null)
        {
            var maGioHang = await _gioHangRepo.CreateGioHang(maNguoiDung);
            return new GioHangResponse
            {
                MaGioHang = maGioHang,
                DanhSachSanPham = new List<ChiTietGioHangResponse>(),
                TongTien = 0
            };
        }

        var chiTietList = await _gioHangRepo.GetChiTiet(gioHang.MaGioHang);
        var danhSachSanPham = new List<ChiTietGioHangResponse>();
        decimal tongTien = 0;

        foreach (var chiTiet in chiTietList)
        {
            var tacPham = await _tacPhamRepo.GetById(chiTiet.MaTacPham);
            if (tacPham == null) continue;

            var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);
            var thanhTien = tacPham.Gia * chiTiet.SoLuong;
            danhSachSanPham.Add(new ChiTietGioHangResponse
            {
                MaChiTietGH = chiTiet.MaChiTietGH,
                MaTacPham = tacPham.MaTacPham,
                TenTacPham = tacPham.TenTacPham,
                TenHoaSi = hoaSi?.TenHoaSi ?? "",
                Gia = tacPham.Gia,
                SoLuong = chiTiet.SoLuong,
                ThanhTien = thanhTien,
                HinhAnh = tacPham.HinhAnh
            });
            tongTien += thanhTien;
        }

        return new GioHangResponse
        {
            MaGioHang = gioHang.MaGioHang,
            DanhSachSanPham = danhSachSanPham,
            TongTien = tongTien
        };
    }

    public async Task<bool> ThemVaoGioHang(int maNguoiDung, ThemVaoGioHangRequest request)
    {
        if (request.SoLuong < 1)
            throw new ArgumentException("Số lượng phải lớn hơn 0");

        var tacPham = await _tacPhamRepo.GetById(request.MaTacPham);
        if (tacPham == null) throw new InvalidOperationException("Tác phẩm không tồn tại");
        if (tacPham.TrangThai != 1) // chỉ cho phép thêm tác phẩm đang bán
            throw new InvalidOperationException("Tác phẩm hiện không khả dụng");

        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        if (gioHang == null)
        {
            var maGioHang = await _gioHangRepo.CreateGioHang(maNguoiDung);
            gioHang = new GioHang { MaGioHang = maGioHang, MaNguoiDung = maNguoiDung };
        }

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        var chiTietExist = await _gioHangRepo.GetChiTietByTacPham(gioHang.MaGioHang, request.MaTacPham);
        
        int newQuantity = request.SoLuong;
        if (chiTietExist != null)
        {
            newQuantity += chiTietExist.SoLuong;
        }

        if (tacPham.SoLuong < newQuantity)
        {
            throw new InvalidOperationException(
                $"Sản phẩm '{tacPham.TenTacPham}' không đủ số lượng (chỉ còn {tacPham.SoLuong})");
        }

        if (chiTietExist != null)
        {
            chiTietExist.SoLuong = newQuantity;
            return await _gioHangRepo.UpdateChiTiet(chiTietExist);
        }
        else
        {
            var chiTiet = new ChiTietGioHang
            {
                MaGioHang = gioHang.MaGioHang,
                MaTacPham = request.MaTacPham,
                SoLuong = request.SoLuong
            };
            await _gioHangRepo.AddChiTiet(chiTiet);
            return true;
        }
    }

    public async Task<bool> CapNhatGioHang(int maNguoiDung, int maChiTietGH, CapNhatGioHangRequest request)
    {
        if (request.SoLuong < 1)
            throw new ArgumentException("Số lượng phải lớn hơn 0");

        var chiTiet = await _gioHangRepo.GetChiTietById(maChiTietGH);
        if (chiTiet == null) return false;

        // Verify ownership: chiTiet phải thuộc giỏ hàng của user
        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        if (gioHang == null || chiTiet.MaGioHang != gioHang.MaGioHang)
            throw new UnauthorizedAccessException("Không có quyền cập nhật mục giỏ hàng này");

        var tacPham = await _tacPhamRepo.GetById(chiTiet.MaTacPham);
        if (tacPham == null) throw new InvalidOperationException("Tác phẩm không tồn tại");
        if (tacPham.SoLuong < request.SoLuong)
            throw new InvalidOperationException(
                $"Sản phẩm '{tacPham.TenTacPham}' không đủ số lượng (chỉ còn {tacPham.SoLuong})");

        chiTiet.SoLuong = request.SoLuong;
        return await _gioHangRepo.UpdateChiTiet(chiTiet);
    }

    public async Task<bool> XoaKhoiGioHang(int maNguoiDung, int maChiTietGH)
    {
        var chiTiet = await _gioHangRepo.GetChiTietById(maChiTietGH);
        if (chiTiet == null) return false;

        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        if (gioHang == null || chiTiet.MaGioHang != gioHang.MaGioHang)
            throw new UnauthorizedAccessException("Không có quyền xoá mục giỏ hàng này");

        return await _gioHangRepo.DeleteChiTiet(maChiTietGH);
    }

    public async Task<bool> XoaToanBoGioHang(int maNguoiDung)
    {
        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        if (gioHang == null) return true; // không có gì để xoá
        return await _gioHangRepo.ClearGioHang(gioHang.MaGioHang);
    }

    public async Task<int> TaoDonHang(int maNguoiDung, TaoDonHangRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.TenNguoiNhan))
            throw new ArgumentException("Tên người nhận không được để trống");
        if (string.IsNullOrWhiteSpace(request.SoDienThoai))
            throw new ArgumentException("Số điện thoại không được để trống");
        if (string.IsNullOrWhiteSpace(request.DiaChiGiao))
            throw new ArgumentException("Địa chỉ giao hàng không được để trống");

        var allowedPayments = new[] { "COD", "BankTransfer", "Momo", "VNPay" };
        var phuongThuc = string.IsNullOrWhiteSpace(request.PhuongThucThanhToan)
            ? "COD"
            : request.PhuongThucThanhToan;
        if (!allowedPayments.Contains(phuongThuc))
            throw new ArgumentException("Phương thức thanh toán không hợp lệ");

        // Lấy giỏ hàng
        var gioHang = await _gioHangRepo.GetByNguoiDung(maNguoiDung);
        if (gioHang == null) throw new InvalidOperationException("Giỏ hàng không tồn tại");

        var chiTietList = await _gioHangRepo.GetChiTiet(gioHang.MaGioHang);
        if (chiTietList.Count == 0) throw new InvalidOperationException("Giỏ hàng trống");

        // Kiểm tra tồn kho + trạng thái + tính tổng tiền TRƯỚC khi tạo đơn
        var snapshots = new List<(Models.TacPham tacPham, int soLuong, decimal donGia)>();
        decimal tongTien = 0;
        foreach (var chiTiet in chiTietList)
        {
            var tacPham = await _tacPhamRepo.GetById(chiTiet.MaTacPham);
            if (tacPham == null)
                throw new InvalidOperationException("Một tác phẩm trong giỏ không còn tồn tại");
            if (tacPham.TrangThai != 1)
                throw new InvalidOperationException($"Tác phẩm '{tacPham.TenTacPham}' không còn được bán");
            if (tacPham.SoLuong < chiTiet.SoLuong)
                throw new InvalidOperationException(
                    $"Tác phẩm '{tacPham.TenTacPham}' không đủ số lượng (còn {tacPham.SoLuong})");

            snapshots.Add((tacPham, chiTiet.SoLuong, tacPham.Gia));
            tongTien += tacPham.Gia * chiTiet.SoLuong;
        }

        // Tạo đơn hàng
        var donHang = new DonHang
        {
            MaNguoiDung = maNguoiDung,
            NgayDat = DateTime.UtcNow,
            TongTien = tongTien,
            TenNguoiNhan = request.TenNguoiNhan.Trim(),
            SoDienThoai = request.SoDienThoai.Trim(),
            DiaChiGiao = request.DiaChiGiao.Trim(),
            TrangThai = DonHangStatus.ChoXacNhan
        };

        var maDonHang = await _donHangRepo.Create(donHang);

        try
        {
            foreach (var (tacPham, soLuong, donGia) in snapshots)
            {
                var chiTietDH = new ChiTietDonHang
                {
                    MaDonHang = maDonHang,
                    MaTacPham = tacPham.MaTacPham,
                    SoLuong = soLuong,
                    DonGia = donGia
                };
                await _donHangRepo.CreateChiTiet(chiTietDH);

                // Trừ tồn kho
                tacPham.SoLuong -= soLuong;
                await _tacPhamRepo.Update(tacPham);
            }

            // Tạo thanh toán
            var thanhToan = new ThanhToan
            {
                MaDonHang = maDonHang,
                PhuongThuc = phuongThuc,
                TrangThai = "ChoThanhToan"
            };
            await _thanhToanRepo.Create(thanhToan);

            // Xóa giỏ hàng
            await _gioHangRepo.ClearGioHang(gioHang.MaGioHang);
        }
        catch
        {
            // Rollback "đơn giản": đánh dấu đơn là Đã huỷ và hoàn lại tồn kho cho phần đã trừ.
            // (DAL hiện không expose Transaction nên xử lý ở mức nghiệp vụ.)
            try
            {
                await _donHangRepo.UpdateTrangThai(maDonHang, DonHangStatus.DaHuy, "Lỗi hệ thống khi tạo đơn");
                var createdDetails = await _donHangRepo.GetChiTiet(maDonHang);
                foreach (var ct in createdDetails)
                {
                    var tp = await _tacPhamRepo.GetById(ct.MaTacPham);
                    if (tp != null)
                    {
                        tp.SoLuong += ct.SoLuong;
                        await _tacPhamRepo.Update(tp);
                    }
                }
            }
            catch { /* nuốt lỗi rollback để propagate exception gốc */ }
            throw;
        }

        return maDonHang;
    }

    public async Task<List<DonHangResponse>> GetDonHangCuaToi(int maNguoiDung)
    {
        var donHangList = await _donHangRepo.GetByNguoiDung(maNguoiDung);
        var result = new List<DonHangResponse>();

        foreach (var donHang in donHangList)
        {
            var thanhToan = await _thanhToanRepo.GetByDonHang(donHang.MaDonHang);
            result.Add(new DonHangResponse
            {
                MaDonHang = donHang.MaDonHang,
                NgayDat = donHang.NgayDat,
                TongTien = donHang.TongTien,
                TenNguoiNhan = donHang.TenNguoiNhan ?? "",
                SoDienThoai = donHang.SoDienThoai ?? "",
                DiaChiGiao = donHang.DiaChiGiao ?? "",
                TrangThai = donHang.TrangThai,
                TrangThaiText = DonHangStatus.GetText(donHang.TrangThai),
                TrangThaiThanhToan = thanhToan?.TrangThai,
                ChiTiet = new List<ChiTietDonHangResponse>()
            });
        }

        return result;
    }

    public async Task<DonHangResponse?> GetDonHangById(int maNguoiDung, int maDonHang)
    {
        var donHang = await _donHangRepo.GetById(maDonHang);
        if (donHang == null) return null;
        if (donHang.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Không có quyền xem đơn hàng này");

        var chiTietList = await _donHangRepo.GetChiTiet(maDonHang);
        var thanhToan = await _thanhToanRepo.GetByDonHang(maDonHang);

        var chiTietResponse = new List<ChiTietDonHangResponse>();
        foreach (var chiTiet in chiTietList)
        {
            var tacPham = await _tacPhamRepo.GetById(chiTiet.MaTacPham);
            string tenHoaSi = "";
            if (tacPham != null)
            {
                var hs = await _hoaSiRepo.GetById(tacPham.MaHoaSi);
                tenHoaSi = hs?.TenHoaSi ?? "";
            }
            chiTietResponse.Add(new ChiTietDonHangResponse
            {
                MaTacPham = chiTiet.MaTacPham,
                TenTacPham = tacPham?.TenTacPham ?? "",
                TenHoaSi = tenHoaSi,
                SoLuong = chiTiet.SoLuong,
                DonGia = chiTiet.DonGia,
                ThanhTien = chiTiet.SoLuong * chiTiet.DonGia,
                HinhAnh = tacPham?.HinhAnh
            });
        }

        return new DonHangResponse
        {
            MaDonHang = donHang.MaDonHang,
            NgayDat = donHang.NgayDat,
            TongTien = donHang.TongTien,
            TenNguoiNhan = donHang.TenNguoiNhan ?? "",
            SoDienThoai = donHang.SoDienThoai ?? "",
            DiaChiGiao = donHang.DiaChiGiao ?? "",
            TrangThai = donHang.TrangThai,
            TrangThaiText = DonHangStatus.GetText(donHang.TrangThai),
            TrangThaiThanhToan = thanhToan?.TrangThai,
            ChiTiet = chiTietResponse
        };
    }

    public async Task<bool> HuyDonHang(int maNguoiDung, int maDonHang, string? lyDo = null)
    {
        var donHang = await _donHangRepo.GetById(maDonHang);
        if (donHang == null) return false;
        if (donHang.MaNguoiDung != maNguoiDung)
            throw new UnauthorizedAccessException("Không có quyền hủy đơn hàng này");

        // Chỉ cho phép yêu cầu hủy nếu đơn đang Chờ xác nhận hoặc Đã xác nhận
        if (donHang.TrangThai != DonHangStatus.ChoXacNhan && donHang.TrangThai != DonHangStatus.DaXacNhan)
            throw new InvalidOperationException("Đơn hàng không ở trạng thái có thể yêu cầu hủy");

        var trimmedLyDo = string.IsNullOrWhiteSpace(lyDo) ? null : lyDo.Trim();
        if (trimmedLyDo != null && trimmedLyDo.Length > 500)
            throw new ArgumentException("Lý do hủy quá dài (tối đa 500 ký tự)");

        return await _donHangRepo.UpdateTrangThai(maDonHang, DonHangStatus.YeuCauHuy, trimmedLyDo);
    }

    private string GetTrangThaiText(byte trangThai) => DonHangStatus.GetText(trangThai);
}
