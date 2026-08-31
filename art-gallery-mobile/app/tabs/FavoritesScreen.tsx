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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
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

  const renderItem = ({ item }: { item: FavoriteWithProduct }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.tacPham.anhTranh ? (
          <Image
            source={{ uri: item.tacPham.anhTranh }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🖼️</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.tacPham.tenTacPham}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.tacPham.tenHoaSi}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.tacPham.tenDanhMuc}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatPrice(item.tacPham.gia)}</Text>
            <Text style={styles.dateAdded}>
              Thêm {formatDate(item.ngayThem)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
          >
            <Text style={styles.removeButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loading message="Đang tải danh sách yêu thích..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadFavorites} />;
  }

  if (favorites.length === 0) {
    return (
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
    );
  }

  return (
    <View style={styles.container}>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.backgroundLight,
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
    fontSize: 40,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  dateAdded: {
    fontSize: 11,
    color: Colors.gray,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.errorDark,
    borderRadius: 8,
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 14,
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
