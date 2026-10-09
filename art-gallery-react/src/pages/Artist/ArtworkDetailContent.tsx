// Artist Artwork Detail Content - Họa sĩ quản lý nội dung chi tiết tác phẩm
import React, { useState, useEffect, useRef } from 'react';
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

type ImageField = 'hinhAnh1' | 'hinhAnh2' | 'hinhAnh3' | 'hinhAnh4';

const resolveContentImage = (value: string) => {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value;
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5273/api';
  return `${apiBase.replace(/\/api\/?$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
};

const ArtworkDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chiTiet, setChiTiet] = useState<ChiTietTacPham | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<ImageField | null>(null);
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);
  const [imageErrors, setImageErrors] = useState<Partial<Record<ImageField, boolean>>>({});
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
    if (!id || submitting.current || uploadingImage) return;

    const content = [formData.cauChuyenSangTac, formData.yNghiaNghiThuat,
      formData.kyThuatThucHien, formData.camHungSangTao, formData.thongTinBosung,
      formData.diaDiemSangTac, formData.hinhAnh1, formData.hinhAnh2, formData.hinhAnh3, formData.hinhAnh4];
    if (!formData.namSangTac.trim() && !content.some(value => value.trim())) {
      alert('Vui lòng nhập nội dung chi tiết hoặc ảnh bổ sung trước khi gửi duyệt.');
      return;
    }

    submitting.current = true;
    setSaving(true);
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
      await loadChiTiet();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      submitting.current = false;
      setSaving(false);
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

  const handleImageUpload = async (field: ImageField, file?: File) => {
    if (!id || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5 MB.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setUploadingImage(field);
    try {
      const response = await apiClient.post(`/hoa-si/tac-pham/${id}/chi-tiet/anh`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(current => ({ ...current, [field]: response.data.url }));
      setImageErrors(current => ({ ...current, [field]: false }));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setUploadingImage(null);
    }
  };

  const renderImageUpload = (field: ImageField, label: string) => {
    const value = formData[field];
    return (
      <div className="form-group">
        <label>{label}</label>
        {isEditing || !chiTiet ? (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={uploadingImage !== null}
            onChange={(event) => {
              void handleImageUpload(field, event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        ) : null}
        {uploadingImage === field && <p className="upload-status">Đang tải ảnh...</p>}
        {value && !imageErrors[field] ? (
          <div className="image-preview-wrap">
            <img
              src={resolveContentImage(value)}
              alt={label}
              className="image-preview"
              onError={() => setImageErrors(current => ({ ...current, [field]: true }))}
            />
            {(isEditing || !chiTiet) && (
              <button
                type="button"
                className="btn-remove-image"
                onClick={() => setFormData(current => ({ ...current, [field]: '' }))}
              >
                Xóa ảnh
              </button>
            )}
          </div>
        ) : value ? (
          <div className="image-placeholder">Không thể hiển thị ảnh đã lưu</div>
        ) : (
          <div className="image-placeholder">Chưa chọn ảnh</div>
        )}
      </div>
    );
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

      <p className="hint">Mô tả cơ bản và ảnh đại diện được chỉnh sửa tại Quản lý tác phẩm. Nội dung và ảnh bổ sung trên trang này được gửi Admin duyệt riêng.</p>

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
                readOnly
                title="Kích thước được quản lý tại thông tin tác phẩm"
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
                readOnly
                title="Chất liệu được quản lý tại thông tin tác phẩm"
              />
            </div>

            <div className="form-group">
              <label>Chất Liệu Khung</label>
              <input
                type="text"
                value={formData.chatLieuKhung}
                readOnly
                title="Chất liệu khung được quản lý tại thông tin tác phẩm"
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
          <p className="section-hint">Tải ảnh JPG, PNG hoặc WEBP, tối đa 5 MB mỗi ảnh. Ảnh được lưu thành tệp thật, không lưu Base64 trong cơ sở dữ liệu.</p>
          
          <div className="form-row">
            {renderImageUpload('hinhAnh1', 'Hình Ảnh 1')}
            {renderImageUpload('hinhAnh2', 'Hình Ảnh 2')}
          </div>

          <div className="form-row">
            {renderImageUpload('hinhAnh3', 'Hình Ảnh 3')}
            {renderImageUpload('hinhAnh4', 'Hình Ảnh 4')}
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          {!chiTiet || isEditing ? (
            <>
              <button type="submit" className="btn-save" disabled={saving || uploadingImage !== null}>
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
