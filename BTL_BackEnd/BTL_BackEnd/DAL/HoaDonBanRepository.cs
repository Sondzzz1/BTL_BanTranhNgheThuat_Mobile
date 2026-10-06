using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class HoaDonBanRepository : IHoaDonBanRepository
{
    private readonly string _connectionString;

    public HoaDonBanRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<HoaDonBan?> GetByMaHoaDon(int maHoaDon)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = "SELECT * FROM HoaDonBan WHERE MaHoaDon=@MaHoaDon;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaHoaDon", maHoaDon);

        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var hoaDon = MapToHoaDonBan(reader);
        await reader.CloseAsync();

        hoaDon.ChiTiet = await LoadChiTiet(connection, hoaDon.MaHoaDon);
        return hoaDon;
    }

    public async Task<HoaDonBan?> GetByMaDonHang(int maDonHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = "SELECT * FROM HoaDonBan WHERE MaDonHang=@MaDonHang;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);

        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var hoaDon = MapToHoaDonBan(reader);
        await reader.CloseAsync();

        hoaDon.ChiTiet = await LoadChiTiet(connection, hoaDon.MaHoaDon);
        return hoaDon;
    }

    public async Task<List<HoaDonBan>> GetByMaNguoiDung(int maNguoiDung)
    {
        var list = new List<HoaDonBan>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = "SELECT * FROM HoaDonBan WHERE MaNguoiDung=@MaNguoiDung ORDER BY NgayXuatHD DESC;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapToHoaDonBan(reader));

        return list;
    }

    public async Task<List<HoaDonBan>> GetAll()
    {
        var list = new List<HoaDonBan>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        const string sql = "SELECT * FROM HoaDonBan ORDER BY NgayXuatHD DESC;";
        await using var command = new SqlCommand(sql, connection);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(MapToHoaDonBan(reader));

        return list;
    }

    public async Task<HoaDonBan> CreateInvoiceForOrderAsync(int maDonHang)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

        try
        {
            // 1. Kiểm tra hóa đơn đã tồn tại chưa
            const string checkSql = "SELECT MaHoaDon FROM HoaDonBan WITH (UPDLOCK, HOLDLOCK) WHERE MaDonHang = @MaDonHang;";
            await using (var checkCmd = new SqlCommand(checkSql, connection, transaction))
            {
                checkCmd.Parameters.AddWithValue("@MaDonHang", maDonHang);
                var existingId = await checkCmd.ExecuteScalarAsync();
                if (existingId != null && existingId != DBNull.Value)
                {
                    await transaction.CommitAsync();
                    var existingInvoice = await GetByMaDonHang(maDonHang);
                    return existingInvoice!;
                }
            }

            // 2. Load và kiểm tra DonHang + ThanhToan
            const string checkOrderSql = @"
                SELECT d.MaDonHang, d.MaNguoiDung, d.TrangThai, d.TenNguoiNhan, d.SoDienThoai, d.DiaChiGiao, d.GhiChu,
                       nd.Ten AS TenKhachHang, nd.DiaChi AS DiaChiKhachHang, nd.DienThoai AS DienThoaiKhachHang, nd.Email,
                       tt.PhuongThuc, tt.TrangThai AS TrangThaiThanhToan
                FROM DonHang d WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN NguoiDung nd ON nd.MaNguoiDung = d.MaNguoiDung
                LEFT JOIN ThanhToan tt WITH (UPDLOCK, HOLDLOCK) ON tt.MaDonHang = d.MaDonHang
                WHERE d.MaDonHang = @MaDonHang;";

            int maNguoiDung;
            string tenNguoiMua;
            string diaChiNguoiMua;
            string soDienThoaiNguoiMua;
            string? email;
            string? phuongThuc;
            string? trangThaiThanhToan;
            string? ghiChu;

            await using (var orderCmd = new SqlCommand(checkOrderSql, connection, transaction))
            {
                orderCmd.Parameters.AddWithValue("@MaDonHang", maDonHang);
                await using var reader = await orderCmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync())
                    throw new KeyNotFoundException($"Không tìm thấy đơn hàng {maDonHang}");

                var trangThai = reader.GetByte(reader.GetOrdinal("TrangThai"));
                if (trangThai != Helpers.DonHangStatus.DaGiao)
                    throw new Helpers.BusinessConflictException("Chỉ đơn hàng ở trạng thái Đã giao mới được tạo hóa đơn");

                if (reader.IsDBNull(reader.GetOrdinal("PhuongThuc")))
                    throw new Helpers.BusinessConflictException("Đơn hàng chưa có thông tin thanh toán");

                phuongThuc = reader.GetString(reader.GetOrdinal("PhuongThuc"));
                trangThaiThanhToan = reader.GetString(reader.GetOrdinal("TrangThaiThanhToan"));

                if (!string.Equals(trangThaiThanhToan, "DaThanhToan", StringComparison.OrdinalIgnoreCase))
                    throw new Helpers.BusinessConflictException("Chỉ đơn hàng đã thanh toán mới được tạo hóa đơn");

                maNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung"));
                tenNguoiMua = !reader.IsDBNull(reader.GetOrdinal("TenNguoiNhan"))
                    ? reader.GetString(reader.GetOrdinal("TenNguoiNhan"))
                    : reader.GetString(reader.GetOrdinal("TenKhachHang"));

                diaChiNguoiMua = !reader.IsDBNull(reader.GetOrdinal("DiaChiGiao"))
                    ? reader.GetString(reader.GetOrdinal("DiaChiGiao"))
                    : (reader.IsDBNull(reader.GetOrdinal("DiaChiKhachHang")) ? "" : reader.GetString(reader.GetOrdinal("DiaChiKhachHang")));

                soDienThoaiNguoiMua = !reader.IsDBNull(reader.GetOrdinal("SoDienThoai"))
                    ? reader.GetString(reader.GetOrdinal("SoDienThoai"))
                    : (reader.IsDBNull(reader.GetOrdinal("DienThoaiKhachHang")) ? "" : reader.GetString(reader.GetOrdinal("DienThoaiKhachHang")));

                email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email"));
                ghiChu = reader.IsDBNull(reader.GetOrdinal("GhiChu")) ? null : reader.GetString(reader.GetOrdinal("GhiChu"));
            }

            // 3. Load chi tiết sản phẩm và snapshot tên tác phẩm
            const string lineSql = @"
                SELECT c.MaTacPham, c.SoLuong, c.DonGia, t.TenTacPham
                FROM ChiTietDonHang c WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN TacPham t WITH (UPDLOCK, HOLDLOCK) ON t.MaTacPham = c.MaTacPham
                WHERE c.MaDonHang = @MaDonHang;";

            var lineItems = new List<(int MaTacPham, string TenTacPham, int SoLuong, decimal DonGia, decimal ThanhTien)>();
            decimal tongTienHang = 0;

            await using (var lineCmd = new SqlCommand(lineSql, connection, transaction))
            {
                lineCmd.Parameters.AddWithValue("@MaDonHang", maDonHang);
                await using var reader = await lineCmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var maTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham"));
                    var tenTacPham = reader.GetString(reader.GetOrdinal("TenTacPham"));
                    var soLuong = reader.GetInt32(reader.GetOrdinal("SoLuong"));
                    var donGia = reader.GetDecimal(reader.GetOrdinal("DonGia"));
                    var thanhTien = soLuong * donGia;
                    tongTienHang += thanhTien;
                    lineItems.Add((maTacPham, tenTacPham, soLuong, donGia, thanhTien));
                }
            }

            if (lineItems.Count == 0)
                throw new InvalidOperationException("Đơn hàng không có sản phẩm nào");

            // 4. INSERT HoaDonBan
            const string insertInvoiceSql = @"
                INSERT INTO HoaDonBan
                    (MaDonHang, MaNguoiDung, NgayXuatHD, TongTienHang, TenNguoiMua, DiaChiNguoiMua, SoDienThoaiNguoiMua, Email, PhuongThucThanhToan, TrangThaiThanhToan, GhiChu, TrangThai)
                OUTPUT INSERTED.MaHoaDon
                VALUES
                    (@MaDonHang, @MaNguoiDung, GETDATE(), @TongTienHang, @TenNguoiMua, @DiaChiNguoiMua, @SoDienThoaiNguoiMua, @Email, @PhuongThucThanhToan, @TrangThaiThanhToan, @GhiChu, 'HopLe');";

            int newInvoiceId;
            await using (var insertCmd = new SqlCommand(insertInvoiceSql, connection, transaction))
            {
                insertCmd.Parameters.AddWithValue("@MaDonHang", maDonHang);
                insertCmd.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
                insertCmd.Parameters.AddWithValue("@TongTienHang", tongTienHang);
                insertCmd.Parameters.AddWithValue("@TenNguoiMua", (object?)tenNguoiMua ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@DiaChiNguoiMua", (object?)diaChiNguoiMua ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@SoDienThoaiNguoiMua", (object?)soDienThoaiNguoiMua ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@Email", (object?)email ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@PhuongThucThanhToan", (object?)phuongThuc ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@TrangThaiThanhToan", (object?)trangThaiThanhToan ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@GhiChu", (object?)ghiChu ?? DBNull.Value);
                newInvoiceId = Convert.ToInt32(await insertCmd.ExecuteScalarAsync());
            }

            // 5. INSERT ChiTietHoaDonBan
            const string insertDetailSql = @"
                INSERT INTO ChiTietHoaDonBan
                    (MaHoaDon, MaTacPham, TenTacPham, SoLuong, DonGia, ThanhTien)
                VALUES
                    (@MaHoaDon, @MaTacPham, @TenTacPham, @SoLuong, @DonGia, @ThanhTien);";

            foreach (var item in lineItems)
            {
                await using var detailCmd = new SqlCommand(insertDetailSql, connection, transaction);
                detailCmd.Parameters.AddWithValue("@MaHoaDon", newInvoiceId);
                detailCmd.Parameters.AddWithValue("@MaTacPham", item.MaTacPham);
                detailCmd.Parameters.AddWithValue("@TenTacPham", item.TenTacPham);
                detailCmd.Parameters.AddWithValue("@SoLuong", item.SoLuong);
                detailCmd.Parameters.AddWithValue("@DonGia", item.DonGia);
                detailCmd.Parameters.AddWithValue("@ThanhTien", item.ThanhTien);
                await detailCmd.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            var created = await GetByMaHoaDon(newInvoiceId);
            return created!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ── Private helpers ──

    private async Task<List<ChiTietHoaDonBan>> LoadChiTiet(SqlConnection connection, int maHoaDon)
    {
        var list = new List<ChiTietHoaDonBan>();
        const string sql = "SELECT * FROM ChiTietHoaDonBan WHERE MaHoaDon=@MaHoaDon;";
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MaHoaDon", maHoaDon);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietHoaDonBan
            {
                MaChiTietHD = reader.GetInt32(reader.GetOrdinal("MaChiTietHD")),
                MaHoaDon = reader.GetInt32(reader.GetOrdinal("MaHoaDon")),
                MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
                TenTacPham = reader.IsDBNull(reader.GetOrdinal("TenTacPham"))
                    ? null : reader.GetString(reader.GetOrdinal("TenTacPham")),
                SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong")),
                DonGia = reader.GetDecimal(reader.GetOrdinal("DonGia")),
                ThanhTien = reader.GetDecimal(reader.GetOrdinal("ThanhTien"))
            });
        }
        return list;
    }

    private static HoaDonBan MapToHoaDonBan(SqlDataReader reader)
    {
        return new HoaDonBan
        {
            MaHoaDon = reader.GetInt32(reader.GetOrdinal("MaHoaDon")),
            MaDonHang = reader.GetInt32(reader.GetOrdinal("MaDonHang")),
            MaNguoiDung = reader.GetInt32(reader.GetOrdinal("MaNguoiDung")),
            NgayXuatHD = reader.GetDateTime(reader.GetOrdinal("NgayXuatHD")),
            TongTienHang = reader.GetDecimal(reader.GetOrdinal("TongTienHang")),
            TenNguoiMua = SafeGetString(reader, "TenNguoiMua"),
            DiaChiNguoiMua = SafeGetString(reader, "DiaChiNguoiMua"),
            SoDienThoaiNguoiMua = SafeGetString(reader, "SoDienThoaiNguoiMua"),
            Email = SafeGetString(reader, "Email"),
            PhuongThucThanhToan = SafeGetString(reader, "PhuongThucThanhToan"),
            TrangThaiThanhToan = SafeGetString(reader, "TrangThaiThanhToan"),
            GhiChu = SafeGetString(reader, "GhiChu"),
            TrangThai = reader.GetString(reader.GetOrdinal("TrangThai"))
        };
    }

    private static string? SafeGetString(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }
}
