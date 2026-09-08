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
import { Order, ORDER_STATUS_TEXT } from '../../types/order';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

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
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setIsLoading(false);
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

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

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

  const canCancelOrder = (status: number): boolean => {
    // Có thể hủy nếu đơn hàng đang ở trạng thái: Pending hoặc Confirmed
    return status === 0 || status === 1;
  };

  // Chỉ hiển thị nút hoàn trả khi đơn hàng đã Hoàn thành (status = 3)
  const canRequestReturn = (status: number): boolean => {
    return status === 3;
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
        {order.trangThai === 4 && order.lyDoHuy && (
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

      {/* Nút hành động: Hủy đơn hoặc Yêu cầu hoàn trả */}
      {(canCancelOrder(order.trangThai) || canRequestReturn(order.trangThai)) && (
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
          {canRequestReturn(order.trangThai) && (
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() =>
                navigation.navigate('ReturnRequest', {
                  orderId: order.maDonHang,
                  orderItems: order.chiTiet || [],
                })
              }
            >
              <Text style={styles.returnButtonText}>📦 Yêu cầu hoàn trả</Text>
            </TouchableOpacity>
          )}
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
});
