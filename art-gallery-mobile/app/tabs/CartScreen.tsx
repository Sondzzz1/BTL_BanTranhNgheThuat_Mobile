import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { cartService } from '../../services/cartService';
import { Cart, CartItem } from '../../types/cart';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';
import AppHeader from '../../components/AppHeader';

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
  const [isClearing, setIsClearing] = useState(false);

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
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err: any) {
      console.error('Error loading cart:', err);
      if (err.response?.status === 401) {
        setCart(null);
      } else {
        setError(err.message || 'Không thể tải giỏ hàng');
      }
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

    if (item.soLuongTon && newQuantity > item.soLuongTon) {
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
      `Bạn có chắc muốn xóa "${item.tenTacPham}" khỏi giỏ hàng?`,
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

  const handleClearCart = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await cartService.clearCart();
              await loadCart();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa giỏ hàng');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    const items = cart?.danhSachSanPham || [];
    if (items.length === 0) {
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
    }).format(price || 0);
  };

  const calculateTotal = (): number => {
    if (!cart) return 0;
    if (cart.tongTien && cart.tongTien > 0) return cart.tongTien;
    return (cart.danhSachSanPham || []).reduce(
      (sum, item) => sum + (item.thanhTien || item.gia * item.soLuong),
      0
    );
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
          {item.tenHoaSi ? (
            <Text style={styles.itemArtist} numberOfLines={1}>
              👨‍🎨 {item.tenHoaSi}
            </Text>
          ) : null}
          <Text style={styles.itemPrice}>{formatPrice(item.gia)}</Text>
          
          {/* Subtotal & Quantity row */}
          <View style={styles.bottomRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item, item.soLuong - 1)}
                disabled={isUpdating}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>
                {isUpdating ? '...' : item.soLuong}
              </Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item, item.soLuong + 1)}
                disabled={isUpdating}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemSubtotal}>
              <Text style={styles.subtotalLabel}>Tạm tính: </Text>
              <Text style={styles.itemSubtotalText}>
                {formatPrice(item.thanhTien || item.gia * item.soLuong)}
              </Text>
            </View>
          </View>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
          disabled={isUpdating}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
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

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải giỏ hàng..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <ErrorMessage message={error} onRetry={loadCart} />
      </View>
    );
  }

  const items = cart?.danhSachSanPham || [];

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <EmptyState
          message="Giỏ hàng trống"
          description="Hãy thêm các tác phẩm nghệ thuật bạn yêu thích vào giỏ hàng"
        />
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.browseButtonText}>Khám phá tác phẩm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      {/* Header Info Bar */}
      <View style={styles.cartHeaderBar}>
        <Text style={styles.cartCountText}>
          Có {items.length} tác phẩm trong giỏ
        </Text>
        <TouchableOpacity
          style={styles.clearCartButton}
          onPress={handleClearCart}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text style={styles.clearCartText}>🗑️ Xóa giỏ hàng</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
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
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Tiến hành thanh toán</Text>
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
  cartHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cartCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearCartButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearCartText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  itemImageContainer: {
    width: 90,
    height: 90,
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
    paddingRight: 24,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemArtist: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  itemSubtotal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSubtotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: 'bold',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: 22,
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

