using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.Models;
using Microsoft.Data.SqlClient;

namespace DoAn2_BackEnd.DAL;

public class BaiVietRepository : IBaiVietRepository
{
    private readonly string _connectionString;
    private const string Columns = @"MaBaiViet,TieuDe,NoiDung,MaHoaSi,NgayDang,TrangThai,LyDo,AnhTieuDe,
        TomTat,MaDanhMucBaiViet,MaTaiKhoanTacGia,NgayCapNhat,NgayXuatBan,
        NgayBatDauSuKien,NgayKetThucSuKien,DiaDiemSuKien,NguonNoiDung";

    public BaiVietRepository(IConfiguration configuration) =>
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");

    public Task<List<BaiViet>> GetAll() => QueryList($"SELECT {Columns} FROM BaiViet ORDER BY NgayDang DESC");

    public Task<List<BaiViet>> GetByHoaSi(int maHoaSi) => QueryList(
        $"SELECT {Columns} FROM BaiViet WHERE MaHoaSi=@MaHoaSi ORDER BY NgayDang DESC",
        c => c.Parameters.AddWithValue("@MaHoaSi", maHoaSi));

    public async Task<(List<BaiViet> Items, int Total)> GetPublished(string? keyword, int? maDanhMuc, int page, int pageSize)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 50);
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        const string where = @"TrangThai=2
            AND (@Keyword IS NULL OR TieuDe LIKE N'%' + @Keyword + N'%' OR TomTat LIKE N'%' + @Keyword + N'%' OR NoiDung LIKE N'%' + @Keyword + N'%')
            AND (@MaDanhMuc IS NULL OR MaDanhMucBaiViet=@MaDanhMuc)";
        using var count = new SqlCommand($"SELECT COUNT(*) FROM BaiViet WHERE {where}", connection);
        AddFilters(count, keyword, maDanhMuc);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync());

        using var command = new SqlCommand($@"SELECT {Columns} FROM BaiViet WHERE {where}
            ORDER BY COALESCE(NgayXuatBan,NgayDang) DESC,MaBaiViet DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", connection);
        AddFilters(command, keyword, maDanhMuc);
        command.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
        command.Parameters.AddWithValue("@PageSize", pageSize);
        var items = new List<BaiViet>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) items.Add(Map(reader));
        return (items, total);
    }

    public Task<BaiViet?> GetById(int id) => QueryOne($"SELECT {Columns} FROM BaiViet WHERE MaBaiViet=@Id", id);
    public Task<BaiViet?> GetPublishedById(int id) => QueryOne($"SELECT {Columns} FROM BaiViet WHERE MaBaiViet=@Id AND TrangThai=2", id);

    public async Task<int> Create(BaiViet b)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        const string sql = @"INSERT INTO BaiViet
            (TieuDe,NoiDung,MaHoaSi,NgayDang,TrangThai,LyDo,AnhTieuDe,TomTat,MaDanhMucBaiViet,MaTaiKhoanTacGia,
             NgayCapNhat,NgayXuatBan,NgayBatDauSuKien,NgayKetThucSuKien,DiaDiemSuKien,NguonNoiDung)
            VALUES(@TieuDe,@NoiDung,@MaHoaSi,@NgayDang,@TrangThai,@LyDo,@AnhTieuDe,@TomTat,@MaDanhMuc,@MaTaiKhoanTacGia,
             @NgayCapNhat,@NgayXuatBan,@NgayBatDau,@NgayKetThuc,@DiaDiem,@NguonNoiDung);
            SELECT CAST(SCOPE_IDENTITY() AS INT);";
        using var command = new SqlCommand(sql, connection); AddParameters(command, b);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<bool> Update(BaiViet b)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        const string sql = @"UPDATE BaiViet SET TieuDe=@TieuDe,NoiDung=@NoiDung,TrangThai=@TrangThai,LyDo=@LyDo,
            AnhTieuDe=@AnhTieuDe,TomTat=@TomTat,MaDanhMucBaiViet=@MaDanhMuc,MaTaiKhoanTacGia=@MaTaiKhoanTacGia,
            NgayCapNhat=@NgayCapNhat,NgayXuatBan=@NgayXuatBan,NgayBatDauSuKien=@NgayBatDau,
            NgayKetThucSuKien=@NgayKetThuc,DiaDiemSuKien=@DiaDiem,NguonNoiDung=@NguonNoiDung
            WHERE MaBaiViet=@MaBaiViet";
        using var command = new SqlCommand(sql, connection); AddParameters(command, b);
        command.Parameters.AddWithValue("@MaBaiViet", b.MaBaiViet);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<bool> Delete(int id)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand("DELETE FROM BaiViet WHERE MaBaiViet=@Id", connection);
        command.Parameters.AddWithValue("@Id", id);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<List<DanhMucBaiViet>> GetCategories(bool onlyActive = true)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand($"SELECT MaDanhMucBaiViet,TenDanhMuc,Slug,TrangThai FROM DanhMucBaiViet{(onlyActive ? " WHERE TrangThai=1" : "")} ORDER BY MaDanhMucBaiViet", connection);
        var result = new List<DanhMucBaiViet>(); using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new DanhMucBaiViet { MaDanhMucBaiViet=reader.GetInt32(0), TenDanhMuc=reader.GetString(1), Slug=reader.GetString(2), TrangThai=reader.GetBoolean(3) });
        return result;
    }

    public async Task<int> CreateCategory(string name, string slug)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand(@"INSERT INTO DanhMucBaiViet(TenDanhMuc,Slug,TrangThai)
            VALUES(@Name,@Slug,1); SELECT CAST(SCOPE_IDENTITY() AS INT);", connection);
        command.Parameters.AddWithValue("@Name", name);
        command.Parameters.AddWithValue("@Slug", slug);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<bool> UpdateCategory(int id, string name, string slug, bool active)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand(@"UPDATE DanhMucBaiViet
            SET TenDanhMuc=@Name,Slug=@Slug,TrangThai=@Active WHERE MaDanhMucBaiViet=@Id", connection);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Name", name);
        command.Parameters.AddWithValue("@Slug", slug);
        command.Parameters.AddWithValue("@Active", active);
        return await command.ExecuteNonQueryAsync() == 1;
    }

    public async Task<List<HinhAnhBaiViet>> GetImages(int maBaiViet)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand("SELECT MaHinhAnh,MaBaiViet,DuongDan,ChuThich,ThuTu FROM HinhAnhBaiViet WHERE MaBaiViet=@Id ORDER BY ThuTu,MaHinhAnh", connection);
        command.Parameters.AddWithValue("@Id", maBaiViet); var result = new List<HinhAnhBaiViet>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(new HinhAnhBaiViet { MaHinhAnh=reader.GetInt32(0), MaBaiViet=reader.GetInt32(1), DuongDan=reader.GetString(2), ChuThich=reader.IsDBNull(3)?null:reader.GetString(3), ThuTu=reader.GetInt32(4) });
        return result;
    }

    public async Task<int> AddImage(int maBaiViet,string path,string? caption,int order)
    {
        using var connection=new SqlConnection(_connectionString);await connection.OpenAsync();
        using var command=new SqlCommand(@"INSERT INTO HinhAnhBaiViet(MaBaiViet,DuongDan,ChuThich,ThuTu) VALUES(@Id,@Path,@Caption,@Order);SELECT CAST(SCOPE_IDENTITY() AS INT);",connection);
        command.Parameters.AddWithValue("@Id",maBaiViet);command.Parameters.AddWithValue("@Path",path);command.Parameters.AddWithValue("@Caption",Db(caption?.Trim()));command.Parameters.AddWithValue("@Order",Math.Max(0,order));return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<List<TacPham>> GetPublicLinkedArtworks(int maBaiViet)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var command = new SqlCommand(@"SELECT t.* FROM BaiVietTacPham l INNER JOIN TacPham t ON t.MaTacPham=l.MaTacPham
            WHERE l.MaBaiViet=@Id AND t.TrangThai=1 AND t.MaYeuCauVeTranh IS NULL ORDER BY l.ThuTu,t.MaTacPham", connection);
        command.Parameters.AddWithValue("@Id", maBaiViet); var result = new List<TacPham>(); using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync()) result.Add(MapTacPham(reader)); return result;
    }

    public async Task ReplaceArtworkLinks(int maBaiViet, IReadOnlyCollection<int> ids)
    {
        using var connection = new SqlConnection(_connectionString); await connection.OpenAsync();
        using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
        try
        {
            using (var delete = new SqlCommand("DELETE FROM BaiVietTacPham WHERE MaBaiViet=@Id", connection, transaction))
            { delete.Parameters.AddWithValue("@Id", maBaiViet); await delete.ExecuteNonQueryAsync(); }
            var order = 0;
            foreach (var id in ids.Distinct())
            {
                using var insert = new SqlCommand(@"INSERT INTO BaiVietTacPham(MaBaiViet,MaTacPham,ThuTu)
                    SELECT @BaiViet,@TacPham,@ThuTu WHERE EXISTS(SELECT 1 FROM TacPham WHERE MaTacPham=@TacPham AND TrangThai=1 AND MaYeuCauVeTranh IS NULL)", connection, transaction);
                insert.Parameters.AddWithValue("@BaiViet", maBaiViet); insert.Parameters.AddWithValue("@TacPham", id); insert.Parameters.AddWithValue("@ThuTu", order++);
                if (await insert.ExecuteNonQueryAsync()!=1) throw new InvalidOperationException($"Tác phẩm #{id} không công khai hoặc là commission riêng tư");
            }
            await transaction.CommitAsync();
        }
        catch { await transaction.RollbackAsync(); throw; }
    }

    private async Task<List<BaiViet>> QueryList(string sql, Action<SqlCommand>? configure=null)
    {
        using var connection=new SqlConnection(_connectionString); await connection.OpenAsync(); using var command=new SqlCommand(sql,connection); configure?.Invoke(command);
        var result=new List<BaiViet>(); using var reader=await command.ExecuteReaderAsync(); while(await reader.ReadAsync()) result.Add(Map(reader)); return result;
    }
    private async Task<BaiViet?> QueryOne(string sql,int id)
    {
        using var connection=new SqlConnection(_connectionString); await connection.OpenAsync(); using var command=new SqlCommand(sql,connection); command.Parameters.AddWithValue("@Id",id);
        using var reader=await command.ExecuteReaderAsync(); return await reader.ReadAsync()?Map(reader):null;
    }
    private static void AddFilters(SqlCommand c,string? keyword,int? category)
    { c.Parameters.AddWithValue("@Keyword",string.IsNullOrWhiteSpace(keyword)?DBNull.Value:keyword.Trim()); c.Parameters.AddWithValue("@MaDanhMuc",category.HasValue?category.Value:DBNull.Value); }
    private static void AddParameters(SqlCommand c,BaiViet b)
    {
        c.Parameters.AddWithValue("@TieuDe",b.TieuDe); c.Parameters.AddWithValue("@NoiDung",Db(b.NoiDung)); c.Parameters.AddWithValue("@MaHoaSi",Db(b.MaHoaSi));
        c.Parameters.AddWithValue("@NgayDang",b.NgayDang); c.Parameters.AddWithValue("@TrangThai",b.TrangThai); c.Parameters.AddWithValue("@LyDo",Db(b.LyDo)); c.Parameters.AddWithValue("@AnhTieuDe",Db(b.AnhTieuDe));
        c.Parameters.AddWithValue("@TomTat",Db(b.TomTat)); c.Parameters.AddWithValue("@MaDanhMuc",Db(b.MaDanhMucBaiViet)); c.Parameters.AddWithValue("@MaTaiKhoanTacGia",Db(b.MaTaiKhoanTacGia));
        c.Parameters.AddWithValue("@NgayCapNhat",Db(b.NgayCapNhat)); c.Parameters.AddWithValue("@NgayXuatBan",Db(b.NgayXuatBan)); c.Parameters.AddWithValue("@NgayBatDau",Db(b.NgayBatDauSuKien)); c.Parameters.AddWithValue("@NgayKetThuc",Db(b.NgayKetThucSuKien));
        c.Parameters.AddWithValue("@DiaDiem",Db(b.DiaDiemSuKien)); c.Parameters.AddWithValue("@NguonNoiDung",Db(b.NguonNoiDung));
    }
    private static object Db(object? value)=>value??DBNull.Value;
    private static BaiViet Map(SqlDataReader r)=>new()
    {
        MaBaiViet=r.GetInt32(r.GetOrdinal("MaBaiViet")),TieuDe=r.GetString(r.GetOrdinal("TieuDe")),NoiDung=Text(r,"NoiDung"),MaHoaSi=Int(r,"MaHoaSi"),NgayDang=r.GetDateTime(r.GetOrdinal("NgayDang")),TrangThai=Convert.ToByte(r["TrangThai"]),LyDo=Text(r,"LyDo"),AnhTieuDe=Text(r,"AnhTieuDe"),TomTat=Text(r,"TomTat"),MaDanhMucBaiViet=Int(r,"MaDanhMucBaiViet"),MaTaiKhoanTacGia=Int(r,"MaTaiKhoanTacGia"),NgayCapNhat=Date(r,"NgayCapNhat"),NgayXuatBan=Date(r,"NgayXuatBan"),NgayBatDauSuKien=Date(r,"NgayBatDauSuKien"),NgayKetThucSuKien=Date(r,"NgayKetThucSuKien"),DiaDiemSuKien=Text(r,"DiaDiemSuKien"),NguonNoiDung=Text(r,"NguonNoiDung")
    };
    private static string? Text(SqlDataReader r,string n)=>r.IsDBNull(r.GetOrdinal(n))?null:r.GetString(r.GetOrdinal(n));
    private static int? Int(SqlDataReader r,string n)=>r.IsDBNull(r.GetOrdinal(n))?null:r.GetInt32(r.GetOrdinal(n));
    private static DateTime? Date(SqlDataReader r,string n)=>r.IsDBNull(r.GetOrdinal(n))?null:r.GetDateTime(r.GetOrdinal(n));
    private static TacPham MapTacPham(SqlDataReader r)=>new()
    {
        MaTacPham=r.GetInt32(r.GetOrdinal("MaTacPham")),TenTacPham=r.GetString(r.GetOrdinal("TenTacPham")),MaHoaSi=r.GetInt32(r.GetOrdinal("MaHoaSi")),Gia=r.GetDecimal(r.GetOrdinal("Gia")),SoLuong=r.GetInt32(r.GetOrdinal("SoLuong")),HinhAnh=Text(r,"HinhAnh"),TrangThai=Convert.ToByte(r["TrangThai"]),NgayTao=r.GetDateTime(r.GetOrdinal("NgayTao"))
    };
}
