import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlogBlock, BlogImage, parseBlogContent, serializeBlogContent } from '../types/blogContent';
import './BlogBlockEditor.css';

interface Props {
  value?: string;
  articleId?: number;
  images: BlogImage[];
  onChange: (value: string) => void;
  onImagesChange: (images: BlogImage[]) => void;
  onUpload?: (file: File, caption: string, order: number) => Promise<BlogImage>;
  onDeleteImage?: (imageId: number) => Promise<void>;
}

const resolveImage = (value: string) => {
  if (/^(https?:|data:)/i.test(value)) return value;
  const api = process.env.REACT_APP_API_URL || 'http://localhost:5273/api';
  return `${api.replace(/\/api\/?$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const BlogContentPreview: React.FC<{ value?: string; images?: BlogImage[] }> = ({ value, images = [] }) => {
  const parsed = useMemo(() => parseBlogContent(value), [value]);
  if (!value?.trim()) return <em className="blog-empty">Chưa có nội dung</em>;
  if (!parsed.isBlockContent) return <div className="blog-legacy">{parsed.blocks[0] && 'text' in parsed.blocks[0] ? parsed.blocks[0].text : ''}</div>;
  return <div className="blog-preview">{parsed.blocks.map((block, index) => {
    if (block.type === 'heading') return React.createElement(`h${block.level}`, { key: index }, block.text);
    if (block.type === 'paragraph') return <p key={index}>{block.text}</p>;
    if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>;
    if (block.type === 'list') {
      const List = block.ordered ? 'ol' : 'ul';
      return <List key={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</List>;
    }
    const image = images.find(x => x.maHinhAnh === block.imageId);
    return <figure key={index}>{image ? <img src={resolveImage(image.duongDan)} alt={block.caption || image.chuThich || 'Ảnh bài viết'} /> : <div className="blog-image-missing">Không tìm thấy ảnh #{block.imageId}</div>}<figcaption>{block.caption || image?.chuThich}</figcaption></figure>;
  })}</div>;
};

const BlogBlockEditor: React.FC<Props> = ({ value, articleId, images, onChange, onImagesChange, onUpload, onDeleteImage }) => {
  const parsed = useMemo(() => parseBlogContent(value), [value]);
  const [blocks, setBlocks] = useState<BlogBlock[]>(parsed.blocks);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const currentValue = useRef(value);
  useEffect(() => {
    if (currentValue.current !== value) { currentValue.current = value; setBlocks(parseBlogContent(value).blocks); }
  }, [value]);

  const commit = (next: BlogBlock[]) => {
    setBlocks(next);
    const serialized = serializeBlogContent(next);
    currentValue.current = serialized;
    onChange(serialized);
  };
  const add = (block: BlogBlock) => commit([...blocks, block]);
  const update = (index: number, block: BlogBlock) => commit(blocks.map((x, i) => i === index ? block : x));
  const remove = (index: number) => commit(blocks.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta; if (target < 0 || target >= blocks.length) return;
    const next = [...blocks]; [next[index], next[target]] = [next[target], next[index]]; commit(next);
  };
  const upload = async (files: FileList | null, insertAt = blocks.length) => {
    if (!files?.length || !articleId || !onUpload) return;
    const selected = Array.from(files);
    const invalid = selected.find(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) return alert(`Ảnh "${invalid.name}" không hợp lệ. Chỉ nhận JPG, PNG, WEBP và tối đa 5 MB/ảnh.`);
    if (images.length + selected.length > 20) return alert('Mỗi bài viết chỉ được tối đa 20 ảnh');
    setUploading(true);
    const uploaded: BlogImage[] = [];
    let uploadError = '';
    try {
      for (let i = 0; i < selected.length; i++) {
        setUploadStatus(`Đang tải ${i + 1}/${selected.length}: ${selected[i].name}`);
        uploaded.push(await onUpload(selected[i], '', insertAt + i));
      }
    } catch (error: any) {
      uploadError = error?.response?.data?.message || 'Tải ảnh thất bại';
    } finally {
      if (uploaded.length) {
        const imageBlocks = uploaded.map<BlogBlock>(x => ({ type: 'image', imageId: x.maHinhAnh, caption: x.chuThich || '' }));
        const next = [...blocks];
        next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, ...imageBlocks);
        onImagesChange([...images, ...uploaded]);
        commit(next);
      }
      if (uploadError) {
        setUploadStatus(uploaded.length ? `Đã chèn ${uploaded.length} ảnh. Ảnh còn lại bị lỗi: ${uploadError}. Hãy lưu thay đổi để hoàn tất.` : uploadError);
      } else {
        setUploadStatus(`Đã tải và chèn ${uploaded.length} ảnh đúng vị trí đã chọn. Hãy lưu thay đổi để hoàn tất.`);
      }
      setUploading(false);
    }
  };
  const deleteUnused = async (image: BlogImage) => {
    if (blocks.some(x => x.type === 'image' && x.imageId === image.maHinhAnh)) return alert('Hãy xóa khối ảnh khỏi nội dung trước');
    if (!onDeleteImage || !window.confirm('Xóa ảnh chưa sử dụng này?')) return;
    try {
      await onDeleteImage(image.maHinhAnh); onImagesChange(images.filter(x => x.maHinhAnh !== image.maHinhAnh));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Không thể xóa ảnh. Nếu vừa xóa khối ảnh, hãy lưu bài rồi thử lại.');
    }
  };

  return <section className="blog-editor">
    {!parsed.isBlockContent && <div className="blog-editor-notice">Bài cũ đang ở định dạng văn bản/HTML. Dữ liệu gốc chỉ chuyển thành JSON blocks khi bạn thực sự chỉnh sửa nội dung.</div>}
    <div className="blog-toolbar">
      <button type="button" onClick={() => add({ type: 'heading', level: 2, text: 'Tiêu đề phụ' })}>+ Tiêu đề</button>
      <button type="button" onClick={() => add({ type: 'paragraph', text: 'Đoạn văn mới' })}>+ Đoạn văn</button>
      <button type="button" onClick={() => add({ type: 'quote', text: 'Nội dung trích dẫn' })}>+ Trích dẫn</button>
      <button type="button" onClick={() => add({ type: 'list', ordered: false, items: ['Mục danh sách'] })}>+ Danh sách</button>
      <label className={articleId ? '' : 'disabled'}>+ Ảnh cuối bài<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!articleId || uploading} onChange={e => { void upload(e.target.files, blocks.length); e.currentTarget.value = ''; }} /></label>
      <button type="button" onClick={() => setPreview(x => !x)}>{preview ? 'Tiếp tục sửa' : 'Xem trước'}</button>
    </div>
    {!articleId && <small className="blog-editor-hint">Lưu bản nháp để bật tính năng tải nhiều ảnh và chèn ảnh vào đúng vị trí.</small>}
    {uploadStatus && <div className="blog-upload-status">{uploadStatus}</div>}
    {preview ? <BlogContentPreview value={serializeBlogContent(blocks)} images={images} /> : <div className="blog-block-list">
      {blocks.length === 0 && <div className="blog-empty-blocks">Chưa có khối nội dung. Chọn một nút phía trên để bắt đầu.</div>}
      {articleId && blocks.length > 0 && <label className={`blog-insert-images ${uploading ? 'disabled' : ''}`}>+ Chèn nhiều ảnh ở đầu bài<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { void upload(e.target.files, 0); e.currentTarget.value = ''; }} /></label>}
      {blocks.map((block, index) => <React.Fragment key={`${block.type}-${index}`}><div className="blog-block">
        <div className="blog-block-actions"><span>{index + 1}. {block.type}</span><button type="button" onClick={() => move(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === blocks.length - 1}>↓</button><button type="button" className="danger" onClick={() => remove(index)}>Xóa</button></div>
        {block.type === 'heading' && <><select value={block.level} onChange={e => update(index, { ...block, level: Number(e.target.value) as 2 | 3 | 4 })}><option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option></select><input maxLength={300} value={block.text} onChange={e => update(index, { ...block, text: e.target.value })} /></>}
        {(block.type === 'paragraph' || block.type === 'quote') && <textarea rows={block.type === 'paragraph' ? 5 : 3} maxLength={block.type === 'paragraph' ? 5000 : 2000} value={block.text} onChange={e => update(index, { ...block, text: e.target.value })} />}
        {block.type === 'list' && <><label><input type="checkbox" checked={block.ordered} onChange={e => update(index, { ...block, ordered: e.target.checked })} /> Danh sách đánh số</label><textarea rows={4} value={block.items.join('\n')} onChange={e => update(index, { ...block, items: e.target.value.split('\n').slice(0, 50) })} placeholder="Mỗi dòng là một mục" /></>}
        {block.type === 'image' && (() => { const image = images.find(x => x.maHinhAnh === block.imageId); return <><div className="blog-image-row">{image ? <img src={resolveImage(image.duongDan)} alt={block.caption || 'Ảnh bài viết'} /> : <div className="blog-image-missing">Ảnh #{block.imageId} không còn tồn tại</div>}</div><input maxLength={300} placeholder="Chú thích ảnh" value={block.caption || ''} onChange={e => update(index, { ...block, caption: e.target.value })} /></>; })()}
      </div>{articleId && <label className={`blog-insert-images ${uploading ? 'disabled' : ''}`}>+ Chèn nhiều ảnh sau {block.type === 'paragraph' ? 'đoạn văn' : block.type === 'heading' ? 'tiêu đề' : block.type === 'quote' ? 'trích dẫn' : block.type === 'list' ? 'danh sách' : 'ảnh'} này<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => { void upload(e.target.files, index + 1); e.currentTarget.value = ''; }} /></label>}</React.Fragment>)}
    </div>}
    {images.some(img => !blocks.some(x => x.type === 'image' && x.imageId === img.maHinhAnh)) && <div className="blog-unused"><strong>Ảnh đã tải nhưng chưa dùng</strong><div>{images.filter(img => !blocks.some(x => x.type === 'image' && x.imageId === img.maHinhAnh)).map(img => <figure key={img.maHinhAnh}><img src={resolveImage(img.duongDan)} alt={img.chuThich || 'Ảnh chưa dùng'} /><button type="button" onClick={() => void deleteUnused(img)}>Xóa ảnh</button></figure>)}</div></div>}
  </section>;
};

export default BlogBlockEditor;
