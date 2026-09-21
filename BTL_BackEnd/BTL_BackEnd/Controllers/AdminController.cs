using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Attributes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
[AdminOnly]
public class AdminController : ControllerBase
{
    private readonly IAdminBusiness _adminBusiness;

    public AdminController(IAdminBusiness adminBusiness)
    {
        _adminBusiness = adminBusiness;
    }

    [HttpGet("profile")]
    public ActionResult Profile()
    {
        var maTaiKhoan = Helpers.JwtHelper.GetMaTaiKhoan(User);
        var tenDangNhap = Helpers.JwtHelper.GetTenDangNhap(User);
        var vaiTro = Helpers.JwtHelper.GetVaiTro(User);
        return Ok(new
        {
            maTaiKhoan,
            tenDangNhap,
            vaiTro,
            vaiTroText = "Admin"
        });
    }

    // ================================================================
    // DASHBOARD & THỐNG KÊ
    // ================================================================

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        try
        {
            var result = await _adminBusiness.GetDashboard();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("thong-ke/tong-quan")]
    public async Task<ActionResult<ThongKeTongQuanResponse>> GetThongKeTongQuan()
    {
        try
        {
            var result = await _adminBusiness.GetThongKeTongQuan();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("thong-ke/nhanh")]
    public async Task<ActionResult<ThongKeNhanhResponse>> GetThongKeNhanh(
        [FromQuery] DateTime? ngay = null)
    {
        try
        {
            var result = await _adminBusiness.GetThongKeNhanh(ngay ?? DateTime.Today);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("thong-ke/so-sanh")]
    public async Task<ActionResult<ThongKeSoSanhResponse>> GetThongKeSoSanh(
        [FromQuery] DateTime tuNgay1,
        [FromQuery] DateTime denNgay1,
        [FromQuery] DateTime tuNgay2,
        [FromQuery] DateTime denNgay2)
    {
        try
        {
            var result = await _adminBusiness.GetThongKeSoSanh(
                tuNgay1, denNgay1, tuNgay2, denNgay2);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ ĐƠN HÀNG
    // ================================================================

    [HttpGet("don-hang/get-all")]
    public async Task<ActionResult<List<DonHangAdminResponse>>> GetAllDonHang()
    {
        try
        {
            var result = await _adminBusiness.GetAllDonHang();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/{id}")]
    public async Task<ActionResult<DonHangResponse>> GetDonHangById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetDonHangById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("don-hang/{id}/update/trang-thai")]
    public async Task<ActionResult> CapNhatTrangThaiDonHang(int id, [FromBody] CapNhatTrangThaiDonHangRequest request)
    {
        try
        {
            var success = await _adminBusiness.CapNhatTrangThaiDonHang(id, request);
            if (!success)
                return BadRequest(new { message = "Cập nhật thất bại" });
            
            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("don-hang/{id}/delete")]
    public async Task<ActionResult> XoaDonHang(int id)
    {
        try
        {
            var success = await _adminBusiness.XoaDonHang(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại" });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/tim-kiem")]
    public async Task<ActionResult<List<DonHangAdminResponse>>> TimKiemDonHang(
        [FromQuery] string? keyword = null,
        [FromQuery] byte? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] decimal? tuGia = null,
        [FromQuery] decimal? denGia = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemDonHang(
                keyword, trangThai, tuNgay, denNgay, tuGia, denGia, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/tim-kiem-nang-cao")]
    public async Task<ActionResult<TimKiemDonHangResponse>> TimKiemDonHangNangCao(
        [FromQuery] TimKiemDonHangRequest request)
    {
        try
        {
            var result = await _adminBusiness.TimKiemDonHangNangCao(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("don-hang/sap-xep")]
    public async Task<ActionResult<List<DonHangAdminResponse>>> SapXepDonHang(
        [FromQuery] string sapXepTheo = "ngaydat",
        [FromQuery] string thuTu = "desc")
    {
        try
        {
            var result = await _adminBusiness.SapXepDonHang(sapXepTheo, thuTu);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ KHÁCH HÀNG
    // ================================================================

    [HttpGet("khach-hang/get-all")]
    public async Task<ActionResult<List<ThongTinKhachHangResponse>>> GetAllKhachHang()
    {
        try
        {
            var result = await _adminBusiness.GetAllKhachHang();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("khach-hang/{id}")]
    public async Task<ActionResult<ThongTinKhachHangResponse>> GetKhachHangById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetKhachHangById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("khach-hang/{id}/don-hang")]
    public async Task<ActionResult<List<DonHangResponse>>> GetDonHangCuaKhachHang(int id)
    {
        try
        {
            var result = await _adminBusiness.GetDonHangCuaKhachHang(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("khach-hang/{id}/update/khoa")]
    public async Task<ActionResult> KhoaKhachHang(int id)
    {
        try
        {
            var success = await _adminBusiness.KhoaKhachHang(id);
            if (!success)
                return BadRequest(new { message = "Khóa thất bại" });
            
            return Ok(new { message = "Đã khóa khách hàng" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("khach-hang/{id}/update/mo-khoa")]
    public async Task<ActionResult> MoKhoaKhachHang(int id)
    {
        try
        {
            var success = await _adminBusiness.MoKhoaKhachHang(id);
            if (!success)
                return BadRequest(new { message = "Mở khóa thất bại" });
            
            return Ok(new { message = "Đã mở khóa khách hàng" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("khach-hang/tim-kiem")]
    public async Task<ActionResult<List<ThongTinKhachHangResponse>>> TimKiemKhachHang(
        [FromQuery] string? keyword = null,
        [FromQuery] bool? trangThai = null,
        [FromQuery] decimal? tuChiTieu = null,
        [FromQuery] decimal? denChiTieu = null,
        [FromQuery] int? tuSoDonHang = null,
        [FromQuery] int? denSoDonHang = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemKhachHang(
                keyword, trangThai, tuChiTieu, denChiTieu, 
                tuSoDonHang, denSoDonHang, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("khach-hang/loc-theo-hoat-dong")]
    public async Task<ActionResult<List<ThongTinKhachHangResponse>>> LocKhachHangTheoHoatDong(
        [FromQuery] string loai)
    {
        try
        {
            var result = await _adminBusiness.LocKhachHangTheoHoatDong(loai);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ HỌA SĨ
    // ================================================================

    [HttpPost("hoa-si/create")]
    public async Task<ActionResult<TaoTaiKhoanHoaSiResponse>> TaoTaiKhoanHoaSi([FromBody] TaoTaiKhoanHoaSiRequest request)
    {
        try
        {
            var result = await _adminBusiness.TaoTaiKhoanHoaSi(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/get-all")]
    public async Task<ActionResult<List<HoSoHoaSiResponse>>> GetAllHoaSi()
    {
        try
        {
            var result = await _adminBusiness.GetAllHoaSi();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/{id}")]
    public async Task<ActionResult<HoSoHoaSiResponse>> GetHoaSiById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetHoaSiById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy họa sĩ" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/{id}/tac-pham")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> GetTacPhamCuaHoaSi(int id)
    {
        try
        {
            var result = await _adminBusiness.GetTacPhamCuaHoaSi(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("hoa-si/{id}/update/khoa")]
    public async Task<ActionResult> KhoaHoaSi(int id)
    {
        try
        {
            var success = await _adminBusiness.KhoaHoaSi(id);
            if (!success)
                return BadRequest(new { message = "Khóa thất bại" });
            
            return Ok(new { message = "Đã khóa họa sĩ" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("hoa-si/{id}/update/mo-khoa")]
    public async Task<ActionResult> MoKhoaHoaSi(int id)
    {
        try
        {
            var success = await _adminBusiness.MoKhoaHoaSi(id);
            if (!success)
                return BadRequest(new { message = "Mở khóa thất bại" });
            
            return Ok(new { message = "Đã mở khóa họa sĩ" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/tim-kiem")]
    public async Task<ActionResult<List<HoSoHoaSiResponse>>> TimKiemHoaSi(
        [FromQuery] string? keyword = null,
        [FromQuery] bool? trangThai = null,
        [FromQuery] int? tuSoTacPham = null,
        [FromQuery] int? denSoTacPham = null,
        [FromQuery] decimal? tuDoanhThu = null,
        [FromQuery] decimal? denDoanhThu = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemHoaSi(
                keyword, trangThai, tuSoTacPham, denSoTacPham,
                tuDoanhThu, denDoanhThu, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/xep-hang")]
    public async Task<ActionResult<List<HoaSiXepHangResponse>>> XepHangHoaSi(
        [FromQuery] string tieuChi = "doanhthu",
        [FromQuery] int top = 10)
    {
        try
        {
            var result = await _adminBusiness.XepHangHoaSi(tieuChi, top);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ TÁC PHẨM
    // ================================================================

    [HttpGet("tac-pham/get-all")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> GetAllTacPham([FromQuery] byte? trangThai = null)
    {
        try
        {
            var result = await _adminBusiness.GetAllTacPham(trangThai);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham/{id}/update/duyet")]
    public async Task<ActionResult> DuyetTacPham(int id, [FromBody] DuyetTacPhamRequest request)
    {
        try
        {
            var success = await _adminBusiness.DuyetTacPham(id, request);
            if (!success)
                return BadRequest(new { message = "Duyệt thất bại" });
            
            return Ok(new { message = request.PheDuyet ? "Đã phê duyệt" : "Đã từ chối" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham/{id}/hide")]
    public async Task<ActionResult> HideTacPham(int id)
    {
        try
        {
            var success = await _adminBusiness.HideTacPham(id);
            if (!success)
                return BadRequest(new { message = "Ẩn tác phẩm thất bại" });

            return Ok(new { message = "Đã ẩn tác phẩm" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham/{id}/show")]
    public async Task<ActionResult> ShowTacPham(int id)
    {
        try
        {
            var success = await _adminBusiness.ShowTacPham(id);
            if (!success)
                return BadRequest(new { message = "Mở hiển thị tác phẩm thất bại" });

            return Ok(new { message = "Đã mở hiển thị tác phẩm" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("tac-pham/{id}/delete")]
    public async Task<ActionResult> XoaTacPham(int id)
    {
        try
        {
            var success = await _adminBusiness.XoaTacPham(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại. Tác phẩm có thể không tồn tại." });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
        {
            return BadRequest(new { message = "Không thể xóa tác phẩm này vì nó đang liên quan đến các đơn hàng hoặc dữ liệu khác." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tac-pham/tim-kiem")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> TimKiemTacPham(
        [FromQuery] string? keyword = null,
        [FromQuery] int? maDanhMuc = null,
        [FromQuery] int? maHoaSi = null,
        [FromQuery] byte? trangThai = null,
        [FromQuery] decimal? tuGia = null,
        [FromQuery] decimal? denGia = null,
        [FromQuery] int? tuSoLuong = null,
        [FromQuery] int? denSoLuong = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemTacPham(
                keyword, maDanhMuc, maHoaSi, trangThai,
                tuGia, denGia, tuSoLuong, denSoLuong,
                tuNgay, denNgay, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tac-pham/loc-theo-tieu-chi")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> LocTacPhamTheoTieuChi(
        [FromQuery] string tieuChi)
    {
        try
        {
            var result = await _adminBusiness.LocTacPhamTheoTieuChi(tieuChi);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tac-pham/sap-xep")]
    public async Task<ActionResult<List<TacPhamHoaSiResponse>>> SapXepTacPham(
        [FromQuery] string sapXepTheo = "ngaytao",
        [FromQuery] string thuTu = "desc")
    {
        try
        {
            var result = await _adminBusiness.SapXepTacPham(sapXepTheo, thuTu);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ BÀI VIẾT
    // ================================================================

    [HttpGet("bai-viet/get-all")]
    public async Task<ActionResult<List<BaiVietResponse>>> GetAllBaiViet([FromQuery] byte? trangThai = null)
    {
        try
        {
            var result = await _adminBusiness.GetAllBaiViet(trangThai);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("bai-viet/{id}/update/duyet")]
    public async Task<ActionResult> DuyetBaiViet(int id, [FromBody] DuyetBaiVietRequest request)
    {
        try
        {
            var success = await _adminBusiness.DuyetBaiViet(id, request);
            if (!success)
                return BadRequest(new { message = "Duyệt thất bại" });
            
            return Ok(new { message = request.PheDuyet ? "Đã phê duyệt" : "Đã từ chối" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("bai-viet/{id}/archive")]
    public async Task<ActionResult> ArchiveBaiViet(int id)
    {
        try
        {
            var success = await _adminBusiness.ArchiveBaiViet(id);
            if (!success)
                return BadRequest(new { message = "Lưu trữ bài viết thất bại" });

            return Ok(new { message = "Đã lưu trữ bài viết" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("bai-viet/{id}/delete")]
    public async Task<ActionResult> XoaBaiViet(int id)
    {
        try
        {
            var success = await _adminBusiness.XoaBaiViet(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại" });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
        {
            return BadRequest(new { message = "Không thể xóa bài viết này vì nó đang liên quan đến dữ liệu khác." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bai-viet/tim-kiem")]
    public async Task<ActionResult<List<BaiVietResponse>>> TimKiemBaiViet(
        [FromQuery] string? keyword = null,
        [FromQuery] int? maHoaSi = null,
        [FromQuery] bool? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemBaiViet(
                keyword, maHoaSi, trangThai, tuNgay, denNgay, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ DANH MỤC
    // ================================================================

    [HttpGet("danh-muc/get-all")]
    public async Task<ActionResult<List<DanhMucResponse>>> GetAllDanhMuc()
    {
        try
        {
            var result = await _adminBusiness.GetAllDanhMuc();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("danh-muc/{id}")]
    public async Task<ActionResult<DanhMucResponse>> GetDanhMucById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetDanhMucById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("danh-muc/create")]
    public async Task<ActionResult> TaoDanhMuc([FromBody] TaoDanhMucRequest request)
    {
        try
        {
            var maDanhMuc = await _adminBusiness.TaoDanhMuc(request);
            return Ok(new { message = "Tạo danh mục thành công", maDanhMuc });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("danh-muc/{id}/update")]
    public async Task<ActionResult> CapNhatDanhMuc(int id, [FromBody] CapNhatDanhMucRequest request)
    {
        try
        {
            var success = await _adminBusiness.CapNhatDanhMuc(id, request);
            if (!success)
                return BadRequest(new { message = "Cập nhật thất bại" });
            
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("danh-muc/{id}/delete")]
    public async Task<ActionResult> XoaDanhMuc(int id)
    {
        try
        {
            var success = await _adminBusiness.XoaDanhMuc(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại" });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
        {
            return BadRequest(new { message = "Không thể xóa danh mục này vì vẫn còn tác phẩm thuộc danh mục." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("danh-muc/tim-kiem")]
    public async Task<ActionResult<List<DanhMucResponse>>> TimKiemDanhMuc(
        [FromQuery] string? keyword = null)
    {
        try
        {
            var result = await _adminBusiness.TimKiemDanhMuc(keyword);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ THANH TOÁN
    // ================================================================

    [HttpGet("thanh-toan/get-all")]
    public async Task<ActionResult<List<ThanhToanResponse>>> GetAllThanhToan(
        [FromQuery] string? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null)
    {
        try
        {
            var result = await _adminBusiness.GetAllThanhToan(trangThai, tuNgay, denNgay);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("thanh-toan/{id}")]
    public async Task<ActionResult<ThanhToanResponse>> GetThanhToanById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetThanhToanById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("thanh-toan/{id}/update/xac-nhan")]
    public async Task<ActionResult> XacNhanThanhToan(int id)
    {
        try
        {
            var success = await _adminBusiness.XacNhanThanhToan(id);
            if (!success)
                return BadRequest(new { message = "Xác nhận thất bại" });
            
            return Ok(new { message = "Xác nhận thanh toán thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("thanh-toan/tim-kiem")]
    public async Task<ActionResult<List<ThanhToanResponse>>> TimKiemThanhToan(
        [FromQuery] string? keyword = null,
        [FromQuery] string? phuongThuc = null,
        [FromQuery] string? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] decimal? tuSoTien = null,
        [FromQuery] decimal? denSoTien = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemThanhToan(
                keyword, phuongThuc, trangThai, tuNgay, denNgay,
                tuSoTien, denSoTien, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ HÓA ĐƠN
    // ================================================================

    [HttpGet("hoa-don/get-all")]
    public async Task<ActionResult<List<HoaDonResponse>>> GetAllHoaDon(
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null)
    {
        try
        {
            var result = await _adminBusiness.GetAllHoaDon(tuNgay, denNgay);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-don/{id}")]
    public async Task<ActionResult<HoaDonChiTietResponse>> GetHoaDonById(int id)
    {
        try
        {
            var result = await _adminBusiness.GetHoaDonById(id);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("hoa-don/create/tu-don-hang/{maDonHang}")]
    public async Task<ActionResult> TaoHoaDonTuDonHang(int maDonHang)
    {
        try
        {
            var maHoaDon = await _adminBusiness.TaoHoaDonTuDonHang(maDonHang);
            return Ok(new { message = "Tạo hóa đơn thành công", maHoaDon });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("hoa-don/{id}/update/huy")]
    public async Task<ActionResult> HuyHoaDon(int id, [FromBody] HuyHoaDonRequest request)
    {
        try
        {
            var success = await _adminBusiness.HuyHoaDon(id, request.LyDo);
            if (!success)
                return BadRequest(new { message = "Hủy hóa đơn thất bại" });
            
            return Ok(new { message = "Hủy hóa đơn thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-don/tim-kiem")]
    public async Task<ActionResult<List<HoaDonResponse>>> TimKiemHoaDon(
        [FromQuery] string? keyword = null,
        [FromQuery] string? trangThai = null,
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null,
        [FromQuery] decimal? tuSoTien = null,
        [FromQuery] decimal? denSoTien = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _adminBusiness.TimKiemHoaDon(
                keyword, trangThai, tuNgay, denNgay,
                tuSoTien, denSoTien, pageNumber, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ NỘI DUNG
    // ================================================================

    [HttpGet("noi-dung/get-all")]
    public async Task<ActionResult<List<NoiDungResponse>>> GetAllNoiDung(
        [FromQuery] string? loai = null)
    {
        try
        {
            var result = await _adminBusiness.GetAllNoiDung(loai);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPost("noi-dung/create")]
    public async Task<ActionResult> TaoNoiDung([FromBody] TaoNoiDungRequest request)
    {
        try
        {
            var maNoiDung = await _adminBusiness.TaoNoiDung(request);
            return Ok(new { message = "Tạo nội dung thành công", maNoiDung });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("noi-dung/{id}/update")]
    public async Task<ActionResult> CapNhatNoiDung(int id, [FromBody] CapNhatNoiDungRequest request)
    {
        try
        {
            var success = await _adminBusiness.CapNhatNoiDung(id, request);
            if (!success)
                return BadRequest(new { message = "Cập nhật thất bại" });
            
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpDelete("noi-dung/{id}/delete")]
    public async Task<ActionResult> XoaNoiDung(int id)
    {
        try
        {
            var success = await _adminBusiness.XoaNoiDung(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại" });
            
            return Ok(new { message = "Xóa thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // BÁO CÁO & THỐNG KÊ NÂNG CAO
    // ================================================================

    [HttpGet("bao-cao/doanh-thu-theo-thang")]
    public async Task<ActionResult<List<DoanhThuTheoThangResponse>>> GetDoanhThuTheoThang(
        [FromQuery] int nam = 2026)
    {
        try
        {
            var result = await _adminBusiness.GetDoanhThuTheoThang(nam);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bao-cao/doanh-thu-theo-hoa-si")]
    public async Task<ActionResult<List<DoanhThuTheoHoaSiResponse>>> GetDoanhThuTheoHoaSi(
        [FromQuery] DateTime? tuNgay = null,
        [FromQuery] DateTime? denNgay = null)
    {
        try
        {
            var result = await _adminBusiness.GetDoanhThuTheoHoaSi(tuNgay, denNgay);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bao-cao/tac-pham-ban-chay")]
    public async Task<ActionResult<List<TacPhamBanChayResponse>>> GetTacPhamBanChay(
        [FromQuery] int top = 10)
    {
        try
        {
            var result = await _adminBusiness.GetTacPhamBanChay(top);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bao-cao/khach-hang-tiem-nang")]
    public async Task<ActionResult<List<KhachHangTiemNangResponse>>> GetKhachHangTiemNang(
        [FromQuery] int top = 10)
    {
        try
        {
            var result = await _adminBusiness.GetKhachHangTiemNang(top);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bao-cao/thong-ke-trang-thai-don-hang")]
    public async Task<ActionResult<ThongKeTrangThaiDonHangResponse>> GetThongKeTrangThaiDonHang()
    {
        try
        {
            var result = await _adminBusiness.GetThongKeTrangThaiDonHang();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // TÌM KIẾM & XUẤT BÁO CÁO
    // ================================================================

    [HttpGet("tim-kiem")]
    public async Task<ActionResult<TimKiemTongHopResponse>> TimKiemTongHop(
        [FromQuery] string keyword)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "Từ khóa tìm kiếm không được rỗng" });

            var result = await _adminBusiness.TimKiemTongHop(keyword);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("xuat-bao-cao/doanh-thu")]
    public async Task<ActionResult> XuatBaoCaoDoanhThu(
        [FromQuery] DateTime tuNgay,
        [FromQuery] DateTime denNgay,
        [FromQuery] string format = "excel")
    {
        try
        {
            var fileBytes = await _adminBusiness.XuatBaoCaoDoanhThu(tuNgay, denNgay, format);
            var fileName = $"BaoCaoDoanhThu_{tuNgay:yyyyMMdd}_{denNgay:yyyyMMdd}.{format}";
            
            var contentType = format.ToLower() switch
            {
                "pdf" => "application/pdf",
                "csv" => "text/csv",
                _ => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };

            return File(fileBytes, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("xuat-bao-cao/don-hang")]
    public async Task<ActionResult> XuatBaoCaoDonHang(
        [FromQuery] DateTime tuNgay,
        [FromQuery] DateTime denNgay,
        [FromQuery] string format = "excel")
    {
        try
        {
            var fileBytes = await _adminBusiness.XuatBaoCaoDonHang(tuNgay, denNgay, format);
            var fileName = $"BaoCaoDonHang_{tuNgay:yyyyMMdd}_{denNgay:yyyyMMdd}.{format}";
            
            var contentType = format.ToLower() switch
            {
                "pdf" => "application/pdf",
                "csv" => "text/csv",
                _ => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };

            return File(fileBytes, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // ================================================================
    // QUẢN LÝ TÁC PHẨM CHỈNH SỬA
    // ================================================================

    [HttpGet("tac-pham-chinh-sua")]
    public async Task<ActionResult<List<TacPhamChinhSuaResponse>>> GetAllTacPhamChinhSua()
    {
        try
        {
            var result = await _adminBusiness.GetAllTacPhamChinhSua();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpPut("tac-pham-chinh-sua/{maChinhSua}/duyet")]
    public async Task<ActionResult> DuyetTacPhamChinhSua(int maChinhSua, [FromBody] DuyetTacPhamChinhSuaRequest request)
    {
        try
        {
            var success = await _adminBusiness.DuyetTacPhamChinhSua(maChinhSua, request);
            if (!success)
                return BadRequest(new { message = "Duyệt thất bại" });
            
            return Ok(new { message = request.PheDuyet ? "Đã phê duyệt chỉnh sửa" : "Đã từ chối chỉnh sửa" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}
