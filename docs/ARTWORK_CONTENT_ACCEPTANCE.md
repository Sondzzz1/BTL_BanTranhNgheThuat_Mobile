# Nghiệm thu tách TacPham.MoTa và ChiTietTacPham

Ngày 09/10/2026. Tiếp nối triển khai đã commit tại `ed90fec`, không thiết kế lại module.
Đây là báo cáo nghiệm thu mới nhất; báo cáo `ARTWORK_DESCRIPTION_DETAIL_AUDIT.md` giữ lại lịch sử lần sửa trước.

## A. SOURCE AUDIT

Đã chạy `git status --short`, `git diff --stat`, `git diff` đầu task: tất cả rỗng, working tree sạch. Các thay đổi hợp lý của lần trước đã commit, không reset/restore/checkout. Audit gồm form/services, controller, BLL, DAL, public SQL, Admin, Mobile và tests. Các thay đổi bin/obj sau build là output tự sinh, không phải chỉnh nghiệp vụ.

| Đường ghi | Source/hàm | Miền dữ liệu |
| --- | --- | --- |
| Thêm tác phẩm | `ArtistArtworks.handleSubmit` → `HoaSiController.TaoTacPham` → `HoaSiBusiness.TaoTacPham` → `TacPhamRepository.Create` | Chỉ TacPham; MoTa được trim |
| Sửa tác phẩm | `HoaSiBusiness.CapNhatTacPham` | TacPham hoặc TacPhamChinhSua chờ duyệt, không chạm ChiTietTacPham |
| Áp dụng sửa cơ bản | `AdminBusiness.DuyetTacPham/DuyetTacPhamChinhSua` | Áp dụng MoTa và thông tin cơ bản, không chạm detail |
| Thêm chi tiết | `ArtworkDetailContent.handleSubmit` → `ChiTietTacPhamController.TaoChiTiet` → BLL → repository Create | Chỉ ChiTietTacPham, Pending |
| Sửa chi tiết | `ChiTietTacPhamBusiness.CapNhatChiTiet` → repository Update | Chỉ detail, đưa về Pending |

Search toàn source với MoTa/ThongTinBosung/NoiDung/ChiTietTacPham và mapping description/detail: không còn mapping hoạt động từ **TacPham.MoTa** sang ChiTietTacPham hoặc chiều ngược lại. `ContentBusiness` cũ vẫn có `NoiDungText = request.MoTa`: đó là DTO của module **NoiDung** lịch sử, không phải TacPham.MoTa, và controller `/api/noi-dung` đã khóa tất cả verb với 410; không tái kích hoạt hay xóa module này.

Nguồn gốc sáng tạo, tác giả/tác phẩm gốc và độc bản/nhiều bản vẫn thuộc TacPham; không phải điều kiện tự tạo detail. Kích thước/chất liệu trong DTO detail là dữ liệu kỹ thuật tham chiếu TacPham theo convention có sẵn, không dùng để chứng minh có nội dung mới. DB không có trigger trên TacPham.

Gap đã sửa ở lần nghiệm thu này:

- Repository bắt SQL duplicate key 2601/2627, trả lỗi nghiệp vụ thay vì 500 khi tạo đồng thời. Giữ unique index `UX_ChiTietTacPham_MaTacPham` có sẵn, không thay schema.
- Form chi tiết có khóa submit bằng ref và nút disabled trong lúc gửi/upload; không gửi lặp trong cùng phiên form.
- Web/Mobile không console.error/warn cho **GET public detail 404** dự kiến; không che lỗi 403/500 hay 404 của tác phẩm chính.
- Web giữ mô tả cơ bản khi detail 404 và không làm hỏng toàn trang; xóa gallery của artwork trước khi tải artwork mới.
- Mobile không render khung nội dung chi tiết khi API không trả detail.

## B. INVARIANTS VERIFIED

- PASS runtime: tạo artwork với MoTa → TacPham có record mới, ChiTietTacPham COUNT=0.
- PASS unit + runtime: sửa MoTa khi có detail riêng → full-row JSON snapshot của detail giữ nguyên, gồm trạng thái/ngày duyệt/ID/nội dung/ảnh.
- PASS unit + runtime: tạo/sửa detail → MoTa giữ nguyên.
- Artwork đang Approved: họa sĩ sửa mô tả vào TacPhamChinhSua; MoTa public cũ giữ nguyên **đến khi Admin duyệt sửa cơ bản**. Sau duyệt, MoTa mới có hiệu lực. Không bỏ qua business rule sẵn có này.

## C. APPROVAL FLOW

TacPham: tạo → Pending (0); Admin duyệt → OnSale (1), từ chối → Rejected (3). Bản sửa của tác phẩm đang bán được duyệt riêng tại TacPhamChinhSua và không duyệt detail.

ChiTietTacPham: tạo → Pending (0); Admin duyệt → Approved (1), từ chối → Rejected (2). Sửa approved/rejected → Pending, xóa lý do/ngày/người duyệt cũ; không đổi trạng thái TacPham.

| CASE | Trạng thái | Kết quả runtime |
| --- | --- | --- |
| A | Artwork Approved, không có detail | Artwork/MoTa 200; detail 404 |
| B | Artwork Approved, detail Pending | Artwork/MoTa 200; detail 404; Artist/Admin đọc private 200 |
| C | Cả hai Approved | Artwork/MoTa 200; detail 200 với câu chuyện riêng |
| D | Artwork Approved, detail Rejected | Artwork/MoTa 200; detail 404; Artist vẫn đọc/sửa được |
| E | Artwork Hidden/Rejected, detail Approved | Cả artwork và public detail 404 |

Rule snapshot: chỉ có một detail/artwork, không có version. Sửa approved làm pending, **nội dung public cũ biến mất ngay** cho đến khi duyệt lại. Không tạo thêm bảng version.

## D. API FLOW

Artist (JWT role HoaSi): `GET/POST/PUT /api/hoa-si/tac-pham/{id}/chi-tiet`, không dùng public API. GET controller kiểm MaHoaSi; ghi BLL + DAL kiểm ownership và loại marketplace. Runtime họa sĩ khác GET/POST/PUT → 403; anonymous private GET → 401; HoaSi gọi Admin → 403.

Admin (JWT role Admin): `GET /api/admin/chi-tiet-tac-pham/{id}` và danh sách chờ duyệt đọc Pending; `PUT /api/admin/chi-tiet-tac-pham/{id}/duyet` chỉ duyệt detail (và thông báo nội bộ). Không đổi MoTa/trạng thái TacPham. AdminArt tiếp tục hiện mô tả cơ bản ở hồ sơ tác phẩm, AdminArtworkDetails chỉ duyệt nội dung riêng; các label đã đúng, không redesign.

Public: artwork chính là **`GET /api/tranh/{id}`**, không phải `/api/public/tranh/{id}`. Optional detail là `GET /api/public/tac-pham/{id}/chi-tiet`; chỉ Approved và artwork đủ điều kiện marketplace được trả. Không có/không được duyệt trả 404.

## E. MOBILE/WEB BEHAVIOR

Có approved detail: mô tả từ TacPham và nội dung/ảnh bổ sung từ detail hiển thị riêng. Pending/rejected/không tồn tại: artwork và mô tả vẫn hiện; Web không generic error page, Mobile không card rỗng/thông báo “chưa có”. HTTP 404 có thể vẫn hiện trong Network/console của trình duyệt; interceptor không ghi thêm lỗi ứng dụng nghiêm trọng.

Web đã có test rendered **toàn trang**: artwork service trả dữ liệu, optional detail 404 → tên, mô tả và nút giỏ hàng vẫn hiện. Mobile đọc source và kiểm TypeScript; chưa kiểm thao tác bằng thiết bị/simulator.

## F. OLD DATA AUDIT

Query SELECT-only: `BTL_BackEnd/BTL_BackEnd/SQL/Audits/ArtworkDescriptionDetail.sql`, đã chạy lại trên HeThongBanTranh sau runtime tests.

Tổng **1** record nghi ngờ: Hoa ly, MaTacPham **34**, MaChiTiet **6**, TrangThai **0/Pending**. ThongTinBosung bằng MoTa (so sánh trim, binary collation). CauChuyenSangTac, YNghiaNghiThuat, KyThuatThucHien, CamHungSangTao, NamSangTac, DiaDiemSangTac, HinhAnh1..4 đều NULL. Kích thước/chất liệu legacy không tính là nội dung mở rộng riêng.

**Không sửa/xóa Hoa ly hay bất kỳ artwork/detail có sẵn.** Text bằng nhau là dấu hiệu nghi ngờ, không đủ bằng chứng để tự dọn.

## G. RUNTIME DB TEST — PASS

Local server mới ở `http://localhost:5284`, controller/BLL/DAL thật, DB SQL Server `DUYSONW\SQLEXPRESS`, `HeThongBanTranh`. Test tự tạo và dọn fixture, opt-in `ARTWORK_CONTENT_RUNTIME_TESTS=1`. JWT fixture ngắn hạn ký trong bộ nhớ bằng cấu hình local, không in/lưu token; đã kiểm JWT role/ownership, **không test flow đăng nhập/password**.

Lần chạy đầy đủ có log detailed:

```text
MaTacPham=37
TenTacPham=TEST_TACH_MOTA_RUNTIME_e8ab50e7923646bd8cec78705da1481c
MoTa=Mo ta co ban runtime test
ChiTietTacPham COUNT ngay sau create=0
MaChiTiet sau gửi nội dung riêng=8
Concurrent POST: một 200, một 400; COUNT=1
Sửa MoTa + Admin duyệt: MoTa=Mo ta moi, detail snapshot giữ nguyên 100%
Sửa detail: CauChuyenSangTac=Cau chuyen moi, MoTa=Mo ta moi không đổi
Public states A/B/C/D/E: PASS
Cleanup: TacPham COUNT theo ID 37=0
```

Các query thực thi gồm:

```sql
SELECT MoTa FROM TacPham WHERE MaTacPham=@TestId;
SELECT COUNT(*) FROM ChiTietTacPham WHERE MaTacPham=@TestId;
SELECT (SELECT * FROM ChiTietTacPham WHERE MaTacPham=@TestId
        FOR JSON PATH, INCLUDE_NULL_VALUES);
```

So sánh JSON của **toàn bộ các bản TacPham/ChiTietTacPham có sẵn** trước/sau → giống hệt. Cleanup trong transaction, chỉ ID trả từ API + tên GUID chính xác + MaHoaSi fixture; dọn detail/edit/thông báo của fixture, không cascade dữ liệu khác. Nếu có FK ngoài dự kiến, cleanup phải fail/rollback.

Lần đầu test dùng nhầm route public nên fail sau CREATE; fixture 36 đã cleanup an toàn. Sửa URL của test, không sửa source API; lần fixture 37 PASS, sau đó chạy toàn suite với runtime và SQL enabled cũng PASS. Các số IDENTITY test đã cấp không được reseed; khoảng trống ID là bình thường.

## H. TESTS

- `ArtworkContentWorkflowTests`: thêm update basic pending/published + approve edit không chạm detail; null/empty/whitespace rejected; image-only allowed; private read mọi trạng thái, ownership, Admin đọc pending; approved detail không public artwork hidden/rejected. Bổ sung assert MoTa bất biến trong create/update detail.
- `ArtworkContentRuntimeTests`: HTTP/SQL thật A–E, create không detail, snapshot hai chiều, empty, auth/ownership, concurrent POST, cleanup và dữ liệu lịch sử.
- `ArtistArtworks.workflow.test.tsx`: giữ 2 test create/update không gọi detail.
- `ArtworkDetailContent.test.tsx`: private endpoint, whitespace và double submit, payload không MoTa.
- `ArtworkDetailSection.test.tsx`: description vẫn hiện với 404, không section rỗng, approved nội dung riêng.
- `ArtworkDetail.optionalContent.test.tsx`: optional 404 không làm hỏng toàn trang.
- `api.optionalDetail.test.ts`: chỉ suppress đúng public GET detail 404; lỗi thật vẫn log.
- AdminReport regression cũng chạy, không sửa module báo cáo.

## I. BUILD

- Backend build output riêng: **PASS**, 0 warning/error.
- Build thư mục mặc định cuối task bị **MSB3027/MSB3021 do DLL đang được server cổng 5273 sử dụng**; không phải compile error. Không kill server người dùng. Bản output riêng đã build và runtime PASS ở cổng test 5284.
- Backend default tests: 61 PASS, 2 opt-in SKIP. Sau đó bật cả runtime + SQL report, chạy DLL test đã build bằng `dotnet vstest`: **63/63 PASS, 0 SKIP/FAIL**.
- PublicationRules.Tests: **20/20 PASS** (độc bản/nhiều bản, tồn kho, bản quyền/chứng nhận/hoàn trả).
- Web `npx tsc --noEmit`: PASS.
- Web tests liên quan: **19/19 PASS**, 6 suites (không tuyên bố chạy App.test cũ không liên quan).
- Web `npm run build`: **PASS**, compiled with existing warnings, bundle `main.fab458c2.js`.
- Mobile `npx tsc --noEmit`: PASS, có thay đổi 2 file trong boundary này.
- `git diff --check`: PASS.

Không đổi source certificate/custom art/blog/orders/bản quyền/nguồn gốc. Existing tests nguồn gốc, certificate security, invoice auth, notification, report đều pass. Không tuyên bố E2E toàn bộ các module không thuộc scope.

Cảnh báo môi trường còn có sẵn: NU1900 không tải vulnerability metadata từ NuGet; React act deprecation của Testing Library v13; Browserslist/lint. Không sửa dependency trong task này.

## J. REMAINING RISKS

1. Dữ liệu cũ Hoa ly còn nguyên Pending/trùng mô tả, cần quyết định của người dùng nếu muốn xử lý; task không tự suy đoán/xóa.
2. Single-record detail không giữ snapshot đã duyệt khi họa sĩ sửa; public tạm ẩn như rule hiện tại, đã kiểm chứng.
3. Chưa nghiệm thu thao tác thủ công Mobile/simulator hay login/password; runtime API/DB, quyền JWT và Web rendered tests đã chạy thật ở mức tương ứng.
4. DB triển khai khác phải có unique index MaTacPham từ migration 007; DB local đã xác minh có index. Không chạy migration trên DB người dùng trong task này.
5. Server cổng 5273 đang giữ DLL output mặc định; cần restart/rebuild bằng quy trình đang dùng để nạp phần hardening duplicate-key mới. Task không tự dừng server này. Server test 5284 của task đã dừng sau nghiệm thu.

Không có invariant nghiệp vụ chưa kiểm chứng trong luồng HTTP/DB đã nghiệm thu ở trên.

## Lệnh chạy lại

PowerShell tại workspace root (runtime opt-in chỉ dùng khi được phép tạo fixture mới trên DB local):

```powershell
dotnet build BTL_BackEnd/BTL_BackEnd/DoAn2_BackEnd.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/content-acceptance/net8.0/
dotnet test BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-restore /p:UseAppHost=false /p:OutputPath=bin/content-tests/net8.0/
# Chạy backend output acceptance từ thư mục BTL_BackEnd/BTL_BackEnd trên localhost:5284 trước.
$env:ARTWORK_CONTENT_RUNTIME_TESTS='1'
$env:ARTWORK_CONTENT_TEST_URL='http://localhost:5284/api/'
$env:ADMIN_REPORT_SQL_TESTS='1'
dotnet vstest BTL_BackEnd/Copyright.UnitTests/bin/content-tests/net8.0/Copyright.UnitTests.dll '--logger:console;verbosity=detailed'
```

Trong thư mục Web: `npx tsc --noEmit`, `npm run build`, `npm test -- --watchAll=false --runInBand --testPathPattern='ArtistArtworks.workflow|ArtworkDetailContent|ArtworkDetailSection|ArtworkDetail.optionalContent|api.optionalDetail|AdminReport'`.
Trong thư mục Mobile: `npx tsc --noEmit`.
