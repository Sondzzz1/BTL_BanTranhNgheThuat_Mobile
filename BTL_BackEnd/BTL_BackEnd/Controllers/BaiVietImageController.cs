using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAn2_BackEnd.Controllers;

[ApiController]
[Route("api/bai-viet")]
[Authorize(Roles="Admin,HoaSi")]
public class BaiVietImageController : ControllerBase
{
    private readonly IBaiVietRepository _repository;
    private readonly ContentImageFileHelper _files;
    public BaiVietImageController(IBaiVietRepository repository,ContentImageFileHelper files){_repository=repository;_files=files;}

    [HttpPost("{id:int}/hinh-anh")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> Upload(int id,[FromForm] IFormFile file,[FromForm] string? chuThich,[FromForm] int thuTu=0,CancellationToken cancellationToken=default)
    {
        var article=await _repository.GetById(id);if(article==null)return NotFound(new{message="Không tìm thấy bài viết"});
        var isAdmin=User.IsInRole("Admin");var account=JwtHelper.GetMaTaiKhoan(User);var artist=JwtHelper.GetMaHoaSi(User);
        var owns=isAdmin ? article.MaHoaSi==null&&article.MaTaiKhoanTacGia==account : article.MaHoaSi==artist;
        if(!owns)return StatusCode(403,new{message="Không có quyền tải ảnh cho bài viết này"});
        string? stored=null;
        try
        {
            stored=await _files.SaveAsync(file,cancellationToken);var path=$"/api/public/noi-dung-tep/{stored}";
            var imageId=await _repository.AddImage(id,path,chuThich,thuTu);return Ok(new{maHinhAnh=imageId,duongDan=path,chuThich,thuTu});
        }
        catch(ArgumentException ex){if(stored!=null)_files.DeleteIfExists(stored);return BadRequest(new{message=ex.Message});}
        catch{if(stored!=null)_files.DeleteIfExists(stored);throw;}
    }
}
