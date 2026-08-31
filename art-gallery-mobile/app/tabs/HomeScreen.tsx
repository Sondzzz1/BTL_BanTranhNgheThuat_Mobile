import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { productService } from '../../services/productService';
import { Product, Category } from '../../types/product';
import ProductCard from '../../components/ProductCard';
import AppHeader from '../../components/AppHeader';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import Footer from '../../components/Footer';
import Colors from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories(),
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error loading home data:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { id: product.maTacPham });
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Products', { categoryId: category.maDanhMuc });
  };

  const handleViewAllProducts = () => {
    navigation.navigate('Products');
  };

  const handleSupportPress = () => {
    Alert.alert(
      'Hỗ trợ khách hàng',
      'Hotline: 094 888 3535 - 094 886 3535\nEmail: lanvugallery@gmail.com',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Gọi ngay',
          onPress: () => Linking.openURL('tel:0948883535'),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading message="Đang tải dữ liệu..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  // Featured products (newest 6)
  const featuredProducts = products
    .sort((a, b) => b.maTacPham - a.maTacPham)
    .slice(0, 6);

  // Best selling products (highest price 6)
  const bestSellingProducts = products
    .sort((a, b) => b.gia - a.gia)
    .slice(0, 6);

  return (
    <View style={styles.mainContainer}>
      {/* Branded Top Header */}
      <AppHeader navigation={navigation} />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Promo Banner */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={require('../../assets/images/slide1.jpg')}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerLogoBox}>
              <View style={styles.roofIconMini} />
              <Text style={styles.bannerLogoText}>LANVU GALLERY</Text>
            </View>
            <Text style={styles.bannerPromoTitle}>THÁNG TRI ÂN{'\n'}KHÁCH HÀNG</Text>
            <View style={styles.bannerDiscountRow}>
              <Text style={styles.bannerDiscountLabel}>ƯU ĐÃI ĐẾN</Text>
              <Text style={styles.bannerDiscountValue}>40%</Text>
            </View>
            <Text style={styles.bannerDateText}>01.08 - 31.08.2026</Text>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* 2. Feature Highlights (Dark Charcoal / Black Box Theme) */}
        <View style={styles.featuresDarkSection}>
          <View style={styles.featureDarkCard}>
            <View style={styles.featureHeaderRow}>
              <Text style={styles.featureBigNum}>01.</Text>
              <Text style={styles.featureCardTitle}>TRANH SÁNG TÁC ĐỘC BẢN</Text>
            </View>
            <Text style={styles.featureCardDesc}>
              Hàng ngàn tác phẩm sáng tác độc bản, đa dạng chất liệu
            </Text>
          </View>

          <View style={styles.featureDarkCard}>
            <View style={styles.featureHeaderRow}>
              <Text style={styles.featureBigNum}>02.</Text>
              <Text style={styles.featureCardTitle}>SỰ KHÁC BIỆT</Text>
            </View>
            <Text style={styles.featureCardDesc}>
              Sang trọng - tinh tế - kiến tạo không gian hiện đại
            </Text>
          </View>

          <View style={styles.featureDarkCard}>
            <View style={styles.featureHeaderRow}>
              <Text style={styles.featureBigNum}>03.</Text>
              <Text style={styles.featureCardTitle}>TƯ VẤN CHUYÊN NGHIỆP</Text>
            </View>
            <Text style={styles.featureCardDesc}>
              Đội ngũ chuyên gia hàng đầu trong lĩnh vực nghệ thuật
            </Text>
          </View>
        </View>

        {/* 3. Categories Horizontal Carousel */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh Mục Tranh</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.maDanhMuc}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryIcon}>🎨</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.tenDanhMuc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Featured Artworks Grid */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.badgeText}>✨ MỚI NHẤT</Text>
                <Text style={styles.sectionTitle}>Tác Phẩm Nổi Bật</Text>
              </View>
              <TouchableOpacity onPress={handleViewAllProducts} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <View key={product.maTacPham} style={styles.productGridItem}>
                  <ProductCard
                    product={product}
                    onPress={() => handleProductPress(product)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Best Selling Artworks Grid */}
        {bestSellingProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.badgeTextSelling}>🔥 HOT</Text>
                <Text style={styles.sectionTitle}>Tác Phẩm Bán Chạy</Text>
              </View>
            </View>
            
            <View style={styles.productsGrid}>
              {bestSellingProducts.map((product) => (
                <View key={product.maTacPham} style={styles.productGridItem}>
                  <ProductCard
                    product={product}
                    onPress={() => handleProductPress(product)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Footer navigation={navigation} />
      </ScrollView>

      {/* Floating Support Button at bottom left */}
      <TouchableOpacity
        style={styles.floatingSupportButton}
        onPress={handleSupportPress}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingSupportIcon}>🎧</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  /* Hero Promo Banner */
  heroBannerContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  bannerLogoBox: {
    alignItems: 'center',
    marginBottom: 6,
  },
  roofIconMini: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ea580c',
    marginBottom: 1,
  },
  bannerLogoText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  bannerPromoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fef08a',
    textAlign: 'right',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bannerDiscountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  bannerDiscountLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  bannerDiscountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fbbf24',
  },
  bannerDateText: {
    fontSize: 10,
    color: '#e2e8f0',
    marginTop: 2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 8,
    height: 8,
  },
  /* Dark Feature Section */
  featuresDarkSection: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 14,
  },
  featureDarkCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 4,
    padding: 16,
  },
  featureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBigNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#d4d4d8',
    marginRight: 6,
  },
  featureCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: 0.5,
    flex: 1,
  },
  featureCardDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  /* Sections */
  section: {
    marginTop: 20,
    marginBottom: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  badgeTextSelling: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 13,
    color: '#ea580c',
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    width: 96,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 15,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  productGridItem: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  /* Floating Support Button */
  floatingSupportButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 99,
  },
  floatingSupportIcon: {
    fontSize: 22,
  },
});
