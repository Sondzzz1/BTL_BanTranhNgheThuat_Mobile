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
import { artistService, Artist } from '../services/artistService';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

interface ArtistsScreenProps {
  navigation: any;
}

export default function ArtistsScreen({ navigation }: ArtistsScreenProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await artistService.getAllArtists();
      setArtists(data);
    } catch (err: any) {
      console.error('Error loading artists:', err);
      setError(err.message || 'Không thể tải danh sách họa sĩ');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArtists();
    setRefreshing(false);
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', { 
      artistId: artist.maHoaSi,
      artistName: artist.tenHoaSi 
    });
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải danh sách họa sĩ..." />
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
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="palette" size={48} color="#7c3aed" />
          </View>
          <Text style={styles.heroTitle}>Họa Sĩ</Text>
          <Text style={styles.heroSubtitle}>
            Khám phá những tài năng nghệ thuật xuất sắc
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadArtists}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : artists.length === 0 ? (
          <EmptyState
            icon="people-outline"
            message="Chưa có họa sĩ nào"
            description="Danh sách họa sĩ sẽ được cập nhật sớm"
          />
        ) : (
          <View style={styles.content}>
            {/* Artists Grid */}
            <View style={styles.artistsGrid}>
              {artists.map((artist) => (
                <TouchableOpacity
                  key={artist.maHoaSi}
                  style={styles.artistCard}
                  onPress={() => handleArtistPress(artist)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: artist.anhDaiDien }}
                    style={styles.artistImage}
                    resizeMode="cover"
                  />
                  <View style={styles.artistOverlay}>
                    <Text style={styles.artistName} numberOfLines={2}>
                      {artist.tenHoaSi}
                    </Text>
                    {artist.soTacPham !== undefined && (
                      <Text style={styles.artistWorks}>
                        {artist.soTacPham} tác phẩm
                      </Text>
                    )}
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
  hero: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 16,
  },
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artistCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  artistImage: {
    width: '100%',
    height: cardWidth * 1.2,
    backgroundColor: '#e5e7eb',
  },
  artistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 12,
  },
  artistName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artistWorks: {
    fontSize: 12,
    color: '#d1d5db',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
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
