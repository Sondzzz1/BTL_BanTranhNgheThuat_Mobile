import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customArtService } from '../../services/customArtService';
import { CommissionRequest, commissionStatusLabels } from '../../types/customArt';

export default function CustomArtDetailScreen({ route, navigation }: any) {
  const id = Number(route?.params?.id || route?.params?.item?.maYeuCau || route?.params?.item?.id);
  const [item, setItem] = useState<CommissionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [detail, token] = await Promise.all([
        customArtService.getById(id),
        AsyncStorage.getItem('authToken'),
      ]);
      setItem(detail);
      setAuthToken(token);
    } catch (error: any) {
      Alert.alert('Không thể tải chi tiết', error?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const cancel = () => Alert.alert('Hủy yêu cầu', 'Bạn chắc chắn muốn hủy yêu cầu này?', [
    { text: 'Không', style: 'cancel' },
    {
      text: 'Hủy yêu cầu', style: 'destructive', onPress: async () => {
        try { await customArtService.cancel(id); await load(); }
        catch (error: any) { Alert.alert('Không thể hủy', error?.response?.data?.message || 'Vui lòng thử lại.'); }
      },
    },
  ]);

  if (loading) return <ActivityIndicator size="large" color="#ea580c" style={styles.loader} />;
  if (!item) return <View style={styles.center}><Text>Không tìm thấy yêu cầu.</Text></View>;

  const canCancel = !item.maHoaSi && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.trangThai);
  const referenceUrl = customArtService.absoluteFileUrl(item.referenceImageUrl || item.anhThamKhao);
  const evidenceUrl = customArtService.absoluteFileUrl(item.bangChungQuyenSuDung);
  const imageHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{item.tieuDe}</Text>
      <Text style={styles.status}>{commissionStatusLabels[item.trangThai] || item.trangThai}</Text>

      <Section label="Mô tả" value={item.moTa || 'Không có'} />
      <View style={styles.twoColumns}>
        <Section label="Loại yêu cầu" value={item.type} compact />
        <Section label="Ngày tạo" value={new Date(item.ngayTao).toLocaleDateString('vi-VN')} compact />
      </View>
      <Section label="Họa sĩ thực hiện" value={item.tenHoaSiThucHien || 'Chưa có họa sĩ nhận'} />
      <Section label="Ngân sách dự kiến" value={`${Number(item.giaDuKien || 0).toLocaleString('vi-VN')}đ`} />

      {item.type === 'EXISTING_ARTWORK' && (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceHeading}>Nguồn gốc tác phẩm</Text>
          <Section label="Tên tác phẩm gốc" value={item.referenceArtworkName || '—'} />
          <Section label="Tác giả tác phẩm gốc" value={item.referenceArtistName || '—'} />
          <Section label="Nguồn tham khảo" value={item.nguonTacPhamGoc || '—'} />
          <Section label="Trạng thái quyền sử dụng" value={item.tinhTrangQuyenSuDung || '—'} />
          <Section label="Mô tả quyền sử dụng" value={item.moTaQuyenSuDung || '—'} />
          {item.ghiChuKiemDuyet && <Section label="Ghi chú kiểm duyệt" value={item.ghiChuKiemDuyet} />}
        </View>
      )}

      {item.type === 'PERSONAL_REFERENCE' && (
        <Section label="Xác nhận quyền tài liệu cá nhân" value={item.daXacNhanQuyenTaiLieu ? 'Đã xác nhận' : 'Chưa xác nhận'} />
      )}

      {referenceUrl && <View style={styles.imageBox}><Text style={styles.imageLabel}>Ảnh tham khảo</Text><Image source={{ uri: referenceUrl, headers: imageHeaders }} style={styles.image} /></View>}
      {evidenceUrl && <View style={styles.imageBox}><Text style={styles.imageLabel}>Bằng chứng quyền sử dụng</Text><Image source={{ uri: evidenceUrl, headers: imageHeaders }} style={styles.image} /></View>}

      {item.maTacPhamKetQua && <Section label="Tác phẩm mới trong hệ thống" value={`#${item.maTacPhamKetQua}`} />}
      {canCancel && <TouchableOpacity style={styles.cancelButton} onPress={cancel}><Text style={styles.cancelText}>Hủy yêu cầu</Text></TouchableOpacity>}
    </ScrollView>
  );
}

function Section({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <View style={[styles.section, compact && styles.compact]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  status: { alignSelf: 'flex-start', backgroundColor: '#ffedd5', color: '#c2410c', fontWeight: '800', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, marginTop: 9, marginBottom: 16 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  compact: { flex: 1 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  label: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  value: { color: '#111827', fontSize: 15, fontWeight: '600' },
  sourceBox: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 12, marginBottom: 12 },
  sourceHeading: { color: '#9a3412', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  imageBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  imageLabel: { fontWeight: '700', color: '#374151', marginBottom: 8 },
  image: { width: '100%', height: 230, borderRadius: 10, resizeMode: 'contain', backgroundColor: '#f3f4f6' },
  cancelButton: { borderWidth: 1, borderColor: '#dc2626', padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#dc2626', fontWeight: '800' },
});
