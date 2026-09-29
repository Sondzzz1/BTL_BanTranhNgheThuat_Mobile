namespace DoAn2_BackEnd.Helpers;

public class CopyrightFileHelper
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private readonly string _storageRoot;

    public CopyrightFileHelper(IWebHostEnvironment environment)
    {
        _storageRoot = Path.Combine(environment.ContentRootPath, "App_Data", "copyright-evidence");
        Directory.CreateDirectory(_storageRoot);
    }

    public async Task<string> SaveAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0) throw new ArgumentException("Tệp bằng chứng không được để trống");
        if (file.Length > MaxFileSize) throw new ArgumentException("Tệp bằng chứng không được vượt quá 5 MB");

        var contentType = file.ContentType.ToLowerInvariant();
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "application/pdf" => ".pdf",
            _ => throw new ArgumentException("Bằng chứng chỉ chấp nhận JPG, PNG, WEBP hoặc PDF")
        };

        await using var input = file.OpenReadStream();
        var header = new byte[12];
        var bytesRead = await input.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        if (!MatchesSignature(header, bytesRead, contentType))
            throw new ArgumentException("Nội dung tệp không khớp với định dạng khai báo");

        var storedName = $"{Guid.NewGuid():N}{extension}";
        await using var output = new FileStream(ResolvePath(storedName), FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, true);
        await output.WriteAsync(header.AsMemory(0, bytesRead), cancellationToken);
        await input.CopyToAsync(output, cancellationToken);
        return storedName;
    }

    public (Stream Stream, string ContentType) OpenRead(string storedName)
    {
        var fullPath = ResolvePath(storedName);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("Không tìm thấy tệp bằng chứng", storedName);
        var contentType = Path.GetExtension(fullPath).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg", ".png" => "image/png", ".webp" => "image/webp",
            ".pdf" => "application/pdf", _ => "application/octet-stream"
        };
        return (new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read), contentType);
    }

    public void DeleteIfExists(string? storedName)
    {
        if (string.IsNullOrWhiteSpace(storedName)) return;
        var fullPath = ResolvePath(storedName);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    private string ResolvePath(string storedName)
    {
        var safeName = Path.GetFileName(storedName);
        if (!safeName.Equals(storedName, StringComparison.Ordinal)) throw new ArgumentException("Tên tệp lưu trữ không hợp lệ");
        var fullPath = Path.GetFullPath(Path.Combine(_storageRoot, safeName));
        var root = Path.GetFullPath(_storageRoot) + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Đường dẫn tệp không hợp lệ");
        return fullPath;
    }

    private static bool MatchesSignature(byte[] header, int length, string contentType) => contentType switch
    {
        "image/jpeg" => length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
        "image/png" => length >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A,
        "image/webp" => length >= 12 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
        "application/pdf" => length >= 5 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46 && header[4] == 0x2D,
        _ => false
    };
}
