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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { Product, Category } from '../../types/product';
import { Review } from '../../types/review';
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
  const [fiveStarReviews, setFiveStarReviews] = useState<Review[]>([]);
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
      
      // Load 5-star reviews (will be empty until backend is ready)
      loadFiveStarReviews();
    } catch (err: any) {
      console.error('Error loading home data:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiveStarReviews = async () => {
    try {
      const reviews = await reviewService.getAllFiveStarReviews();
      setFiveStarReviews(reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
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

        {/* 3. Giới thiệu Section */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>GIỚI THIỆU</Text>
          
          {/* Nội dung độc đáo */}
          <View style={styles.introBlock}>
            <View style={styles.introLeftBorder} />
            <View style={styles.introContent}>
              <Text style={styles.introSubtitle}>Nội dung độc đáo</Text>
              <Text style={styles.introText}>
                Hơn 1000 tác phẩm Tranh Sáng Tác chỉ có tại Lanvu Gallery, độc quyền và độc bản. Đa dạng chất liệu, chủ đề tranh, màu sắc, kích thước phù hợp mọi không gian nội thất.
              </Text>
            </View>
          </View>

          {/* Chất lượng hoàn hảo */}
          <View style={styles.introBlock}>
            <View style={styles.introLeftBorder} />
            <View style={styles.introContent}>
              <Text style={styles.introSubtitle}>Chất lượng hoàn hảo</Text>
              
              <View style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>●</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Chất liệu sơn dầu cao cấp:</Text> một trong những chất liệu quen thuộc của hội họa Việt Nam và thế giới. Với đặc tính ưu việt có độ bền màu và tính thẩm mỹ cao, tranh sơn dầu hiện đang được những người yêu nghệ thuật ưa chuộng.
                </Text>
              </View>

              <View style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>●</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Chất liệu sơn mài truyền thống:</Text> biểu tượng vĩnh cửu, là chìa khóa để chạm đến tinh hoa văn hóa Việt. Những tác phẩm với chất liệu quý, sự kỳ công sẽ đem tới vẻ đẹp sang trọng cho không gian khiến người xem không thể không thán phục trầm trồ và ngưỡng mộ Gu của chủ nhân bức tranh.
                </Text>
              </View>

              <View style={styles.bulletPoint}>
                <Text style={styles.bulletDot}>●</Text>
                <Text style={styles.bulletText}>
                  Cùng các tác phẩm nghệ thuật sáng tác trên nhiều chất liệu khác được chọn lọc từ các họa sĩ ưu tú nhất như: sơn dầu dát vàng, sơn mài dát vàng, acrylic trên toan, giấy dó, bột màu, màu nước, chất liệu tổng hợp…
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Các con số ấn tượng */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Các con số ấn tượng</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>03</Text>
              <Text style={styles.statLabel}>SHOWROOM</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2500+</Text>
              <Text style={styles.statLabel}>TÁC PHẨM{'\n'}có sẵn</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3500+</Text>
              <Text style={styles.statLabel}>KHÁCH HÀNG{'\n'}đã treo tranh</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5000+</Text>
              <Text style={styles.statLabel}>TÁC PHẨM{'\n'}đã bán ra</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>HỌA SĨ</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>30+</Text>
              <Text style={styles.statLabel}>ĐỐI TÁC</Text>
            </View>
          </View>
        </View>

        {/* 5. Cam kết dịch vụ */}
        <View style={styles.commitmentSection}>
          <View style={styles.commitmentCard}>
            <View style={styles.commitmentImageContainer}>
              <Ionicons name="rocket" size={32} color="#ea580c" />
            </View>
            <View style={styles.commitmentTextContainer}>
              <Text style={styles.commitmentTitle}>Giao hàng toàn quốc</Text>
              <Text style={styles.commitmentDesc}>
                Chúng tôi nhận đóng gói và vận chuyển cho mọi khách hàng trên toàn quốc
              </Text>
            </View>
          </View>

          <View style={styles.commitmentCard}>
            <View style={styles.commitmentImageContainer}>
              <Ionicons name="star" size={32} color="#fbbf24" />
            </View>
            <View style={styles.commitmentTextContainer}>
              <Text style={styles.commitmentTitle}>Chất lượng hàng đầu</Text>
              <Text style={styles.commitmentDesc}>
                Chất lượng tranh tuyệt hảo, màu sắc sống động được vẽ bởi các họa sĩ sáng tạo, có tên tuổi trong giới nghệ thuật
              </Text>
            </View>
          </View>

          <View style={styles.commitmentCard}>
            <View style={styles.commitmentImageContainer}>
              <MaterialCommunityIcons name="palette" size={32} color="#ea580c" />
            </View>
            <View style={styles.commitmentTextContainer}>
              <Text style={styles.commitmentTitle}>Sản phẩm đa dạng</Text>
              <Text style={styles.commitmentDesc}>
                Chúng tôi có nhiều tác phẩm ở nhiều thể loại, chất liệu khác nhau. Ngoài ra tranh cũng có nhiều lựa chọn phù hợp yêu cầu khách hàng
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Categories Horizontal Carousel */}
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
                    <MaterialCommunityIcons name="palette" size={28} color="#ea580c" />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.tenDanhMuc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 7. Featured Artworks Grid */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.badgeContainer}>
                  <Ionicons name="sparkles" size={14} color="#ea580c" />
                  <Text style={styles.badgeText}>MỚI NHẤT</Text>
                </View>
                <Text style={styles.sectionTitle}>Tác Phẩm Nổi Bật</Text>
              </View>
              <TouchableOpacity onPress={handleViewAllProducts} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <Ionicons name="arrow-forward" size={16} color="#ea580c" />
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

        {/* 8. Best Selling Artworks Grid */}
        {bestSellingProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.badgeContainer}>
                  <Ionicons name="flame" size={14} color="#dc2626" />
                  <Text style={styles.badgeTextSelling}>HOT</Text>
                </View>
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

        {/* 9. Customer Reviews - 5 Stars Only */}
        {fiveStarReviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsSectionTitle}>NHẬN XÉT KHÁCH HÀNG</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsContainer}
              snapToInterval={width - 32}
              decelerationRate="fast"
            >
              {fiveStarReviews.map((review) => (
                <View key={review.maDanhGia} style={styles.reviewCard}>

  {/* Ảnh khách hàng / tác phẩm */}
  {(review.hinhAnhDanhGia || review.hinhAnhTacPham) && (
    <Image
      source={{
        uri: review.hinhAnhDanhGia || review.hinhAnhTacPham,
      }}
      style={styles.reviewImage}
      resizeMode="cover"
    />
  )}

  {/* Nội dung nhận xét */}
  <View style={styles.reviewContentBox}>

    <Text style={styles.reviewText} numberOfLines={8}>
      “{review.binhLuan}”
    </Text>

    {/* Nút xem thêm */}
    <TouchableOpacity
      style={styles.reviewReadMore}
      activeOpacity={0.8}
    >
      <Text style={styles.reviewReadMoreText}>
        XEM THÊM
      </Text>
    </TouchableOpacity>

    {/* Thông tin khách hàng */}
    <View style={styles.reviewCustomerInfo}>

      {/* Avatar */}
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>
          {review.tenNguoiDung.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.reviewCustomerDetails}>
        <Text style={styles.reviewCustomerName}>
          {review.tenNguoiDung}
        </Text>
      </View>

    </View>

    {/* Sao */}
    <View style={styles.reviewStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={styles.reviewStar}>
          ★
        </Text>
      ))}
    </View>

    {/* Website */}
    <View style={styles.reviewWebsiteBadge}>
      <Text style={styles.reviewWebsiteText}>
        lanvugallery.com
      </Text>
    </View>

  </View>

</View>
              ))}
            </ScrollView>
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
        <Ionicons name="headset" size={24} color="#ea580c" />
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
  /* Intro Section */
  introSection: {
    backgroundColor: '#f8fafc',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  introBlock: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  introLeftBorder: {
    width: 4,
    backgroundColor: '#dc2626',
    marginRight: 16,
  },
  introContent: {
    flex: 1,
  },
  introSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bulletDot: {
    fontSize: 12,
    color: '#dc2626',
    marginRight: 8,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bulletBold: {
    fontWeight: '600',
    color: '#1e293b',
    fontStyle: 'normal',
  },
  /* Stats Section */
  statsSection: {
    backgroundColor: '#0f172a',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  statsSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  /* Commitment Section */
  commitmentSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 20,
  },
  commitmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
    alignItems: 'flex-start',
  },
  commitmentImageContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  commitmentImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  commitmentIcon: {
    fontSize: 32,
  },
  commitmentTextContainer: {
    flex: 1,
  },
  commitmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  commitmentDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
 /* =========================
   CUSTOMER REVIEWS
========================= */

reviewsSection: {
  backgroundColor: '#F5F5F5',
  paddingTop: 24,
  paddingBottom: 32,
},

reviewsSectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#222222',
  textAlign: 'center',
  marginBottom: 16,
  letterSpacing: 0.3,
},

reviewsContainer: {
  paddingHorizontal: 16,
  gap: 14,
},

/* Card chính */
reviewCard: {
  width: width - 32,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  overflow: 'hidden',
  marginRight: 14,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
},

/* Ảnh */
reviewImage: {
  width: '100%',
  height: 380,
  backgroundColor: '#E5E7EB',
},

/* Nội dung */
reviewContentBox: {
  paddingHorizontal: 20,
  paddingTop: 22,
  paddingBottom: 24,
  alignItems: 'center',
},

/* Nội dung đánh giá */
reviewText: {
  fontSize: 15,
  color: '#444444',
  lineHeight: 24,
  textAlign: 'center',
  fontWeight: '400',
  marginBottom: 16,
},

/* Nút xem thêm */
reviewReadMore: {
  borderWidth: 1,
  borderColor: '#F97316',
  borderRadius: 20,

  paddingHorizontal: 20,
  paddingVertical: 8,

  alignItems: 'center',
  justifyContent: 'center',

  marginBottom: 20,
},

reviewReadMoreText: {
  color: '#F97316',
  fontSize: 12,
  fontWeight: '600',
  letterSpacing: 0.6,
},

/* Thông tin khách hàng */
reviewCustomerInfo: {
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
},

/* Avatar */
reviewAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,

  backgroundColor: '#FFF3E8',

  justifyContent: 'center',
  alignItems: 'center',

  marginRight: 10,
},

reviewAvatarText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#F97316',
},

reviewCustomerDetails: {
  flex: 0,
},

reviewCustomerName: {
  fontSize: 14,
  fontWeight: '500',
  color: '#333333',
},

/* Sao */
reviewStars: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',

  marginBottom: 18,
},

reviewStar: {
  fontSize: 20,
  color: '#F59E0B',
  marginHorizontal: 1,
},

/* Website */
reviewWebsiteBadge: {
  paddingHorizontal: 18,
  paddingVertical: 8,

  borderRadius: 20,

  backgroundColor: '#F3F4F6',

  borderWidth: 1,
  borderColor: '#E5E7EB',
},

reviewWebsiteText: {
  fontSize: 13,
  fontWeight: '500',
  color: '#6B7280',
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 0.5,
  },
  badgeTextSelling: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
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
    backgroundColor: '#fff5f5',
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
});
