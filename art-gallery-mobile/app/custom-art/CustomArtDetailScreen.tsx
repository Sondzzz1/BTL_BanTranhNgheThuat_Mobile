import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { customArtService } from '../../services/customArtService';
import { CommissionRequest, commissionStatusLabels } from '../../types/customArt';
import { formatVnd } from '../../utils/currency';

export default function CustomArtDetailScreen({ route, navigation }: any) {
  const id = Number(route?.params?.id || route?.params?.item?.maYeuCau || route?.params?.item?.id);
  const [item, setItem] = useState<CommissionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
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
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const acceptQuote = () => {
    if (!item?.quote) return;
    Alert.alert('Chấp nhận báo giá', `Xác nhận báo giá ${formatVnd(item.quote.giaBaoGia)}?`, [
      { text: 'Để sau', style: 'cancel' },
      { text: 'Chấp nhận', onPress: async () => {
        try {
          setAccepting(true);
          await customArtService.acceptQuote(item.quote!.maBaoGia);
          await load();
          Alert.alert('Thành công', 'Bạn đã chấp nhận báo giá.');
        } catch (error: any) {
          Alert.alert('Không thể chấp nhận', error?.response?.data?.message || 'Vui lòng thử lại.');
        } finally { setAccepting(false); }
      } },
    ]);
  };

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <Text style={styles.title}>{item.tieuDe}</Text>
      <Text style={styles.status}>{commissionStatusLabels[item.trangThai] || item.trangThai}</Text>

      <Section label="Mô tả" value={item.moTa || 'Không có'} />
      <View style={styles.twoColumns}>
        <Section label="Loại yêu cầu" value={item.type} compact />
        <Section label="Ngày tạo" value={new Date(item.ngayTao).toLocaleDateString('vi-VN')} compact />
      </View>
      <Section label="Họa sĩ thực hiện" value={item.tenHoaSiThucHien || 'Chưa có họa sĩ nhận'} />
      <Section label="Ngân sách dự kiến" value={formatVnd(item.giaDuKien)} />

      {item.quote && (
        <View style={styles.quoteBox}>
          <Text style={styles.boxHeading}>Báo giá của họa sĩ</Text>
          <Section label="Số tiền" value={formatVnd(item.quote.giaBaoGia)} />
          <Section label="Ngày dự kiến hoàn thành" value={new Date(`${item.quote.thoiGianHoanThanh}T00:00:00`).toLocaleDateString('vi-VN')} />
          <Section label="Ghi chú" value={item.quote.ghiChu || 'Không có'} />
          <Section label="Trạng thái báo giá" value={quoteStatusLabel(item.quote.trangThai)} />
          {item.quote.trangThai === 'PendingCustomerApproval' && (
            <TouchableOpacity style={styles.acceptButton} onPress={acceptQuote} disabled={accepting}>
              {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptText}>Chấp nhận báo giá</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

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

      <View style={styles.timelineBox}>
        <Text style={styles.boxHeading}>Tiến độ thực hiện</Text>
        {item.progress?.length ? item.progress.map((progress, index) => {
          const imageUrl = customArtService.absoluteFileUrl(progress.anhPreview);
          return <View style={styles.timelineItem} key={progress.maTienDo}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{new Date(progress.ngayTao).toLocaleDateString('vi-VN')}</Text>
              <Text style={styles.timelineTitle}>{progress.tieuDe}</Text>
              <Text style={styles.timelineDescription}>{progress.moTa}</Text>
              {imageUrl && <Image source={{ uri: imageUrl, headers: imageUrl.startsWith('data:image/') ? undefined : imageHeaders }} style={styles.progressImage} />}
            </View>
            {index < item.progress.length - 1 && <View style={styles.timelineLine} />}
          </View>;
        }) : <Text style={styles.emptyProgress}>Chưa có cập nhật tiến độ.</Text>}
      </View>

      {item.maTacPhamKetQua && <Section label="Tác phẩm mới trong hệ thống" value={`#${item.maTacPhamKetQua}`} />}
      {canCancel && <TouchableOpacity style={styles.cancelButton} onPress={cancel}><Text style={styles.cancelText}>Hủy yêu cầu</Text></TouchableOpacity>}
    </ScrollView>
  );
}

const quoteStatusLabel = (status: string) => ({
  PendingCustomerApproval: 'Chờ khách hàng chấp nhận',
  CustomerAccepted: 'Khách hàng đã chấp nhận',
}[status] || status);

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
  quoteBox: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 14, padding: 12, marginBottom: 12 },
  boxHeading: { color: '#065f46', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  acceptButton: { backgroundColor: '#059669', padding: 13, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '800' },
  imageBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  imageLabel: { fontWeight: '700', color: '#374151', marginBottom: 8 },
  image: { width: '100%', height: 230, borderRadius: 10, resizeMode: 'contain', backgroundColor: '#f3f4f6' },
  timelineBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  timelineItem: { position: 'relative', flexDirection: 'row', paddingBottom: 18 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ea580c', marginTop: 5, marginRight: 12, zIndex: 2 },
  timelineLine: { position: 'absolute', left: 5, top: 17, bottom: 0, width: 2, backgroundColor: '#fed7aa' },
  timelineContent: { flex: 1 },
  timelineDate: { color: '#9ca3af', fontSize: 12 },
  timelineTitle: { color: '#111827', fontWeight: '800', marginTop: 2 },
  timelineDescription: { color: '#4b5563', marginTop: 4, lineHeight: 20 },
  progressImage: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover', marginTop: 9, backgroundColor: '#f3f4f6' },
  emptyProgress: { color: '#6b7280' },
  cancelButton: { borderWidth: 1, borderColor: '#dc2626', padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#dc2626', fontWeight: '800' },
});
