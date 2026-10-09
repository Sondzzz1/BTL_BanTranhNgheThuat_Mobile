# Tách Mô tả tác phẩm và Nội dung chi tiết

Ngày: 09/10/2026. Sửa trên module hiện có.

## A. Root cause

Lỗi lịch sử nằm ở `art-gallery-react/src/pages/Artist/ArtistArtworks.tsx`, hàm `buildDetailPayload`:

```ts
thongTinBosung: loadedDetail?.thongTinBosung || formData.moTa.trim() || null
```

Đã kiểm chứng bằng `git show 1eccb6d^:art-gallery-react/src/pages/Artist/ArtistArtworks.tsx`.
Payload đó được `handleSubmit` gửi tới API tạo/cập nhật ChiTietTacPham sau khi lưu TacPham.
Bản sửa trước đã bỏ fallback MoTa nhưng còn gọi API chi tiết từ form tác phẩm khi thêm ảnh bổ sung. Vì vậy hai luồng vẫn chưa tách hoàn toàn.

Backend `ChiTietTacPhamBusiness.GetChiTiet/GetChiTietCongKhai` còn gọi `GetThongTinBoSungRieng` để ẩn text bằng mô tả; việc ẩn này không sửa nguồn tạo yêu cầu sai và có thể che nội dung thật do họa sĩ chủ động nhập.
`ValidateRequest` chỉ kiểm độ dài/format, chưa từ chối nội dung rỗng.

Audit đã đọc Models/DTO/controller/BLL/DAL, service Web, form tạo/sửa tác phẩm, form nội dung riêng, Admin duyệt tác phẩm/chi tiết, public Web và Mobile. `HoaSiBusiness.TaoTacPham` chỉ gọi TacPhamRepository.Create; repository INSERT TacPham không INSERT ChiTietTacPham. SQL Server không có trigger trên TacPham. API NoiDung cũ đã trả 410; không phải đường ghi đang hoạt động.

## B. Before

Form tác phẩm → lưu TacPham → tạo/cập nhật ChiTietTacPham cho ảnh/nội dung → phát sinh yêu cầu duyệt chi tiết. Trong phiên bản lỗi lịch sử, mô tả cơ bản cũng được copy qua payload chi tiết.

## C. After

- Thêm/sửa tác phẩm: chỉ gửi TacPham, MoTa lưu duy nhất tại TacPham.MoTa; một ảnh đại diện thuộc hồ sơ tác phẩm. Tác phẩm mới chờ duyệt theo rule hiện có.
- Họa sĩ chọn nút **Nội dung chi tiết** tại danh sách tác phẩm → trang `/artist/artworks/:id/content` → viết chuyện/ý nghĩa/cảm hứng/kỹ thuật/nội dung mở rộng hoặc ảnh bổ sung → gửi duyệt riêng.
- Nội dung rỗng/khoảng trắng hoặc chỉ có kích thước/chất liệu cơ bản bị chặn frontend và backend. Năm/địa điểm sáng tác hoặc ảnh bổ sung là dữ liệu chi tiết hợp lệ theo DTO hiện có.
- Các bản chi tiết cũ được trả nguyên giá trị lưu; không suy đoán rằng mọi text trùng mô tả đều được copy tự động. Không xóa, không sửa dữ liệu cũ.

## D. Files changed của task này

| File | Lý do |
| --- | --- |
| `art-gallery-react/src/pages/Artist/ArtistArtworks.tsx` | Bỏ toàn bộ đọc/tạo/cập nhật ChiTietTacPham trong form tác phẩm, chỉ chỉnh ảnh đại diện; nút nội dung riêng có chữ rõ ràng |
| `art-gallery-react/src/pages/Artist/ArtworkDetailContent.tsx` | Chặn submit rỗng, giải thích nội dung được duyệt riêng |
| `BTL_BackEnd/BTL_BackEnd/BLL/ChiTietTacPhamBusiness.cs` | Chặn request rỗng trước khi truy cập/ghi repository; kiểm trạng thái đã duyệt ở public; bỏ helper ẩn text trùng |
| `BTL_BackEnd/BTL_BackEnd/SQL/Audits/ArtworkDescriptionDetail.sql` | SELECT tìm dữ liệu cũ nghi trùng mô tả, không có nội dung bổ sung khác |
| `BTL_BackEnd/Copyright.UnitTests/ArtworkContentWorkflowTests.cs` | Test tạo/duyệt tác phẩm, tạo/cập nhật/duyệt/từ chối chi tiết độc lập, public, rỗng, giữ text cũ |
| `art-gallery-react/src/pages/Artist/ArtistArtworks.workflow.test.tsx` | Test thao tác tạo/sửa mô tả không gọi API nội dung chi tiết |
| `docs/ARTWORK_DESCRIPTION_DETAIL_AUDIT.md` | Kết quả audit/test và phạm vi thực tế |

Đã kiểm tra git status/diff/diff --stat trước khi sửa. Các thay đổi Báo cáo, nút Hoàn trả, Mobile/constants có sẵn được giữ nguyên.

## E. API changed

Không đổi route hay DTO.

- `POST /api/hoa-si/tac-pham/{id}/chi-tiet`, `PUT /api/hoa-si/tac-pham/{id}/chi-tiet`: BLL từ chối nội dung rỗng bằng ArgumentException; controller hiện có ánh xạ thành 400 với message “Vui lòng nhập nội dung chi tiết hoặc ảnh bổ sung trước khi gửi duyệt.”
- `GET /api/public/tac-pham/{id}/chi-tiet`: kiểm thêm TrangThai == 1 ở BLL, bên cạnh stored procedure và trạng thái public của tác phẩm. Không có bản hợp lệ trả 404.
- API tạo/sửa TacPham vẫn lưu MoTa và duyệt tác phẩm như trước. Không gọi API chi tiết tự động.
- API Admin duyệt tác phẩm và duyệt nội dung riêng vẫn giữ nguyên.

## F. Admin

`AdminArt.tsx` đã hiển thị `selectedArtwork.moTa` trong hồ sơ cơ bản; không cần sửa lại.
`AdminBusiness.DuyetTacPham` duyệt TacPham/bản chỉnh sửa TacPham, không tạo/duyệt ChiTietTacPham.
`AdminArtworkDetails.tsx` lấy trường của ChiTietTacPham; thao tác duyệt gọi ChiTietTacPhamBusiness.DuyetChiTiet, chỉ đổi trạng thái nội dung.
Tác phẩm đã duyệt có thể không có chi tiết, có chi tiết chờ duyệt hoặc có chi tiết đã duyệt.

## G. Mobile/Public

Mobile `ProductDetailScreen.tsx` hiển thị product.moTa ở phần Mô tả và gọi `artworkContentService.getPublic` cho nội dung bổ sung.
Web `ArtworkDetailSection.tsx` cũng nhận mô tả từ TacPham và tải nội dung bằng public API.
Public API chỉ trả ChiTietTacPham đã duyệt và tác phẩm đủ điều kiện public; chi tiết chờ duyệt/từ chối không được công khai.
Không sửa source Mobile, không cần chạy lại tsc Mobile vì contract không đổi.

## H. Old data

Đã chạy query chỉ đọc trong `SQL/Audits/ArtworkDescriptionDetail.sql` trên HeThongBanTranh.
Kết quả: **1 bản nghi ngờ**, MaChiTiet **6**, MaTacPham **34**, tên **Hoa ly**, TrangThai **0 (Chờ duyệt)**.
ThongTinBosung bằng MoTa, không có câu chuyện/ý nghĩa/kỹ thuật/cảm hứng/ảnh/năm/địa điểm bổ sung.
Đây là dấu hiệu nghi ngờ, không khẳng định nguồn gốc bằng so sánh text. Bản ghi được giữ nguyên và vẫn thuộc lịch sử nội dung chờ duyệt cho đến khi người dùng quyết định xử lý.
Không DELETE/UPDATE dữ liệu thật, không chạy migration dọn dữ liệu.

## I. Test/build

- PASS: dotnet build backend mặc định và output kiểm tra riêng, 0 warning/error.
- PASS: dotnet test Copyright.UnitTests: **48 passed, 1 skipped, 0 failed**. Test skip là SQL báo cáo opt-in của task trước; 6 test workflow của task này đều chạy qua.
- PASS: React workflow **2/2**: tạo với mô tả chỉ gửi TacPham; sửa mô tả không đọc/gửi lại ChiTietTacPham.
- PASS: npx tsc --noEmit Web, npm run build. Còn cảnh báo lint/Browserslist/Testing Library có sẵn.
- PASS: đọc API thật `GET /api/public/tac-pham/34/chi-tiet` trả 404 cho nội dung đang chờ duyệt.
- PASS: audit database thật chỉ đọc và kiểm tra không có trigger tự tạo chi tiết.
- Unit tests dùng repository giả để kiểm trạng thái độc lập; không coi đó là E2E database.
- NOT TESTED: toàn bộ tạo → duyệt → gửi chi tiết → duyệt/từ chối trên database/API thật và thao tác thủ công Mobile/browser. Không tuyên bố E2E PASS.
- Test POST/PUT rỗng lên tác phẩm thật 34 bị hệ thống duyệt tự động từ chối vì nguy cơ ghi đè nội dung nếu validation lỗi. Không thực hiện yêu cầu đó; dùng bộ test repository giả cho đường ghi và GET thực cho public.

Backend bản mới đã được build/chạy tại cổng 5273. Tải lại Web để dùng form mới. Các thư mục output kiểm tra có thể tạo lại bằng các lệnh build/test.
