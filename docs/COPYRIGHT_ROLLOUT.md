# Triển khai an toàn module nguồn gốc và chứng nhận

## Nguyên tắc

- Không chạy migration `009_HardenCopyrightProvenanceCertificates.sql` trực tiếp trên production khi chưa có bản sao lưu đã kiểm tra khả năng phục hồi.
- Không tự backfill quyền sở hữu/chứng nhận cho dữ liệu cũ.
- Triển khai migration trước khi triển khai backend mới vì backend mới đọc các cột được bổ sung trong migration 009.
- Khóa `Copyright:CertificateHashKey` phải lấy từ secret của môi trường, dài tối thiểu 32 ký tự; không dùng khóa development trên production.
- `Copyright:BaseUrl` phải là origin của Web công khai để QR mở đúng `/chung-nhan/xac-minh/{code}`.

## Trình tự đề nghị

1. Tạm dừng thao tác giao hàng, hoàn tiền, xác minh bản quyền và xác nhận thanh toán Custom Art.
2. Tạo full backup SQL Server, chạy `RESTORE VERIFYONLY` và tốt nhất phục hồi thử sang database staging cô lập.
3. Xác nhận staging đã có migration 004–008 và đối chiếu các bảng/cột được migration 009 kiểm tra ở đầu tệp.
4. Chạy migration 009 trên staging bằng SSMS. Không bỏ qua lỗi preflight.
5. Kiểm tra ba dòng audit cuối migration. Không bật cấp chứng nhận nếu còn tác phẩm độc bản có `SoLuongBanDau` khác 1. Dòng dữ liệu cũ thiếu `SoLuongBanDau` hoặc `EventKey` chỉ là cảnh báo đối soát; migration không tự sửa.
6. Chạy integration read-only:

   ```powershell
   $env:COPYRIGHT_TEST_CONNECTION = '<staging connection string>'
   $env:COPYRIGHT_TEST_BACKUP_CONFIRMED = 'YES'
   dotnet run --project BTL_BackEnd/Copyright.IntegrationSmoke/Copyright.IntegrationSmoke.csproj
   ```

7. Cấu hình secret/key và URL Web, triển khai backend, Web, Mobile; sau đó chạy `tests/copyright-e2e.ps1` bằng token/tài nguyên thật của môi trường staging.
8. Chỉ lặp lại trên production sau khi staging đạt yêu cầu và có kế hoạch phục hồi từ backup.

## Điều kiện chặn go-live

- Có hơn một owner `CURRENT` cho cùng tác phẩm.
- Có hơn một chứng nhận `ACTIVE` cho cùng ownership/độc bản.
- Tác phẩm độc bản có số lượng ban đầu khác 1, tồn kho âm hoặc lớn hơn 1.
- Chứng nhận gắn với tranh nhiều bản, hồ sơ chưa VERIFIED, LEGACY hoặc đang bị chặn.
- Khóa HMAC chưa được cấu hình, URL QR sai domain, hoặc API công khai để lộ email/số điện thoại/địa chỉ/thanh toán.
- Chưa kiểm tra riêng COD và chuyển khoản ở trạng thái thanh toán thực sự thành công.

## Rollback

Migration là additive và không có down script phá dữ liệu. Nếu triển khai thất bại, dừng ghi mới, giữ log lỗi và phục hồi database từ bản backup đã xác minh; không tự `DROP` cột/bảng trên production.
