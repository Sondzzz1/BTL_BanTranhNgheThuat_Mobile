using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.Helpers;

public sealed record SaleEligibility(bool CanSell, string SaleReason, string SaleMessage)
{
    public static SaleEligibility Unavailable(string reason, string message) => new(false, reason, message);
}

/// <summary>Publication approval, rights review and sale permission are independent.</summary>
public static class ArtworkSalePolicy
{
    public static SaleEligibility Evaluate(byte artworkStatus, byte? rightsStatus, byte? usageBasis,
        bool declarationComplete, bool blocked, int stock, bool commission,
        bool exclusive, int? initialQuantity, decimal price)
    {
        if (commission) return Deny("COMMISSION_ARTWORK", "Tác phẩm đặt vẽ không bán qua giỏ hàng.");
        if (artworkStatus != TacPhamStatus.OnSale)
            return Deny("ARTWORK_NOT_APPROVED", "Tác phẩm hiện chưa được công khai để mua.");
        if (!rightsStatus.HasValue) return Deny("RIGHTS_NOT_DECLARED", "Tác phẩm đang hoàn thiện khai báo nguồn gốc và quyền sử dụng, hiện chưa mở bán.");
        if (rightsStatus != CopyrightStatuses.Verified)
            return rightsStatus switch
            {
                CopyrightStatuses.Pending => Deny("RIGHTS_PENDING", "Đang hoàn thiện xác minh nguồn gốc và quyền sử dụng. Tác phẩm hiện chưa mở bán."),
                CopyrightStatuses.NeedInfo => Deny("RIGHTS_NEED_INFO", "Tác phẩm đang chờ bổ sung thông tin nguồn gốc/quyền sử dụng."),
                CopyrightStatuses.Rejected => Deny("RIGHTS_REJECTED", "Tác phẩm hiện không khả dụng để mua."),
                CopyrightStatuses.Revoked => Deny("RIGHTS_REVOKED", "Tác phẩm hiện không khả dụng để mua."),
                _ => Deny("RIGHTS_NOT_VERIFIED", "Tác phẩm hiện chưa đủ điều kiện mở bán."),
            };
        if (!declarationComplete || usageBasis == CopyrightUsageBases.Insufficient)
            return Deny("RIGHTS_INCOMPLETE", "Tác phẩm hiện chưa đủ điều kiện mở bán.");
        if (blocked) return Deny("BLOCKED_FROM_SALE", "Tác phẩm hiện không khả dụng để mua.");
        if (exclusive && (initialQuantity != 1 || stock > 1)
            || !exclusive && initialQuantity.HasValue && initialQuantity < 2)
            return Deny("PUBLICATION_DECLARATION_INVALID", "Tác phẩm đang được đối soát thông tin phát hành, hiện chưa mở bán.");
        if (stock <= 0) return Deny("OUT_OF_STOCK", "Tác phẩm đã hết hàng.");
        if (price <= 0) return Deny("INVALID_PRICE", "Tác phẩm hiện chưa đủ điều kiện mở bán.");
        return new(true, "AVAILABLE", "Được mở bán");
    }

    public static void EnsureCanSell(SaleEligibility eligibility, string artworkName)
    {
        if (!eligibility.CanSell)
            throw new BusinessConflictException($"Tác phẩm '{artworkName}': {eligibility.SaleMessage}");
    }

    private static SaleEligibility Deny(string reason, string message) => SaleEligibility.Unavailable(reason, message);
}
