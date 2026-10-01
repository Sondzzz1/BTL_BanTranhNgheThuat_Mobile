import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationService } from '../../services/consultationService';
import ServiceTheme from '../../constants/serviceTheme';

type ConsultationMode = 'ONLINE' | 'DIRECT';

export default function ConsultationBookingScreen({ navigation }: any) {
  const [mode, setMode] = useState<ConsultationMode>('ONLINE');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', address: '', needs: '', note: '' });

  const tomorrow = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return 'Ngày cần đúng định dạng YYYY-MM-DD.';
    const selectedDate = new Date(`${form.date}T00:00:00`);
    const [year, month, day] = form.date.split('-').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isRealDate = !Number.isNaN(selectedDate.getTime())
      && selectedDate.getFullYear() === year
      && selectedDate.getMonth() + 1 === month
      && selectedDate.getDate() === day;
    if (!isRealDate) return 'Ngày tư vấn không tồn tại.';
    if (selectedDate <= today) return 'Ngày tư vấn phải sau ngày hiện tại.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) return 'Giờ cần đúng định dạng HH:mm (00:00–23:59).';
    if (!form.address.trim()) return mode === 'ONLINE' ? 'Vui lòng nhập khu vực hoặc địa chỉ không gian.' : 'Vui lòng nhập địa chỉ cần khảo sát.';
    if (!form.needs.trim()) return 'Vui lòng mô tả nhu cầu tư vấn.';
    if (form.needs.trim().length < 10) return 'Nhu cầu tư vấn cần ít nhất 10 ký tự.';
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Thông tin chưa hợp lệ', validationError);
      return;
    }

    try {
      setSubmitting(true);
      const modeLabel = mode === 'ONLINE' ? 'Tư vấn trực tuyến' : 'Đề nghị tư vấn trực tiếp';
      const created = await consultationService.create({
        ngay: form.date,
        gio: `${form.time}:00`,
        diaChi: form.address.trim(),
        nhuCau: `[${modeLabel}] ${form.needs.trim()}`,
        ghiChu: form.note.trim() || undefined,
      });

      Alert.alert(
        'Đã gửi yêu cầu tư vấn',
        `Mã yêu cầu #${created.maLichTuVan}. Trạng thái: ${created.trangThai}. Cửa hàng sẽ kiểm tra trước khi xác nhận lịch.`,
        [{ text: 'Xem lịch của tôi', onPress: () => navigation.replace('ConsultationList') }]
      );
    } catch (requestError: any) {
      Alert.alert(
        'Không thể gửi yêu cầu',
        requestError?.response?.data?.message || requestError?.message || 'Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>YÊU CẦU TƯ VẤN</Text>
          <Text style={styles.heading}>Cho chúng tôi biết về không gian của bạn</Text>
          <Text style={styles.description}>
            Thông tin chỉ được ghi nhận khi Backend trả về mã yêu cầu. Lịch trực tiếp cần được cửa hàng kiểm tra và xác nhận sau.
          </Text>

          <Text style={styles.label}>Hình thức tư vấn</Text>
          <View style={styles.modeRow}>
            <ModeButton selected={mode === 'ONLINE'} icon="videocam-outline" title="Trực tuyến" onPress={() => setMode('ONLINE')} />
            <ModeButton selected={mode === 'DIRECT'} icon="location-outline" title="Trực tiếp" onPress={() => setMode('DIRECT')} />
          </View>

          <Field
            label="Ngày mong muốn *"
            hint={`Định dạng YYYY-MM-DD, sớm nhất ${tomorrow}`}
            value={form.date}
            onChangeText={(value: string) => update('date', value.replace(/[^\d-]/g, '').slice(0, 10))}
            placeholder={tomorrow}
            keyboardType="numbers-and-punctuation"
          />
          <Field
            label="Giờ mong muốn *"
            hint="Định dạng 24 giờ HH:mm"
            value={form.time}
            onChangeText={(value: string) => update('time', value.replace(/[^\d:]/g, '').slice(0, 5))}
            placeholder="09:30"
            keyboardType="numbers-and-punctuation"
          />
          <Field
            label={mode === 'ONLINE' ? 'Khu vực / địa chỉ không gian *' : 'Địa chỉ đề nghị khảo sát *'}
            value={form.address}
            onChangeText={(value: string) => update('address', value)}
            placeholder="Ví dụ: Quận 1, TP.HCM"
          />
          <Field
            label="Nhu cầu tư vấn *"
            value={form.needs}
            onChangeText={(value: string) => update('needs', value)}
            placeholder="Mô tả loại không gian, màu sắc, phong cách và điều bạn đang cân nhắc..."
            multiline
          />
          <Field
            label="Ghi chú"
            value={form.note}
            onChangeText={(value: string) => update('note', value)}
            placeholder="Khung giờ thuận tiện hoặc thông tin bổ sung"
            multiline
          />

          {mode === 'DIRECT' && (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={21} color={ServiceTheme.accentDark} />
              <Text style={styles.noticeText}>
                Đây là đề nghị khảo sát, chưa phải lịch đã xác nhận. Cửa hàng sẽ kiểm tra phạm vi phục vụ và phản hồi.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitText}>Gửi yêu cầu tư vấn</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeButton({ selected, icon, title, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.modeButton, selected && styles.modeButtonSelected]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={selected ? '#fff' : ServiceTheme.accentDark} />
      <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>{title}</Text>
    </TouchableOpacity>
  );
}

function Field({ label, hint, multiline, ...props }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
        placeholderTextColor="#a49a8f"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ServiceTheme.background },
  screen: { flex: 1, backgroundColor: ServiceTheme.background },
  content: { padding: 18, paddingBottom: 42 },
  eyebrow: { color: ServiceTheme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.35, marginTop: 5 },
  heading: { color: ServiceTheme.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5, marginTop: 9 },
  description: { color: ServiceTheme.muted, fontSize: 14, lineHeight: 22, marginTop: 11, marginBottom: 22 },
  label: { color: ServiceTheme.ink, fontSize: 13, fontWeight: '800', marginBottom: 7 },
  hint: { color: ServiceTheme.muted, fontSize: 11, marginTop: -3, marginBottom: 7 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  modeButton: { flex: 1, minHeight: 62, borderWidth: 1, borderColor: ServiceTheme.accentDark, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: ServiceTheme.surface },
  modeButtonSelected: { backgroundColor: ServiceTheme.accentDark },
  modeButtonText: { color: ServiceTheme.accentDark, fontSize: 13, fontWeight: '800' },
  modeButtonTextSelected: { color: '#fff' },
  field: { marginBottom: 17 },
  input: { minHeight: 50, backgroundColor: ServiceTheme.surface, borderWidth: 1, borderColor: ServiceTheme.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: ServiceTheme.ink },
  textArea: { minHeight: 118, textAlignVertical: 'top' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: ServiceTheme.accentSoft, borderRadius: 13, padding: 14, marginBottom: 18 },
  noticeText: { flex: 1, color: '#6d573e', fontSize: 12, lineHeight: 19 },
  submitButton: { minHeight: 54, backgroundColor: ServiceTheme.accentDark, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
