using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using DoAn2_BackEnd.Helpers;

namespace DoAn2_BackEnd.DAL;

public class TacPhamRepository : ITacPhamRepository
{
    private readonly string _connectionString;

    // Public visibility is independent of rights verification and sale eligibility.

    public TacPhamRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }

    public async Task<List<TacPham>> GetAll()
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        await reader.CloseAsync();
        await ArtworkSaleSql.PopulateAsync(connection, list);
        return list;
    }

    public async Task<TacPham?> GetById(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            var item = MapToTacPham(reader);
            await reader.CloseAsync();
            await ArtworkSaleSql.PopulateAsync(connection, new[] { item });
            return item;
        }
        return null;
    }

    public async Task<List<TacPham>> GetByHoaSi(int maHoaSi)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaHoaSi = @MaHoaSi ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        await reader.CloseAsync();
        await ArtworkSaleSql.PopulateAsync(connection, list);
        return list;
    }

    public async Task<List<TacPham>> GetByDanhMuc(int maDanhMuc)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM TacPham WHERE MaDanhMuc = @MaDanhMuc ORDER BY NgayTao DESC";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapToTacPham(reader));
        }
        await reader.CloseAsync();
        await ArtworkSaleSql.PopulateAsync(connection, list);
        return list;
    }

    public Task<List<TacPham>> GetMarketplaceAll() =>
        QueryList(@"SELECT tp.* FROM TacPham tp
                    WHERE tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " +
                  " ORDER BY tp.NgayTao DESC");

    public Task<List<TacPham>> GetMarketplaceBestSelling(int top) => QueryList(
        @"SELECT TOP (@Top) tp.*
          FROM TacPham tp
          OUTER APPLY (
              SELECT SUM(CASE WHEN ct.SoLuong > ISNULL(ct.SoLuongDaHoan, 0)
                              THEN ct.SoLuong - ISNULL(ct.SoLuongDaHoan, 0) ELSE 0 END) AS SoLuongBan
              FROM ChiTietDonHang ct
              INNER JOIN DonHang dh ON dh.MaDonHang = ct.MaDonHang AND dh.TrangThai = 3
              WHERE ct.MaTacPham = tp.MaTacPham
          ) sales
          WHERE tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai = 1 " + @"
          ORDER BY ISNULL(sales.SoLuongBan, 0) DESC, tp.NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@Top", Math.Clamp(top, 1, 20));
        });

    public async Task<TacPham?> GetMarketplaceById(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"SELECT tp.* FROM TacPham tp
                      WHERE tp.MaTacPham=@MaTacPham AND tp.MaYeuCauVeTranh IS NULL
                        AND tp.TrangThai=1 ";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);
        using var reader = await command.ExecuteReaderAsync();
        var item = await reader.ReadAsync() ? MapToTacPham(reader) : null;
        await reader.CloseAsync();
        if (item != null) await ArtworkSaleSql.PopulateAsync(connection, new[] { item });
        return item;
    }

    public Task<List<TacPham>> GetMarketplaceByArtist(int maHoaSi) => QueryList(
        @"SELECT tp.* FROM TacPham tp
          WHERE tp.MaHoaSi=@MaHoaSi AND tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + @"
          ORDER BY NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@MaHoaSi", maHoaSi);
        });

    public Task<List<TacPham>> GetMarketplaceByCategory(int maDanhMuc) => QueryList(
        @"SELECT tp.* FROM TacPham tp
          WHERE tp.MaDanhMuc=@MaDanhMuc AND tp.MaYeuCauVeTranh IS NULL AND tp.TrangThai=1 " + @"
          ORDER BY NgayTao DESC",
        command =>
        {
            command.Parameters.AddWithValue("@MaDanhMuc", maDanhMuc);
        });

    /// <summary>
    /// Danh sách nội bộ cho Admin. Khác với marketplace: bao gồm cả tranh
    /// chờ duyệt/ẩn/từ chối, nhưng không trộn các tác phẩm tạo từ yêu cầu đặt vẽ.
    /// Phân trang và bộ lọc được thực hiện ở cơ sở dữ liệu.
    /// </summary>
    public async Task<(List<TacPham> Items, int TotalItems)> GetAdminPage(AdminArtworkQuery query)
    {
        var where = new StringBuilder(" WHERE tp.MaYeuCauVeTranh IS NULL");

        if (!string.IsNullOrWhiteSpace(query.Keyword))
            where.Append(" AND (tp.TenTacPham LIKE @Keyword OR hs.TenHoaSi LIKE @Keyword OR dm.TenDanhMuc LIKE @Keyword)");
        if (query.MaHoaSi.HasValue)
            where.Append(" AND tp.MaHoaSi=@MaHoaSi");
        if (query.MaDanhMuc.HasValue)
            where.Append(" AND tp.MaDanhMuc=@MaDanhMuc");
        if (query.TrangThai.HasValue)
            where.Append(" AND tp.TrangThai=@TrangThai");
        if (query.LaTacPhamDocBan.HasValue)
            where.Append(" AND tp.LaTacPhamDocBan=@LaTacPhamDocBan");

        switch (query.TonKho?.Trim().ToLowerInvariant())
        {
            case "con_hang":
                where.Append(" AND tp.SoLuong > 0");
                break;
            case "sap_het":
                where.Append(" AND tp.SoLuong BETWEEN 1 AND 3");
                break;
            case "het_hang":
                where.Append(" AND tp.SoLuong <= 0");
                break;
        }

        var orderBy = query.SapXep?.Trim().ToLowerInvariant() switch
        {
            "oldest" => "tp.NgayTao ASC, tp.MaTacPham ASC",
            "price_asc" => "tp.Gia ASC, tp.MaTacPham DESC",
            "price_desc" => "tp.Gia DESC, tp.MaTacPham DESC",
            "stock_asc" => "tp.SoLuong ASC, tp.MaTacPham DESC",
            "stock_desc" => "tp.SoLuong DESC, tp.MaTacPham DESC",
            "artist" => "hs.TenHoaSi ASC, tp.NgayTao DESC, tp.MaTacPham DESC",
            _ => "tp.NgayTao DESC, tp.MaTacPham DESC"
        };

        const string from = @"
            FROM TacPham tp
            INNER JOIN HoaSi hs ON hs.MaHoaSi=tp.MaHoaSi
            LEFT JOIN DanhMuc dm ON dm.MaDanhMuc=tp.MaDanhMuc";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var countCommand = new SqlCommand("SELECT COUNT(*)" + from + where, connection);
        AddAdminQueryParameters(countCommand, query);
        var totalItems = Convert.ToInt32(await countCommand.ExecuteScalarAsync());

        using var pageCommand = new SqlCommand(
            "SELECT tp.*" + from + where + " ORDER BY " + orderBy + " OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", connection);
        AddAdminQueryParameters(pageCommand, query);
        pageCommand.Parameters.AddWithValue("@Offset", (query.Page - 1) * query.PageSize);
        pageCommand.Parameters.AddWithValue("@PageSize", query.PageSize);

        var items = new List<TacPham>();
        using var reader = await pageCommand.ExecuteReaderAsync();
        while (await reader.ReadAsync()) items.Add(MapToTacPham(reader));
        await reader.CloseAsync();
        await ArtworkSaleSql.PopulateAsync(connection, items);
        return (items, totalItems);
    }

    public async Task<int> Create(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        { tacPham.TenTacPham,tacPham.MaHoaSi,tacPham.MaDanhMuc,tacPham.Gia,tacPham.SoLuong,tacPham.SoLuongBanDau,tacPham.MoTa,tacPham.HinhAnh,tacPham.ChatLieu,tacPham.ChatLieuKhung,tacPham.KichThuoc,tacPham.LaTacPhamDocBan,tacPham.LoaiTacPham,tacPham.TacGiaGoc,tacPham.MaTacPhamGoc,tacPham.TenTacPhamGoc,tacPham.KhongXacDinhTacGiaGoc,tacPham.NguonThamKhao,tacPham.MoTaNguonGoc,tacPham.SubmitUsageBasis,tacPham.SubmitOriginDeclaration }))));
        if (tacPham.SubmitRequestKey.HasValue)
        {
            using var prior = new SqlCommand("SELECT MaTacPham,SubmitRequestHash FROM TacPham WITH (UPDLOCK,HOLDLOCK) WHERE MaHoaSi=@Artist AND SubmitRequestKey=@Key;", connection, transaction);
            prior.Parameters.AddWithValue("@Artist", tacPham.MaHoaSi);
            prior.Parameters.AddWithValue("@Key", tacPham.SubmitRequestKey.Value);
            using var reader = await prior.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var priorId = reader.GetInt32(0);
                if (!reader.IsDBNull(1) && reader.GetString(1) != requestHash)
                    throw new InvalidOperationException("Lần gửi này đã tạo một tác phẩm với nội dung khác. Vui lòng mở tác phẩm đã lưu để chỉnh sửa, hoặc mở form Thêm mới cho yêu cầu mới.");
                await reader.CloseAsync();
                transaction.Commit(); return priorId;
            }
        }

        var query = @"INSERT INTO TacPham (TenTacPham, MaHoaSi, MaDanhMuc, Gia, SoLuong, SoLuongBanDau, MoTa, HinhAnh, ChatLieu, ChatLieuKhung, KichThuoc, TrangThai, NgayTao, LyDo,LaTacPhamDocBan,LoaiTacPham,TacGiaGoc,MaTacPhamGoc,TenTacPhamGoc,KhongXacDinhTacGiaGoc,NguonThamKhao,MoTaNguonGoc,SubmitRequestKey,SubmitRequestHash)
                      VALUES (@TenTacPham, @MaHoaSi, @MaDanhMuc, @Gia, @SoLuong, @SoLuongBanDau, @MoTa, @HinhAnh, @ChatLieu, @ChatLieuKhung, @KichThuoc, @TrangThai, @NgayTao, @LyDo,@LaTacPhamDocBan,@LoaiTacPham,@TacGiaGoc,@MaTacPhamGoc,@TenTacPhamGoc,@KhongXacDinhTacGiaGoc,@NguonThamKhao,@MoTaNguonGoc,@SubmitRequestKey,@SubmitRequestHash);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection, transaction);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@SoLuongBanDau", (object?)tacPham.SoLuongBanDau ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@NgayTao", tacPham.NgayTao);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);
        command.Parameters.AddWithValue("@LaTacPhamDocBan", tacPham.LaTacPhamDocBan);
        command.Parameters.AddWithValue("@LoaiTacPham", tacPham.LoaiTacPham);
        command.Parameters.AddWithValue("@TacGiaGoc", (object?)tacPham.TacGiaGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaTacPhamGoc", (object?)tacPham.MaTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TenTacPhamGoc", (object?)tacPham.TenTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@KhongXacDinhTacGiaGoc", tacPham.KhongXacDinhTacGiaGoc);
        command.Parameters.AddWithValue("@NguonThamKhao", (object?)tacPham.NguonThamKhao ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTaNguonGoc", (object?)tacPham.MoTaNguonGoc ?? DBNull.Value);

        command.Parameters.AddWithValue("@SubmitRequestKey", (object?)tacPham.SubmitRequestKey ?? DBNull.Value);
        command.Parameters.AddWithValue("@SubmitRequestHash", tacPham.SubmitRequestKey.HasValue ? requestHash : (object)DBNull.Value);
        var result = Convert.ToInt32(await command.ExecuteScalarAsync());
        if (tacPham.TrangThai == 0 && tacPham.MaYeuCauVeTranh == null)
        {
            var owner = await ThongBaoSql.LockArtworkAsync(connection, transaction, result, tacPham.MaHoaSi);
            await CreateSubmitDeclaration(connection, transaction, result, tacPham, owner.AccountId, owner.Artist);
            await ArtworkSaleSql.EnsureDeclaredAsync(connection, transaction, result);
            await ThongBaoSql.NotifyAdminsAsync(connection, transaction, WorkflowNotifications.Submitted(
                "TacPham", result, "ARTWORK_SUBMITTED", owner.Artist, owner.Name,
                "vừa gửi tác phẩm mới để duyệt", $"/admin/art?artworkId={result}"));
        }
        await transaction.CommitAsync();
        return result;
    }

    private static async Task CreateSubmitDeclaration(SqlConnection connection, SqlTransaction transaction,
        int artworkId, TacPham artwork, int accountId, string artistName)
    {
        if (!CopyrightUsageBases.IsValid(artwork.SubmitUsageBasis) || string.IsNullOrWhiteSpace(artwork.SubmitOriginDeclaration))
            throw new ArgumentException("Cần khai báo nguồn gốc, căn cứ và xác nhận quyền sử dụng trước khi gửi duyệt.");
        using var command = new SqlCommand(@"
            INSERT INTO BanQuyen(MaTacPham,MaTacGia,MaNguoiGiuQuyen,TacGia,NguonGoc,CanCuSuDung,NguonThamKhao,
                LaDuLieuCu,BiChanBan,TrangThai,NguoiTao,NguoiCapNhat,NgayTao,NgayCapNhat)
            OUTPUT INSERTED.MaBanQuyen
            VALUES(@Artwork,@Artist,@Artist,@Author,@Origin,@Basis,@Source,0,0,@Pending,@Actor,@Actor,SYSUTCDATETIME(),SYSUTCDATETIME());", connection, transaction);
        command.Parameters.AddWithValue("@Artwork", artworkId);
        command.Parameters.AddWithValue("@Artist", artwork.MaHoaSi);
        command.Parameters.AddWithValue("@Author", artistName);
        command.Parameters.AddWithValue("@Origin", artwork.SubmitOriginDeclaration);
        command.Parameters.AddWithValue("@Basis", artwork.SubmitUsageBasis!.Value);
        command.Parameters.AddWithValue("@Source", (object?)artwork.NguonThamKhao ?? DBNull.Value);
        command.Parameters.AddWithValue("@Pending", CopyrightStatuses.Pending);
        command.Parameters.AddWithValue("@Actor", accountId);
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        await AuditLogSql.InsertAsync(connection, transaction, "BanQuyen", id, "CREATE", accountId, null,
            after: JsonSerializer.Serialize(new { artworkId, artwork.SubmitUsageBasis }));
        await ThongBaoSql.NotifyAdminsAsync(connection, transaction, WorkflowNotifications.Submitted(
            "BanQuyen", id, "COPYRIGHT_SUBMITTED", artistName, artwork.TenTacPham,
            "vừa gửi khai báo nguồn gốc/quyền sử dụng cho tác phẩm", $"/admin/copyright?copyrightId={id}"));
    }

    public async Task<bool> Update(TacPham tacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        using var current = new SqlCommand("SELECT TrangThai FROM TacPham WITH (UPDLOCK,HOLDLOCK) WHERE MaTacPham=@Id;", connection, transaction);
        current.Parameters.AddWithValue("@Id", tacPham.MaTacPham);
        var statusValue = await current.ExecuteScalarAsync();
        if (statusValue == null) return false;
        var oldStatus = Convert.ToByte(statusValue);
        if (tacPham.ExpectedStatus.HasValue && oldStatus != tacPham.ExpectedStatus.Value) return false;

        if (tacPham.TrangThai == TacPhamStatus.PendingApproval && oldStatus != TacPhamStatus.PendingApproval)
            await ArtworkSaleSql.EnsureDeclaredAsync(connection, transaction, tacPham.MaTacPham);

        var query = @"UPDATE TacPham 
                      SET TenTacPham = @TenTacPham, 
                          MaDanhMuc = @MaDanhMuc, 
                          Gia = @Gia, 
                          SoLuong = @SoLuong, 
                          MoTa = @MoTa, 
                          HinhAnh = @HinhAnh, 
                          ChatLieu = @ChatLieu,
                          ChatLieuKhung = @ChatLieuKhung,
                          KichThuoc = @KichThuoc,
                          LoaiTacPham = @LoaiTacPham,
                          TacGiaGoc = @TacGiaGoc,
                          MaTacPhamGoc = @MaTacPhamGoc,
                          TenTacPhamGoc = @TenTacPhamGoc,
                          KhongXacDinhTacGiaGoc = @KhongXacDinhTacGiaGoc,
                          NguonThamKhao = @NguonThamKhao,
                          MoTaNguonGoc = @MoTaNguonGoc,
                          TrangThai = @TrangThai,
                          LyDo = @LyDo
                      WHERE MaTacPham = @MaTacPham";

        using var command = new SqlCommand(query, connection, transaction);
        command.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);

        command.Parameters.AddWithValue("@LoaiTacPham", tacPham.LoaiTacPham);
        command.Parameters.AddWithValue("@TacGiaGoc", (object?)tacPham.TacGiaGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaTacPhamGoc", (object?)tacPham.MaTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TenTacPhamGoc", (object?)tacPham.TenTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@KhongXacDinhTacGiaGoc", tacPham.KhongXacDinhTacGiaGoc);
        command.Parameters.AddWithValue("@NguonThamKhao", (object?)tacPham.NguonThamKhao ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTaNguonGoc", (object?)tacPham.MoTaNguonGoc ?? DBNull.Value);

        using (var originGuard = new SqlCommand(@"
            SELECT COUNT(*) FROM TacPham t JOIN BanQuyen b WITH (UPDLOCK,HOLDLOCK) ON b.MaTacPham=t.MaTacPham
            WHERE t.MaTacPham=@MaTacPham AND b.TrangThai=2 AND EXISTS(
                SELECT t.LoaiTacPham,t.TacGiaGoc,t.MaTacPhamGoc,t.TenTacPhamGoc,t.KhongXacDinhTacGiaGoc,t.NguonThamKhao,t.MoTaNguonGoc
                EXCEPT SELECT @LoaiTacPham,@TacGiaGoc,@MaTacPhamGoc,@TenTacPhamGoc,@KhongXacDinhTacGiaGoc,@NguonThamKhao,@MoTaNguonGoc);", connection, transaction))
        {
            foreach (var name in new[] { "@MaTacPham", "@LoaiTacPham", "@TacGiaGoc", "@MaTacPhamGoc", "@TenTacPhamGoc", "@KhongXacDinhTacGiaGoc", "@NguonThamKhao", "@MoTaNguonGoc" })
                originGuard.Parameters.AddWithValue(name, command.Parameters[name].Value);
            if (Convert.ToInt32(await originGuard.ExecuteScalarAsync()) > 0)
                throw new InvalidOperationException("Không thể sửa nguồn gốc của hồ sơ đã xác minh qua form tác phẩm. Vui lòng liên hệ Admin để xử lý lại hồ sơ quyền.");
        }
        var rowsAffected = await command.ExecuteNonQueryAsync();
        if (rowsAffected == 1 && oldStatus == 3 && tacPham.TrangThai == 0)
        {
            var owner = await ThongBaoSql.LockArtworkAsync(connection, transaction, tacPham.MaTacPham, tacPham.MaHoaSi);
            await ThongBaoSql.NotifyAdminsAsync(connection, transaction, WorkflowNotifications.Submitted(
                "TacPham", tacPham.MaTacPham, "ARTWORK_RESUBMITTED", owner.Artist, owner.Name,
                "đã gửi lại tác phẩm sau khi chỉnh sửa", $"/admin/art?artworkId={tacPham.MaTacPham}"));
        }
        await transaction.CommitAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateWithArtistNotification(TacPham tacPham, ThongBao thongBao, TacPhamChinhSua? edit = null)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try
        {
            const string accountSql = @"
                SELECT h.MaTaiKhoan FROM TacPham t WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN HoaSi h ON h.MaHoaSi=t.MaHoaSi
                WHERE t.MaTacPham=@MaTacPham AND t.MaHoaSi=@MaHoaSi AND t.MaYeuCauVeTranh IS NULL;";
            await using var account = new SqlCommand(accountSql, connection, transaction);
            account.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
            account.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
            var accountIdValue = await account.ExecuteScalarAsync();
            if (accountIdValue is null || accountIdValue == DBNull.Value)
                throw new InvalidOperationException("Không tìm được tài khoản chủ sở hữu tác phẩm");

            await using var state = new SqlCommand("SELECT TrangThai FROM TacPham WHERE MaTacPham=@Id;", connection, transaction);
            state.Parameters.AddWithValue("@Id", tacPham.MaTacPham);
            var oldStatus = Convert.ToByte(await state.ExecuteScalarAsync());
            if (edit == null && tacPham.ExpectedStatus.HasValue && oldStatus != tacPham.ExpectedStatus.Value)
            { await transaction.RollbackAsync(); return oldStatus == tacPham.TrangThai; }
            if (edit != null)
            {
                await using var review = new SqlCommand(@"UPDATE TacPhamChinhSua SET TrangThai=@Status,LyDo=@Reason
                    WHERE MaChinhSua=@Edit AND MaTacPham=@Id AND TrangThai=0 AND NgayChinhSua=@Revision;", connection, transaction);
                review.Parameters.AddWithValue("@Status", edit.TrangThai);
                review.Parameters.AddWithValue("@Reason", (object?)edit.LyDo ?? DBNull.Value);
                review.Parameters.AddWithValue("@Edit", edit.MaChinhSua);
                review.Parameters.AddWithValue("@Id", tacPham.MaTacPham);
                review.Parameters.AddWithValue("@Revision", edit.NgayChinhSua);
                if (await review.ExecuteNonQueryAsync() != 1) { await transaction.RollbackAsync(); return false; }
            }

            const string updateSql = @"UPDATE TacPham
                SET TenTacPham=@TenTacPham,MaDanhMuc=@MaDanhMuc,Gia=@Gia,SoLuong=@SoLuong,
                    MoTa=@MoTa,HinhAnh=@HinhAnh,ChatLieu=@ChatLieu,ChatLieuKhung=@ChatLieuKhung,
                    KichThuoc=@KichThuoc,TrangThai=@TrangThai,LyDo=@LyDo,
                    LoaiTacPham=@LoaiTacPham,TacGiaGoc=@TacGiaGoc,MaTacPhamGoc=@MaTacPhamGoc,
                    TenTacPhamGoc=@TenTacPhamGoc,KhongXacDinhTacGiaGoc=@KhongXacDinhTacGiaGoc,
                    NguonThamKhao=@NguonThamKhao,MoTaNguonGoc=@MoTaNguonGoc
                WHERE MaTacPham=@MaTacPham AND MaHoaSi=@MaHoaSi AND MaYeuCauVeTranh IS NULL;";
            await using var update = new SqlCommand(updateSql, connection, transaction);
            AddUpdateParameters(update, tacPham);
            if (await update.ExecuteNonQueryAsync() != 1)
                throw new InvalidOperationException("Tác phẩm đã thay đổi hoặc không còn tồn tại");

            thongBao.MaTaiKhoan = Convert.ToInt32(accountIdValue);
            await ThongBaoSql.StampEventAsync(connection, transaction, thongBao);
            await ThongBaoSql.InsertAsync(connection, transaction, thongBao);
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> DeleteWithArtistNotification(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        var owner = await ThongBaoSql.LockArtworkAsync(connection, transaction, maTacPham);
        using var command = new SqlCommand("DELETE FROM TacPham WHERE MaTacPham=@Id AND MaYeuCauVeTranh IS NULL;", connection, transaction);
        command.Parameters.AddWithValue("@Id", maTacPham);
        if (await command.ExecuteNonQueryAsync() != 1) return false;
        var notification = WorkflowNotifications.Decision("TacPham", maTacPham, "ARTWORK_REMOVED", owner.Name,
            "Tác phẩm", "đã được Admin gỡ khỏi hệ thống", "/artist/artworks");
        notification.MaTaiKhoan = owner.AccountId;
        await ThongBaoSql.StampEventAsync(connection, transaction, notification);
        await ThongBaoSql.InsertAsync(connection, transaction, notification);
        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> Delete(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM TacPham WHERE MaTacPham = @MaTacPham";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<bool> HasDeliveredOrders(int maTacPham)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"SELECT COUNT(1) 
                      FROM ChiTietDonHang ct 
                      JOIN DonHang d ON ct.MaDonHang = d.MaDonHang 
                      WHERE ct.MaTacPham = @MaTacPham AND d.TrangThai = 3"; // 3 is DaGiao

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@MaTacPham", maTacPham);

        var count = await command.ExecuteScalarAsync();
        return Convert.ToInt32(count) > 0;
    }

    private async Task<List<TacPham>> QueryList(string query, Action<SqlCommand>? configure = null)
    {
        var list = new List<TacPham>();
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        using var command = new SqlCommand(query, connection);
        configure?.Invoke(command);
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) list.Add(MapToTacPham(reader));
        await reader.CloseAsync();
        await ArtworkSaleSql.PopulateAsync(connection, list);
        return list;
    }

    private static void AddUpdateParameters(SqlCommand command, TacPham tacPham)
    {
        command.Parameters.AddWithValue("@MaTacPham", tacPham.MaTacPham);
        command.Parameters.AddWithValue("@MaHoaSi", tacPham.MaHoaSi);
        command.Parameters.AddWithValue("@TenTacPham", tacPham.TenTacPham);
        command.Parameters.AddWithValue("@MaDanhMuc", (object?)tacPham.MaDanhMuc ?? DBNull.Value);
        command.Parameters.AddWithValue("@Gia", tacPham.Gia);
        command.Parameters.AddWithValue("@SoLuong", tacPham.SoLuong);
        command.Parameters.AddWithValue("@MoTa", (object?)tacPham.MoTa ?? DBNull.Value);
        command.Parameters.AddWithValue("@HinhAnh", (object?)tacPham.HinhAnh ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieu", (object?)tacPham.ChatLieu ?? DBNull.Value);
        command.Parameters.AddWithValue("@ChatLieuKhung", (object?)tacPham.ChatLieuKhung ?? DBNull.Value);
        command.Parameters.AddWithValue("@KichThuoc", (object?)tacPham.KichThuoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@LoaiTacPham", tacPham.LoaiTacPham);
        command.Parameters.AddWithValue("@TacGiaGoc", (object?)tacPham.TacGiaGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@MaTacPhamGoc", (object?)tacPham.MaTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TenTacPhamGoc", (object?)tacPham.TenTacPhamGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@KhongXacDinhTacGiaGoc", tacPham.KhongXacDinhTacGiaGoc);
        command.Parameters.AddWithValue("@NguonThamKhao", (object?)tacPham.NguonThamKhao ?? DBNull.Value);
        command.Parameters.AddWithValue("@MoTaNguonGoc", (object?)tacPham.MoTaNguonGoc ?? DBNull.Value);
        command.Parameters.AddWithValue("@TrangThai", tacPham.TrangThai);
        command.Parameters.AddWithValue("@LyDo", (object?)tacPham.LyDo ?? DBNull.Value);
    }

    private static void AddAdminQueryParameters(SqlCommand command, AdminArtworkQuery query)
    {
        if (!string.IsNullOrWhiteSpace(query.Keyword))
            command.Parameters.AddWithValue("@Keyword", "%" + query.Keyword.Trim() + "%");
        if (query.MaHoaSi.HasValue)
            command.Parameters.AddWithValue("@MaHoaSi", query.MaHoaSi.Value);
        if (query.MaDanhMuc.HasValue)
            command.Parameters.AddWithValue("@MaDanhMuc", query.MaDanhMuc.Value);
        if (query.TrangThai.HasValue)
            command.Parameters.AddWithValue("@TrangThai", query.TrangThai.Value);
        if (query.LaTacPhamDocBan.HasValue)
            command.Parameters.AddWithValue("@LaTacPhamDocBan", query.LaTacPhamDocBan.Value);
    }

    private TacPham MapToTacPham(SqlDataReader reader)
    {
        return new TacPham
        {
            MaTacPham = reader.GetInt32(reader.GetOrdinal("MaTacPham")),
            TenTacPham = reader.GetString(reader.GetOrdinal("TenTacPham")),
            MaHoaSi = reader.GetInt32(reader.GetOrdinal("MaHoaSi")),
            MaDanhMuc = reader.IsDBNull(reader.GetOrdinal("MaDanhMuc")) 
                ? null 
                : reader.GetInt32(reader.GetOrdinal("MaDanhMuc")),
            Gia = reader.GetDecimal(reader.GetOrdinal("Gia")),
            SoLuong = reader.GetInt32(reader.GetOrdinal("SoLuong")),
            MoTa = reader.IsDBNull(reader.GetOrdinal("MoTa")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("MoTa")),
            HinhAnh = reader.IsDBNull(reader.GetOrdinal("HinhAnh")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("HinhAnh")),
            ChatLieu = reader.IsDBNull(reader.GetOrdinal("ChatLieu")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("ChatLieu")),
            ChatLieuKhung = reader.IsDBNull(reader.GetOrdinal("ChatLieuKhung")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("ChatLieuKhung")),
            KichThuoc = reader.IsDBNull(reader.GetOrdinal("KichThuoc")) 
                ? null 
                : reader.GetString(reader.GetOrdinal("KichThuoc")),
            TrangThai = reader.GetByte(reader.GetOrdinal("TrangThai")),
            NgayTao = reader.GetDateTime(reader.GetOrdinal("NgayTao")),
            LyDo = HasColumn(reader, "LyDo") && !reader.IsDBNull(reader.GetOrdinal("LyDo"))
                ? reader.GetString(reader.GetOrdinal("LyDo"))
                : null,
            LoaiTacPham = HasColumn(reader, "LoaiTacPham") && !reader.IsDBNull(reader.GetOrdinal("LoaiTacPham"))
                ? reader.GetByte(reader.GetOrdinal("LoaiTacPham"))
                : (byte)0,
            TacGiaGoc = HasColumn(reader, "TacGiaGoc") && !reader.IsDBNull(reader.GetOrdinal("TacGiaGoc"))
                ? reader.GetString(reader.GetOrdinal("TacGiaGoc"))
                : null,
            MaTacPhamGoc = HasColumn(reader, "MaTacPhamGoc") && !reader.IsDBNull(reader.GetOrdinal("MaTacPhamGoc"))
                ? reader.GetInt32(reader.GetOrdinal("MaTacPhamGoc"))
                : null,
            TenTacPhamGoc = HasColumn(reader, "TenTacPhamGoc") && !reader.IsDBNull(reader.GetOrdinal("TenTacPhamGoc"))
                ? reader.GetString(reader.GetOrdinal("TenTacPhamGoc")) : null,
            KhongXacDinhTacGiaGoc = HasColumn(reader, "KhongXacDinhTacGiaGoc")
                && !reader.IsDBNull(reader.GetOrdinal("KhongXacDinhTacGiaGoc"))
                && reader.GetBoolean(reader.GetOrdinal("KhongXacDinhTacGiaGoc")),
            NguonThamKhao = HasColumn(reader, "NguonThamKhao") && !reader.IsDBNull(reader.GetOrdinal("NguonThamKhao"))
                ? reader.GetString(reader.GetOrdinal("NguonThamKhao")) : null,
            MaYeuCauVeTranh = HasColumn(reader, "MaYeuCauVeTranh") && !reader.IsDBNull(reader.GetOrdinal("MaYeuCauVeTranh"))
                ? reader.GetInt32(reader.GetOrdinal("MaYeuCauVeTranh"))
                : null,
            MoTaNguonGoc = HasColumn(reader, "MoTaNguonGoc") && !reader.IsDBNull(reader.GetOrdinal("MoTaNguonGoc"))
                ? reader.GetString(reader.GetOrdinal("MoTaNguonGoc"))
                : null,
            LaTacPhamDocBan = HasColumn(reader, "LaTacPhamDocBan") && !reader.IsDBNull(reader.GetOrdinal("LaTacPhamDocBan"))
                && reader.GetBoolean(reader.GetOrdinal("LaTacPhamDocBan")),
            SoLuongBanDau = HasColumn(reader, "SoLuongBanDau") && !reader.IsDBNull(reader.GetOrdinal("SoLuongBanDau"))
                ? reader.GetInt32(reader.GetOrdinal("SoLuongBanDau"))
                : null
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
}
