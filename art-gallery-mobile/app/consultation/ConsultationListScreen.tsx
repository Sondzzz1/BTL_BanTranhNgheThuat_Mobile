import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const bookings = [
  { id: 1, date: '2026-10-15', time: '09:30', status: 'Đã xác nhận', address: '123 Nguyễn Huệ', artist: 'Họa sĩ Minh Anh' },
  { id: 2, date: '2026-10-20', time: '14:00', status: 'Chờ xác nhận', address: '56 Lê Lợi', artist: 'Chưa giao' },
  { id: 3, date: '2026-10-25', time: '10:15', status: 'Hoàn thành', address: '88 Trần Hưng Đạo', artist: 'Họa sĩ Lan Hương' },
];

export default function ConsultationListScreen({ navigation }: any) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Lịch tư vấn</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ConsultationBooking')}>
          <Text style={styles.newButton}>+ Mới</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {bookings.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={[styles.status, item.status === 'Hoàn thành' ? styles.done : styles.pending]}>{item.status}</Text>
            </View>
            <Text style={styles.time}>Giờ: {item.time}</Text>
            <Text style={styles.text}>Địa chỉ: {item.address}</Text>
            <Text style={styles.text}>Họa sĩ: {item.artist}</Text>
          </View>
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
  newButton: { backgroundColor: '#111827', color: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontWeight: '700', fontSize: 16, color: '#111827' },
  status: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pending: { backgroundColor: '#fff7ed', color: '#c2410c' },
  done: { backgroundColor: '#ecfdf5', color: '#15803d' },
  time: { color: '#374151', marginBottom: 4 },
  text: { color: '#374151', marginBottom: 4 },
});
