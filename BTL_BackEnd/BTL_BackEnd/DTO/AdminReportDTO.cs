namespace DoAn2_BackEnd.DTO;

public record ReportMetric(string Label, decimal Value, string Format = "number");
public record ReportRow(string Key, string Label, int Orders, int Quantity, decimal Gross, decimal Refund)
{
    public decimal Net => Gross - Refund;
}
public class AdminReportResponse
{
    public string Type { get; set; } = "";
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string DateBasis { get; set; } = "";
    public bool HasData { get; set; }
    public List<ReportMetric> Summary { get; set; } = new();
    public List<ReportRow> Rows { get; set; } = new();
}

// Internal read model: one row/order for order reports; one row/order line for sales.
public class AdminReportSource
{
    public int OrderId { get; set; }
    public DateTime Date { get; set; }
    public byte Status { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = "";
    public int ArtworkId { get; set; }
    public string ArtworkName { get; set; } = "";
    public int? ArtistId { get; set; }
    public string ArtistName { get; set; } = "";
    public bool IsCommission { get; set; }
    public int Quantity { get; set; }
    public int Returned { get; set; }
    public decimal UnitPrice { get; set; }
    public int PaymentCount { get; set; }
    public string? PaymentStatus { get; set; }
}
