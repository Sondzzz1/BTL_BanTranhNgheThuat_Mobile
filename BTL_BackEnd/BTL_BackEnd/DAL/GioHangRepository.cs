using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class GioHangRepository : IGioHangRepository
{
    private readonly string _connectionString;

    public GioHangRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<GioHang?> GetByNguoiDung(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM GioHang WHERE MaNguoiDung = @MaNguoiDung";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new GioHang
            {
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung"))
            };
        }
        return null;
    }

    public async Task<int> CreateGioHang(int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO GioHang (MaNguoiDung) VALUES (@MaNguoiDung);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<ChiTietGioHang>> GetChiTiet(int maGioHang)
    {
        var list = new List<ChiTietGioHang>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            });
        }
        return list;
    }

    public async Task<ChiTietGioHang?> GetChiTietByTacPham(int maGioHang, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang AND MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            };
        }
        return null;
    }

    public async Task<ChiTietGioHang?> GetChiTietById(int maChiTietGH)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM ChiTietGioHang WHERE MaChiTietGH = @MaChiTietGH";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", maChiTietGH);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new ChiTietGioHang
            {
                MaChiTietGH = reader.GetInt32(reader.GetOrdinal("MaChiTietGH")),
                MaGioHang = reader.GetInt32(reader.GetOrdinal("MaGioHang")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"))
            };
        }
        return null;
    }

    public async Task<int> AddChiTiet(ChiTietGioHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ChiTietGioHang (MaGioHang, MaTacPham, SoLuong)
                      VALUES (@MaGioHang, @MaTacPham, @SoLuong);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", chiTiet.MaGioHang);
        command.Parameters.AddWithValue("@MaTacPham", chiTiet.MaTacPham);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<bool> UpdateChiTiet(ChiTietGioHang chiTiet)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE ChiTietGioHang 
                      SET SoLuong = @SoLuong 
                      WHERE MaChiTietGH = @MaChiTietGH";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", chiTiet.MaChiTietGH);
        command.Parameters.AddWithValue("@SoLuong", chiTiet.SoLuong);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteChiTiet(int maChiTietGH)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM ChiTietGioHang WHERE MaChiTietGH = @MaChiTietGH";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaChiTietGH", maChiTietGH);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> ClearGioHang(int maGioHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM ChiTietGioHang WHERE MaGioHang = @MaGioHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaGioHang", maGioHang);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<List<DoAn2_BackEnd.DTO.ChiTietGioHangResponse>> GetView(int maGioHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var command = new SqlCommand(@"
            SELECT c.MaChiTietGH,c.MaTacPham,c.SoLuong,t.TenTacPham,t.Gia,t.HinhAnh,t.SoLuong AS Stock,h.TenHoaSi
            FROM ChiTietGioHang c JOIN TacPham t ON t.MaTacPham=c.MaTacPham
            JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
            WHERE c.MaGioHang=@Id AND t.MaYeuCauVeTranh IS NULL ORDER BY c.MaChiTietGH;", connection);
        command.Parameters.AddWithValue("@Id", maGioHang);
        var items = new List<DoAn2_BackEnd.DTO.ChiTietGioHangResponse>();
        using (var reader = await command.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync()) items.Add(new()
            {
                MaChiTietGH = reader.GetInt32(0), MaTacPham = reader.GetInt32(1), SoLuong = reader.GetInt32(2),
                TenTacPham = reader.GetString(3), Gia = reader.GetDecimal(4), HinhAnh = reader.IsDBNull(5) ? null : reader.GetString(5),
                SoLuongTon = reader.GetInt32(6), TenHoaSi = reader.GetString(7), ThanhTien = reader.GetDecimal(4) * reader.GetInt32(2),
            });
        }
        var sales = await ArtworkSaleSql.LoadAsync(connection, null, items.Select(item => item.MaTacPham));
        foreach (var item in items)
        {
            var sale = sales[item.MaTacPham];
            item.SoLuongTon = sale.Stock;
            item.SaleEligibility = sale.Eligibility;
            if (item.CanSell && item.SoLuong > sale.Stock)
                item.SaleEligibility = SaleEligibility.Unavailable("INSUFFICIENT_STOCK", "Số lượng trong giỏ vượt quá tồn kho hiện tại.");
        }
        return items;
    }

    public async Task<bool> UpdateQuantityTransactional(int maNguoiDung, int maChiTietGH, int soLuong)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        using var find = new SqlCommand(@"SELECT c.MaTacPham FROM ChiTietGioHang c JOIN GioHang g ON g.MaGioHang=c.MaGioHang
            WHERE c.MaChiTietGH=@Id AND g.MaNguoiDung=@User;", connection, transaction);
        find.Parameters.AddWithValue("@Id", maChiTietGH); find.Parameters.AddWithValue("@User", maNguoiDung);
        var value = await find.ExecuteScalarAsync();
        if (value == null) return false;
        var id = Convert.ToInt32(value);
        var sale = (await ArtworkSaleSql.LoadAsync(connection, transaction, new[] { id }))[id];
        ArtworkSalePolicy.EnsureCanSell(sale.Eligibility, $"#{id}");
        if (soLuong <= 0 || soLuong > sale.Stock) throw new BusinessConflictException("Số lượng không hợp lệ hoặc vượt quá tồn kho hiện tại.");
        using var update = new SqlCommand(@"UPDATE c SET SoLuong=@Qty FROM ChiTietGioHang c
            JOIN GioHang g ON g.MaGioHang=c.MaGioHang WHERE c.MaChiTietGH=@Id AND g.MaNguoiDung=@User;", connection, transaction);
        update.Parameters.AddWithValue("@Qty", soLuong); update.Parameters.AddWithValue("@Id", maChiTietGH); update.Parameters.AddWithValue("@User", maNguoiDung);
        var changed = await update.ExecuteNonQueryAsync() == 1;
        transaction.Commit(); return changed;
    }

    public async Task<bool> AddOrIncrementTransactional(int maNguoiDung, int maTacPham, int soLuong)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            const string productSql = @"SELECT t.TenTacPham,t.SoLuong FROM TacPham t WITH (UPDLOCK,HOLDLOCK) WHERE t.MaTacPham=@MaTacPham;";
            await using var product = new SqlCommand(productSql, connection, transaction);
            product.Parameters.AddWithValue("@MaTacPham", maTacPham);
            string productName;
            int stock;
            await using (var reader = await product.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) throw new KeyNotFoundException("Tác phẩm không tồn tại");
                productName = reader.GetString(0);
                stock = reader.GetInt32(1);
            }
            var sales = await ArtworkSaleSql.LoadAsync(connection, transaction, new[] { maTacPham });
            ArtworkSalePolicy.EnsureCanSell(sales[maTacPham].Eligibility, productName);

            const string cartSql = "SELECT MaGioHang FROM GioHang WITH (UPDLOCK,HOLDLOCK) WHERE MaNguoiDung=@MaNguoiDung;";
            await using var cart = new SqlCommand(cartSql, connection, transaction);
            cart.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
            var cartValue = await cart.ExecuteScalarAsync();
            int cartId;
            if (cartValue == null || cartValue == DBNull.Value)
            {
                const string createCartSql = "INSERT INTO GioHang(MaNguoiDung) OUTPUT INSERTED.MaGioHang VALUES(@MaNguoiDung);";
                await using var createCart = new SqlCommand(createCartSql, connection, transaction);
                createCart.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
                cartId = Convert.ToInt32(await createCart.ExecuteScalarAsync());
            }
            else
            {
                cartId = Convert.ToInt32(cartValue);
            }

            const string lineSql = @"
                SELECT MaChiTietGH,SoLuong
                FROM ChiTietGioHang WITH (UPDLOCK,HOLDLOCK)
                WHERE MaGioHang=@MaGioHang AND MaTacPham=@MaTacPham;";
            await using var line = new SqlCommand(lineSql, connection, transaction);
            line.Parameters.AddWithValue("@MaGioHang", cartId);
            line.Parameters.AddWithValue("@MaTacPham", maTacPham);
            int? lineId = null;
            var currentQuantity = 0;
            await using (var reader = await line.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    lineId = reader.GetInt32(0);
                    currentQuantity = reader.GetInt32(1);
                }
            }

            var nextQuantity = checked(currentQuantity + soLuong);
            if (nextQuantity > stock)
                throw new BusinessConflictException($"Sản phẩm '{productName}' không đủ số lượng (chỉ còn {stock})");

            if (lineId.HasValue)
            {
                const string updateSql = "UPDATE ChiTietGioHang SET SoLuong=@SoLuong WHERE MaChiTietGH=@MaChiTietGH;";
                await using var update = new SqlCommand(updateSql, connection, transaction);
                update.Parameters.AddWithValue("@SoLuong", nextQuantity);
                update.Parameters.AddWithValue("@MaChiTietGH", lineId.Value);
                if (await update.ExecuteNonQueryAsync() != 1) throw new DBConcurrencyException("Giỏ hàng đã thay đổi");
            }
            else
            {
                const string insertSql = @"
                    INSERT INTO ChiTietGioHang(MaGioHang,MaTacPham,SoLuong)
                    VALUES(@MaGioHang,@MaTacPham,@SoLuong);";
                await using var insert = new SqlCommand(insertSql, connection, transaction);
                insert.Parameters.AddWithValue("@MaGioHang", cartId);
                insert.Parameters.AddWithValue("@MaTacPham", maTacPham);
                insert.Parameters.AddWithValue("@SoLuong", soLuong);
                if (await insert.ExecuteNonQueryAsync() != 1) throw new DBConcurrencyException("Không thể thêm sản phẩm vào giỏ hàng");
            }

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
