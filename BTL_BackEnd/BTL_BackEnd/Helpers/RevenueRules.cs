using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.Helpers;

public static class RevenueRules
{
    // A refunded payment is a historical receipt only when every line is fully refunded.
    public static bool IsRecognized(int paymentCount, string? status, IReadOnlyCollection<ChiTietDonHang> lines)
    {
        if (paymentCount != 1) return false;
        if (string.Equals(status, "DaThanhToan", StringComparison.OrdinalIgnoreCase)) return true;
        return string.Equals(status, "HoanTien", StringComparison.OrdinalIgnoreCase)
            && lines.Count > 0 && lines.All(line => line.SoLuong > 0
                && Math.Clamp(line.SoLuongDaHoan, 0, line.SoLuong) == line.SoLuong);
    }
}
