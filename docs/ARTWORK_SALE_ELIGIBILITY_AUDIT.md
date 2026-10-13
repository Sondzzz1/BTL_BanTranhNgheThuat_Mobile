# Nghiệm thu: duyệt nội dung tác phẩm không đồng nghĩa được phép bán

Ngày: 12/10/2026. Source hiện tại, ASP.NET Core/.NET 8, ADO.NET/SQL Server, React Web và Expo Mobile. Đã audit trước khi sửa, giữ các thay đổi có sẵn của phần bằng chứng; không reset/restore. Không tạo migration, không đổi enum hay tự sửa dữ liệu cũ.

## A. CURRENT SALE RULE

Trước sửa:

- `TacPham.TrangThai=1` (`TacPhamStatus.OnSale`) được coi là vừa duyệt vừa đang bán. Các trạng thái thật: Pending=0, OnSale=1, Hidden=2, Rejected=3, Deleted=99.
- Marketplace chỉ lấy tác phẩm không thuộc yêu cầu đặt vẽ và trạng thái 1, đồng thời loại tác phẩm có `BanQuyen.BiChanBan=1`.
- Thêm giỏ và tạo đơn kiểm tra trạng thái tác phẩm, tồn kho và **không có hồ sơ chặn bán**. Không có hồ sơ quyền cũng qua được điều kiện `NOT EXISTS` này.
- Cập nhật giỏ chỉ kiểm tra trạng thái 1, tồn kho, commission/ownership; GET giỏ không trả trạng thái đủ điều kiện thanh toán.
- Mobile detail chủ yếu dùng `SoLuong>0` để hiển thị/thực hiện mua. Checkout mua ngay kiểm tra tồn kho; cart checkout dùng các dòng được chọn.
- Trạng thái quyền thật trong BanQuyen: Pending=0, NeedInfo=1, Verified=2, Rejected=3, Disputed=4, Legacy=5, Revoked=6. `BiChanBan` và `CanCuSuDung` nằm ở BanQuyen, không phải TacPham.

## B. ROOT PROBLEM

Approved + rights missing/Pending/NeedInfo vẫn có thể thêm giỏ hoặc tạo đơn khi không có cờ chặn bán. Cờ chặn là một điều kiện phủ định, không thay được điều kiện quyền đã được xác minh.

Các điểm cần harden: `POST /api/gio-hang/them`, `PUT /api/gio-hang/cap-nhat/{itemId}`, `GET /api/gio-hang`, `POST /api/don-hang/tao` cho cả CART/BUY_NOW, public detail/list, submit tác phẩm và submit bản sửa. Trước sửa form tạo tác phẩm chưa yêu cầu căn cứ/xác nhận quyền sử dụng.

Web customer routes `/artworks`, `/cart`, `/checkout` đang comment trong App.tsx; luồng khách đang hoạt động là Mobile. Vẫn sửa các màn Web đó để không để lại logic chỉ kiểm tra stock nếu bật lại. Không tự bật route.

## C. FINAL RULE

CanSell được tính tập trung tại `ArtworkSalePolicy.Evaluate` từ dữ liệu DB mới nhất:

1. Không phải tác phẩm nội bộ của yêu cầu đặt vẽ.
2. `TacPham.TrangThai == TacPhamStatus.OnSale (1)`; đây là **đã duyệt nội dung**, không tự là quyền bán.
3. Có BanQuyen, khai báo tối thiểu đầy đủ: tác giả/nguồn gốc không rỗng, căn cứ thuộc enum có sẵn; nguồn gốc tương ứng có đủ field bắt buộc.
4. `BanQuyen.TrangThai == Verified (2)`; căn cứ không phải Insufficient (5).
5. `BanQuyen.BiChanBan == false`.
6. Khai báo phát hành không mâu thuẫn: độc bản có số lượng ban đầu 1, không có tồn kho >1; nhiều bản có số lượng ban đầu biết được thì phải >=2. Không suy luận độc bản từ tồn kho 1; số lượng ban đầu chưa đối soát của dữ liệu nhiều bản không tự đổi loại.
7. `TacPham.SoLuong>0`, giá hiện tại >0.

Public độc lập: tác phẩm trạng thái 1, không thuộc commission được xem dù rights thiếu/Pending/NeedInfo/Rejected/Revoked/blocked. Hidden/Rejected/Deleted của **tác phẩm** không public. Thu hồi với lựa chọn ẩn vẫn dùng hành động ẩn có sẵn; thu hồi không ẩn giữ record public nhưng không mua được.

| Tác phẩm | Quyền | Chặn bán / stock | Public | CanSell |
|---|---|---|---|---|
| Đã duyệt | Thiếu | Stock >0 | Có | Không |
| Đã duyệt | Pending/NeedInfo | Stock >0 | Có | Không |
| Đã duyệt | Verified, khai báo hợp lệ | Không chặn, stock >0 | Có | Có |
| Đã duyệt | Verified | Chặn hoặc hết hàng | Có | Không |
| Đã duyệt | Rejected/Disputed/Legacy/Revoked | Bất kỳ | Có nếu không bị ẩn tác phẩm | Không |
| Hidden/Rejected/Deleted/Pending | Verified | Bất kỳ | Không | Không |

## D. BACKEND CHANGES

Các đường dẫn dưới tương đối với workspace `C:/Users/huanp/Downloads/BTL_Mobile`:

| File/hàm | Thay đổi |
|---|---|
| BTL_BackEnd/BTL_BackEnd/Helpers/ArtworkSalePolicy.cs | Rule duy nhất, reason/message trung tính, EnsureCanSell |
| BTL_BackEnd/BTL_BackEnd/DAL/ArtworkSaleSql.cs | JOIN snapshot TacPham/BanQuyen, batch tối đa 500 ID/query, locks trong transaction, Populate/EnsureDeclared |
| BTL_BackEnd/BTL_BackEnd/DTO/ArtworkSaleResponse.cs | Base DTO canSell/saleReason/saleMessage, snapshot nội bộ JsonIgnore |
| BTL_BackEnd/BTL_BackEnd/Models/TacPham.cs | Snapshot/quyền/khai báo submit nội bộ, không thêm column, không xuất JSON |
| BTL_BackEnd/BTL_BackEnd/DTO/HoaSiDTO.cs | Input căn cứ/xác nhận/ký sự nguồn gốc tối thiểu; output sale và rights status |
| BTL_BackEnd/BTL_BackEnd/BLL/HoaSiBusiness.cs | Validate khai báo trước create, map sale, tên trạng thái 1 thành Đã duyệt nội dung |
| BTL_BackEnd/BTL_BackEnd/DAL/TacPhamRepository.cs | Public không lọc bằng quyền; batch populate; create TacPham + BanQuyen Pending + notifications cùng transaction; hash retry gồm khai báo; resubmit/restore phải có khai báo; không sửa nguồn gốc hồ sơ Verified qua form basic |
| BTL_BackEnd/BTL_BackEnd/DAL/TacPhamChinhSuaRepository.cs | Trước Pending edit kiểm tra khai báo tối thiểu trong cùng transaction |
| BTL_BackEnd/BTL_BackEnd/BLL/AdminBusiness.cs | Map sale/rights, label duyệt nội dung; danh sách nội bộ không dùng bộ lọc public, mở được cả tranh Pending |
| BTL_BackEnd/BTL_BackEnd/Controllers/PublicController.cs | Public DTO/list/detail/suggestions/portfolio trả sale flags; phân biệt available/sold/unavailable |
| BTL_BackEnd/BTL_BackEnd/DTO/KhachHangDTO.cs | Stock, sale flags và CanCheckout trên dòng giỏ |
| BTL_BackEnd/BTL_BackEnd/DAL/Interfaces/IGioHangRepository.cs | GetView và UpdateQuantityTransactional |
| BTL_BackEnd/BTL_BackEnd/DAL/GioHangRepository.cs | Add/update kiểm tra rule trong transaction; GET batch view giữ dòng không khả dụng |
| BTL_BackEnd/BTL_BackEnd/BLL/KhachHangBusiness.cs | Reuse cart view/update writer, tổng giỏ chỉ cộng dòng đủ điều kiện |
| BTL_BackEnd/BTL_BackEnd/DAL/DonHangRepository.cs | CART/BUY_NOW revalidate snapshot quyền/stock dưới lock trước insert; rollback toàn bộ nếu bất hợp lệ |
| BTL_BackEnd/BTL_BackEnd/DAL/CopyrightRepository.Advanced.cs | Message Verified chỉ nói đủ điều kiện mở bán khi rule sale cùng transaction đạt |

Submit mới bắt buộc `CanCuSuDung`, `XacNhanQuyenSuDung=true`, `KhaiBaoNguonGoc` không rỗng/<=500, cùng validation loại nguồn gốc hiện có. Backend tự resolve tác giả/account từ owner, không nhận arbitrary recipient. Khai báo thành BanQuyen Pending cùng tác phẩm; upload/duyệt bằng chứng tiếp tục qua module bản quyền hiện có. Không ghi Verified từ create/approve tác phẩm.

Source không có draft workflow TacPham. Không thêm enum/schema nháp. Lưu nháp chưa khai báo: **N/A**, không giả lập bằng Hidden/Pending. Với tác phẩm cũ bị từ chối thiếu hồ sơ, họa sĩ phải vào route nguồn gốc để khai báo trước khi gửi lại. Save form local không đổi DB.

## E. CART

- Add khóa tác phẩm/quyền và dùng rule trước khi tạo/tăng dòng giỏ. Thiếu quyền, chưa xác minh, blocked, hết hàng, non-public đều bị business conflict (HTTP 409), không thêm item.
- Update xác nhận dòng thuộc giỏ actor và kiểm tra quyền/stock trong transaction. Không tin ID user từ body.
- GET join thông tin tranh/họa sĩ, batch quyền; giữ dòng không khả dụng, trả canSell, canCheckout, saleReason/message và soLuongTon. Không tự xóa giỏ.
- Số lượng dòng vượt stock: CanCheckout=false, lý do INSUFFICIENT_STOCK. Tổng giỏ loại các dòng không đủ điều kiện; vẫn hiển thị giá/tạm tính dòng để người dùng hiểu.
- Mobile tự bỏ chọn dòng mất eligibility khi tải lại, không cho chọn lại; chọn tất cả chỉ gồm dòng khả dụng. User vẫn được xóa dòng qua workflow hiện có.

## F. CHECKOUT

`CreateTransactional` giữ transaction Serializable hiện có. Load các dòng do actor sở hữu và giá thật; batch snapshot TacPham/BanQuyen với UPDLOCK/HOLDLOCK đến commit, kể cả range quyền chưa tồn tại. Kiểm tra rule cho **mọi dòng** và số lượng trước insert DonHang/ChiTietDonHang/ThanhToan. Trừ stock có điều kiện atomic; thất bại rollback cả đơn/stock/cart/payment.

CART và BUY_NOW cùng rule. Client không gửi canSell để server tin. Nếu quyền đã thu hồi trước request tạo đơn, bị chặn ngay dù trang checkout cũ vẫn hiển thị hợp lệ. Hai transaction đồng thời được tuần tự hóa bởi lock: không có khoảng đọc quyền cũ ngoài transaction rồi tạo đơn sau một revoke đã commit. Không tạo N+1 quyền theo từng line.

Đơn đã tạo trước thu hồi **không tự hủy/đổi trạng thái**. Trạng thái đơn, payment, refund, revenue và rule giao hàng/chứng nhận vẫn riêng.

## G. PUBLIC API

Public responses thêm `canSell`, `saleReason`, `saleMessage`. Reason gồm ARTWORK_NOT_APPROVED, RIGHTS_NOT_DECLARED, RIGHTS_PENDING, RIGHTS_NEED_INFO, RIGHTS_REJECTED, RIGHTS_REVOKED, RIGHTS_NOT_VERIFIED, RIGHTS_INCOMPLETE, BLOCKED_FROM_SALE, OUT_OF_STOCK, PUBLICATION_DECLARATION_INVALID, INVALID_PRICE, COMMISSION_ARTWORK, AVAILABLE.

Message Pending/NeedInfo nói đang xác minh/bổ sung. Rejected/Revoked/blocked dùng “Tác phẩm hiện không khả dụng để mua”, không kết luận pháp lý nặng. Không trả evidence, actor kiểm duyệt hay ghi chú riêng qua DTO sale. Query batch tránh đọc BanQuyen riêng cho từng artwork trên danh sách.

## H. ARTIST UI

- ArtistArtworks đổi nhãn trạng thái 1 thành “Đã duyệt nội dung”, hiển thị trạng thái kinh doanh riêng và lời nhắc chưa mở bán; có nút đúng route `/artist/artworks/:id/copyright`.
- Form create thêm căn cứ, khai báo và checkbox xác nhận; frontend validate rõ ràng, backend vẫn là lớp bắt buộc. Sau tạo bổ sung bằng chứng tại hồ sơ có sẵn.
- ArtworkDetailManagement có panel sale và link quyền, không nhầm số tồn kho với quyền bán.
- Các thay đổi upload nhiều bằng chứng của task trước giữ nguyên.

Files: `art-gallery-react/src/pages/Artist/ArtistArtworks.tsx`, `ArtworkDetailManagement.tsx`, `services/artistDashboardService.ts`.

## I. ADMIN UI

Reuse modal AdminArt, không redesign lớn. Ba vùng: Kiểm duyệt tác phẩm, Nguồn gốc & quyền sử dụng (status riêng), Trạng thái kinh doanh (được mở bán/chưa đủ điều kiện + message). Duyệt tác phẩm không ghi Verified.

Files: `art-gallery-react/src/pages/Admin/AdminArt.tsx`, `AdminArtistArtworks.tsx`, `services/adminService.ts`.

Các màn customer Web đang tắt route cũng được harden: `pages/ArtworkDetail.tsx` fetch detail mới để không dựa context cũ, disable mua khi canSell không true; `pages/Cart.tsx`, `Checkout.tsx`, `hooks/useCart.ts`, `services/artworkService.ts`, `cartService.ts`, `types/index.ts` giữ sale flags, đánh dấu không khả dụng và chặn thanh toán. Không bật lại routes.

## J. MOBILE

Files: `art-gallery-mobile/types/product.ts`, `types/cart.ts`, `utils/saleEligibility.ts`, `app/products/ProductDetailScreen.tsx`, `app/tabs/CartScreen.tsx`, `app/CheckoutScreen.tsx`.

- Quyền mua lấy từ boolean backend, không tự tính lại quyền theo copyright optional. canSell thiếu/false fail closed.
- Detail vẫn xem được, có message; không render thanh Mua ngay/Thêm vào giỏ khi không đủ điều kiện, handlers cũng guard.
- Cart không cho chọn dòng invalid, không tính vào tổng lựa chọn; checkout kiểm tra lại response mới của buyNow/cart và hiển thị lỗi backend nếu trạng thái đổi sau đó.
- Optional detail/copyright 404 dùng fallback hiện có, không làm crash cả trang. Luồng add/update/order service vẫn gửi nghiệp vụ chính, không tạo thông báo phía client.
- Giữ nhãn chỉ độc bản của task trước và cho xem tranh hết hàng.

## K. NOTIFICATIONS

Reuse ThongBao/EventKey/transaction hiện có. Tạo tác phẩm và khai báo quyền Pending phát hai event nghiệp vụ riêng cho toàn bộ Admin active, không spam theo field. Create retry cùng key/body không tạo lại entity/hồ sơ/thông báo.

Verified chỉ gửi “đã hoàn tất xác minh và đủ điều kiện mở bán” khi snapshot sale hiện tại đạt. Nếu chưa duyệt nội dung/hết hàng/điều kiện khác chưa đạt, thông báo xác minh nói tác phẩm chưa đủ điều kiện mở bán. NeedInfo/Rejected/Revoked và recipient/idempotency giữ workflow có sẵn. Runtime notification regression đã đạt.

CanSell không được dùng để cấp chứng nhận. Ownership/certificate helpers không sửa: vẫn xét độc bản thực sự, verified, delivered, paid và ownership handoff. Không tự chuyển copyright cho buyer. Runtime xác minh khi chưa có giao hàng/thanh toán không phát sinh chứng nhận.

## L. OLD DATA AUDIT

DB local HeThongBanTranh, audit read-only: 14 marketplace artworks trạng thái 1, **11 thiếu hồ sơ BanQuyen**, 2 có quyền Verified không chặn (chưa kết luận cả hai đều bán được vì còn stock/khai báo). Ngoài ra 1 tác phẩm trạng thái Rejected và 2 Deleted thiếu hồ sơ.

Sau test vẫn đúng 11 Approved thiếu rights. Không set Verified hàng loạt, không cập nhật blocked hàng loạt, không xóa tranh/giỏ/đơn người dùng. Rule mới được đánh giá lúc đọc/mua, không viết lại trạng thái dữ liệu cũ.

Không migration: TrangThai, SoLuong, SoLuongBanDau, LaTacPhamDocBan, BanQuyen.TrangThai/CanCuSuDung/BiChanBan đã đủ. Không tạo numbering mới/trùng.

## M. TESTS

| Kiểm tra cuối | Kết quả |
|---|---|
| Backend build (output riêng, không kill server đang lock) | PASS, 0 lỗi |
| Backend toàn bộ, bật sale + content + notification + report SQL runtime | PASS 81/81, không skip |
| Web 11 suites liên quan và hồi quy | PASS 72/72 |
| Mobile JSX/helper/service tests | PASS 12/12 |
| Web `npx tsc --noEmit` | PASS |
| Mobile `npx tsc --noEmit` | PASS |
| Web `npm run build` | PASS, còn cảnh báo có sẵn |
| Source `git diff --check` | PASS |

Backend mới: `ArtworkSalePolicyTests.cs` (16 cases) và `ArtworkSaleRuntimeTests.cs` (1 scenario nhiều assertion thật). Điều chỉnh fixture `ArtworkContentWorkflowTests.cs`, `ArtworkContentRuntimeTests.cs`, `NotificationWorkflowRuntimeTests.cs` để dùng khai báo bắt buộc và cleanup BanQuyen fixture. Web mới `pages/SaleEligibility.test.tsx` và thêm cases vào `ArtistArtworks.workflow.test.tsx`. Mobile mở rộng `tests/product-release-labels.test.cjs`, tải utility thực từ source.

Covered: artwork/rights statuses, thiếu khai báo submit bị backend từ chối, public Approved/Pending vẫn hiển thị, verified đủ điều kiện mới bán, blocked/stock, rejected không public, đúng owner, quyền revoked sau mở checkout chặn mới, giữ đơn cũ, UI enabled/disabled, Pending message, optional 404, invalid cart, backend error, độc bản/nhiều bản, mô tả/detail, thông báo, báo cáo, hóa đơn, certificate security.

Không đánh đồng các lần chạy trung gian lỗi với PASS: đã điều chỉnh JWT fixture cho claim VaiTro thật và cập nhật test create khai báo trước lần chạy cuối. NU1900 do metadata NuGet không truy cập được; Web còn lint/dependency cảnh báo có sẵn, không có lỗi biên dịch.

Lệnh backend (PowerShell từ workspace; cần server nghiệm thu riêng 5284 build tương ứng):

```powershell
dotnet build BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/sale-final/net8.0/
$env:SALE_RUNTIME_TESTS = '1'
$env:ARTWORK_CONTENT_RUNTIME_TESTS = '1'
$env:NOTIFICATION_RUNTIME_TESTS = '1'
$env:ADMIN_REPORT_SQL_TESTS = '1'
$env:ARTWORK_CONTENT_TEST_URL = 'http://localhost:5284/api/'
dotnet test BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-build --no-restore /p:UseAppHost=false /p:OutputPath=bin/sale-final/net8.0/
```

Web: `npx tsc --noEmit`, `npm run build`, `CI=true npm test -- --watchAll=false --runInBand --runTestsByPath` với SaleEligibility, ArtistArtworks.workflow, ArtistCopyright, NotificationTargets, ArtworkDetail.optionalContent, ArtworkDetailContent, ArtworkDetailSection, api.optionalDetail, AdminReport, ArtistNotificationBell, notificationService. Mobile: `npx tsc --noEmit`, `node tests/product-release-labels.test.cjs`.

## N. RUNTIME DB

**PASS**, HTTP thật qua backend riêng localhost:5284, SQL Server local. Customer/account/cart/order là fixture riêng; chỉ dùng artist/admin active làm actor cho tác phẩm GUID riêng. Không dùng giỏ thật của user.

Scenario chứng minh:

1. Submit thiếu căn cứ/xác nhận/khai báo → 400, không tạo artwork.
2. Create có khai báo → BanQuyen Pending. Duyệt artwork không đổi quyền: public 200/canSell=false; add cart 409.
3. Fixture legacy missing rights → public 200/canSell=false, add 409, gửi duyệt lại bị từ chối; khai báo qua module hiện có mới gửi lại được.
4. NeedInfo → public nhưng không mua; bổ sung về Pending và cung cấp hai evidence metadata.
5. Verify khi artwork còn Pending không gửi thông báo đủ điều kiện bán, không có certificate. Duyệt nội dung sau đó → canSell=true.
6. Block, stock=0, rejected artwork đều chặn. Đủ điều kiện → BUY_NOW tạo đơn và trừ đúng stock; add cart thành công.
7. Revoke không ẩn sau GET cart hợp lệ → public false; add/update/CART/BUY_NOW 409; không tạo đơn mới, stock/cart giữ nguyên, đơn cũ vẫn trạng thái ban đầu.

Sau cleanup so sánh JSON toàn bộ TacPham, BanQuyen, GioHang, ChiTietGioHang, DonHang, ChiTietDonHang, ThanhToan, ThongBao, NguoiDung, TaiKhoan, LichSuSoHuu, ChungNhan với trước fixture: giống nhau. Read-only cuối: 0 artwork fixture, 0 account fixture; cả hai trigger BlockUpdate/BlockDelete của audit vẫn enabled.

Chỉ xóa fixture theo ID + tên GUID + owner, không disable trigger/xóa nhật ký bất biến. Runtime để lại nhật ký audit append-only của fixture (actor artist/admin có sẵn); không ghi evidence file thử lên disk. Không tự hủy đơn cũ.

## O. REMAINING RISKS

- Cần restart/rebuild backend chính cổng 5273 và tải lại Web/Mobile để áp dụng source. Nghiệm thu dùng server riêng 5284, không tắt dịch vụ chính. Không cần migration.
- 11 tranh Approved thiếu rights sẽ vẫn xem được nhưng không mua được sau deploy. Họa sĩ cần khai báo, bổ sung bằng chứng và Admin xác minh thật; không tự hợp thức hóa dữ liệu cũ.
- Client/backend phiên bản cũ phải cập nhật cùng rollout. Frontend mới fail closed khi API chưa trả canSell/canCheckout; backend mới vẫn chặn khách cũ ở API mua.
- Chưa test bằng browser thật, đăng nhập mật khẩu thật hay device/emulator iOS/Android; đã test JSX/JSDOM, TypeScript, build Web và HTTP/SQL thực. Không tuyên bố native binary đã build.
- Lock serializable bảo đảm state/stock, nhưng tải đồng thời cao có thể chờ lock/deadlock như kiến trúc SQL hiện có; transaction rollback, không có false order. Chưa benchmark tải cao.
- Nhật ký fixture append-only được giữ theo thiết kế; không xóa để tạo ấn tượng DB hoàn toàn không có thêm audit entry.
- Admin hard-delete của artwork có hồ sơ quyền vẫn chịu FK như trước; không cascade xóa lịch sử quyền để làm nút delete hoạt động. Artist soft-delete/ẩn hiện có vẫn dùng được.
- Các output bin/obj đã được Git theo dõi được giữ lại, không restore/delete dữ liệu tracked; output nghiệm thu bổ sung không tracked có thể build lại. Không commit/push trong task.
