using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YeuThichController : ControllerBase
{
    private readonly IYeuThichRepository _yeuThichRepo;
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly IDanhMucRepository _danhMucRepo;
    private readonly INguoiDungRepository _nguoiDungRepo;

    public YeuThichController(
        IYeuThichRepository yeuThichRepo,
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        IDanhMucRepository danhMucRepo,
        INguoiDungRepository nguoiDungRepo)
    {
        _yeuThichRepo = yeuThichRepo;
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _danhMucRepo = danhMucRepo;
        _nguoiDungRepo = nguoiDungRepo;
    }

    private async Task<int> GetCurrentUserId()
    {
        // Thử lấy MaNguoiDung trực tiếp từ claim
        var userIdClaim = User.FindFirst("MaNguoiDung")?.Value;
        
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int maNguoiDung))
        {
            return maNguoiDung;
        }

        // Nếu không có, lấy MaTaiKhoan và tìm MaNguoiDung từ database
        var maTaiKhoanClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(maTaiKhoanClaim) && int.TryParse(maTaiKhoanClaim, out int maTaiKhoan))
        {
            var allUsers = await _nguoiDungRepo.GetAll();
            var nguoiDung = allUsers.FirstOrDefault(u => u.MaTaiKhoan == maTaiKhoan);
            
            if (nguoiDung != null)
            {
                return nguoiDung.MaNguoiDung;
            }
        }

        throw new UnauthorizedAccessException("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    }

    [HttpGet("test")]
    public async Task<IActionResult> Test()
    {
        try
        {
            var userId = await GetCurrentUserId();
            return Ok(new { 
                message = "Test thành công", 
                maNguoiDung = userId,
                claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi", error = ex.Message });
        }
    }

    // GET: api/yeuthich - Lấy danh sách yêu thích
    [HttpGet]
    public async Task<IActionResult> GetDanhSachYeuThich()
    {
        try
        {
            var maNguoiDung = await GetCurrentUserId();
            var danhSach = await _yeuThichRepo.GetByNguoiDung(maNguoiDung);

            // Load thông tin tác phẩm
            var result = new List<YeuThichResponse>();
            foreach (var yt in danhSach)
            {
                var tacPham = await _tacPhamRepo.GetById(yt.MaTacPham);
                if (tacPham == null) continue;

                var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);
                string? tenDanhMuc = null;
                if (tacPham.MaDanhMuc.HasValue)
                {
                    var danhMuc = await _danhMucRepo.GetById(tacPham.MaDanhMuc.Value);
                    tenDanhMuc = danhMuc?.TenDanhMuc;
                }

                result.Add(new YeuThichResponse
                {
                    MaYeuThich = yt.MaYeuThich,
                    NgayThem = yt.NgayThem,
                    GhiChu = yt.GhiChu,
                    TacPham = new TacPhamInYeuThich
                    {
                        MaTacPham = tacPham.MaTacPham,
                        TenTacPham = tacPham.TenTacPham,
                        TenHoaSi = hoaSi?.TenHoaSi ?? "",
                        TenDanhMuc = tenDanhMuc,
                        Gia = tacPham.Gia,
                        SoLuong = tacPham.SoLuong,
                        HinhAnh = tacPham.HinhAnh,
                        TrangThai = tacPham.TrangThai
                    }
                });
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // POST: api/yeuthich/{maTacPham} - Thêm vào yêu thích
    [HttpPost("{maTacPham}")]
    public async Task<IActionResult> ThemYeuThich(int maTacPham, [FromBody] ThemYeuThichRequest? request)
    {
        try
        {
            var maNguoiDung = await GetCurrentUserId();

            // Kiểm tra tác phẩm tồn tại
            var tacPham = await _tacPhamRepo.GetById(maTacPham);
            if (tacPham == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });

            // Kiểm tra đã tồn tại chưa
            var exists = await _yeuThichRepo.Exists(maNguoiDung, maTacPham);
            if (exists)
                return BadRequest(new { message = "Tác phẩm đã có trong danh sách yêu thích" });

            var yeuThich = new YeuThich
            {
                MaNguoiDung = maNguoiDung,
                MaTacPham = maTacPham,
                NgayThem = DateTime.Now,
                GhiChu = request?.GhiChu
            };

            await _yeuThichRepo.Add(yeuThich);

            return Ok(new { 
                message = "Đã thêm vào yêu thích", 
                maYeuThich = yeuThich.MaYeuThich 
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // DELETE: api/yeuthich/{maTacPham} - Xóa khỏi yêu thích
    [HttpDelete("{maTacPham}")]
    public async Task<IActionResult> XoaYeuThich(int maTacPham)
    {
        try
        {
            var maNguoiDung = await GetCurrentUserId();

            var deleted = await _yeuThichRepo.Delete(maNguoiDung, maTacPham);
            if (!deleted)
                return NotFound(new { message = "Không tìm thấy trong danh sách yêu thích" });

            return Ok(new { message = "Đã xóa khỏi yêu thích" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // GET: api/yeuthich/kiem-tra/{maTacPham} - Kiểm tra đã yêu thích chưa
    [HttpGet("kiem-tra/{maTacPham}")]
    public async Task<IActionResult> KiemTraYeuThich(int maTacPham)
    {
        try
        {
            var maNguoiDung = await GetCurrentUserId();
            var exists = await _yeuThichRepo.Exists(maNguoiDung, maTacPham);

            return Ok(new { isLiked = exists });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}

// DTOs
public class YeuThichResponse
{
    public int MaYeuThich { get; set; }
    public DateTime NgayThem { get; set; }
    public string? GhiChu { get; set; }
    public TacPhamInYeuThich TacPham { get; set; } = null!;
}

public class TacPhamInYeuThich
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? HinhAnh { get; set; }
    public byte TrangThai { get; set; }
}

public class ThemYeuThichRequest
{
    public string? GhiChu { get; set; }
}
