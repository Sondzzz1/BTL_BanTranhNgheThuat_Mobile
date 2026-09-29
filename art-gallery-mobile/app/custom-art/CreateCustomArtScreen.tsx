import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { customArtService } from '../../services/customArtService';
import {
  CommissionCreateInput,
  CommissionType,
  LocalUploadFile,
  PermissionUsageStatus,
} from '../../types/customArt';

type FileField = 'reference' | 'source' | 'evidence';

const makeUploadFile = (asset: ImagePicker.ImagePickerAsset): LocalUploadFile => ({
  uri: asset.uri,
  name: asset.fileName || `commission-${Date.now()}.jpg`,
  type: asset.mimeType || 'image/jpeg',
});

export default function CreateCustomArtScreen({ navigation }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<CommissionType>('ORIGINAL_COMMISSION');
  const [permission, setPermission] = useState<PermissionUsageStatus>('AUTHOR_OR_RIGHTS_OWNER');
  const [confirmedPersonalRights, setConfirmedPersonalRights] = useState(false);
  const [files, setFiles] = useState<Partial<Record<FileField, LocalUploadFile>>>({});
  const [form, setForm] = useState({
    tieuDe: '',
    moTa: '',
    loaiTranh: 'Tranh sơn dầu',
    kichThuoc: '50x70 cm',
    phongCach: '',
    mauSac: '',
    chatLieu: 'Canvas',
    giaDuKien: '',
    ngayHoanThanhDuKien: '',
    referenceArtworkName: '',
    referenceArtistName: '',
    nguonTacPhamGoc: '',
    moTaQuyenSuDung: '',
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const pickImage = async (field: FileField) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Bạn cần cho phép truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setFiles((current) => ({ ...current, [field]: makeUploadFile(result.assets[0]) }));
    }
  };

  const validate = () => {
    if (!form.tieuDe.trim() || !form.moTa.trim()) return 'Vui lòng nhập tiêu đề và mô tả.';
    if (!form.loaiTranh.trim() || !form.kichThuoc.trim()) return 'Vui lòng nhập loại tranh và kích thước.';
    if (type === 'PERSONAL_REFERENCE' && !confirmedPersonalRights)
      return 'Bạn phải xác nhận có quyền sử dụng ảnh/tài liệu cá nhân.';
    if (type === 'EXISTING_ARTWORK') {
      if (!form.referenceArtworkName.trim() || !form.referenceArtistName.trim())
        return 'Tên tác phẩm gốc và tác giả gốc là bắt buộc.';
      if (!files.source && !form.nguonTacPhamGoc.trim())
        return 'Vui lòng tải ảnh hoặc nhập nguồn tác phẩm gốc.';
    }
    if (form.giaDuKien && Number(form.giaDuKien.replace(/\D/g, '')) < 0)
      return 'Ngân sách dự kiến không hợp lệ.';
    return null;
  };

  const submit = async () => {
    const error = validate();
    if (error) return Alert.alert('Thiếu thông tin', error);
    const payload: CommissionCreateInput = {
      tieuDe: form.tieuDe.trim(),
      moTa: form.moTa.trim(),
      type,
      loaiTranh: form.loaiTranh.trim(),
      kichThuoc: form.kichThuoc.trim(),
      phongCach: form.phongCach.trim(),
      mauSac: form.mauSac.trim(),
      chatLieu: form.chatLieu.trim(),
      giaDuKien: Number(form.giaDuKien.replace(/\D/g, '')) || 0,
      ngayHoanThanhDuKien: form.ngayHoanThanhDuKien.trim() || undefined,
      daXacNhanQuyenTaiLieu: type === 'PERSONAL_REFERENCE' ? confirmedPersonalRights : false,
      referenceArtworkName: type === 'EXISTING_ARTWORK' ? form.referenceArtworkName.trim() : undefined,
      referenceArtistName: type === 'EXISTING_ARTWORK' ? form.referenceArtistName.trim() : undefined,
      nguonTacPhamGoc: type === 'EXISTING_ARTWORK' ? form.nguonTacPhamGoc.trim() : undefined,
      tinhTrangQuyenSuDung: type === 'EXISTING_ARTWORK' ? permission : undefined,
      moTaQuyenSuDung: type === 'EXISTING_ARTWORK' ? form.moTaQuyenSuDung.trim() : undefined,
    };
    try {
      setSubmitting(true);
      const created = await customArtService.create(payload, files);
      Alert.alert('Đã gửi yêu cầu', `Trạng thái: ${created.trangThai}`, [
        { text: 'Xem chi tiết', onPress: () => navigation.replace('CustomArtDetail', { id: created.maYeuCau }) },
      ]);
    } catch (error: any) {
      Alert.alert('Không thể gửi yêu cầu', error?.response?.data?.message || error.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const filePicker = (field: FileField, label: string) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.upload} onPress={() => pickImage(field)}>
        <Text style={styles.uploadText}>{files[field] ? 'Đổi ảnh' : 'Chọn ảnh từ thiết bị'}</Text>
      </TouchableOpacity>
      {files[field] && <Image source={{ uri: files[field]!.uri }} style={styles.preview} />}
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Tạo yêu cầu vẽ tranh</Text>
      <Text style={styles.description}>Thông tin tác giả gốc và họa sĩ thực hiện sẽ được lưu riêng.</Text>

      <Text style={styles.label}>Loại yêu cầu</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={type} onValueChange={(value) => setType(value)}>
          <Picker.Item label="Ý tưởng hoàn toàn mới" value="ORIGINAL_COMMISSION" />
          <Picker.Item label="Ảnh/tài liệu cá nhân" value="PERSONAL_REFERENCE" />
          <Picker.Item label="Dựa trên tác phẩm có sẵn" value="EXISTING_ARTWORK" />
        </Picker>
      </View>

      <Input label="Tiêu đề *" value={form.tieuDe} onChangeText={(v: string) => update('tieuDe', v)} />
      <Input label="Mô tả yêu cầu *" value={form.moTa} onChangeText={(v: string) => update('moTa', v)} multiline />
      <Input label="Loại tranh *" value={form.loaiTranh} onChangeText={(v: string) => update('loaiTranh', v)} />
      <Input label="Kích thước *" value={form.kichThuoc} onChangeText={(v: string) => update('kichThuoc', v)} />
      <Input label="Phong cách" value={form.phongCach} onChangeText={(v: string) => update('phongCach', v)} />
      <Input label="Màu sắc" value={form.mauSac} onChangeText={(v: string) => update('mauSac', v)} />
      <Input label="Chất liệu" value={form.chatLieu} onChangeText={(v: string) => update('chatLieu', v)} />
      <Input label="Ngân sách dự kiến" value={form.giaDuKien} onChangeText={(v: string) => update('giaDuKien', v)} keyboardType="numeric" />
      <Input label="Hạn mong muốn (YYYY-MM-DD)" value={form.ngayHoanThanhDuKien} onChangeText={(v: string) => update('ngayHoanThanhDuKien', v)} />

      {type !== 'EXISTING_ARTWORK' && filePicker('reference', 'Ảnh tham khảo')}

      {type === 'PERSONAL_REFERENCE' && (
        <TouchableOpacity style={styles.confirmRow} onPress={() => setConfirmedPersonalRights((value) => !value)}>
          <View style={[styles.checkbox, confirmedPersonalRights && styles.checkboxChecked]}>
            <Text style={styles.checkmark}>{confirmedPersonalRights ? '✓' : ''}</Text>
          </View>
          <Text style={styles.confirmText}>Tôi có quyền sử dụng hình ảnh/tài liệu này để yêu cầu tạo tác phẩm.</Text>
        </TouchableOpacity>
      )}

      {type === 'EXISTING_ARTWORK' && (
        <View style={styles.sourceBox}>
          <Text style={styles.sectionTitle}>Thông tin tác phẩm gốc</Text>
          <Input label="Tên tác phẩm gốc *" value={form.referenceArtworkName} onChangeText={(v: string) => update('referenceArtworkName', v)} />
          <Input label="Tác giả gốc *" value={form.referenceArtistName} onChangeText={(v: string) => update('referenceArtistName', v)} />
          <Input label="Nguồn tác phẩm" value={form.nguonTacPhamGoc} onChangeText={(v: string) => update('nguonTacPhamGoc', v)} />
          {filePicker('source', 'Ảnh tác phẩm gốc')}
          <Text style={styles.label}>Tình trạng quyền sử dụng *</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={permission} onValueChange={(value) => setPermission(value)}>
              <Picker.Item label="Tôi là tác giả/chủ sở hữu quyền" value="AUTHOR_OR_RIGHTS_OWNER" />
              <Picker.Item label="Tôi đã được cho phép" value="PERMISSION_GRANTED" />
              <Picker.Item label="Tác phẩm thuộc phạm vi có thể sử dụng" value="PERMITTED_SCOPE" />
              <Picker.Item label="Tôi không chắc về quyền sử dụng" value="UNSURE" />
            </Picker>
          </View>
          <Input label="Mô tả quyền sử dụng" value={form.moTaQuyenSuDung} onChangeText={(v: string) => update('moTaQuyenSuDung', v)} multiline />
          {filePicker('evidence', 'Ảnh bằng chứng quyền sử dụng (nếu có)')}
        </View>
      )}

      <TouchableOpacity style={[styles.submit, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Gửi yêu cầu</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({ label, multiline, ...props }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor="#9ca3af" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  description: { color: '#6b7280', marginTop: 6, marginBottom: 18, lineHeight: 20 },
  field: { marginBottom: 14 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: '#111827' },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  pickerBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  sourceBox: { backgroundColor: '#fff7ed', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#fed7aa', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#9a3412', marginBottom: 14 },
  upload: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#ea580c', borderRadius: 10, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  uploadText: { color: '#c2410c', fontWeight: '700' },
  preview: { width: '100%', height: 180, marginTop: 8, borderRadius: 10 },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#9ca3af', borderRadius: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  checkmark: { color: '#fff', fontWeight: '800' },
  confirmText: { flex: 1, color: '#374151', lineHeight: 20 },
  submit: { marginTop: 20, backgroundColor: '#ea580c', padding: 15, borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
