namespace DoAn2_BackEnd.Helpers;

/// <summary>
/// Trạng thái đơn hàng dùng chung toàn hệ thống.
/// </summary>
public static class DonHangStatus
{
    public const byte ChoXacNhan = 0;
    public const byte DaXacNhan = 1;
    public const byte DangGiao = 2;
    public const byte DaGiao = 3;
    public const byte YeuCauHuy = 4;
    public const byte DaHuy = 5;

    public static string GetText(byte trangThai) => trangThai switch
    {
        ChoXacNhan => "Chờ xác nhận",
        DaXacNhan => "Đã xác nhận",
        DangGiao => "Đang giao",
        DaGiao => "Đã giao",
        YeuCauHuy => "Yêu cầu hủy",
        DaHuy => "Đã hủy",
        _ => "Không xác định"
    };
}
