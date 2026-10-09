# Audit và refactor Admin → Báo cáo

Ngày kiểm tra: 09/10/2026. Phạm vi: Web Admin + API báo cáo; không sửa Mobile, dữ liệu đơn hàng/thanh toán/hoàn trả, schema hay Dashboard.

## A. Chức năng cũ

Entry: `/admin/report` trong `art-gallery-react/src/App.tsx`; menu trong `pages/Admin/AdminLayout.tsx`.
Page: `pages/Admin/AdminReport.tsx`; service: `services/adminService.ts`; CSS chung: `pages/Admin/Admin.css`.
Backend: `Controllers/AdminController.cs` → `BLL/AdminBusiness.cs`/`IAdminBusiness` → `DAL/AdminRepository.cs`/`IAdminRepository`.
DTO: `DTO/AdminDTO.cs`, `AdminDTO_Extended.cs`, `AdminDTO_Search.cs`. Không có bảng lưu phiên báo cáo; truy vấn SQL nằm trong repository, không có stored procedure báo cáo riêng được gọi tại đây.

Các endpoint cũ bên dưới đều có tiền tố `/api/admin/`:

| Endpoint | Dữ liệu/công thức cũ | Ngày/hiển thị |
| --- | --- | --- |
| `dashboard` | Tổng `DonHang.TongTien` trạng thái 3, tổng đơn, khách, họa sĩ, tác phẩm | Toàn lịch sử; card trên trang cũ |
| `bao-cao/doanh-thu-theo-thang?nam=` | SUM(TongTien), COUNT đơn trạng thái 3 | NgayDat, theo tháng; thanh CSS |
| `bao-cao/tac-pham-ban-chay?top=` | TacPham + HoaSi + ChiTietDonHang + DonHang; SUM số lượng/đơn giá, loại tranh đặt vẽ | Toàn lịch sử; bảng Top 5 |
| `bao-cao/doanh-thu-theo-hoa-si?tuNgay=&denNgay=` | HoaSi + TacPham + ChiTietDonHang + DonHang; số tác phẩm, số bản, doanh thu | NgayDat, nhưng trang gọi không truyền ngày; bảng Top 5 |
| `bao-cao/thong-ke-trang-thai-don-hang` | Đếm trạng thái 0/1/4 gộp, 2, 3, 5; SUM tiền đơn đã giao | Toàn lịch sử; thanh CSS |
| `bao-cao/khach-hang-tiem-nang?top=` | NguoiDung + DonHang; số đơn đã giao và tổng chi tiêu | API đã triển khai, chưa được page cũ hiển thị |
| `thong-ke/tong-quan` | 4 tập dữ liệu tháng, top tranh, top khách, top họa sĩ | Năm hiện tại/toàn lịch sử; trùng truy vấn ở các API riêng |
| `thong-ke/nhanh?ngay=` | Tổng hợp ngày | NgayDat và ngày tạo tương ứng trong query cũ |
| `thong-ke/so-sanh`, `xuat-bao-cao/doanh-thu`, `xuat-bao-cao/don-hang` | BLL ném NotImplementedException | Chưa có xuất file thực tế; không thêm nút xuất giả |

Không có thư viện biểu đồ trong package.json; trang cũ dùng CSS. Không thêm dependency.

## B. Vấn đề

- 5 request nối tiếp, nhiều section cố định; bộ lọc năm chỉ lọc một section, năm lựa chọn cố định 2024–2026.
- Card Dashboard toàn lịch sử gây hiểu nhầm đang thuộc năm đã chọn.
- LEFT JOIN DonHang với điều kiện đã giao không tự loại dòng ChiTietDonHang khỏi SUM: top tranh có thể tính đơn chưa giao/hủy.
- Tổng tiền đơn chưa xét thanh toán hợp lệ, hoàn tiền; không đồng bộ với HoaSiBusiness.
- Khoảng `BETWEEN ... @DenNgay` có thể bỏ dữ liệu sau 00:00 ngày cuối. Thiếu validation hai đầu.
- Nhóm trạng thái gộp che mất đã xác nhận/yêu cầu hủy. Nhiều mapping `any` và fallback trùng lặp.
- Layout 2 cột inline, thiếu màn hình chọn loại và khoảng ngày thống nhất.
- Export/so sánh chỉ có khai báo và endpoint, không phải tính năng đã hoàn thiện.

## C–D. Luồng mới và loại báo cáo

Admin → Báo cáo → chọn loại → chọn Hôm nay/7 ngày/Tháng này/Tùy chọn → Xem báo cáo.
Tháng này tính từ ngày 1 đến hôm nay; 7 ngày gồm hôm nay và 6 ngày trước. Không tự gọi API khi thay bộ lọc.

5 loại có cơ sở source: Doanh thu, Đơn hàng, Tác phẩm bán chạy, Doanh thu họa sĩ, Khách hàng tiềm năng.
Khách hàng là đưa API/tổng hợp đã tồn tại lên bộ chọn, không phải nghiệp vụ mới.
Không thêm Tổng quan hoặc báo cáo Hoàn trả độc lập. Giá trị hoàn được thể hiện trong các báo cáo doanh số hiện có.

## E. Files changed (đường dẫn tương đối repository)

| File | Mục đích |
| --- | --- |
| `BTL_BackEnd/BTL_BackEnd/Controllers/AdminController.cs` | Route report có khoảng ngày, 400 khi thiếu/sai ngày; kế thừa Admin-only |
| `BTL_BackEnd/BTL_BackEnd/BLL/Interfaces/IAdminBusiness.cs` | Contract GetReport |
| `BTL_BackEnd/BTL_BackEnd/BLL/AdminBusiness.cs` | Validate trước khi query và gọi bộ tổng hợp |
| `BTL_BackEnd/BTL_BackEnd/BLL/AdminReportBuilder.cs` | Tổng hợp 5 loại, card và hàng kết quả; rule ngày/trạng thái/hoàn |
| `BTL_BackEnd/BTL_BackEnd/DAL/Interfaces/IAdminRepository.cs` | Contract nguồn dữ liệu theo khoảng ngày |
| `BTL_BackEnd/BTL_BackEnd/DAL/AdminRepository.cs` | SELECT có tham số, đọc nguồn trong kỳ, thanh toán không nhân dòng |
| `BTL_BackEnd/BTL_BackEnd/DTO/AdminReportDTO.cs` | Response/metric/row và read model nội bộ |
| `BTL_BackEnd/BTL_BackEnd/Helpers/RevenueRules.cs` | Điều kiện ghi nhận thanh toán dùng chung |
| `BTL_BackEnd/BTL_BackEnd/BLL/HoaSiBusiness.cs` | Gọi helper thay đúng điều kiện cũ; không đổi công thức doanh thu họa sĩ |
| `art-gallery-react/src/services/adminReportService.ts` | Typed API, loại báo cáo, preset ngày địa phương, validation |
| `art-gallery-react/src/pages/Admin/AdminReport.tsx` | Một trang filter → renderer, loading/error/empty/refresh; bỏ response cũ khi đổi filter |
| `art-gallery-react/src/pages/Admin/AdminReport.css` | CSS scoped; card 4/2/1 cột; bảng cuộn ngang |
| `art-gallery-react/src/pages/Admin/AdminReport.test.tsx` | Preset, custom, validation, lỗi, empty, refresh, đổi loại/race, render từng loại |
| `BTL_BackEnd/Copyright.UnitTests/AdminReportTests.cs` | Fixture tổng hợp từng loại, hoàn, thanh toán, số bản, 6 trạng thái, biên ngày |
| `BTL_BackEnd/Copyright.UnitTests/AdminReportHttpTests.cs` | MVC/JWT HTTP thực với BLL dữ liệu giả: 401/403/200/400 |
| `BTL_BackEnd/Copyright.UnitTests/AdminReportSqlTests.cs` | Đọc schema thực qua repository và chạy đúng SQL trên bảng #tạm để kiểm tra biên ngày/không nhân dòng |
| `docs/ADMIN_REPORT_AUDIT.md` | Audit, hợp đồng API và kết quả kiểm tra |

Các file bin/obj đã dirty trước khi làm không được khôi phục đè lên chỉnh sửa của người dùng. Mobile constants/api.ts đã dirty từ trước, không thuộc thay đổi này.

## F. API

`GET /api/admin/bao-cao/{type}?fromDate=2026-10-01&toDate=2026-10-09`

`type`: `doanh-thu`, `don-hang`, `tac-pham`, `hoa-si`, `khach-hang`.
Hai ngày bắt buộc; server chuẩn hóa về phần ngày. Ngày không parse được, thiếu ngày, từ > đến, loại không hỗ trợ: 400. Không đăng nhập: 401; role không phải Admin: 403.
`[Authorize(Roles="Admin")]` và `[AdminOnly]` có sẵn trên controller vẫn được giữ.

Response:

```json
{
  "type": "doanh-thu",
  "fromDate": "2026-10-01T00:00:00",
  "toDate": "2026-10-09T00:00:00",
  "dateBasis": "Giải thích ngày ghi nhận và phạm vi",
  "hasData": true,
  "summary": [{ "label": "Doanh thu sau hoàn", "value": 300, "format": "currency" }],
  "rows": [{ "key": "2026-10-09", "label": "09/10/2026", "orders": 1, "quantity": 3, "gross": 500, "refund": 200, "net": 300 }]
}
```

Endpoint mới là contract có phạm vi ngày, nằm trong controller/BLL/DAL hiện có. Không đổi response/default API cũ vì Dashboard và trang khác có thể đang dùng; không ép API cũ trả envelope khác. API cũ vẫn giữ nguyên hành vi legacy, **không được hiểu là mọi query thống kê toàn hệ thống đã được sửa**. Trang Báo cáo mới chỉ gọi contract mới.

## G. UI

- Bộ chọn loại, 4 preset thời gian, input ngày khi Tùy chọn; Xem báo cáo/Đặt lại/Làm mới báo cáo.
- Card theo loại: doanh thu có gộp/hoàn/sau hoàn/số đơn; đơn hàng có tổng/đã giao/đã hủy/tỷ lệ đã giao; tranh/họa sĩ/khách có số lượng/chủ thể tương ứng.
- Thanh CSS theo ngày/trạng thái/top; tối đa 10 dòng trên biểu đồ, bảng hiển thị đầy đủ. Không có chia cho 0.
- Số đơn của nhiều nhóm không cộng cơ học vì một đơn có thể chứa nhiều tranh/họa sĩ; UI có giải thích.
- Empty state: “Không có dữ liệu trong khoảng thời gian đã chọn.” Không bày các card 0 khi không có giao dịch.
- Hoàn toàn bộ vẫn là dữ liệu lịch sử có gộp và giá trị hoàn, dù sau hoàn bằng 0.
- Chống response chậm ghi đè khi đổi loại/ngày; ngày dùng lịch địa phương, không chuyển UTC gây lệch ngày.

## H. Logic ngày và doanh thu

| Loại | Ngày | Nguồn/cách tính |
| --- | --- | --- |
| Đơn hàng | DonHang.NgayDat | Đơn đặt trong kỳ, trạng thái **hiện tại**; 0 Chờ xác nhận, 1 Đã xác nhận, 2 Đang giao, 3 Đã giao, 4 Yêu cầu hủy, 5 Đã hủy theo DonHangStatus |
| Doanh thu | COALESCE(NgayGiao, NgayDat) | Giống ArtistRevenueLine.NgayGhiNhan; nhóm theo ngày |
| Tác phẩm bán chạy | Cùng ngày ghi nhận doanh thu | Nhóm MaTacPham; xếp theo số bản sau hoàn, không COUNT tác phẩm làm số bản |
| Doanh thu họa sĩ | Cùng ngày ghi nhận doanh thu | Nhóm MaHoaSi toàn hệ thống, không phải tiền đối soát/chi trả |
| Khách hàng tiềm năng | Cùng ngày ghi nhận doanh thu | Nhóm MaNguoiDung theo giá trị tranh sau hoàn |

SQL: `>= @FromDate AND < @EndExclusive`, trong đó EndExclusive = ToDate.Date.AddDays(1), tham số DateTime2. Giữ đủ 23:59:59 và loại 00:00 hôm sau. Không nối giá trị người dùng vào SQL.

Nguồn bán hàng: DonHang → ChiTietDonHang, ThanhToan; thông tin nhãn từ TacPham/HoaSi/NguoiDung. ThanhToan được GROUP BY trước khi join để không nhân dòng.
Chỉ TrangThai = DaGiao; đúng **một** thanh toán DaThanhToan hoặc HoanTien hợp lệ.
HoanTien chỉ hợp lệ khi mọi dòng đơn hoàn toàn bộ; kiểm tra trước khi loại dòng tranh đặt vẽ. Hoàn một phần lấy SoLuongDaHoan đã chốt, clamp về [0, SoLuong]. Không trừ yêu cầu hoàn đang chờ.
Gộp = SUM(SoLuong × DonGia); hoàn = SUM(số lượng đã hoàn × DonGia); sau hoàn = gộp − hoàn. Không invent chiết khấu/phí mới; giữ công thức dòng đơn của HoaSiBusiness. Tranh đặt vẽ bị loại như nguồn quản lý/báo cáo marketplace hiện có.
Hoàn sau kỳ được điều chỉnh lại kỳ ghi nhận của đơn, không chuyển sang ngày hoàn, đúng cách trang họa sĩ đang tính. Không gọi đây là dòng tiền thu/chi theo ngày.

## I. Test/build

- PASS: `dotnet build ...DoAn2_BackEnd.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/report-check/net8.0/`, 0 warning/error.
- PASS: toàn bộ `Copyright.UnitTests`, **43/43**, không skip, có bật `ADMIN_REPORT_SQL_TESTS=1`; SQL thực chỉ SELECT và tạo/ghi bảng #tạm theo connection.
- PASS: test HTTP JWT thực: anonymous 401, NguoiDung/HoaSi 403, Admin 200, thiếu/sai/ngược ngày và loại sai 400. BLL được thay dữ liệu giả trong HTTP test; truy vấn DB thật kiểm riêng.
- PASS: unit fixture cả 5 loại, nhiều bản 5/hoàn 2 → còn 3, độc bản 1, đơn nhiều họa sĩ không đếm trùng tổng; hoàn toàn bộ, chưa trả tiền, thanh toán trùng, đơn hủy, tranh đặt vẽ.
- PASS: SQL fixture NgayDat khác NgayGiao, legacy NgayGiao null, 23:59:59 được tính, 00:00 hôm sau bị loại; thanh toán trùng không nhân dòng.
- PASS: `npx tsc --noEmit`.
- PASS: `npm run build`; còn cảnh báo lint cũ tại App/Artist/AdminAuthors và Browserslist cũ, không phát sinh lỗi build report.
- PASS: React **9/9** (`npm test -- --watchAll=false --runInBand --testPathPattern=AdminReport.test`): preset hôm nay/7 ngày/tháng; custom; cùng ngày/ngược ngày; empty/error/loading; đổi loại, làm mới, response cũ; renderer của 5 loại. Có cảnh báo deprecation từ phiên bản Testing Library hiện có.
- NOT TESTED: thao tác thủ công trên browser đang đăng nhập và kiểm tra thị giác ở từng viewport; responsive đã triển khai CSS 4/2/1 cột, chưa khẳng định QA ảnh chụp.

Lưu ý môi trường: build mặc định ban đầu bị DLL của server đang chạy giữ file; đã build sang output riêng, không dừng server của người dùng. Jest/vstest trong sandbox gặp quyền cache/kết nối testhost, chạy lại ngoài sandbox thành công. Một lượt test output thiếu độ sâu thư mục làm các test cũ không tìm được source; chạy lại với `bin/report-verified/net8.0/` đúng cấu trúc đã PASS toàn bộ. Restore có NU1900 do không tải được dữ liệu vulnerability NuGet; không phải lỗi compile/test.

Để chạy SQL test: đặt `$env:ADMIN_REPORT_SQL_TESTS='1'`, chạy `dotnet test BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/report-verified/net8.0/` từ repository. Không bật biến này thì SQL test được đánh dấu skip rõ ràng.

Sau khi nhận code, cần khởi động lại backend và tải lại Web để server đang chạy dùng endpoint mới. Chưa thay tiến trình server đang chạy bằng bản build mới.
