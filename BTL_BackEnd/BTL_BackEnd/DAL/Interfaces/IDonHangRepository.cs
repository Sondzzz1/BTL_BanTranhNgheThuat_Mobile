using DoAn2_BackEnd.Models;
using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IDonHangRepository
{
    Task<List<DonHang>> GetAll();
    Task<DonHang?> GetById(int maDonHang);
    Task<List<DonHang>> GetByNguoiDung(int maNguoiDung);
    Task<int> Create(DonHang donHang);
    Task<bool> Update(DonHang donHang);
    Task<bool> UpdateTrangThai(int maDonHang, byte trangThai, string? lyDoHuy = null);
    Task<List<ChiTietDonHang>> GetChiTiet(int maDonHang);
    Task<int> CreateChiTiet(ChiTietDonHang chiTiet);
    Task<int> CreateTransactional(int maNguoiDung, TaoDonHangRequest request);
    Task<bool> RequestCancellation(int maNguoiDung, int maDonHang, string? lyDo);
    Task<bool> UpdateStatusTransactional(int maDonHang, byte trangThaiMoi, string? ghiChu, int maTaiKhoan);
    Task<bool> ConfirmReceivedByCustomerTransactional(int maNguoiDung, int maDonHang, int maTaiKhoan);
}
