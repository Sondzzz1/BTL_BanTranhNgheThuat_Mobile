using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IGioHangRepository
{
    Task<GioHang?> GetByNguoiDung(int maNguoiDung);
    Task<int> CreateGioHang(int maNguoiDung);
    Task<List<ChiTietGioHang>> GetChiTiet(int maGioHang);
    Task<ChiTietGioHang?> GetChiTietById(int maChiTietGH);
    Task<ChiTietGioHang?> GetChiTietByTacPham(int maGioHang, int maTacPham);
    Task<int> AddChiTiet(ChiTietGioHang chiTiet);
    Task<bool> UpdateChiTiet(ChiTietGioHang chiTiet);
    Task<bool> DeleteChiTiet(int maChiTietGH);
    Task<bool> ClearGioHang(int maGioHang);
}
