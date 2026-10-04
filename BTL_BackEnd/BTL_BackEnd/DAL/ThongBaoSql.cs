using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

/// <summary>Writes an inbox entry using the caller's SQL transaction when supplied.</summary>
internal static class ThongBaoSql
{
    public static async Task<long> InsertAsync(SqlConnection connection, SqlTransaction? transaction, ThongBao thongBao)
    {
        const string sql = @"
            DECLARE @ExistingId BIGINT = NULL;
            IF @EventKey IS NOT NULL
                SELECT @ExistingId=MaThongBao FROM ThongBao WITH (UPDLOCK,HOLDLOCK) WHERE EventKey=@EventKey;
            IF @ExistingId IS NULL
            BEGIN
                INSERT INTO ThongBao
                    (MaTaiKhoan,Loai,TieuDe,NoiDung,LoaiDoiTuong,MaDoiTuong,DuongDan,EventKey,DaDoc,NgayTao)
                OUTPUT INSERTED.MaThongBao
                VALUES
                    (@MaTaiKhoan,@Loai,@TieuDe,@NoiDung,@LoaiDoiTuong,@MaDoiTuong,@DuongDan,@EventKey,0,SYSUTCDATETIME());
            END
            ELSE SELECT @ExistingId;";

        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.AddWithValue("@MaTaiKhoan", thongBao.MaTaiKhoan);
        command.Parameters.AddWithValue("@Loai", thongBao.Loai);
        command.Parameters.AddWithValue("@TieuDe", thongBao.TieuDe);
        command.Parameters.AddWithValue("@NoiDung", thongBao.NoiDung);
        command.Parameters.AddWithValue("@LoaiDoiTuong", (object?)thongBao.LoaiDoiTuong ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaDoiTuong", (object?)thongBao.MaDoiTuong ?? DBNull.Value);
        command.Parameters.AddWithValue("@DuongDan", (object?)thongBao.DuongDan ?? DBNull.Value);
        command.Parameters.AddWithValue("@EventKey", (object?)thongBao.EventKey ?? DBNull.Value);
        return Convert.ToInt64(await command.ExecuteScalarAsync());
    }
}
