-- ================================================================
-- MIGRATION: Tạo bảng YeuCauHoanTra (Yêu cầu hoàn trả sản phẩm)
-- Ngày tạo: 2026-09-08
-- Chạy script này SAU KHI deploy Backend mới
-- ================================================================

-- Kiểm tra nếu bảng chưa tồn tại thì mới tạo
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'YeuCauHoanTra')
BEGIN
    CREATE TABLE YeuCauHoanTra (
        MaYeuCau        INT IDENTITY(1,1) PRIMARY KEY,
        MaDonHang       INT NOT NULL,
        MaNguoiDung     INT NOT NULL,
        MaTacPham       INT NOT NULL,

        -- Lý do hoàn trả được chọn từ danh sách cố định
        -- SAN_PHAM_HU_HONG | SAI_MO_TA | GIAO_SAI | LOI_SAN_PHAM | KHONG_DUNG_DAT | LY_DO_KHAC
        LyDo            NVARCHAR(50)  NOT NULL,

        -- Lý do chi tiết khi chọn LY_DO_KHAC
        LyDoKhac        NVARCHAR(500) NULL,

        -- Mô tả chi tiết vấn đề từ khách hàng
        MoTa            NVARCHAR(2000) NULL,

        -- JSON array chứa danh sách URL hình ảnh minh chứng
        -- Ví dụ: ["https://...img1.jpg", "https://...img2.jpg"]
        HinhAnh         NVARCHAR(MAX) NULL,

        -- Trạng thái xử lý quy trình hoàn trả
        -- CHO_DUYET → DA_DUYET/TU_CHOI → DANG_HOAN_TRA → DA_NHAN_HANG → DA_HOAN_TIEN → HOAN_TAT
        TrangThai       NVARCHAR(30)  NOT NULL DEFAULT 'CHO_DUYET',

        -- Lý do từ chối (chỉ có khi TrangThai = TU_CHOI)
        LyDoTuChoi      NVARCHAR(1000) NULL,

        NgayTao         DATETIME NOT NULL DEFAULT GETDATE(),
        NgayCapNhat     DATETIME NOT NULL DEFAULT GETDATE(),

        -- Foreign Keys
        CONSTRAINT FK_YeuCauHoanTra_DonHang
            FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
        CONSTRAINT FK_YeuCauHoanTra_NguoiDung
            FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_YeuCauHoanTra_TacPham
            FOREIGN KEY (MaTacPham) REFERENCES TacPham(MaTacPham),

        -- Chỉ 1 yêu cầu hoàn trả đang active cho mỗi sản phẩm trong đơn hàng
        -- (cho phép tạo lại nếu yêu cầu trước bị từ chối)
        CONSTRAINT CHK_YeuCauHoanTra_TrangThai
            CHECK (TrangThai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'DANG_HOAN_TRA', 'DA_NHAN_HANG', 'DA_HOAN_TIEN', 'HOAN_TAT'))
    );

    -- Index để tăng tốc query theo người dùng và theo đơn hàng
    CREATE INDEX IX_YeuCauHoanTra_NguoiDung ON YeuCauHoanTra(MaNguoiDung);
    CREATE INDEX IX_YeuCauHoanTra_DonHang ON YeuCauHoanTra(MaDonHang);
    CREATE INDEX IX_YeuCauHoanTra_TrangThai ON YeuCauHoanTra(TrangThai);

    PRINT 'Tạo bảng YeuCauHoanTra thành công';
END
ELSE
BEGIN
    PRINT 'Bảng YeuCauHoanTra đã tồn tại - bỏ qua';
END

-- Kiểm tra cột ChiTietDonHang (nếu tên bảng khác thì sửa lại)
-- Script này giả định bảng join giữa DonHang và TacPham là ChiTietDonHang
-- Nếu tên khác (VD: DonHang_ChiTiet) thì cập nhật trong HoanTraRepository.cs
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ChiTietDonHang')
    PRINT 'Bảng ChiTietDonHang tồn tại - OK'
ELSE
    PRINT 'CẢNH BÁO: Không tìm thấy bảng ChiTietDonHang. Kiểm tra lại tên bảng trong HoanTraRepository.cs'
