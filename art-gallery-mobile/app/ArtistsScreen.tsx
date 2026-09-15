import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { artistService, Artist } from '../services/artistService';

export default function ArtistsScreen({ navigation }: any) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const data = await artistService.getAllArtists();
      setArtists(data);
    } catch (error) {
      console.error('Error loading artists:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArtists();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Ionicons name="palette" size={48} color="#fff" />
          <Text style={styles.heroTitle}>Họa Sĩ</Text>
          <Text style={styles.heroSubtitle}>
            Khám phá những nghệ sĩ tài năng
          </Text>
        </View>
      </View>

      {/* Introduction */}
      <View style={styles.introSection}>
        <Text style={styles.introTitle}>Về các họa sĩ của chúng tôi</Text>
        <Text style={styles.introText}>
          LanVu Gallery tự hào hợp tác với những họa sĩ tài năng, những người đam mê nghệ thuật 
          và không ngừng sáng tạo để mang đến những tác phẩm tranh sơn dầu độc đáo, mang đậm 
          giá trị nghệ thuật và văn hóa Việt Nam.
        </Text>
      </View>

      {/* Artists Grid */}
      <View style={styles.artistsSection}>
        {loading ? (
          <Text style={styles.loadingText}>Đang tải danh sách họa sĩ...</Text>
        ) : artists.length > 0 ? (
          artists.map((artist) => (
            <TouchableOpacity
              key={artist.maHoaSi}
              style={styles.artistCard}
              onPress={() => {
                // TODO: Navigate to artist detail
                // navigation.navigate('ArtistDetail', { artistId: artist.maHoaSi });
              }}
            >
              <Image
                source={{ 
                  uri: artist.anhDaiDien || 'https://via.placeholder.com/300x300' 
                }}
                style={styles.artistImage}
                resizeMode="cover"
              />
              <View style={styles.artistOverlay}>
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{artist.tenHoaSi}</Text>
                  <View style={styles.artistStats}>
                    <Ionicons name="images-outline" size={16} color="#fff" />
                    <Text style={styles.artistStatsText}>
                      {artist.soTacPham} tác phẩm
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Chưa có thông tin họa sĩ</Text>
          </View>
        )}
      </View>

      {/* Featured Artist Section - Lân Vũ */}
      <View style={styles.featuredSection}>
        <Text style={styles.featuredBadge}>HỌA SĨ NỔI BẬT</Text>
        <Text style={styles.featuredTitle}>Họa sĩ, Kiến trúc sư Lân Vũ</Text>
        <Text style={styles.featuredSubtitle}>Nhà sáng lập LanVu Gallery</Text>
        
        <Image
          source={{ uri: 'https://via.placeholder.com/400x500' }}
          style={styles.featuredImage}
          resizeMode="cover"
        />

        <View style={styles.featuredContent}>
          <Text style={styles.featuredDescription}>
            Họa sĩ Lân Vũ, sinh năm 1994, tốt nghiệp khoa Quy hoạch, Đại học Kiến trúc Hà Nội. 
            Với niềm đam mê mãnh liệt với nghệ thuật hội họa, anh đã quyết định theo đuổi sự nghiệp 
            hội họa và thành lập LanVu Gallery.
          </Text>

          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={() => navigation.navigate('About')}
          >
            <Text style={styles.learnMoreText}>Tìm hiểu thêm</Text>
            <Ionicons name="arrow-forward" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Notable Works */}
        <View style={styles.notableWorks}>
          <Text style={styles.notableWorksTitle}>Tác phẩm tiêu biểu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={styles.workCard}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/200x250' }}
                  style={styles.workImage}
                  resizeMode="cover"
                />
                <Text style={styles.workTitle}>Tác phẩm {item}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Join Section */}
      <View style={styles.joinSection}>
        <Ionicons name="add-circle-outline" size={48} color="#2563eb" />
        <Text style={styles.joinTitle}>Bạn là họa sĩ?</Text>
        <Text style={styles.joinText}>
          Hãy tham gia cùng chúng tôi để chia sẻ tác phẩm của bạn với cộng đồng yêu nghệ thuật
        </Text>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Liên hệ hợp tác</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hero: {
    height: 200,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
  },
  introSection: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  artistsSection: {
    padding: 16,
  },
  artistCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  artistImage: {
    width: '100%',
    height: 300,
  },
  artistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  artistStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistStatsText: {
    fontSize: 14,
    color: '#e5e7eb',
    marginLeft: 6,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredSection: {
    padding: 20,
    backgroundColor: '#fef3c7',
  },
  featuredBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#78350f',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 20,
  },
  featuredImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  featuredContent: {
    marginBottom: 30,
  },
  featuredDescription: {
    fontSize: 15,
    color: '#451a03',
    lineHeight: 22,
    marginBottom: 16,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 6,
  },
  notableWorks: {
    marginTop: 20,
  },
  notableWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#78350f',
    marginBottom: 16,
  },
  workCard: {
    marginRight: 12,
    width: 150,
  },
  workImage: {
    width: 150,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  workTitle: {
    fontSize: 14,
    color: '#451a03',
    fontWeight: '500',
  },
  joinSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginTop: 20,
  },
  joinTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 16,
    marginBottom: 12,
  },
  joinText: {
    fontSize: 15,
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
});
