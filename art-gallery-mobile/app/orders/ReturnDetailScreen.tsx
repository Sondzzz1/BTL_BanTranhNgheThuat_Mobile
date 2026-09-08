import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { returnService } from '../../services/returnService';
import {
  YeuCauHoanTraChiTiet,
  RETURN_STATUS_TEXT,
  RETURN_STATUS_COLOR,
  RETURN_STATUS_BG,
  RETURN_STATUS,
  RETURN_TIMELINE,
  RETURN_REASONS,
} from '../../types/return';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

interface ReturnDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ReturnDetailScreen({ route, navigation }: ReturnDetailScreenProps) {
  const { returnId } = route.params as { returnId: number };

  const [detail, setDetail] = useState<YeuCauHoanTraChiTiet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [returnId]);

  const loadDetail = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await returnService.getReturnDetail(returnId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết yêu cầu hoàn trả');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmShipped = () => {
    Alert.alert(
      'Xác nhận gửi hàng',
      'Bạn xác nhận đã gửi sản phẩm về cửa hàng chúng tôi?\n\nSau khi xác nhận, trạng thái sẽ chuyển sang "Đang gửi hàng".',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận đã gửi',
          style: 'default',
          onPress: async () => {
            try {
              setIsConfirming(true);
              const result = await returnService.confirmProductReturned(returnId);
              Alert.alert('Thành công', result.message);
              await loadDetail(); // Reload để cập nhật trạng thái
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xác nhận gửi hàng');
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getLyDoLabel = (lyDo: string): string => {
    const found = RETURN_REASONS.find((r) => r.value === lyDo);
    return found ? found.label : lyDo;
  };

  /** Tính index hiện tại của timeline dựa trên trạng thái */
  const getCurrentTimelineIndex = (status: string): number => {
    if (status === RETURN_STATUS.TU_CHOI) return -1; // Từ chối: hiển thị riêng
    const index = RETURN_TIMELINE.findIndex((s) => s.status === status);
    return index >= 0 ? index : 0;
  };

  if (isLoading) return <Loading message="Đang tải chi tiết yêu cầu..." />;
  if (error || !detail) return <ErrorMessage message={error || 'Không tìm thấy yêu cầu'} onRetry={loadDetail} />;

  const currentTimelineIndex = getCurrentTimelineIndex(detail.trangThai);
  const statusColor = RETURN_STATUS_COLOR[detail.trangThai] ?? '#6b7280';
  const statusBg = RETURN_STATUS_BG[detail.trangThai] ?? '#f3f4f6';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>

        {/* Header - Mã yêu cầu + Trạng thái */}
        <View style={styles.header}>
          <View>
            <Text style={styles.returnCode}>Yêu cầu #{detail.maYeuCau}</Text>
            <Text style={styles.orderCode}>Đơn hàng #{detail.maDonHang}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {RETURN_STATUS_TEXT[detail.trangThai] ?? detail.trangThai}
            </Text>
          </View>
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <View style={styles.productRow}>
            <View style={styles.productImageContainer}>
              {detail.hinhAnhTacPham ? (
                <Image
                  source={{ uri: detail.hinhAnhTacPham }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={{ fontSize: 32 }}>🖼️</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{detail.tenTacPham || 'Sản phẩm'}</Text>
              <Text style={styles.productPrice}>{formatPrice(detail.giaTacPham)}</Text>
              <Text style={styles.productQty}>Số lượng: {detail.soLuong}</Text>
            </View>
          </View>
        </View>

        {/* Thông tin hoàn trả */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lý do:</Text>
            <Text style={styles.infoValue}>{getLyDoLabel(detail.lyDo)}</Text>
          </View>
          {detail.lyDoKhac && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lý do cụ thể:</Text>
              <Text style={styles.infoValue}>{detail.lyDoKhac}</Text>
            </View>
          )}
          {detail.moTa && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mô tả:</Text>
              <Text style={[styles.infoValue, styles.infoValueMultiline]}>{detail.moTa}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày gửi:</Text>
            <Text style={styles.infoValue}>{formatDate(detail.ngayTao)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.infoValue}>{formatDate(detail.ngayCapNhat)}</Text>
          </View>
        </View>

        {/* Hình ảnh minh chứng */}
        {detail.hinhAnh && detail.hinhAnh.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh minh chứng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {detail.hinhAnh.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.evidenceImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bị từ chối */}
        {detail.trangThai === RETURN_STATUS.TU_CHOI && (
          <View style={styles.rejectedBox}>
            <Text style={styles.rejectedTitle}>❌ Yêu cầu bị từ chối</Text>
            <Text style={styles.rejectedLabel}>Lý do từ chối:</Text>
            <Text style={styles.rejectedReason}>
              {detail.lyDoTuChoi || 'Không có lý do cụ thể'}
            </Text>
          </View>
        )}

        {/* Hướng dẫn gửi hàng khi được duyệt */}
        {detail.trangThai === RETURN_STATUS.DA_DUYET && (
          <View style={styles.approvedBox}>
            <Text style={styles.approvedTitle}>✅ Yêu cầu đã được duyệt!</Text>
            <Text style={styles.approvedInstructions}>
              Vui lòng gửi sản phẩm về địa chỉ của chúng tôi:{'\n\n'}
              📍 <Text style={styles.bold}>LanVu Gallery</Text>{'\n'}
              123 Đường Nghệ Thuật, Quận 1, TP.HCM{'\n\n'}
              📞 Hotline: 1900 xxxx{'\n\n'}
              Sau khi gửi hàng, bấm nút bên dưới để xác nhận.
            </Text>
          </View>
        )}

        {/* Timeline trạng thái */}
        {detail.trangThai !== RETURN_STATUS.TU_CHOI && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến trình xử lý</Text>
            {RETURN_TIMELINE.map((step, index) => {
              const isDone = index <= currentTimelineIndex;
              const isCurrent = index === currentTimelineIndex;
              return (
                <View key={step.status} style={styles.timelineItem}>
                  {/* Đường kẻ dọc */}
                  {index < RETURN_TIMELINE.length - 1 && (
                    <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                  )}
                  {/* Vòng tròn */}
                  <View style={[
                    styles.timelineDot,
                    isDone && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent,
                  ]}>
                    {isDone && <Text style={styles.timelineDotCheck}>✓</Text>}
                  </View>
                  {/* Nội dung */}
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isDone && styles.timelineLabelDone,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.timelineDescription}>{step.description}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Nút xác nhận đã gửi hàng - chỉ hiện khi trạng thái DA_DUYET */}
      {detail.trangThai === RETURN_STATUS.DA_DUYET && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
            onPress={handleConfirmShipped}
            disabled={isConfirming}
            activeOpacity={0.8}
          >
            {isConfirming ? (
              <View style={styles.buttonLoading}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.confirmButtonText}>Đang xử lý...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>🚚 TÔI ĐÃ GỬI SẢN PHẨM</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  returnCode: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  orderCode: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginBottom: 14 },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImageContainer: {
    width: 80, height: 80, borderRadius: 8,
    overflow: 'hidden', backgroundColor: '#f3f4f6', marginRight: 12,
  },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  productPrice: { fontSize: 14, color: '#2563eb', fontWeight: '500', marginBottom: 2 },
  productQty: { fontSize: 13, color: '#6b7280' },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: { fontSize: 13, color: '#6b7280', width: 130 },
  infoValue: { fontSize: 13, color: '#1f2937', flex: 1 },
  infoValueMultiline: { lineHeight: 20 },
  evidenceImage: {
    width: 100, height: 100, borderRadius: 8,
    marginRight: 8, backgroundColor: '#f3f4f6',
  },
  rejectedBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  rejectedTitle: { fontSize: 16, fontWeight: 'bold', color: '#991b1b', marginBottom: 10 },
  rejectedLabel: { fontSize: 13, fontWeight: '600', color: '#7f1d1d', marginBottom: 4 },
  rejectedReason: { fontSize: 13, color: '#7f1d1d', lineHeight: 20 },
  approvedBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  approvedTitle: { fontSize: 16, fontWeight: 'bold', color: '#15803d', marginBottom: 10 },
  approvedInstructions: { fontSize: 13, color: '#166534', lineHeight: 22 },
  bold: { fontWeight: 'bold' },
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
    marginBottom: 0,
    position: 'relative',
    minHeight: 44,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 28,
    width: 2,
    height: 32,
    backgroundColor: '#e5e7eb',
    zIndex: 0,
  },
  timelineLineDone: { backgroundColor: '#2563eb' },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
    zIndex: 1,
    marginTop: 2,
  },
  timelineDotDone: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  timelineDotCurrent: { borderColor: '#ea580c', backgroundColor: '#ea580c' },
  timelineDotCheck: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  timelineContent: { flex: 1, paddingBottom: 18 },
  timelineLabel: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  timelineLabelDone: { color: '#1f2937' },
  timelineLabelCurrent: { color: '#ea580c', fontWeight: '600' },
  timelineDescription: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: { backgroundColor: '#86efac' },
  buttonLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
