using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ICustomArtRepository
{
    Task<CustomArtRequest> CreateRequest(int maKhachHang, TaoYeuCauTranhRequest request);
    Task<List<CustomArtRequest>> GetByCustomer(int maKhachHang);
    Task<List<CustomArtRequest>> GetAll();
    Task<CustomArtRequest?> GetById(int maYeuCau);
    Task<bool> AssignRequest(int maYeuCau, int maHoaSi);
    Task<bool> RejectRequest(int maYeuCau);
    Task<CustomArtQuote> CreateQuote(BaoGiaTranhRequest request);
    Task<CustomArtQuote?> GetQuoteById(int maBaoGia);
    Task<bool> ConfirmQuote(int maBaoGia);
    Task<bool> CreateDeposit(int maYeuCau, decimal soTien);
    Task<bool> CreateProgress(TaoTienDoRequest request);
    Task<bool> CreateFeedback(TaoPhanHoiRequest request, int maKhachHang);
    Task<bool> ConfirmComplete(int maYeuCau, int maKhachHang);
}
