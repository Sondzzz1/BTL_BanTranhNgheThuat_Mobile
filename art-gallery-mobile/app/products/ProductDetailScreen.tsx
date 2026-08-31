import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { Product } from '../../types/product';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import Footer from '../../components/Footer';

interface ProductDetailScreenProps {
  route: any;
  navigation: any;
}

export default function ProductDetailScreen({
  route,
  navigation,
}: ProductDetailScreenProps) {
  const { user, isAuthenticated } = useAuth();
  const productId = route.params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductDetail();
    }
  }, [productId]);

  const loadProductDetail = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [productData, suggestionsData] = await Promise.all([
        productService.getProductById(productId),
        productService.getProductSuggestions(productId),
      ]);

      setProduct(productData);
      setSuggestions(suggestionsData);
    } catch (err: any) {
      console.error('Error loading product detail:', err);
      setError(err.message || 'Không thể tải thông tin sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncreaseQuantity = () => {
    if (product && quantity < product.soLuong) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert('Thông báo', `Chỉ còn ${product?.soLuong} sản phẩm trong kho`);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const checkAuthCanBuy = (): boolean => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return false;
    }

    if (user.role === 'admin' || user.role === 'author') {
      Alert.alert('Thông báo', 'Tài khoản Quản trị / Họa sĩ không thể mua hàng');
      return false;
    }

    return true;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.soLuong === 0) {
      Alert.alert('Thông báo', 'Sản phẩm đã hết hàng');
      return;
    }

    if (!checkAuthCanBuy()) return;

    try {
      setIsAddingToCart(true);
      await cartService.addToCart(product.maTacPham, quantity);
      Alert.alert(
        'Thành công',
        'Đã thêm sản phẩm vào giỏ hàng!',
        [
          { text: 'Tiếp tục xem', style: 'cancel' },
          {
            text: 'Xem giỏ hàng',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Mua ngay: thêm vào giỏ rồi navigate thẳng đến Checkout (giống React web)
  const handleBuyNow = async () => {
    if (!product) return;

    if (product.soLuong === 0) {
      Alert.alert('Thông báo', 'Sản phẩm đã hết hàng');
      return;
    }

    if (!checkAuthCanBuy()) return;

    try {
      setIsAddingToCart(true);
      await cartService.addToCart(product.maTacPham, quantity);
      navigation.navigate('Checkout');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSuggestionPress = (suggestionId: number) => {
    navigation.push('ProductDetail', { id: suggestionId });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (isLoading) {
    return <Loading message="Đang tải thông tin..." />;
  }

  if (error || !product) {
    return <ErrorMessage message={error || 'Không tìm thấy sản phẩm'} onRetry={loadProductDetail} />;
  }

  const isOutOfStock = product.soLuong === 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.hinhAnh ? (
            <Image
              source={{ uri: product.hinhAnh }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🖼️</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Hết hàng</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.tenTacPham}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.artist}>👨‍🎨 {product.tenHoaSi}</Text>
            {product.tenDanhMuc && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.tenDanhMuc}</Text>
              </View>
            )}
          </View>

          <Text style={styles.price}>{formatPrice(product.gia)}</Text>

          {/* Details */}
          {product.moTa && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{product.moTa}</Text>
            </View>
          )}

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông số</Text>
            {product.kichThuoc && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Kích thước:</Text>
                <Text style={styles.specValue}>{product.kichThuoc}</Text>
              </View>
            )}
            {product.chatLieu && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Chất liệu:</Text>
                <Text style={styles.specValue}>{product.chatLieu}</Text>
              </View>
            )}
            {product.chatLieuKhung && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Khung:</Text>
                <Text style={styles.specValue}>{product.chatLieuKhung}</Text>
              </View>
            )}
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Tình trạng:</Text>
              <Text style={[styles.specValue, isOutOfStock ? styles.outOfStockLabel : styles.inStockLabel]}>
                {isOutOfStock ? 'Hết hàng' : `Còn ${product.soLuong} sản phẩm`}
              </Text>
            </View>
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sản phẩm tương tự</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.maTacPham}
                    style={styles.suggestionCard}
                    onPress={() => handleSuggestionPress(item.maTacPham)}
                  >
                    {item.hinhAnh ? (
                      <Image
                        source={{ uri: item.hinhAnh }}
                        style={styles.suggestionImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.suggestionImagePlaceholder}>
                        <Text style={styles.suggestionPlaceholderText}>🖼️</Text>
                      </View>
                    )}
                    <Text style={styles.suggestionName} numberOfLines={2}>
                      {item.tenTacPham}
                    </Text>
                    <Text style={styles.suggestionPrice}>
                      {formatPrice(item.gia)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Footer */}
        <Footer navigation={navigation} />
      </ScrollView>

      {/* Bottom Bar - Buy Now & Add to Cart */}
      {!isOutOfStock && (
        <View style={styles.bottomBar}>
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Số lượng:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecreaseQuantity}
                disabled={isAddingToCart}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncreaseQuantity}
                disabled={isAddingToCart}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons - Mua ngay & Thêm vào giỏ */}
          <View style={styles.actionButtonsRow}>
            {/* Mua ngay */}
            <TouchableOpacity
              style={[styles.buyNowButton, isAddingToCart && styles.buttonDisabled]}
              onPress={handleBuyNow}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buyNowButtonText}>🛍️ Mua ngay</Text>
              )}
            </TouchableOpacity>

            {/* Thêm vào giỏ */}
            <TouchableOpacity
              style={[styles.addToCartButton, isAddingToCart && styles.buttonDisabled]}
              onPress={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addToCartButtonText}>🛒 Thêm vào giỏ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 80,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  artist: {
    fontSize: 16,
    color: '#6b7280',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  specLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inStockLabel: {
    color: '#059669',
  },
  outOfStockLabel: {
    color: '#dc2626',
  },
  suggestionCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionImage: {
    width: '100%',
    height: 150,
  },
  suggestionImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionPlaceholderText: {
    fontSize: 48,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    padding: 8,
  },
  suggestionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bottomBar: {
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 32,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#ea580c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
