import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../../components/Loading';
import { PublicCertificateVerification, certificateService } from '../../services/certificateService';

type CertificateVerificationRoute = RouteProp<{
  CertificateVerification: { certificateCode: string };
}, 'CertificateVerification'>;

export default function CertificateVerificationScreen() {
  const route = useRoute<CertificateVerificationRoute>();
  const certificateCode = route.params?.certificateCode;
  const [certificate, setCertificate] = useState<PublicCertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!certificateCode) {
      setError('Không tìm thấy mã chứng nhận để xác minh.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCertificate(await certificateService.verifyPublic(certificateCode));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Không thể xác minh chứng nhận.');
    } finally {
      setLoading(false);
    }
  }, [certificateCode]);

  useEffect(() => { void load(); }, [load]);

  const openPdf = async () => {
    if (!certificateCode) return;
    try {
      await Linking.openURL(certificateService.getPublicPdfUrl(certificateCode));
    } catch {
      Alert.alert('Không thể mở PDF', 'Hãy kiểm tra iPhone đang kết nối cùng mạng Wi-Fi với máy chủ rồi thử lại.');
    }
  };

  if (loading) return <Loading message="Đang xác minh chứng nhận..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => void load()} />;
  if (!certificate?.timThay) return <View style={styles.center}><Text style={styles.icon}>!</Text><Text style={styles.title}>Không tìm thấy chứng nhận</Text><Text style={styles.description}>Mã chứng nhận không tồn tại hoặc đã bị xóa.</Text></View>;

  const valid = certificate.toanVen && certificate.trangThai === 'ACTIVE';
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={[styles.result, valid ? styles.valid : styles.invalid]}>
      <Text style={styles.resultIcon}>{valid ? '✓' : '!'}</Text>
      <Text style={styles.resultTitle}>{valid ? 'Chứng nhận hợp lệ' : 'Chứng nhận cần kiểm tra'}</Text>
      <Text style={styles.resultText}>{valid ? 'Thông tin chứng nhận toàn vẹn và đang có hiệu lực.' : 'Chứng nhận không còn hiệu lực hoặc dữ liệu không toàn vẹn.'}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MÃ CHỨNG NHẬN</Text>
      <Text selectable style={styles.code}>{certificate.maChungNhan}</Text>
      <Text style={styles.artwork}>{certificate.tenTacPham || 'Tác phẩm'}</Text>
      <Text style={styles.row}>Họa sĩ: {certificate.hoaSiThucHien || 'Đang cập nhật'}</Text>
      <Text style={styles.row}>Chủ sở hữu: {certificate.chuSoHuuHienThi || 'Không công khai'}</Text>
      <Text style={styles.row}>Loại tác phẩm: {certificate.loaiTacPhamText || 'Đang cập nhật'}</Text>
      {certificate.tacGiaGoc ? <Text style={styles.row}>Tác giả gốc: {certificate.tacGiaGoc}</Text> : null}
      {certificate.ngayCap ? <Text style={styles.row}>Ngày cấp: {new Date(certificate.ngayCap).toLocaleDateString('vi-VN')}</Text> : null}
      <Text style={styles.note}>{certificate.luuYPhapLy}</Text>
    </View>
    <TouchableOpacity style={styles.pdfButton} onPress={() => void openPdf()}><Text style={styles.pdfText}>Xem chứng nhận PDF</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f8fafc' },
  icon: { fontSize: 38, color: '#b91c1c', fontWeight: '900' }, title: { marginTop: 10, fontSize: 20, fontWeight: '900', color: '#172033' }, description: { marginTop: 8, textAlign: 'center', color: '#64748b', lineHeight: 20 },
  result: { alignItems: 'center', padding: 22, borderRadius: 18 }, valid: { backgroundColor: '#dcfce7' }, invalid: { backgroundColor: '#fee2e2' },
  resultIcon: { fontSize: 34, fontWeight: '900', color: '#166534' }, resultTitle: { marginTop: 5, fontSize: 20, fontWeight: '900', color: '#14532d' }, resultText: { marginTop: 6, textAlign: 'center', color: '#166534', lineHeight: 20 },
  card: { marginTop: 14, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' }, eyebrow: { color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, code: { marginTop: 6, color: '#334155', fontSize: 13, fontWeight: '800' }, artwork: { marginTop: 18, color: '#172033', fontSize: 22, fontWeight: '900' }, row: { marginTop: 9, color: '#475569', lineHeight: 20 }, note: { marginTop: 18, color: '#64748b', fontSize: 12, fontStyle: 'italic', lineHeight: 19 },
  pdfButton: { marginTop: 14, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#c2410c' }, pdfText: { color: '#fff', fontWeight: '900' },
});
