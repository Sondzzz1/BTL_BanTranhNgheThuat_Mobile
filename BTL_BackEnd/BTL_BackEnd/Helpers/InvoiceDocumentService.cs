using DoAn2_BackEnd.Models;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;

namespace DoAn2_BackEnd.Helpers;

/// <summary>
/// Tạo PDF hóa đơn bán hàng nội bộ (biên nhận). Dùng PdfSharpCore, cùng
/// thư viện đã dùng cho ChungNhan. PDF được tạo on-demand từ dữ liệu đã
/// lưu trong HoaDonBan, không lưu file vật lý.
/// </summary>
public class InvoiceDocumentService
{
    public byte[] CreatePdf(HoaDonBan hoaDon)
    {
        var document = new PdfDocument();
        document.Info.Title = $"Hóa đơn #{hoaDon.MaHoaDon}";
        var page = document.AddPage();
        page.Size = PdfSharpCore.PageSize.A4;
        using var gfx = XGraphics.FromPdfPage(page);

        var titleFont = new XFont("Arial", 18, XFontStyle.Bold);
        var subtitleFont = new XFont("Arial", 10, XFontStyle.Italic);
        var headingFont = new XFont("Arial", 11, XFontStyle.Bold);
        var normalFont = new XFont("Arial", 10, XFontStyle.Regular);
        var smallFont = new XFont("Arial", 8, XFontStyle.Italic);
        var dark = XBrushes.DarkSlateGray;

        // Border
        gfx.DrawRectangle(new XPen(XColor.FromArgb(32, 45, 38), 1.5), 30, 30, page.Width - 60, page.Height - 60);

        double y = 55;
        double left = 50;
        double right = page.Width - 50;
        double contentWidth = right - left;

        // ── Header ──
        gfx.DrawString("HOA DON BAN HANG", titleFont, dark,
            new XRect(left, y, contentWidth, 26), XStringFormats.TopCenter);
        y += 28;
        gfx.DrawString("(Bien nhan noi bo - Khong phai hoa don thue)", subtitleFont, XBrushes.Gray,
            new XRect(left, y, contentWidth, 16), XStringFormats.TopCenter);
        y += 28;

        // ── Thông tin hóa đơn ──
        DrawField(gfx, headingFont, normalFont, "Ma hoa don:", $"HD{hoaDon.MaHoaDon:D6}", left, ref y);
        DrawField(gfx, headingFont, normalFont, "Ma don hang:", $"DH{hoaDon.MaDonHang}", left, ref y);
        DrawField(gfx, headingFont, normalFont, "Ngay lap:", hoaDon.NgayXuatHD.ToString("dd/MM/yyyy HH:mm"), left, ref y);
        y += 8;

        // ── Thông tin khách hàng ──
        gfx.DrawString("THONG TIN KHACH HANG", headingFont, dark, new XPoint(left, y));
        y += 6;
        gfx.DrawLine(new XPen(XColor.FromArgb(200, 200, 200), 0.5), left, y, right, y);
        y += 8;
        DrawField(gfx, headingFont, normalFont, "Ten:", hoaDon.TenNguoiMua ?? "-", left, ref y);
        DrawField(gfx, headingFont, normalFont, "SDT:", hoaDon.SoDienThoaiNguoiMua ?? "-", left, ref y);
        DrawField(gfx, headingFont, normalFont, "Email:", hoaDon.Email ?? "-", left, ref y);
        DrawField(gfx, headingFont, normalFont, "Dia chi:", hoaDon.DiaChiNguoiMua ?? "-", left, ref y);
        y += 8;

        // ── Bảng chi tiết ──
        gfx.DrawString("CHI TIET HOA DON", headingFont, dark, new XPoint(left, y));
        y += 6;
        gfx.DrawLine(new XPen(XColor.FromArgb(200, 200, 200), 0.5), left, y, right, y);
        y += 8;

        // Header bảng
        double[] colX = { left, left + 30, left + 250, left + 310, left + 390 };
        gfx.DrawString("STT", headingFont, dark, new XPoint(colX[0], y));
        gfx.DrawString("Ten tac pham", headingFont, dark, new XPoint(colX[1], y));
        gfx.DrawString("SL", headingFont, dark, new XPoint(colX[2], y));
        gfx.DrawString("Don gia", headingFont, dark, new XPoint(colX[3], y));
        gfx.DrawString("Thanh tien", headingFont, dark, new XPoint(colX[4], y));
        y += 6;
        gfx.DrawLine(new XPen(XColor.FromArgb(180, 180, 180), 0.8), left, y, right, y);
        y += 8;

        // Rows
        for (int i = 0; i < hoaDon.ChiTiet.Count; i++)
        {
            var item = hoaDon.ChiTiet[i];
            if (y > page.Height - 120)
            {
                page = document.AddPage();
                page.Size = PdfSharpCore.PageSize.A4;
                gfx.Dispose();
                // Note: PdfSharpCore reuses gfx; re-create for new page
                // For simplicity, we'll keep items on one page in typical scenarios
                break;
            }

            gfx.DrawString((i + 1).ToString(), normalFont, XBrushes.Black, new XPoint(colX[0], y));
            var tenTacPham = item.TenTacPham ?? "N/A";
            if (tenTacPham.Length > 38) tenTacPham = tenTacPham[..35] + "...";
            gfx.DrawString(tenTacPham, normalFont, XBrushes.Black, new XPoint(colX[1], y));
            gfx.DrawString(item.SoLuong.ToString(), normalFont, XBrushes.Black, new XPoint(colX[2], y));
            gfx.DrawString(FormatCurrency(item.DonGia), normalFont, XBrushes.Black, new XPoint(colX[3], y));
            gfx.DrawString(FormatCurrency(item.ThanhTien), normalFont, XBrushes.Black, new XPoint(colX[4], y));
            y += 18;
        }

        y += 4;
        gfx.DrawLine(new XPen(XColor.FromArgb(180, 180, 180), 0.8), left, y, right, y);
        y += 12;

        // ── Tổng tiền ──
        var totalFont = new XFont("Arial", 13, XFontStyle.Bold);
        gfx.DrawString("TONG TIEN:", totalFont, dark, new XPoint(colX[3] - 80, y));
        gfx.DrawString(FormatCurrency(hoaDon.TongTienHang), totalFont, XBrushes.Black, new XPoint(colX[4], y));
        y += 24;

        // ── Thanh toán ──
        DrawField(gfx, headingFont, normalFont, "Phuong thuc TT:",
            FormatPhuongThuc(hoaDon.PhuongThucThanhToan), left, ref y);
        DrawField(gfx, headingFont, normalFont, "Trang thai TT:",
            FormatTrangThaiTT(hoaDon.TrangThaiThanhToan), left, ref y);

        // ── Footer ──
        gfx.DrawString("Hoa don ban hang noi bo - Khong thay the hoa don thue.",
            smallFont, XBrushes.Gray,
            new XRect(left, page.Height - 70, contentWidth, 15), XStringFormats.TopCenter);

        using var ms = new MemoryStream();
        document.Save(ms, false);
        return ms.ToArray();
    }

    private static void DrawField(XGraphics gfx, XFont label, XFont value,
        string labelText, string valueText, double x, ref double y)
    {
        gfx.DrawString(labelText, label, XBrushes.DarkSlateGray, new XPoint(x, y));
        gfx.DrawString(valueText, value, XBrushes.Black, new XPoint(x + 130, y));
        y += 18;
    }

    private static string FormatCurrency(decimal amount) =>
        amount.ToString("#,##0") + " VND";

    private static string FormatPhuongThuc(string? phuongThuc) => phuongThuc switch
    {
        "COD" => "Thanh toan khi nhan hang (COD)",
        "BankTransfer" => "Chuyen khoan ngan hang",
        _ => phuongThuc ?? "-"
    };

    private static string FormatTrangThaiTT(string? trangThai) => trangThai switch
    {
        "DaThanhToan" => "Da thanh toan",
        "ChoThanhToan" => "Cho thanh toan",
        "ThatBai" => "That bai",
        _ => trangThai ?? "-"
    };
}
