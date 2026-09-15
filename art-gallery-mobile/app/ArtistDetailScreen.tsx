import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { artistService, ArtistDetail, ArtistArtwork } from '../services/artistService';
import Loading from '../components/Loading';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns

interface ArtistDetailScreenProps {
  navigation: any;
  route: any;
}

export default function ArtistDetailScreen({ navigation, route }: ArtistDetailScreenProps) {
  const { artistId, artistName } = route.params;
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArtistDetail();
  }, [artistId]);

  const loadArtistDetail = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await artistService.getArtistById(artistId);
      setArtist(data);
    } catch (err: any) {
      console.error('Error loading artist detail:', err);
      setError(err.message || 'Không thể tải thông tin họa sĩ');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArtistDetail();
    setRefreshing(false);
  };

  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetail', { id: productId });
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải thông tin họa sĩ..." />
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin họa sĩ'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadArtistDetail}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Artist Header with Image */}
        <View style={styles.header}>
          <Image
            source={{ uri: artist.anhDaiDien }}
            style={styles.artistImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.artistName}>{artist.tenHoaSi}</Text>
            {artist.soTacPham !== undefined && (
              <Text style={styles.artistWorks}>
                {artist.soTacPham} tác phẩm
              </Text>
            )}
          </View>
        </View>

        {/* Contact Information */}
        {(artist.email || artist.soDienThoai || artist.diaChi) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.contactCard}>
              {artist.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail" size={20} color="#2563eb" />
                  <Text style={styles.contactText}>{artist.email}</Text>
                </View>
              )}
              {artist.soDienThoai && (
                <View style={styles.contactRow}>
                  <Ionicons name="call" size={20} color="#2563eb" />
                  <Text style={styles.contactText}>{artist.soDienThoai}</Text>
                </View>
              )}
              {artist.diaChi && (
                <View style={styles.contactRow}>
                  <Ionicons name="location" size={20} color="#2563eb" />
                  <Text style={styles.contactText}>{artist.diaChi}</Text>
                </View>
              )}
              {artist.website && (
                <View style={styles.contactRow}>
                  <Ionicons name="globe" size={20} color="#2563eb" />
                  <Text style={styles.contactText}>{artist.website}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Biography */}
        {artist.tieuSu && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiểu sử</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{artist.tieuSu}</Text>
            </View>
          </View>
        )}

        {/* Artworks Section */}
        {artist.cacTacPham && artist.cacTacPham.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tác phẩm của {artist.tenHoaSi} ({artist.cacTacPham.length})
            </Text>
            
            <View style={styles.productsGrid}>
              {artist.cacTacPham.map((work) => (
                <TouchableOpacity
                  key={work.maTacPham}
                  style={styles.productCard}
                  onPress={() => handleProductPress(work.maTacPham)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: work.hinhAnh }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    {work.trangThai !== 'available' && (
                      <View style={styles.soldBadge}>
                        <Text style={styles.soldText}>Đã bán</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.artistLabel}>{artist.tenHoaSi}</Text>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {work.tenTacPham}
                    </Text>
                    <Text style={styles.productStatus}>
                      {work.trangThai === 'available' ? 'Liên hệ' : 'Đã bán'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="images-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Họa sĩ chưa có tác phẩm nào</Text>
          </View>
        )}

        <Footer navigation={navigation} />
      </ScrollView>
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
  header: {
    position: 'relative',
    height: 400,
    backgroundColor: '#e5e7eb',
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 24,
  },
  artistName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  artistWorks: {
    fontSize: 16,
    color: '#d1d5db',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactText: {
    fontSize: 15,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
  },
  bioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bioText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: cardWidth,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: cardWidth,
    backgroundColor: '#4a5568',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  artistLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  productStatus: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
