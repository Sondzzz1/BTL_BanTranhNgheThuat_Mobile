# YÊU CẦU MODULE QUẢN LÝ BẢN QUYỀN VÀ XÁC THỰC TÁC PHẨM

**Phiên bản:** 1.2  
**Ngày cập nhật:** 2026-09-28  
**Dự án:** Hệ thống bán tranh nghệ thuật trực tuyến

---

## 1. TỔNG QUAN

### 1.1. Mục tiêu
Xây dựng module quản lý bản quyền và xác thực tác phẩm nghệ thuật nhằm:
- Quản lý thông tin tác giả và nguồn gốc tác phẩm
- Quản lý lịch sử sở hữu vật chất và chuỗi chuyển nhượng
- Quản lý quyền tác giả tài sản và quyền sử dụng
- Cho phép quản trị viên kiểm duyệt thông tin do họa sĩ khai báo
- Cấp chứng nhận tác phẩm sau giao dịch với mã duy nhất và QR
- Cung cấp khả năng xác minh công khai tính hợp lệ của chứng nhận

### 1.2. Giới hạn pháp lý
⚠️ **QUAN TRỌNG:** Module này **KHÔNG thay thế** việc đăng ký bản quyền tại cơ quan nhà nước có thẩm quyền.

**Quy tắc ngôn ngữ bắt buộc:**
- Trạng thái VERIFIED chỉ có nghĩa: "Thông tin đã được quản trị viên nền tảng xác nhận theo quy trình của hệ thống"
- Không được diễn đạt thành "đã đăng ký bản quyền" hay "được pháp luật công nhận"
- Trên chứng nhận và trang xác minh phải có dòng: *"Chứng nhận này do nền tảng cấp, không thay thế việc đăng ký quyền tác giả tại cơ quan nhà nước có thẩm quyền."*

### 1.3. Phạm vi bản đầu tiên
**Bắt buộc triển khai:**
- ✅ Quản lý bản quyền (Copyright)
- ✅ Lịch sử sở hữu (OwnershipHistory)
- ✅ Chứng nhận (Certificate) + xác minh công khai
- ✅ Nhật ký hệ thống (AuditLog)
- ✅ Giao diện Admin, Họa sĩ, Người mua
- ✅ Chính sách bán theo trạng thái bản quyền
- ✅ Bằng chứng bản quyền (CopyrightEvidence)
- ✅ Tranh chấp bản quyền (CopyrightDispute)
- ✅ Cơ chế thử lại cấp chứng nhận (BackgroundService + Queue)
- ✅ Thông báo trong ứng dụng (In-App Notification)

**Thiết kế sẵn, triển khai sau:**
- ⏸️ Giấy phép sử dụng (License) chi tiết
- ⏸️ Chuyển nhượng quyền tác giả tài sản
- ⏸️ Đồng tác giả (co-authorship)
- ⏸️ Quản lý từng bản in (ArtworkEdition)

---

## 2. BA KHÁI NIỆM QUYỀN CỐT LÕI

### 2.1. Tác giả (Author/Artist)
- Người trực tiếp sáng tạo tác phẩm
- **Không thay đổi** khi tác phẩm được mua bán
- Lưu trong `TacPham.MaHoaSi` (hiện có) và `BanQuyen.MaTacGia`

### 2.2. Sở hữu vật chất (Physical Ownership)
- Người đang giữ bản gốc hoặc bản cụ thể của tranh
- **Thay đổi** theo từng giao dịch mua bán
- Lưu trong `LichSuSoHuu` (OwnershipHistory)
- Tại mỗi thời điểm, một tác phẩm gốc chỉ có **MỘT** chủ sở hữu hiện tại

### 2.3. Quyền tác giả tài sản (Copyright)
- Quyền khai thác, sao chép, phân phối, trưng bày
- Mặc định thuộc về tác giả
- **Không tự động chuyển** khi bán tranh vật lý
- Chỉ chuyển khi có bản ghi chuyển nhượng riêng
- Lưu trong `BanQuyen.MaNguoiGiuQuyen`

### 2.4. Quyền sử dụng được cấp (License)
- Phạm vi người mua/bên thứ ba được phép sử dụng
- Ví dụ: cá nhân, thương mại, trưng bày, tái sản xuất
- Lưu trong `GiayPhep` (giai đoạn sau)
- **Quy tắc mặc định:** Người mua tranh chỉ nhận quyền sở hữu vật chất, không có quyền khai thác thương mại

---

## 3. YÊU CẦU CHỨC NĂNG

### 3.1. Quản lý bản quyền (Copyright Management)

#### FR-C01: Khai báo thông tin bản quyền
**Actor:** Họa sĩ  
**Mô tả:** Họa sĩ khai báo thông tin bản quyền cho tác phẩm của mình

**Luồng chính:**
1. Họa sĩ truy cập "Quản lý bản quyền"
2. Chọn tác phẩm chưa có thông tin bản quyền
3. Nhập thông tin:
   - Ngày sáng tác
   - Mô tả nguồn gốc/xuất xứ
   - Số đăng ký bản quyền (nếu có - tùy chọn)
   - Xác nhận mình là tác giả/người nắm giữ quyền
4. Upload bằng chứng (tối thiểu 2, tối đa 10):
   - Ảnh quá trình sáng tác
   - Ảnh tác giả bên cạnh tác phẩm
   - Bản phác thảo
   - Giấy tờ đăng ký (nếu có)
5. Gửi yêu cầu xác minh
6. Hệ thống tạo bản ghi với trạng thái PENDING

**Quy tắc nghiệp vụ:**
- Một tác phẩm chỉ có một bản ghi bản quyền
- Họa sĩ chỉ được khai báo cho tác phẩm của mình (MaHoaSi = current user)
- Bằng chứng bắt buộc: Tối thiểu 2 file, tối đa 10 file
- Kích thước file tối đa: 5MB/file
- Format cho phép: JPG, PNG, PDF
- Tên file lưu trữ: GUID.{ext} (giữ tên gốc trong cột TenTepGoc)
- Thư mục lưu trữ: Ngoài wwwroot, không phục vụ bởi UseStaticFiles
- Kiểm tra MIME type thật (không chỉ dựa vào extension)
- Truy cập file: Qua API `/api/copyright/evidence/{id}/file` có kiểm tra quyền

#### FR-C02: Xác minh bản quyền
**Actor:** Quản trị viên  
**Mô tả:** Admin xem xét và xác minh thông tin bản quyền

**Luồng chính:**
1. Admin truy cập "Quản lý bản quyền"
2. Xem danh sách bản quyền trạng thái PENDING/NEED_INFO
3. Chọn bản ghi để xem chi tiết
4. Xem thông tin: tác phẩm, họa sĩ, ngày sáng tác, mô tả, bằng chứng
5. Quyết định:
   - **Xác minh (VERIFIED):** Nếu đầy đủ và hợp lệ
   - **Yêu cầu bổ sung (NEED_INFO):** Nếu thiếu thông tin (bắt buộc ghi lý do)
   - **Từ chối (REJECTED):** Nếu không hợp lệ (bắt buộc ghi lý do)
6. Hệ thống:
   - Cập nhật trạng thái
   - Ghi nhật ký
   - (Tùy chọn) Gửi thông báo cho họa sĩ

**Quy tắc nghiệp vụ:**
- Chỉ Admin (VaiTro = 0) mới được xác minh
- Từ chối hoặc yêu cầu bổ sung phải có lý do (bắt buộc)
- Mọi thao tác phải ghi vào AuditLog

#### FR-C03: Cập nhật thông tin bản quyền
**Actor:** Họa sĩ  
**Mô tả:** Họa sĩ chỉnh sửa thông tin bản quyền

**Quy tắc nghiệp vụ:**
- Chỉ được sửa khi trạng thái: PENDING, NEED_INFO, REJECTED
- Nếu sửa bản ghi VERIFIED:
  - Bản ghi tự động quay về PENDING
  - Ghi nhật ký với lý do thay đổi
- **CẤM đổi tác giả** sau khi VERIFIED
- Việc thay đổi tác giả chỉ qua quy trình tranh chấp

#### FR-C04: Tranh chấp bản quyền
**Actor:** Người dùng đã đăng nhập  
**Mô tả:** Người dùng gửi khiếu nại vi phạm bản quyền

**Luồng chính:**
1. Người dùng truy cập trang tác phẩm
2. Nhấn "Báo cáo vi phạm bản quyền"
3. Nhập:
   - Lý do khiếu nại
   - Bằng chứng (tùy chọn)
   - Thông tin liên hệ
4. Gửi khiếu nại
5. Hệ thống:
   - Tạo bản ghi TranhChapBanQuyen với trạng thái OPEN
   - **KHÔNG ẩn** tác phẩm, **KHÔNG chuyển** BanQuyen sang DISPUTED ngay lập tức
   - Thông báo Admin qua màn hình quản lý tranh chấp

**Luồng xử lý (Admin):**
1. Admin xem chi tiết tranh chấp (OPEN)
2. **Lọc sơ bộ:**
   - Nếu rõ ràng lạm dụng/spam: Chuyển sang DISMISSED, không ảnh hưởng tác phẩm
   - Nếu nghiêm túc, có cơ sở: Chuyển sang UNDER_REVIEW
3. **Khi chuyển UNDER_REVIEW:**
   - Chuyển BanQuyen sang DISPUTED
   - **Ẩn tác phẩm** khỏi danh sách bán
   - Thông báo họa sĩ qua hệ thống thông báo trong ứng dụng
4. **Họa sĩ phản hồi** (trong 7 ngày):
   - Upload bằng chứng bổ sung
   - Giải thích chi tiết
   - **Nếu không phản hồi sau 7 ngày:** Admin có quyền quyết định dựa trên bằng chứng hiện có
5. **Admin xem xét đầy đủ và quyết định:**
   - **RESOLVED → VERIFIED:** Giải quyết xong, khiếu nại không căn cứ, mở lại tác phẩm
   - **RESOLVED → REJECTED:** Xác định vi phạm, từ chối bản quyền, giữ trạng thái ẩn
   - **DISMISSED:** Bác bỏ khiếu nại lạm dụng
6. **Gỡ khóa thủ công:** Admin có thể mở lại tác phẩm bất cứ lúc nào nếu cần thiết
7. Ghi kết quả, lý do chi tiết vào nhật ký
8. Hệ thống mở lại tác phẩm (nếu resolved thành VERIFIED)

**Giới hạn lạm dụng:**
- Mỗi người dùng: Tối đa 3 khiếu nại/tháng
- Nếu 3 khiếu nại liên tiếp bị DISMISSED: Khóa chức năng khiếu nại 30 ngày
- Admin có thể khóa/mở khóa khả năng khiếu nại của user thủ công

**Xử lý tranh đã bán:**
- Nếu tác phẩm đã có đơn hàng hoàn tất và đã cấp Certificate
- Khi bị chuyển DISPUTED: Certificate vẫn hợp lệ (ACTIVE)
- Admin có thể thu hồi Certificate thủ công nếu kết luận vi phạm nghiêm trọng
- Nếu thu hồi: Thông báo người mua, cân nhắc chính sách hoàn tiền

### 3.2. Lịch sử sở hữu (Ownership History)

#### FR-O01: Tạo lịch sử sở hữu ban đầu
**Trigger:** Họa sĩ tạo tác phẩm mới  
**Mô tả:** Tự động tạo bản ghi sở hữu đầu tiên

**Quy tắc:**
- LoaiChuyenGiao = CREATION
- MaChuSoHuu: Sử dụng một trong hai cột nullable:
  - MaNguoiDung: NULL (họa sĩ không có tài khoản NguoiDung)
  - MaHoaSi: MaHoaSi của họa sĩ
- TrangThai = CURRENT
- NgayNhan = NgayTao tác phẩm

**Xác nhận từ code:**
- `HoaSi.MaTaiKhoan` (`Models/HoaSi.cs` line 7): nullable, họa sĩ CÓ tài khoản riêng
- `NguoiDung.MaTaiKhoan` (`Models/NguoiDung.cs` line 7): nullable
- **KHÔNG có** quan hệ trực tiếp giữa HoaSi và NguoiDung

**Thiết kế LichSuSoHuu:**
- Dùng **hai cột nullable**: `MaNguoiDung INT NULL`, `MaHoaSi INT NULL`
- **CHECK constraint**: `CHECK ((MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL))`
- Đảm bảo đúng một trong hai cột có giá trị
- Khóa ngoại thật: `FK_LichSuSoHuu_NguoiDung`, `FK_LichSuSoHuu_HoaSi`

#### FR-O02: Chuyển giao sở hữu khi bán
**Trigger:** Đơn hàng hoàn tất (TrangThai = 3 - DaGiao)  
**Mô tả:** Tự động cập nhật chuỗi sở hữu khi đơn hàng giao thành công

**Xác nhận từ code:**
- `DonHangStatus.DaGiao = 3` (`Helpers/DonHangStatus.cs` line 11) → Đơn hàng đã giao thành công
- `DonHang.MaNguoiDung` (`Models/DonHang.cs` line 8) → Có thông tin người mua
- Đây là thời điểm tác phẩm chính thức chuyển sang chủ sở hữu mới

**Luồng:**
1. Hệ thống kiểm tra đơn hàng có tác phẩm nào (ChiTietDonHang)
2. Với mỗi tác phẩm trong đơn:
   - Tìm bản ghi OwnershipHistory hiện tại (TrangThai = CURRENT)
   - Cập nhật bản ghi cũ:
     - TrangThai = TRANSFERRED
     - NgayChuyenGiao = DateTime.UtcNow (thời điểm giao thành công, không dùng NgayDat)
   - Tạo bản ghi mới:
     - MaNguoiDung = DonHang.MaNguoiDung (người mua)
     - MaHoaSi = NULL
     - LoaiChuyenGiao = SALE (chỉ hỗ trợ SALE từ họa sĩ → khách hàng, không hỗ trợ RESALE)
     - TrangThai = CURRENT
     - NgayNhan = DateTime.UtcNow
     - MaDonHang = MaDonHang
3. Sử dụng **database transaction** để đảm bảo tính nhất quán

**Quy tắc:**
- Tại một thời điểm, một tác phẩm chỉ có **đúng MỘT** bản ghi CURRENT
- Dùng ràng buộc unique có điều kiện trong DB: `UNIQUE (MaTacPham) WHERE TrangThai = 1`
- NgayChuyenGiao/NgayNhan: Dùng **DateTime.UtcNow** (không dùng DateTime.Now)
- Lý do: Đơn có thể đặt trước, giao sau. NgayChuyenGiao là thời điểm thực tế giao hàng (TrangThai = 3)
- **RESALE (bán lại giữa người dùng):** Không hỗ trợ trong giai đoạn 1

#### FR-O03: Đảo ngược sở hữu khi hoàn tiền
**Trigger:** Yêu cầu hoàn trả được duyệt và hoàn tiền thành công  
**Mô tả:** Quay lại trạng thái sở hữu trước đó, khôi phục chứng nhận

**Điều kiện:**
- Bản ghi OwnershipHistory cần đảo ngược phải đang ở trạng thái **CURRENT**
- Nếu không phải CURRENT (tức đã chuyển giao cho người khác): **Từ chối tự động** và chuyển Admin xử lý thủ công

**Luồng:**
1. Admin duyệt hoàn trả và xác nhận hoàn tiền
2. Hệ thống kiểm tra:
   - Tìm bản ghi OwnershipHistory của đơn hàng đó
   - **Kiểm tra TrangThai = CURRENT:**
     - ✅ Nếu CURRENT: Tiếp tục đảo ngược
     - ❌ Nếu KHÔNG CURRENT: Hủy thao tác, ghi log, thông báo Admin xử lý thủ công
3. Nếu đủ điều kiện đảo ngược:
   - Cập nhật bản ghi hiện tại: TrangThai = REVERSED
   - Tìm bản ghi trước đó (TRANSFERRED): Khôi phục TrangThai = CURRENT
   - Xử lý Certificate:
     - Tìm Certificate ACTIVE của bản ghi hiện tại → TrangThai = REVOKED
     - Tìm Certificate SUPERSEDED của bản ghi trước đó:
       - Nếu có: Khôi phục TrangThai = ACTIVE
       - Nếu không có (trường hợp đặc biệt): Cấp Certificate mới cho chủ cũ
   - Ghi nhật ký đầy đủ
4. Gửi thông báo cho các bên liên quan (tùy chọn)

**Đảm bảo không có khoảng trống:**
- Sau khi đảo ngược, **PHẢI có đúng 1** Certificate ACTIVE
- Nếu chủ cũ không có Certificate (do lý do nào đó): Cấp mới ngay lập tức
- Ghi rõ trong nhật ký tất cả thay đổi về Certificate

**Xử lý lỗi:**
- Nếu không đảo ngược được: Ghi log chi tiết (lý do, trạng thái hiện tại, các bản ghi liên quan)
- Tạo task cho Admin xem xét thủ công
- Không để hệ thống ở trạng thái không nhất quán

### 3.3. Chứng nhận (Certificate)

#### FR-CE01: Cấp chứng nhận tự động
**Trigger:** Đơn hàng hoàn tất (TrangThai = 3) VÀ BanQuyen.TrangThai = VERIFIED  
**Mô tả:** Tự động cấp chứng nhận cho người mua (chỉ áp dụng cho tác phẩm VERIFIED, KHÔNG áp dụng cho LEGACY)

**Điều kiện:**
- Đơn hàng đã thanh toán thành công (ThanhToan.TrangThai = "DaThanhToan")
- Đơn hàng đã giao (DonHang.TrangThai = 3)
- Bản quyền tác phẩm ở trạng thái **VERIFIED** (không cấp cho LEGACY)
- Chưa có Certificate ACTIVE cho OwnershipHistory này

**Luồng:**
1. Sau khi tạo OwnershipHistory mới (FR-O02)
2. Hệ thống kiểm tra điều kiện
3. Nếu đủ điều kiện:
   - Sinh CertificateCode: `COA-{YYYY}-{12 ký tự ngẫu nhiên an toàn}`
   - Tính ContentHash bằng **HMAC-SHA256**:
     - Khóa: `CertificateHashKey` từ appsettings.json
     - Dữ liệu: `{MaTacPham}|{MaTacGia}|{MaChuSoHuu}|{MaLichSuSoHuu}|{NgayCap:O}|{CertificateCode}`
     - Trong đó MaChuSoHuu là MaNguoiDung hoặc MaHoaSi tùy bản ghi
   - Tạo bản ghi Certificate:
     - TrangThai = ACTIVE
     - MaLichSuSoHuu = ID của OwnershipHistory mới
     - NgayCap = **DateTime.UtcNow** (không dùng DateTime.Now)
     - NguoiCap = "Hệ thống tự động"
   - Sinh mã QR chứa URL: `{BaseUrl}/verify/certificate/{CertificateCode}`
     - BaseUrl lấy từ appsettings.json
   - Tạo file PDF chứng nhận bằng **QuestPDF**
4. **Nếu thất bại:**
   - Ghi vào bảng `CertificatePendingQueue` với thông tin:
     - MaLichSuSoHuu
     - SoLanThu (số lần đã thử, khởi tạo = 1)
     - NgayTao = DateTime.UtcNow
     - TrangThai = PENDING
   - BackgroundService sẽ retry định kỳ

**Đảm bảo Idempotency:**
- Kiểm tra xem đã có Certificate cho OwnershipHistory này chưa
- Nếu có rồi (do retry/duplicate event), trả về Certificate hiện có, không tạo mới
- Dùng database constraint: `UNIQUE (MaLichSuSoHuu) WHERE TrangThai = 1`

**Quy tắc CertificateCode:**
- Độ dài: 12 ký tự ngẫu nhiên (A-Z, 0-9, không có ký tự đặc biệt)
- Sinh bằng `RandomNumberGenerator` của .NET (cryptographically secure)
- Unique constraint trong database
- Format: `COA-{YYYY}-{12 chars}` → Ví dụ: `COA-2026-A3F8K9P2X7N5`

**Cơ chế thử lại (BackgroundService):**
- Service chạy mỗi 5 phút
- Đọc từ bảng `CertificatePendingQueue` WHERE TrangThai = PENDING AND SoLanThu < 3
- Thử cấp Certificate
- Nếu thành công: Xóa khỏi queue (hoặc chuyển TrangThai = COMPLETED)
- Nếu thất bại: Tăng SoLanThu += 1
- Nếu SoLanThu >= 3: Chuyển TrangThai = FAILED, thông báo Admin
- Admin xem danh sách qua màn hình "Chứng nhận chưa cấp" (`/admin/certificates/pending`)
- Admin có thể "Cấp thủ công" hoặc "Thử lại"

#### FR-CE02: Chuyển chứng nhận khi bán lại (Giai đoạn sau)
**Trigger:** Tác phẩm được bán lại (chủ sở hữu hiện tại bán cho người khác)  
**Mô tả:** Cấp chứng nhận mới, vô hiệu hóa chứng nhận cũ

**Trạng thái:** ⏸️ **Không triển khai trong giai đoạn 1**  
**Lý do:** Hệ thống chưa có chức năng bán lại giữa người dùng (RESALE). Chỉ hỗ trợ SALE từ họa sĩ → khách hàng.

**Thiết kế cho giai đoạn sau:**
1. Khi tạo OwnershipHistory mới với LoaiChuyenGiao = RESALE
2. Hệ thống:
   - Tìm Certificate cũ (ACTIVE) của OwnershipHistory trước đó
   - Cập nhật Certificate cũ: TrangThai = SUPERSEDED
   - Cấp Certificate mới (theo FR-CE01)
3. Kết quả: Tại mỗi thời điểm, một tác phẩm chỉ có **tối đa 1** Certificate ACTIVE

**Ghi chú:** Khi triển khai RESALE cần thêm:
- Marketplace cho người dùng đăng bán
- Xác minh quyền sở hữu trước khi cho đăng bán
- Phí giao dịch
- Cơ chế ký gửi (escrow)

#### FR-CE03: Thu hồi chứng nhận
**Actor:** Admin  
**Mô tả:** Admin thu hồi chứng nhận trong các trường hợp đặc biệt

**Trường hợp thu hồi:**
- Phát hiện gian lận
- Tranh chấp bản quyền được giải quyết (tác phẩm bị gỡ)
- Hoàn tiền và đảo ngược giao dịch

**Luồng:**
1. Admin chọn Certificate cần thu hồi
2. Nhập lý do thu hồi (bắt buộc)
3. Xác nhận
4. Hệ thống:
   - Cập nhật TrangThai = REVOKED
   - Ghi NgayThuHoi, LyDoThuHoi
   - Ghi nhật ký
   - (Tùy chọn) Thông báo chủ sở hữu

#### FR-CE04: Xem và tải chứng nhận
**Actor:** Chủ sở hữu hiện tại  
**Mô tả:** Người sở hữu xem và tải chứng nhận PDF

**Luồng:**
1. Người dùng truy cập "Đơn hàng của tôi" hoặc "Tác phẩm đã mua"
2. Chọn tác phẩm đã mua
3. Nhấn "Xem chứng nhận"
4. Hệ thống:
   - Kiểm tra người dùng có phải chủ sở hữu hiện tại không
   - Nếu có, hiển thị thông tin chứng nhận:
     - CertificateCode
     - Mã QR
     - Tên tác phẩm, tác giả
     - Ngày cấp
     - Trạng thái
   - Cung cấp nút "Tải PDF"

**Quy tắc:**
- Chỉ chủ sở hữu hiện tại (OwnershipHistory.TrangThai = CURRENT) mới xem được
- Admin có thể xem tất cả

#### FR-CE05: Xác minh công khai (Public Verification)
**Actor:** Bất kỳ ai (không cần đăng nhập)  
**Mô tả:** Quét QR hoặc nhập mã để xác minh tính hợp lệ

**API Endpoint:** `GET /api/public/certificates/verify/{certificateCode}`  
**Frontend Route:** `/verify/certificate/{certificateCode}`

**Luồng:**
1. Người dùng quét QR hoặc nhập mã
2. Hệ thống tìm Certificate theo CertificateCode
3. Hiển thị kết quả:

**Trường hợp 1: Hợp lệ (ACTIVE)**
```
✅ Chứng nhận hợp lệ
Mã chứng nhận: COA-2026-A3F8K9P2X7N5
Tác phẩm: [Tên tác phẩm]
Tác giả: [Tên họa sĩ]
Loại: [Tác phẩm gốc/Bản sao/Phái sinh]
Ngày cấp: [Ngày cấp - hiển thị theo GMT+7]
Chủ sở hữu hiện tại: N*** V*** [Che tên một phần]
⚠️ Chứng nhận này do nền tảng cấp, không thay thế việc đăng ký quyền tác giả tại cơ quan nhà nước.
```

**Trường hợp 2: Đã bị thay thế (SUPERSEDED)**
```
⚠️ Chứng nhận đã được thay thế
Chứng nhận này đã được thay thế bằng chứng nhận mới do tác phẩm đã đổi chủ sở hữu.
```

**Trường hợp 3: Bị thu hồi (REVOKED)**
```
❌ Chứng nhận đã bị thu hồi
Ngày thu hồi: [Ngày thu hồi]
(Không hiển thị lý do chi tiết)
```

**Trường hợp 4: Không tìm thấy**
```
❌ Không tìm thấy chứng nhận
Mã chứng nhận không tồn tại trong hệ thống.
```

**Quy tắc hiển thị chủ sở hữu:**
- Mặc định: Che tên một phần (`N*** V***`)
- Nếu chủ sở hữu bật "Hiển thị công khai": Hiển thị đầy đủ
- Admin luôn thấy đầy đủ

**Bảo vệ endpoint:**
- Rate limiting: **20 requests / 5 phút / IP** (không phải 10/min)
- Lấy IP thật qua `ForwardedHeaders` middleware:
  - Đọc từ `X-Forwarded-For` hoặc `X-Real-IP`
  - Fallback: `HttpContext.Connection.RemoteIpAddress`
- Không trả về thông tin nhạy cảm (email, số điện thoại, địa chỉ đầy đủ)
- **Không hiển thị lý do thu hồi chi tiết** ở trang công khai (chống rò rỉ thông tin nội bộ)
- Không có thông báo "gần đúng" (để chống dò mã)

### 3.4. Nhật ký hệ thống (Audit Log)

#### FR-AL01: Ghi nhật ký tự động
**Mô tả:** Tự động ghi lại mọi thao tác quan trọng

**Các hành động bắt buộc ghi:**
| Đối tượng | Hành động | Ghi gì |
|-----------|-----------|--------|
| BanQuyen | Tạo | Thông tin bản quyền, người tạo |
| BanQuyen | Sửa | Giá trị trước/sau (JSON), người sửa |
| BanQuyen | Xác minh | Người xác minh, thời gian |
| BanQuyen | Từ chối | Người từ chối, lý do |
| BanQuyen | Yêu cầu bổ sung | Người yêu cầu, lý do |
| BanQuyen | Chuyển sang tranh chấp | Người đánh dấu, mã tranh chấp |
| LichSuSoHuu | Tạo | Chủ cũ, chủ mới, loại chuyển giao, mã đơn hàng |
| LichSuSoHuu | Đảo ngược | Lý do đảo ngược, người thực hiện |
| ChungNhan | Cấp | Người nhận, mã chứng nhận, ngày cấp |
| ChungNhan | Thu hồi | Người thu hồi, lý do |
| TraanhChapBanQuyen | Tạo | Người khiếu nại, lý do |
| TraanhChapBanQuyen | Xử lý | Kết quả, người xử lý, lý do |

**Thông tin ghi:**
- TenDoiTuong: "BanQuyen", "ChungNhan", "LichSuSoHuu", v.v.
- MaDoiTuong: ID của đối tượng
- HanhDong: "Tao", "Sua", "XacMinh", "TuChoi", "ThuHoi", v.v.
- GiaTriTruoc: JSON (nếu có)
- GiaTriSau: JSON (nếu có)
- NguoiThucHien: MaTaiKhoan
- VaiTro: VaiTro (0/1/2)
- ThoiGian: DateTime
- DiaChiIP: IP address
- LyDo: Lý do (nếu có)

**Quy tắc:**
- Nhật ký **chỉ được thêm**, không cho sửa hoặc xóa
- Chặn UPDATE/DELETE ở cả tầng ứng dụng và database (nếu có thể)
- Admin có thể xem toàn bộ nhật ký
- Họa sĩ chỉ xem nhật ký liên quan đến tác phẩm của mình

---

## 4. YÊU CẦU PHI CHỨC NĂNG

### 4.1. Hiệu năng
- **NFR-P01:** Thời gian phản hồi API < 500ms (trung bình)
- **NFR-P02:** Endpoint verify certificate < 200ms (vì không cần auth)
- **NFR-P03:** Cấp chứng nhận không làm chậm quá trình hoàn tất đơn hàng (xử lý bất đồng bộ nếu cần)

### 4.2. Bảo mật
- **NFR-S01:** CertificateCode phải sinh bằng RNG an toàn (cryptographically secure) - `RandomNumberGenerator` của .NET
- **NFR-S02:** Endpoint verify certificate phải có rate limiting **20 requests / 5 phút / IP**, lấy IP thật qua ForwardedHeaders middleware
- **NFR-S03:** Không trả về thông tin nhạy cảm (email, phone, password hash, lý do thu hồi chi tiết ở trang công khai)
- **NFR-S04:** ContentHash của Certificate phải dùng **HMAC-SHA256** với khóa bí mật `CertificateHashKey` từ appsettings.json, dữ liệu băm: `{MaTacPham}|{MaTacGia}|{MaChuSoHuu}|{MaLichSuSoHuu}|{NgayCap:O}|{CertificateCode}`
- **NFR-S05:** Mọi thao tác xác minh/từ chối/thu hồi phải ghi IP address
- **NFR-S06:** Tệp bằng chứng phải kiểm tra MIME type thật (không chỉ dựa extension), lưu ngoài wwwroot, truy cập qua API có kiểm quyền

### 4.3. Tính nhất quán dữ liệu
- **NFR-C01:** Chuyển sở hữu phải dùng database transaction
- **NFR-C02:** Một tác phẩm chỉ có đúng 1 OwnershipHistory CURRENT (dùng unique constraint)
- **NFR-C03:** Một OwnershipHistory chỉ có đúng 1 Certificate ACTIVE (dùng unique constraint)
- **NFR-C04:** Cấp chứng nhận phải idempotent (gọi lại không tạo duplicate)

### 4.4. Khả năng mở rộng
- **NFR-E01:** Thiết kế cho phép thêm loại tác phẩm mới (bản in, NFT) trong tương lai
- **NFR-E02:** Thiết kế cho phép thêm loại License mới
- **NFR-E03:** Thiết kế cho phép đồng tác giả (nhiều artists cho 1 artwork)

### 4.5. Khả năng sử dụng
- **NFR-U01:** Giao diện quản lý bản quyền trực quan, dễ hiểu
- **NFR-U02:** Trang verify certificate responsive, hiển thị tốt trên mobile
- **NFR-U03:** Thông báo lỗi rõ ràng, hướng dẫn khắc phục
- **NFR-U04:** Upload bằng chứng hỗ trợ drag-and-drop

### 4.6. Tính sẵn sàng
- **NFR-A01:** Module không làm ảnh hưởng chức năng hiện có nếu có lỗi
- **NFR-A02:** Nếu không cấp được Certificate, vẫn cho phép hoàn tất đơn hàng (log lỗi và retry sau)

---

## 5. CHÍNH SÁCH BÁN THEO TRẠNG THÁI BẢN QUYỀN

### 5.1. Chính sách MIXED (Áp dụng)

**Điều kiện bán tác phẩm:**
- `TacPham.TrangThai = 1` (Đã duyệt) **VÀ**
- `BanQuyen.TrangThai IN (VERIFIED, LEGACY)`

**Phân biệt hai loại TrangThai:**
- **TacPham.TrangThai** (xác nhận từ code `BTL_BackEnd/BTL_BackEnd/BLL/AdminBusiness.cs` line 137, `HoaSiBusiness.cs` line 86):
  - **0** = Chờ duyệt (Pending)
  - **1** = Đã duyệt (Approved) - được phép bán
  - **3** = Từ chối (Rejected)
  - **99** = Đã xóa (Soft delete)
  - **Mục đích:** Kiểm duyệt **NỘI DUNG** (ảnh, mô tả, giá cả, phù hợp chính sách)
  
- **BanQuyen.TrangThai:**
  - **Mục đích:** Xác minh **QUYỀN SỞ HỮU** và bằng chứng bản quyền
  - Admin **KHÔNG phải duyệt hai lần**, hai quy trình độc lập

**Tác phẩm mới (sau khi deploy module):**
- Chỉ **VERIFIED** mới được đăng bán
- PENDING, NEED_INFO, REJECTED, DISPUTED → Ẩn khỏi danh sách, chặn tạo đơn mới

**Tác phẩm cũ (trước khi deploy module):**
- Tự động tạo BanQuyen với trạng thái **LEGACY**
- **LEGACY được phép bán**
- Hiển thị badge trên trang chi tiết: **"Dữ liệu cũ - chưa xác minh bản quyền"**
- **MỌI đơn hàng** (cũ và mới) của tác phẩm LEGACY **KHÔNG có chứng nhận**
- Giao diện hiển thị rõ: 
  - Trang chi tiết tác phẩm: Badge cảnh báo
  - Trang giỏ hàng/thanh toán: Thông báo "Tác phẩm này không có chứng nhận bản quyền"
  - Lịch sử đơn hàng: "Chứng nhận không khả dụng (tác phẩm chưa xác minh)"
- Họa sĩ có thể tự nguyện chuyển **LEGACY → PENDING** để xác minh

**Xử lý khi họa sĩ chuyển LEGACY → PENDING:**
- Tác phẩm **VẪN ĐƯỢC BÁN** trong thời gian chờ xác minh
- Chỉ ẩn khi Admin từ chối (REJECTED) hoặc có tranh chấp (DISPUTED)
- Lý do: Tránh họa sĩ mất doanh thu khi tự nguyện xác minh
- Đơn hàng trong thời gian này vẫn **KHÔNG có chứng nhận**
- Chỉ đơn hàng **SAU KHI** chuyển sang VERIFIED mới được cấp chứng nhận

### 5.2. Xử lý khi trạng thái thay đổi
**Khi BanQuyen chuyển sang DISPUTED hoặc REJECTED:**
1. Ẩn tác phẩm khỏi danh sách bán
2. Chặn tạo đơn hàng mới
3. Với đơn hàng đang xử lý:
   - **Chưa thanh toán:** Tự động hủy
   - **Đã thanh toán, chưa giao:** Giữ đơn, thông báo Admin xử lý thủ công
   - **Đã giao:** Không ảnh hưởng, Certificate vẫn hợp lệ (trừ khi Admin thu hồi)

**Khi BanQuyen chuyển từ DISPUTED về VERIFIED:**
1. Mở lại tác phẩm cho phép bán
2. Ghi nhật ký

---

## 6. TRẠNG THÁI VÀ CHUYỂN ĐỔI

### 6.1. Trạng thái bản quyền (BanQuyen.TrangThai)
```
PENDING      = 0  // Chờ kiểm duyệt
NEED_INFO    = 1  // Yêu cầu bổ sung thông tin
VERIFIED     = 2  // Đã xác minh
REJECTED     = 3  // Bị từ chối
DISPUTED     = 4  // Đang tranh chấp
LEGACY       = 5  // Dữ liệu cũ (đặc biệt)
```

### 6.2. Bảng chuyển trạng thái hợp lệ
| Từ trạng thái | Sang trạng thái | Người thực hiện | Điều kiện |
|---------------|-----------------|-----------------|-----------|
| (Mới tạo) | PENDING | Hệ thống | Họa sĩ gửi lần đầu |
| PENDING | VERIFIED | Admin | Đủ bằng chứng, hợp lệ |
| PENDING | NEED_INFO | Admin | Thiếu thông tin (phải có lý do) |
| PENDING | REJECTED | Admin | Không hợp lệ (phải có lý do) |
| NEED_INFO | PENDING | Họa sĩ | Sau khi bổ sung thông tin |
| REJECTED | PENDING | Họa sĩ | Họa sĩ nộp lại |
| VERIFIED | DISPUTED | Admin | Khi Admin chuyển TranhChap từ OPEN → UNDER_REVIEW |
| VERIFIED | PENDING | Hệ thống | Họa sĩ sửa nội dung quan trọng |
| DISPUTED | VERIFIED | Admin | Giải quyết xong, xác nhận hợp lệ |
| DISPUTED | REJECTED | Admin | Giải quyết xong, xác nhận không hợp lệ |
| LEGACY | PENDING | Họa sĩ | Tự nguyện xác minh |
| LEGACY | VERIFIED | - | (Không cho phép) Phải qua PENDING trước |

**Lưu ý quan trọng:**
- **KHÔNG có** chuyển từ PENDING → DISPUTED do User trực tiếp
- Tranh chấp mới tạo (OPEN) **KHÔNG** làm BanQuyen chuyển sang DISPUTED
- Chỉ khi Admin lọc và chuyển TranhChap sang UNDER_REVIEW, BanQuyen mới chuyển DISPUTED
- Điều này tránh lạm dụng tranh chấp để phá hoại tác phẩm đối thủ

**Quy tắc:**
- Chuyển trạng thái không hợp lệ → Trả về lỗi 400 BadRequest
- Mọi chuyển trạng thái phải ghi nhật ký với đầy đủ thông tin

### 6.3. Trạng thái lịch sử sở hữu
```
CURRENT      = 1  // Hiện tại
TRANSFERRED  = 2  // Đã chuyển giao
REVERSED     = 3  // Bị đảo ngược (hoàn tiền)
```

### 6.4. Trạng thái chứng nhận
```
ACTIVE       = 1  // Hiệu lực
SUPERSEDED   = 2  // Đã bị thay thế
REVOKED      = 3  // Bị thu hồi
EXPIRED      = 4  // Hết hạn (dự phòng)
```

### 6.5. Trạng thái tranh chấp (TranhChapBanQuyen.TrangThai)
```
OPEN         = 0  // Mới tạo, chờ Admin lọc sơ bộ (BanQuyen chưa bị DISPUTED)
UNDER_REVIEW = 1  // Admin xác nhận nghiêm túc, đang xem xét (BanQuyen → DISPUTED, ẩn tác phẩm)
RESOLVED     = 2  // Đã giải quyết (chuyển BanQuyen về VERIFIED hoặc REJECTED)
DISMISSED    = 3  // Bác bỏ (khiếu nại không căn cứ hoặc lạm dụng)
```

**Bảng chuyển trạng thái tranh chấp:**
| Từ | Sang | Người thực hiện | Ảnh hưởng |
|----|------|-----------------|-----------|
| - | OPEN | User | Tạo khiếu nại mới, BanQuyen giữ nguyên |
| OPEN | UNDER_REVIEW | Admin | BanQuyen → DISPUTED, ẩn tác phẩm, thông báo họa sĩ |
| OPEN | DISMISSED | Admin | Lọc spam/lạm dụng, không ảnh hưởng tác phẩm |
| UNDER_REVIEW | RESOLVED | Admin | Quyết định cuối, BanQuyen → VERIFIED hoặc REJECTED |
| UNDER_REVIEW | DISMISSED | Admin | Bác bỏ sau khi xem xét, BanQuyen về trạng thái trước DISPUTED |

---

## 7. MA TRẬN PHÂN QUYỀN

| Chức năng | Admin (0) | Họa sĩ (2) | Khách hàng (1) | Công khai |
|-----------|-----------|-----------|----------------|-----------|
| **Bản quyền** |
| Xem tất cả bản quyền | ✅ | ❌ | ❌ | ❌ |
| Xem bản quyền của tác phẩm mình | ✅ | ✅ | ❌ | ❌ |
| Khai báo bản quyền | ❌ | ✅ (tác phẩm mình) | ❌ | ❌ |
| Sửa bản quyền | ❌ | ✅ (tác phẩm mình, theo quy tắc) | ❌ | ❌ |
| Xác minh (VERIFIED) | ✅ | ❌ | ❌ | ❌ |
| Từ chối (REJECTED) | ✅ | ❌ | ❌ | ❌ |
| Yêu cầu bổ sung (NEED_INFO) | ✅ | ❌ | ❌ | ❌ |
| Xem bằng chứng | ✅ | ✅ (của mình) | ❌ | ❌ |
| Upload bằng chứng | ❌ | ✅ (tác phẩm mình) | ❌ | ❌ |
| **Tranh chấp** |
| Gửi khiếu nại | ✅ | ✅ | ✅ | ❌ |
| Xem tất cả tranh chấp | ✅ | ❌ | ❌ | ❌ |
| Xem tranh chấp liên quan | ✅ | ✅ (tác phẩm mình) | ✅ (do mình tạo) | ❌ |
| Lọc sơ bộ (OPEN → UNDER_REVIEW/DISMISSED) | ✅ | ❌ | ❌ | ❌ |
| Phản hồi tranh chấp | ✅ | ✅ (tác phẩm mình, trong 7 ngày) | ❌ | ❌ |
| Xử lý tranh chấp cuối cùng (RESOLVED) | ✅ | ❌ | ❌ | ❌ |
| Gỡ khóa tranh chấp thủ công | ✅ | ❌ | ❌ | ❌ |
| **Chứng nhận** |
| Xem tất cả chứng nhận | ✅ | ❌ | ❌ | ❌ |
| Xem chứng nhận của tác phẩm mình sở hữu | ✅ | ✅ | ✅ | ❌ |
| Tải PDF chứng nhận | ✅ | ✅ (nếu sở hữu) | ✅ (nếu sở hữu) | ❌ |
| Cấp chứng nhận thủ công | ✅ | ❌ | ❌ | ❌ |
| Thu hồi chứng nhận | ✅ | ❌ | ❌ | ❌ |
| Xác minh công khai (verify) | ✅ | ✅ | ✅ | ✅ |
| **Lịch sử sở hữu** |
| Xem tất cả lịch sử | ✅ | ❌ | ❌ | ❌ |
| Xem lịch sử của tác phẩm | ✅ | ✅ (tác phẩm mình tạo) | ✅ (tác phẩm mình mua) | ❌ |
| **Nhật ký** |
| Xem toàn bộ nhật ký | ✅ | ❌ | ❌ | ❌ |
| Xem nhật ký liên quan đến mình | ✅ | ✅ | ✅ (hạn chế) | ❌ |

**Chú thích:**
- ✅ = Được phép
- ❌ = Không được phép
- (điều kiện) = Được phép với điều kiện

**Quy tắc kiểm tra:**
1. Kiểm tra vai trò (VaiTro từ JWT)
2. Kiểm tra quyền sở hữu tài nguyên (resource ownership)
   - Họa sĩ chỉ được thao tác trên tác phẩm có MaHoaSi = MaHoaSi của user
   - Khách hàng chỉ được xem chứng nhận của tác phẩm họ đang sở hữu (OwnershipHistory.MaChuSoHuu = MaNguoiDung)

---

## 8. LOẠI TÁC PHẨM VÀ MÔ HÌNH

### 8.1. Loại tác phẩm (TacPham.LoaiTacPham - byte)
```
ORIGINAL     = 0  // Tác phẩm gốc
REPRODUCTION = 1  // Bản sao/tái bản
DERIVATIVE   = 2  // Tác phẩm phái sinh
```

### 8.2. Ràng buộc
- **REPRODUCTION và DERIVATIVE** phải có `MaTacPhamGoc` (ParentArtworkId)
- **DERIVATIVE** phải có giấy phép hoặc sự đồng ý từ tác giả gốc (ghi trong mô tả hoặc có License)
- **REPRODUCTION** cần có:
  - `SoBanIn` (EditionNumber): Số thứ tự, ví dụ 3
  - `TongSoBan` (EditionSize): Tổng số bản, ví dụ 50
  - Hiển thị: "3/50"

### 8.3. Mô hình sở hữu (Giai đoạn 1)
- **ORIGINAL:** Một Artwork chỉ có một chủ sở hữu tại một thời điểm
- **REPRODUCTION:** Tạm thời quản lý như ORIGINAL (mỗi bản là 1 TacPham riêng với LoaiTacPham=1)
- **Giai đoạn sau:** Xây dựng bảng `ArtworkEdition` để quản lý từng bản in chi tiết hơn

---

## 9. KẾ HOẠCH DI CHUYỂN DỮ LIỆU

**Phương pháp:** Sử dụng EF Core Migration (hoặc SQL Scripts nếu không dùng EF)  
**Thời điểm:** Chạy một lần khi deploy module lần đầu

### 9.1. Tác phẩm hiện có (TacPham)
**Mục tiêu:** Tạo bản ghi BanQuyen cho tất cả tác phẩm hiện có

**Script SQL đặt trong Migration:**
```sql
-- Tạo BanQuyen cho tất cả tác phẩm cũ với trạng thái LEGACY
INSERT INTO BanQuyen (MaTacPham, MaTacGia, MaNguoiGiuQuyen, TrangThai, 
    NgaySangTac, MoTa, NgayTao, NgayCapNhat)
SELECT 
    MaTacPham,
    MaHoaSi as MaTacGia,
    MaHoaSi as MaNguoiGiuQuyen,
    5 as TrangThai, -- LEGACY
    NgayTao as NgaySangTac,
    N'Dữ liệu di chuyển từ hệ thống cũ' as MoTa,
    GETUTCDATE() as NgayTao,
    GETUTCDATE() as NgayCapNhat
FROM TacPham
WHERE NOT EXISTS (SELECT 1 FROM BanQuyen WHERE BanQuyen.MaTacPham = TacPham.MaTacPham);
```

**Ghi chú:**
- Tất cả tác phẩm cũ có TrangThai = LEGACY (5)
- Họa sĩ có thể tự nguyện chuyển sang PENDING để xác minh
- Dùng `GETUTCDATE()` thay vì `GETDATE()`

### 9.2. Đơn hàng đã giao (DonHang.TrangThai = 3)
**Mục tiêu:** Tạo LichSuSoHuu cho tác phẩm đã bán và giao. **KHÔNG cấp chứng nhận** cho dữ liệu cũ.

**Xác nhận từ code:**
- `DonHang.MaNguoiDung` (`Models/DonHang.cs` line 8): Có thông tin người mua
- `DonHang.TrangThai = 3` (`Helpers/DonHangStatus.cs` line 11): Đã giao
- Có đủ dữ liệu để tạo ownership từ đơn cũ

**Thiết kế LichSuSoHuu với hai cột nullable:**
```sql
-- Cấu trúc bảng
CREATE TABLE LichSuSoHuu (
    MaLichSuSoHuu INT PRIMARY KEY IDENTITY,
    MaTacPham INT NOT NULL,
    MaNguoiDung INT NULL,  -- Người dùng (khách hàng)
    MaHoaSi INT NULL,      -- Họa sĩ (tác giả)
    NgayNhan DATETIME NOT NULL,
    NgayChuyenGiao DATETIME NULL,
    LoaiChuyenGiao TINYINT NOT NULL, -- 0=CREATION, 1=SALE, 2=RESALE
    TrangThai TINYINT NOT NULL, -- 1=CURRENT, 2=TRANSFERRED, 3=REVERSED
    MaDonHang INT NULL,
    GhiChu NVARCHAR(500) NULL,
    
    -- CHECK constraint: đúng một trong hai cột phải NOT NULL
    CONSTRAINT CK_LichSuSoHuu_Owner CHECK (
        (MaNguoiDung IS NOT NULL AND MaHoaSi IS NULL) OR 
        (MaNguoiDung IS NULL AND MaHoaSi IS NOT NULL)
    ),
    
    -- Foreign keys thật
    CONSTRAINT FK_LichSuSoHuu_NguoiDung FOREIGN KEY (MaNguoiDung) 
        REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT FK_LichSuSoHuu_HoaSi FOREIGN KEY (MaHoaSi) 
        REFERENCES HoaSi(MaHoaSi),
    CONSTRAINT FK_LichSuSoHuu_TacPham FOREIGN KEY (MaTacPham) 
        REFERENCES TacPham(MaTacPham),
    CONSTRAINT FK_LichSuSoHuu_DonHang FOREIGN KEY (MaDonHang) 
        REFERENCES DonHang(MaDonHang),
    
    -- Unique constraint: một tác phẩm chỉ có một CURRENT
    CONSTRAINT UQ_LichSuSoHuu_Current UNIQUE (MaTacPham) 
        WHERE TrangThai = 1
);
```

**Migration Script:**
```sql
-- Bước 1: Tạo ownership CREATION cho tác phẩm chưa bán (họa sĩ giữ)
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT 
    t.MaTacPham,
    NULL as MaNguoiDung,
    t.MaHoaSi as MaHoaSi,
    t.NgayTao as NgayNhan,
    NULL as NgayChuyenGiao,
    0 as LoaiChuyenGiao, -- CREATION
    1 as TrangThai, -- CURRENT
    NULL as MaDonHang,
    N'Migration: Tác phẩm chưa bán' as GhiChu
FROM TacPham t
WHERE NOT EXISTS (
    SELECT 1 FROM ChiTietDonHang ct
    JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
    WHERE ct.MaTacPham = t.MaTacPham AND d.TrangThai = 3
);

-- Bước 2: Tạo ownership TRANSFERRED cho họa sĩ (tác phẩm đã bán)
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT DISTINCT
    ct.MaTacPham,
    NULL as MaNguoiDung,
    t.MaHoaSi as MaHoaSi,
    t.NgayTao as NgayNhan,
    d.NgayDat as NgayChuyenGiao, -- Tạm dùng NgayDat, không có thông tin chính xác
    0 as LoaiChuyenGiao, -- CREATION
    2 as TrangThai, -- TRANSFERRED
    NULL as MaDonHang,
    N'Migration: Sở hữu ban đầu của họa sĩ' as GhiChu
FROM ChiTietDonHang ct
JOIN DonHang d ON ct.MaDonHang = d.MaDonHang AND d.TrangThai = 3
JOIN TacPham t ON ct.MaTacPham = t.MaTacPham;

-- Bước 3: Tạo ownership CURRENT cho người mua (từ đơn đã giao)
INSERT INTO LichSuSoHuu (MaTacPham, MaNguoiDung, MaHoaSi, NgayNhan, 
    NgayChuyenGiao, LoaiChuyenGiao, TrangThai, MaDonHang, GhiChu)
SELECT 
    ct.MaTacPham,
    d.MaNguoiDung as MaNguoiDung,
    NULL as MaHoaSi,
    d.NgayDat as NgayNhan, -- Tạm dùng NgayDat, không có thông tin chính xác
    d.NgayDat as NgayChuyenGiao,
    1 as LoaiChuyenGiao, -- SALE
    1 as TrangThai, -- CURRENT
    d.MaDonHang,
    N'Migration: Đơn hàng đã giao từ hệ thống cũ' as GhiChu
FROM ChiTietDonHang ct
JOIN DonHang d ON ct.MaDonHang = d.MaDonHang
WHERE d.TrangThai = 3; -- Chỉ đơn đã giao
```

**⚠️ Hạn chế và lưu ý:**
- Không có thông tin chính xác về NgayChuyenGiao (ngày giao hàng thực tế), tạm dùng `DonHang.NgayDat`
- **KHÔNG cấp Certificate** cho dữ liệu cũ (vì không có bằng chứng, quy trình chưa tồn tại)
- Chỉ đơn hàng **MỚI** sau khi deploy module mới được cấp Certificate
- Nếu có nhiều tác phẩm trong một đơn: Mỗi tác phẩm tạo một bản ghi LichSuSoHuu riêng
- Nếu một tác phẩm bán nhiều lần (SoLuong > 1): Cần xử lý đặc biệt hoặc bỏ qua nếu là tác phẩm gốc duy nhất

### 9.3. Thêm cột vào TacPham
```sql
-- Thêm cột mới cho phân loại tác phẩm và quản lý bản in
ALTER TABLE TacPham ADD LoaiTacPham TINYINT NOT NULL DEFAULT 0; -- ORIGINAL
ALTER TABLE TacPham ADD MaTacPhamGoc INT NULL;
ALTER TABLE TacPham ADD SoBanIn INT NULL;
ALTER TABLE TacPham ADD TongSoBan INT NULL;

-- Foreign key
ALTER TABLE TacPham ADD CONSTRAINT FK_TacPham_TacPhamGoc 
    FOREIGN KEY (MaTacPhamGoc) REFERENCES TacPham(MaTacPham);
```

### 9.4. Thứ tự thực hiện Migration
1. **Tạo bảng mới:** BanQuyen, BangChungBanQuyen, LichSuSoHuu, ChungNhan, TranhChapBanQuyen, NhatKyHeThong, CertificatePendingQueue
2. **Thêm cột:** TacPham (LoaiTacPham, MaTacPhamGoc, SoBanIn, TongSoBan)
3. **Migrate dữ liệu:**
   - Tạo BanQuyen (LEGACY) cho tất cả TacPham hiện có
   - Tạo LichSuSoHuu từ đơn hàng đã giao
4. **Tạo indexes** cho hiệu năng
5. **Kiểm tra tính toàn vẹn** (run validation queries)

---

## 10. CÁC ĐIỂM ĐÃ QUYẾT ĐỊNH (DỰA TRÊN XÁC NHẬN TỪ CODE)

| # | Vấn đề | Quyết định cuối cùng | Xác nhận từ code |
|---|--------|----------------------|------------------|
| 1 | TacPham.TrangThai | **0**=ChoDuyet, **1**=DaDuyet, **3**=TuChoi, **99**=DaXoa | `BLL/AdminBusiness.cs` line 137, `BLL/HoaSiBusiness.cs` line 86 |
| 2 | DonHang.TrangThai | **3** = Đã giao (DaGiao) | `Helpers/DonHangStatus.cs` line 11 |
| 3 | Chủ sở hữu | Hai cột nullable (MaNguoiDung, MaHoaSi) + CHECK constraint | `Models/HoaSi.cs` line 7, `Models/NguoiDung.cs` line 7 - không có quan hệ trực tiếp |
| 4 | Dữ liệu cũ | LEGACY status, TẠO ownership từ đơn cũ, KHÔNG cấp Certificate | `Models/DonHang.cs` line 8 - có MaNguoiDung |
| 5 | Chính sách bán | MIXED: TacPham=1 AND BanQuyen IN (VERIFIED, LEGACY) | Dựa trên yêu cầu nghiệp vụ |
| 6 | Tranh chấp | OPEN không ẩn, chỉ UNDER_REVIEW mới ẩn | Tránh lạm dụng |
| 7 | ContentHash | HMAC-SHA256 với key bí mật | Bảo mật tốt hơn SHA256 thuần |
| 8 | DateTime | Luôn dùng UtcNow / GETUTCDATE() | Best practice |
| 9 | Bằng chứng | 2-10 file, 5MB/file, GUID filename | Bảo mật và quản lý |
| 10 | Rate limit | 20 req / 5 phút / IP | Cân bằng bảo vệ và trải nghiệm |
| 11 | Bản in | Mỗi bản là TacPham riêng, bảng Edition giai đoạn sau | Đơn giản hóa giai đoạn 1 |
| 12 | Che tên | Che một phần + toggle công khai | Cân bằng minh bạch và riêng tư |
| 13 | BackgroundService | Dùng .NET built-in, không Hangfire/Quartz | Giảm dependency |
| 14 | PDF Library | QuestPDF | Mã nguồn mở, miễn phí, hỗ trợ .NET 8 |
| 15 | RESALE | Không hỗ trợ giai đoạn 1 | Chưa có chức năng marketplace |

---

## 11. PHỤ LỤC

### 11.1. Thuật ngữ
| Tiếng Việt | Tiếng Anh | Entity/Field |
|------------|-----------|--------------|
| Bản quyền | Copyright | BanQuyen |
| Tác giả | Author/Artist | TacGia |
| Người nắm giữ quyền | Copyright Holder | NguoiGiuQuyen |
| Lịch sử sở hữu | Ownership History | LichSuSoHuu |
| Chủ sở hữu | Owner | ChuSoHuu |
| Chứng nhận | Certificate | ChungNhan |
| Giấy phép | License | GiayPhep |
| Bằng chứng | Evidence | BangChungBanQuyen |
| Tranh chấp | Dispute | **TranhChapBanQuyen** (không phải TraanhChap) |
| Nhật ký | Audit Log | NhatKyHeThong |
| Hàng đợi chứng nhận | Certificate Queue | CertificatePendingQueue |

### 11.2. Tham chiếu
- Tài liệu API: Xem `design.md`
- Danh sách tasks: Xem `tasks.md`
- Database schema: Xem `design.md` phần 3

---

**Phê duyệt:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] Stakeholders

## 12. TÍCH HỢP VỚI HỆ THỐNG HIỆN TẠI

### 12.1. Tích hợp vào luồng đơn hàng
**Event Hook:** Sau khi cập nhật `DonHang.TrangThai = 3` (DaGiao)

**Luồng xử lý:**
1. Hệ thống hiện tại đánh dấu đơn hàng đã giao
2. **Trigger module bản quyền:**
   - Với mỗi `ChiTietDonHang` trong đơn:
     - Cập nhật `LichSuSoHuu` (FR-O02)
     - Nếu `BanQuyen.TrangThai = VERIFIED`: Cấp Certificate (FR-CE01)
     - Nếu thất bại: Ghi vào `CertificatePendingQueue`
3. Trả về kết quả cho luồng chính
4. Đơn hàng vẫn hoàn tất bình thường (không bị block)

**Lưu ý:**
- Sử dụng **database transaction** để đảm bảo tính nhất quán
- Nếu cấp Certificate thất bại: Ghi log, đưa vào queue, không rollback đơn hàng
- Thông báo người mua: "Chứng nhận đang được xử lý, vui lòng kiểm tra lại sau"

### 12.2. Thông báo trong ứng dụng (In-App Notification)

**Các sự kiện cần thông báo:**
| Sự kiện | Người nhận | Nội dung |
|---------|-----------|----------|
| BanQuyen → VERIFIED | Họa sĩ | "Bản quyền tác phẩm [Tên] đã được xác minh" |
| BanQuyen → NEED_INFO | Họa sĩ | "Cần bổ sung thông tin cho tác phẩm [Tên]: [Lý do]" |
| BanQuyen → REJECTED | Họa sĩ | "Bản quyền tác phẩm [Tên] bị từ chối: [Lý do]" |
| TranhChap → UNDER_REVIEW | Họa sĩ | "Tác phẩm [Tên] có tranh chấp. Vui lòng phản hồi trong 7 ngày" |
| TranhChap → RESOLVED (VERIFIED) | Họa sĩ | "Tranh chấp tác phẩm [Tên] đã giải quyết, tác phẩm hợp lệ" |
| TranhChap → RESOLVED (REJECTED) | Họa sĩ | "Tranh chấp tác phẩm [Tên] đã giải quyết, bản quyền không hợp lệ" |
| Certificate cấp thành công | Người mua | "Chứng nhận cho [Tên tác phẩm] đã sẵn sàng" |
| Certificate bị thu hồi | Người sở hữu | "Chứng nhận [Mã] đã bị thu hồi" |
| Hoàn tiền được duyệt | Người mua | "Yêu cầu hoàn tiền đã được duyệt" |

**Triển khai:**
- Tạo bảng `ThongBao` (nếu chưa có)
- Gửi thông báo real-time qua SignalR (tùy chọn)
- Hiển thị badge số lượng thông báo chưa đọc
- Trang "Thông báo của tôi" để xem lịch sử

### 12.3. Màn hình Admin mới
1. **Quản lý bản quyền:** `/admin/copyright`
   - Danh sách tất cả BanQuyen
   - Lọc theo TrangThai
   - Xác minh/Từ chối/Yêu cầu bổ sung
   - Xem bằng chứng

2. **Quản lý tranh chấp:** `/admin/copyright/disputes`
   - Danh sách tranh chấp (OPEN, UNDER_REVIEW)
   - Lọc sơ bộ (OPEN → DISMISSED hoặc UNDER_REVIEW)
   - Xem bằng chứng từ hai phía
   - Quyết định cuối (RESOLVED)

3. **Chứng nhận chưa cấp:** `/admin/certificates/pending`
   - Danh sách từ `CertificatePendingQueue`
   - Lọc theo TrangThai (PENDING, FAILED)
   - Hiển thị: MaLichSuSoHuu, Tác phẩm, Người sở hữu, SoLanThu, Lỗi (nếu có)
   - Nút: "Thử lại", "Cấp thủ công"

4. **Quản lý chứng nhận:** `/admin/certificates`
   - Danh sách tất cả Certificate
   - Tìm kiếm theo CertificateCode
   - Thu hồi chứng nhận

5. **Nhật ký hệ thống:** `/admin/copyright/audit-logs`
   - Xem toàn bộ nhật ký
   - Lọc theo đối tượng, hành động, người thực hiện, thời gian

---

**Lịch sử thay đổi:**
| Phiên bản | Ngày | Người thay đổi | Nội dung |
|-----------|------|----------------|----------|
| 1.0 | 2026-09-28 | AI Assistant | Tạo ban đầu |
| 1.1 | 2026-09-28 | AI Assistant | Cập nhật đầy đủ theo feedback: (1) Xác nhận TacPham.TrangThai 0/1/3/99, DonHang.TrangThai=3 từ code; (2) LichSuSoHuu dùng 2 cột nullable (MaNguoiDung, MaHoaSi) + CHECK constraint, xóa -1; (3) Migration TẠO ownership từ đơn cũ, KHÔNG cấp Certificate; (4) FR-C04 tranh chấp: OPEN không ẩn, UNDER_REVIEW mới ẩn, họa sĩ phản hồi 7 ngày; (5) ContentHash HMAC-SHA256, DateTime.UtcNow, BaseUrl config, QuestPDF; (6) Rate limit 20/5min, ForwardedHeaders; (7) Điều kiện bán TacPham=1 AND BanQuyen IN (VERIFIED,LEGACY); (8) Bằng chứng GUID filename, 2-10 files, MIME check, API protected; (9) Đổi TraanhChap → TranhChap; (10) FR-CE02 RESALE giai đoạn sau; (11) BackgroundService + CertificatePendingQueue, màn hình Admin pending; (12) Thông báo in-app; (13) Tích hợp luồng đơn hàng |
