using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface ICopyrightRepository
{
    Task<int> Create(int maHoaSi, int maTaiKhoan, TaoBanQuyenRequest request);
    Task<BanQuyenResponse?> GetForArtist(int maTacPham, int maHoaSi);
    Task<bool> Update(int maBanQuyen, int maHoaSi, int maTaiKhoan, CapNhatBanQuyenRequest request);
    Task<int> AddEvidence(int maBanQuyen, int maHoaSi, int maTaiKhoan, CopyrightEvidenceFile file);
    Task<(BangChungBanQuyen Evidence, int ArtistId)?> GetEvidence(int maBanQuyen, int maBangChung);
    Task<BangChungBanQuyen?> DeleteEvidence(int maBanQuyen, int maBangChung, int maHoaSi, int maTaiKhoan);
    Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword);
    Task<BanQuyenResponse?> GetForAdminById(int maBanQuyen);
    Task<BanQuyenResponse?> GetForAdminByArtworkId(int maTacPham);
    Task<bool> VerifyInitialQuantity(
        int maTacPham,
        int maTaiKhoan,
        int soLuongBanDau,
        string canCuXacMinh);
    Task<bool> CorrectPublicationDeclaration(
        int maTacPham,
        int maTaiKhoan,
        bool laTacPhamDocBan,
        int soLuongBanDau,
        string canCuXacMinh);
    Task<bool> Review(int maBanQuyen, int maTaiKhoan, byte status, string? note);
    Task<bool> RevokeVerification(int maBanQuyen, int maTaiKhoan, string reason, bool hideArtwork);
    Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham);
    Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung);
    Task<List<ChungNhanChoCapResponse>> GetPendingCertificates(int maNguoiDung);
    Task<List<ChungNhanResponse>> GetCertificatesForAdmin(string? status, string? keyword);
    Task<ChungNhanResponse?> GetCertificate(int maChungNhan, int maNguoiDung);
    Task<ChungNhanCongKhaiResponse> VerifyCertificate(string code, string hashKey);
    Task<bool> RevokeCertificate(int maChungNhan, int maTaiKhoan, string reason);
    Task<bool> SetCertificateOwnerVisibility(int maChungNhan, int maNguoiDung, bool visible);
    Task<List<CopyrightAuditResponse>> GetAuditLogs(string? objectName, int? objectId);
}

public record CopyrightEvidenceFile(
    string OriginalName,
    string StoredName,
    string RelativePath,
    string ContentType,
    long Size,
    string Sha256,
    string? Description);
