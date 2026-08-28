// Custom Hook for Favorite functionality
import { useState, useEffect } from 'react';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from './useAuth';

export const useFavorite = (artworkId: number) => {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && artworkId) {
      checkFavoriteStatus();
    } else {
      setIsLiked(false);
    }
  }, [artworkId, isAuthenticated]);

  const checkFavoriteStatus = async () => {
    try {
      const liked = await favoriteService.checkFavorite(artworkId);
      setIsLiked(liked);
    } catch (error) {
      console.error('Lỗi kiểm tra yêu thích:', error);
      setIsLiked(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return false;
    }

    setLoading(true);
    try {
      if (isLiked) {
        await favoriteService.removeFavorite(artworkId);
        setIsLiked(false);
      } else {
        await favoriteService.addFavorite(artworkId);
        setIsLiked(true);
      }
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, loading, toggleFavorite };
};
