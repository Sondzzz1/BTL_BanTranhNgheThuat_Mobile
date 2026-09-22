import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const initialRequests = [
  {
    id: 101,
    title: 'Tranh treo phòng khách hiện đại',
    status: 'Đã nhận',
    artist: 'Họa sĩ Minh Anh',
    date: '2026-09-10',
    price: '8.500.000đ',
  },
  {
    id: 102,
    title: 'Tranh phong cách tối giản',
    status: 'Chờ báo giá',
    artist: 'Chưa giao',
    date: '2026-09-12',
    price: 'Chưa có',
  },
  {
    id: 103,
    title: 'Tranh gia đình nền nâu ấm',
    status: 'Hoàn thành',
    artist: 'Họa sĩ Lan Hương',
    date: '2026-09-14',
    price: '12.000.000đ',
  },
];

export default function CustomArtListScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'done'>('all');

  const filtered = useMemo(() => {
    if (filter === 'pending') return initialRequests.filter(x => x.status === 'Chờ báo giá');
    if (filter === 'active') return initialRequests.filter(x => x.status === 'Đã nhận');
    if (filter === 'done') return initialRequests.filter(x => x.status === 'Hoàn thành');
    return initialRequests;
  }, [filter]);

  const handleOpen = (item: any) => {
    navigation.navigate('CustomArtDetail', { item });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vẽ theo yêu cầu</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateCustomArt')}>
          <Text style={styles.newButton}>+ Mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {['all', 'pending', 'active', 'done'].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, filter === value && styles.filterChipActive]}
            onPress={() => setFilter(value as any)}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {value === 'all' ? 'Tất cả' : value === 'pending' ? 'Chờ báo giá' : value === 'active' ? 'Đang xử lý' : 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => handleOpen(item)} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.status, item.status === 'Hoàn thành' ? styles.done : styles.processing]}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>Họa sĩ: {item.artist}</Text>
            <Text style={styles.meta}>Ngày tạo: {item.date}</Text>
            <Text style={styles.meta}>Giá: {item.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { fontSize: 26, color: '#111827' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  newButton: { backgroundColor: '#ea580c', color: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontWeight: '600' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  filterChipActive: { backgroundColor: '#111827' },
  filterText: { color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  status: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  processing: { backgroundColor: '#fff7ed', color: '#c2410c' },
  done: { backgroundColor: '#ecfdf5', color: '#15803d' },
  meta: { color: '#4b5563', fontSize: 13, marginTop: 4 },
});
