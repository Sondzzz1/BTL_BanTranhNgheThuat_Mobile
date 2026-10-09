# Nghiệm thu thông báo hai chiều Họa sĩ ↔ Admin

Ngày: 09/10/2026. Phạm vi: source hiện tại, ASP.NET Core/ADO.NET/SQL Server và Web React. Không thay module, không thêm SignalR hoặc notification phía client.

## A. EXISTING NOTIFICATION ARCHITECTURE

- Đã chạy `git status`, `git diff --stat`, xem diff trước khi sửa. Giữ nguyên các thay đổi sẵn có ở ArtworkDetailContent và hai ảnh upload của người dùng; không reset/restore.
- Có `dbo.ThongBao`: `MaThongBao BIGINT`, `MaTaiKhoan INT` FK tới TaiKhoan, `Loai NVARCHAR(80)`, `TieuDe NVARCHAR(200)`, `NoiDung NVARCHAR(2000)`, `LoaiDoiTuong NVARCHAR(50)`, `MaDoiTuong INT`, `DuongDan NVARCHAR(500)`, `EventKey`, `DaDoc BIT`, `NgayTao DATETIME2`, `NgayDoc DATETIME2`. Migration 010 định nghĩa EventKey(180), DB local đang dùng EventKey(100); các khóa mới ngắn hơn 100, không đổi tên/độ rộng cột.
- DAL: ThongBaoRepository và ThongBaoSql. BLL: ThongBaoBusiness/IThongBaoBusiness. HTTP: ThongBaoController `[Authorize]`. DTO trả message, metadata, đường dẫn và trạng thái đọc, không trả recipient/EventKey.
- Program.cs đã đăng ký repository và business; không cần thêm service DI.
- API sẵn có: `GET /api/thong-bao` (alias `/cua-toi`), `GET /api/thong-bao/chua-doc/dem`, `PUT /api/thong-bao/{id}/da-doc`, `PUT /api/thong-bao/da-doc-tat-ca`. Không có API nhận recipient từ client để tạo notification.
- Web: notificationService, ArtistNotificationBell dùng chung hai layout, ArtistNotifications và AdminNotifications. Sắp xếp DB `NgayTao DESC, MaThongBao DESC`, phân trang; bell fetch khi mount/mở và polling 60 giây.
- DB local có 14 Admin `VaiTro=0 AND TrangThai=1`. Trước test: 3 ARTWORK_APPROVED + 1 ARTWORK_REJECTED, 0 EventKey trùng. Đối chiếu index phát hiện DB local thiếu `UX_ThongBao_EventKey` dù migration 010 đã định nghĩa; migration 014 bổ sung index có guard, không xóa/gộp dữ liệu cũ.

## B. EVENT MATRIX BEFORE

| Event thực sự có trong source | Actor → recipient | Trước sửa |
|---|---|---|
| Tạo TacPham Pending | Artist → Admin | Thiếu |
| Gửi TacPhamChinhSua Pending | Artist → Admin | Thiếu |
| Rejected → Pending bằng sửa/gửi lại | Artist → Admin | Thiếu |
| Tạo/cập nhật ChiTietTacPham để duyệt | Artist → Admin | Thiếu |
| Tạo BanQuyen Pending | Artist → Admin | Thiếu |
| Bổ sung/sửa NeedInfo, Rejected, Legacy → Pending | Artist → Admin | Thiếu |
| Duyệt/từ chối tác phẩm | Admin → owner | Có, nhưng khóa không phân biệt các vòng gửi lại |
| Duyệt/từ chối bản sửa | Admin → owner | Endpoint chung dùng type tác phẩm, cập nhật bản sửa ngoài transaction; endpoint theo MaChinhSua thiếu notification |
| Duyệt detail | Admin → owner | Thiếu |
| Từ chối detail | Admin → owner | Có, message nhầm với duyệt tác phẩm, link không vào form content, khóa cố định |
| VERIFIED/NEED_INFO/REJECTED/REVOKED | Admin → owner | Có, transaction và revision sẵn có |
| Hide/Show/Delete tác phẩm | Admin → owner | Thiếu |
| Mở form, nháp local, upload ảnh detail, xem/đọc | Không recipient | Đúng: không phát notification |

Audit riêng bài viết: backend có Draft=0 → Pending=1 → Published=2/Rejected=3/Archived=4, có ARTICLE_PUBLISHED/REJECTED/ARCHIVED. Chưa có Artist→Admin khi gửi bài; link cũ `/artist/articles` không tồn tại trong App.tsx hiện tại. Không tự dựng lại UI bài viết trong task này. Thông báo thuộc các luồng tác phẩm/bản quyền được hoàn thiện; bài viết là module riêng cần nối UI nếu mở lại chức năng đó.

Không tìm thấy writer ThongBao cho đơn hàng/custom-art trong các BLL/DAL đã search. Giữ nguyên nghiệp vụ đơn hàng, doanh thu, chứng nhận; không tự mở rộng thông báo khách hàng.

## C. EVENT MATRIX AFTER

`A`: toàn bộ Admin active; `H`: owner lấy từ TacPham → HoaSi.MaTaiKhoan. `{tp}` là MaTacPham, `{bq}` là MaBanQuyen.

| Actor → Event | Recipient | Condition/type | Message điển hình | Link | Implemented |
|---|---|---|---|---|---|
| Artist → tác phẩm mới | A | Tạo thành công Pending / ARTWORK_SUBMITTED | Họa sĩ … vừa gửi tác phẩm mới để duyệt “…” | `/admin/art?artworkId={tp}` | YES |
| Artist → gửi bản sửa | A | Bản sửa Pending mới/nội dung thực sự thay đổi / ARTWORK_EDIT_SUBMITTED | Họa sĩ … vừa gửi yêu cầu cập nhật tác phẩm “…” | `/admin/art?artworkId={tp}&tab=edits` | YES |
| Artist → gửi lại | A | Rejected → Pending / ARTWORK_RESUBMITTED | Họa sĩ … đã gửi lại tác phẩm sau khi chỉnh sửa “…” | `/admin/art?artworkId={tp}` | YES |
| Artist → nội dung chi tiết | A | Tạo detail, hoặc gửi nội dung thay đổi, Approved/Rejected → Pending / DETAIL_SUBMITTED | Họa sĩ … vừa gửi nội dung chi tiết của tác phẩm để duyệt “…” | `/admin/artwork-details?artworkId={tp}` | YES |
| Artist → hồ sơ bản quyền | A | Tạo hồ sơ Pending / COPYRIGHT_SUBMITTED | Họa sĩ … vừa gửi hồ sơ xác minh nguồn gốc/bản quyền cho tác phẩm “…” | `/admin/copyright?copyrightId={bq}` | YES |
| Artist → hồ sơ bổ sung | A | Update/AddEvidence từ NEED_INFO/REJECTED/LEGACY về Pending / COPYRIGHT_SUBMITTED | Họa sĩ … đã gửi lại/bổ sung hồ sơ xác minh cho tác phẩm “…” | Như trên | YES |
| Admin → duyệt tác phẩm | H | Quyết định thành công / ARTWORK_APPROVED | Tác phẩm “…” đã được duyệt | `/artist/artworks/{tp}` | YES |
| Admin → từ chối tác phẩm | H | ARTWORK_REJECTED | Tác phẩm “…” chưa được duyệt. Lý do: … | Như trên | YES |
| Admin → duyệt bản sửa | H | Pending edit → Approved / ARTWORK_EDIT_APPROVED | Yêu cầu cập nhật tác phẩm “…” đã được duyệt | Như trên | YES |
| Admin → từ chối bản sửa | H | Pending edit → Rejected / ARTWORK_EDIT_REJECTED | Yêu cầu cập nhật tác phẩm “…” chưa được duyệt. Lý do: … | Như trên | YES |
| Admin → duyệt detail | H | Pending detail → Approved / ARTWORK_CONTENT_APPROVED | Nội dung chi tiết của tác phẩm “…” đã được duyệt | `/artist/artworks/{tp}/content` | YES |
| Admin → từ chối detail | H | Pending detail → Rejected / ARTWORK_CONTENT_REJECTED | Nội dung chi tiết của tác phẩm “…” chưa được duyệt. Lý do: … | Như trên | YES |
| Admin → VERIFIED | H | COPYRIGHT_VERIFIED, enum sẵn có | Hồ sơ nguồn gốc của tác phẩm “…” đã được xác minh | `/artist/artworks/{tp}/copyright` | YES, reuse |
| Admin → NEED_INFO | H | COPYRIGHT_NEED_INFO | Cần bổ sung hồ sơ bản quyền; kèm ghi chú Admin | Như trên | YES, reuse |
| Admin → REJECTED | H | COPYRIGHT_REJECTED | Hồ sơ bản quyền bị từ chối; kèm ghi chú | Như trên | YES, reuse |
| Admin → REVOKED | H | COPYRIGHT_REVOKED | Tác phẩm “…” đã bị thu hồi xác minh. Lý do: … | Như trên | YES, reuse |
| Admin → ẩn | H | Trạng thái thực sự đổi sang Hidden / ARTWORK_HIDDEN | Tác phẩm “…” đã bị ẩn khỏi hệ thống | `/artist/artworks/{tp}` | YES |
| Admin → hiện lại | H | Trạng thái thực sự đổi sang OnSale / ARTWORK_SHOWN | Tác phẩm “…” đã được hiển thị lại | Như trên | YES |
| Admin → gỡ/xóa | H | DELETE thành công / ARTWORK_REMOVED | Tác phẩm “…” đã được Admin gỡ khỏi hệ thống | `/artist/artworks` (entity đã xóa) | YES |

## D. ARTIST → ADMIN FLOW

- Tạo tác phẩm là gửi duyệt ngay trong source; không có API save-draft tác phẩm. Việc tạo TacPham và fan-out thông báo cùng transaction.
- Hai nhánh create/update bản sửa đang bán dùng cùng submit writer, lock tác phẩm; payload giống bản Pending hiện có là retry, không tạo thêm bản sửa hoặc thông báo.
- Sửa bản bị từ chối và nút gửi duyệt lại dùng transition Rejected → Pending; chỉnh một tác phẩm đã Pending không sinh thêm event resubmit.
- Detail chỉ phát event ở POST/PUT gửi nội dung hợp lệ. GET, nhập form, upload file không phát event. PUT cùng nội dung khi đã Pending là no-op; sau một lần duyệt, việc chủ động gửi lại là vòng mới.
- BanQuyen.Create vốn tạo Pending; Update/AddEvidence vốn chuyển NEED_INFO/REJECTED/LEGACY về Pending nên có notification tại đúng transition này. Upload thêm tệp khi hồ sơ đã Pending không phát thêm event. Không đổi enum hay dựng thêm bước nộp hồ sơ.

## E. ADMIN → ARTIST FLOW

- Hai endpoint duyệt tác phẩm/bản sửa dùng cùng writer atomically cập nhật TacPham, TacPhamChinhSua và thông báo. Endpoint MaChinhSua kiểm tra đúng bản sửa, không duyệt nhầm bản mới. Bản sửa bị từ chối không thay đổi nội dung/trạng thái tác phẩm; duyệt bản sửa không tự bỏ trạng thái ẩn.
- Detail approval/rejection có message và link riêng; chỉ thay đổi ChiTietTacPham, không đổi TacPham.TrangThai/MoTa.
- Bốn quyết định bản quyền giữ nguyên transaction, khóa revision, kiểm tra bằng chứng và nghiệp vụ chứng nhận sẵn có.
- Hide/show không phát lại nếu đã ở trạng thái đích. Delete phát thông báo sau DELETE trong cùng transaction; lỗi FK/rollback không để lại thông báo gỡ giả.

## F. FILES CHANGED

Đường dẫn dưới đây tương đối với workspace `C:/Users/huanp/Downloads/BTL_Mobile`; các file build sinh tự động không phải source nghiệp vụ.

| File | Lý do |
|---|---|
| BTL_BackEnd/BTL_BackEnd/Helpers/WorkflowNotifications.cs | Factory message plaintext, metadata/link, giới hạn độ dài; không đặt strings trong Controller |
| BTL_BackEnd/BTL_BackEnd/DAL/ThongBaoSql.cs | Resolve owner trong SQL, fan-out toàn bộ Admin active, stamp EventKey theo vòng nghiệp vụ |
| BTL_BackEnd/BTL_BackEnd/DAL/ThongBaoRepository.cs | Transaction khi insert độc lập; owner mark-read retry idempotent |
| BTL_BackEnd/BTL_BackEnd/Controllers/ThongBaoController.cs | Notification không thuộc account → 404, không báo success giả |
| BTL_BackEnd/BTL_BackEnd/DAL/TacPhamRepository.cs | Atomic submit/resubmit/moderation/hide/show/remove; khóa create-request/hash |
| BTL_BackEnd/BTL_BackEnd/DAL/Interfaces/ITacPhamRepository.cs | Atomic edit-review và delete-notification signatures |
| BTL_BackEnd/BTL_BackEnd/DAL/TacPhamChinhSuaRepository.cs | Upsert Pending dưới entity lock, payload giống nhau no-op; bỏ tham số timestamp không dùng |
| BTL_BackEnd/BTL_BackEnd/DAL/ChiTietTacPhamRepository.cs | Submit fan-out, pending payload no-op, review revision guard |
| BTL_BackEnd/BTL_BackEnd/DAL/CopyrightRepository.cs | Notification khi create/resubmit/bổ sung thực sự chuyển Pending |
| BTL_BackEnd/BTL_BackEnd/BLL/AdminBusiness.cs | Phân biệt review bản sửa, reuse atomic writer, hide/show/remove |
| BTL_BackEnd/BTL_BackEnd/BLL/ChiTietTacPhamBusiness.cs | Duyệt/từ chối content đúng message/link và revision |
| BTL_BackEnd/BTL_BackEnd/BLL/HoaSiBusiness.cs | Request key và trạng thái trước transition cho concurrency check |
| BTL_BackEnd/BTL_BackEnd/DTO/HoaSiDTO.cs | SubmitRequestKey server-only `[JsonIgnore]` |
| BTL_BackEnd/BTL_BackEnd/Models/TacPham.cs | RequestKey/ExpectedStatus nội bộ, không xuất JSON |
| BTL_BackEnd/BTL_BackEnd/Models/ThongBao.cs | ExpectedRevision nội bộ cho review content |
| BTL_BackEnd/BTL_BackEnd/Controllers/HoaSiController.cs | Parse UUID Idempotency-Key; không nhận recipient |
| BTL_BackEnd/BTL_BackEnd/SQL/Migrations/014_ArtworkSubmitRequestKey.sql | Key/hash cho retry create, unique per artist, sửa thiếu index EventKey local; additive, chạy lại an toàn |
| art-gallery-react/src/utils/requestKey.ts | UUID dùng Web Crypto, dùng lại theo một lần mở form |
| art-gallery-react/src/services/artistDashboardService.ts | Gửi Idempotency-Key cho create |
| art-gallery-react/src/pages/Artist/ArtistArtworks.tsx | Guard double submit, giữ request key khi retry, nút saving |
| art-gallery-react/src/services/notificationService.ts | Metadata/link whitelist theo role, repair legacy content link, broadcast mark-read refresh |
| art-gallery-react/src/components/ArtistNotificationBell.tsx | Lỗi mark-read rõ ràng, chống click trùng/stale fetch, đồng bộ badge tức thì |
| art-gallery-react/src/pages/Artist/ArtistNotifications.tsx | Điều hướng an toàn đúng role; mark-read lỗi không giả thành success |
| art-gallery-react/src/pages/Admin/AdminNotifications.tsx | Truyền context Admin cho inbox dùng chung |
| art-gallery-react/src/pages/Admin/AdminArt.tsx | Query deep-link mở tác phẩm/bản sửa đích, không phụ thuộc trang lọc hiện tại |
| art-gallery-react/src/pages/Admin/AdminArtworkDetails.tsx | Mở modal review từ artworkId, guard response cũ |
| art-gallery-react/src/pages/Admin/AdminCopyright.tsx | Mở đúng copyrightId, guard response cũ |
| BTL_BackEnd/Copyright.UnitTests/NotificationWorkflowRuntimeTests.cs | Nghiệm thu recipients/retry/concurrency/auth/transaction/cleanup thật |
| BTL_BackEnd/Copyright.UnitTests/ArtworkContentRuntimeTests.cs | Cleanup metadata event mới và serialize runtime fixture tests |
| art-gallery-react/src/components/ArtistNotificationBell.test.tsx | Admin/Artist badge, đọc, điều hướng, lỗi, empty và đồng bộ |
| art-gallery-react/src/pages/Admin/NotificationTargets.test.tsx | Kiểm tra cả 4 deep-link mở đúng entity |
| art-gallery-react/src/services/notificationService.test.ts | Account-local API, broadcast chỉ khi thành công |
| art-gallery-react/src/pages/Artist/ArtistArtworks.workflow.test.tsx | Cập nhật assertion request key, Web Crypto fixture trong JSDOM |
| docs/ARTIST_ADMIN_NOTIFICATIONS_AUDIT.md | Báo cáo A–K và bằng chứng nghiệm thu |

ArtworkDetailContent.tsx/.test.tsx là thay đổi của các task trước, được giữ nguyên, không trộn lại mô tả và detail.

## G. TRANSACTION / IDEMPOTENCY

- SQL entity `UPDLOCK,HOLDLOCK` giữ đến commit. Submit fan-out và review inbox insert dùng chính connection/transaction của workflow. Dispose/rollback hủy cả business write và inbox write khi gặp lỗi.
- Unique filtered `UX_ThongBao_EventKey` đã áp dụng local sau xác nhận 0 duplicate. Insert helper vẫn dùng range/update locks trong transaction, không dùng count-then-insert ngoài transaction.
- Revision của event mới dựa trên identity inbox đã persist cho entity, dưới entity lock; prefix theo type/entity ID, fan-out thêm suffix account. Nhờ vậy các lần approved → sửa → approved nhận thông báo mới, nhưng retry không đổi status/payload không sinh event mới. Không xóa lịch sử inbox để chống trùng.
- Create có UUID client theo từng ý định tạo; `UX_TacPham_SubmitRequestKey(MaHoaSi,SubmitRequestKey)` đảm bảo scope owner. SHA-256 giữ fingerprint payload chuẩn hóa, không tính timestamp sinh ở server. Same key/body trả lại ID cũ; same key/body khác trả lỗi, không bỏ mất thay đổi một cách im lặng.
- Khóa/header không có recipient. Body không thể bind SubmitRequestKey/ExpectedStatus. API legacy không gửi Idempotency-Key vẫn tương thích: mỗi POST là một ý định tạo mới; client muốn retry create an toàn phải dùng cùng key (Web đã làm).
- Review bản sửa và detail có trạng thái Pending/revision guard; bản đã bị xử lý không ghi notification thêm. Không thay đổi TacPham.MoTa khi duyệt detail.

## H. AUTHORIZATION

- GET/unread/mark-all luôn lấy account từ JWT, không đọc ID recipient trong body/query. DAL query/update có `WHERE MaTaiKhoan=@MaTaiKhoan`.
- Mark-one theo cả ID và account, retry của owner thành công với NgayDoc cũ giữ nguyên; account khác, kể cả Admin, nhận 404 và không thay đổi row.
- Artist mutation giữ các kiểm tra ownership/marketplace sẵn có. Admin notification recipient resolve từ entity và HoaSi ở DB; không tin MaHoaSi/recipient bất kỳ từ request body.
- Fan-out dùng role/status thật TaiKhoan, không AdminId=1 hoặc TOP 1. TOP 1 trong test chỉ để chọn actor fixture, không phải recipient production.
- Message render React text, không HTML execution; link chỉ chấp nhận các route nội bộ hiện có đúng role.

## I. UI

Giữ bell ở cả AdminLayout/ArtistLayout, unread badge, dropdown, inbox/pagination, newest-first, styles read/unread, mark-all. Mở/click không tạo notification. Khi mark-read fail, hiển thị lỗi và không giảm badge/điều hướng giả. Mark-read từ inbox phát local refresh cho header; đây chỉ là đồng bộ UI, không tạo notification. Không thêm realtime infrastructure.

Admin deep-link dùng route đã có: `/admin/art`, `/admin/artwork-details`, `/admin/copyright`, query ID mở đúng modal/tab. Artist dùng `/artist/artworks/:id`, `/content`, `/copyright`. Thông báo gỡ đưa về danh sách vì entity đã không tồn tại. Không đưa link lạ/wrong-role tới router.

## J. TEST/BUILD

Kết quả lần chạy cuối trên mã đã sửa:

| Kiểm tra | Kết quả |
|---|---|
| Backend build project test và project tham chiếu | PASS, 0 lỗi |
| Backend tests, bật cả notification runtime, artwork-content runtime và report SQL | PASS: 64/64, không skip |
| Web: 9 suites liên quan notification, deep-link và các luồng hồi quy | PASS: 48/48 |
| Web `npx tsc --noEmit` | PASS |
| Web `npm run build` | PASS |

Runtime notification dùng HTTP thật trên backend riêng `http://localhost:5284/api/` và SQL Server local HeThongBanTranh, không thay server chính 5273. Kiểm tra:

- Fan-out đúng 14 Admin active; nhận quyết định đúng owner, không account khác.
- Hai POST create đồng thời cùng UUID/body trả cùng ID, không trùng thông báo; retry giữ ID; cùng UUID/body khác trả 400.
- Gửi lại tác phẩm bị từ chối; hai yêu cầu duyệt đồng thời chỉ phát một thông báo quyết định.
- Gửi bản sửa đồng thời, từ chối theo endpoint MaChinhSua, gửi lại và duyệt theo endpoint chung; các vòng có thông báo riêng.
- Detail: nội dung rỗng trả 400 không phát event; GET không phát event; duyệt/từ chối đúng link content; gửi lại sau duyệt được thông báo mới; PUT Pending giống nhau không trùng; không đổi trạng thái/MoTa của tác phẩm.
- Bản quyền: create, NEED_INFO, sửa/bổ sung về Pending, REJECTED, gửi lại, VERIFIED, REVOKED; thêm tệp khi đã Pending không tạo thêm event. Chỉ tạo metadata evidence thử, không ghi file evidence lên disk.
- Hide/show và retry; DELETE thật thành công mới phát ARTWORK_REMOVED với link danh sách.
- Cố ý gây lỗi insert notification: bản sửa, tác phẩm và inbox cùng rollback, không để trạng thái xử lý thành công giả.
- Mark-read của owner thành công cả khi retry; Artist khác và Admin đều nhận 404 khi đọc thông báo không thuộc mình; inbox không rò sang account khác.
- Snapshot JSON của toàn bộ inbox lịch sử trước/sau test giống nhau. Cleanup chỉ các fixture có ID/key/tên GUID và owner tương ứng; giữ nguyên nhật ký append-only.

Web tests kiểm tra cả hai role, badge cập nhật từ inbox, mark-one/mark-all thành công và lỗi, empty state, chặn link không an toàn/sai role, và mở đúng tác phẩm/bản sửa/detail/bản quyền từ deep-link. Các suites hồi quy liên quan mô tả/detail, API optional detail và báo cáo cũng chạy trong 48 tests.

Lệnh tái hiện backend (PowerShell, từ workspace; cần áp dụng migration và chạy backend build tương ứng ở cổng 5284):

```powershell
dotnet build BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/notification-verified/net8.0/
$env:NOTIFICATION_RUNTIME_TESTS = '1'
$env:ARTWORK_CONTENT_RUNTIME_TESTS = '1'
$env:ADMIN_REPORT_SQL_TESTS = '1'
$env:ARTWORK_CONTENT_TEST_URL = 'http://localhost:5284/api/'
dotnet test BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-build --no-restore /p:UseAppHost=false /p:OutputPath=bin/notification-verified/net8.0/ '--logger:console;verbosity=normal'
```

Web (từ art-gallery-react):

```powershell
$env:CI = 'true'
npm test -- --watchAll=false --runInBand --runTestsByPath src/components/ArtistNotificationBell.test.tsx src/pages/Admin/NotificationTargets.test.tsx src/services/notificationService.test.ts src/pages/Artist/ArtistArtworks.workflow.test.tsx src/pages/Artist/ArtworkDetailContent.test.tsx src/pages/Admin/AdminReport.test.tsx src/components/ArtworkDetailSection.test.tsx src/pages/ArtworkDetail.optionalContent.test.tsx src/services/api.optionalDetail.test.ts --silent
npx tsc --noEmit
npm run build
```

Kiểm tra SQL sau lần chạy cuối: 0 tác phẩm fixture còn lại; inbox vẫn đúng 3 ARTWORK_APPROVED + 1 ARTWORK_REJECTED lịch sử; UX_ThongBao_EventKey tồn tại; cả hai trigger BlockUpdate/BlockDelete của nhật ký vẫn enabled.

Không đánh đồng các lần chạy trung gian lỗi với PASS: đã sửa cleanup vướng trigger nhật ký bất biến và tham số datetime thừa trước lần chạy cuối. Build còn cảnh báo NU1900 do không truy cập được metadata vulnerability của NuGet; Web còn các cảnh báo lint/dependency có sẵn. Chưa chạy browser thật/login thật, App.test toàn ứng dụng hay build Mobile; không tuyên bố các mục đó đã nghiệm thu.

## K. REMAINING RISKS

- Cần restart backend chính cổng 5273 để nạp source mới; nghiệm thu chạy server riêng 5284, không tắt dịch vụ chính của người dùng.
- Deploy database khác cần chạy migration 014 sau các migration hiện có. Script dừng nếu EventKey cũ trùng, không tự sửa dữ liệu user.
- Client ngoài Web nếu retry POST create cần gửi Idempotency-Key; không suy đoán hai tranh giống hệt nhau là cùng ý định tạo.
- Module bài viết hiện không có Artist route hoạt động; phần thiếu notification submit/link của module đó được audit riêng ở B, chưa tự dựng UI mới.
- Runtime để lại các dòng nhật ký kiểm thử append-only (NhatKyHeThong), có thông tin fixture. Không disable trigger, không xóa nhật ký bất biến. Tác phẩm, bằng chứng metadata và inbox fixture được cleanup riêng; không tạo file evidence thử lên disk.
- Chưa test bằng browser thật/đăng nhập UI thật; component tests có kiểm tra render, navigation và API error. Runtime JWT fixture ngắn hạn, không kiểm tra quy trình login/password.
- Chuông polling 60 giây, không push realtime. Admin deep-link tác phẩm reuse GET danh sách nội bộ sẵn có; danh sách rất lớn có thể tốn payload hơn một API lấy từng ID.
