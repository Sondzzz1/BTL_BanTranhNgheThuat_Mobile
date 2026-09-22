import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  customArtService,
  CustomArtRequestApi,
  getCustomArtStatusLabel,
} from '../../services/customArtService';
import './ArtistCustomArt.css';

type FilterStatus = 'all' | 'available' | 'claimed' | 'done';

type CustomArtListItem = {
  id: number;
  khachHang: string;
  tieuDe: string;
  loaiTranh: string;
  kichThuoc: string;
  moTa: string;
  trangThai: string;
  isClaimed: boolean;
  assignedArtistId?: number;
  assignedArtist?: string;
  phongCach?: string;
  mauSac?: string;
  chatLieu?: string;
  anhThamKhao?: string | null;
};

const mapApiToView = (
  item: CustomArtRequestApi
): CustomArtListItem => ({
  id: item.maYeuCau,
  khachHang: `Khách hàng #${item.maKhachHang}`,
  tieuDe: item.tieuDe,
  loaiTranh: item.loaiTranh || 'Chưa cập nhật',
  kichThuoc: item.kichThuoc || 'Chưa cập nhật',
  moTa: item.moTa || 'Không có mô tả',
  trangThai: item.trangThai,
  isClaimed: !!item.maHoaSi,
  assignedArtistId: item.maHoaSi ?? undefined,
  assignedArtist: item.maHoaSi
    ? `Họa sĩ #${item.maHoaSi}`
    : undefined,
  phongCach: item.phongCach,
  mauSac: item.mauSac,
  chatLieu: item.chatLieu,
  anhThamKhao:
    item.anhThamKhao ||
    item.referenceImageUrl ||
    null,
});

const ArtistCustomArt: React.FC = () => {
  const { user } = useAuth();

  const [status, setStatus] =
    useState<FilterStatus>('all');

  const [requests, setRequests] = useState<
    CustomArtListItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [notice, setNotice] =
    useState<string>('');

  const [openQuoteId, setOpenQuoteId] =
    useState<number | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<CustomArtListItem | null>(null);

  const [quoteForm, setQuoteForm] = useState({
    GiaBaoGia: '',
    ThoiGianHoanThanh: '',
    GhiChu: '',
  });

  const currentArtistId = Number(
    user?.id || 0
  );

  const loadRequests = async () => {
    try {
      const data =
        await customArtService.getAllRequests();

      setRequests(
        data.map(mapApiToView)
      );
    } catch (error) {
      console.error(
        'Lỗi khi tải yêu cầu custom art:',
        error
      );

      setNotice(
        'Không thể tải danh sách yêu cầu.'
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        await loadRequests();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice('');
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    if (status === 'available') {
      return requests.filter(
        (x) => !x.isClaimed
      );
    }

    if (status === 'claimed') {
      return requests.filter(
        (x) => x.isClaimed
      );
    }

    if (status === 'done') {
      return requests.filter(
        (x) =>
          x.trangThai === 'Completed'
      );
    }

    return requests;
  }, [requests, status]);

  const statistics = useMemo(() => {
    return {
      total: requests.length,

      available: requests.filter(
        (x) => !x.isClaimed
      ).length,

      mine: requests.filter(
        (x) =>
          x.assignedArtistId ===
          currentArtistId
      ).length,

      completed: requests.filter(
        (x) =>
          x.trangThai === 'Completed'
      ).length,
    };
  }, [requests, currentArtistId]);

  const handleClaim = async (
    requestId: number
  ) => {
    try {
      const response =
        await customArtService.claimRequest(
          requestId
        );

      setNotice(
        response.message ||
          `Bạn đã nhận yêu cầu #${requestId}.`
      );

      await loadRequests();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Không thể nhận yêu cầu này.';

      setNotice(msg);
    }
  };

  const openQuote = (
    item: CustomArtListItem
  ) => {
    setSelectedRequest(item);
    setOpenQuoteId(item.id);

    setQuoteForm({
      GiaBaoGia: '',
      ThoiGianHoanThanh: '',
      GhiChu: '',
    });
  };

  const closeQuote = () => {
    setOpenQuoteId(null);
    setSelectedRequest(null);

    setQuoteForm({
      GiaBaoGia: '',
      ThoiGianHoanThanh: '',
      GhiChu: '',
    });
  };

  const handleSubmitQuote = async () => {
    if (!openQuoteId) {
      setNotice(
        'Vui lòng chọn yêu cầu để báo giá.'
      );
      return;
    }

    if (
      !quoteForm.GiaBaoGia ||
      !quoteForm.ThoiGianHoanThanh
    ) {
      setNotice(
        'Vui lòng nhập giá báo giá và thời gian hoàn thành.'
      );
      return;
    }

    const price =
      Number(quoteForm.GiaBaoGia);

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
      setNotice(
        'Giá báo giá phải lớn hơn 0.'
      );
      return;
    }

    try {
      await customArtService.createQuote({
        MaYeuCau: openQuoteId,
        MaHoaSi: currentArtistId || 0,
        GiaBaoGia: price,
        ThoiGianHoanThanh:
          quoteForm.ThoiGianHoanThanh,
        GhiChu:
          quoteForm.GhiChu ||
          undefined,
      });

      setNotice(
        `Đã gửi báo giá cho yêu cầu #${openQuoteId}.`
      );

      closeQuote();

      await loadRequests();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Không thể gửi báo giá.';

      setNotice(msg);
    }
  };

  const getStatusClass = (
    item: CustomArtListItem,
    isMine: boolean
  ) => {
    if (item.trangThai === 'Completed') {
      return 'completed';
    }

    if (item.isClaimed) {
      return isMine
        ? 'mine'
        : 'claimed';
    }

    return 'available';
  };

  const getStatusText = (
    item: CustomArtListItem,
    isMine: boolean
  ) => {
    if (item.isClaimed) {
      return isMine
        ? 'Bạn đang nhận'
        : `Đã nhận bởi ${
            item.assignedArtist ||
            'họa sĩ khác'
          }`;
    }

    return getCustomArtStatusLabel(
      item.trangThai
    );
  };

  const formatPrice = (value: string) => {
    if (!value) return '';

    const number = Number(
      value.replace(/\D/g, '')
    );

    if (!number) return '';

    return new Intl.NumberFormat(
      'vi-VN'
    ).format(number);
  };

  return (
    <div className="artist-custom-page">
      {/* HEADER */}
      <div className="artist-page-header">
        <div>
          <div className="artist-breadcrumb">
            <span>Họa sĩ</span>
            <i className="ti-angle-right" />
            <span>Tranh theo yêu cầu</span>
          </div>

          <h1>
            Yêu cầu tranh theo yêu cầu
          </h1>

          <p>
            Quản lý các yêu cầu vẽ tranh,
            nhận đơn và gửi báo giá cho khách hàng.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={async () => {
            setLoading(true);

            try {
              await loadRequests();
              setNotice(
                'Đã cập nhật danh sách yêu cầu.'
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          <i className="ti-reload" />
          Làm mới
        </button>
      </div>

      {/* NOTICE */}
      {notice && (
        <div className="artist-notice">
          <div className="artist-notice-icon">
            <i className="ti-check" />
          </div>

          <span>{notice}</span>

          <button
            onClick={() => setNotice('')}
            aria-label="Đóng"
          >
            <i className="ti-close" />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="artist-stat-grid">
        <div className="artist-stat-card">
          <div className="stat-icon stat-icon-blue">
            <i className="ti-layers" />
          </div>

          <div>
            <span className="stat-label">
              Tổng yêu cầu
            </span>

            <strong>
              {statistics.total}
            </strong>

            <small>
              Tất cả yêu cầu
            </small>
          </div>
        </div>

        <div className="artist-stat-card">
          <div className="stat-icon stat-icon-orange">
            <i className="ti-paint-roller" />
          </div>

          <div>
            <span className="stat-label">
              Còn trống
            </span>

            <strong>
              {statistics.available}
            </strong>

            <small>
              Đang chờ họa sĩ nhận
            </small>
          </div>
        </div>

        <div className="artist-stat-card">
          <div className="stat-icon stat-icon-purple">
            <i className="ti-user" />
          </div>

          <div>
            <span className="stat-label">
              Bạn đang nhận
            </span>

            <strong>
              {statistics.mine}
            </strong>

            <small>
              Yêu cầu của bạn
            </small>
          </div>
        </div>

        <div className="artist-stat-card">
          <div className="stat-icon stat-icon-green">
            <i className="ti-check-box" />
          </div>

          <div>
            <span className="stat-label">
              Hoàn thành
            </span>

            <strong>
              {statistics.completed}
            </strong>

            <small>
              Đã hoàn tất
            </small>
          </div>
        </div>
      </div>

      {/* QUOTE FORM */}
      {openQuoteId && selectedRequest && (
        <div className="quote-panel">
          <div className="quote-panel-header">
            <div className="quote-title-wrap">
              <div className="quote-icon">
                <i className="ti-receipt" />
              </div>

              <div>
                <h3>
                  Gửi báo giá
                </h3>

                <p>
                  Yêu cầu #{selectedRequest.id}
                  {' · '}
                  {selectedRequest.tieuDe}
                </p>
              </div>
            </div>

            <button
              className="quote-close"
              onClick={closeQuote}
            >
              <i className="ti-close" />
            </button>
          </div>

          <div className="quote-request-summary">
            <div>
              <span>Loại tranh</span>
              <strong>
                {selectedRequest.loaiTranh}
              </strong>
            </div>

            <div>
              <span>Kích thước</span>
              <strong>
                {selectedRequest.kichThuoc}
              </strong>
            </div>

            {selectedRequest.phongCach && (
              <div>
                <span>Phong cách</span>
                <strong>
                  {selectedRequest.phongCach}
                </strong>
              </div>
            )}

            {selectedRequest.chatLieu && (
              <div>
                <span>Chất liệu</span>
                <strong>
                  {selectedRequest.chatLieu}
                </strong>
              </div>
            )}
          </div>

          <div className="quote-form-grid">
            <div className="form-group">
              <label>
                Giá báo giá
                <span>*</span>
              </label>

              <div className="input-with-suffix">
                <input
                  type="number"
                  value={
                    quoteForm.GiaBaoGia
                  }
                  onChange={(e) =>
                    setQuoteForm(
                      (prev) => ({
                        ...prev,
                        GiaBaoGia:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="VD: 25000000"
                  min="0"
                />

                <span>VNĐ</span>
              </div>

              {quoteForm.GiaBaoGia && (
                <small className="input-helper">
                  {formatPrice(
                    quoteForm.GiaBaoGia
                  )}{' '}
                  VNĐ
                </small>
              )}
            </div>

            <div className="form-group">
              <label>
                Thời gian hoàn thành
                <span>*</span>
              </label>

              <div className="input-with-icon">
                <i className="ti-time" />

                <input
                  type="text"
                  value={
                    quoteForm.ThoiGianHoanThanh
                  }
                  onChange={(e) =>
                    setQuoteForm(
                      (prev) => ({
                        ...prev,
                        ThoiGianHoanThanh:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="VD: 14 ngày"
                />
              </div>
            </div>
          </div>

          <div className="form-group quote-note">
            <label>Ghi chú cho khách hàng</label>

            <textarea
              value={quoteForm.GhiChu}
              onChange={(e) =>
                setQuoteForm(
                  (prev) => ({
                    ...prev,
                    GhiChu:
                      e.target.value,
                  })
                )
              }
              rows={4}
              placeholder="Ví dụ: Đã bao gồm phí khung tranh, vận chuyển..."
            />
          </div>

          <div className="quote-actions">
            <button
              className="quote-cancel"
              onClick={closeQuote}
            >
              Hủy
            </button>

            <button
              className="quote-submit"
              onClick={handleSubmitQuote}
            >
              <i className="ti-check" />
              Gửi báo giá
            </button>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="request-toolbar">
        <div className="toolbar-title">
          <div>
            <h2>
              Danh sách yêu cầu
            </h2>

            <span>
              {filtered.length} yêu cầu
            </span>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={
              status === 'all'
                ? 'active'
                : ''
            }
            onClick={() =>
              setStatus('all')
            }
          >
            Tất cả
          </button>

          <button
            className={
              status === 'available'
                ? 'active'
                : ''
            }
            onClick={() =>
              setStatus('available')
            }
          >
            Còn trống
            <span>
              {statistics.available}
            </span>
          </button>

          <button
            className={
              status === 'claimed'
                ? 'active'
                : ''
            }
            onClick={() =>
              setStatus('claimed')
            }
          >
            Đã nhận
          </button>

          <button
            className={
              status === 'done'
                ? 'active'
                : ''
            }
            onClick={() =>
              setStatus('done')
            }
          >
            Hoàn thành
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="artist-table-card">
        {loading ? (
          <div className="artist-loading">
            <div className="loading-spinner" />
            <span>
              Đang tải danh sách yêu cầu...
            </span>
          </div>
        ) : (
          <div className="artist-table-wrapper">
            <table className="artist-request-table">
              <thead>
                <tr>
                  <th className="col-code">
                    Mã
                  </th>

                  <th className="col-request">
                    Yêu cầu
                  </th>

                  <th>
                    Khách hàng
                  </th>

                  <th>
                    Đặc điểm
                  </th>

                  <th>
                    Trạng thái
                  </th>

                  <th className="col-action">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => {
                  const isMine =
                    !!item.assignedArtistId &&
                    currentArtistId > 0 &&
                    item.assignedArtistId ===
                      currentArtistId;

                  return (
                    <tr key={item.id}>
                      {/* CODE */}
                      <td>
                        <span className="request-code">
                          #{item.id}
                        </span>
                      </td>

                      {/* REQUEST */}
                      <td>
                        <div className="request-main">
                          <strong>
                            {item.tieuDe}
                          </strong>

                          <p>
                            {item.moTa}
                          </p>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            <i className="ti-user" />
                          </div>

                          <div>
                            <strong>
                              {item.khachHang}
                            </strong>

                            <span>
                              Khách hàng
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CHARACTERISTICS */}
                      <td>
                        <div className="art-specs">
                          <span>
                            <i className="ti-paint-roller" />
                            {item.loaiTranh}
                          </span>

                          <span>
                            <i className="ti-ruler-alt-2" />
                            {item.kichThuoc}
                          </span>

                          {item.phongCach && (
                            <span>
                              <i className="ti-brush-alt" />
                              {item.phongCach}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`request-status ${getStatusClass(
                            item,
                            isMine
                          )}`}
                        >
                          <span className="status-dot" />

                          {getStatusText(
                            item,
                            isMine
                          )}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td>
                        <div className="request-actions">
                          {!item.isClaimed ? (
                            <button
                              className="action-button primary"
                              onClick={() =>
                                handleClaim(
                                  item.id
                                )
                              }
                            >
                              <i className="ti-hand-point-right" />
                              Nhận yêu cầu
                            </button>
                          ) : isMine ? (
                            <button
                              className="action-button quote"
                              onClick={() =>
                                openQuote(item)
                              }
                            >
                              <i className="ti-receipt" />
                              Báo giá
                            </button>
                          ) : (
                            <button
                              className="action-button disabled"
                              disabled
                            >
                              <i className="ti-lock" />
                              Đã nhận
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="empty-cell"
                    >
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="ti-paint-bucket" />
                        </div>

                        <h3>
                          Không có yêu cầu
                        </h3>

                        <p>
                          Hiện chưa có yêu cầu
                          phù hợp với bộ lọc này.
                        </p>

                        {status !== 'all' && (
                          <button
                            onClick={() =>
                              setStatus('all')
                            }
                          >
                            Xem tất cả yêu cầu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistCustomArt;