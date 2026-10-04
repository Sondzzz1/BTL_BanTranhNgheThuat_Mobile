# Module thông báo dùng chung

## Audit trước khi hoàn thiện

Tại thời điểm bắt đầu, working tree đã có một phần module thông báo chưa hoàn thiện (một migration, `ThongBaoController`, service và chuông của họa sĩ), nhưng chưa đủ để đáp ứng yêu cầu nghiệp vụ và nhất quán dữ liệu.

| Chức năng | Đã có | Chưa có | File liên quan | Hướng xử lý |
|---|---|---|---|---|
| Bảng inbox `ThongBao` | Migration chưa áp dụng | object/event, chỉ mục phân trang, chống trùng | `SQL/Migrations/010_ArtistNotifications.sql` | Mở rộng cùng migration, không tạo bảng thứ hai |
| API thông báo | Lấy danh sách giới hạn, đánh dấu đọc | route chuẩn, phân trang, đếm chưa đọc | `Controllers/ThongBaoController.cs` | Dùng `MaTaiKhoan` từ JWT; thêm API còn thiếu |
| Chuông Web họa sĩ | Có component trong working tree | badge tổng, refresh khi mở, trang toàn bộ | `components/ArtistNotificationBell.tsx` | Hoàn thiện component và thêm trang `/artist/notifications` |
| Thông báo Web Admin | Không có | Không nằm trong phạm vi ưu tiên | `pages/Admin/*` | Không thay đổi |
| Mobile nhận thông báo | Không có API/client thông báo | Không nằm trong phạm vi ưu tiên | `art-gallery-mobile/*` | Không thay đổi |
| Gửi thông báo nghiệp vụ | Có audit log bản quyền; có bản nháp thông báo từ chối nội dung | Duyệt/từ chối tác phẩm, xác minh/thu hồi bản quyền, bài viết, transaction chung | `BLL/*`, `DAL/*` | Ghi inbox ngay trong transaction SQL của luồng xử lý |
| JWT | Đã có | — | `Helpers/JwtHelper.cs`, `BLL/AuthBusiness.cs` | `NameIdentifier` = `MaTaiKhoan`; custom claims = `MaHoaSi`, `MaNguoiDung` |
| Lý do kiểm duyệt | Có ở `TacPham.LyDo`, `ChiTietTacPham.LyDoTuChoi`, `BaiViet.LyDo`, `BanQuyen.GhiChuKiemDuyet`/`LyDoThuHoiXacMinh` | — | BLL/DAL tương ứng | Dùng đúng lý do đã xác thực/lưu trong nghiệp vụ |
| Transaction/audit | Bản quyền đã dùng `SqlTransaction`; các module cũ chủ yếu mở connection riêng | Notification chưa cùng transaction | `CopyrightRepository*`, `AuditLogSql` | Dùng `ThongBaoSql` với connection/transaction của workflow |

## Đã triển khai

- In-app inbox theo `MaTaiKhoan`, với loại/đối tượng liên quan, đường dẫn nội bộ, trạng thái đọc, thời điểm đọc và `EventKey` chống trùng retry.
- `GET /api/thong-bao?page=1&pageSize=20`
- `GET /api/thong-bao/chua-doc/dem`
- `PUT /api/thong-bao/{id}/da-doc`
- `PUT /api/thong-bao/da-doc-tat-ca`
- Giữ `GET /api/thong-bao/cua-toi` như route tương thích.
- Gửi thông báo cho đúng chủ tài khoản theo `TacPham.MaHoaSi -> HoaSi.MaTaiKhoan` trong các luồng: duyệt/từ chối tác phẩm, từ chối nội dung tác phẩm, yêu cầu bổ sung/xác minh/từ chối/thu hồi hồ sơ bản quyền, duyệt/từ chối/ẩn bài viết.
- API inbox không nhận `MaTaiKhoan` từ client. Câu lệnh cập nhật đã đọc luôn lọc đồng thời theo `MaThongBao` và `MaTaiKhoan` lấy từ token.

## Kiểm tra đã chạy

- `dotnet build BTL_BackEnd/BTL_BackEnd/DoAn2_BackEnd.csproj --no-restore -p:UseSharedCompilation=false`: thành công.
- `dotnet test BTL_BackEnd/Copyright.UnitTests/Copyright.UnitTests.csproj --no-restore -p:UseSharedCompilation=false`: 13/13 thành công.
- `npx tsc --noEmit` và `npm run build` trong `art-gallery-react`: thành công.

Chưa chạy integration/E2E với SQL Server thật, vì không được phép tự chạy migration hoặc thay đổi database thật. Các kiểm tra SQL transaction ở unit test là contract/static test; chúng không thay thế integration test.

## Kiểm thử thủ công sau khi áp dụng migration

1. Đăng nhập Admin, duyệt một tác phẩm chờ duyệt của Họa sĩ A; đăng nhập A và kiểm tra chuông, nội dung, badge và link tới tác phẩm.
2. Từ chối tác phẩm với lý do cụ thể; xác nhận lý do trong inbox và trên màn hình quản lý tác phẩm của A. Gọi lại cùng API và bảo đảm không có thông báo trùng.
3. Trên quản trị bản quyền, lần lượt yêu cầu bổ sung, xác minh và thu hồi; kiểm tra nội dung/lý do và link hồ sơ của đúng họa sĩ.
4. Đăng nhập Họa sĩ B, thử gọi `PUT /api/thong-bao/{id-cua-A}/da-doc` bằng token B; bản ghi của A phải vẫn chưa đọc.
5. Đánh dấu từng thông báo và đánh dấu tất cả; kiểm tra badge giảm đúng, đăng xuất/đăng nhập lại vẫn thấy lịch sử.
6. Duyệt, từ chối và ẩn bài viết của họa sĩ; kiểm tra inbox của tác giả.
