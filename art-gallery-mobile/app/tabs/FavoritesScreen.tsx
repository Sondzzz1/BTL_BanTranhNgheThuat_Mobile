import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { favoriteService } from '../../services/favoriteService';
import { FavoriteItem } from '../../types';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';
import AppHeader from '../../components/AppHeader';
import Colors from '../../constants/colors';

interface FavoritesScreenProps {
  navigation: any;
}

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFavorites();
      } else {
        setIsLoading(false);
        setFavorites([]);
      }
    }, [user])
  );

  const loadFavorites = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      if (error.response?.status === 401) {
        setFavorites([]);
      }
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

  if (!user) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>❤️</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' }}>
            Bạn chưa đăng nhập
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Đăng nhập ngay để xem và quản lý danh sách tác phẩm yêu thích của bạn.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#ea580c', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải danh sách yêu thích..." />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <EmptyState
          title="Chưa có tác phẩm yêu thích"
          message="Hãy khám phá các tác phẩm nghệ thuật và thêm vào danh sách yêu thích của bạn!"
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
