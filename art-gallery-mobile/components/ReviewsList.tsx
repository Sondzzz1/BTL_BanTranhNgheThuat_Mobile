import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Review } from '../types/review';
import StarRating from './StarRating';
import Colors from '../constants/colors';

interface ReviewsListProps {
  reviews: Review[];
  loading?: boolean;
}

export default function ReviewsList({ reviews, loading = false }: ReviewsListProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.tenNguoiDung.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.tenNguoiDung}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.ngayDanhGia)}</Text>
          </View>
        </View>
        <StarRating rating={item.danhGia} size={16} />
      </View>

      {item.binhLuan && (
        <Text style={styles.reviewComment}>{item.binhLuan}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
        <Text style={styles.emptySubtext}>Hãy là người đầu tiên đánh giá sản phẩm này</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.maDanhGia.toString()}
      renderItem={renderReview}
      contentContainerStyle={styles.listContent}
      scrollEnabled={false} // Disable scroll if inside ScrollView
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
});
