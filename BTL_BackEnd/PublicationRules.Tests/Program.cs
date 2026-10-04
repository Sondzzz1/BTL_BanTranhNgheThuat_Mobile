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
