namespace DoAn2_BackEnd.Helpers;

/// <summary>
/// Quy tắc độc bản chỉ dựa trên số lượng ban đầu đã được ghi nhận/đối soát.
/// Tồn kho hiện tại và lịch sử đơn hàng không được dùng để suy ra số lượng ban đầu.
/// </summary>
public static class ExclusiveArtworkPolicy
{
    public static bool HasVerifiedSingleInitialCopy(bool exclusive, int? initialQuantity) =>
        exclusive && initialQuantity == 1;

    public static void EnsureDeclarationAllowed(bool requestedExclusive, int? initialQuantity)
    {
        if (!requestedExclusive) return;

        if (!initialQuantity.HasValue)
            throw new InvalidOperationException(
                "Không thể khai báo độc bản khi số lượng ban đầu chưa được Admin đối soát");

        if (initialQuantity.Value != 1)
            throw new InvalidOperationException("Tác phẩm độc bản phải có số lượng ban đầu bằng 1");
    }

    public static void EnsureStockUpdateAllowed(bool exclusive, int? initialQuantity, int proposedStock)
    {
        if (!exclusive) return;

        if (!HasVerifiedSingleInitialCopy(exclusive, initialQuantity))
            throw new InvalidOperationException(
                "Không thể cập nhật tác phẩm đang đánh dấu độc bản khi số lượng ban đầu chưa được đối soát bằng 1");

        if (proposedStock > 1)
            throw new InvalidOperationException("Tồn kho của tác phẩm độc bản không được lớn hơn 1");
    }

    public static void EnsureAdminInitialQuantityAllowed(
        int currentStock,
        int proposedInitialQuantity,
        bool exclusive)
    {
        if (proposedInitialQuantity <= 0)
            throw new ArgumentException("Số lượng ban đầu phải lớn hơn 0");

        if (proposedInitialQuantity < currentStock)
            throw new InvalidOperationException(
                "Số lượng ban đầu không thể nhỏ hơn tồn kho hiện tại; cần đối soát lại căn cứ xác minh");

        if (exclusive && proposedInitialQuantity != 1)
            throw new InvalidOperationException(
                "Tác phẩm đang đánh dấu độc bản chỉ có thể được đối soát với số lượng ban đầu bằng 1");
    }
}
