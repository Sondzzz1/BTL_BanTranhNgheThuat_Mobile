import React, { useEffect, useState } from 'react';
import {
  CustomArtRequestApi,
  getAuthenticatedCustomArtFileUrl,
  getCustomArtTypeLabel,
} from '../services/customArtService';
import { formatVnd } from '../utils/currency';
import './CustomArtRequirements.css';

const notProvided = 'Chưa cung cấp';
const text = (value?: string | null) => value?.trim() || notProvided;

const permissionLabels: Record<string, string> = {
  AUTHOR_OR_RIGHTS_OWNER: 'Tôi là tác giả/chủ sở hữu quyền',
  AuthorOrRightsOwner: 'Tôi là tác giả/chủ sở hữu quyền',
  PERMISSION_GRANTED: 'Tôi đã được cho phép',
  PermissionGranted: 'Tôi đã được cho phép',
  PERMITTED_SCOPE: 'Tác phẩm thuộc phạm vi có thể sử dụng',
  PermittedScope: 'Tác phẩm thuộc phạm vi có thể sử dụng',
  UNSURE: 'Tôi không chắc về quyền sử dụng',
  Unsure: 'Tôi không chắc về quyền sử dụng',
};

// This is the customer's requested calendar date, not an instant to shift by timezone.
const requestedDate = (value?: string | null) => {
  if (!value?.trim()) return notProvided;
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value.trim());
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : value;
};

type FilePreview = { url?: string };
type FileKind = 'reference' | 'source' | 'evidence';

const Requirement = ({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) => (
  <div className={`custom-art-requirement${wide ? ' custom-art-requirement-wide' : ''}`}>
    <dt>{label}</dt><dd>{value}</dd>
  </div>
);

const CustomArtRequirements = ({ request }: { request: CustomArtRequestApi }) => {
  const [previews, setPreviews] = useState<Partial<Record<FileKind, FilePreview>>>({});
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    let active = true;
    const objectUrls = new Set<string>();
    const paths: [FileKind, string | null | undefined][] = [
      ['reference', request.anhThamKhao],
      ['source', request.referenceImageUrl],
      ['evidence', request.bangChungQuyenSuDung],
    ];
    setPreviews({});
    setLoadingFiles(true);
    // A missing/expired attachment must not hide the customer's written requirements.
    Promise.all(paths.filter(([, path]) => Boolean(path)).map(async ([kind, path]) => {
      try {
        const url = await getAuthenticatedCustomArtFileUrl(path);
        if (url?.startsWith('blob:')) {
          if (active) objectUrls.add(url);
          else URL.revokeObjectURL(url);
        }
        return [kind, { url }] as const;
      } catch {
        return [kind, {}] as const;
      }
    })).then((results) => {
      if (active) {
        setPreviews(Object.fromEntries(results));
        setLoadingFiles(false);
      }
    });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [request.anhThamKhao, request.referenceImageUrl, request.bangChungQuyenSuDung]);

  const attachments: { kind: FileKind; label: string; path?: string | null }[] = [
    { kind: 'reference', label: 'Ảnh tham khảo', path: request.anhThamKhao },
    { kind: 'source', label: 'Ảnh tác phẩm gốc', path: request.referenceImageUrl },
    { kind: 'evidence', label: 'Bằng chứng quyền sử dụng', path: request.bangChungQuyenSuDung },
  ];

  return (
    <section className="custom-art-requirements" aria-label="Yêu cầu của khách hàng">
      <h3>Yêu cầu của khách hàng</h3>
      <dl className="custom-art-requirements-grid">
        <Requirement label="Khách hàng" value={request.tenKhachHang || `#${request.maKhachHang}`} />
        <Requirement label="Loại yêu cầu" value={getCustomArtTypeLabel(request.type)} />
        <Requirement label="Loại tranh" value={text(request.loaiTranh)} />
        <Requirement label="Kích thước" value={text(request.kichThuoc)} />
        <Requirement label="Phong cách" value={text(request.phongCach)} />
        <Requirement label="Màu sắc" value={text(request.mauSac)} />
        <Requirement label="Chất liệu" value={text(request.chatLieu)} />
        <Requirement label="Chủ đề" value={text(request.chuDe)} />
        <Requirement label="Ngân sách dự kiến" value={request.giaDuKien == null ? notProvided : formatVnd(request.giaDuKien)} />
        <Requirement label="Hạn mong muốn" value={requestedDate(request.ngayHoanThanhDuKien)} />
        <Requirement label="Mô tả yêu cầu" value={text(request.moTa)} wide />
      </dl>

      {request.type === 'PERSONAL_REFERENCE' && <div className="custom-art-requirements-source">
        <h4>Quyền sử dụng ảnh/tài liệu cá nhân</h4>
        <p>{request.daXacNhanQuyenTaiLieu
          ? 'Khách hàng đã xác nhận có quyền sử dụng ảnh/tài liệu này để yêu cầu tạo tác phẩm.'
          : 'Khách hàng chưa xác nhận quyền sử dụng ảnh/tài liệu.'}</p>
        <p className="custom-art-requirements-note">Đây là khai báo của khách hàng, không phải kết quả xác minh quyền tác giả.</p>
      </div>}

      {request.type === 'EXISTING_ARTWORK' && <div className="custom-art-requirements-source">
        <h4>Thông tin tác phẩm gốc và quyền sử dụng</h4>
        <dl className="custom-art-requirements-grid">
          <Requirement label="Tác phẩm gốc" value={text(request.referenceArtworkName)} />
          <Requirement label="Tác giả gốc" value={text(request.referenceArtistName)} />
          {request.referenceArtworkId != null && <Requirement label="Mã tác phẩm gốc" value={`#${request.referenceArtworkId}`} />}
          <Requirement label="Tình trạng quyền sử dụng" value={permissionLabels[request.tinhTrangQuyenSuDung || ''] || text(request.tinhTrangQuyenSuDung)} />
          <Requirement label="Nguồn tác phẩm gốc" value={text(request.nguonTacPhamGoc)} wide />
          <Requirement label="Mô tả quyền sử dụng" value={text(request.moTaQuyenSuDung)} wide />
        </dl>
        <p className="custom-art-requirements-note">Đây là khai báo của khách hàng, không phải kết quả xác minh quyền tác giả.</p>
      </div>}

      <div className="custom-art-requirements-files">
        <h4>Tệp khách hàng đính kèm</h4>
        {!attachments.some((file) => file.path) && <p>Chưa có tệp đính kèm.</p>}
        {attachments.filter((file) => file.path).map(({ kind, label }) => (
          <div className="custom-art-requirements-file" key={kind}>
            <strong>{label}</strong>
            {loadingFiles ? <p>Đang tải tệp...</p> : previews[kind]?.url
              ? <><a href={previews[kind]!.url} target="_blank" rel="noreferrer">Mở {label.toLowerCase()}</a>
                {kind !== 'evidence' && <img src={previews[kind]!.url} alt={label} />}</>
              : <p role="status" className="custom-art-requirements-file-error">Không tải được tệp. Hãy mở lại chi tiết để thử lại.</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomArtRequirements;
