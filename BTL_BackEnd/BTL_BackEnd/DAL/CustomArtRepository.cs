using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class CustomArtRepository : ICustomArtRepository
{
    private readonly string _connectionString;

    public CustomArtRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<CustomArtRequest> CreateRequest(int maKhachHang, TaoYeuCauTranhRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var typeValue = ParseCustomArtType(request.Type);
        var referenceArtworkId = request.ReferenceArtworkId ?? (object?)DBNull.Value;
        var referenceArtworkName = (object?)request.ReferenceArtworkName ?? DBNull.Value;
        var referenceArtistName = (object?)request.ReferenceArtistName ?? DBNull.Value;
        var referenceImageUrl = (object?)request.ReferenceImageUrl ?? DBNull.Value;

        var query = @"INSERT INTO YeuCauVeTranh
            (MaKhachHang, TieuDe, LoaiTranh, KichThuoc, ChuDe, MauSac, PhongCach, ChatLieu, MoTa, AnhThamKhao, Type, ReferenceArtworkId, ReferenceArtworkName, ReferenceArtistName, ReferenceImageUrl, TienDatCoc, GiaDuKien, TrangThai, NgayTao, NgayCapNhat, NgayHoanThanhDuKien)
            OUTPUT INSERTED.MaYeuCau
            VALUES (@MaKhachHang, @TieuDe, @LoaiTranh, @KichThuoc, @ChuDe, @MauSac, @PhongCach, @ChatLieu, @MoTa, @AnhThamKhao, @Type, @ReferenceArtworkId, @ReferenceArtworkName, @ReferenceArtistName, @ReferenceImageUrl, @TienDatCoc, @GiaDuKien, @TrangThai, GETDATE(), GETDATE(), @NgayHoanThanhDuKien);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe);
        command.Parameters.AddWithValue("@LoaiTranh", request.LoaiTranh);
        command.Parameters.AddWithValue("@KichThuoc", request.KichThuoc);
        command.Parameters.AddWithValue("@ChuDe", (object?)request.ChuDe ?? DBNull.Value);
        command.Parameters.AddWithValue("@MauSac", (object?)request.MauSac ?? DBNull.Value);
        command.Parameters.AddWithValue("@PhongCach", (object?)request.PhongCach ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)request.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTa", (object?)request.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@AnhThamKhao", (object?)request.AnhThamKhao ?? DBNull.Value);
        command.Parameters.AddWithValue("@Type", typeValue);
        command.Parameters.AddWithValue("@ReferenceArtworkId", referenceArtworkId);
        command.Parameters.AddWithValue("@ReferenceArtworkName", referenceArtworkName);
        command.Parameters.AddWithValue("@ReferenceArtistName", referenceArtistName);
        command.Parameters.AddWithValue("@ReferenceImageUrl", referenceImageUrl);
        command.Parameters.AddWithValue("@TienDatCoc", 0m);
        command.Parameters.AddWithValue("@GiaDuKien", 0m);
        command.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.Submitted);
        command.Parameters.AddWithValue("@NgayHoanThanhDuKien", (object?)request.NgayHoanThanhDuKien ?? DBNull.Value);

        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        return await GetById(id) ?? new CustomArtRequest { MaYeuCau = id, MaKhachHang = maKhachHang, TieuDe = request.TieuDe, Type = typeValue };
    }

    public async Task<List<CustomArtRequest>> GetByCustomer(int maKhachHang)
    {
        var list = new List<CustomArtRequest>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM YeuCauVeTranh WHERE MaKhachHang = @MaKhachHang ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(Map(reader));
        }

        return list;
    }

    public async Task<List<CustomArtRequest>> GetAll()
    {
        var list = new List<CustomArtRequest>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM YeuCauVeTranh ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(Map(reader));
        }

        return list;
    }

    public async Task<CustomArtRequest?> GetById(int maYeuCau)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM YeuCauVeTranh WHERE MaYeuCau = @MaYeuCau";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }

        return null;
    }

    public async Task<bool> AssignRequest(int maYeuCau, int maHoaSi)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var existingQuery = @"SELECT MaHoaSi, TrangThai FROM YeuCauVeTranh WHERE MaYeuCau = @MaYeuCau";
        using (var existingCommand = new SqlCommand(existingQuery, connection))
        {
            existingCommand.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
            using var reader = await existingCommand.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                return false;

            int? currentArtist = reader.IsDBNull(reader.GetOrdinal("MaHoaSi"))
                ? (int?)null
                : reader.GetInt32(reader.GetOrdinal("MaHoaSi"));

            if (currentArtist.HasValue && currentArtist.Value != maHoaSi)
                return false;
        }

        var query = @"UPDATE YeuCauVeTranh SET MaHoaSi = @MaHoaSi, TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        command.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.Assigned);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> RejectRequest(int maYeuCau)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE YeuCauVeTranh SET TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.Rejected);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<CustomArtQuote> CreateQuote(BaoGiaTranhRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO BaoGiaVeTranh (MaYeuCau, MaHoaSi, GiaBaoGia, ThoiGianHoanThanh, GhiChu, IsActive, NgayTao, TrangThai)
            OUTPUT INSERTED.MaBaoGia
            VALUES (@MaYeuCau, @MaHoaSi, @GiaBaoGia, @ThoiGianHoanThanh, @GhiChu, 1, GETDATE(), @TrangThai);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaHoaSi", request.MaHoaSi);
        command.Parameters.AddWithValue("@GiaBaoGia", request.GiaBaoGia);
        command.Parameters.AddWithValue("@ThoiGianHoanThanh", request.ThoiGianHoanThanh);
        command.Parameters.AddWithValue("@GhiChu", (object?)request.GhiChu ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", "PendingCustomerApproval");

        var id = Convert.ToInt32(await command.ExecuteScalarAsync());

        var quote = await GetQuoteById(id);
        return quote ?? new CustomArtQuote { MaBaoGia = id, MaYeuCau = request.MaYeuCau, MaHoaSi = request.MaHoaSi, GiaBaoGia = request.GiaBaoGia, ThoiGianHoanThanh = request.ThoiGianHoanThanh };
    }

    public async Task<CustomArtQuote?> GetQuoteById(int maBaoGia)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM BaoGiaVeTranh WHERE MaBaoGia = @MaBaoGia";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapQuote(reader);
        }

        return null;
    }

    public async Task<bool> ConfirmQuote(int maBaoGia)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE BaoGiaVeTranh SET TrangThai = @TrangThai WHERE MaBaoGia = @MaBaoGia";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TrangThai", "CustomerAccepted");
        command.Parameters.AddWithValue("@MaBaoGia", maBaoGia);

        var success = await command.ExecuteNonQueryAsync();
        if (success <= 0) return false;

        var quote = await GetQuoteById(maBaoGia);
        if (quote == null) return false;

        var request = await GetById(quote.MaYeuCau);
        if (request == null) return true;

        request.TrangThai = CustomArtStatus.CustomerAccepted;
        return true;
    }

    public async Task<bool> CreateDeposit(int maYeuCau, decimal soTien)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO ThanhToanYeuCau (MaYeuCau, LoaiThanhToan, SoTien, PhuongThuc, TrangThai, NgayThanhToan)
            VALUES (@MaYeuCau, 'DatCoc', @SoTien, 'ChuyenKhoan', 'Completed', GETDATE());";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@SoTien", soTien);

        var result = await command.ExecuteNonQueryAsync();
        if (result <= 0) return false;

        var update = @"UPDATE YeuCauVeTranh SET TienDatCoc = @SoTien, TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau";
        using var updateCommand = new SqlCommand(update, connection);
        updateCommand.Parameters.AddWithValue("@SoTien", soTien);
        updateCommand.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.DepositPaid);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        return await updateCommand.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> CreateProgress(TaoTienDoRequest request)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO TienDoVeTranh (MaYeuCau, TieuDe, MoTa, AnhPreview, TrangThai, NgayTao)
            VALUES (@MaYeuCau, @TieuDe, @MoTa, @AnhPreview, @TrangThai, GETDATE());";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@TieuDe", request.TieuDe);
        command.Parameters.AddWithValue("@MoTa", request.MoTa);
        command.Parameters.AddWithValue("@AnhPreview", (object?)request.AnhPreview ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", request.TrangThai);

        var success = await command.ExecuteNonQueryAsync();
        if (success <= 0) return false;

        var update = @"UPDATE YeuCauVeTranh SET TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau";
        using var updateCommand = new SqlCommand(update, connection);
        updateCommand.Parameters.AddWithValue("@TrangThai", request.TrangThai == "PreviewSent" ? (int)CustomArtStatus.PreviewSent : (int)CustomArtStatus.InProgress);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        return await updateCommand.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> CreateFeedback(TaoPhanHoiRequest request, int maKhachHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO PhanHoiVeTranh (MaYeuCau, MaKhachHang, MaHoaSi, NoiDung, LoaiPhanHoi, NgayTao)
            VALUES (@MaYeuCau, @MaKhachHang, @MaHoaSi, @NoiDung, @LoaiPhanHoi, GETDATE());";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);
        command.Parameters.AddWithValue("@MaHoaSi", request.MaHoaSi);
        command.Parameters.AddWithValue("@NoiDung", request.NoiDung);
        command.Parameters.AddWithValue("@LoaiPhanHoi", request.LoaiPhanHoi);

        var success = await command.ExecuteNonQueryAsync();
        if (success <= 0) return false;

        var update = @"UPDATE YeuCauVeTranh SET TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau";
        using var updateCommand = new SqlCommand(update, connection);
        updateCommand.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.RevisionRequested);
        updateCommand.Parameters.AddWithValue("@MaYeuCau", request.MaYeuCau);
        return await updateCommand.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> ConfirmComplete(int maYeuCau, int maKhachHang)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"UPDATE YeuCauVeTranh SET TrangThai = @TrangThai, NgayCapNhat = GETDATE() WHERE MaYeuCau = @MaYeuCau AND MaKhachHang = @MaKhachHang";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@TrangThai", (int)CustomArtStatus.Completed);
        command.Parameters.AddWithValue("@MaYeuCau", maYeuCau);
        command.Parameters.AddWithValue("@MaKhachHang", maKhachHang);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    private static CustomArtRequest Map(SqlDataReader reader)
    {
        return new CustomArtRequest
        {
            MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
            MaKhachHang = reader.GetInt32(reader.GetOrdinal("MaKhachHang")),
            MaHoaSi = reader.IsDBNull(reader.GetOrdinal("MaHoaSi")) ? null : reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            TieuDe = reader.IsDBNull(reader.GetOrdinal("TieuDe")) ? string.Empty : reader.GetString(reader.GetOrdinal("TieuDe")),
            LoaiTranh = reader.IsDBNull(reader.GetOrdinal("LoaiTranh")) ? string.Empty : reader.GetString(reader.GetOrdinal("LoaiTranh")),
            KichThuoc = reader.IsDBNull(reader.GetOrdinal("KichThuoc")) ? string.Empty : reader.GetString(reader.GetOrdinal("KichThuoc")),
            ChuDe = reader.IsDBNull(reader.GetOrdinal("ChuDe")) ? string.Empty : reader.GetString(reader.GetOrdinal("ChuDe")),
            MauSac = reader.IsDBNull(reader.GetOrdinal("MauSac")) ? string.Empty : reader.GetString(reader.GetOrdinal("MauSac")),
            PhongCach = reader.IsDBNull(reader.GetOrdinal("PhongCach")) ? string.Empty : reader.GetString(reader.GetOrdinal("PhongCach")),
            ChatLieu = reader.IsDBNull(reader.GetOrdinal("ChatLieu")) ? string.Empty : reader.GetString(reader.GetOrdinal("ChatLieu")),
            MoTa = reader.IsDBNull(reader.GetOrdinal("MoTa")) ? null : reader.GetString(reader.GetOrdinal("MoTa")),
            AnhThamKhao = reader.IsDBNull(reader.GetOrdinal("AnhThamKhao")) ? null : reader.GetString(reader.GetOrdinal("AnhThamKhao")),
            Type = HasColumn(reader, "Type") && !reader.IsDBNull(reader.GetOrdinal("Type")) ? ParseCustomArtType(reader.GetInt32(reader.GetOrdinal("Type"))) : CustomArtType.Original,
            ReferenceArtworkId = HasColumn(reader, "ReferenceArtworkId") && !reader.IsDBNull(reader.GetOrdinal("ReferenceArtworkId")) ? reader.GetInt32(reader.GetOrdinal("ReferenceArtworkId")) : null,
            ReferenceArtworkName = HasColumn(reader, "ReferenceArtworkName") && !reader.IsDBNull(reader.GetOrdinal("ReferenceArtworkName")) ? reader.GetString(reader.GetOrdinal("ReferenceArtworkName")) : null,
            ReferenceArtistName = HasColumn(reader, "ReferenceArtistName") && !reader.IsDBNull(reader.GetOrdinal("ReferenceArtistName")) ? reader.GetString(reader.GetOrdinal("ReferenceArtistName")) : null,
            ReferenceImageUrl = HasColumn(reader, "ReferenceImageUrl") && !reader.IsDBNull(reader.GetOrdinal("ReferenceImageUrl")) ? reader.GetString(reader.GetOrdinal("ReferenceImageUrl")) : null,
            TienDatCoc = reader.IsDBNull(reader.GetOrdinal("TienDatCoc")) ? 0 : reader.GetDecimal(reader.GetOrdinal("TienDatCoc")),
            GiaDuKien = reader.IsDBNull(reader.GetOrdinal("GiaDuKien")) ? 0 : reader.GetDecimal(reader.GetOrdinal("GiaDuKien")),
            TrangThai = reader.IsDBNull(reader.GetOrdinal("TrangThai")) ? CustomArtStatus.Submitted : (CustomArtStatus)reader.GetInt32(reader.GetOrdinal("TrangThai")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            NgayCapNhat = reader.IsDBNull(reader.GetOrdinal("NgayCapNhat")) ? null : reader.GetDateTime(reader.GetOrdinal("NgayCapNhat")),
            NgayHoanThanhDuKien = reader.IsDBNull(reader.GetOrdinal("NgayHoanThanhDuKien")) ? null : reader.GetDateTime(reader.GetOrdinal("NgayHoanThanhDuKien"))
        };
    }

    private static CustomArtType ParseCustomArtType(string? sourceType)
    {
        if (string.IsNullOrWhiteSpace(sourceType)) return CustomArtType.Original;

        return sourceType.Trim() switch
        {
            "Original" => CustomArtType.Original,
            "BasedOnArtwork" => CustomArtType.BasedOnArtwork,
            "Reproduction" => CustomArtType.Reproduction,
            _ => CustomArtType.Original
        };
    }

    private static CustomArtType ParseCustomArtType(int value)
    {
        return value switch
        {
            1 => CustomArtType.BasedOnArtwork,
            2 => CustomArtType.Reproduction,
            _ => CustomArtType.Original
        };
    }

    private static bool HasColumn(SqlDataReader reader, string columnName)
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static CustomArtQuote MapQuote(SqlDataReader reader)
    {
        return new CustomArtQuote
        {
            MaBaoGia = reader.GetInt32(reader.GetOrdinal("MaBaoGia")),
            MaYeuCau = reader.GetInt32(reader.GetOrdinal("MaYeuCau")),
            MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            GiaBaoGia = reader.GetDecimal(reader.GetOrdinal("GiaBaoGia")),
            ThoiGianHoanThanh = reader.IsDBNull(reader.GetOrdinal("ThoiGianHoanThanh")) ? string.Empty : reader.GetString(reader.GetOrdinal("ThoiGianHoanThanh")),
            GhiChu = reader.IsDBNull(reader.GetOrdinal("GhiChu")) ? null : reader.GetString(reader.GetOrdinal("GhiChu")),
            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            TrangThai = reader.IsDBNull(reader.GetOrdinal("TrangThai")) ? "PendingCustomerApproval" : reader.GetString(reader.GetOrdinal("TrangThai"))
        };
    }
}
