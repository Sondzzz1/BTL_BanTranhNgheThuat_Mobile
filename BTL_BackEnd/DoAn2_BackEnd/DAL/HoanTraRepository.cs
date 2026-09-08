using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using Microsoft.Data.SqlClient;
using System.Text.Json;

namespace DoAn2_BackEnd.DAL;

/// <summary>
/// Repository xử lý dữ liệu yêu cầu hoàn trả, dùng raw ADO.NET
/// theo đúng pattern của dự án
/// </summary>
public class HoanTraRepository : IHoanTraRepository
{
    private readonly string _connectionString;

    public HoanTraRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    // ================================================================
    // CUSTOMER - Tạo yêu cầu hoàn trả
    // ================================================================

    /// <summary>Tạo yêu cầu hoàn trả mới, trả về MaYeuCau</summary>
    public async Task<int> TaoYeuCauHoanTra(int maNguoiDung, TaoHoanTraRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Serialize danh sách hình ảnh thành JSON
        var hinhAnhJson = request.HinhAnh != null && request.HinhAnh.Count > 0
            ? JsonSerializer.Serialize(request.HinhAnh)
            : null;

        var query = @"
            INSERT INTO YeuCauHoanTra 
                (MaDonHang, MaNguoiDung, MaTacPham, LyDo, LyDoKhac, MoTa, HinhAnh, TrangThai, NgayTao, NgayCapNhat)
            OUTPUT INSERTED.MaYeuCau
            VALUES 
                (@MaDonHang, @MaNguoiDung, @MaTacPham, @LyDo, @LyDoKhac, @MoTa, @HinhAnh, 'CHO_DUYET', GETDATE(), GETDATE())";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", request.MaDonHang);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", request.MaTacPham);
        command.Parameters.AddWithValue("@LyDo", request.LyDo);
        command.Parameters.AddWithValue("@LyDoKhac", (object?)request.LyDoKhac ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTa", (object?)request.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)hinhAnhJson ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    /// <summary>Lấy danh sách yêu cầu hoàn trả của 1 người dùng</summary>
    public async Task<List<HoanTraSummaryResponse>> GetByNguoiDung(int maNguoiDung)
    {
        var list = new List<HoanTraSummaryResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT 
                y.MaYeuCau, y.MaDonHang, y.MaTacPham, y.LyDo, y.MoTa, y.TrangThai, y.NgayTao,
                t.TenTacPham, t.HinhAnh AS HinhAnhTacPham, t.Gia AS GiaTacPham
            FROM YeuCauHoanTra y
            LEFT JOIN TacPham t ON y.MaTacPham = t.MaTacPham
            WHERE y.MaNguoiDung = @MaNguoiDung
            ORDER BY y.NgayTao DESC";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToSummary(reader));
        }
        return list;
    }

    /// <summary>
    /// Lấy chi tiết yêu cầu hoàn trả theo ID.
    /// Nếu maNguoiDung != null thì chỉ lấy của user đó (customer mode).
    /// </summary>
    public async Task<HoanTraDetailResponse?> GetById(int maYeuCau, int? maNguoiDung = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var whereClause = maNguoiDung.HasValue
            ? "WHERE y.MaYeuCau = @MaYeuCau AND y.MaNguoiDung = @MaNguoiDung"
            : "WHERE y.MaYeuCau = @MaYeuCau";

        var query = $@"
            SELECT 
                y.MaYeuCau, y.MaDonHang, y.MaNguoiDung, y.MaTacPham,
                y.LyDo, y.LyDoKhac, y.MoTa, y.HinhAnh, y.TrangThai, y.LyDoTuChoi,
                y.NgayTao, y.NgayCapNhat,
                t.TenTacPham, t.HinhAnh AS HinhAnhTacPham, t.Gia AS GiaTacPham,
                nd.Ten AS TenNguoiDung, nd.Email AS EmailNguoiDung, nd.DienThoai AS SoDienThoaiNguoiDung,
                dh.NgayDat AS NgayDatHang, dh.TongTien AS TongTienDonHang,
                ISNULL(cdh.SoLuong, 1) AS SoLuong
            FROM YeuCauHoanTra y
            LEFT JOIN TacPham t ON y.MaTacPham = t.MaTacPham
            LEFT JOIN NguoiDung nd ON y.MaNguoiDung = nd.MaNguoiDung
            LEFT JOIN DonHang dh ON y.MaDonHang = dh.MaDonHang
            LEFT JOIN ChiTietDonHang cdh ON dh.MaDonHang = cdh.MaDonHang AND y.MaTacPham = cdh.MaTacPham
            {whereClause}";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        if (maNguoiDung.HasValue)
            command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung.Value);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapToDetail(reader);
        }
        return null;
    }

    /// <summary>Xác nhận đã gửi hàng về - chuyển trạng thái sang DANG_HOAN_TRA</summary>
    public async Task<bool> XacNhanDaGuiHang(int maYeuCau, int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            UPDATE YeuCauHoanTra 
            SET TrangThai = 'DANG_HOAN_TRA', NgayCapNhat = GETDATE()
            WHERE MaYeuCau = @MaYeuCau AND MaNguoiDung = @MaNguoiDung AND TrangThai = 'DA_DUYET'";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        var rows = await command.ExecuteNonQueryAsync();
        return rows > 0;
    }

    /// <summary>Kiểm tra đơn hàng có hợp lệ để hoàn trả không (đã hoàn thành)</summary>
    public async Task<bool> KiemTraDonHangHopLe(int maDonHang, int maNguoiDung, int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Đơn hàng phải: thuộc về user, trạng thái Hoàn thành (3), và chứa sản phẩm đó
        var query = @"
            SELECT COUNT(1)
            FROM DonHang dh
            INNER JOIN ChiTietDonHang cdh ON dh.MaDonHang = cdh.MaDonHang
            WHERE dh.MaDonHang = @MaDonHang 
              AND dh.MaNguoiDung = @MaNguoiDung
              AND dh.TrangThai = 3
              AND cdh.MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        var count = Convert.ToInt32(await command.ExecuteScalarAsync());
        return count > 0;
    }

    /// <summary>Kiểm tra sản phẩm này trong đơn hàng đã có yêu cầu hoàn trả chưa</summary>
    public async Task<bool> KiemTraDaCoYeuCau(int maDonHang, int maTacPham, int maNguoiDung)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Không cho tạo nếu đã có yêu cầu chưa hoàn tất hoặc chưa bị từ chối
        var query = @"
            SELECT COUNT(1)
            FROM YeuCauHoanTra
            WHERE MaDonHang = @MaDonHang 
              AND MaTacPham = @MaTacPham 
              AND MaNguoiDung = @MaNguoiDung
              AND TrangThai NOT IN ('TU_CHOI')";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDonHang", maDonHang);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        command.Parameters.AddWithValue("@MaNguoiDung", maNguoiDung);
        var count = Convert.ToInt32(await command.ExecuteScalarAsync());
        return count > 0;
    }

    // ================================================================
    // ADMIN - Quản lý yêu cầu hoàn trả
    // ================================================================

    /// <summary>Lấy tất cả yêu cầu hoàn trả (Admin), hỗ trợ lọc</summary>
    public async Task<List<HoanTraSummaryResponse>> GetAll(
        string? trangThai = null,
        DateTime? tuNgay = null,
        DateTime? denNgay = null,
        string? keyword = null)
    {
        var list = new List<HoanTraSummaryResponse>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var conditions = new List<string>();
        if (!string.IsNullOrEmpty(trangThai)) conditions.Add("y.TrangThai = @TrangThai");
        if (tuNgay.HasValue) conditions.Add("y.NgayTao >= @TuNgay");
        if (denNgay.HasValue) conditions.Add("y.NgayTao <= @DenNgay");
        if (!string.IsNullOrEmpty(keyword))
            conditions.Add("(t.TenTacPham LIKE @Keyword OR nd.HoTen LIKE @Keyword OR CAST(y.MaDonHang AS NVARCHAR) LIKE @Keyword)");

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";

        var query = $@"
            SELECT 
                y.MaYeuCau, y.MaDonHang, y.MaTacPham, y.LyDo, y.MoTa, y.TrangThai, y.NgayTao,
                t.TenTacPham, t.HinhAnh AS HinhAnhTacPham, t.Gia AS GiaTacPham,
                nd.HoTen AS TenNguoiDung
            FROM YeuCauHoanTra y
            LEFT JOIN TacPham t ON y.MaTacPham = t.MaTacPham
            LEFT JOIN NguoiDung nd ON y.MaNguoiDung = nd.MaNguoiDung
            {whereClause}
            ORDER BY y.NgayTao DESC";

        using var command = new SqlCommand(query, connection);
        if (!string.IsNullOrEmpty(trangThai)) command.Parameters.AddWithValue("@TrangThai", trangThai);
        if (tuNgay.HasValue) command.Parameters.AddWithValue("@TuNgay", tuNgay.Value);
        if (denNgay.HasValue) command.Parameters.AddWithValue("@DenNgay", denNgay.Value.AddDays(1));
        if (!string.IsNullOrEmpty(keyword)) command.Parameters.AddWithValue("@Keyword", $"%{keyword}%");

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var item = MapToSummary(reader);
            // Thêm tên người dùng cho Admin view
            if (!reader.IsDBNull(reader.GetOrdinal("TenNguoiDung")))
                item.TenTacPham = $"[{reader["TenNguoiDung"]}] {item.TenTacPham}";
            list.Add(item);
        }
        return list;
    }

    /// <summary>Admin duyệt hoặc từ chối yêu cầu hoàn trả</summary>
    public async Task<bool> DuyetYeuCau(int maYeuCau, bool chapNhan, string? lyDoTuChoi = null)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var trangThaiMoi = chapNhan ? "DA_DUYET" : "TU_CHOI";
        var query = @"
            UPDATE YeuCauHoanTra 
            SET TrangThai = @TrangThai, 
                LyDoTuChoi = @LyDoTuChoi, 
                NgayCapNhat = GETDATE()
            WHERE MaYeuCau = @MaYeuCau AND TrangThai = 'CHO_DUYET'";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TrangThai", trangThaiMoi);
        command.Parameters.AddWithValue("@LyDoTuChoi", (object?)lyDoTuChoi ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        var rows = await command.ExecuteNonQueryAsync();
        return rows > 0;
    }

    /// <summary>Admin cập nhật trạng thái theo quy trình</summary>
    public async Task<bool> CapNhatTrangThai(int maYeuCau, string trangThai)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Mapping trạng thái hợp lệ: trạng thái hiện tại → trạng thái tiếp theo
        var validTransitions = new Dictionary<string, string>
        {
            ["DA_DUYET"]     = "DANG_HOAN_TRA",
            ["DANG_HOAN_TRA"] = "DA_NHAN_HANG",
            ["DA_NHAN_HANG"] = "DA_HOAN_TIEN",
            ["DA_HOAN_TIEN"] = "HOAN_TAT",
        };

        // Kiểm tra trạng thái hiện tại
        var checkQuery = "SELECT TrangThai FROM YeuCauHoanTra WHERE MaYeuCau = @MaYeuCau";
        using var checkCmd = new SqlCommand(checkQuery, connection);
        checkCmd.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        var currentStatus = checkCmd.ExecuteScalar()?.ToString() ?? "";

        if (!validTransitions.TryGetValue(currentStatus, out var expectedNext) || expectedNext != trangThai)
            return false; // Không cho phép chuyển sai thứ tự

        var query = @"
            UPDATE YeuCauHoanTra 
            SET TrangThai = @TrangThai, NgayCapNhat = GETDATE()
            WHERE MaYeuCau = @MaYeuCau";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TrangThai", trangThai);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        var rows = await command.ExecuteNonQueryAsync();
        return rows > 0;
    }

    /// <summary>Admin hoàn tất yêu cầu hoàn trả</summary>
    public async Task<bool> HoanTat(int maYeuCau)
    {
        return await CapNhatTrangThai(maYeuCau, "HOAN_TAT");
    }

    // ================================================================
    // PRIVATE HELPERS - Map SqlDataReader → DTO
    // ================================================================

    private static HoanTraSummaryResponse MapToSummary(SqlDataReader reader)
    {
        return new HoanTraSummaryResponse
        {
            MaYeuCau = Convert.ToInt32(reader["MaYeuCau"]),
            MaDonHang = Convert.ToInt32(reader["MaDonHang"]),
            MaTacPham = Convert.ToInt32(reader["MaTacPham"]),
            TenTacPham = reader["TenTacPham"] as string,
            HinhAnhTacPham = reader["HinhAnhTacPham"] as string,
            GiaTacPham = reader["GiaTacPham"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["GiaTacPham"]),
            LyDo = reader["LyDo"]?.ToString() ?? "",
            MoTa = reader["MoTa"] as string,
            TrangThai = reader["TrangThai"]?.ToString() ?? "",
            NgayTao = Convert.ToDateTime(reader["NgayTao"]),
        };
    }

    private static HoanTraDetailResponse MapToDetail(SqlDataReader reader)
    {
        // Parse JSON hình ảnh
        var hinhAnhJson = reader["HinhAnh"] as string;
        var hinhAnh = new List<string>();
        if (!string.IsNullOrEmpty(hinhAnhJson))
        {
            try { hinhAnh = JsonSerializer.Deserialize<List<string>>(hinhAnhJson) ?? new(); }
            catch { /* Bỏ qua lỗi parse */ }
        }

        return new HoanTraDetailResponse
        {
            MaYeuCau = Convert.ToInt32(reader["MaYeuCau"]),
            MaDonHang = Convert.ToInt32(reader["MaDonHang"]),
            MaNguoiDung = Convert.ToInt32(reader["MaNguoiDung"]),
            TenNguoiDung = reader["TenNguoiDung"] as string,
            EmailNguoiDung = reader["EmailNguoiDung"] as string,
            SoDienThoaiNguoiDung = reader["SoDienThoaiNguoiDung"] as string,
            MaTacPham = Convert.ToInt32(reader["MaTacPham"]),
            TenTacPham = reader["TenTacPham"] as string,
            HinhAnhTacPham = reader["HinhAnhTacPham"] as string,
            GiaTacPham = reader["GiaTacPham"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["GiaTacPham"]),
            SoLuong = Convert.ToInt32(reader["SoLuong"]),
            LyDo = reader["LyDo"]?.ToString() ?? "",
            LyDoKhac = reader["LyDoKhac"] as string,
            MoTa = reader["MoTa"] as string,
            HinhAnh = hinhAnh,
            TrangThai = reader["TrangThai"]?.ToString() ?? "",
            LyDoTuChoi = reader["LyDoTuChoi"] as string,
            NgayTao = Convert.ToDateTime(reader["NgayTao"]),
            NgayCapNhat = Convert.ToDateTime(reader["NgayCapNhat"]),
            NgayDatHang = reader["NgayDatHang"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["NgayDatHang"]),
            TongTienDonHang = reader["TongTienDonHang"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["TongTienDonHang"]),
        };
    }
}
