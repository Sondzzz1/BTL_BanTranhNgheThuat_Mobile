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
    private readonly ITaiKhoanRepository _taiKhoanRepo;

    public PublicController(
        ITacPhamRepository tacPhamRepo,
        IHoaSiRepository hoaSiRepo,
        IDanhMucRepository danhMucRepo,
        IBaiVietRepository baiVietRepo,
        ITaiKhoanRepository taiKhoanRepo)
    {
        _tacPhamRepo = tacPhamRepo;
        _hoaSiRepo = hoaSiRepo;
        _danhMucRepo = danhMucRepo;
        _baiVietRepo = baiVietRepo;
        _taiKhoanRepo = taiKhoanRepo;
    }

    // Xem tranh
    [HttpGet("tranh")]
    public async Task<ActionResult<List<TacPhamResponse>>> GetAllTranh([FromQuery] string? keyword = null)
    {
        try
        {
            var tacPhamList = await _tacPhamRepo.GetMarketplaceAll();
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
                    SoLuongBanDau = x.TacPham.SoLuongBanDau,
                    LaTacPhamDocBan = x.TacPham.LaTacPhamDocBan,
                    MoTa = x.TacPham.MoTa,
                    HinhAnh = x.TacPham.HinhAnh,
                    KichThuoc = x.TacPham.KichThuoc,
                    ChatLieu = x.TacPham.ChatLieu,
                    ChatLieuKhung = x.TacPham.ChatLieuKhung,
                    LoaiTacPham = x.TacPham.LoaiTacPham,
                    TacGiaGoc = x.TacPham.TacGiaGoc,
                    MaTacPhamGoc = x.TacPham.MaTacPhamGoc,
                    MaYeuCauVeTranh = x.TacPham.MaYeuCauVeTranh,
                    MoTaNguonGoc = x.TacPham.MoTaNguonGoc
                })
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("tranh/ban-chay")]
    public async Task<ActionResult<List<TacPhamResponse>>> GetTranhBanChay([FromQuery] int top = 6)
    {
        try
        {
            var tacPhamList = await _tacPhamRepo.GetMarketplaceBestSelling(Math.Clamp(top, 1, 20));
            var hoaSiMap = (await _hoaSiRepo.GetAll()).ToDictionary(h => h.MaHoaSi, h => h.TenHoaSi);
            var danhMucMap = (await _danhMucRepo.GetAll()).ToDictionary(d => d.MaDanhMuc, d => d.TenDanhMuc);

            var result = tacPhamList.Select(tp => new TacPhamResponse
            {
                MaTacPham = tp.MaTacPham,
                TenTacPham = tp.TenTacPham,
                TenHoaSi = hoaSiMap.GetValueOrDefault(tp.MaHoaSi, ""),
                TenDanhMuc = tp.MaDanhMuc.HasValue ? danhMucMap.GetValueOrDefault(tp.MaDanhMuc.Value) : null,
                Gia = tp.Gia,
                SoLuong = tp.SoLuong,
                SoLuongBanDau = tp.SoLuongBanDau,
                LaTacPhamDocBan = tp.LaTacPhamDocBan,
                MoTa = tp.MoTa,
                HinhAnh = tp.HinhAnh,
                KichThuoc = tp.KichThuoc,
                ChatLieu = tp.ChatLieu,
                ChatLieuKhung = tp.ChatLieuKhung,
                LoaiTacPham = tp.LoaiTacPham,
                TacGiaGoc = tp.TacGiaGoc,
                MaTacPhamGoc = tp.MaTacPhamGoc,
                MaYeuCauVeTranh = tp.MaYeuCauVeTranh,
                MoTaNguonGoc = tp.MoTaNguonGoc
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải danh sách tranh bán chạy", error = ex.Message });
        }
    }

    [HttpGet("tranh/{id}")]
    public async Task<ActionResult<TacPhamResponse>> GetTranhById(int id)
    {
        try
        {
            var tacPham = await _tacPhamRepo.GetMarketplaceById(id);
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
                SoLuongBanDau = tacPham.SoLuongBanDau,
                LaTacPhamDocBan = tacPham.LaTacPhamDocBan,
                MoTa = tacPham.MoTa,
                HinhAnh = tacPham.HinhAnh,
                KichThuoc = tacPham.KichThuoc,
                ChatLieu = tacPham.ChatLieu,
                ChatLieuKhung = tacPham.ChatLieuKhung,
                LoaiTacPham = tacPham.LoaiTacPham,
                TacGiaGoc = tacPham.TacGiaGoc,
                MaTacPhamGoc = tacPham.MaTacPhamGoc,
                MaYeuCauVeTranh = tacPham.MaYeuCauVeTranh,
                MoTaNguonGoc = tacPham.MoTaNguonGoc
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
            var tacPham = await _tacPhamRepo.GetMarketplaceById(id);
            if (tacPham == null)
                return NotFound(new { message = "Không tìm thấy tác phẩm" });
            if (tacPham.TrangThai != 1)
                return NotFound(new { message = "Tác phẩm không khả dụng" });

            // Lấy tất cả tác phẩm đang bán (trừ tác phẩm hiện tại)
            var allTacPham = await _tacPhamRepo.GetMarketplaceAll();
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
                    SoLuongBanDau = x.TacPham.SoLuongBanDau,
                    LaTacPhamDocBan = x.TacPham.LaTacPhamDocBan,
                    MoTa = x.TacPham.MoTa,
                    HinhAnh = x.TacPham.HinhAnh,
                    KichThuoc = x.TacPham.KichThuoc,
                    ChatLieu = x.TacPham.ChatLieu,
                    ChatLieuKhung = x.TacPham.ChatLieuKhung,
                    LoaiTacPham = x.TacPham.LoaiTacPham,
                    TacGiaGoc = x.TacPham.TacGiaGoc,
                    MaTacPhamGoc = x.TacPham.MaTacPhamGoc,
                    MaYeuCauVeTranh = x.TacPham.MaYeuCauVeTranh,
                    MoTaNguonGoc = x.TacPham.MoTaNguonGoc
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
                var tacPhamList = await _tacPhamRepo.GetMarketplaceByArtist(hoaSi.MaHoaSi);
                
                result.Add(new HoaSiPublicResponse
                {
                    MaHoaSi = hoaSi.MaHoaSi,
                    TenHoaSi = hoaSi.TenHoaSi,
                    TieuSu = hoaSi.TieuSu,
                    AnhDaiDien = hoaSi.AnhDaiDien,
                    SoTacPham = tacPhamList.Count(x => x.TrangThai == 1)
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

            var tacPhamList = await _tacPhamRepo.GetMarketplaceByArtist(hoaSi.MaHoaSi);
            
            // Lấy danh sách tác phẩm đã được duyệt và công khai (TrangThai = 1)
            var cacTacPham = new List<TacPhamCongKhaiResponse>();
            foreach (var tp in tacPhamList.Where(x => x.TrangThai == 1).OrderByDescending(x => x.NgayTao))
            {
                string? tenDanhMuc = null;
                if (tp.MaDanhMuc.HasValue)
                {
                    var dm = await _danhMucRepo.GetById(tp.MaDanhMuc.Value);
                    tenDanhMuc = dm?.TenDanhMuc;
                }

                cacTacPham.Add(new TacPhamCongKhaiResponse
                {
                    MaTacPham = tp.MaTacPham,
                    TenTacPham = tp.TenTacPham,
                    TenDanhMuc = tenDanhMuc,
                    Gia = tp.Gia,
                    HinhAnh = tp.HinhAnh,
                    KichThuoc = tp.KichThuoc,
                    ChatLieu = tp.ChatLieu,
                    TrangThai = tp.SoLuong > 0 ? "available" : "sold"
                });
            }

            var result = new HoaSiPublicResponse
            {
                MaHoaSi = hoaSi.MaHoaSi,
                TenHoaSi = hoaSi.TenHoaSi,
                TieuSu = hoaSi.TieuSu,
                AnhDaiDien = hoaSi.AnhDaiDien,
                Email = hoaSi.Email,
                SoDienThoai = hoaSi.DienThoai,
                DiaChi = hoaSi.DiaChi,
                Website = null,
                SoTacPham = cacTacPham.Count,
                CacTacPham = cacTacPham
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
    public async Task<ActionResult<PagedBaiVietResponse>> GetAllBaiViet([FromQuery] string? keyword=null,[FromQuery] int? maDanhMuc=null,[FromQuery] int page=1,[FromQuery] int pageSize=10)
    {
        try
        {
            page=Math.Max(1,page);pageSize=Math.Clamp(pageSize,1,50);
            var data=await _baiVietRepo.GetPublished(keyword,maDanhMuc,page,pageSize);
            var result=new List<BaiVietResponse>();
            foreach(var item in data.Items)result.Add(await MapPublicArticle(item,false));
            return Ok(new PagedBaiVietResponse{Items=result,Total=data.Total,Page=page,PageSize=pageSize});
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bai-viet/{id:int}")]
    public async Task<ActionResult<BaiVietResponse>> GetBaiVietById(int id)
    {
        try
        {
            var baiViet = await _baiVietRepo.GetPublishedById(id);
            if (baiViet == null)
                return NotFound(new { message = "Không tìm thấy bài viết" });
            return Ok(await MapPublicArticle(baiViet,true));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    [HttpGet("bai-viet/danh-muc")]
    public async Task<ActionResult<List<DanhMucBaiVietResponse>>> GetDanhMucBaiViet() => Ok((await _baiVietRepo.GetCategories()).Select(x=>new DanhMucBaiVietResponse{MaDanhMucBaiViet=x.MaDanhMucBaiViet,TenDanhMuc=x.TenDanhMuc,Slug=x.Slug}));

    [HttpGet("bai-viet/{id:int}/lien-quan")]
    public async Task<ActionResult<List<BaiVietResponse>>> GetBaiVietLienQuan(int id)
    {
        var current=await _baiVietRepo.GetPublishedById(id);if(current==null)return NotFound();
        var data=await _baiVietRepo.GetPublished(null,current.MaDanhMucBaiViet,1,6);
        var result=new List<BaiVietResponse>();foreach(var item in data.Items.Where(x=>x.MaBaiViet!=id).Take(5))result.Add(await MapPublicArticle(item,false));return Ok(result);
    }

    private async Task<BaiVietResponse> MapPublicArticle(BaiViet item,bool includeRelations)
    {
        string author="";
        if(item.MaHoaSi.HasValue)author=(await _hoaSiRepo.GetById(item.MaHoaSi.Value))?.TenHoaSi??"";
        if(string.IsNullOrWhiteSpace(author)&&item.MaTaiKhoanTacGia.HasValue)author=(await _taiKhoanRepo.GetById(item.MaTaiKhoanTacGia.Value))?.TenDangNhap??"";
        var category=(await _baiVietRepo.GetCategories()).FirstOrDefault(x=>x.MaDanhMucBaiViet==item.MaDanhMucBaiViet)?.TenDanhMuc;
        var response=new BaiVietResponse{MaBaiViet=item.MaBaiViet,TieuDe=item.TieuDe,NoiDung=item.NoiDung,TomTat=item.TomTat,AnhTieuDe=item.AnhTieuDe,MaHoaSi=item.MaHoaSi,MaTaiKhoanTacGia=item.MaTaiKhoanTacGia,TenHoaSi=author,TenTacGia=author,NgayDang=item.NgayDang,NgayXuatBan=item.NgayXuatBan,NgayCapNhat=item.NgayCapNhat,TrangThai=2,MaDanhMucBaiViet=item.MaDanhMucBaiViet,TenDanhMuc=category,NgayBatDauSuKien=item.NgayBatDauSuKien,NgayKetThucSuKien=item.NgayKetThucSuKien,DiaDiemSuKien=item.DiaDiemSuKien,NguonNoiDung=item.NguonNoiDung};
        if(includeRelations)
        {
            response.HinhAnhNoiDung=(await _baiVietRepo.GetImages(item.MaBaiViet)).Select(x=>new HinhAnhBaiVietResponse{MaHinhAnh=x.MaHinhAnh,DuongDan=x.DuongDan,ChuThich=x.ChuThich,ThuTu=x.ThuTu}).ToList();
            foreach(var art in await _baiVietRepo.GetPublicLinkedArtworks(item.MaBaiViet))response.TacPhamLienQuan.Add(new TacPhamLienKetResponse{MaTacPham=art.MaTacPham,TenTacPham=art.TenTacPham,HinhAnh=art.HinhAnh,Gia=art.Gia,TenHoaSi=(await _hoaSiRepo.GetById(art.MaHoaSi))?.TenHoaSi??""});
        }
        return response;
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
    public int? SoLuongBanDau { get; set; }
    public bool LaTacPhamDocBan { get; set; }
    public string? MoTa { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string? ChatLieuKhung { get; set; }
    public byte LoaiTacPham { get; set; }
    public string? TacGiaGoc { get; set; }
    public int? MaTacPhamGoc { get; set; }
    public int? MaYeuCauVeTranh { get; set; }
    public string? MoTaNguonGoc { get; set; }
}

public class TacPhamCongKhaiResponse
{
    public int MaTacPham { get; set; }
    public string TenTacPham { get; set; } = null!;
    public string? TenDanhMuc { get; set; }
    public decimal Gia { get; set; }
    public string? HinhAnh { get; set; }
    public string? KichThuoc { get; set; }
    public string? ChatLieu { get; set; }
    public string TrangThai { get; set; } = null!; // "available" hoặc "sold"
}
public class HoaSiPublicResponse
{
    public int MaHoaSi { get; set; }
    public string TenHoaSi { get; set; } = null!;
    public string? TieuSu { get; set; }
    public string? AnhDaiDien { get; set; }
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
    public string? DiaChi { get; set; }
    public string? Website { get; set; }
    public int SoTacPham { get; set; }
    public List<TacPhamCongKhaiResponse>? CacTacPham { get; set; }
}

public class DanhMucResponse
{
    public int MaDanhMuc { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string? MoTa { get; set; }
}
