using DoAn2_BackEnd.DTO;

namespace DoAn2_BackEnd.BLL.Interfaces;

public interface IConsultationBusiness
{
    Task<ConsultationBookingResponse> DatLichTuVan(int maKhachHang, TaoLichTuVanRequest request);
    Task<List<ConsultationBookingResponse>> LayLichTuVanCuaToi(int maKhachHang);
    Task<List<ConsultationBookingResponse>> LayTatCaLichTuVan();
    Task<bool> GanHoaSiChoLichTuVan(int maLichTuVan, int maHoaSi);
    Task<bool> ThemKetQuaTuVan(int maLichTuVan, string ketQua);
    Task<bool> ThemDeXuat(int maLichTuVan, TaoDeXuatTranhRequest request);
    Task<bool> ThemTieuChiTuVan(ConsultationCriteria criteria);
}
