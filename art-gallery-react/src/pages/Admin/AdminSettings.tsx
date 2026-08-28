import React, { useEffect, useState } from 'react';
import { adminService, DanhMucResponse, TaoDanhMucRequest, CapNhatDanhMucRequest } from '../../services/adminService';
import './Admin.css';

interface FormData {
    tenDanhMuc: string;
    moTa: string;
}

const emptyForm: FormData = { tenDanhMuc: '', moTa: '' };

const AdminSettings: React.FC = () => {
    const [danhMuc, setDanhMuc] = useState<DanhMucResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<DanhMucResponse | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDanhMuc();
    }, []);

    const loadDanhMuc = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllDanhMuc();
            setDanhMuc(data);
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (dm: DanhMucResponse) => {
        setEditing(dm);
        setForm({ tenDanhMuc: dm.tenDanhMuc, moTa: dm.moTa || '' });
        setFormError('');
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!form.tenDanhMuc.trim()) {
            setFormError('Tên danh mục không được để trống');
            return;
        }

        setSubmitting(true);
        try {
            if (editing) {
                const payload: CapNhatDanhMucRequest = {
                    tenDanhMuc: form.tenDanhMuc.trim(),
                    moTa: form.moTa.trim() || undefined,
                };
                await adminService.updateCategory(editing.maDanhMuc, payload);
            } else {
                const payload: TaoDanhMucRequest = {
                    tenDanhMuc: form.tenDanhMuc.trim(),
                    moTa: form.moTa.trim() || undefined,
                };
                await adminService.createCategory(payload);
            }
            setShowModal(false);
            await loadDanhMuc();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (dm: DanhMucResponse) => {
        if (!window.confirm(`Xoá danh mục "${dm.tenDanhMuc}"?`)) return;
        try {
            await adminService.deleteCategory(dm.maDanhMuc);
            await loadDanhMuc();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Không thể xoá danh mục');
        }
    };

    return (
        <div id="settings" className="page">
            <div className="page-header">
                <h4><i className="ti-settings"></i> Cài đặt &amp; Danh mục</h4>
                <button className="add-btn" onClick={openCreate}>
                    <i className="ti-plus"></i> Thêm danh mục
                </button>
            </div>

            <div className="block">
                <h4><i className="ti-folder"></i> Danh mục tác phẩm</h4>

                {loading ? (
                    <div style={{ padding: 30, textAlign: 'center' }}>Đang tải...</div>
                ) : danhMuc.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center' }}>Chưa có danh mục nào.</div>
                ) : (
                    <div className="table-container">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Tên danh mục</th>
                                    <th>Mô tả</th>
                                    <th>Số tác phẩm</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danhMuc.map((dm) => (
                                    <tr key={dm.maDanhMuc}>
                                        <td>{dm.maDanhMuc}</td>
                                        <td><strong>{dm.tenDanhMuc}</strong></td>
                                        <td>{dm.moTa || '-'}</td>
                                        <td>{dm.soTacPham ?? 0}</td>
                                        <td>
                                            <button onClick={() => openEdit(dm)} title="Sửa" style={{ marginRight: 6 }}>
                                                <i className="ti-pencil"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dm)}
                                                title="Xoá"
                                                style={{ color: '#dc3545' }}
                                            >
                                                <i className="ti-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="block" style={{ marginTop: 20 }}>
                <h4><i className="ti-info-alt"></i> Thông tin hệ thống</h4>
                <div style={{ padding: 8 }}>
                    <p><strong>Tên cửa hàng:</strong> Art Gallery</p>
                    <p><strong>Đơn vị tiền tệ:</strong> VNĐ (Việt Nam Đồng)</p>
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        Cấu hình hệ thống nâng cao chưa được mở. Liên hệ quản trị server để thay đổi.
                    </p>
                </div>
            </div>

            {showModal && (
                <div className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        <h3>{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>

                        <form onSubmit={handleSubmit}>
                            {formError && (
                                <div style={{
                                    background: '#fee', color: '#c0392b', padding: 10,
                                    borderRadius: 6, marginBottom: 12, fontSize: 14
                                }}>
                                    {formError}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Tên danh mục <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    name="tenDanhMuc"
                                    value={form.tenDanhMuc}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Tranh sơn dầu"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    name="moTa"
                                    value={form.moTa}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Mô tả ngắn về danh mục..."
                                />
                            </div>

                            <div className="modal-buttons" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="cancel" onClick={() => setShowModal(false)} disabled={submitting}>
                                    Huỷ
                                </button>
                                <button type="submit" className="btn-save" disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Thêm danh mục')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
