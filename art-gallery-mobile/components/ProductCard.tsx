import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
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
      activeOpacity={0.7}
      disabled={isOutOfStock}
    >
      {/* Image */}
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
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.tenTacPham}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {product.tenHoaSi}
        </Text>
        {product.tenDanhMuc && (
          <Text style={styles.category} numberOfLines={1}>
            {product.tenDanhMuc}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.gia)}</Text>
          {!isOutOfStock && (
            <Text style={styles.stock}>Còn {product.soLuong}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
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
    fontSize: 48,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  stock: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
});
