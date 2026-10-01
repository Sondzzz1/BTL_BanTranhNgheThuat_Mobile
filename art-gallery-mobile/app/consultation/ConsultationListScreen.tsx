import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationService } from '../../services/consultationService';
import { ConsultationBooking, ConsultationStatus } from '../../types/consultation';
import ServiceTheme from '../../constants/serviceTheme';

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  Draft: 'Bản nháp',
  Submitted: 'Đã gửi',
  Confirmed: 'Đã xác nhận',
  Rejected: 'Từ chối',
  InProgress: 'Đang tư vấn',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

const STATUS_STYLES: Record<ConsultationStatus, { backgroundColor: string; color: string }> = {
  Draft: { backgroundColor: '#ece7df', color: '#675e55' },
  Submitted: { backgroundColor: '#fff0d8', color: '#8b591d' },
  Confirmed: { backgroundColor: '#e1ebf7', color: '#285780' },
  Rejected: { backgroundColor: '#fbe3df', color: '#9a3327' },
  InProgress: { backgroundColor: '#e8e2f5', color: '#5e438b' },
  Completed: { backgroundColor: '#deefe5', color: '#2f6a49' },
  Cancelled: { backgroundColor: '#eee9e4', color: '#6f6257' },
};

export default function ConsultationListScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setBookings(await consultationService.getMine());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể tải lịch tư vấn của bạn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderCopy}>
            <Text style={styles.eyebrow}>TƯ VẤN NGHỆ THUẬT</Text>
            <Text style={styles.pageTitle}>Lịch của tôi</Text>
            <Text style={styles.pageSubtitle}>{bookings.length} yêu cầu đã lưu trên hệ thống</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ConsultationBooking')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Gửi mới</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={ServiceTheme.accent} />
            <Text style={styles.stateText}>Đang tải lịch tư vấn...</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => String(item.maLichTuVan)}
            contentContainerStyle={[styles.list, bookings.length === 0 && styles.emptyList]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={ServiceTheme.accent} />}
            ListHeaderComponent={error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={22} color={ServiceTheme.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => load()}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity>
              </View>
            ) : null}
            ListEmptyComponent={error ? null : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={30} color={ServiceTheme.accentDark} /></View>
                <Text style={styles.emptyTitle}>Bạn chưa có lịch tư vấn</Text>
                <Text style={styles.emptyText}>Gửi thông tin không gian và nhu cầu để cửa hàng tiếp nhận.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ConsultationBooking')}>
                  <Text style={styles.emptyButtonText}>Gửi yêu cầu tư vấn</Text>
                </TouchableOpacity>
              </View>
            )}
            renderItem={({ item }) => <BookingCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function BookingCard({ item }: { item: ConsultationBooking }) {
  const statusStyle = STATUS_STYLES[item.trangThai] || STATUS_STYLES.Submitted;
  const date = new Date(`${item.ngay.slice(0, 10)}T00:00:00`);
  const displayDate = Number.isNaN(date.getTime()) ? item.ngay : date.toLocaleDateString('vi-VN');
  const displayTime = item.gio?.slice(0, 5) || '--:--';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardCode}>YÊU CẦU #{item.maLichTuVan}</Text>
          <Text style={styles.cardDate}>{displayDate} · {displayTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {STATUS_LABELS[item.trangThai] || item.trangThai}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={18} color={ServiceTheme.accent} />
        <Text style={styles.detailText} numberOfLines={2}>{item.diaChi}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={ServiceTheme.accent} />
        <Text style={styles.detailText} numberOfLines={3}>{item.nhuCau}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="person-outline" size={18} color={ServiceTheme.accent} />
        <Text style={styles.detailText}>{item.maHoaSi ? `Họa sĩ #${item.maHoaSi}` : 'Đang chờ phân công họa sĩ'}</Text>
      </View>
      {!!item.ketQuaTuVan && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Kết quả tư vấn</Text>
          <Text style={styles.resultText}>{item.ketQuaTuVan}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ServiceTheme.background },
  screen: { flex: 1, backgroundColor: ServiceTheme.background },
  pageHeader: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageHeaderCopy: { flex: 1 },
  eyebrow: { color: ServiceTheme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  pageTitle: { color: ServiceTheme.ink, fontSize: 28, fontWeight: '800', marginTop: 5 },
  pageSubtitle: { color: ServiceTheme.muted, fontSize: 12, marginTop: 5 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: ServiceTheme.accentDark, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { color: ServiceTheme.muted, marginTop: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 36 },
  emptyList: { flexGrow: 1 },
  errorBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, backgroundColor: '#fbe8e4', borderRadius: 13, padding: 14, marginBottom: 12 },
  errorText: { flex: 1, color: ServiceTheme.error, fontSize: 13, lineHeight: 18 },
  retryText: { color: ServiceTheme.error, fontSize: 13, fontWeight: '800' },
  emptyState: { flex: 1, minHeight: 400, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: ServiceTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: ServiceTheme.ink, fontSize: 19, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  emptyText: { color: ServiceTheme.muted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  emptyButton: { backgroundColor: ServiceTheme.accentDark, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  emptyButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: ServiceTheme.surface, borderRadius: 17, borderWidth: 1, borderColor: ServiceTheme.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardCode: { color: ServiceTheme.accent, fontSize: 10, letterSpacing: 0.8, fontWeight: '800' },
  cardDate: { color: ServiceTheme.ink, fontSize: 17, fontWeight: '800', marginTop: 5 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#eee6dc', marginVertical: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 9 },
  detailText: { flex: 1, color: ServiceTheme.muted, fontSize: 13, lineHeight: 19 },
  resultBox: { backgroundColor: '#f1eadf', borderRadius: 12, padding: 13, marginTop: 5 },
  resultLabel: { color: ServiceTheme.accentDark, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  resultText: { color: ServiceTheme.ink, fontSize: 13, lineHeight: 20, marginTop: 6 },
});
