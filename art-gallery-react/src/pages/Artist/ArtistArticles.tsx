import React, { useEffect, useState } from 'react';
import BlogBlockEditor, { BlogContentPreview } from '../../components/BlogBlockEditor';
import { BlogImage } from '../../types/blogContent';
import { artistDashboardService, BaiVietResponse, TaoBaiVietRequest, DanhMucBaiVietResponse } from '../../services/artistDashboardService';
import './Artist.css';

const status = (value:number) => [
  {text:'Nháp',cls:'status-draft'},{text:'Chờ duyệt',cls:'status-pending'},
  {text:'Đã xuất bản',cls:'status-approved'},{text:'Từ chối',cls:'status-rejected'},
][value] || {text:'Không rõ',cls:''};

interface FormProps {
  initial: BaiVietResponse | null; categories: DanhMucBaiVietResponse[]; submitting:boolean;
  onSubmit:(value:TaoBaiVietRequest)=>void; onCancel:()=>void;
}

function ArticleForm({initial,categories,submitting,onSubmit,onCancel}:FormProps) {
  const [form,setForm]=useState<TaoBaiVietRequest>({
    tieuDe:initial?.tieuDe||'',noiDung:initial?.noiDung||'',anhTieuDe:initial?.anhTieuDe||'',tomTat:initial?.tomTat||'',
    maDanhMucBaiViet:initial?.maDanhMucBaiViet,ngayBatDauSuKien:initial?.ngayBatDauSuKien||null,
    ngayKetThucSuKien:initial?.ngayKetThucSuKien||null,diaDiemSuKien:initial?.diaDiemSuKien||'',
    nguonNoiDung:initial?.nguonNoiDung||'',maTacPhamLienQuan:initial?.tacPhamLienQuan?.map(x=>x.maTacPham)||[],
  });
  const [images,setImages]=useState<BlogImage[]>(initial?.hinhAnhNoiDung||[]);
  return <div style={overlay}><div style={modal}><h2>{initial?'Chỉnh sửa bài viết':'Viết bài mới'}</h2>
    <Field label="Tiêu đề *"><input value={form.tieuDe} maxLength={250} onChange={e=>setForm({...form,tieuDe:e.target.value})}/></Field>
    <Field label="Tóm tắt"><textarea value={form.tomTat} maxLength={500} rows={3} onChange={e=>setForm({...form,tomTat:e.target.value})}/></Field>
    <Field label="Danh mục"><select value={form.maDanhMucBaiViet||''} onChange={e=>setForm({...form,maDanhMucBaiViet:e.target.value?Number(e.target.value):undefined})}><option value="">Chưa phân loại</option>{categories.map(x=><option key={x.maDanhMucBaiViet} value={x.maDanhMucBaiViet}>{x.tenDanhMuc}</option>)}</select></Field>
    <Field label="URL ảnh tiêu đề"><input value={form.anhTieuDe} onChange={e=>setForm({...form,anhTieuDe:e.target.value})}/>{form.anhTieuDe&&<img src={form.anhTieuDe} alt="Xem trước" style={{width:220,maxHeight:140,objectFit:'cover',marginTop:8}}/>}</Field>
    <Field label="Nội dung theo khối"><BlogBlockEditor value={form.noiDung} articleId={initial?.maBaiViet} images={images} onChange={noiDung=>setForm(current=>({...current,noiDung}))} onImagesChange={setImages} onUpload={initial?(file,caption,order)=>artistDashboardService.taiAnhNoiDungBaiViet(initial.maBaiViet,file,caption,order):undefined} onDeleteImage={initial?imageId=>artistDashboardService.xoaAnhNoiDungBaiViet(initial.maBaiViet,imageId):undefined}/></Field>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Field label="Bắt đầu sự kiện"><input type="datetime-local" value={form.ngayBatDauSuKien?.slice(0,16)||''} onChange={e=>setForm({...form,ngayBatDauSuKien:e.target.value||null})}/></Field><Field label="Kết thúc sự kiện"><input type="datetime-local" value={form.ngayKetThucSuKien?.slice(0,16)||''} onChange={e=>setForm({...form,ngayKetThucSuKien:e.target.value||null})}/></Field></div>
    <Field label="Địa điểm sự kiện"><input value={form.diaDiemSuKien} onChange={e=>setForm({...form,diaDiemSuKien:e.target.value})}/></Field>
    <Field label="Nguồn nội dung/quyền sử dụng"><input value={form.nguonNoiDung} onChange={e=>setForm({...form,nguonNoiDung:e.target.value})}/></Field>
    <div style={{display:'flex',justifyContent:'flex-end',gap:10}}><button onClick={onCancel} disabled={submitting}>Hủy</button><button className="add-btn" disabled={submitting} onClick={()=>{if(!form.tieuDe.trim())return alert('Vui lòng nhập tiêu đề');onSubmit({...form,tieuDe:form.tieuDe.trim()});}}>{submitting?'Đang lưu...':initial?'Lưu thay đổi':'Lưu bản nháp'}</button></div>
  </div></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div style={{marginBottom:14}}><label style={{display:'block',fontWeight:600,marginBottom:6}}>{label}</label><div className="article-field">{children}</div></div>; }

export default function ArtistArticles(){
  const[articles,setArticles]=useState<BaiVietResponse[]>([]);const[categories,setCategories]=useState<DanhMucBaiVietResponse[]>([]);
  const[loading,setLoading]=useState(false);const[submitting,setSubmitting]=useState(false);const[showCreate,setShowCreate]=useState(false);
  const[editing,setEditing]=useState<BaiVietResponse|null>(null);const[preview,setPreview]=useState<BaiVietResponse|null>(null);
  const load=async()=>{setLoading(true);try{setArticles(await artistDashboardService.getBaiVietCuaToi());}catch(error:any){alert(error?.response?.data?.message||'Không thể tải bài viết');}finally{setLoading(false);}};
  useEffect(()=>{void load();artistDashboardService.getDanhMucBaiViet().then(setCategories).catch(console.error);},[]);
  const openDetail=async(item:BaiVietResponse,mode:'edit'|'preview')=>{try{const detail=await artistDashboardService.getBaiVietById(item.maBaiViet);mode==='edit'?setEditing(detail):setPreview(detail);}catch(error:any){alert(error?.response?.data?.message||'Không thể tải chi tiết bài viết');}};
  const save=async(data:TaoBaiVietRequest)=>{setSubmitting(true);try{if(editing){await artistDashboardService.capNhatBaiViet(editing.maBaiViet,data);alert(editing.trangThai===2?'Đã lưu; bài được chuyển về chờ Admin duyệt lại.':'Đã cập nhật bài viết.');}else{await artistDashboardService.taoBaiViet(data);alert('Đã lưu bản nháp. Mở Sửa để tải và chèn ảnh.');}setEditing(null);setShowCreate(false);await load();}catch(error:any){alert(error?.response?.data?.message||'Không thể lưu bài viết');}finally{setSubmitting(false);}};
  const remove=async(item:BaiVietResponse)=>{if(!window.confirm(`Xóa bài viết "${item.tieuDe}"?`))return;try{await artistDashboardService.xoaBaiViet(item.maBaiViet);await load();}catch(error:any){alert(error?.response?.data?.message||'Không thể xóa');}};
  const submitReview=async(item:BaiVietResponse)=>{if(!window.confirm(`Gửi bài "${item.tieuDe}" để Admin duyệt?`))return;try{await artistDashboardService.guiDuyetBaiViet(item.maBaiViet);await load();}catch(error:any){alert(error?.response?.data?.message||'Không thể gửi duyệt');}};
  return <div id="artist-articles" className="page">
    {(showCreate||editing)&&<ArticleForm initial={editing} categories={categories} submitting={submitting} onSubmit={save} onCancel={()=>{setShowCreate(false);setEditing(null);}}/>}
    {preview&&<div style={overlay}><div style={{...modal,width:'min(760px,94vw)'}}><div style={{display:'flex',justifyContent:'space-between'}}><h2>{preview.tieuDe}</h2><button onClick={()=>setPreview(null)}>✕</button></div><p style={{color:'#888'}}>{preview.tenDanhMuc} · {new Date(preview.ngayXuatBan||preview.ngayDang).toLocaleDateString('vi-VN')}</p>{preview.anhTieuDe&&<img src={preview.anhTieuDe} alt={preview.tieuDe} style={{width:'100%',maxHeight:300,objectFit:'cover'}}/>}<h4>{preview.tomTat}</h4><BlogContentPreview value={preview.noiDung} images={preview.hinhAnhNoiDung}/>{preview.lyDo&&<div style={{background:'#fce4ec',padding:12,marginTop:16}}>Lý do từ chối: {preview.lyDo}</div>}</div></div>}
    <div className="page-header"><h4><i className="ti-write"/> Bài viết của tôi</h4><div style={{display:'flex',gap:10}}><button className="btn-refresh" onClick={()=>void load()}>Làm mới</button><button className="add-btn" onClick={()=>setShowCreate(true)}>+ Viết bài mới</button></div></div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>{[0,1,2,3].map(value=><div key={value} style={{background:'#f8fafc',border:'1px solid #ddd',borderRadius:10,padding:'8px 16px'}}>{status(value).text}: <strong>{articles.filter(x=>x.trangThai===value).length}</strong></div>)}</div>
    {loading?<div>Đang tải...</div>:articles.length===0?<div style={{padding:50,textAlign:'center',color:'#999'}}>Bạn chưa có bài viết nào.</div>:<div className="table-container"><table className="styled-table"><thead><tr><th>Tiêu đề</th><th>Ngày</th><th>Trạng thái</th><th>Ghi chú</th><th>Hành động</th></tr></thead><tbody>{articles.map(item=>{const st=status(item.trangThai);const canEdit=[0,2,3].includes(item.trangThai);return <tr key={item.maBaiViet}><td><button className="link-button" onClick={()=>void openDetail(item,'preview')}>{item.tieuDe}</button></td><td>{new Date(item.ngayDang).toLocaleDateString('vi-VN')}</td><td><span className={`status ${st.cls}`}>{st.text}</span></td><td>{item.lyDo||'—'}</td><td><button onClick={()=>void openDetail(item,'preview')}>Xem</button>{canEdit&&<button className="btn-edit" onClick={()=>void openDetail(item,'edit')}>Sửa</button>}{[0,3].includes(item.trangThai)&&<button onClick={()=>void submitReview(item)}>Gửi duyệt</button>}<button className="btn-delete" onClick={()=>void remove(item)}>Xóa</button></td></tr>;})}</tbody></table></div>}
  </div>;
}

const overlay:React.CSSProperties={position:'fixed',inset:0,background:'rgba(0,0,0,.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999};
const modal:React.CSSProperties={background:'#fff',borderRadius:14,padding:26,width:'min(920px,96vw)',maxHeight:'92vh',overflow:'auto'};
