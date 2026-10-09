/* Only missing capability: persist the caller's opaque create-request key, even
   when there are no active Admin recipients. Existing notification schema stays intact. */
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
BEGIN TRANSACTION;
IF COL_LENGTH(N'dbo.TacPham', N'SubmitRequestKey') IS NULL
    ALTER TABLE dbo.TacPham ADD SubmitRequestKey UNIQUEIDENTIFIER NULL;
IF COL_LENGTH(N'dbo.TacPham', N'SubmitRequestHash') IS NULL
    ALTER TABLE dbo.TacPham ADD SubmitRequestHash CHAR(64) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TacPham') AND name=N'UX_TacPham_SubmitRequestKey')
    CREATE UNIQUE INDEX UX_TacPham_SubmitRequestKey ON dbo.TacPham(MaHoaSi,SubmitRequestKey) WHERE SubmitRequestKey IS NOT NULL;
/* Early local databases have the inbox columns but missed migration 010's index.
   Never delete/merge existing inbox rows to make this constraint pass. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ThongBao') AND name=N'UX_ThongBao_EventKey')
BEGIN
    IF EXISTS (SELECT EventKey FROM dbo.ThongBao WHERE EventKey IS NOT NULL GROUP BY EventKey HAVING COUNT_BIG(*)>1)
        THROW 51014, N'Có EventKey trùng trong dữ liệu cũ; cần audit trước khi áp dụng index.', 1;
    CREATE UNIQUE INDEX UX_ThongBao_EventKey ON dbo.ThongBao(EventKey) WHERE EventKey IS NOT NULL;
END;
COMMIT TRANSACTION;
