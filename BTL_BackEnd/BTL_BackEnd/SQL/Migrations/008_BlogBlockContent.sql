/*
  Blog block content v1.
  - Không chuyển đổi hoặc xóa NoiDung cũ.
  - Chỉ bảo đảm BaiViet.NoiDung đủ chỗ cho JSON blocks.
  - Ảnh tiếp tục nằm trong HinhAnhBaiViet; JSON chỉ lưu imageId.
*/
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.BaiViet', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.BaiViet', N'NoiDung') IS NOT NULL
   AND EXISTS
   (
       SELECT 1 FROM sys.columns
       WHERE object_id = OBJECT_ID(N'dbo.BaiViet')
         AND name = N'NoiDung'
         AND (system_type_id NOT IN (231, 239) OR max_length <> -1)
   )
BEGIN
    DECLARE @Nullable NVARCHAR(8) = CASE WHEN EXISTS
    (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.BaiViet') AND name = N'NoiDung' AND is_nullable = 1
    ) THEN N'NULL' ELSE N'NOT NULL' END;

    EXEC(N'ALTER TABLE dbo.BaiViet ALTER COLUMN NoiDung NVARCHAR(MAX) ' + @Nullable + N';');
END;
GO

SELECT
    SUM(CASE WHEN NoiDung IS NULL OR LTRIM(RTRIM(NoiDung)) = N'' THEN 1 ELSE 0 END) AS EmptyContent,
    SUM(CASE WHEN ISJSON(NoiDung) = 1 AND JSON_VALUE(CASE WHEN ISJSON(NoiDung)=1 THEN NoiDung ELSE N'{}' END, '$.version') = '1' AND JSON_QUERY(CASE WHEN ISJSON(NoiDung)=1 THEN NoiDung ELSE N'{}' END, '$.blocks') IS NOT NULL THEN 1 ELSE 0 END) AS BlockContentV1,
    SUM(CASE WHEN NoiDung IS NOT NULL AND LTRIM(RTRIM(NoiDung)) <> N'' AND NOT (ISJSON(NoiDung) = 1 AND JSON_VALUE(CASE WHEN ISJSON(NoiDung)=1 THEN NoiDung ELSE N'{}' END, '$.version') = '1' AND JSON_QUERY(CASE WHEN ISJSON(NoiDung)=1 THEN NoiDung ELSE N'{}' END, '$.blocks') IS NOT NULL) THEN 1 ELSE 0 END) AS LegacyContent
FROM dbo.BaiViet;
GO
