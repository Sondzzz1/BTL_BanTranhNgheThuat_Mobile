SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.DanhGia', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DanhGia
    (
        MaDanhGia INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DanhGia PRIMARY KEY,
        MaTacPham INT NOT NULL,
        MaNguoiDung INT NOT NULL,
        SoSao INT NOT NULL,
        NoiDung NVARCHAR(2000) NULL,
        HinhAnhDanhGia NVARCHAR(MAX) NULL,
        NgayTao DATETIME NOT NULL CONSTRAINT DF_DanhGia_NgayTao DEFAULT(GETDATE()),
        CONSTRAINT CK_DanhGia_SoSao CHECK (SoSao BETWEEN 1 AND 5)
    );
END;

IF OBJECT_ID(N'dbo.ThanhToan', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ThanhToan', N'NguoiXacNhan') IS NULL
    ALTER TABLE dbo.ThanhToan ADD NguoiXacNhan INT NULL;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.DanhGia', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS
        (
            SELECT 1 FROM sys.check_constraints
            WHERE parent_object_id=OBJECT_ID(N'dbo.DanhGia') AND name=N'CK_DanhGia_SoSao'
        )
        AND NOT EXISTS (SELECT 1 FROM dbo.DanhGia WHERE SoSao<1 OR SoSao>5)
            ALTER TABLE dbo.DanhGia WITH CHECK ADD CONSTRAINT CK_DanhGia_SoSao CHECK (SoSao BETWEEN 1 AND 5);

        IF NOT EXISTS
        (
            SELECT 1
            FROM sys.indexes i
            WHERE i.object_id=OBJECT_ID(N'dbo.DanhGia') AND i.is_unique=1
              AND 2=(SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)
              AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'MaNguoiDung')
              AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'MaTacPham')
        )
        AND NOT EXISTS
        (
            SELECT MaNguoiDung,MaTacPham FROM dbo.DanhGia
            GROUP BY MaNguoiDung,MaTacPham HAVING COUNT_BIG(*)>1
        )
            CREATE UNIQUE INDEX UX_DanhGia_NguoiDung_TacPham ON dbo.DanhGia(MaNguoiDung,MaTacPham);

        IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.DanhGia') AND name=N'FK_DanhGia_NguoiDung')
           AND NOT EXISTS (SELECT 1 FROM dbo.DanhGia d LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung=d.MaNguoiDung WHERE n.MaNguoiDung IS NULL)
            ALTER TABLE dbo.DanhGia WITH CHECK ADD CONSTRAINT FK_DanhGia_NguoiDung FOREIGN KEY(MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung);

        IF OBJECT_ID(N'dbo.TacPham',N'U') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.DanhGia') AND name=N'FK_DanhGia_TacPham')
           AND NOT EXISTS (SELECT 1 FROM dbo.DanhGia d LEFT JOIN dbo.TacPham t ON t.MaTacPham=d.MaTacPham WHERE t.MaTacPham IS NULL)
            ALTER TABLE dbo.DanhGia WITH CHECK ADD CONSTRAINT FK_DanhGia_TacPham FOREIGN KEY(MaTacPham) REFERENCES dbo.TacPham(MaTacPham);

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.DanhGia') AND name=N'IX_DanhGia_TacPham')
            CREATE INDEX IX_DanhGia_TacPham ON dbo.DanhGia(MaTacPham,NgayTao DESC);
    END;

    -- Không tạo trùng unique cart nếu database đã có constraint/index tương đương.
    IF OBJECT_ID(N'dbo.ChiTietGioHang',N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.indexes i
           WHERE i.object_id=OBJECT_ID(N'dbo.ChiTietGioHang') AND i.is_unique=1
             AND 2=(SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)
             AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'MaGioHang')
             AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name=N'MaTacPham')
       )
       AND NOT EXISTS (SELECT MaGioHang,MaTacPham FROM dbo.ChiTietGioHang GROUP BY MaGioHang,MaTacPham HAVING COUNT_BIG(*)>1)
        CREATE UNIQUE INDEX UX_ChiTietGioHang_GioHang_TacPham ON dbo.ChiTietGioHang(MaGioHang,MaTacPham);

    IF OBJECT_ID(N'dbo.ThanhToan',N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ThanhToan') AND is_unique=1 AND name=N'UX_ThanhToan_MaDonHang')
       AND NOT EXISTS (SELECT MaDonHang FROM dbo.ThanhToan GROUP BY MaDonHang HAVING COUNT_BIG(*)>1)
        CREATE UNIQUE INDEX UX_ThanhToan_MaDonHang ON dbo.ThanhToan(MaDonHang);

    IF OBJECT_ID(N'dbo.ThanhToan',N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.TaiKhoan',N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.ThanhToan',N'NguoiXacNhan') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.ThanhToan') AND name=N'FK_ThanhToan_NguoiXacNhan')
       AND NOT EXISTS (SELECT 1 FROM dbo.ThanhToan p LEFT JOIN dbo.TaiKhoan a ON a.MaTaiKhoan=p.NguoiXacNhan WHERE p.NguoiXacNhan IS NOT NULL AND a.MaTaiKhoan IS NULL)
        ALTER TABLE dbo.ThanhToan WITH CHECK ADD CONSTRAINT FK_ThanhToan_NguoiXacNhan FOREIGN KEY(NguoiXacNhan) REFERENCES dbo.TaiKhoan(MaTaiKhoan);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Audit only. Không tự sửa dữ liệu lịch sử mơ hồ.
SELECT N'duplicate cart lines' AS KiemTra,COUNT_BIG(*) AS SoBanGhi
FROM (SELECT MaGioHang,MaTacPham FROM dbo.ChiTietGioHang GROUP BY MaGioHang,MaTacPham HAVING COUNT_BIG(*)>1)d
UNION ALL
SELECT N'duplicate reviews',COUNT_BIG(*)
FROM (SELECT MaNguoiDung,MaTacPham FROM dbo.DanhGia GROUP BY MaNguoiDung,MaTacPham HAVING COUNT_BIG(*)>1)d
UNION ALL
SELECT N'orphan reviews',COUNT_BIG(*)
FROM dbo.DanhGia d LEFT JOIN dbo.NguoiDung n ON n.MaNguoiDung=d.MaNguoiDung LEFT JOIN dbo.TacPham t ON t.MaTacPham=d.MaTacPham
WHERE n.MaNguoiDung IS NULL OR t.MaTacPham IS NULL
UNION ALL
SELECT N'invalid rating',COUNT_BIG(*) FROM dbo.DanhGia WHERE SoSao<1 OR SoSao>5
UNION ALL
SELECT N'review comments over 500',COUNT_BIG(*) FROM dbo.DanhGia WHERE LEN(LTRIM(RTRIM(ISNULL(NoiDung,N''))))>500;

SELECT d.MaDonHang,d.TongTien AS TongTienDonHang,
       x.TongSnapshotChiTiet,d.TongTien-x.TongSnapshotChiTiet AS ChenhLech
FROM dbo.DonHang d
CROSS APPLY
(
    SELECT ISNULL(SUM(c.SoLuong*c.DonGia),0) AS TongSnapshotChiTiet
    FROM dbo.ChiTietDonHang c WHERE c.MaDonHang=d.MaDonHang
)x
WHERE d.TongTien<>x.TongSnapshotChiTiet
ORDER BY d.MaDonHang;
GO
