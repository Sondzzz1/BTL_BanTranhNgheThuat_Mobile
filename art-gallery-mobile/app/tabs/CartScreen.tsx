import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { cartService } from '../../services/cartService';
import { Cart, CartItem } from '../../types/cart';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';

interface CartScreenProps {
  navigation: any;
}

export default function CartScreen({ navigation }: CartScreenProps) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  // Reload cart when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadCart();
      } else {
        setIsLoading(false);
      }
    }, [user])
  );

  const loadCart = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err: any) {
      console.error('Error loading cart:', err);
      setError(err.message || 'Không thể tải giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(item);
      return;
    }

    if (newQuantity > item.soLuongTon) {
      Alert.alert('Thông báo', `Chỉ còn ${item.soLuongTon} sản phẩm trong kho`);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(item.maChiTietGH));
      await cartService.updateCartItem(item.maChiTietGH, newQuantity);
      await loadCart();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật giỏ hàng');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.maChiTietGH);
        return newSet;
      });
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.removeFromCart(item.maChiTietGH);
              await loadCart();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!cart || !cart.chiTiet || cart.chiTiet.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống');
      return;
    }

    // Navigate to Checkout screen
    navigation.navigate('Checkout');
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

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updatingItems.has(item.maChiTietGH);

    return (
      <View style={styles.cartItem}>
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
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.tenTacPham}
          </Text>
          <Text style={styles.itemPrice}>{formatPrice(item.gia)}</Text>
          <Text style={styles.itemStock}>Còn {item.soLuongTon} sản phẩm</Text>
        </View>

        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item, item.soLuong - 1)}
            disabled={isUpdating}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.soLuong}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item, item.soLuong + 1)}
            disabled={isUpdating}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
          disabled={isUpdating}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Subtotal */}
        <View style={styles.itemSubtotal}>
          <Text style={styles.itemSubtotalText}>
            {formatPrice(item.thanhTien)}
          </Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Bạn chưa đăng nhập"
          message="Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn."
          actionText="Đăng nhập ngay"
          onAction={() => navigation.navigate('Login')}
          emoji="🛒"
        />
      </View>
    );
  }

  if (isLoading) {
    return <Loading message="Đang tải giỏ hàng..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadCart} />;
  }

  if (!cart || !cart.chiTiet || cart.chiTiet.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          message="Giỏ hàng trống"
          description="Hãy thêm sản phẩm vào giỏ hàng"
        />
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.browseButtonText}>Xem sản phẩm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.chiTiet}
        keyExtractor={(item) => item.maChiTietGH.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<Footer navigation={navigation} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
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
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
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
  },
  itemImagePlaceholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  itemSubtotal: {
    position: 'absolute',
    top: 12,
    right: 40,
  },
  itemSubtotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  browseButton: {
    margin: 16,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
