using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api")]
public class PublicController : ControllerBase
{
    private readonly ITacPhamRepository _tacPhamRepo;
    private readonly IHoaSiRepository _hoaSiRepo;
    private readonly IDanhMucRepository _danhMucRepo;
    private readonly IBaiVietRepository _baiVietRepo;

    public PublicController(
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        IDanhMucRepository danhMucRepo,
        IBaiVietRepository baiVietRepo)
    {
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _danhMucRepo = danhMucRepo;
        _baiVietRepo = baiVietRepo;
    }

    // Xem tranh
    [HttpGet("tranh")]
    public async Task<ActionResult<List<TacPhamResponse>>> GetAllTranh([FromQuery] string? keyword = null)
    {
        try
        {
            var tacPhamList = await _tacPhamRepo.GetAll();
            // Preload họa sĩ và danh mục để tránh N+1
            var hoaSiList = await _hoaSiRepo.GetAll();
            var hoaSiMap = hoaSiList.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);
            var danhMucList = await _danhMucRepo.GetAll();
            var danhMucMap = danhMucList.ToDictionary(d => d.MaDanhMuc, d => d.TenDanhMuc);

            var result = tacPhamList
                .Where(tp => tp.TrangThai == 1)
                .Select(tp => new
                {
                    TacPham = tp,
                    TenHoaSi = hoaSiMap.TryGetValue(tp.MaHoaSi, out var ten) ? ten : "",
                    TenDanhMuc = tp.MaDanhMuc.HasValue && danhMucMap.TryGetValue(tp.MaDanhMuc.Value, out var dm) ? dm : null
                })
                .Where(x => string.IsNullOrEmpty(keyword) || 
                           x.TacPham.TenTacPham.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                           x.TenHoaSi.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                           (x.TenDanhMuc != null && x.TenDanhMuc.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
                .Select(x => new TacPhamResponse
                {
                    MaTacPham = x.TacPham.MaTacPham,
                    TenTacPham = x.TacPham.TenTacPham,
                    TenHoaSi = x.TenHoaSi,
                    TenDanhMuc = x.TenDanhMuc,
                    Gia = x.TacPham.Gia,
                    SoLuong = x.TacPham.SoLuong,
                    MoTa = x.TacPham.MoTa,
                    HinhAnh = x.TacPham.HinhAnh,
                    KichThuoc = x.TacPham.KichThuoc,
                    ChatLieu = x.TacPham.ChatLieu,
                    ChatLieuKhung = x.TacPham.ChatLieuKhung
                })
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tranh/{id}")]
    public async Task<ActionResult<TacPhamResponse>> GetTranhById(int id)
    {
        try
        {
            var tacPham = await _tacPhamRepo.GetById(id);
            if (tacPham == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            if (tacPham.TrangThai != 1) // Chỉ Approved mới khả dụng
                return NotFound(new { message = "Tác phẩm không khả dụng" });

            var hoaSi = await _hoaSiRepo.GetById(tacPham.MaHoaSi);
            string? tenDanhMuc = null;
            if (tacPham.MaDanhMuc.HasValue)
            {
                var danhMuc = await _danhMucRepo.GetById(tacPham.MaDanhMuc.Value);
                tenDanhMuc = danhMuc?.TenDanhMuc;
            }

            var result = new TacPhamResponse
            {
                MaTacPham = tacPham.MaTacPham,
                TenTacPham = tacPham.TenTacPham,
                TenHoaSi = hoaSi?.TenHoaSi ?? "",
                TenDanhMuc = tenDanhMuc,
                Gia = tacPham.Gia,
                SoLuong = tacPham.SoLuong,
                MoTa = tacPham.MoTa,
                HinhAnh = tacPham.HinhAnh,
                KichThuoc = tacPham.KichThuoc,
                ChatLieu = tacPham.ChatLieu,
                ChatLieuKhung = tacPham.ChatLieuKhung
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // API gợi ý tác phẩm tương tự
    [HttpGet("tranh/{id}/goi-y")]
    public async Task<ActionResult<List<TacPhamResponse>>> GetTranhGoiY(int id)
    {
        try
        {
            var tacPham = await _tacPhamRepo.GetById(id);
            if (tacPham == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });

            // Lấy tất cả tác phẩm đang bán (trừ tác phẩm hiện tại)
            var allTacPham = await _tacPhamRepo.GetAll();
            var hoaSiList = await _hoaSiRepo.GetAll();
            var hoaSiMap = hoaSiList.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);
            var danhMucList = await _danhMucRepo.GetAll();
            var danhMucMap = danhMucList.ToDictionary(d => d.MaDanhMuc, d => d.TenDanhMuc);

            // Tính điểm gợi ý cho mỗi tác phẩm
            var recommendations = allTacPham
                .Where(tp => tp.MaTacPham != id && tp.TrangThai == 1 && tp.SoLuong > 0)
                .Select(tp => new
                {
                    TacPham = tp,
                    Score = CalculateRecommendationScore(tacPham, tp)
                })
                .OrderByDescending(x => x.Score)
                .Take(8)
                .Select(x => new TacPhamResponse
                {
                    MaTacPham = x.TacPham.MaTacPham,
                    TenTacPham = x.TacPham.TenTacPham,
                    TenHoaSi = hoaSiMap.TryGetValue(x.TacPham.MaHoaSi, out var ten) ? ten : "",
                    TenDanhMuc = x.TacPham.MaDanhMuc.HasValue && danhMucMap.TryGetValue(x.TacPham.MaDanhMuc.Value, out var dm) ? dm : null,
                    Gia = x.TacPham.Gia,
                    SoLuong = x.TacPham.SoLuong,
                    MoTa = x.TacPham.MoTa,
                    HinhAnh = x.TacPham.HinhAnh,
                    KichThuoc = x.TacPham.KichThuoc,
                    ChatLieu = x.TacPham.ChatLieu,
                    ChatLieuKhung = x.TacPham.ChatLieuKhung
                })
                .ToList();

            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Hàm tính điểm gợi ý
    private int CalculateRecommendationScore(TacPham current, TacPham candidate)
    {
        int score = 0;

        // Cùng danh mục: +3 điểm
        if (current.MaDanhMuc.HasValue && candidate.MaDanhMuc.HasValue && 
            current.MaDanhMuc == candidate.MaDanhMuc)
        {
            score += 3;
        }

        // Cùng họa sĩ: +2 điểm
        if (current.MaHoaSi == candidate.MaHoaSi)
        {
            score += 2;
        }

        // Giá tương đương (±30%): +1 điểm
        var priceDiff = Math.Abs(candidate.Gia - current.Gia);
        var priceThreshold = current.Gia * 0.3m;
        if (priceDiff <= priceThreshold)
        {
            score += 1;
        }

        return score;
    }

    // Xem họa sĩ
    [HttpGet("hoa-si")]
    public async Task<ActionResult<List<HoaSiPublicResponse>>> GetAllHoaSi()
    {
        try
        {
            var hoaSiList = await _hoaSiRepo.GetAll();
            var result = new List<HoaSiPublicResponse>();

            foreach (var hoaSi in hoaSiList)
            {
                var tacPhamList = await _tacPhamRepo.GetByHoaSi(hoaSi.MaHoaSi);
                
                result.Add(new HoaSiPublicResponse
                {
                    MaHoaSi = hoaSi.MaHoaSi,
                    TenHoaSi = hoaSi.TenHoaSi,
                    TieuSu = hoaSi.TieuSu,
                    AnhDaiDien = hoaSi.AnhDaiDien,
                    SoTacPham = tacPhamList.Count
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("hoa-si/{id}")]
    public async Task<ActionResult<HoaSiPublicResponse>> GetHoaSiById(int id)
    {
        try
        {
            var hoaSi = await _hoaSiRepo.GetById(id);
            if (hoaSi == null)
                return NotFound(new { message = "Không tìm thấy họa sĩ" });

            var tacPhamList = await _tacPhamRepo.GetByHoaSi(hoaSi.MaHoaSi);

            var result = new HoaSiPublicResponse
            {
                MaHoaSi = hoaSi.MaHoaSi,
                TenHoaSi = hoaSi.TenHoaSi,
                TieuSu = hoaSi.TieuSu,
                AnhDaiDien = hoaSi.AnhDaiDien,
                SoTacPham = tacPhamList.Count
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Xem bài viết
    [HttpGet("bai-viet")]
    public async Task<ActionResult<List<BaiVietResponse>>> GetAllBaiViet()
    {
        try
        {
            var baiVietList = await _baiVietRepo.GetAll();
            var hoaSis = await _hoaSiRepo.GetAll();
            var dictHoaSi = hoaSis.ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);

            var result = baiVietList
                .Where(bv => bv.TrangThai == 2) // Published
                .Select(bv => new BaiVietResponse
                {
                    MaBaiViet = bv.MaBaiViet,
                    TieuDe = bv.TieuDe,
                    NoiDung = bv.NoiDung,
                    MaHoaSi = bv.MaHoaSi,
                    TenHoaSi = dictHoaSi.TryGetValue(bv.MaHoaSi, out var ten) ? ten : "",
                    NgayDang = bv.NgayDang,
                    TrangThai = bv.TrangThai,
                    LyDo = bv.LyDo,
                    AnhTieuDe = bv.AnhTieuDe
                })
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bai-viet/{id}")]
    public async Task<ActionResult<BaiVietResponse>> GetBaiVietById(int id)
    {
        try
        {
            var baiViet = await _baiVietRepo.GetById(id);
            if (baiViet == null)
                return NotFound(new { message = "Không tìm thấy bài viết" });
            if (baiViet.TrangThai != 2)
                return NotFound(new { message = "Bài viết không khả dụng" });

            var hoaSi = await _hoaSiRepo.GetById(baiViet.MaHoaSi);

            var result = new BaiVietResponse
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

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Danh mục
    [HttpGet("danh-muc")]
    public async Task<ActionResult<List<DanhMucResponse>>> GetAllDanhMuc()
    {
        try
        {
            var danhMucList = await _danhMucRepo.GetAll();
            var result = danhMucList.Select(dm => new DanhMucResponse
            {
                MaDanhMuc = dm.MaDanhMuc,
                TenDanhMuc = dm.TenDanhMuc,
                MoTa = dm.MoTa
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}

// Response DTOs
public class TacPhamResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string TenHoaSi { get; set; } = null!;
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
}

public class HoaSiPublicResponse
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public int SoTacPham { get; set; }
}

public class DanhMucResponse
{
    public int MaDanhMuc { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string? MoTa { get; set; }
}
