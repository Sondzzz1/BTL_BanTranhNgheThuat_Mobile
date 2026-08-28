// Artist Artwork Detail Content - Họa sĩ quản lý nội dung chi tiết tác phẩm
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/api';
import './ArtworkDetailContent.css';

interface ChiTietTacPham {
  maChiTiet: number;
  maTacPham: number;
  tenTacPham: string;
  maHoaSi: number;
  tenHoaSi: string;
  cauChuyenSangTac?: string;
  yNghiaNghiThuat?: string;
  kyThuatThucHien?: string;
  camHungSangTao?: string;
  thongTinBosung?: string;
  kichThuoc?: string;
  chatLieu?: string;
  chatLieuKhung?: string;
  namSangTac?: number;
  diaDiemSangTac?: string;
  hinhAnh1?: string;
  hinhAnh2?: string;
  hinhAnh3?: string;
  hinhAnh4?: string;
  trangThai: number;
  trangThaiText: string;
  lyDoTuChoi?: string;
  ngayTao: string;
  ngayCapNhat?: string;
  ngayDuyet?: string;
  tenNguoiDuyet?: string;
}

const ArtworkDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chiTiet, setChiTiet] = useState<ChiTietTacPham | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cauChuyenSangTac: '',
    yNghiaNghiThuat: '',
    kyThuatThucHien: '',
    camHungSangTao: '',
    thongTinBosung: '',
    kichThuoc: '',
    chatLieu: '',
    chatLieuKhung: '',
    namSangTac: '',
    diaDiemSangTac: '',
    hinhAnh1: '',
    hinhAnh2: '',
    hinhAnh3: '',
    hinhAnh4: '',
  });

  useEffect(() => {
    loadChiTiet();
  }, [id]);

  const loadChiTiet = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/hoa-si/tac-pham/${id}/chi-tiet`);
      setChiTiet(response.data);
      setFormData({
        cauChuyenSangTac: response.data.cauChuyenSangTac || '',
        yNghiaNghiThuat: response.data.yNghiaNghiThuat || '',
        kyThuatThucHien: response.data.kyThuatThucHien || '',
        camHungSangTao: response.data.camHungSangTao || '',
        thongTinBosung: response.data.thongTinBosung || '',
        kichThuoc: response.data.kichThuoc || '',
        chatLieu: response.data.chatLieu || '',
        chatLieuKhung: response.data.chatLieuKhung || '',
        namSangTac: response.data.namSangTac?.toString() || '',
        diaDiemSangTac: response.data.diaDiemSangTac || '',
        hinhAnh1: response.data.hinhAnh1 || '',
        hinhAnh2: response.data.hinhAnh2 || '',
        hinhAnh3: response.data.hinhAnh3 || '',
        hinhAnh4: response.data.hinhAnh4 || '',
      });
      setIsEditing(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Chưa có chi tiết, cho phép tạo mới
        setChiTiet(null);
        setIsEditing(true);
      } else {
        console.error('Lỗi khi tải chi tiết:', error);
        alert('Không thể tải thông tin chi tiết');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const payload = {
        cauChuyenSangTac: formData.cauChuyenSangTac || null,
        yNghiaNghiThuat: formData.yNghiaNghiThuat || null,
        kyThuatThucHien: formData.kyThuatThucHien || null,
        camHungSangTao: formData.camHungSangTao || null,
        thongTinBosung: formData.thongTinBosung || null,
        kichThuoc: formData.kichThuoc || null,
        chatLieu: formData.chatLieu || null,
        chatLieuKhung: formData.chatLieuKhung || null,
        namSangTac: formData.namSangTac ? parseInt(formData.namSangTac) : null,
        diaDiemSangTac: formData.diaDiemSangTac || null,
        hinhAnh1: formData.hinhAnh1 || null,
        hinhAnh2: formData.hinhAnh2 || null,
        hinhAnh3: formData.hinhAnh3 || null,
        hinhAnh4: formData.hinhAnh4 || null,
      };

      if (chiTiet) {
        // Cập nhật
        await apiClient.put(`/hoa-si/tac-pham/${id}/chi-tiet`, payload);
        alert('Cập nhật thành công! Nội dung sẽ được admin duyệt lại.');
      } else {
        // Tạo mới
        await apiClient.post(`/hoa-si/tac-pham/${id}/chi-tiet`, payload);
        alert('Tạo chi tiết thành công! Đang chờ admin duyệt.');
      }
      loadChiTiet();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!id || !chiTiet) return;
    if (!window.confirm('Bạn có chắc muốn xóa nội dung chi tiết này?')) return;

    try {
      await apiClient.delete(`/hoa-si/tac-pham/${id}/chi-tiet`);
      alert('Đã xóa chi tiết thành công!');
      navigate(`/artist/artworks`);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể xóa chi tiết');
    }
  };

  const getTrangThaiClass = (trangThai: number) => {
    switch (trangThai) {
      case 0: return 'pending';
      case 1: return 'success';
      case 2: return 'canceled';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <div className="loading-spinner">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div id="artwork-detail-content" className="page">
      {/* Header */}
      <div className="detail-content-header">
        <div className="header-left">
          <Link to="/artist/artworks" className="btn-back">
            <i className="ti-arrow-left"></i> Quay lại
          </Link>
          <h4>
            <i className="ti-write"></i> {chiTiet ? 'Quản Lý Nội Dung Chi Tiết' : 'Tạo Nội Dung Chi Tiết'}
          </h4>
        </div>
        {chiTiet && (
          <div className="header-status">
            <span className={`status ${getTrangThaiClass(chiTiet.trangThai)}`}>
              {chiTiet.trangThaiText}
            </span>
          </div>
        )}
      </div>

      {/* Thông báo từ chối */}
      {chiTiet && chiTiet.trangThai === 2 && chiTiet.lyDoTuChoi && (
        <div className="reject-notice">
          <h4>
            <i className="ti-alert"></i> Nội dung bị từ chối
          </h4>
          <p><strong>Lý do:</strong> {chiTiet.lyDoTuChoi}</p>
          <p className="hint">Vui lòng chỉnh sửa nội dung và gửi lại để admin duyệt.</p>
        </div>
      )}

      {/* Thông báo đã duyệt */}
      {chiTiet && chiTiet.trangThai === 1 && (
        <div className="approved-notice">
          <i className="ti-check"></i> Nội dung đã được duyệt và hiển thị công khai
          {chiTiet.ngayDuyet && (
            <span className="date"> - Ngày duyệt: {new Date(chiTiet.ngayDuyet).toLocaleDateString('vi-VN')}</span>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="detail-content-form">
        <div className="form-section">
          <h3><i className="ti-book"></i> Nội Dung Nghệ Thuật</h3>
          
          <div className="form-group">
            <label>
              <i className="ti-pencil-alt"></i> Câu Chuyện Sáng Tác
              <span className="hint">Kể về quá trình và cảm xúc khi sáng tác tác phẩm</span>
            </label>
            <textarea
              value={formData.cauChuyenSangTac}
              onChange={(e) => setFormData({ ...formData, cauChuyenSangTac: e.target.value })}
              rows={6}
              placeholder="Ví dụ: Tác phẩm được sáng tác vào mùa thu năm 2025, khi tôi đang du lịch tại vùng núi phía Bắc..."
              disabled={!isEditing && chiTiet !== null}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="ti-light-bulb"></i> Ý Nghĩa Nghệ Thuật
              <span className="hint">Giải thích ý nghĩa, thông điệp mà tác phẩm muốn truyền tải</span>
            </label>
            <textarea
              value={formData.yNghiaNghiThuat}
              onChange={(e) => setFormData({ ...formData, yNghiaNghiThuat: e.target.value })}
              rows={6}
              placeholder="Ví dụ: Tác phẩm thể hiện vẻ đẹp của thiên nhiên và sự hòa quyện giữa con người với môi trường..."
              disabled={!isEditing && chiTiet !== null}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="ti-brush-alt"></i> Kỹ Thuật Thực Hiện
              <span className="hint">Mô tả kỹ thuật, phương pháp vẽ được sử dụng</span>
            </label>
            <textarea
              value={formData.kyThuatThucHien}
              onChange={(e) => setFormData({ ...formData, kyThuatThucHien: e.target.value })}
              rows={6}
              placeholder="Ví dụ: Sử dụng kỹ thuật sơn dầu truyền thống, lớp màu được phủ nhiều lần để tạo chiều sâu..."
              disabled={!isEditing && chiTiet !== null}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="ti-star"></i> Cảm Hứng Sáng Tạo
              <span className="hint">Nguồn cảm hứng, điều gì đã thúc đẩy bạn sáng tác</span>
            </label>
            <textarea
              value={formData.camHungSangTao}
              onChange={(e) => setFormData({ ...formData, camHungSangTao: e.target.value })}
              rows={6}
              placeholder="Ví dụ: Lấy cảm hứng từ cánh đồng lúa chín vàng ở quê nhà, nơi tôi đã trải qua tuổi thơ..."
              disabled={!isEditing && chiTiet !== null}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="ti-info-alt"></i> Thông Tin Bổ Sung
              <span className="hint">Các thông tin khác về tác phẩm (triển lãm, giải thưởng...)</span>
            </label>
            <textarea
              value={formData.thongTinBosung}
              onChange={(e) => setFormData({ ...formData, thongTinBosung: e.target.value })}
              rows={4}
              placeholder="Ví dụ: Tác phẩm đã được triển lãm tại Bảo tàng Mỹ thuật Hà Nội năm 2025..."
              disabled={!isEditing && chiTiet !== null}
            />
          </div>
        </div>

        <div className="form-section">
          <h3><i className="ti-settings"></i> Thông Tin Kỹ Thuật</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Kích Thước</label>
              <input
                type="text"
                value={formData.kichThuoc}
                onChange={(e) => setFormData({ ...formData, kichThuoc: e.target.value })}
                placeholder="Ví dụ: 80cm x 120cm"
                disabled={!isEditing && chiTiet !== null}
              />
            </div>

            <div className="form-group">
              <label>Năm Sáng Tác</label>
              <input
                type="number"
                value={formData.namSangTac}
                onChange={(e) => setFormData({ ...formData, namSangTac: e.target.value })}
                placeholder="Ví dụ: 2025"
                min="1900"
                max="2100"
                disabled={!isEditing && chiTiet !== null}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Chất Liệu Tranh</label>
              <input
                type="text"
                value={formData.chatLieu}
                onChange={(e) => setFormData({ ...formData, chatLieu: e.target.value })}
                placeholder="Ví dụ: Sơn dầu trên canvas"
                disabled={!isEditing && chiTiet !== null}
              />
            </div>

            <div className="form-group">
              <label>Chất Liệu Khung</label>
              <input
                type="text"
                value={formData.chatLieuKhung}
                onChange={(e) => setFormData({ ...formData, chatLieuKhung: e.target.value })}
                placeholder="Ví dụ: Khung gỗ sồi tự nhiên"
                disabled={!isEditing && chiTiet !== null}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Địa Điểm Sáng Tác</label>
            <input
              type="text"
              value={formData.diaDiemSangTac}
              onChange={(e) => setFormData({ ...formData, diaDiemSangTac: e.target.value })}
              placeholder="Ví dụ: Hà Nội, Việt Nam"
              disabled={!isEditing && chiTiet !== null}
            />
          </div>
        </div>

        <div className="form-section">
          <h3><i className="ti-gallery"></i> Hình Ảnh Bổ Sung (Tối đa 4 ảnh)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Hình Ảnh 1</label>
              <input
                type="text"
                value={formData.hinhAnh1}
                onChange={(e) => setFormData({ ...formData, hinhAnh1: e.target.value })}
                placeholder="URL hình ảnh 1"
                disabled={!isEditing && chiTiet !== null}
              />
              {formData.hinhAnh1 && (
                <img src={formData.hinhAnh1} alt="Preview 1" className="image-preview" />
              )}
            </div>

            <div className="form-group">
              <label>Hình Ảnh 2</label>
              <input
                type="text"
                value={formData.hinhAnh2}
                onChange={(e) => setFormData({ ...formData, hinhAnh2: e.target.value })}
                placeholder="URL hình ảnh 2"
                disabled={!isEditing && chiTiet !== null}
              />
              {formData.hinhAnh2 && (
                <img src={formData.hinhAnh2} alt="Preview 2" className="image-preview" />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hình Ảnh 3</label>
              <input
                type="text"
                value={formData.hinhAnh3}
                onChange={(e) => setFormData({ ...formData, hinhAnh3: e.target.value })}
                placeholder="URL hình ảnh 3"
                disabled={!isEditing && chiTiet !== null}
              />
              {formData.hinhAnh3 && (
                <img src={formData.hinhAnh3} alt="Preview 3" className="image-preview" />
              )}
            </div>

            <div className="form-group">
              <label>Hình Ảnh 4</label>
              <input
                type="text"
                value={formData.hinhAnh4}
                onChange={(e) => setFormData({ ...formData, hinhAnh4: e.target.value })}
                placeholder="URL hình ảnh 4"
                disabled={!isEditing && chiTiet !== null}
              />
              {formData.hinhAnh4 && (
                <img src={formData.hinhAnh4} alt="Preview 4" className="image-preview" />
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          {!chiTiet || isEditing ? (
            <>
              <button type="submit" className="btn-save">
                <i className="ti-check"></i> {chiTiet ? 'Cập Nhật & Gửi Duyệt' : 'Tạo & Gửi Duyệt'}
              </button>
              {chiTiet && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    loadChiTiet();
                  }}
                >
                  Hủy
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                <i className="ti-pencil"></i> Chỉnh Sửa
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handleDelete}
              >
                <i className="ti-trash"></i> Xóa
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ArtworkDetailContent;
