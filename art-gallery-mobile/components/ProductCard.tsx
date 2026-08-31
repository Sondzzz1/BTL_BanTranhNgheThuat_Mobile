import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProductCard({
  product,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const isOutOfStock = product.soLuong === 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isOutOfStock}
    >
      {/* Artwork Image Box */}
      <View style={styles.imageContainer}>
        {product.hinhAnh ? (
          <Image
            source={{ uri: product.hinhAnh }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🖼️</Text>
          </View>
        )}

        {/* Favorite Icon Button on top right */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite ? onToggleFavorite : onPress}
          activeOpacity={0.7}
        >
          <View style={styles.favoriteCircle}>
            <Text style={styles.favoriteIconText}>{isFavorite ? '❤️' : '🤍'}</Text>
          </View>
        </TouchableOpacity>

        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>

      {/* Artwork Info below Image */}
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>
          {(product.tenDanhMuc || 'TRANH SƠN DẦU').toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.tenTacPham}
        </Text>
        {product.tenHoaSi && (
          <Text style={styles.artist} numberOfLines={1}>
            {product.tenHoaSi}
          </Text>
        )}
        <Text style={styles.price}>{formatPrice(product.gia)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2d3748',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 40,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  favoriteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconText: {
    fontSize: 14,
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  category: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  artist: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 4,
  },
  price: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ea580c',
  },
});
