namespace DoAn2_BackEnd.Helpers;

public class ReturnFileHelper
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private readonly string _root;

    public ReturnFileHelper(IWebHostEnvironment environment)
    {
        _root = Path.Combine(environment.ContentRootPath, "App_Data", "return-evidence");
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length <= 0 || file.Length > MaxFileSize)
            throw new ArgumentException("Mỗi ảnh bằng chứng phải có dung lượng từ 1 byte đến 5 MB");
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType)) throw new ArgumentException("Ảnh bằng chứng chỉ chấp nhận JPG, PNG hoặc WEBP");

        await using var input = file.OpenReadStream();
        var header = new byte[12];
        var read = await input.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        if (!MatchesSignature(header, read, file.ContentType)) throw new ArgumentException("Nội dung tệp không khớp định dạng khai báo");
        var extension = file.ContentType.ToLowerInvariant() switch { "image/jpeg" => ".jpg", "image/png" => ".png", _ => ".webp" };
        var name = $"{Guid.NewGuid():N}{extension}";
        await using var output = new FileStream(Resolve(name), FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, true);
        await output.WriteAsync(header.AsMemory(0, read), cancellationToken);
        await input.CopyToAsync(output, cancellationToken);
        return name;
    }

    public (Stream Stream, string ContentType) OpenRead(string name)
    {
        var path = Resolve(name);
        if (!File.Exists(path)) throw new FileNotFoundException("Không tìm thấy ảnh bằng chứng", name);
        var type = Path.GetExtension(path).ToLowerInvariant() switch { ".jpg" => "image/jpeg", ".png" => "image/png", ".webp" => "image/webp", _ => "application/octet-stream" };
        return (new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read), type);
    }

    public void DeleteIfExists(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return;
        var path = Resolve(name);
        if (File.Exists(path)) File.Delete(path);
    }

    private string Resolve(string name)
    {
        var safe = Path.GetFileName(name);
        if (!safe.Equals(name, StringComparison.Ordinal)) throw new ArgumentException("Tên tệp không hợp lệ");
        var full = Path.GetFullPath(Path.Combine(_root, safe));
        var root = Path.GetFullPath(_root) + Path.DirectorySeparatorChar;
        if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Đường dẫn tệp không hợp lệ");
        return full;
    }

    private static bool MatchesSignature(byte[] h, int n, string type) => type.ToLowerInvariant() switch
    {
        "image/jpeg" => n >= 3 && h[0] == 0xff && h[1] == 0xd8 && h[2] == 0xff,
        "image/png" => n >= 8 && h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4e && h[3] == 0x47 && h[4] == 0x0d && h[5] == 0x0a && h[6] == 0x1a && h[7] == 0x0a,
        "image/webp" => n >= 12 && h[0] == 0x52 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x46 && h[8] == 0x57 && h[9] == 0x45 && h[10] == 0x42 && h[11] == 0x50,
        _ => false
    };
}
