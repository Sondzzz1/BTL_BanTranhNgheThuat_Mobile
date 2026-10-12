using DoAn2_BackEnd.Helpers;
using System.Text.Json.Serialization;

namespace DoAn2_BackEnd.DTO;

public class ArtworkSaleResponse
{
    [JsonIgnore]
    public SaleEligibility SaleEligibility { get; set; } = SaleEligibility.Unavailable("RIGHTS_NOT_DECLARED", "Tác phẩm hiện chưa đủ điều kiện mở bán.");
    public bool CanSell => SaleEligibility.CanSell;
    public string SaleReason => SaleEligibility.SaleReason;
    public string SaleMessage => SaleEligibility.SaleMessage;
}
