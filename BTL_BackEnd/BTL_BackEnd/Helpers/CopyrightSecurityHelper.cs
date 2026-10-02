using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.Helpers;

public sealed class CopyrightOptions
{
    public string BaseUrl { get; init; } = string.Empty;
    public string CertificateHashKey { get; init; } = string.Empty;
    public DateTime EnforcementStartUtc { get; init; } = new(2026, 10, 2, 0, 0, 0, DateTimeKind.Utc);

    public static CopyrightOptions From(IConfiguration configuration) => new()
    {
        BaseUrl = (configuration["Copyright:BaseUrl"] ?? string.Empty).TrimEnd('/'),
        CertificateHashKey = configuration["Copyright:CertificateHashKey"] ?? string.Empty,
        EnforcementStartUtc = DateTime.TryParse(configuration["Copyright:EnforcementStartUtc"], out var parsed)
            ? parsed.ToUniversalTime()
            : new DateTime(2026, 10, 2, 0, 0, 0, DateTimeKind.Utc)
    };

    public string RequireCertificateKey()
    {
        if (CertificateHashKey.Length < 32)
            throw new InvalidOperationException("Copyright:CertificateHashKey phải được cấu hình an toàn với tối thiểu 32 ký tự");
        return CertificateHashKey;
    }
}

public static class CertificateIntegrityHelper
{
    public static string CreateCode(DateTime issuedUtc) => $"COA-{issuedUtc:yyyy}-{Guid.NewGuid():N}".ToUpperInvariant();

    public static string CreateHash(string key, int artworkId, int ownerId, int ownershipId, DateTime issuedUtc, string code)
    {
        var payload = $"{artworkId}|{ownerId}|{ownershipId}|{issuedUtc.ToUniversalTime():O}|{code}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    public static bool Verify(string key, int artworkId, int ownerId, int ownershipId, DateTime issuedUtc, string code, string? hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return false;
        var expected = CreateHash(key, artworkId, ownerId, ownershipId, issuedUtc, code);
        try
        {
            return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(expected), Convert.FromHexString(hash));
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public static string MaskOwner(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Không công khai";
        var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1) return parts[0][0] + "***";
        return string.Join(' ', parts.Select((part, index) => index == parts.Length - 1 ? part : part[0] + "***"));
    }
}

public static class AuditLogSql
{
    public static async Task InsertAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        string objectName,
        int objectId,
        string action,
        int? actorId,
        byte? role,
        string? before = null,
        string? after = null,
        string? reason = null,
        string? extra = null)
    {
        const string sql = @"
            INSERT INTO NhatKyHeThong
                (TenDoiTuong,MaDoiTuong,HanhDong,GiaTriTruoc,GiaTriSau,NguoiThucHien,VaiTro,ThoiGian,LyDo,ThongTinBoSung)
            VALUES
                (@TenDoiTuong,@MaDoiTuong,@HanhDong,@GiaTriTruoc,@GiaTriSau,@NguoiThucHien,@VaiTro,SYSUTCDATETIME(),@LyDo,@ThongTinBoSung);";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@TenDoiTuong", objectName);
        command.Parameters.AddWithValue("@MaDoiTuong", objectId);
        command.Parameters.AddWithValue("@HanhDong", action);
        command.Parameters.AddWithValue("@GiaTriTruoc", Db(before));
        command.Parameters.AddWithValue("@GiaTriSau", Db(after));
        command.Parameters.AddWithValue("@NguoiThucHien", Db(actorId));
        command.Parameters.AddWithValue("@VaiTro", Db(role));
        command.Parameters.AddWithValue("@LyDo", Db(reason));
        command.Parameters.AddWithValue("@ThongTinBoSung", Db(extra));
        await command.ExecuteNonQueryAsync();
    }

    private static object Db(object? value) => value ?? DBNull.Value;
}
