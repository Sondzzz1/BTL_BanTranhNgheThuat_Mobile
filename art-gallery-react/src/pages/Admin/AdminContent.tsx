import React, { useEffect, useState } from 'react';
import BlogBlockEditor, { BlogContentPreview } from '../../components/BlogBlockEditor';
import { BlogImage } from '../../types/blogContent';
import { BaiVietPayload, BaiVietResponse, DanhMucBaiVietResponse, contentService } from '../../services/contentService';
import './Admin.css';
import './AdminContent.css';

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
  const [saving, setSaving] = useState(false);
  const [formNotice, setFormNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [articles, articleCategories] = await Promise.all([contentService.layTatCaBaiVietAdmin(), contentService.layDanhMucBaiVietAdmin()]);
      setItems(articles); setCategories(articleCategories);
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải dữ liệu Blog. Hãy kiểm tra backend và migration.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); setFormNotice(''); };
  const openCreate = () => { setEditing(null); setForm(empty); setFormNotice(''); setShowForm(true); };
  const openEdit = async (item: BaiVietResponse) => {
    try {
      const detail = await contentService.layBaiVietAdmin(item.maBaiViet);
      setEditing(detail); setForm({
        tieuDe: detail.tieuDe, tomTat: detail.tomTat || '', noiDung: detail.noiDung || '', anhTieuDe: detail.anhTieuDe || '',
        maDanhMucBaiViet: detail.maDanhMucBaiViet, ngayBatDauSuKien: detail.ngayBatDauSuKien || null,
        ngayKetThucSuKien: detail.ngayKetThucSuKien || null, diaDiemSuKien: detail.diaDiemSuKien || '',
        nguonNoiDung: detail.nguonNoiDung || '', maTacPhamLienQuan: detail.tacPhamLienQuan?.map(x => x.maTacPham) || [],
      }); setFormNotice(''); setShowForm(true);
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải bài viết'); }
  };
  const openPreview = async (item: BaiVietResponse) => {
    try { setPreview(await contentService.layBaiVietAdmin(item.maBaiViet)); }
    catch (error: any) { alert(error?.response?.data?.message || 'Không thể tải bài viết'); }
  };
  const save = async () => {
    if (!form.tieuDe.trim()) return alert('Vui lòng nhập tiêu đề');
    setSaving(true);
    try {
      const payload = { ...form, tieuDe: form.tieuDe.trim(), maDanhMucBaiViet: form.maDanhMucBaiViet || undefined };
      if (editing) {
        await contentService.capNhatBaiVietAdmin(editing.maBaiViet, payload);
        closeForm();
        await load();
      } else {
        const created = await contentService.taoBaiVietAdmin(payload);
        const detail = await contentService.layBaiVietAdmin(created.maBaiViet);
        setEditing(detail);
        setFormNotice('Đã lưu bản nháp. Bây giờ bạn có thể chọn nhiều ảnh và chèn ngay sau đoạn văn hoặc phần mong muốn.');
        await load();
      }
    } catch (error: any) { alert(error?.response?.data?.message || 'Không thể lưu bài viết'); }
    finally { setSaving(false); }
  };
  const setImages = (images: BlogImage[]) => setEditing(current => current ? { ...current, hinhAnhNoiDung: images } : current);
  const approve = async (id: number) => { try { await contentService.pheDuyetBaiViet(id); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể duyệt'); } };
  const reject = async (id: number) => { const reason = window.prompt('Lý do từ chối:')?.trim(); if (!reason) return; try { await contentService.tuChoiBaiViet(id, reason); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể từ chối'); } };
  const publish = async (id: number) => { try { await contentService.xuatBanBaiViet(id); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể xuất bản'); } };
  const createCategory = async () => { if (!categoryName.trim() || !categorySlug.trim()) return alert('Nhập tên và slug danh mục'); try { await contentService.taoDanhMucBaiViet({ tenDanhMuc: categoryName.trim(), slug: categorySlug.trim(), trangThai: true }); setCategoryName(''); setCategorySlug(''); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể tạo danh mục'); } };
  const toggleCategory = async (item: DanhMucBaiVietResponse) => { try { await contentService.capNhatDanhMucBaiViet(item.maDanhMucBaiViet, { tenDanhMuc: item.tenDanhMuc, slug: item.slug, trangThai: item.trangThai === false }); await load(); } catch (e: any) { alert(e?.response?.data?.message || 'Không thể cập nhật danh mục'); } };

  return <div className="page admin-content-page">
    <div className="content-page-header"><div><h1><i className="ti-write" /> Quản lý nội dung</h1><p>Tạo, sắp xếp và kiểm duyệt các bài viết Blog nghệ thuật.</p></div><div className="content-header-actions"><a className="content-button secondary" href="/admin/artwork-details">Kiểm duyệt tác phẩm</a><button type="button" className="content-button secondary" onClick={() => setShowCategories(true)}>Danh mục Blog</button><button type="button" className="content-button primary" onClick={openCreate}>+ Tạo bài viết</button></div></div>

    {showCategories && <div className="content-modal-overlay" onMouseDown={() => setShowCategories(false)}><div className="content-modal category-modal" onMouseDown={e => e.stopPropagation()}><div className="content-modal-header"><div><h2>Danh mục Blog</h2><p>Quản lý nhóm nội dung hiển thị trên trang tin.</p></div><button type="button" className="icon-close" aria-label="Đóng" onClick={() => setShowCategories(false)}>×</button></div><div className="category-create-row"><input aria-label="Tên danh mục" placeholder="Tên danh mục" value={categoryName} onChange={e => setCategoryName(e.target.value)} /><input aria-label="Slug danh mục" placeholder="slug-khong-dau" value={categorySlug} onChange={e => setCategorySlug(e.target.value)} /><button type="button" className="content-button primary" onClick={createCategory}>Thêm</button></div><div className="content-table-wrap"><table className="content-table"><thead><tr><th>Tên</th><th>Slug</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{categories.length === 0 ? <tr><td colSpan={4} className="empty-cell">Chưa có danh mục.</td></tr> : categories.map(x => <tr key={x.maDanhMucBaiViet}><td className="title-cell">{x.tenDanhMuc}</td><td><code>{x.slug}</code></td><td><span className={`content-status ${x.trangThai === false ? 'archived' : 'published'}`}>{x.trangThai === false ? 'Đã ẩn' : 'Đang dùng'}</span></td><td><button type="button" className="table-action neutral" onClick={() => toggleCategory(x)}>{x.trangThai === false ? 'Kích hoạt' : 'Ẩn'}</button></td></tr>)}</tbody></table></div></div></div>}

    {showForm && <div className="content-modal-overlay"><div className="content-modal article-modal"><div className="content-modal-header"><div><h2>{editing ? 'Chỉnh sửa bài viết' : 'Tạo bản nháp Blog'}</h2><p>{editing ? 'Bạn có thể tải nhiều ảnh và chèn vào bất kỳ vị trí nào trong nội dung.' : 'Nhập thông tin cơ bản rồi lưu bản nháp để bắt đầu chèn ảnh.'}</p></div><button type="button" className="icon-close" aria-label="Đóng" disabled={saving} onClick={closeForm}>×</button></div>
      {formNotice && <div className="content-success-notice">{formNotice}</div>}
      <div className="form-group"><label>Tiêu đề *</label><input value={form.tieuDe} onChange={e => setForm({ ...form, tieuDe: e.target.value })} /></div>
      <div className="form-group"><label>Tóm tắt</label><textarea maxLength={500} value={form.tomTat} onChange={e => setForm({ ...form, tomTat: e.target.value })} /></div>
      <div className="form-group"><label>Danh mục</label><select value={form.maDanhMucBaiViet || ''} onChange={e => setForm({ ...form, maDanhMucBaiViet: e.target.value ? Number(e.target.value) : undefined })}><option value="">Chưa phân loại</option>{categories.filter(x => x.trangThai !== false).map(x => <option key={x.maDanhMucBaiViet} value={x.maDanhMucBaiViet}>{x.tenDanhMuc}</option>)}</select></div>
      <div className="form-group"><label>Ảnh đại diện (URL hoặc đường dẫn ảnh đã tải)</label><input value={form.anhTieuDe} onChange={e => setForm({ ...form, anhTieuDe: e.target.value })} />{form.anhTieuDe && <img src={form.anhTieuDe} alt="Xem trước" style={{ width: 220, maxHeight: 140, objectFit: 'cover', marginTop: 8 }} />}</div>
      <div className="form-group"><label>Nội dung theo khối</label><BlogBlockEditor value={form.noiDung} articleId={editing?.maBaiViet} images={editing?.hinhAnhNoiDung || []} onChange={noiDung => setForm(current => ({ ...current, noiDung }))} onImagesChange={setImages} onUpload={editing ? (file, caption, order) => contentService.taiAnhNoiDungBaiViet(editing.maBaiViet, file, caption, order) : undefined} onDeleteImage={editing ? imageId => contentService.xoaAnhNoiDungBaiViet(editing.maBaiViet, imageId) : undefined} /></div>
      <div className="content-form-grid"><div className="form-group"><label>Bắt đầu sự kiện</label><input type="datetime-local" value={form.ngayBatDauSuKien?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ngayBatDauSuKien: e.target.value || null })} /></div><div className="form-group"><label>Kết thúc sự kiện</label><input type="datetime-local" value={form.ngayKetThucSuKien?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ngayKetThucSuKien: e.target.value || null })} /></div></div>
      <div className="form-group"><label>Địa điểm sự kiện</label><input value={form.diaDiemSuKien} onChange={e => setForm({ ...form, diaDiemSuKien: e.target.value })} /></div><div className="form-group"><label>Nguồn nội dung/quyền sử dụng</label><input value={form.nguonNoiDung} onChange={e => setForm({ ...form, nguonNoiDung: e.target.value })} /></div><div className="form-group"><label>Mã tác phẩm liên quan (cách nhau bằng dấu phẩy)</label><input value={form.maTacPhamLienQuan.join(', ')} onChange={e => setForm({ ...form, maTacPhamLienQuan: e.target.value.split(',').map(v => Number(v.trim())).filter(v => Number.isInteger(v) && v > 0) })} /></div>
      <div className="content-modal-footer"><button type="button" className="content-button secondary" disabled={saving} onClick={closeForm}>Hủy</button><button type="button" className="content-button primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Lưu bản nháp & thêm ảnh'}</button></div>
    </div></div>}

    {preview && <div className="content-modal-overlay" onMouseDown={() => setPreview(null)}><article className="content-modal preview-modal" onMouseDown={e => e.stopPropagation()}><div className="content-modal-header"><div><span className="preview-category">{preview.tenDanhMuc || 'Chưa phân loại'}</span><h2>{preview.tieuDe}</h2><p>{preview.tenTacGia || preview.tenHoaSi || 'Không rõ tác giả'} · {new Date(preview.ngayXuatBan || preview.ngayDang).toLocaleDateString('vi-VN')}</p></div><button type="button" className="icon-close" aria-label="Đóng" onClick={() => setPreview(null)}>×</button></div>{preview.anhTieuDe && <img className="preview-cover" src={preview.anhTieuDe} alt={preview.tieuDe} />}{preview.tomTat && <p className="preview-summary">{preview.tomTat}</p>}<BlogContentPreview value={preview.noiDung} images={preview.hinhAnhNoiDung} />{preview.ngayBatDauSuKien && <div className="preview-event"><strong>Sự kiện:</strong> {new Date(preview.ngayBatDauSuKien).toLocaleString('vi-VN')} {preview.diaDiemSuKien && ` tại ${preview.diaDiemSuKien}`}</div>}</article></div>}

    {loading ? <div className="content-loading">Đang tải nội dung...</div> : <div className="content-table-wrap"><table className="content-table"><thead><tr><th>Tiêu đề</th><th>Tác giả</th><th>Danh mục</th><th>Ngày</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} className="empty-cell">Chưa có bài viết. Hãy tạo bài viết đầu tiên.</td></tr> : items.map(x => <tr key={x.maBaiViet}><td className="title-cell">{x.tieuDe}</td><td>{x.tenTacGia || x.tenHoaSi || '—'}</td><td>{x.tenDanhMuc || 'Chưa phân loại'}</td><td>{new Date(x.ngayXuatBan || x.ngayDang).toLocaleDateString('vi-VN')}</td><td><span className={`content-status status-${x.trangThai}`}>{labels[x.trangThai] || 'Không rõ'}</span></td><td><div className="table-actions"><button type="button" className="table-action neutral" onClick={() => void openPreview(x)}>Xem</button>{!x.maHoaSi && <button type="button" className="table-action edit" onClick={() => void openEdit(x)}>Sửa</button>}{x.trangThai === 1 && <><button type="button" className="table-action approve" onClick={() => approve(x.maBaiViet)}>Duyệt</button><button type="button" className="table-action reject" onClick={() => reject(x.maBaiViet)}>Từ chối</button></>}{x.trangThai !== 2 && !x.maHoaSi && <button type="button" className="table-action publish" onClick={() => publish(x.maBaiViet)}>Xuất bản</button>}</div></td></tr>)}</tbody></table></div>}
  </div>;
}
