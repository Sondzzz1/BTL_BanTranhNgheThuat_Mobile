import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import StarRating from './StarRating';
import Colors from '../constants/colors';
import { reviewService } from '../services/reviewService';
import { Review } from '../types/review';
import { NormalizedUploadImage, normalizeImageForUpload } from '../utils/imageUpload';

interface AddReviewModalProps {
  visible: boolean;
  productId: number;
  productName: string;
  existingReview?: Review;
  onClose: () => void;
  onReviewAdded: () => void;
}

export default function AddReviewModal({
  visible,
  productId,
  productName,
  existingReview,
  onClose,
  onReviewAdded,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState<NormalizedUploadImage | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setRating(existingReview?.danhGia ?? 5);
    setComment(existingReview?.binhLuan ?? '');
    setReviewImage(null);
    setRemoveExistingImage(false);
  }, [visible, existingReview]);

  const selectImage = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', source === 'camera'
        ? 'Vui lòng cấp quyền sử dụng camera để chụp ảnh đánh giá.'
        : 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    if (result.canceled || !result.assets[0]) return;

    try {
      setReviewImage(await normalizeImageForUpload(result.assets[0], 'review'));
      setRemoveExistingImage(false);
    } catch {
      Alert.alert('Không thể xử lý ảnh', 'Vui lòng chọn ảnh JPG, PNG hoặc WEBP khác.');
    }
  };

  const showImageOptions = () => {
    Alert.alert('Thêm ảnh đánh giá', 'Chọn nguồn ảnh', [
      { text: 'Hủy', style: 'cancel' },
      { text: '📷 Chụp ảnh', onPress: () => void selectImage('camera') },
      { text: '🖼️ Chọn từ thư viện', onPress: () => void selectImage('library') },
    ]);
  };

  const removeImage = () => {
    if (reviewImage) {
      setReviewImage(null);
      return;
    }
    setRemoveExistingImage(true);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);
      if (existingReview) {
        const request = {
          danhGia: rating,
          binhLuan: comment.trim() || undefined,
        };
        if (reviewImage || removeExistingImage) {
          await reviewService.updateReviewWithImage(existingReview.maDanhGia, request, reviewImage || undefined, removeExistingImage);
        } else {
          await reviewService.updateReview(existingReview.maDanhGia, request);
        }
      } else {
        const request = {
          maTacPham: productId,
          danhGia: rating,
          binhLuan: comment.trim() || undefined,
        };
        if (reviewImage) {
          await reviewService.addReviewWithImage(request, reviewImage);
        } else {
          await reviewService.addReview(request);
        }
      }

      Alert.alert('Thành công', existingReview ? 'Đánh giá đã được cập nhật' : 'Đánh giá của bạn đã được gửi');
      handleClose();
      onReviewAdded();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    setReviewImage(null);
    setRemoveExistingImage(false);
    onClose();
  };

  const previewImage = reviewImage?.uri || (!removeExistingImage ? existingReview?.hinhAnhDanhGia : undefined);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{existingReview ? 'Sửa đánh giá' : 'Đánh giá sản phẩm'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.label}>Đánh giá của bạn</Text>
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={rating}
                  size={32}
                  interactive
                  onRatingChange={setRating}
                />
                <Text style={styles.ratingText}>
                  {rating === 5
                    ? 'Tuyệt vời!'
                    : rating === 4
                    ? 'Rất tốt'
                    : rating === 3
                    ? 'Bình thường'
                    : rating === 2
                    ? 'Tạm được'
                    : 'Không tốt'}
                </Text>
              </View>
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.label}>Nhận xét (Không bắt buộc)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                placeholderTextColor={Colors.gray}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{comment.length}/500</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Ảnh đánh giá (Không bắt buộc)</Text>
              {previewImage ? (
                <>
                  <Image source={{ uri: previewImage }} style={styles.reviewImagePreview} resizeMode="cover" />
                  <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.imageActionButton} onPress={showImageOptions}>
                      <Text style={styles.imageActionText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                      <Text style={styles.removeImageText}>Xóa ảnh</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                  <Text style={styles.addImageButtonText}>🖼️ Thêm ảnh đánh giá</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.imageHint}>Chấp nhận JPG, PNG hoặc WEBP; tối đa 5 MB.</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>{existingReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.gray,
  },
  scrollContent: {
    padding: 20,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.darkGray,
    minHeight: 120,
    backgroundColor: Colors.white,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'right',
    marginTop: 8,
  },
  addImageButton: {
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  addImageButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewImagePreview: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  imageActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
  },
  imageActionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  removeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeImageText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
  imageHint: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
