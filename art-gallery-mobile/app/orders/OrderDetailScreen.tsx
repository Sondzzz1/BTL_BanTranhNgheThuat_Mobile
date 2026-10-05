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
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import { Order, OrderItem, ORDER_STATUS, ORDER_STATUS_TEXT } from '../../types/order';
import { ReviewPermission } from '../../types/review';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import AddReviewModal from '../../components/AddReviewModal';
import { formatVnd } from '../../utils/currency';

interface OrderDetailScreenProps {
  route: any;
  navigation: any;
}

export default function OrderDetailScreen({
  route,
  navigation,
}: OrderDetailScreenProps) {
  const orderId = route.params?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
  const [reviewPermissions, setReviewPermissions] = useState<Record<number, ReviewPermission>>({});
  const [isLoadingReviewPermissions, setIsLoadingReviewPermissions] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<OrderItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
      await loadReviewPermissions(orderData);
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewPermissions = async (orderData: Order) => {
    const productIds = [...new Set(
      (orderData.chiTiet || [])
        .map((item) => item.maTacPham)
        .filter((productId) => productId > 0)
    )];

    if (orderData.trangThai !== 3 || productIds.length === 0) {
      setReviewPermissions({});
      return;
    }

    try {
      setIsLoadingReviewPermissions(true);
      const permissionEntries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            return [productId, await reviewService.getMyPermission(productId)] as const;
          } catch (permissionError) {
            // Không làm hỏng màn hình đơn hàng nếu một sản phẩm không thể kiểm tra quyền.
            console.error(`Error loading review permission for artwork ${productId}:`, permissionError);
            return [productId, null] as const;
          }
        })
      );

      const nextPermissions = permissionEntries.reduce<Record<number, ReviewPermission>>(
        (result, [productId, permission]) => {
          if (permission) result[productId] = permission;
          return result;
        },
        {}
      );
      setReviewPermissions(nextPermissions);
    } finally {
      setIsLoadingReviewPermissions(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await orderService.cancelOrder(order.maDonHang, 'Khách hàng yêu cầu hủy');
              Alert.alert('Thành công', 'Đã gửi yêu cầu hủy đơn hàng');
              await loadOrderDetail();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy đơn hàng');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmReceived = () => {
    if (!order) return;

    Alert.alert(
      'Xác nhận đã nhận hàng',
      'Chỉ xác nhận khi bạn đã nhận đủ sản phẩm và hàng không bị hư hỏng. Sau khi xác nhận, đơn sẽ hoàn thành.',
      [
        { text: 'Chưa nhận hàng', style: 'cancel' },
        {
          text: 'Đã nhận hàng',
          onPress: async () => {
            try {
              setIsConfirmingReceipt(true);
              const result = await orderService.confirmReceived(order.maDonHang);
              Alert.alert('Xác nhận thành công', result.message || 'Đơn hàng đã được chuyển sang Hoàn thành.');
              await loadOrderDetail();
            } catch (err: any) {
              Alert.alert('Không thể xác nhận', err.message || 'Vui lòng thử lại sau.');
            } finally {
              setIsConfirmingReceipt(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewPress = (item: OrderItem) => {
    if (!reviewPermissions[item.maTacPham]?.canReview) return;
    setSelectedReviewItem(item);
    setShowReviewModal(true);
  };

  const handleReviewSaved = () => {
    if (order) void loadReviewPermissions(order);
  };

  const formatPrice = formatVnd;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return '#f59e0b';
      case 1: return '#3b82f6';
      case 2: return '#8b5cf6';
      case 3: return '#10b981';
      case 4: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPaymentMethodLabel = (method?: string): string => {
    switch (method?.trim().toUpperCase()) {
      case 'COD':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'BANKTRANSFER':
      case 'BANK_TRANSFER':
      case 'CHUYENKHOAN':
        return 'Chuyển khoản ngân hàng';
      default:
        return method?.trim() || 'Chưa xác định';
    }
  };

  const getPaymentStatus = (status?: string): { label: string; color: string; backgroundColor: string } => {
    switch (status?.trim().toUpperCase()) {
      case 'DATHANHTOAN':
        return { label: 'Đã thanh toán', color: '#047857', backgroundColor: '#d1fae5' };
      case 'CHO THANH TOAN':
      case 'CHOTHANHTOAN':
        return { label: 'Chờ xác nhận thanh toán', color: '#b45309', backgroundColor: '#fef3c7' };
      case 'THATBAI':
        return { label: 'Thanh toán thất bại', color: '#b91c1c', backgroundColor: '#fee2e2' };
      case 'CHOHOANTIEN':
        return { label: 'Chờ hoàn tiền', color: '#1d4ed8', backgroundColor: '#dbeafe' };
      case 'HOANTIEN':
        return { label: 'Đã hoàn tiền', color: '#6b21a8', backgroundColor: '#f3e8ff' };
      default:
        return { label: 'Chưa cập nhật', color: '#4b5563', backgroundColor: '#f3f4f6' };
    }
  };

  const canCancelOrder = (status: number): boolean => {
    // Có thể hủy nếu đơn hàng đang ở trạng thái: Pending hoặc Confirmed
    return status === ORDER_STATUS.PENDING || status === ORDER_STATUS.CONFIRMED;
  };

  // Chỉ hiển thị nút hoàn trả khi đơn hàng đã Hoàn thành (status = 3)
  // VÀ trong vòng 7 ngày kể từ ngày hoàn thành
  const canRequestReturn = (status: number, deliveredDate: string): boolean => {
    if (status !== ORDER_STATUS.COMPLETED) return false;
    
    // Tính số ngày từ ngày đặt hàng đến hiện tại
    const orderTime = new Date(deliveredDate).getTime();
    const currentTime = new Date().getTime();
    const daysDiff = Math.floor((currentTime - orderTime) / (1000 * 60 * 60 * 24));
    
    // Chỉ cho phép hoàn trả trong vòng 7 ngày
    return daysDiff <= 7;
  };

  const getDaysRemaining = (orderDate: string): number => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const daysDiff = Math.floor((currentTime - orderTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysDiff);
  };

  if (isLoading) {
    return <Loading message="Đang tải thông tin đơn hàng..." />;
  }

  if (error || !order) {
    return (
      <ErrorMessage
        message={error || 'Không tìm thấy đơn hàng'}
        onRetry={loadOrderDetail}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Header */}
        <View style={styles.header}>
          <Text style={styles.orderCode}>Đơn hàng #{order.maDonHang}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.trangThai) },
            ]}
          >
            <Text style={styles.statusText}>
              {ORDER_STATUS_TEXT[order.trangThai] || 'Không xác định'}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày đặt:</Text>
            <Text style={styles.infoValue}>{formatDate(order.ngayDat)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tổng tiền:</Text>
            <Text style={[styles.infoValue, styles.infoValueBold]}>
              {formatPrice(order.tongTien)}
            </Text>
          </View>
        </View>

        {/* Payment information is read-only for customers. */}
        {(() => {
          const paymentStatus = getPaymentStatus(order.trangThaiThanhToan);
          const isBankTransfer = order.phuongThucThanhToan?.trim().toUpperCase() === 'BANKTRANSFER';
          const isPendingPayment = order.trangThaiThanhToan?.trim().toUpperCase() === 'CHOTHANHTOAN';

          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phương thức:</Text>
                <Text style={styles.infoValue}>{getPaymentMethodLabel(order.phuongThucThanhToan)}</Text>
              </View>
              <View style={[styles.infoRow, styles.paymentStatusRow]}>
                <Text style={styles.infoLabel}>Trạng thái:</Text>
                <View style={[styles.paymentStatusBadge, { backgroundColor: paymentStatus.backgroundColor }]}>
                  <Text style={[styles.paymentStatusText, { color: paymentStatus.color }]}>
                    {paymentStatus.label}
                  </Text>
                </View>
              </View>
              {isBankTransfer && isPendingPayment && (
                <Text style={styles.paymentHint}>
                  Khoản chuyển khoản đang chờ quản trị viên xác nhận. Bạn không cần thực hiện thêm thao tác trên ứng dụng.
                </Text>
              )}
            </View>
          );
        })()}

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người nhận:</Text>
            <Text style={styles.infoValue}>{order.tenNguoiNhan || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{order.soDienThoai || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={[styles.infoValue, styles.addressText]}>
              {order.diaChiGiao || 'N/A'}
            </Text>
          </View>
        </View>

        {order.trangThai === ORDER_STATUS.SHIPPING && (
          <View style={styles.receiptActionCard}>
            <Text style={styles.receiptActionTitle}>Đơn hàng đang được giao đến bạn</Text>
            <Text style={styles.receiptActionDescription}>
              Khi đã nhận đủ hàng, hãy xác nhận để hoàn tất đơn và giúp họa sĩ được đối soát doanh thu.
            </Text>
            <TouchableOpacity
              style={[styles.receiptButton, isConfirmingReceipt && styles.receiptButtonDisabled]}
              onPress={handleConfirmReceived}
              disabled={isConfirmingReceipt}
            >
              {isConfirmingReceipt ? (
                <View style={styles.receiptButtonLoading}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.receiptButtonText}>Đang xác nhận...</Text>
                </View>
              ) : (
                <Text style={styles.receiptButtonText}>✓ Tôi đã nhận được hàng</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {order.trangThai === ORDER_STATUS.COMPLETED && (
          <View style={styles.receiptCompletedCard}>
            <Text style={styles.receiptCompletedText}>✓ Đơn hàng đã hoàn thành, bạn không cần xác nhận lại.</Text>
          </View>
        )}

        {(order.trangThai === ORDER_STATUS.PENDING || order.trangThai === ORDER_STATUS.CONFIRMED) && (
          <View style={styles.receiptWaitingCard}>
            <Text style={styles.receiptWaitingText}>
              Nút “Tôi đã nhận được hàng” sẽ xuất hiện khi đơn chuyển sang trạng thái “Đang giao hàng”.
            </Text>
          </View>
        )}

        {/* Order Items */}
        {(() => {
          const chiTietList = order.chiTiet || [];
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sản phẩm ({chiTietList.length})</Text>
              {chiTietList.map((item, index) => (
                <View key={item.maChiTietDH || item.maTacPham || index} style={styles.orderItem}>
                  {/* Product Image */}
                  <View style={styles.itemImageContainer}>
                    {item.hinhAnh ? (
                      <Image
                        source={{ uri: item.hinhAnh }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Text style={styles.itemImagePlaceholderText}>🖼️</Text>
                      </View>
                    )}
                  </View>

                  {/* Product Info */}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.tenTacPham || 'Tác phẩm'}
                    </Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>{formatPrice(item.donGia)}</Text>
                      <Text style={styles.itemQuantity}>x{item.soLuong}</Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      Thành tiền: {formatPrice(item.thanhTien)}
                    </Text>
                    {order.trangThai === ORDER_STATUS.COMPLETED && (
                      isLoadingReviewPermissions ? (
                        <View style={styles.reviewLoading}>
                          <ActivityIndicator size="small" color="#2563eb" />
                        </View>
                      ) : reviewPermissions[item.maTacPham]?.canReview ? (
                        <TouchableOpacity
                          style={styles.reviewButton}
                          onPress={() => handleReviewPress(item)}
                        >
                          <Text style={styles.reviewButtonText}>
                            {reviewPermissions[item.maTacPham].existingReview
                              ? '✏️ Sửa đánh giá của bạn'
                              : '⭐ Đánh giá tác phẩm'}
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    )}
                  </View>
                </View>
              ))}
              
              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalAmount}>{formatPrice(order.tongTien)}</Text>
              </View>
            </View>
          );
        })()}

        {/* Cancel Reason */}
        {order.trangThai === ORDER_STATUS.CANCEL_REQUESTED && order.lyDoHuy && (
          <View style={styles.cancelNote}>
            <Text style={styles.cancelLabel}>Lý do hủy:</Text>
            <Text style={styles.cancelText}>{order.lyDoHuy}</Text>
          </View>
        )}

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ℹ️ Nếu có thắc mắc về đơn hàng, vui lòng liên hệ với chúng tôi qua hotline hoặc email.
          </Text>
        </View>
      </ScrollView>

      {selectedReviewItem && (
        <AddReviewModal
          visible={showReviewModal}
          productId={selectedReviewItem.maTacPham}
          productName={selectedReviewItem.tenTacPham || 'Tác phẩm'}
          existingReview={reviewPermissions[selectedReviewItem.maTacPham]?.existingReview}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReviewItem(null);
          }}
          onReviewAdded={handleReviewSaved}
        />
      )}

      {/* Nút hành động: Hủy đơn hoặc Yêu cầu hoàn trả */}
      {(canCancelOrder(order.trangThai) || canRequestReturn(order.trangThai, order.ngayGiao ?? order.ngayDat)) && (
        <View style={styles.footer}>
          {canCancelOrder(order.trangThai) && (
            <TouchableOpacity
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              onPress={handleCancelOrder}
              disabled={isCancelling}
            >
              <Text style={styles.cancelButtonText}>
                {isCancelling ? 'Đang xử lý...' : 'Hủy đơn hàng'}
              </Text>
            </TouchableOpacity>
          )}
          {canRequestReturn(order.trangThai, order.ngayGiao ?? order.ngayDat) && (
            <View>
              <TouchableOpacity
                style={styles.returnButton}
                onPress={() =>
                  navigation.navigate('ReturnRequest', {
                    orderId: order.maDonHang,
                    orderItems: order.chiTiet || [],
                    deliveredDate: order.ngayGiao ?? order.ngayDat,
                  })
                }
              >
                <Text style={styles.returnButtonText}>📦 Yêu cầu hoàn trả</Text>
              </TouchableOpacity>
              <Text style={styles.returnWarning}>
                ⏰ Còn {getDaysRemaining(order.ngayGiao ?? order.ngayDat)} ngày để yêu cầu hoàn trả
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Hiển thị thông báo nếu quá hạn hoàn trả */}
      {order.trangThai === ORDER_STATUS.COMPLETED && !canRequestReturn(order.trangThai, order.ngayGiao ?? order.ngayDat) && (
        <View style={styles.expiredFooter}>
          <Text style={styles.expiredText}>
            ⚠️ Đã quá thời hạn 7 ngày để yêu cầu hoàn trả sản phẩm
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  infoValueBold: {
    fontWeight: 'bold',
    color: '#2563eb',
    fontSize: 16,
  },
  addressText: {
    flex: 1,
    textAlign: 'right',
  },
  paymentStatusRow: {
    borderBottomWidth: 0,
  },
  paymentStatusBadge: {
    maxWidth: '65%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  paymentHint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    color: '#92400e',
    fontSize: 13,
    lineHeight: 19,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  itemImagePlaceholderText: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  itemPrices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  reviewLoading: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  reviewButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  cancelNote: {
    backgroundColor: '#fef2f2',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelText: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  receiptActionCard: {
    backgroundColor: '#ecfdf5',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  receiptActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 6,
  },
  receiptActionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#047857',
    marginBottom: 14,
  },
  receiptButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  receiptButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  receiptButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  receiptCompletedCard: {
    backgroundColor: '#ecfdf5',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  receiptCompletedText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  receiptWaitingCard: {
    backgroundColor: '#eff6ff',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  receiptWaitingText: {
    color: '#1e40af',
    fontSize: 14,
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  noteText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  returnWarning: {
    marginTop: 8,
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  expiredFooter: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
  },
  expiredText: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    fontWeight: '500',
  },
});
