import React, { useState } from 'react';
import './CancelOrderModal.css';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderCode?: string;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderCode
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    'Đổi ý, không mua nữa',
    'Tìm thấy giá rẻ hơn ở chỗ khác',
    'Muốn thay đổi sản phẩm trong đơn hàng (màu sắc, số lượng,...)',
    'Lý do khác'
  ];

  const handleConfirm = () => {
    if (!selectedReason) {
      alert('Vui lòng chọn lý do hủy đơn hàng');
      return;
    }

    if (selectedReason === 'Lý do khác' && !otherReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    const finalReason = selectedReason === 'Lý do khác' ? otherReason : selectedReason;
    onConfirm(finalReason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setOtherReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cancel-modal-overlay" onClick={handleClose}>
      <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="cancel-modal-close" onClick={handleClose}>
          ×
        </button>

        <div className="cancel-modal-header">
          <h2>HỦY ĐƠN HÀNG</h2>
          {orderCode && <p className="order-code">Đơn hàng: {orderCode}</p>}
        </div>

        <div className="cancel-modal-body">
          <p className="cancel-description">
            Vui lòng chọn lý do hủy đơn để chúng tôi cải thiện dịch vụ tốt hơn.
          </p>

          <div className="cancel-reasons">
            {reasons.map((reason, index) => (
              <label key={index} className="reason-option">
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span className="reason-text">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Lý do khác' && (
            <div className="other-reason-input">
              <textarea
                placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="cancel-modal-footer">
          <button className="btn-confirm" onClick={handleConfirm}>
            GỬI YÊU CẦU HỦY
          </button>
          <button className="btn-cancel" onClick={handleClose}>
            ĐÓNG
          </button>
        </div>

        <div className="cancel-note">
          <p><strong>Lưu ý:</strong> Yêu cầu hủy sẽ được Admin xem xét trước khi chính thức huỷ đơn hàng.</p>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
