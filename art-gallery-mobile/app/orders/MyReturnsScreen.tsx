import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { returnService } from '../../services/returnService';
import {
  YeuCauHoanTra,
  RETURN_STATUS_TEXT,
  RETURN_STATUS_COLOR,
  RETURN_STATUS_BG,
  RETURN_REASONS,
} from '../../types/return';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

interface MyReturnsScreenProps {
  navigation: any;
}

export default function MyReturnsScreen({ navigation }: MyReturnsScreenProps) {
  const { user } = useAuth();
  const [returns, setReturns] = useState<YeuCauHoanTra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) loadReturns();
      else setIsLoading(false);
    }, [user])
  );

  const loadReturns = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await returnService.getMyReturns();
      setReturns(data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách hoàn trả');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReturns();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getLyDoLabel = (lyDo: string): string => {
    const found = RETURN_REASONS.find((r) => r.value === lyDo);
    return found ? found.label : lyDo;
  };

  const renderItem = ({ item }: { item: YeuCauHoanTra }) => {
    const statusText = RETURN_STATUS_TEXT[item.trangThai] ?? item.trangThai;
    const statusColor = RETURN_STATUS_COLOR[item.trangThai] ?? '#6b7280';
    const statusBg = RETURN_STATUS_BG[item.trangThai] ?? '#f3f4f6';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReturnDetail', { returnId: item.maYeuCau })}
        activeOpacity={0.7}
      >
        {/* Ảnh và thông tin sản phẩm */}
        <View style={styles.cardTop}>
          <View style={styles.imageContainer}>
            {item.hinhAnhTacPham ? (
              <Image
                source={{ uri: item.hinhAnhTacPham }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>🖼️</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.tenTacPham || 'Sản phẩm'}
            </Text>
            <Text style={styles.orderCode}>Đơn hàng #{item.maDonHang}</Text>
            <Text style={styles.dateText}>{formatDate(item.ngayTao)}</Text>
          </View>
          {/* Badge trạng thái */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Lý do */}
        <View style={styles.reasonRow}>
          <Text style={styles.reasonLabel}>Lý do: </Text>
          <Text style={styles.reasonValue}>{getLyDoLabel(item.lyDo)}</Text>
        </View>

        {/* Xem chi tiết */}
        <View style={styles.cardFooter}>
          <Text style={styles.viewDetail}>Xem chi tiết →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <EmptyState
        title="Bạn chưa đăng nhập"
        message="Vui lòng đăng nhập để xem danh sách hoàn trả"
        actionText="Đăng nhập"
        onAction={() => navigation.navigate('Login')}
        emoji="🔒"
      />
    );
  }

  if (isLoading && !refreshing) {
    return <Loading message="Đang tải yêu cầu hoàn trả..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadReturns} />;
  }

  if (returns.length === 0) {
    return (
      <EmptyState
        emoji="📦"
        title="Chưa có yêu cầu hoàn trả"
        message="Khi bạn gửi yêu cầu hoàn trả sản phẩm, chúng sẽ hiển thị ở đây"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={returns}
        keyExtractor={(item) => item.maYeuCau.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListHeaderComponent={
          <Text style={styles.listHeader}>{returns.length} yêu cầu hoàn trả</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
    flexShrink: 0,
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
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderCode: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 2,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  reasonValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  viewDetail: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
});
