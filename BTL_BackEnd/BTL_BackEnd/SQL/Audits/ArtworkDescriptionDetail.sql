-- Read-only candidates, NOT proof of automatic copying. No changes to historical data.
SELECT c.MaChiTiet, c.MaTacPham, t.TenTacPham, c.TrangThai,
       c.NgayTao, c.NgayCapNhat, t.MoTa, c.ThongTinBosung,
       c.CauChuyenSangTac, c.YNghiaNghiThuat, c.KyThuatThucHien, c.CamHungSangTao,
       c.NamSangTac, c.DiaDiemSangTac, c.HinhAnh1, c.HinhAnh2, c.HinhAnh3, c.HinhAnh4
FROM ChiTietTacPham c
JOIN TacPham t ON t.MaTacPham = c.MaTacPham
WHERE NULLIF(LTRIM(RTRIM(t.MoTa)), N'') IS NOT NULL
  AND LTRIM(RTRIM(c.ThongTinBosung)) COLLATE Latin1_General_100_BIN2
      = LTRIM(RTRIM(t.MoTa)) COLLATE Latin1_General_100_BIN2
  AND c.NamSangTac IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM (VALUES (c.CauChuyenSangTac), (c.YNghiaNghiThuat),
          (c.KyThuatThucHien), (c.CamHungSangTao), (c.DiaDiemSangTac),
          (c.HinhAnh1), (c.HinhAnh2), (c.HinhAnh3), (c.HinhAnh4)) v(Content)
      WHERE NULLIF(LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(v.Content,
          CHAR(9), N' '), CHAR(10), N' '), CHAR(13), N' '))), N'') IS NOT NULL
  )
ORDER BY c.MaTacPham;
