import React, { useEffect, useState } from 'react';
import { BaiVietPayload, BaiVietResponse, DanhMucBaiVietResponse, contentService } from '../../services/contentService';
import './Admin.css';

const empty: BaiVietPayload = { tieuDe: '', tomTat: '', noiDung: '', anhTieuDe: '', diaDiemSuKien: '', nguonNoiDung: '', maTacPhamLienQuan: [] };
const labels = ['Nháp', 'Chờ duyệt', 'Đã xuất bản', 'Từ chối', 'Đã lưu trữ'];

export default function AdminContent() {
  const [items, setItems] = useState<BaiVietResponse[]>([]);
  const [categories, setCategories] = useState<DanhMucBaiVietResponse[]>([]);
  const [form, setForm] = useState<BaiVietPayload>(empty);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BaiVietResponse | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [preview, setPreview] = useState<BaiVietResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [articles, articleCategories] = await Promise.all([
        contentService.layTatCaBaiVietAdmin(), contentService.layDanhMucBaiVietAdmin(),
      ]);
      setItems(articles);
      setCategories(articleCategories);
    } catch (error: any) {
      console.error('Không thể tải module Blog:', error);
      alert(error?.response?.data?.message || 'Không thể tải dữ liệu Blog. Hãy kiểm tra backend và migration.');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); };
  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = async (item: BaiVietResponse) => {
    try {
      const detail = await contentService.layBaiVietAdmin(item.maBaiViet);
      setEditing(detail);
      setForm({
        tieuDe: detail.tieuDe, tomTat: detail.tomTat || '', noiDung: detail.noiDung || '',
        anhTieuDe: detail.anhTieuDe || '', maDanhMucBaiViet: detail.maDanhMucBaiViet,
        ngayBatDauSuKien: detail.ngayBatDauSuKien || null,
        ngayKetThucSuKien: detail.ngayKetThucSuKien || null,
        diaDiemSuKien: detail.diaDiemSuKien || '', nguonNoiDung: detail.nguonNoiDung || '',
        maTacPhamLienQuan: detail.tacPhamLienQuan?.map(x => x.maTacPham) || [],
      });
      setShowForm(true);
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải bài viết'); }
  };

  const save = async () => {
    if (!form.tieuDe.trim()) return alert('Vui lòng nhập tiêu đề');
    try {
      const payload = { ...form, tieuDe: form.tieuDe.trim(), maDanhMucBaiViet: form.maDanhMucBaiViet || undefined };
      if (editing) await contentService.capNhatBaiVietAdmin(editing.maBaiViet, payload);
      else await contentService.taoBaiVietAdmin(payload);
      closeForm();
      await load();
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể lưu bài viết'); }
  };

  const uploadBodyImage = async (file?: File) => {
    if (!editing || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
      return alert('Ảnh phải là JPG/PNG/WEBP và không vượt quá 5 MB');
    setUploading(true);
    try {
      await contentService.taiAnhNoiDungBaiViet(editing.maBaiViet, file);
      await openEdit(editing);
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải ảnh'); }
    finally { setUploading(false); }
  };

  const approve = async (id: number) => { try { await contentService.pheDuyetBaiViet(id); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể duyệt'); } };
  const reject = async (id: number) => { const reason = window.prompt('Lý do từ chối:')?.trim(); if (!reason) return; try { await contentService.tuChoiBaiViet(id, reason); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể từ chối'); } };
  const publish = async (id: number) => { try { await contentService.xuatBanBaiViet(id); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể xuất bản'); } };
  const createCategory = async () => { if (!categoryName.trim() || !categorySlug.trim()) return alert('Nhập tên và slug danh mục'); try { await contentService.taoDanhMucBaiViet({ tenDanhMuc: categoryName.trim(), slug: categorySlug.trim(), trangThai: true }); setCategoryName(''); setCategorySlug(''); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể tạo danh mục'); } };
  const toggleCategory = async (item: DanhMucBaiVietResponse) => { try { await contentService.capNhatDanhMucBaiViet(item.maDanhMucBaiViet, { tenDanhMuc: item.tenDanhMuc, slug: item.slug, trangThai: item.trangThai === false }); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể cập nhật danh mục'); } };

  return <div className="page">
    <div className="page-header"><h4><i className="ti-write" /> Quản lý Blog nghệ thuật</h4><div style={{ display: 'flex', gap: 8 }}><a className="btn-refresh" href="/admin/artwork-details">Kiểm duyệt nội dung tác phẩm</a><button className="btn-refresh" onClick={() => setShowCategories(true)}>Danh mục Blog</button><button className="add-btn" onClick={openCreate}>+ Tạo bài viết</button></div></div>

    {showCategories && <div className="modal-overlay" style={overlay}><div style={modal}><h3>Quản lý danh mục Blog</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 18 }}><input placeholder="Tên danh mục" value={categoryName} onChange={e => setCategoryName(e.target.value)} /><input placeholder="slug-khong-dau" value={categorySlug} onChange={e => setCategorySlug(e.target.value)} /><button className="btn-approve" onClick={createCategory}>Thêm</button></div><table className="styled-table"><thead><tr><th>Tên</th><th>Slug</th><th>Trạng thái</th><th /></tr></thead><tbody>{categories.map(x => <tr key={x.maDanhMucBaiViet}><td>{x.tenDanhMuc}</td><td>{x.slug}</td><td>{x.trangThai === false ? 'Đã ẩn' : 'Đang dùng'}</td><td><button onClick={() => toggleCategory(x)}>{x.trangThai === false ? 'Kích hoạt' : 'Ẩn'}</button></td></tr>)}</tbody></table><div style={{ textAlign: 'right', marginTop: 16 }}><button onClick={() => setShowCategories(false)}>Đóng</button></div></div></div>}

    {showForm && <div className="modal-overlay" style={overlay}><div style={{ ...modal, width: 'min(760px,94vw)' }}><h3>{editing ? 'Chỉnh sửa bài viết Admin' : 'Tạo bản nháp Blog'}</h3><div className="form-group"><label>Tiêu đề *</label><input value={form.tieuDe} onChange={e => setForm({ ...form, tieuDe: e.target.value })} /></div><div className="form-group"><label>Tóm tắt</label><textarea maxLength={500} value={form.tomTat} onChange={e => setForm({ ...form, tomTat: e.target.value })} /></div><div className="form-group"><label>Danh mục</label><select value={form.maDanhMucBaiViet || ''} onChange={e => setForm({ ...form, maDanhMucBaiViet: e.target.value ? Number(e.target.value) : undefined })}><option value="">Chưa phân loại</option>{categories.filter(x => x.trangThai !== false).map(x => <option key={x.maDanhMucBaiViet} value={x.maDanhMucBaiViet}>{x.tenDanhMuc}</option>)}</select></div><div className="form-group"><label>Ảnh đại diện (URL hoặc đường dẫn ảnh đã tải)</label><input value={form.anhTieuDe} onChange={e => setForm({ ...form, anhTieuDe: e.target.value })} />{form.anhTieuDe && <img src={form.anhTieuDe} alt="Xem trước" style={{ width: 220, maxHeight: 140, objectFit: 'cover', marginTop: 8 }} />}</div><div className="form-group"><label>Nội dung</label><textarea rows={10} value={form.noiDung} onChange={e => setForm({ ...form, noiDung: e.target.value })} /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div className="form-group"><label>Bắt đầu sự kiện</label><input type="datetime-local" value={form.ngayBatDauSuKien?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ngayBatDauSuKien: e.target.value || null })} /></div><div className="form-group"><label>Kết thúc sự kiện</label><input type="datetime-local" value={form.ngayKetThucSuKien?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ngayKetThucSuKien: e.target.value || null })} /></div></div><div className="form-group"><label>Địa điểm sự kiện</label><input value={form.diaDiemSuKien} onChange={e => setForm({ ...form, diaDiemSuKien: e.target.value })} /></div><div className="form-group"><label>Nguồn nội dung/quyền sử dụng</label><input value={form.nguonNoiDung} onChange={e => setForm({ ...form, nguonNoiDung: e.target.value })} /></div><div className="form-group"><label>Mã tác phẩm liên quan (cách nhau bằng dấu phẩy)</label><input value={form.maTacPhamLienQuan.join(', ')} onChange={e => setForm({ ...form, maTacPhamLienQuan: e.target.value.split(',').map(v => Number(v.trim())).filter(v => Number.isInteger(v) && v > 0) })} /></div>{editing && <div className="form-group"><label>Ảnh trong bài (JPG/PNG/WEBP, tối đa 5 MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { void uploadBodyImage(e.target.files?.[0]); e.currentTarget.value = ''; }} /><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{editing.hinhAnhNoiDung?.map(x => <img key={x.maHinhAnh} src={x.duongDan} alt={x.chuThich || 'Ảnh nội dung'} style={{ width: 110, height: 80, objectFit: 'cover' }} />)}</div></div>}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button onClick={closeForm}>Hủy</button><button className="btn-approve" onClick={save}>{editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}</button></div></div></div>}

    {preview && <div className="modal-overlay" onClick={() => setPreview(null)} style={overlay}><div onClick={e => e.stopPropagation()} style={modal}><h2>{preview.tieuDe}</h2><p>{preview.tenDanhMuc} · {preview.tenTacGia || preview.tenHoaSi}</p>{preview.anhTieuDe && <img src={preview.anhTieuDe} alt={preview.tieuDe} style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />}<h4>{preview.tomTat}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{preview.noiDung}</p>{preview.ngayBatDauSuKien && <div><strong>Sự kiện:</strong> {new Date(preview.ngayBatDauSuKien).toLocaleString('vi-VN')} {preview.diaDiemSuKien && ` tại ${preview.diaDiemSuKien}`}</div>}<button onClick={() => setPreview(null)}>Đóng</button></div></div>}

    {loading ? <div>Đang tải...</div> : <div className="table-container"><table className="styled-table"><thead><tr><th>Tiêu đề</th><th>Tác giả</th><th>Danh mục</th><th>Ngày</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{items.map(x => <tr key={x.maBaiViet}><td><strong>{x.tieuDe}</strong></td><td>{x.tenTacGia || x.tenHoaSi}</td><td>{x.tenDanhMuc || 'Chưa phân loại'}</td><td>{new Date(x.ngayXuatBan || x.ngayDang).toLocaleDateString('vi-VN')}</td><td>{labels[x.trangThai] || 'Không rõ'}</td><td><button onClick={() => setPreview(x)}>Xem</button>{!x.maHoaSi && <button className="btn-edit" onClick={() => void openEdit(x)}>Sửa</button>}{x.trangThai === 1 && <><button className="btn-approve" onClick={() => approve(x.maBaiViet)}>Duyệt</button><button className="btn-delete" onClick={() => reject(x.maBaiViet)}>Từ chối</button></>}{x.trangThai !== 2 && !x.maHoaSi && <button className="btn-approve" onClick={() => publish(x.maBaiViet)}>Xuất bản</button>}</td></tr>)}</tbody></table></div>}
  </div>;
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modal: React.CSSProperties = { background: '#fff', padding: 26, borderRadius: 12, width: 'min(680px,94vw)', maxHeight: '90vh', overflow: 'auto' };
