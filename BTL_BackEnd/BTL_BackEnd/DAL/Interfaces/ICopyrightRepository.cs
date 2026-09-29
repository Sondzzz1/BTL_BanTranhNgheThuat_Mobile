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
    Task<List<BanQuyenResponse>> GetForAdmin(string? status, string? keyword);
    Task<BanQuyenResponse?> GetForAdminById(int maBanQuyen);
    Task<bool> Review(int maBanQuyen, int maTaiKhoan, byte status, string? note);
    Task<BanQuyenCongKhaiResponse> GetPublic(int maTacPham);
    Task<List<ChungNhanResponse>> GetCertificates(int maNguoiDung);
    Task<ChungNhanResponse?> GetCertificate(int maChungNhan, int maNguoiDung);
}

public record CopyrightEvidenceFile(string OriginalName, string StoredName, string RelativePath, string ContentType, long Size);
