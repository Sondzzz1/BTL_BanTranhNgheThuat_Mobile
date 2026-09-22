import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function CreateCustomArtScreen({ navigation }: any) {
  const [form, setForm] = useState({
    title: '',
    type: 'Tranh sơn dầu',
    size: '90x120 cm',
    style: 'Hiện đại',
    color: 'Nâu, trắng',
    material: 'Canvas',
    description: '',
    refImage: '',
  });

  const submit = () => {
    if (!form.title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề tranh');
      return;
    }
    Alert.alert('Thành công', 'Yêu cầu vẽ tranh đã được gửi.');
    navigation.goBack();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tạo yêu cầu vẽ tranh</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.label}>Tiêu đề</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="VD: Tranh treo phòng khách" />

        <Text style={styles.label}>Loại tranh</Text>
        <TextInput style={styles.input} value={form.type} onChangeText={(v) => setForm({ ...form, type: v })} />

        <Text style={styles.label}>Kích thước</Text>
        <TextInput style={styles.input} value={form.size} onChangeText={(v) => setForm({ ...form, size: v })} />

        <Text style={styles.label}>Phong cách</Text>
        <TextInput style={styles.input} value={form.style} onChangeText={(v) => setForm({ ...form, style: v })} />

        <Text style={styles.label}>Màu sắc</Text>
        <TextInput style={styles.input} value={form.color} onChangeText={(v) => setForm({ ...form, color: v })} />

        <Text style={styles.label}>Chất liệu</Text>
        <TextInput style={styles.input} value={form.material} onChangeText={(v) => setForm({ ...form, material: v })} />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput style={[styles.input, styles.textArea]} multiline value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Mô tả ý tưởng, không gian, cảm hứng..." />

        <Text style={styles.label}>Ảnh tham khảo</Text>
        <TextInput style={styles.input} value={form.refImage} onChangeText={(v) => setForm({ ...form, refImage: v })} placeholder="URL ảnh tham khảo" />

        <TouchableOpacity style={styles.submitButton} onPress={submit}>
          <Text style={styles.submitText}>Gửi yêu cầu</Text>
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
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitButton: { marginTop: 22, backgroundColor: '#ea580c', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
