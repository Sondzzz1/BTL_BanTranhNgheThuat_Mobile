import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicCertificate, copyrightService } from '../services/copyrightService';
import './CertificateVerify.css';

export default function CertificateVerify() {
  const { code = '' } = useParams();
  const [data, setData] = useState<PublicCertificate | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { copyrightService.verifyCertificate(code).then(setData).catch(() => setError('Không thể kết nối hệ thống xác minh.')); }, [code]);
  if (error) return <main className="certificate-public"><section><h1>Xác minh chứng nhận</h1><p className="certificate-invalid">{error}</p></section></main>;
  if (!data) return <main className="certificate-public"><section><p>Đang xác minh...</p></section></main>;
  return <main className="certificate-public"><section>
    <p className="certificate-kicker">LANVU ART GALLERY</p><h1>Xác minh chứng nhận</h1>
    {!data.timThay ? <div className="certificate-invalid"><strong>Không tìm thấy chứng nhận</strong><span>Kiểm tra lại mã hoặc QR.</span></div> : <>
      <div className={`certificate-result ${data.toanVen && data.trangThai === 'ACTIVE' ? 'valid' : 'invalid'}`}><strong>{data.toanVen ? 'Dữ liệu toàn vẹn' : 'Dữ liệu không toàn vẹn'}</strong><span>Trạng thái: {data.trangThai}</span></div>
      <dl><div><dt>Mã chứng nhận</dt><dd>{data.maChungNhan}</dd></div><div><dt>Tác phẩm</dt><dd>{data.tenTacPham}</dd></div><div><dt>Phân loại</dt><dd>{data.loaiTacPhamText}</dd></div><div><dt>Họa sĩ thực hiện</dt><dd>{data.hoaSiThucHien}</dd></div>{data.tacGiaGoc && <div><dt>Tác giả gốc</dt><dd>{data.tacGiaGoc}</dd></div>}<div><dt>Chủ sở hữu hiện vật</dt><dd>{data.chuSoHuuHienThi}</dd></div><div><dt>Ngày cấp</dt><dd>{data.ngayCap ? new Date(data.ngayCap).toLocaleString('vi-VN') : '-'}</dd></div></dl>
      {data.toanVen && <a className="certificate-pdf" href={copyrightService.publicCertificatePdfUrl(data.maChungNhan)} target="_blank" rel="noreferrer">Xem / tải PDF</a>}
    </>}
    <p className="certificate-legal">{data.luuYPhapLy}</p>
  </section></main>;
}
