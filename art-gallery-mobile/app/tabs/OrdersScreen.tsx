import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Order, ORDER_STATUS_TEXT } from '../../types/order';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';
import AppHeader from '../../components/AppHeader';

interface OrdersScreenProps {
  navigation: any;
}

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadOrders();
      } else {
        setIsLoading(false);
      }
    }, [user])
  );

  const loadOrders = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      const ordersData = await orderService.getMyOrders();
      // Sort by date descending (newest first)
      const sortedOrders = (ordersData || []).sort(
        (a, b) => new Date(b.ngayDat).getTime() - new Date(a.ngayDat).getTime()
      );
      setOrders(sortedOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      if (err.response?.status === 401) {
        setOrders([]);
      } else {
        setError(err.message || 'Không thể tải danh sách đơn hàng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    // Navigate to Order Detail
    navigation.navigate('OrderDetail', { id: order.maDonHang });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusLabel = ORDER_STATUS_TEXT[item.trangThai] || 'Không xác định';
    const statusStyles: Record<number, { color: string; bgColor: string }> = {
      0: { color: '#d97706', bgColor: '#fef3c7' },
      1: { color: '#2563eb', bgColor: '#dbeafe' },
      2: { color: '#7c3aed', bgColor: '#ede9fe' },
      3: { color: '#16a34a', bgColor: '#dcfce7' },
      4: { color: '#dc2626', bgColor: '#fee2e2' },
    };
    const { color: statusColor, bgColor } = statusStyles[item.trangThai] ?? { color: '#6b7280', bgColor: '#f3f4f6' };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>Đơn hàng #{item.maDonHang}</Text>
            <Text style={styles.orderDate}>{formatDate(item.ngayDat)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: bgColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>


        {/* Items Summary */}
        {(() => {
          const chiTietList = item.chiTiet || [];
          return (
            <View style={styles.orderBody}>
              <Text style={styles.itemsLabel}>
                {chiTietList.length} sản phẩm
              </Text>
              {chiTietList.slice(0, 2).map((detail, index) => (
                <Text key={index} style={styles.itemName} numberOfLines={1}>
                  • {detail.tenTacPham || 'Tác phẩm'} (x{detail.soLuong || 1})
                </Text>
              ))}
              {chiTietList.length > 2 && (
                <Text style={styles.moreItems}>
                  và {chiTietList.length - 2} sản phẩm khác
                </Text>
              )}
            </View>
          );
        })()}

        {/* Footer */}
        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalAmount}>{formatPrice(item.tongTien)}</Text>
          </View>
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>Chi tiết →</Text>
          </TouchableOpacity>
        </View>

        {/* Cancelled reason */}
        {item.trangThai === 4 && item.lyDoHuy && (
          <View style={styles.cancelledNote}>
            <Text style={styles.cancelledLabel}>Lý do hủy:</Text>
            <Text style={styles.cancelledText}>{item.lyDoHuy}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <EmptyState
          title="Bạn chưa đăng nhập"
          message="Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn."
          actionText="Đăng nhập ngay"
          onAction={() => navigation.navigate('Login')}
          emoji="📦"
        />
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải đơn hàng..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <ErrorMessage message={error} onRetry={loadOrders} />
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <EmptyState
          message="Chưa có đơn hàng nào"
          description="Các đơn hàng của bạn sẽ hiển thị ở đây"
          actionText="Khám phá ngay"
          onAction={() => navigation.navigate('Products')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.maDonHang.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<Footer navigation={navigation} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
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
  orderBody: {
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  detailButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  cancelledNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  cancelledLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelledText: {
    fontSize: 12,
    color: '#7f1d1d',
  },
});
