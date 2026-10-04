using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IThongBaoBusiness
{
    Task<long> NotifyAccount(ThongBao thongBao);
    Task NotifyArtist(int maHoaSi, string loai, string tieuDe, string noiDung, string? duongDan = null);
    Task<ThongBaoPageResponse> GetForAccount(int maTaiKhoan, int page, int pageSize);
    Task<int> CountUnread(int maTaiKhoan);
    Task<bool> MarkAsRead(long maThongBao, int maTaiKhoan);
    Task<int> MarkAllAsRead(int maTaiKhoan);
}
