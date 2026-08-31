import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { Cart } from '../types/cart';
import Loading from '../components/Loading';

interface CheckoutScreenProps {
  navigation: any;
}

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    tenNguoiNhan: '',
    soDienThoai: '',
    diaChiGiao: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cartData, profileData] = await Promise.all([
        cartService.getCart(),
        customerService.getProfile(),
      ]);
      
      setCart(cartData);
      
      // Pre-fill with profile data
      setFormData({
        tenNguoiNhan: profileData.ten || '',
        soDienThoai: profileData.dienThoai || '',
        diaChiGiao: profileData.diaChi || '',
      });
    } catch (err: any) {
      console.error('Error loading checkout data:', err);
      Alert.alert('Lỗi', 'Không thể tải thông tin');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.tenNguoiNhan.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người nhận');
      return false;
    }

    if (!formData.soDienThoai.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.soDienThoai.trim())) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (10-11 số)');
      return false;
    }

    if (!formData.diaChiGiao.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (!cart || cart.chiTiet.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống');
      return;
    }

    Alert.alert(
      'Xác nhận đặt hàng',
      `Tổng tiền: ${formatPrice(calculateTotal())}\n\nBạn có chắc muốn đặt hàng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt hàng',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const result = await orderService.createOrder(
                formData.tenNguoiNhan.trim(),
                formData.soDienThoai.trim(),
                formData.diaChiGiao.trim()
              );
              
              // Navigate to success screen
              navigation.replace('OrderSuccess', { orderId: result.maDonHang });
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể đặt hàng');
            } finally {
              setIsSubmitting(false);
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

  const calculateTotal = (): number => {
    if (!cart) return 0;
    return cart.chiTiet.reduce((sum, item) => sum + item.thanhTien, 0);
  };

  if (isLoading) {
    return <Loading message="Đang tải thông tin..." />;
  }

  if (!cart || cart.chiTiet.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Giỏ hàng trống</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn hàng của bạn</Text>
          {cart.chiTiet.map((item) => (
            <View key={item.maChiTietGH} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={2}>
                  {item.tenTacPham}
                </Text>
                <Text style={styles.orderItemQuantity}>x{item.soLuong}</Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.thanhTien)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên người nhận *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên người nhận"
              value={formData.tenNguoiNhan}
              onChangeText={(text) => handleInputChange('tenNguoiNhan', text)}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại (10-11 số)"
              value={formData.soDienThoai}
              onChangeText={(text) => handleInputChange('soDienThoai', text)}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Địa chỉ giao hàng *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập địa chỉ đầy đủ"
              value={formData.diaChiGiao}
              onChangeText={(text) => handleInputChange('diaChiGiao', text)}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ℹ️ Đơn hàng sẽ được xác nhận trong vòng 24h. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng".
          </Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.footerTotalAmount}>{formatPrice(calculateTotal())}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, isSubmitting && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  footerTotalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  placeOrderButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
