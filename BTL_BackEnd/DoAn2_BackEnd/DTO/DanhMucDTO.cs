namespace DoAn2_BackEnd.DTO;

public class DanhMucCreateDTO
{
    public string TenDanhMuc { get; set; } = null!;
    public string? MoTa { get; set; }
}

public class DanhMucUpdateDTO
{
    public int MaDanhMuc { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string? MoTa { get; set; }
}

public class DanhMucViewDTO
{
    public int MaDanhMuc { get; set; }
    public string TenDanhMuc { get; set; } = null!;
    public string? MoTa { get; set; }
    public int SoTacPham { get; set; }
}
