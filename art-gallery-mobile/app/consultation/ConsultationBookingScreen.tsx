import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ConsultationBookingScreen({ navigation }: any) {
  const [form, setForm] = useState({
    date: '2026-10-15',
    time: '09:30',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    needs: 'Tư vấn không gian phòng khách, chọn tranh theo phong cách tối giản',
    note: 'Cần tư vấn màu sắc và kích thước phù hợp.',
  });

  const submit = () => {
    if (!form.address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ');
      return;
    }
    Alert.alert('Thành công', 'Lịch tư vấn đã được đặt.');
    navigation.goBack();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Đặt lịch tư vấn</Text>
      </View>

      <ScrollView style={styles.form}>
        <Text style={styles.label}>Ngày</Text>
        <TextInput style={styles.input} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />

        <Text style={styles.label}>Giờ</Text>
        <TextInput style={styles.input} value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} />

        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput style={styles.input} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />

        <Text style={styles.label}>Nhu cầu</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={form.needs} onChangeText={(v) => setForm({ ...form, needs: v })} />

        <Text style={styles.label}>Ghi chú</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} />

        <TouchableOpacity style={styles.submitButton} onPress={submit}>
          <Text style={styles.submitText}>Đặt lịch</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  back: { fontSize: 26, color: '#111827', marginRight: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: '#111827' },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  submitButton: { marginTop: 22, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
