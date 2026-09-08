import React, { useState, useCallback } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { favoriteService } from '../../services/favoriteService';
import { FavoriteWithProduct } from '../../types/favorite';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Colors from '../../constants/colors';

interface FavoritesScreenProps {
  navigation: any;
}

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadFavorites();
      } else {
        setIsLoading(false);
        setError(null);
        setFavorites([]);
      }
    }, [isAuthenticated])
  );

  const loadFavorites = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await favoriteService.getMyFavorites();
      setFavorites(data);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
      setError(err.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemove = (favorite: FavoriteWithProduct) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa khỏi danh sách yêu thích?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteService.removeFavorite(favorite.tacPham.maTacPham);
              await loadFavorites();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa');
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (favorite: FavoriteWithProduct) => {
    navigation.navigate('ProductDetail', { id: favorite.tacPham.maTacPham });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const renderItem = ({ item }: { item: FavoriteWithProduct }) => {
    const isOutOfStock = item.tacPham.soLuong === 0;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        {/* Product Image with Heart Icon */}
        <View style={styles.imageContainer}>
          {item.tacPham.hinhAnh ? (
            <Image
              source={{ uri: item.tacPham.hinhAnh }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🖼️</Text>
            </View>
          )}
          
          {/* Heart Icon Overlay */}
          <View style={styles.heartOverlay}>
              <Ionicons
               name="heart"
               size={20}
               color="#ec0d0dff"
              />
            </View>
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Hết hàng</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={styles.title} numberOfLines={2}>
              {item.tacPham.tenTacPham}
            </Text>
            
            <View style={styles.metaInfo}>
              <Text style={styles.artist} numberOfLines={1}>
                👨‍🎨 {item.tacPham.tenHoaSi}
              </Text>
              {item.tacPham.tenDanhMuc && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.tacPham.tenDanhMuc}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Price and Stock */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(item.tacPham.gia)}</Text>
              <Text style={styles.stockInfo}>
                {isOutOfStock ? '⚠️ Hết hàng' : `✓ Còn ${item.tacPham.soLuong} SP`}
              </Text>
            </View>
          </View>

          {/* Footer with Date and Remove Button */}
          <View style={styles.footer}>
            <View style={styles.dateContainer}>
  <Ionicons
    name="calendar-outline"
    size={14}
    color="#9ca3af"
  />

  <Text style={styles.dateAdded}>
    {formatDate(item.ngayThem)}
  </Text>
</View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
            >
              <Text style={styles.removeIcon}>🗑️</Text>
              <Text style={styles.removeButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading message="Đang tải danh sách yêu thích..." />;
  }

  // Kiểm tra đăng nhập
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <EmptyState
            message="Vui lòng đăng nhập"
            description="Bạn cần đăng nhập để xem danh sách yêu thích"
          />
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.browseButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ErrorMessage message={error} onRetry={loadFavorites} />
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <EmptyState
            message="Chưa có sản phẩm yêu thích"
            description="Hãy thêm sản phẩm yêu thích bằng cách nhấn ❤️"
          />
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.browseButtonText}>Xem sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with count */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Yêu thích của tôi</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length} sản phẩm
            </Text>
          </View>
          <TouchableOpacity
            style={styles.browseAllButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.browseAllText}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.maYeuThich.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  browseAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  browseAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: 140,
    height: 180,
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#e5e7eb',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  heartOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heartIcon: {
    fontSize: 20,
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  infoTop: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  metaInfo: {
    marginBottom: 8,
  },
  artist: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceSection: {
    marginVertical: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  stockInfo: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dateAdded: {
    fontSize: 11,
    color: '#9ca3af',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  removeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  browseButton: {
    margin: 16,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
