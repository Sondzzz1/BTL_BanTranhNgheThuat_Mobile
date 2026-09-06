import React, { useState } from 'react';
import {
  View,
  Text,
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
import StarRating from './StarRating';
import Colors from '../constants/colors';
import { reviewService } from '../services/reviewService';

interface AddReviewModalProps {
  visible: boolean;
  productId: number;
  productName: string;
  onClose: () => void;
  onReviewAdded: () => void;
}

export default function AddReviewModal({
  visible,
  productId,
  productName,
  onClose,
  onReviewAdded,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);
      await reviewService.addReview({
        maTacPham: productId,
        danhGia: rating,
        binhLuan: comment.trim() || undefined,
      });

      Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi');
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
    onClose();
  };

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
            <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
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
                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
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
