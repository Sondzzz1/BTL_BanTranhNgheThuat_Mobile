namespace DoAn2_BackEnd.Models;

/// <summary>
/// Bằng chứng đính kèm cho bản quyền (ảnh quá trình sáng tác, giấy tờ, v.v.)
/// </summary>
public class BangChungBanQuyen
{
    public int MaBangChung { get; set; }
    public int MaBanQuyen { get; set; }
    public string TenTepGoc { get; set; } = null!; // Tên file gốc do user upload
    public string TenTepLuu { get; set; } = null!; // GUID.ext (tên file trên server)
    public string DuongDan { get; set; } = null!; // Relative path
    public string LoaiTep { get; set; } = null!; // MIME type: image/jpeg, image/png, application/pdf
    public long KichThuoc { get; set; } // Bytes
    public DateTime NgayTao { get; set; }
    public int? NguoiTao { get; set; } // MaTaiKhoan
}
