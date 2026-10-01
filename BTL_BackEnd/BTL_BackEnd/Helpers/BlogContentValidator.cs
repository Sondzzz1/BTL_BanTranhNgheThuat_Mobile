using System.Text.Json;

namespace DoAn2_BackEnd.Helpers;

public sealed record BlogContentValidationResult(string? Content, IReadOnlyCollection<int> ImageIds, bool IsBlockContent);

public static class BlogContentValidator
{
    public const int MaxBlocks = 100;
    public const int MaxImages = 20;
    private const int MaxSerializedLength = 200_000;
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.Ordinal)
        { "heading", "paragraph", "image", "quote", "list" };

    public static BlogContentValidationResult Validate(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return new BlogContentValidationResult(null, Array.Empty<int>(), false);

        var trimmed = content.Trim();
        if (trimmed.Length > MaxSerializedLength)
            throw new ArgumentException("Nội dung bài viết vượt quá giới hạn 200.000 ký tự");

        JsonDocument? document = null;
        try { document = JsonDocument.Parse(trimmed); }
        catch (JsonException)
        {
            if (LooksLikeBlockJson(trimmed))
                throw new ArgumentException("JSON nội dung bài viết không hợp lệ");
        }

        if (document == null || document.RootElement.ValueKind != JsonValueKind.Object ||
            !document.RootElement.TryGetProperty("version", out var version) ||
            !document.RootElement.TryGetProperty("blocks", out var blocks))
        {
            document?.Dispose();
            RejectDangerousText(trimmed);
            return new BlogContentValidationResult(content, Array.Empty<int>(), false);
        }

        using (document)
        {
            if (version.ValueKind != JsonValueKind.Number || !version.TryGetInt32(out var versionNumber) || versionNumber != 1)
                throw new ArgumentException("Phiên bản nội dung Blog không được hỗ trợ");
            if (blocks.ValueKind != JsonValueKind.Array)
                throw new ArgumentException("blocks phải là một mảng");
            if (blocks.GetArrayLength() > MaxBlocks)
                throw new ArgumentException($"Bài viết không được vượt quá {MaxBlocks} khối nội dung");

            var imageIds = new HashSet<int>();
            var canonicalBlocks = new List<Dictionary<string, object?>>();
            foreach (var block in blocks.EnumerateArray())
            {
                if (block.ValueKind != JsonValueKind.Object || !block.TryGetProperty("type", out var typeElement) || typeElement.ValueKind != JsonValueKind.String)
                    throw new ArgumentException("Mỗi block phải có type hợp lệ");
                var type = typeElement.GetString() ?? "";
                if (!AllowedTypes.Contains(type)) throw new ArgumentException($"Block type '{type}' không được hỗ trợ");

                switch (type)
                {
                    case "heading":
                        var level = ReadRequiredInt(block, "level");
                        if (level is < 2 or > 4) throw new ArgumentException("Heading chỉ hỗ trợ level 2 đến 4");
                        ValidateText(block, "text", 300, true);
                        canonicalBlocks.Add(new() { ["type"] = type, ["level"] = level, ["text"] = block.GetProperty("text").GetString()!.Trim() });
                        break;
                    case "paragraph":
                        ValidateText(block, "text", 5_000, true);
                        canonicalBlocks.Add(new() { ["type"] = type, ["text"] = block.GetProperty("text").GetString()!.Trim() });
                        break;
                    case "quote":
                        ValidateText(block, "text", 2_000, true);
                        canonicalBlocks.Add(new() { ["type"] = type, ["text"] = block.GetProperty("text").GetString()!.Trim() });
                        break;
                    case "image":
                        var imageId = ReadRequiredInt(block, "imageId");
                        if (imageId <= 0) throw new ArgumentException("imageId không hợp lệ");
                        imageIds.Add(imageId);
                        ValidateText(block, "caption", 300, false);
                        var imageBlock = new Dictionary<string, object?> { ["type"] = type, ["imageId"] = imageId };
                        if (block.TryGetProperty("caption", out var caption) && !string.IsNullOrWhiteSpace(caption.GetString()))
                            imageBlock["caption"] = caption.GetString()!.Trim();
                        canonicalBlocks.Add(imageBlock);
                        break;
                    case "list":
                        if (!block.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array || items.GetArrayLength() > 50)
                            throw new ArgumentException("Danh sách phải có tối đa 50 mục");
                        var canonicalItems = new List<string>();
                        foreach (var item in items.EnumerateArray())
                        {
                            if (item.ValueKind != JsonValueKind.String) throw new ArgumentException("Mục danh sách phải là văn bản");
                            ValidatePlainText(item.GetString(), 1_000, true, "Mục danh sách");
                            canonicalItems.Add(item.GetString()!.Trim());
                        }
                        if (block.TryGetProperty("ordered", out var ordered) && ordered.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                            throw new ArgumentException("ordered phải là true hoặc false");
                        canonicalBlocks.Add(new() { ["type"] = type, ["ordered"] = block.TryGetProperty("ordered", out ordered) && ordered.GetBoolean(), ["items"] = canonicalItems });
                        break;
                }
            }
            if (imageIds.Count > MaxImages) throw new ArgumentException($"Bài viết không được dùng quá {MaxImages} ảnh");
            var canonical = JsonSerializer.Serialize(new Dictionary<string, object?> { ["version"] = 1, ["blocks"] = canonicalBlocks });
            return new BlogContentValidationResult(canonical, imageIds, true);
        }
    }

    public static IReadOnlyCollection<int> GetReferencedImageIds(string? content)
    {
        try { return Validate(content).ImageIds; }
        catch { return Array.Empty<int>(); }
    }

    private static bool LooksLikeBlockJson(string value) => value.StartsWith('{') &&
        (value.Contains("\"version\"", StringComparison.OrdinalIgnoreCase) || value.Contains("\"blocks\"", StringComparison.OrdinalIgnoreCase));

    private static int ReadRequiredInt(JsonElement block, string property)
    {
        if (!block.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var result))
            throw new ArgumentException($"{property} không hợp lệ");
        return result;
    }

    private static void ValidateText(JsonElement block, string property, int maxLength, bool required)
    {
        if (!block.TryGetProperty(property, out var value))
        {
            if (required) throw new ArgumentException($"{property} không được để trống");
            return;
        }
        if (value.ValueKind != JsonValueKind.String) throw new ArgumentException($"{property} phải là văn bản");
        ValidatePlainText(value.GetString(), maxLength, required, property);
    }

    private static void ValidatePlainText(string? value, int maxLength, bool required, string name)
    {
        if (required && string.IsNullOrWhiteSpace(value)) throw new ArgumentException($"{name} không được để trống");
        if (value?.Length > maxLength) throw new ArgumentException($"{name} không được vượt quá {maxLength} ký tự");
        RejectDangerousText(value);
    }

    private static void RejectDangerousText(string? value)
    {
        if (string.IsNullOrEmpty(value)) return;
        var lowered = value.ToLowerInvariant();
        if (lowered.Contains("<script") || lowered.Contains("</script") || lowered.Contains("<iframe") ||
            lowered.Contains("javascript:") || lowered.Contains("onerror=") || lowered.Contains("onload="))
            throw new ArgumentException("Nội dung chứa mã hoặc thẻ không an toàn");
    }
}
