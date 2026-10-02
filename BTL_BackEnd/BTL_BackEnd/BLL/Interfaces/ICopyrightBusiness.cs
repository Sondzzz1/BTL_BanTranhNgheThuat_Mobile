using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface ICopyrightBusiness
{
    Task<int> Create(int maHoaSi, int maTaiKhoan, TaoBanQuyenRequest request);
    Task<BanQuyenResponse?> GetForArtist(int maTacPham, int maHoaSi);
    Task Update(int maBanQuyen, int maHoaSi, int maTaiKhoan, CapNhatBanQuyenRequest request);
    Task<int> AddEvidence(int maBanQuyen, int maHoaSi, int maTaiKhoan, CopyrightEvidenceFile file);
    Task<(BangChungBanQuyen Evidence, int ArtistId)?> GetEvidence(int maBanQuyen, int maBangChung);
    Task<BangChungBanQuyen> DeleteEvidence(int maBanQuyen, int maBangChung, int maHoaSi, int maTaiKhoan);
    Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword);
    Task<BanQuyenResponse> GetForAdminById(int maBanQuyen);
    Task VerifyInitialQuantity(int maTacPham, int maTaiKhoan, XacMinhSoLuongBanDauRequest request);
    Task Review(int maBanQuyen, int maTaiKhoan, byte status, string? note);
    Task RevokeVerification(int maBanQuyen, int maTaiKhoan, ThuHoiXacMinhRequest request);
    Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham);
    Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung);
    Task<List<ChungNhanResponse>> GetCertificatesForAdmin(string? status, string? keyword);
    Task<ChungNhanResponse> GetCertificate(int maChungNhan, int maNguoiDung);
    Task<ChungNhanCongKhaiResponse> VerifyCertificate(string code);
    Task RevokeCertificate(int maChungNhan, int maTaiKhoan, string reason);
    Task SetCertificateOwnerVisibility(int maChungNhan, int maNguoiDung, bool visible);
    Task<List<CopyrightAuditResponse>> GetAuditLogs(string? objectName, int? objectId);
}
