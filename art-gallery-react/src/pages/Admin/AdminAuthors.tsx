import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, HoSoHoaSiResponse, TacPhamHoaSiResponse } from '../../services/adminService';

interface CreateForm {
    tenDangNhap: string;
    matKhau: string;
    tenHoaSi: string;
    email: string;
    dienThoai: string;
    diaChi: string;
}

const emptyForm: CreateForm = {
    tenDangNhap: '',
    matKhau: '',
    tenHoaSi: '',
    email: '',
    dienThoai: '',
    diaChi: '',
};

const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const AdminAuthors: React.FC = () => {
    const navigate = useNavigate();
    const [authors, setAuthors] = useState<HoSoHoaSiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<CreateForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // State cho modal xem tác phẩm
    const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState<HoSoHoaSiResponse | null>(null);
    const [artworks, setArtworks] = useState<TacPhamHoaSiResponse[]>([]);
    const [loadingArtworks, setLoadingArtworks] = useState(false);

    useEffect(() => {
        loadAuthors();
    }, []);

    const loadAuthors = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllHoaSi();
            setAuthors(data);
        } catch (error) {
            console.error('Lỗi khi tải tác giả:', error);
            alert('Không thể tải danh sách tác giả');
        } finally {
            setLoading(false);
        }
    };

    const handleLock = async (id: number, currentStatus: boolean) => {
        const msg = currentStatus
            ? 'Khóa tài khoản tác giả này?'
            : 'Mở khóa tài khoản tác giả này?';
        if (!window.confirm(msg)) return;
        try {
            if (currentStatus) {
                await adminService.khoaHoaSi(id);
            } else {
                await adminService.moKhoaHoaSi(id);
            }
            await loadAuthors();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    };

    const handleOpenCreate = () => {
        setForm(emptyForm);
        setFormError('');
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!form.tenDangNhap.trim()) {
            setFormError('Vui lòng nhập tên đăng nhập');
            return;
        }
        if (!form.matKhau || form.matKhau.length < 6) {
            setFormError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (!form.tenHoaSi.trim()) {
            setFormError('Vui lòng nhập tên tác giả');
            return;
        }

        setSubmitting(true);
        try {
            const result = await adminService.taoTaiKhoanHoaSi({
                tenDangNhap: form.tenDangNhap.trim(),
                matKhau: form.matKhau,
                tenHoaSi: form.tenHoaSi.trim(),
                email: form.email.trim() || undefined,
                dienThoai: form.dienThoai.trim() || undefined,
                diaChi: form.diaChi.trim() || undefined,
            });
            if (!result.success) {
                setFormError(result.message || 'Tạo tài khoản tác giả thất bại');
                return;
            }
            setIsModalOpen(false);
            setForm(emptyForm);
            await loadAuthors();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div id="authors" className="page">
            <div
                className="page-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <h4
                    style={{
                        color: '#2c7be5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: 0,
                    }}
                >
                    <i className="ti-id-badge"></i> Quản lý Tác giả
                </h4>
                <button className="add-btn" onClick={handleOpenCreate}>
                    <i className="ti-plus"></i> Thêm tác giả
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
            ) : authors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Chưa có tác giả nào.</div>
            ) : (
                <div className="table-container">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên tác giả</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Số tác phẩm</th>
                                <th>Doanh thu</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authors.map((author) => (
                                <tr key={author.id}>
                                    <td>{author.id}</td>
                                    <td><strong>{author.tenHoaSi}</strong></td>
                                    <td>{author.email || '-'}</td>
                                    <td>{author.soDienThoai || '-'}</td>
                                    <td>{author.soTacPham}</td>
                                    <td>{formatPrice(author.doanhThu)}</td>
                                    <td>
                                        <span
                                            className={`status ${author.trangThai ? 'success' : 'canceled'}`}
                                        >
                                            {author.trangThai ? 'Hoạt động' : 'Đang khóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => navigate(`/admin/authors/${author.id}/artworks`)}
                                            title="Xem tác phẩm"
                                            style={{ color: '#007bff', marginRight: '10px' }}
                                        >
                                            <i className="ti-image"></i>
                                        </button>
                                        <button
                                            onClick={() => handleLock(author.id, author.trangThai)}
                                            title={author.trangThai ? 'Khóa' : 'Mở khóa'}
                                            style={{ color: author.trangThai ? '#dc3545' : '#28a745' }}
                                        >
                                            <i
                                                className={author.trangThai ? 'ti-lock' : 'ti-unlock'}
                                            ></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <span className="close" onClick={() => setIsModalOpen(false)}>
                            &times;
                        </span>
                        <h3>Tạo tài khoản tác giả</h3>

                        <form onSubmit={handleCreate}>
                            {formError && (
                                <div
                                    style={{
                                        background: '#fee',
                                        color: '#c0392b',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        marginBottom: '12px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    Tên đăng nhập <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    name="tenDangNhap"
                                    value={form.tenDangNhap}
                                    onChange={handleChange}
                                    placeholder="VD: hoa.si.ann"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Mật khẩu <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    name="matKhau"
                                    value={form.matKhau}
                                    onChange={handleChange}
                                    placeholder="Tối thiểu 6 ký tự"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Tên tác giả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    name="tenHoaSi"
                                    value={form.tenHoaSi}
                                    onChange={handleChange}
                                    placeholder="Họ và tên hiển thị"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input
                                    name="dienThoai"
                                    value={form.dienThoai}
                                    onChange={handleChange}
                                    placeholder="0xxxxxxxxx"
                                />
                            </div>

                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input
                                    name="diaChi"
                                    value={form.diaChi}
                                    onChange={handleChange}
                                    placeholder="Tỉnh/Thành phố..."
                                />
                            </div>

                            <div
                                className="modal-buttons"
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'flex-end',
                                    marginTop: '12px',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cancel"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-save" disabled={submitting}>
                                    {submitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAuthors;
