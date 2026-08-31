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
} from 'react-native';
import { productService } from '../../services/productService';
import { Product, Category } from '../../types/product';
import ProductCard from '../../components/ProductCard';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import Footer from '../../components/Footer';
import Colors from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Best selling products (highest price 6 - placeholder)
  const bestSellingProducts = products
    .sort((a, b) => b.gia - a.gia)
    .slice(0, 6);

  // Stats
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const inStockProducts = products.filter(p => p.soLuong > 0).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Image
          source={require('../../assets/images/slide1.jpg')}
          style={styles.heroBackgroundImage}
          resizeMode="cover"
        />
        <View style={styles.heroGradient}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroSubtitle}>🎨 Tranh Nghệ Thuật Cao Cấp</Text>
          <Text style={styles.heroDescription}>
            Sơn dầu nhập khẩu • Độ bền hơn 100 năm
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>01</Text>
          <Text style={styles.featureTitle}>CAO CẤP</Text>
          <Text style={styles.featureDesc}>Tranh sơn dầu độc bản</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>02</Text>
          <Text style={styles.featureTitle}>KHÁC BIỆT</Text>
          <Text style={styles.featureDesc}>Sang trọng & tinh tế</Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>03</Text>
          <Text style={styles.featureTitle}>TƯ VẤN</Text>
          <Text style={styles.featureDesc}>Chuyên nghiệp hàng đầu</Text>
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh Mục</Text>
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

      {/* Featured Products */}
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Tác phẩm</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCategories}</Text>
          <Text style={styles.statLabel}>Danh mục</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{inStockProducts}</Text>
          <Text style={styles.statLabel}>Còn hàng</Text>
        </View>
      </View>

      {/* Best Selling Products */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroBanner: {
    height: 220,
    position: 'relative',
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  brandLogo: {
    width: 180,
    height: 50,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: Colors.white,
    marginBottom: 8,
    opacity: 0.95,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkGray,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  featureDesc: {
    fontSize: 10,
    color: Colors.gray,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  badgeTextSelling: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f5576c',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkGray,
    letterSpacing: -0.5,
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 100,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  productGridItem: {
    width: CARD_WIDTH,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  footer: {
    height: 32,
  },
});
