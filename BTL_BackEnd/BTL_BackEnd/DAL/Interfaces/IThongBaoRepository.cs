using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IThongBaoRepository
{
    Task<long> Create(ThongBao thongBao);
    Task<(List<ThongBao> Items, int Total)> GetByTaiKhoan(int maTaiKhoan, int page, int pageSize);
    Task<int> CountUnread(int maTaiKhoan);
    Task<bool> MarkAsRead(long maThongBao, int maTaiKhoan);
    Task<int> MarkAllAsRead(int maTaiKhoan);
}
