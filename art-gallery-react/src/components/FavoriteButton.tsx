import React from 'react';
import { useFavorite } from '../hooks/useFavorite';
import './FavoriteButton.css';

interface FavoriteButtonProps {
  artworkId: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  artworkId, 
  size = 'medium',
  showText = false 
}) => {
  const { isLiked, loading, toggleFavorite } = useFavorite(artworkId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
    await toggleFavorite();
  };

  return (
    <button
      className={`favorite-btn ${size} ${isLiked ? 'liked' : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={isLiked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
    >
      <i className={isLiked ? 'ti-heart' : 'ti-heart'}></i>
      {showText && <span>{isLiked ? 'Đã yêu thích' : 'Yêu thích'}</span>}
    </button>
  );
};

export default FavoriteButton;
