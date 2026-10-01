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
        if(!Owns(article))return StatusCode(403,new{message="Không có quyền tải ảnh cho bài viết này"});
        if(chuThich?.Trim().Length>300)return BadRequest(new{message="Chú thích ảnh không được vượt quá 300 ký tự"});
        if((await _repository.GetImages(id)).Count>=BlogContentValidator.MaxImages)
            return BadRequest(new{message=$"Mỗi bài viết chỉ được tải tối đa {BlogContentValidator.MaxImages} ảnh"});
        string? stored=null;
        try
        {
            stored=await _files.SaveAsync(file,cancellationToken);var path=$"/api/public/noi-dung-tep/{stored}";
            var imageId=await _repository.AddImage(id,path,chuThich,thuTu);return Ok(new{maHinhAnh=imageId,duongDan=path,chuThich,thuTu});
        }
        catch(ArgumentException ex){if(stored!=null)_files.DeleteIfExists(stored);return BadRequest(new{message=ex.Message});}
        catch{if(stored!=null)_files.DeleteIfExists(stored);throw;}
    }

    [HttpDelete("{id:int}/hinh-anh/{imageId:int}")]
    public async Task<ActionResult> Delete(int id,int imageId)
    {
        var article=await _repository.GetById(id);if(article==null)return NotFound(new{message="Không tìm thấy bài viết"});
        if(!Owns(article))return StatusCode(403,new{message="Không có quyền xóa ảnh của bài viết này"});
        var image=await _repository.GetImage(id,imageId);if(image==null)return NotFound(new{message="Không tìm thấy ảnh"});
        if(BlogContentValidator.GetReferencedImageIds(article.NoiDung).Contains(imageId))
            return Conflict(new{message="Ảnh đang được dùng trong nội dung. Hãy xóa khối ảnh rồi lưu bài trước"});
        if(!await _repository.DeleteImage(id,imageId))return NotFound(new{message="Không tìm thấy ảnh"});
        _files.DeleteIfExists(Path.GetFileName(image.DuongDan));
        return Ok(new{message="Đã xóa ảnh"});
    }

    private bool Owns(Models.BaiViet article)
    {
        var isAdmin=User.IsInRole("Admin");var account=JwtHelper.GetMaTaiKhoan(User);var artist=JwtHelper.GetMaHoaSi(User);
        return isAdmin ? article.MaHoaSi==null&&article.MaTaiKhoanTacGia==account : article.MaHoaSi==artist;
    }
}
