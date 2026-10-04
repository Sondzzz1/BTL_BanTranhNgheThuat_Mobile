import React, { useCallback, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { Certificate, PendingCertificateStatus, certificateService } from '../../services/certificateService';

const copyrightStatusLabel = (status: string) => ({
  CHUA_KHAI_BAO: 'Chưa khai báo nguồn gốc',
  PENDING: 'Chờ Admin xác minh',
  NEED_INFO: 'Họa sĩ cần bổ sung hồ sơ',
  VERIFIED: 'Đã xác minh nguồn gốc',
  REJECTED: 'Hồ sơ bị từ chối',
  DISPUTED: 'Hồ sơ đang tranh chấp',
  REVOKED: 'Hồ sơ đã bị thu hồi',
}[status] || status);

const pendingStatusLabel = (status: string) => ({
  WAITING_PAYMENT_CONFIRMATION: 'Chờ xác nhận thanh toán',
  RETURN_IN_PROGRESS: 'Đang xử lý hoàn trả',
  INELIGIBLE_INITIAL_QUANTITY: 'Chưa đủ điều kiện độc bản',
  INELIGIBLE_LEGACY: 'Dữ liệu trước quy trình',
  WAITING_COPYRIGHT_DECLARATION: 'Chờ khai báo nguồn gốc',
  WAITING_COPYRIGHT_VERIFICATION: 'Chờ xác minh nguồn gốc',
  COPYRIGHT_NOT_ELIGIBLE: 'Hồ sơ chưa đủ điều kiện',
  ISSUANCE_PENDING: 'Đang phát hành chứng nhận',
}[status] || 'Chờ xử lý');

export default function MyCertificatesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Certificate[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingCertificateStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const certificates = await certificateService.getMine();
      setItems(certificates);
      try {
        setPendingItems(await certificateService.getPendingMine());
      } catch (pendingError) {
        // Danh sách chứng nhận đã cấp vẫn hữu ích nếu trạng thái chờ tạm thời lỗi.
        console.warn('Không thể tải trạng thái chứng nhận đang chờ:', pendingError);
        setPendingItems([]);
      }
    }
    catch (err: any) { setError(err?.response?.data?.message || err.message || 'Không thể tải chứng nhận'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const openPdf = async (certificateCode: string) => {
    const url = certificateService.getPublicPdfUrl(certificateCode);
    try {
      if (!await Linking.canOpenURL(url)) {
        throw new Error('Thiết bị không hỗ trợ mở liên kết PDF');
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Không thể mở PDF',
        'Hãy kiểm tra iPhone đang kết nối cùng mạng Wi-Fi với máy chủ rồi thử lại.',
      );
    }
  };
  useFocusEffect(useCallback(() => { void load(); }, []));
  if (loading) return <Loading message="Đang tải chứng nhận..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => void load()} />;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.header}><Text style={styles.eyebrow}>QUYỀN SỞ HỮU HIỆN VẬT</Text><Text style={styles.title}>Chứng nhận của tôi</Text><Text style={styles.subtitle}>Chứng nhận không đồng nghĩa với việc chuyển quyền tác giả.</Text></View>
    {items.length === 0 && pendingItems.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>◇</Text><Text style={styles.emptyTitle}>Chưa có chứng nhận</Text><Text style={styles.emptyText}>Chứng nhận độc bản được cấp sau khi thanh toán, bàn giao thành công và hồ sơ nguồn gốc được Admin xác minh.</Text></View> : null}
    {pendingItems.length > 0 ? <View style={styles.pendingSection}>
      <Text style={styles.pendingSectionTitle}>Đang chờ cấp chứng nhận</Text>
      <Text style={styles.pendingSectionText}>Các tác phẩm dưới đây đã giao thành công nhưng chưa đủ điều kiện phát hành chứng nhận.</Text>
      {pendingItems.map(item => <View key={`${item.maDonHang}-${item.maChiTietDonHang}`} style={styles.pendingCard}>
        <View style={styles.cardTop}><Text style={styles.pendingBadge}>{pendingStatusLabel(item.trangThaiChungNhan)}</Text><Text style={styles.pendingStatus}>{copyrightStatusLabel(item.trangThaiBanQuyen)}</Text></View>
        <Text style={styles.artwork}>{item.tenTacPham}</Text>
        <Text style={styles.artist}>Đơn hàng #{item.maDonHang}</Text>
        <Text style={styles.pendingMessage}>{item.thongDiep}</Text>
      </View>)}
    </View> : null}
    {items.length > 0 ? <View style={styles.issuedSection}><Text style={styles.issuedSectionTitle}>Chứng nhận đã cấp</Text></View> : null}
    {items.map(item => <View key={item.maChungNhan} style={styles.card}>
      <View style={styles.cardTop}><Text style={styles.badge}>{item.trangThai}</Text><Text style={styles.date}>{new Date(item.ngayCap).toLocaleDateString('vi-VN')}</Text></View>
      <Text style={styles.artwork}>{item.tenTacPham}</Text><Text style={styles.artist}>{item.loaiTacPhamText} · {item.tenHoaSi}</Text>
      {item.tacGiaGoc ? <Text style={styles.origin}>Tác giả gốc: {item.tacGiaGoc}</Text> : null}
      <Text selectable style={styles.code}>{item.maChungNhanCongKhai}</Text>
      <View style={styles.actions}><TouchableOpacity style={styles.verifyButton} onPress={() => navigation.navigate('CertificateVerification', { certificateCode: item.maChungNhanCongKhai })}><Text style={styles.verifyText}>Xác minh</Text></TouchableOpacity><TouchableOpacity style={styles.pdfButton} onPress={() => void openPdf(item.maChungNhanCongKhai)}><Text style={styles.pdfText}>Xem PDF</Text></TouchableOpacity></View>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#f8fafc'},content:{padding:16,paddingBottom:40},header:{padding:20,borderRadius:18,backgroundColor:'#1f3d2f',marginBottom:16},eyebrow:{color:'#fed7aa',fontSize:10,fontWeight:'900',letterSpacing:1},title:{marginTop:6,color:'#fff',fontSize:25,fontWeight:'900'},subtitle:{marginTop:7,color:'#d1fae5',lineHeight:20},empty:{alignItems:'center',padding:35,borderRadius:16,backgroundColor:'#fff'},emptyIcon:{fontSize:44,color:'#c2410c'},emptyTitle:{fontSize:18,fontWeight:'800',color:'#1e293b'},emptyText:{marginTop:6,color:'#64748b',textAlign:'center',lineHeight:20},pendingSection:{marginBottom:16},pendingSectionTitle:{fontSize:17,fontWeight:'900',color:'#7c2d12'},pendingSectionText:{marginTop:4,marginBottom:10,color:'#9a3412',lineHeight:19},pendingCard:{marginBottom:10,padding:17,borderWidth:1,borderColor:'#fed7aa',borderRadius:16,backgroundColor:'#fff7ed'},pendingBadge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#ffedd5',color:'#9a3412',fontSize:10,fontWeight:'900'},pendingStatus:{color:'#9a3412',fontSize:10,fontWeight:'800'},pendingMessage:{marginTop:11,color:'#9a3412',lineHeight:20},issuedSection:{marginBottom:9},issuedSectionTitle:{fontSize:17,fontWeight:'900',color:'#1e293b'},card:{marginBottom:13,padding:17,borderWidth:1,borderColor:'#e2e8f0',borderRadius:16,backgroundColor:'#fff'},cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},badge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#dcfce7',color:'#166534',fontSize:10,fontWeight:'900'},date:{color:'#64748b',fontSize:12},artwork:{marginTop:14,color:'#172033',fontSize:19,fontWeight:'900'},artist:{marginTop:4,color:'#64748b'},origin:{marginTop:8,color:'#475569'},code:{marginTop:15,padding:10,borderRadius:8,backgroundColor:'#f1f5f9',color:'#334155',fontSize:11},actions:{flexDirection:'row',gap:8,marginTop:12},verifyButton:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:'#c2410c'},verifyText:{color:'#fff',fontWeight:'800'},pdfButton:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:'#e2e8f0'},pdfText:{color:'#334155',fontWeight:'800'}
});
