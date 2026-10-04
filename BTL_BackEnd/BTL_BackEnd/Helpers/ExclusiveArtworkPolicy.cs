namespace DoAn2_BackEnd.Helpers;

/// <summary>
/// Quy tắc độc bản chỉ dựa trên số lượng ban đầu đã được ghi nhận/đối soát.
/// Tồn kho hiện tại và lịch sử đơn hàng không được dùng để suy ra số lượng ban đầu.
/// </summary>
public static class ExclusiveArtworkPolicy
{
    public static bool HasVerifiedSingleInitialCopy(bool exclusive, int? initialQuantity) =>
        exclusive && initialQuantity == 1;

    /// <summary>
    /// Shared eligibility gate for an individual physical-ownership certificate. It has no
    /// dependency on current stock: a multi-edition remains multi-edition at stock 1 or 0.
    /// Database uniqueness constraints still provide the final concurrency protection.
    /// </summary>
    public static bool CanIssueIndividualOwnershipCertificate(
        bool exclusive,
        int? initialQuantity,
        bool copyrightVerified,
        bool blockedOrRevoked,
        bool legacy,
        bool paymentValid,
        bool delivered,
        int transferredQuantity,
        bool ownershipOrCertificateAlreadyExists) =>
        HasVerifiedSingleInitialCopy(exclusive, initialQuantity)
        && copyrightVerified
        && !blockedOrRevoked
        && !legacy
        && paymentValid
        && delivered
        && transferredQuantity == 1
        && !ownershipOrCertificateAlreadyExists;

    public static void EnsureDeclarationAllowed(bool requestedExclusive, int? initialQuantity)
    {
        if (!requestedExclusive) return;

        if (!initialQuantity.HasValue)
            throw new InvalidOperationException(
                "Không thể khai báo độc bản khi số lượng ban đầu chưa được Admin đối soát");

        if (initialQuantity.Value != 1)
            throw new InvalidOperationException("Tác phẩm độc bản phải có số lượng ban đầu bằng 1");
    }

    /// <summary>
    /// Validates the publication declaration made when a marketplace artwork is first created.
    /// This deliberately uses the declared initial quantity, never the remaining stock.
    /// </summary>
    public static void EnsureCreateDeclaration(bool exclusive, int declaredQuantity)
    {
        if (declaredQuantity <= 0)
            throw new ArgumentException("Số lượng phát hành phải lớn hơn 0");

        if (exclusive && declaredQuantity != 1)
            throw new InvalidOperationException("Tranh độc bản phải được tạo với số lượng bằng 1");

        if (!exclusive && declaredQuantity < 2)
            throw new InvalidOperationException(
                "Tranh nhiều bản phải khai báo số lượng ban đầu từ 2 trở lên; không suy diễn loại phát hành từ tồn kho");
    }

    /// <summary>
    /// A copyright dossier confirms the publication declaration; it must not be able to
    /// rewrite the declaration chosen while creating the artwork.
    /// </summary>
    public static void EnsureCopyrightDeclarationMatches(
        bool declaredExclusive,
        bool requestedExclusive,
        int? initialQuantity)
    {
        if (declaredExclusive != requestedExclusive)
            throw new InvalidOperationException(
                "Loại phát hành trong hồ sơ nguồn gốc phải khớp với khai báo khi tạo tác phẩm. Hãy liên hệ Admin nếu cần hiệu chỉnh dữ liệu.");

        if (declaredExclusive)
            EnsureDeclarationAllowed(true, initialQuantity);
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
