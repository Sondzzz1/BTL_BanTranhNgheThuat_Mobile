using DoAn2_BackEnd.DTO;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using QRCoder;

namespace DoAn2_BackEnd.Helpers;

public class CertificateDocumentService
{
    private readonly CopyrightOptions _options;

    public CertificateDocumentService(IConfiguration configuration) =>
        _options = CopyrightOptions.From(configuration);

    public byte[] CreateQr(string code)
    {
        var verifyUrl = BuildVerifyUrl(code);
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(verifyUrl, QRCodeGenerator.ECCLevel.Q);
        using var qr = new PngByteQRCode(data);
        return qr.GetGraphic(12, new byte[] { 32, 45, 38 }, new byte[] { 255, 255, 255 });
    }

    public byte[] CreatePdf(ChungNhanResponse certificate)
    {
        var document = new PdfDocument();
        document.Info.Title = $"Certificate {certificate.MaChungNhanCongKhai}";
        var page = document.AddPage();
        page.Size = PdfSharpCore.PageSize.A4;
        using var graphics = XGraphics.FromPdfPage(page);
        var title = new XFont("Arial", 22, XFontStyle.Bold);
        var heading = new XFont("Arial", 12, XFontStyle.Bold);
        var normal = new XFont("Arial", 11, XFontStyle.Regular);
        var small = new XFont("Arial", 9, XFontStyle.Italic);
        var dark = XBrushes.DarkSlateGray;

        graphics.DrawRectangle(new XPen(XColor.FromArgb(32, 45, 38), 2), 32, 32, page.Width - 64, page.Height - 64);
        graphics.DrawString("CHUNG NHAN SO HUU HIEN VAT", title, dark,
            new XRect(48, 65, page.Width - 96, 40), XStringFormats.TopCenter);
        graphics.DrawString("CERTIFICATE OF PHYSICAL OWNERSHIP", heading, dark,
            new XRect(48, 103, page.Width - 96, 25), XStringFormats.TopCenter);

        var y = 155d;
        DrawLine(graphics, heading, normal, "Ma chung nhan", certificate.MaChungNhanCongKhai, ref y);
        DrawLine(graphics, heading, normal, "Tac pham", certificate.TenTacPham, ref y);
        DrawLine(graphics, heading, normal, "Loai tac pham", certificate.LoaiTacPhamText, ref y);
        DrawLine(graphics, heading, normal, "Hoa si thuc hien", certificate.TenHoaSi, ref y);
        if (!string.IsNullOrWhiteSpace(certificate.TacGiaGoc))
            DrawLine(graphics, heading, normal, "Tac gia goc", certificate.TacGiaGoc!, ref y);
        DrawLine(graphics, heading, normal, "Chu so huu hien vat", certificate.ChuSoHuu, ref y);
        DrawLine(graphics, heading, normal, "Ngay cap", certificate.NgayCap.ToString("dd/MM/yyyy HH:mm 'UTC'"), ref y);
        DrawLine(graphics, heading, normal, "Trang thai", certificate.TrangThai, ref y);

        var qrBytes = CreateQr(certificate.MaChungNhanCongKhai);
        using var qrStream = new MemoryStream(qrBytes);
        using var qrImage = XImage.FromStream(() => qrStream);
        graphics.DrawImage(qrImage, 205, y + 20, 185, 185);
        graphics.DrawString("Quet QR de xac minh cong khai", normal, dark,
            new XRect(80, y + 212, page.Width - 160, 24), XStringFormats.TopCenter);
        graphics.DrawString(BuildVerifyUrl(certificate.MaChungNhanCongKhai), small, XBrushes.Gray,
            new XRect(55, y + 237, page.Width - 110, 35), XStringFormats.TopCenter);
        graphics.DrawString("Chung nhan ghi nhan quyen so huu hien vat; khong chuyen giao quyen tac gia va khong thay the dang ky voi co quan nha nuoc.",
            small, XBrushes.Gray, new XRect(60, page.Height - 105, page.Width - 120, 45), XStringFormats.TopCenter);

        using var output = new MemoryStream();
        document.Save(output, false);
        return output.ToArray();
    }

    private string BuildVerifyUrl(string code)
    {
        var path = $"/chung-nhan/xac-minh/{Uri.EscapeDataString(code)}";
        return string.IsNullOrWhiteSpace(_options.BaseUrl) ? path : _options.BaseUrl + path;
    }

    private static void DrawLine(XGraphics graphics, XFont heading, XFont normal, string label, string value, ref double y)
    {
        graphics.DrawString(label + ":", heading, XBrushes.DarkSlateGray, new XPoint(70, y));
        graphics.DrawString(value, normal, XBrushes.Black, new XPoint(225, y));
        y += 31;
    }
}
