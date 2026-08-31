import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { favoriteService } from '../../services/favoriteService';
import { FavoriteItem } from '../../types';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';
import Colors from '../../constants/colors';

interface FavoritesScreenProps {
  navigation: any;
}

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (artworkId: number) => {
    try {
      await favoriteService.removeFavorite(artworkId);
      setFavorites(prev => prev.filter(item => item.tacPham.maTacPham !== artworkId));
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xóa khỏi danh sách yêu thích');
    }
  };

  const handleItemPress = (artworkId: number) => {
    navigation.navigate('ProductDetail', { id: artworkId });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (isLoading) {
    return <Loading message="Đang tải danh sách yêu thích..." />;
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        title="Chưa có tác phẩm yêu thích"
        message="Hãy khám phá các tác phẩm nghệ thuật và thêm vào danh sách yêu thích của bạn!"
        actionText="Khám phá ngay"
        onAction={() => navigation.navigate('Products')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.maYeuThich.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListFooterComponent={<Footer navigation={navigation} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const artwork = item.tacPham;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleItemPress(artwork.maTacPham)}
              activeOpacity={0.8}
            >
              {artwork.hinhAnh ? (
                <Image source={{ uri: artwork.hinhAnh }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={{ fontSize: 32 }}>🖼️</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{artwork.tenTacPham}</Text>
                <Text style={styles.artist}>👨‍🎨 {artwork.tenHoaSi}</Text>
                <Text style={styles.price}>{formatPrice(artwork.gia)}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavorite(artwork.maTacPham)}
              >
                <Text style={styles.removeButtonText}>❤️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
  },
});
