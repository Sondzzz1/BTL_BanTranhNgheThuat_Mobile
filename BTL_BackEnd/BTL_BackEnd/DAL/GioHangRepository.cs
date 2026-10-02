using System.Data;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Helpers;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class GioHangRepository : IGioHangRepository
{
    private readonly string _connectionString;
    private readonly DateTime _copyrightEnforcementStartUtc;

    public GioHangRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
        _copyrightEnforcementStartUtc = CopyrightOptions.From(configuration).EnforcementStartUtc;
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

    public async Task<bool> AddOrIncrementTransactional(int maNguoiDung, int maTacPham, int soLuong)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            const string productSql = @"
                SELECT t.TenTacPham,t.SoLuong,t.TrangThai,t.MaYeuCauVeTranh,
                       CASE WHEN ((NOT EXISTS (SELECT 1 FROM BanQuyen b0 WHERE b0.MaTacPham=t.MaTacPham)
                                      AND t.NgayTao<@EnforcementStart)
                                  OR EXISTS (SELECT 1 FROM BanQuyen b WHERE b.MaTacPham=t.MaTacPham
                                             AND b.BiChanBan=0
                                             AND (b.TrangThai=2 OR ((t.NgayTao<@EnforcementStart OR b.LaDuLieuCu=1)
                                                  AND b.TrangThai IN (0,1,5)))))
                            THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END
                FROM TacPham t WITH (UPDLOCK,HOLDLOCK)
                WHERE t.MaTacPham=@MaTacPham;";
            await using var product = new SqlCommand(productSql, connection, transaction);
            product.Parameters.AddWithValue("@MaTacPham", maTacPham);
            product.Parameters.AddWithValue("@EnforcementStart", _copyrightEnforcementStartUtc);
            string productName;
            int stock;
            byte status;
            bool isCommission;
            bool copyrightSellable;
            await using (var reader = await product.ExecuteReaderAsync())
            {
                if (!await reader.ReadAsync()) throw new KeyNotFoundException("Tác phẩm không tồn tại");
                productName = reader.GetString(0);
                stock = reader.GetInt32(1);
                status = reader.GetByte(2);
                isCommission = !reader.IsDBNull(3);
                copyrightSellable = reader.GetBoolean(4);
            }
            if (isCommission)
                throw new BusinessConflictException("Tác phẩm nội bộ của yêu cầu vẽ tranh không được thêm vào giỏ hàng");
            if (status != 1) throw new BusinessConflictException("Tác phẩm hiện không khả dụng");
            if (!copyrightSellable)
                throw new BusinessConflictException("Tác phẩm chưa đủ điều kiện nguồn gốc hoặc đã bị từ chối/thu hồi");

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
