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
import { newsService, Article } from '../services/newsService';

export default function NewsScreen({ navigation }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await newsService.getAllArticles();
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]+>/g, '');
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
          <Text style={styles.heroTitle}>Tin Tức & Sự Kiện</Text>
          <Text style={styles.heroSubtitle}>
            Cập nhật những thông tin mới nhất về nghệ thuật
          </Text>
        </View>
      </View>

      {/* Featured News */}
      <View style={styles.featuredSection}>
        <View style={styles.featuredCard}>
          <Image
            source={{ uri: 'https://via.placeholder.com/600x400' }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>NỔI BẬT</Text>
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.dateText}>15/01/2025</Text>
            </View>
            <Text style={styles.featuredTitle}>
              Triển lãm tranh "Cảm Từ Cầu" - Họa sĩ Lân Vũ
            </Text>
            <Text style={styles.featuredDescription}>
              Triển lãm tranh đặc biệt của họa sĩ Lân Vũ với chủ đề "Cảm Từ Cầu" 
              sẽ được tổ chức tại LanVu Gallery từ ngày 20/01 đến 28/01/2025...
            </Text>
            <TouchableOpacity style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>Đọc thêm</Text>
              <Ionicons name="arrow-forward" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* News List */}
      <View style={styles.newsSection}>
        <Text style={styles.sectionTitle}>Tin tức mới nhất</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Đang tải tin tức...</Text>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <TouchableOpacity
              key={article.maBaiViet}
              style={styles.newsCard}
              onPress={() => {
                // TODO: Navigate to article detail
              }}
            >
              <Image
                source={{ 
                  uri: article.anhTieuDe || 'https://via.placeholder.com/600x400' 
                }}
                style={styles.newsImage}
                resizeMode="cover"
              />
              <View style={styles.newsContent}>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsCategory}>Tin tức</Text>
                  <View style={styles.newsDate}>
                    <Ionicons name="calendar-outline" size={14} color="#999" />
                    <Text style={styles.newsDateText}>
                      {formatDate(article.ngayDang)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {article.tieuDe}
                </Text>
                <Text style={styles.newsDescription} numberOfLines={3}>
                  {stripHtml(article.noiDung)}
                </Text>
                <Text style={styles.newsAuthor}>
                  Đăng bởi: <Text style={styles.newsAuthorName}>{article.tenHoaSi}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Hiện tại chưa có tin tức nào</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    height: 200,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    textAlign: 'center',
  },
  featuredSection: {
    padding: 16,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredContent: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 4,
  },
  newsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: 16,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  newsDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsDateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  newsAuthor: {
    fontSize: 13,
    color: '#9ca3af',
  },
  newsAuthorName: {
    fontWeight: '600',
    color: '#374151',
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
