using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

internal sealed record ArtworkSaleSnapshot(SaleEligibility Eligibility, int Stock, bool DeclarationComplete, string RightsStatus);

internal static class ArtworkSaleSql
{
    public static async Task<Dictionary<int, ArtworkSaleSnapshot>> LoadAsync(SqlConnection connection,
        SqlTransaction? transaction, IEnumerable<int> artworkIds)
    {
        var result = new Dictionary<int, ArtworkSaleSnapshot>();
        // Batch queries avoid N+1 and SQL Server's parameter limit on large lists.
        foreach (var ids in artworkIds.Distinct().OrderBy(id => id).Chunk(500))
        {
            var parameters = ids.Select((_, index) => $"@Id{index}").ToArray();
            var locks = transaction == null ? "" : " WITH (UPDLOCK,HOLDLOCK)";
            using var command = new SqlCommand($@"
                SELECT t.MaTacPham,t.TrangThai,t.SoLuong,t.MaYeuCauVeTranh,
                       t.LaTacPhamDocBan,t.SoLuongBanDau,t.Gia,t.LoaiTacPham,
                       t.MaTacPhamGoc,t.TenTacPhamGoc,t.TacGiaGoc,t.KhongXacDinhTacGiaGoc,
                       t.NguonThamKhao,t.MoTaNguonGoc,
                       b.TrangThai AS RightsStatus,b.CanCuSuDung,ISNULL(b.BiChanBan,0) AS Blocked,
                       b.TacGia,b.NguonGoc
                FROM TacPham t{locks}
                LEFT JOIN BanQuyen b{locks} ON b.MaTacPham=t.MaTacPham
                WHERE t.MaTacPham IN ({string.Join(',', parameters)})
                ORDER BY t.MaTacPham;", connection, transaction);
            for (var index = 0; index < ids.Length; index++) command.Parameters.AddWithValue(parameters[index], ids[index]);
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                byte? rights = reader.IsDBNull(14) ? null : reader.GetByte(14);
                byte? basis = reader.IsDBNull(15) ? null : reader.GetByte(15);
                var type = reader.GetByte(7);
                bool Filled(int index) => !reader.IsDBNull(index) && !string.IsNullOrWhiteSpace(reader.GetString(index));
                var originComplete = type switch
                {
                    0 => true,
                    2 => !reader.IsDBNull(8) || Filled(9) && (Filled(10) || reader.GetBoolean(11)),
                    4 => Filled(12) && Filled(13),
                    _ => false,
                };
                var declared = rights.HasValue && CopyrightUsageBases.IsValid(basis) && Filled(17) && Filled(18) && originComplete;
                var stock = reader.GetInt32(2);
                var eligibility = ArtworkSalePolicy.Evaluate(reader.GetByte(1), rights, basis, declared,
                    reader.GetBoolean(16), stock, !reader.IsDBNull(3), reader.GetBoolean(4),
                    reader.IsDBNull(5) ? null : reader.GetInt32(5), reader.GetDecimal(6));
                result[reader.GetInt32(0)] = new(eligibility, stock, declared, rights.HasValue ? CopyrightStatuses.ToCode(rights.Value) : "UNDECLARED");
            }
        }
        return result;
    }

    public static async Task PopulateAsync(SqlConnection connection, IEnumerable<TacPham> artworks)
    {
        var items = artworks.ToList();
        var sales = await LoadAsync(connection, null, items.Select(item => item.MaTacPham));
        foreach (var item in items)
            if (sales.TryGetValue(item.MaTacPham, out var sale))
            {
                item.SaleEligibility = sale.Eligibility;
                item.RightsStatus = sale.RightsStatus;
            }
    }

    public static async Task EnsureDeclaredAsync(SqlConnection connection, SqlTransaction transaction, int artworkId)
    {
        var sales = await LoadAsync(connection, transaction, new[] { artworkId });
        if (!sales.TryGetValue(artworkId, out var sale) || !sale.DeclarationComplete)
            throw new BusinessConflictException("Vui lòng hoàn thành khai báo nguồn gốc/quyền sử dụng tại mục Nguồn gốc và xác minh trước khi gửi duyệt tác phẩm.");
    }
}
