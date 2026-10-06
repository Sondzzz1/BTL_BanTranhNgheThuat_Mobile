using DoAn2_BackEnd.Helpers;

var tests = new (string Name, Action Run)[]
{
    ("1. Tạo độc bản số lượng 1 hợp lệ", () => ExclusiveArtworkPolicy.EnsureCreateDeclaration(true, 1)),
    ("2. Tạo độc bản số lượng 5 bị từ chối", () => Throws(() => ExclusiveArtworkPolicy.EnsureCreateDeclaration(true, 5))),
    ("3. Tạo nhiều bản số lượng 10 hợp lệ", () => ExclusiveArtworkPolicy.EnsureCreateDeclaration(false, 10)),
    ("4. Nhiều bản tồn 1 không thành độc bản", () => Assert(!ExclusiveArtworkPolicy.HasVerifiedSingleInitialCopy(false, 10))),
    ("5. Nhiều bản tồn 0 không thành độc bản", () => Assert(!ExclusiveArtworkPolicy.HasVerifiedSingleInitialCopy(false, 10))),
    ("6. Legacy tồn 1, ban đầu NULL không suy ra độc bản", () => Assert(!ExclusiveArtworkPolicy.HasVerifiedSingleInitialCopy(false, null))),
    ("7. Không cho hồ sơ bản quyền đổi nhiều bản đã khai báo thành độc bản", () => Throws(() => ExclusiveArtworkPolicy.EnsureCopyrightDeclarationMatches(false, true, 10))),
    ("8. Độc bản chưa VERIFIED không đủ điều kiện chứng nhận", () => Assert(!CanIssue(copyrightVerified: false))),
    ("9. Độc bản VERIFIED, thanh toán và giao đủ điều kiện", () => Assert(CanIssue())),
    ("10. Chứng nhận/lịch sử đã tồn tại không được cấp lần hai", () => Assert(!CanIssue(alreadyExists: true))),
    ("11. Nhiều người mua tranh nhiều bản không nhận chứng nhận độc bản", () => Assert(!ExclusiveArtworkPolicy.CanIssueIndividualOwnershipCertificate(false, 10, true, false, false, true, true, 1, false))),
    ("12. Hoàn trả nhiều bản không thay đổi loại phát hành hay số lượng ban đầu", () => Assert(!ExclusiveArtworkPolicy.HasVerifiedSingleInitialCopy(false, 10))),
    ("13. Tranh nhiều bản còn tồn 1 vẫn cho sửa tồn kho", () => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(false, 10, 1)),
    ("14. Tranh nhiều bản hết hàng vẫn cho sửa thông tin", () => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(false, 10, 0)),
    ("15. Tranh nhiều bản không tăng tồn vượt số lượng ban đầu", () => Throws(() => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(false, 10, 11))),
    ("16. Độc bản hết hàng vẫn cho sửa thông tin khi giữ tồn 0", () => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(true, 1, 0, 0)),
    ("17. Độc bản không được có tồn vượt 1", () => Throws(() => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(true, 1, 2))),
    ("18. Dữ liệu nhiều bản cũ chưa đối soát vẫn cho sửa tồn kho hợp lệ", () => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(false, null, 1)),
    ("19. Không tự hồi tồn độc bản đã hết hàng", () => Throws(() => ExclusiveArtworkPolicy.EnsureStockUpdateAllowed(true, 1, 1, 0))),
    ("20. Admin không đối soát tranh nhiều bản với số lượng ban đầu 1", () => Throws(() => ExclusiveArtworkPolicy.EnsureAdminInitialQuantityAllowed(1, 1, false))),
};

foreach (var test in tests)
{
    test.Run();
    Console.WriteLine($"PASS: {test.Name}");
}

Console.WriteLine($"{tests.Length} policy tests passed.");

static bool CanIssue(bool copyrightVerified = true, bool alreadyExists = false) =>
    ExclusiveArtworkPolicy.CanIssueIndividualOwnershipCertificate(
        exclusive: true,
        initialQuantity: 1,
        copyrightVerified: copyrightVerified,
        blockedOrRevoked: false,
        legacy: false,
        paymentValid: true,
        delivered: true,
        transferredQuantity: 1,
        ownershipOrCertificateAlreadyExists: alreadyExists);

static void Throws(Action action)
{
    try
    {
        action();
    }
    catch (InvalidOperationException)
    {
        return;
    }
    throw new Exception("Expected InvalidOperationException.");
}

static void Assert(bool condition)
{
    if (!condition) throw new Exception("Assertion failed.");
}
