using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.BLL;

public static class AdminReportBuilder
{
    public static void Validate(string type, DateTime from, DateTime to)
    {
        if (type is not ("doanh-thu" or "don-hang" or "tac-pham" or "hoa-si" or "khach-hang"))
            throw new ArgumentException("Loại báo cáo không hợp lệ.");
        if (from.Date > to.Date) throw new ArgumentException("Từ ngày không được lớn hơn đến ngày.");
        // SQL datetime data and exclusive upper bound must remain representable.
        if (from.Year < 1753 || to.Date == DateTime.MaxValue.Date)
            throw new ArgumentException("Khoảng ngày phải từ năm 1753 và trước ngày 31/12/9999.");
    }

    public static AdminReportResponse Build(string type, DateTime from, DateTime to, IEnumerable<AdminReportSource> source)
    {
        Validate(type, from, to);
        var rows = source.Where(r => r.Date >= from.Date && r.Date < to.Date.AddDays(1)).ToList();
        var result = new AdminReportResponse { Type = type, FromDate = from.Date, ToDate = to.Date };
        if (type == "don-hang")
        {
            rows = rows.DistinctBy(r => r.OrderId).ToList();
            result.DateBasis = "Ngày đặt (NgayDat); trạng thái hiện tại của các đơn được đặt trong kỳ.";
            result.HasData = rows.Count > 0;
            result.Summary = new()
            {
                new("Tổng đơn", rows.Count),
                new("Đã giao", rows.Count(r => r.Status == DonHangStatus.DaGiao)),
                new("Đã hủy", rows.Count(r => r.Status == DonHangStatus.DaHuy)),
                new("Tỷ lệ đã giao", rows.Count == 0 ? 0 : 100m * rows.Count(r => r.Status == DonHangStatus.DaGiao) / rows.Count, "percent")
            };
            result.Rows = rows.GroupBy(r => r.Status).OrderBy(g => g.Key)
                .Select(g => new ReportRow(g.Key.ToString(), DonHangStatus.GetText(g.Key), g.Count(), 0, 0, 0)).ToList();
            return result;
        }

        // Evaluate full-order refund eligibility before excluding commission lines.
        rows = rows.Where(r => r.Status == DonHangStatus.DaGiao).GroupBy(r => r.OrderId)
            .Where(g => RevenueRules.IsRecognized(g.First().PaymentCount, g.First().PaymentStatus,
                g.Select(r => new ChiTietDonHang { SoLuong = r.Quantity, SoLuongDaHoan = r.Returned }).ToList()))
            .SelectMany(g => g).Where(r => !r.IsCommission).ToList();
        result.DateBasis = "Ngày giao (NgayGiao), dự phòng NgayDat cho dữ liệu cũ. Chỉ đơn đã giao có một thanh toán hợp lệ; trừ số lượng đã hoàn tại dòng đơn. Không gồm tranh đặt vẽ. Khoản hoàn được điều chỉnh vào kỳ ghi nhận đơn, không phải ngày hoàn.";
        result.HasData = rows.Count > 0;
        int Returned(AdminReportSource r) => Math.Clamp(r.Returned, 0, Math.Max(0, r.Quantity));
        var gross = rows.Sum(r => r.Quantity * r.UnitPrice);
        var refund = rows.Sum(r => Returned(r) * r.UnitPrice);
        var quantity = rows.Sum(r => r.Quantity - Returned(r));
        result.Summary = type switch
        {
            "doanh-thu" => new() { new("Doanh thu gộp", gross, "currency"), new("Giá trị đã hoàn", refund, "currency"), new("Doanh thu sau hoàn", gross - refund, "currency"), new("Đơn ghi nhận", rows.Select(r => r.OrderId).Distinct().Count()) },
            "tac-pham" => new() { new("Tác phẩm có giao dịch", rows.Select(r => r.ArtworkId).Distinct().Count()), new("Số bản đã bán", rows.Sum(r => r.Quantity)), new("Số bản sau hoàn", quantity), new("Doanh thu sau hoàn", gross - refund, "currency") },
            "hoa-si" => new() { new("Họa sĩ có giao dịch", rows.Select(r => r.ArtistId).Distinct().Count()), new("Tác phẩm có giao dịch", rows.Select(r => r.ArtworkId).Distinct().Count()), new("Số bản sau hoàn", quantity), new("Doanh thu sau hoàn", gross - refund, "currency") },
            _ => new() { new("Khách có giao dịch", rows.Select(r => r.CustomerId).Distinct().Count()), new("Đơn ghi nhận", rows.Select(r => r.OrderId).Distinct().Count()), new("Số bản sau hoàn", quantity), new("Giá trị tranh sau hoàn", gross - refund, "currency") }
        };
        result.Rows = rows.GroupBy(r => type switch
        {
            "tac-pham" => (r.ArtworkId.ToString(), r.ArtworkName + " — " + r.ArtistName),
            "hoa-si" => (r.ArtistId?.ToString() ?? "unknown", r.ArtistName),
            "khach-hang" => (r.CustomerId.ToString(), r.CustomerName),
            _ => (r.Date.ToString("yyyy-MM-dd"), r.Date.ToString("dd/MM/yyyy"))
        }).Select(g => new ReportRow(g.Key.Item1, g.Key.Item2, g.Select(r => r.OrderId).Distinct().Count(),
            g.Sum(r => r.Quantity - Returned(r)), g.Sum(r => r.Quantity * r.UnitPrice), g.Sum(r => Returned(r) * r.UnitPrice))).ToList();
        result.Rows = type == "doanh-thu" ? result.Rows.OrderBy(r => r.Key).ToList()
            : type == "tac-pham" ? result.Rows.OrderByDescending(r => r.Quantity).ThenBy(r => r.Key).ToList()
            : result.Rows.OrderByDescending(r => r.Net).ThenBy(r => r.Key).ToList();
        return result;
    }
}
