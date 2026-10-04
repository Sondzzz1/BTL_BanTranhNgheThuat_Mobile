using DoAn2_BackEnd.BLL.Interfaces;
using DoAn2_BackEnd.DAL.Interfaces;
using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL;

public class DanhGiaBusiness : IDanhGiaBusiness
{
    private readonly IDanhGiaRepository _repository;
    private readonly ITacPhamRepository _artworkRepository;

    public DanhGiaBusiness(IDanhGiaRepository repository, ITacPhamRepository artworkRepository)
    {
        _repository = repository;
        _artworkRepository = artworkRepository;
    }

    public async Task<List<DanhGiaResponse>> GetByArtwork(int maTacPham)
    {
        await EnsureArtworkExists(maTacPham);
        return await _repository.GetByArtwork(maTacPham);
    }

    public Task<List<DanhGiaResponse>> GetFiveStars() => _repository.GetFiveStars();

    public async Task<TongHopDanhGiaResponse> GetSummary(int maTacPham)
    {
        await EnsureArtworkExists(maTacPham);
        return await _repository.GetSummary(maTacPham);
    }

    public async Task<QuyenDanhGiaResponse> GetPermission(int maNguoiDung, int maTacPham)
    {
        await EnsureArtworkExists(maTacPham);
        var existing = await _repository.GetByUserAndArtwork(maNguoiDung, maTacPham);
        var canCreate = await _repository.CanCreate(maNguoiDung, maTacPham);
        return new QuyenDanhGiaResponse
        {
            // Review đã tồn tại vẫn được sửa/xóa kể cả khi hàng sau đó hoàn trả toàn bộ.
            CanReview = existing != null || canCreate,
            ExistingReview = existing,
            Reason = existing != null
                ? "Bạn đã đánh giá tác phẩm này"
                : canCreate ? null : "Bạn chỉ có thể đánh giá tác phẩm đã nhận và chưa hoàn trả toàn bộ"
        };
    }

    public async Task<DanhGiaResponse> Create(int maNguoiDung, TaoDanhGiaRequest request)
        => await CreateWithImage(maNguoiDung, request, null);

    public async Task<DanhGiaResponse> CreateWithImage(int maNguoiDung, TaoDanhGiaRequest request, string? hinhAnhDanhGia)
    {
        await EnsureArtworkExists(request.MaTacPham);
        Normalize(request);
        var id = await _repository.Create(maNguoiDung, request, hinhAnhDanhGia);
        return await _repository.GetById(id) ?? throw new InvalidOperationException("Không thể đọc đánh giá vừa tạo");
    }

    public async Task<DanhGiaResponse> Update(int maNguoiDung, int maDanhGia, CapNhatDanhGiaRequest request)
    {
        var existing = await _repository.GetById(maDanhGia);
        if (existing == null) throw new KeyNotFoundException("Không tìm thấy đánh giá");
        if (existing.MaNguoiDung != maNguoiDung) throw new UnauthorizedAccessException("Bạn không có quyền sửa đánh giá này");
        Normalize(request);
        if (!await _repository.Update(maDanhGia, maNguoiDung, request))
            throw new InvalidOperationException("Không thể cập nhật đánh giá");
        return await _repository.GetById(maDanhGia) ?? throw new InvalidOperationException("Không thể đọc đánh giá vừa cập nhật");
    }

    public async Task<(DanhGiaResponse Review, string? PreviousImageName)> UpdateWithImage(
        int maNguoiDung,
        int maDanhGia,
        CapNhatDanhGiaRequest request,
        string? hinhAnhDanhGia)
    {
        var existing = await _repository.GetById(maDanhGia);
        if (existing == null) throw new KeyNotFoundException("Không tìm thấy đánh giá");
        if (existing.MaNguoiDung != maNguoiDung) throw new UnauthorizedAccessException("Bạn không có quyền sửa đánh giá này");
        Normalize(request);
        var update = await _repository.UpdateWithImage(maDanhGia, maNguoiDung, request, hinhAnhDanhGia);
        if (!update.Updated) throw new InvalidOperationException("Không thể cập nhật đánh giá");
        var review = await _repository.GetById(maDanhGia) ?? throw new InvalidOperationException("Không thể đọc đánh giá vừa cập nhật");
        return (review, update.PreviousImageName);
    }

    public Task<string?> GetImageName(int maDanhGia) => _repository.GetImageName(maDanhGia);

    public async Task Delete(int maNguoiDung, int maDanhGia)
    {
        var existing = await _repository.GetById(maDanhGia);
        if (existing == null) throw new KeyNotFoundException("Không tìm thấy đánh giá");
        if (existing.MaNguoiDung != maNguoiDung) throw new UnauthorizedAccessException("Bạn không có quyền xóa đánh giá này");
        if (!await _repository.Delete(maDanhGia, maNguoiDung))
            throw new InvalidOperationException("Không thể xóa đánh giá");
    }

    private async Task EnsureArtworkExists(int maTacPham)
    {
        if (maTacPham <= 0 || await _artworkRepository.GetById(maTacPham) == null)
            throw new KeyNotFoundException("Không tìm thấy tác phẩm");
    }

    private static void Normalize(TaoDanhGiaRequest request)
    {
        Validate(request.DanhGia, request.BinhLuan, out var comment);
        request.BinhLuan = comment;
    }

    private static void Normalize(CapNhatDanhGiaRequest request)
    {
        Validate(request.DanhGia, request.BinhLuan, out var comment);
        request.BinhLuan = comment;
    }

    private static void Validate(int rating, string? rawComment, out string? comment)
    {
        if (rating is < 1 or > 5) throw new ArgumentException("Điểm đánh giá phải từ 1 đến 5");
        comment = string.IsNullOrWhiteSpace(rawComment) ? null : rawComment.Trim();
        if (comment?.Length > 500) throw new ArgumentException("Nội dung đánh giá tối đa 500 ký tự");
    }
}
