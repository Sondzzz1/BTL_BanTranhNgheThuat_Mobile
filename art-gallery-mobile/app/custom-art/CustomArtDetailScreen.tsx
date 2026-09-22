import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function CustomArtDetailScreen({ route, navigation }: any) {
  const item = route?.params?.item || {
    id: 101,
    title: 'Tranh treo phòng khách hiện đại',
    status: 'Đã nhận',
    artist: 'Họa sĩ Minh Anh',
    date: '2026-09-10',
    price: '8.500.000đ',
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết yêu cầu</Text>
      </View>

      <ScrollView style={styles.body}>
        <Text style={styles.bigTitle}>{item.title}</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.status, styles.active]}>{item.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Họa sĩ phụ trách</Text>
          <Text style={styles.value}>{item.artist}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ngày tạo</Text>
          <Text style={styles.value}>{item.date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Báo giá</Text>
          <Text style={styles.value}>{item.price}</Text>
        </View>

        <View style={styles.timelineBox}>
          <Text style={styles.timelineTitle}>Tiến độ</Text>
          {['Yêu cầu đã gửi', 'Họa sĩ nhận', 'Báo giá', 'Đặt cọc', 'Đang làm', 'Hoàn thành'].map((step, index) => (
            <View key={step} style={styles.timelineItem}>
              <View style={[styles.dot, index <= 3 && styles.dotActive]} />
              <Text style={styles.timelineText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { fontSize: 26, color: '#111827', marginRight: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  body: { flex: 1 },
  bigTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 10 },
  statusRow: { flexDirection: 'row', marginBottom: 18 },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  active: { backgroundColor: '#fff7ed', color: '#c2410c' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  value: { fontSize: 15, color: '#111827', fontWeight: '600' },
  timelineBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#d1d5db', marginRight: 10 },
  dotActive: { backgroundColor: '#ea580c' },
  timelineText: { color: '#374151', fontSize: 14 },
});
