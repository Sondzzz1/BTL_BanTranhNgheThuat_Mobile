import React, { useCallback, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { Certificate, certificateService } from '../../services/certificateService';
import { API_BASE_URL, PUBLIC_WEB_URL } from '../../constants/api';

export default function MyCertificatesScreen() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setError(null); setItems(await certificateService.getMine()); }
    catch (err: any) { setError(err?.response?.data?.message || err.message || 'Không thể tải chứng nhận'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { void load(); }, []));
  if (loading) return <Loading message="Đang tải chứng nhận..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => void load()} />;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.header}><Text style={styles.eyebrow}>QUYỀN SỞ HỮU HIỆN VẬT</Text><Text style={styles.title}>Chứng nhận của tôi</Text><Text style={styles.subtitle}>Chứng nhận không đồng nghĩa với việc chuyển quyền tác giả.</Text></View>
    {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>◇</Text><Text style={styles.emptyTitle}>Chưa có chứng nhận</Text><Text style={styles.emptyText}>Chứng nhận độc bản được cấp sau khi thanh toán và bàn giao thành công.</Text></View> : items.map(item => <View key={item.maChungNhan} style={styles.card}>
      <View style={styles.cardTop}><Text style={styles.badge}>{item.trangThai}</Text><Text style={styles.date}>{new Date(item.ngayCap).toLocaleDateString('vi-VN')}</Text></View>
      <Text style={styles.artwork}>{item.tenTacPham}</Text><Text style={styles.artist}>{item.loaiTacPhamText} · {item.tenHoaSi}</Text>
      {item.tacGiaGoc ? <Text style={styles.origin}>Tác giả gốc: {item.tacGiaGoc}</Text> : null}
      <Text selectable style={styles.code}>{item.maChungNhanCongKhai}</Text>
      <View style={styles.actions}><TouchableOpacity style={styles.verifyButton} onPress={() => Linking.openURL(`${PUBLIC_WEB_URL}/chung-nhan/xac-minh/${encodeURIComponent(item.maChungNhanCongKhai)}`)}><Text style={styles.verifyText}>Xác minh</Text></TouchableOpacity><TouchableOpacity style={styles.pdfButton} onPress={() => Linking.openURL(`${API_BASE_URL}/chung-nhan/xac-minh/${encodeURIComponent(item.maChungNhanCongKhai)}/pdf`)}><Text style={styles.pdfText}>Xem PDF</Text></TouchableOpacity></View>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#f8fafc'},content:{padding:16,paddingBottom:40},header:{padding:20,borderRadius:18,backgroundColor:'#1f3d2f',marginBottom:16},eyebrow:{color:'#fed7aa',fontSize:10,fontWeight:'900',letterSpacing:1},title:{marginTop:6,color:'#fff',fontSize:25,fontWeight:'900'},subtitle:{marginTop:7,color:'#d1fae5',lineHeight:20},empty:{alignItems:'center',padding:35,borderRadius:16,backgroundColor:'#fff'},emptyIcon:{fontSize:44,color:'#c2410c'},emptyTitle:{fontSize:18,fontWeight:'800',color:'#1e293b'},emptyText:{marginTop:6,color:'#64748b',textAlign:'center',lineHeight:20},card:{marginBottom:13,padding:17,borderWidth:1,borderColor:'#e2e8f0',borderRadius:16,backgroundColor:'#fff'},cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},badge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#dcfce7',color:'#166534',fontSize:10,fontWeight:'900'},date:{color:'#64748b',fontSize:12},artwork:{marginTop:14,color:'#172033',fontSize:19,fontWeight:'900'},artist:{marginTop:4,color:'#64748b'},origin:{marginTop:8,color:'#475569'},code:{marginTop:15,padding:10,borderRadius:8,backgroundColor:'#f1f5f9',color:'#334155',fontSize:11},actions:{flexDirection:'row',gap:8,marginTop:12},verifyButton:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:'#c2410c'},verifyText:{color:'#fff',fontWeight:'800'},pdfButton:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:'#e2e8f0'},pdfText:{color:'#334155',fontWeight:'800'}
});
