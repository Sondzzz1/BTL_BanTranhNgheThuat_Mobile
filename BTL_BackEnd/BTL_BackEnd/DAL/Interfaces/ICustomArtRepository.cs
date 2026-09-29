using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ICustomArtRepository
{
    Task<CustomArtRequest> CreateRequest(int maKhachHang, TaoYeuCauTranhRequest request, CustomArtStatus initialStatus, PermissionUsageStatus? permissionStatus);
    Task<List<CustomArtRequest>> GetByCustomer(int maKhachHang);
    Task<List<CustomArtRequest>> GetForAdmin(CustomArtType? type = null, CustomArtStatus? status = null);
    Task<List<CustomArtRequest>> GetForArtist(int maHoaSi);
    Task<CustomArtRequest?> GetById(int maYeuCau);
    Task<bool> UpdateByCustomer(int maYeuCau, int maKhachHang, CapNhatYeuCauTranhRequest request, CustomArtStatus status, PermissionUsageStatus? permissionStatus);
    Task<bool> CancelByCustomer(int maYeuCau, int maKhachHang);
    Task<bool> AssignRequest(int maYeuCau, int maHoaSi);
    Task<bool> ReviewRequest(int maYeuCau, int maTaiKhoan, CustomArtStatus status, string? note);
    Task<bool> UpdateArtistStatus(int maYeuCau, int maHoaSi, CustomArtStatus status);
    Task<int?> CompleteRequest(int maYeuCau, int maHoaSi, HoanThanhYeuCauRequest request);
    Task<CustomArtQuote> CreateQuote(BaoGiaTranhRequest request, int maHoaSi);
    Task<CustomArtQuote?> GetQuoteById(int maBaoGia);
    Task<bool> ConfirmQuote(int maBaoGia, int maKhachHang);
    Task<bool> CreateDeposit(int maYeuCau, int maKhachHang, decimal soTien);
    Task<bool> CreateProgress(TaoTienDoRequest request, int maHoaSi);
    Task<bool> CreateFeedback(TaoPhanHoiRequest request, int maKhachHang);
    Task<bool> ConfirmComplete(int maYeuCau, int maKhachHang);
    Task<bool> UpdateStoredFilePath(int maYeuCau, int maKhachHang, string fileKind, string storedPath);
}
