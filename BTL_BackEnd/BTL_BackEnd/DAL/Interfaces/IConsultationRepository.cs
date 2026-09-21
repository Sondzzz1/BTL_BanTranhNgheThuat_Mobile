using DoAn2_BackEnd.DTO;
using DoAn2_BackEnd.Models;

namespace DoAn2_BackEnd.DAL.Interfaces;

public interface IConsultationRepository
{
    Task<ConsultationBooking> CreateBooking(int maKhachHang, TaoLichTuVanRequest request);
    Task<List<ConsultationBooking>> GetByCustomer(int maKhachHang);
    Task<List<ConsultationBooking>> GetAll();
    Task<ConsultationBooking?> GetById(int maLichTuVan);
    Task<bool> AssignArtist(int maLichTuVan, int maHoaSi);
    Task<bool> SaveResult(int maLichTuVan, string ketQuaTuVan);
    Task<bool> CreateRecommendation(TaoDeXuatTranhRequest request);
    Task<bool> CreateCriteria(ConsultationCriteria criteria);
}
