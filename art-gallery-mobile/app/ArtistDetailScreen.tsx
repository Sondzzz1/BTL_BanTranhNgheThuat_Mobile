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
import { artistService, ArtistDetail } from '../services/artistService';
import Loading from '../components/Loading';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');

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

        {/* Artworks */}
        {artist.cacTacPham && artist.cacTacPham.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tác phẩm ({artist.cacTacPham.length})</Text>
            <View style={styles.worksGrid}>
              {artist.cacTacPham.map((work) => (
                <TouchableOpacity
                  key={work.maTacPham}
                  style={styles.workCard}
                  onPress={() => navigation.navigate('ProductDetail', { id: work.maTacPham })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: work.hinhAnh }}
                    style={styles.workImage}
                    resizeMode="cover"
                  />
                  <View style={styles.workInfo}>
                    <Text style={styles.workTitle} numberOfLines={1}>
                      {work.tenTacPham}
                    </Text>
                    <Text style={styles.workPrice}>
                      {work.gia.toLocaleString('vi-VN')} ₫
                    </Text>
                    <View style={[
                      styles.workStatus,
                      work.trangThai === 'available' ? styles.workAvailable : styles.workSold
                    ]}>
                      <Text style={styles.workStatusText}>
                        {work.trangThai === 'available' ? 'Còn hàng' : 'Đã bán'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
  worksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workImage: {
    width: '100%',
    height: (width - 48) / 2,
    backgroundColor: '#e5e7eb',
  },
  workInfo: {
    padding: 12,
  },
  workTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  workPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 8,
  },
  workStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  workAvailable: {
    backgroundColor: '#d1fae5',
  },
  workSold: {
    backgroundColor: '#fee2e2',
  },
  workStatusText: {
    fontSize: 11,
    fontWeight: '600',
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
