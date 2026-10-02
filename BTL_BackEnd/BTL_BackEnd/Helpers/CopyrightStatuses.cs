namespace DoAn2_BackEnd.Helpers;

public static class CopyrightStatuses
{
    public const byte Pending = 0;
    public const byte NeedInfo = 1;
    public const byte Verified = 2;
    public const byte Rejected = 3;
    public const byte Disputed = 4;
    public const byte Legacy = 5;
    public const byte Revoked = 6;

    public static string ToCode(byte value) => value switch
    {
        Pending => "PENDING",
        NeedInfo => "NEED_INFO",
        Verified => "VERIFIED",
        Rejected => "REJECTED",
        Disputed => "DISPUTED",
        Legacy => "LEGACY",
        Revoked => "REVOKED",
        _ => "UNKNOWN"
    };
}

public static class CopyrightUsageBases
{
    public const byte AuthorOrRightsOwner = 1;
    public const byte ReviewedPublicDomain = 2;
    public const byte PermissionGranted = 3;
    public const byte OtherLawfulBasis = 4;
    public const byte Insufficient = 5;

    public static bool IsValid(byte? value) => value is AuthorOrRightsOwner or ReviewedPublicDomain
        or PermissionGranted or OtherLawfulBasis or Insufficient;

    public static string ToCode(byte? value) => value switch
    {
        AuthorOrRightsOwner => "AUTHOR_OR_RIGHTS_OWNER",
        ReviewedPublicDomain => "REVIEWED_PUBLIC_DOMAIN",
        PermissionGranted => "PERMISSION_GRANTED",
        OtherLawfulBasis => "OTHER_LAWFUL_BASIS",
        Insufficient => "INSUFFICIENT",
        _ => "UNDECLARED"
    };
}

public static class OwnershipStatuses
{
    public const byte Current = 1;
    public const byte Transferred = 2;
    public const byte Reversed = 3;
}

public static class CertificateStatuses
{
    public const byte Active = 1;
    public const byte Superseded = 2;
    public const byte Revoked = 3;
    public const byte Expired = 4;

    public static string ToCode(byte value) => value switch
    {
        Active => "ACTIVE",
        Superseded => "SUPERSEDED",
        Revoked => "REVOKED",
        Expired => "EXPIRED",
        _ => "UNKNOWN"
    };
}
