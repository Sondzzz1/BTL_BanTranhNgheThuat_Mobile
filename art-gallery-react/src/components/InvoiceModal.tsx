import React, { useState, useEffect } from 'react';
import { invoiceService, HoaDon } from '../services/invoiceService';
import { formatVnd } from '../utils/currency';
import './InvoiceModal.css';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  invoiceId?: number;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  orderId,
  invoiceId,
}) => {
  const [invoice, setInvoice] = useState<HoaDon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInvoice(null);
      setError(null);
      return;
    }

    const loadInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: HoaDon | null = null;
        if (invoiceId) {
          data = await invoiceService.getById(invoiceId);
        } else if (orderId) {
          data = await invoiceService.getByOrderId(orderId);
        }
        if (!data) {
          setError('Chưa có hóa đơn cho đơn hàng này.');
        } else {
          setInvoice(data);
        }
      } catch (err: any) {
        console.error('Error loading invoice:', err);
        setError(err.response?.data?.message || 'Không thể tải hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [isOpen, orderId, invoiceId]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      await invoiceService.downloadPdf(invoice.maHoaDon);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải file PDF');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatPaymentMethod = (method?: string) => {
    switch (method?.trim().toUpperCase()) {
      case 'COD':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'BANKTRANSFER':
      case 'BANK_TRANSFER':
      case 'CHUYENKHOAN':
        return 'Chuyển khoản ngân hàng';
      default:
        return method || 'Chưa xác định';
    }
  };

  const formatPaymentStatus = (status?: string) => {
    switch (status?.trim().toUpperCase()) {
      case 'DATHANHTOAN':
        return 'Đã thanh toán';
      case 'CHOTHANHTOAN':
        return 'Chờ thanh toán';
      case 'THATBAI':
        return 'Thất bại';
      default:
        return status || 'Chưa cập nhật';
    }
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-modal-header">
          <h3>
            <i className="ti-receipt"></i> Hóa Đơn Bán Hàng
          </h3>
          <button className="invoice-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="invoice-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="ti-reload" style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite' }}></i>
              <p style={{ marginTop: '12px', color: '#6b7280' }}>Đang tải hóa đơn...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              <i className="ti-alert" style={{ fontSize: '2rem' }}></i>
              <p style={{ marginTop: '12px' }}>{error}</p>
            </div>
          ) : invoice ? (
            <>
              <div className="invoice-title-block">
                <h2>HÓA ĐƠN BÁN HÀNG</h2>
                <p className="invoice-subtitle">Biên nhận bán hàng nội bộ - Không thay thế hóa đơn thuế</p>
              </div>

              <div className="invoice-meta-grid">
                <div className="invoice-meta-item">
                  <strong>Mã hóa đơn</strong>
                  <span>HD{String(invoice.maHoaDon).padStart(6, '0')}</span>
                </div>
                <div className="invoice-meta-item">
                  <strong>Mã đơn hàng</strong>
                  <span>DH{invoice.maDonHang}</span>
                </div>
                <div className="invoice-meta-item">
                  <strong>Ngày lập</strong>
                  <span>{formatDate(invoice.ngayXuatHD)}</span>
                </div>
              </div>

              <div className="invoice-section">
                <div className="invoice-section-title">Thông Tin Khách Hàng</div>
                <div className="invoice-customer-info">
                  <p><strong>Khách hàng:</strong> {invoice.tenNguoiMua || 'Khách vãng lai'}</p>
                  <p><strong>Số điện thoại:</strong> {invoice.soDienThoaiNguoiMua || '-'}</p>
                  <p><strong>Email:</strong> {invoice.email || '-'}</p>
                  <p><strong>Địa chỉ:</strong> {invoice.diaChiNguoiMua || '-'}</p>
                </div>
              </div>

              <div className="invoice-section">
                <div className="invoice-section-title">Chi Tiết Đơn Hàng</div>
                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                      <th>Tên tác phẩm</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>SL</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.chiTiet.map((item, index) => (
                      <tr key={item.maChiTietHD || index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>{item.tenTacPham || 'Tác phẩm nghệ thuật'}</td>
                        <td style={{ textAlign: 'center' }}>{item.soLuong}</td>
                        <td style={{ textAlign: 'right' }}>{formatVnd(item.donGia)}</td>
                        <td style={{ textAlign: 'right' }}>{formatVnd(item.thanhTien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="invoice-summary-block">
                  <div className="invoice-total-row">
                    <span>Tổng tiền hàng:</span>
                    <strong>{formatVnd(invoice.tongTienHang)}</strong>
                  </div>
                </div>

                <div className="invoice-payment-info">
                  <p><strong>Phương thức thanh toán:</strong> {formatPaymentMethod(invoice.phuongThucThanhToan)}</p>
                  <p><strong>Trạng thái thanh toán:</strong> {formatPaymentStatus(invoice.trangThaiThanhToan)}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="invoice-modal-footer">
          {invoice && (
            <button
              className="btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <i className="ti-download"></i> {downloading ? 'Đang tạo PDF...' : 'Tải PDF'}
            </button>
          )}
          <button className="btn-close-invoice" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
