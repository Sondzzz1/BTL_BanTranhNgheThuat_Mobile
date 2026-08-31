import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface OrderSuccessScreenProps {
  route: any;
  navigation: any;
}

export default function OrderSuccessScreen({
  route,
  navigation,
}: OrderSuccessScreenProps) {
  const orderId = route.params?.orderId;

  const handleViewOrder = () => {
    navigation.navigate('MainTabs', {
      screen: 'Orders',
      params: { orderId },
    });
  };

  const handleContinueShopping = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>
          Cảm ơn bạn đã đặt hàng tại Art Gallery
        </Text>

        {/* Order Info */}
        {orderId && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Mã đơn hàng:</Text>
            <Text style={styles.orderNumber}>#{orderId}</Text>
          </View>
        )}

        <Text style={styles.description}>
          Đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận.
          {'\n\n'}
          Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.
          {'\n\n'}
          Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng".
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewOrder}
          >
            <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueShopping}
          >
            <Text style={styles.secondaryButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
