import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { favoriteService } from '../services/favoriteService';
import Colors from '../constants/colors';

interface FavoriteButtonProps {
  productId: number;
  size?: 'small' | 'medium' | 'large';
  onToggle?: (isLiked: boolean) => void;
}

export default function FavoriteButton({ 
  productId, 
  size = 'medium',
  onToggle 
}: FavoriteButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkIfLiked();
  }, [productId]);

  const checkIfLiked = async () => {
    try {
      setIsChecking(true);
      const liked = await favoriteService.checkFavorite(productId);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking favorite:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePress = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const newLikedState = await favoriteService.toggleFavorite(productId, isLiked);
      setIsLiked(newLikedState);

      if (onToggle) {
        onToggle(newLikedState);
      }

      // Optional: Show feedback
      // Alert.alert(
      //   'Thành công',
      //   newLikedState ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích'
      // );
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật yêu thích');
    } finally {
      setIsLoading(false);
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 48;
      default: return 40;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 18;
      case 'large': return 28;
      default: return 24;
    }
  };

  const buttonSize = getSize();
  const iconSize = getIconSize();

  if (isChecking) {
    return (
      <TouchableOpacity
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
        disabled
      >
        <ActivityIndicator size="small" color={Colors.gray} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize },
        isLiked && styles.buttonLiked,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isLiked ? Colors.error : Colors.gray} />
      ) : (
        <Text style={{ fontSize: iconSize }}>
          {isLiked ? '❤️' : '🤍'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonLiked: {
    backgroundColor: Colors.white,
  },
});
