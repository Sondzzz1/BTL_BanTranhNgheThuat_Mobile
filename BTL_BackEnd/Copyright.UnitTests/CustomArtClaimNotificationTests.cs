using DoAn2_BackEnd.Helpers;
using Xunit;

namespace Copyright.UnitTests;

public class CustomArtClaimNotificationTests
{
    [Fact]
    public void ClaimMessageIdentifiesArtistRequestAndExactAdminTarget()
    {
        var notification = WorkflowNotifications.CustomArtClaimed(35, "  Trịnh Tuấn  ", "  Tranh hoa sen  ");
        Assert.Equal("CUSTOM_ART_CLAIMED", notification.Loai);
        Assert.Equal("Họa sĩ đã nhận yêu cầu vẽ tranh", notification.TieuDe);
        Assert.Equal("Họa sĩ Trịnh Tuấn đã nhận yêu cầu vẽ tranh #35 “Tranh hoa sen”.", notification.NoiDung);
        Assert.Equal("YeuCauVeTranh", notification.LoaiDoiTuong);
        Assert.Equal(35, notification.MaDoiTuong);
        Assert.Equal("/admin/custom-art?requestId=35", notification.DuongDan);
        Assert.False(notification.DaDoc);
    }

    [Fact]
    public void ClaimMessageBoundsDatabaseFieldsAndLeavesContentAsPlainText()
    {
        var notification = WorkflowNotifications.CustomArtClaimed(35, new string('A', 500), "<script>" + new string('B', 2000));
        Assert.Contains(new string('A', 150), notification.NoiDung);
        Assert.DoesNotContain(new string('A', 151), notification.NoiDung);
        Assert.Contains("<script>", notification.NoiDung);
        Assert.True(notification.TieuDe.Length <= 200);
        Assert.True(notification.NoiDung.Length <= 2000);
    }
}
