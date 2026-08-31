using DoAn2_BackEnd.Attributes;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using DoAn2_BackEnd.DTO;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/danh-muc")]
public class DanhMucController : ControllerBase
{
    private readonly IDanhMucRepository _danhMucRepo;

    public DanhMucController(IDanhMucRepository danhMucRepo)
    {
        _danhMucRepo = danhMucRepo;
    }

    // Public - Xem danh mục (đã có trong PublicController)
    
    // Admin only - Tạo danh mục
    [HttpPost]
    [AdminOnly]
    public async Task<ActionResult> TaoDanhMuc([FromBody] TaoDanhMucRequest request)
    {
        try
        {
            var danhMuc = new DanhMuc
            {
                TenDanhMuc = request.TenDanhMuc,
                MoTa = request.MoTa
            };

            var maDanhMuc = await _danhMucRepo.Create(danhMuc);
            return Ok(new { message = "Tạo danh mục thành công", maDanhMuc });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Admin only - Cập nhật danh mục
    [HttpPut("{id}")]
    [AdminOnly]
    public async Task<ActionResult> CapNhatDanhMuc(int id, [FromBody] CapNhatDanhMucRequest request)
    {
        try
        {
            var danhMuc = await _danhMucRepo.GetById(id);
            if (danhMuc == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });

            danhMuc.TenDanhMuc = request.TenDanhMuc;
            danhMuc.MoTa = request.MoTa;

            var success = await _danhMucRepo.Update(danhMuc);
            if (!success)
                return BadRequest(new { message = "Cập nhật thất bại" });

            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    // Admin only - Xóa danh mục
    [HttpDelete("{id}")]
    [AdminOnly]
    public async Task<ActionResult> XoaDanhMuc(int id)
    {
        try
        {
            var success = await _danhMucRepo.Delete(id);
            if (!success)
                return BadRequest(new { message = "Xóa thất bại" });

            return Ok(new { message = "Xóa thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}

