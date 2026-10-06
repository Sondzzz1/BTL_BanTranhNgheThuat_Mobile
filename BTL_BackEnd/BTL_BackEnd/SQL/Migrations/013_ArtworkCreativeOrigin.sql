-- Creative-origin details for artworks whose source is outside this catalogue.
-- Existing artworks remain readable: new text fields are nullable and unknown-author defaults to false.
-- Run this migration before deploying code that writes these fields.
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.TacPham', N'TenTacPhamGoc') IS NULL
        ALTER TABLE dbo.TacPham ADD TenTacPhamGoc NVARCHAR(500) NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'NguonThamKhao') IS NULL
        ALTER TABLE dbo.TacPham ADD NguonThamKhao NVARCHAR(1000) NULL;

    IF COL_LENGTH(N'dbo.TacPham', N'KhongXacDinhTacGiaGoc') IS NULL
        ALTER TABLE dbo.TacPham ADD KhongXacDinhTacGiaGoc BIT NOT NULL
            CONSTRAINT DF_TacPham_KhongXacDinhTacGiaGoc DEFAULT (0) WITH VALUES;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
