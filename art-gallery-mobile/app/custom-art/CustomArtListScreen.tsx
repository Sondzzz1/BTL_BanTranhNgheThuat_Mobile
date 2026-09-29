import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { customArtService } from '../../services/customArtService';
import { CommissionRequest, CommissionStatus, commissionStatusLabels } from '../../types/customArt';

type Filter = 'ALL' | CommissionStatus;

export default function CustomArtListScreen({ navigation }: any) {
  const [items, setItems] = useState<CommissionRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setItems(await customArtService.getMine());
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(
    () => filter === 'ALL' ? items : items.filter((item) => item.trangThai === filter),
    [filter, items]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Yêu cầu của tôi</Text>
          <Text style={styles.subheading}>{items.length} yêu cầu</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateCustomArt')}>
          <Text style={styles.addText}>+ Tạo mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'PENDING', 'WAITING_PERMISSION', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'] as Filter[]).map((value) => (
          <TouchableOpacity key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {value === 'ALL' ? 'Tất cả' : commissionStatusLabels[value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ea580c" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.maYeuCau)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có yêu cầu phù hợp.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CustomArtDetail', { id: item.maYeuCau })}>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{item.tieuDe}</Text>
                <Text style={styles.code}>#{item.maYeuCau}</Text>
              </View>
              <Text style={styles.type}>{item.type.replaceAll('_', ' ')}</Text>
              <View style={styles.row}>
                <Text style={styles.status}>{commissionStatusLabels[item.trangThai] || item.trangThai}</Text>
                <Text style={styles.date}>{new Date(item.ngayTao).toLocaleDateString('vi-VN')}</Text>
              </View>
              <Text style={styles.artist}>Họa sĩ thực hiện: {item.tenHoaSiThucHien || 'Chưa có'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subheading: { color: '#6b7280', marginTop: 3 },
  addButton: { backgroundColor: '#ea580c', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 7, marginBottom: 4 },
  filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e5e7eb' },
  filterActive: { backgroundColor: '#ffedd5' },
  filterText: { color: '#4b5563', fontSize: 12 },
  filterTextActive: { color: '#c2410c', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 80 },
  error: { color: '#b91c1c', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 60 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: '#111827' },
  code: { color: '#9ca3af' },
  type: { color: '#6b7280', marginTop: 5, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  status: { color: '#c2410c', fontWeight: '700' },
  date: { color: '#6b7280' },
  artist: { color: '#374151', marginTop: 9 },
});
