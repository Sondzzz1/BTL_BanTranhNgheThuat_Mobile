using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.Helpers;

/// <summary>Plain-text workflow messages. Recipients and event revisions are resolved in the SQL transaction.</summary>
public static class WorkflowNotifications
{
    public static ThongBao Submitted(string entity, int id, string type, string artist, string name, string action, string path) => new()
    {
        Loai = type, TieuDe = "Yêu cầu từ họa sĩ",
        NoiDung = $"Họa sĩ {Text(artist, 150)} {action} “{Text(name, 300)}”.",
        LoaiDoiTuong = entity, MaDoiTuong = id, DuongDan = path, EventKey = type,
    };

    public static ThongBao Decision(string entity, int id, string type, string name, string subject, string decision, string path, string? reason = null) => new()
    {
        Loai = type, TieuDe = $"{subject}: {decision}",
        NoiDung = $"{subject} “{Text(name, 300)}” {decision}.{(string.IsNullOrWhiteSpace(reason) ? "" : $" Lý do: {Text(reason, 1000)}")}",
        LoaiDoiTuong = entity, MaDoiTuong = id, DuongDan = path, EventKey = type,
    };

    // The UI renders text (never dangerouslySetInnerHTML). Bound messages to the existing SQL columns.
    private static string Text(string value, int length) => value.Trim()[..Math.Min(value.Trim().Length, length)];
}
