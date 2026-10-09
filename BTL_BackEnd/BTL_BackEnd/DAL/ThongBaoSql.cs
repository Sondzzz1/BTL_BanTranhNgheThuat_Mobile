using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using DoAn2_BackEnd.Helpers;

namespace DoAn2_BackEnd.DAL;

/// <summary>Writes an inbox entry using the caller's SQL transaction when supplied.</summary>
internal static class ThongBaoSql
{
    // Callers hold the workflow entity's update lock until commit. The inbox identity
    // is a persisted revision, including legacy entities with no version column.
    public static async Task StampEventAsync(SqlConnection connection, SqlTransaction transaction, ThongBao item)
    {
        await using var version = new SqlCommand(@"SELECT ISNULL(MAX(MaThongBao),0) FROM ThongBao
            WHERE LoaiDoiTuong=@Entity AND MaDoiTuong=@Id;", connection, transaction);
        version.Parameters.AddWithValue("@Entity", item.LoaiDoiTuong!);
        version.Parameters.AddWithValue("@Id", item.MaDoiTuong!);
        var revision = Convert.ToInt64(await version.ExecuteScalarAsync());
        item.EventKey = $"{item.Loai}:{item.MaDoiTuong}:{revision + 1}";
    }

    public static async Task NotifyAdminsAsync(SqlConnection connection, SqlTransaction transaction, ThongBao item)
    {
        await StampEventAsync(connection, transaction, item);
        var eventKey = item.EventKey;
        var accounts = new List<int>();
        await using var get = new SqlCommand("SELECT MaTaiKhoan FROM TaiKhoan WHERE VaiTro=0 AND TrangThai=1 ORDER BY MaTaiKhoan;", connection, transaction);
        await using (var reader = await get.ExecuteReaderAsync())
            while (await reader.ReadAsync()) accounts.Add(reader.GetInt32(0));
        foreach (var id in accounts)
        {
            item.MaTaiKhoan = id;
            item.EventKey = $"{eventKey}:A:{id}";
            await InsertAsync(connection, transaction, item);
        }
    }

    public static async Task<(int AccountId, string Artist, string Name)> LockArtworkAsync(SqlConnection connection, SqlTransaction transaction, int id, int? artistId = null)
    {
        await using var get = new SqlCommand(@"SELECT h.MaTaiKhoan,h.TenHoaSi,t.TenTacPham
            FROM TacPham t WITH (UPDLOCK,HOLDLOCK) INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
            WHERE t.MaTacPham=@Id AND (@Artist IS NULL OR t.MaHoaSi=@Artist);", connection, transaction);
        get.Parameters.AddWithValue("@Id", id);
        get.Parameters.AddWithValue("@Artist", (object?)artistId ?? DBNull.Value);
        await using var reader = await get.ExecuteReaderAsync();
        if (!await reader.ReadAsync() || reader.IsDBNull(0)) throw new UnauthorizedAccessException("Không tìm thấy chủ sở hữu tác phẩm");
        return (reader.GetInt32(0), reader.GetString(1), reader.GetString(2));
    }

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
