import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { returnService } from '../../services/returnService';
import { OrderItem } from '../../types/order';
import { RETURN_REASONS, TaoHoanTraRequest } from '../../types/return';

interface ReturnRequestScreenProps {
  route: any;
  navigation: any;
}

export default function ReturnRequestScreen({ route, navigation }: ReturnRequestScreenProps) {
  const { orderId, orderItems, orderDate } = route.params as {
    orderId: number;
    orderItems: OrderItem[];
    orderDate: string;
  };

  // Form state
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sản phẩm được chọn để hoàn trả
  const selectedItem = selectedItemIndex !== null ? orderItems[selectedItemIndex] : null;

  const formatPrice = (price: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Kiểm tra xem còn trong thời hạn 7 ngày không
  const checkReturnEligibility = (): boolean => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const daysDiff = Math.floor((currentTime - orderTime) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  };

  const getDaysRemaining = (): number => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const daysDiff = Math.floor((currentTime - orderTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysDiff);
  };

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Thông báo', 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  // Chụp ảnh mới
  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Thông báo', 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền sử dụng camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  // Xóa ảnh
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Hiển thị tùy chọn chọn ảnh
  const showImageOptions = () => {
    Alert.alert(
      'Thêm hình ảnh',
      'Chọn nguồn hình ảnh',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: '📷 Chụp ảnh', onPress: takePhoto },
        { text: '🖼️ Chọn từ thư viện', onPress: pickImage },
      ]
    );
  };

  const handleSubmit = async () => {
    // Kiểm tra thời hạn
    if (!checkReturnEligibility()) {
      Alert.alert('Thông báo', 'Đã quá thời hạn 7 ngày để yêu cầu hoàn trả sản phẩm');
      return;
    }

    // Validate: phải chọn sản phẩm
    if (selectedItem === null || selectedItemIndex === null) {
      Alert.alert('Lỗi', 'Vui lòng chọn sản phẩm cần hoàn trả');
      return;
    }
    // Validate: phải chọn lý do
    if (!selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do hoàn trả');
      return;
    }
    // Validate: lý do khác phải nhập mô tả
    if (selectedReason === 'LY_DO_KHAC' && !customReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do cụ thể');
      return;
    }

    try {
      setIsSubmitting(true);

      const request: TaoHoanTraRequest = {
        maDonHang: orderId,
        maTacPham: selectedItem.maTacPham,
        lyDo: selectedReason,
        lyDoKhac: selectedReason === 'LY_DO_KHAC' ? customReason.trim() : undefined,
        moTa: description.trim() || undefined,
        hinhAnh: images.length > 0 ? images : undefined,
      };

      const result = await returnService.createReturnRequest(request);

      Alert.alert('Thành công! 🎉', result.message, [
        {
          text: 'Xem yêu cầu',
          onPress: () => {
            navigation.replace('ReturnDetail', { returnId: result.maYeuCau });
          },
        },
        {
          text: 'Về trang chủ',
          onPress: () => navigation.navigate('Orders'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu hoàn trả. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">

        {/* Cảnh báo thời hạn */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⏰ Thời hạn hoàn trả</Text>
          <Text style={styles.warningText}>
            Bạn còn <Text style={styles.warningDays}>{getDaysRemaining()} ngày</Text> để yêu cầu hoàn trả sản phẩm (trong vòng 7 ngày kể từ khi đơn hàng hoàn thành).
          </Text>
        </View>

        {/* BƯỚC 1: Chọn sản phẩm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Chọn sản phẩm cần hoàn trả</Text>
          {orderItems.map((item, index) => (
            <TouchableOpacity
              key={item.maChiTietDH ?? index}
              style={[
                styles.itemCard,
                selectedItemIndex === index && styles.itemCardSelected,
              ]}
              onPress={() => setSelectedItemIndex(index)}
              activeOpacity={0.7}
            >
              {/* Radio button */}
              <View style={[
                styles.radioOuter,
                selectedItemIndex === index && styles.radioOuterSelected,
              ]}>
                {selectedItemIndex === index && <View style={styles.radioInner} />}
              </View>

              {/* Ảnh sản phẩm */}
              <View style={styles.itemImageContainer}>
                {item.hinhAnh ? (
                  <Image source={{ uri: item.hinhAnh }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemImagePlaceholderText}>🖼️</Text>
                  </View>
                )}
              </View>

              {/* Thông tin sản phẩm */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.tenTacPham || 'Tác phẩm'}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.donGia)}</Text>
                <Text style={styles.itemQty}>Số lượng: {item.soLuong}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* BƯỚC 2: Chọn lý do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Lý do hoàn trả</Text>
          {RETURN_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonItem,
                selectedReason === reason.value && styles.reasonItemSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioOuter,
                selectedReason === reason.value && styles.radioOuterSelected,
              ]}>
                {selectedReason === reason.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.reasonLabel,
                selectedReason === reason.value && styles.reasonLabelSelected,
              ]}>
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Input lý do khác */}
          {selectedReason === 'LY_DO_KHAC' && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="Nhập lý do cụ thể..."
              placeholderTextColor="#9ca3af"
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
          )}
        </View>

        {/* BƯỚC 3: Mô tả chi tiết */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>3. Mô tả chi tiết</Text>
            <Text style={styles.optional}>(Tùy chọn)</Text>
          </View>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Mô tả chi tiết vấn đề gặp phải với sản phẩm..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/1000 ký tự</Text>
        </View>

        {/* BƯỚC 4: Hình ảnh minh chứng */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>4. Hình ảnh sản phẩm</Text>
            <Text style={styles.optional}>(Tùy chọn, tối đa 5 ảnh)</Text>
          </View>

          {/* Danh sách ảnh đã chọn */}
          {images.length > 0 && (
            <View style={styles.imagesGrid}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: img }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Nút thêm ảnh */}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
              <Text style={styles.addImageIcon}>📸</Text>
              <Text style={styles.addImageText}>Thêm hình ảnh</Text>
              <Text style={styles.addImageCount}>({images.length}/5)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Thông tin thêm */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Yêu cầu hoàn trả sẽ được xem xét trong 1-3 ngày làm việc. Chúng tôi sẽ liên hệ với bạn để hướng dẫn gửi sản phẩm về.
          </Text>
        </View>

        {/* Padding bottom để tránh bị nút che */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer - Nút gửi */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonLoading}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Đang gửi...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>GỬI YÊU CẦU HOÀN TRẢ</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  optional: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Radio button
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: '#2563eb',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  // Item card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  itemCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  itemImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Lý do
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reasonItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  reasonLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  reasonLabelSelected: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    marginTop: 8,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  // Mô tả
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 6,
  },
  // Info box
  infoBox: {
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Warning box
  warningBox: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  warningDays: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#dc2626',
  },
  // Image upload
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  addImageCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
