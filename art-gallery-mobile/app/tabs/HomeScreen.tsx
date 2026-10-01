import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import ErrorMessage from '../../components/ErrorMessage';
import Footer from '../../components/Footer';
import Loading from '../../components/Loading';
import ProductCard from '../../components/ProductCard';
import Colors from '../../constants/colors';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { Category, Product } from '../../types/product';
import { Review } from '../../types/review';

interface HomeScreenProps {
  navigation: any;
}

interface ProductRailProps {
  title: string;
  eyebrow: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  products: Product[];
  cardWidth: number;
  onProductPress: (product: Product) => void;
  onViewAll: () => void;
}

function ProductRail({
  title,
  eyebrow,
  icon,
  iconColor,
  products,
  cardWidth,
  onProductPress,
  onViewAll,
}: ProductRailProps) {
  if (!products.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeadingRow}>
        <View style={styles.sectionHeadingText}>
          <View style={styles.eyebrowRow}>
            <Ionicons name={icon} size={14} color={iconColor} />
            <Text style={[styles.eyebrow, { color: iconColor }]}>{eyebrow}</Text>
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="arrow-forward" size={15} color="#c2410c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productRail}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12}
      >
        {products.map(product => (
          <View key={product.maTacPham} style={[styles.productRailItem, { width: cardWidth }]}>
            <ProductCard product={product} onPress={() => onProductPress(product)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fiveStarReviews, setFiveStarReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showFullLoading = true) => {
    try {
      setError(null);
      if (showFullLoading) setIsLoading(true);

      const [productsData, categoriesData, bestSellingData, reviewsData] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories(),
        productService.getBestSellingProducts(6).catch(() => []),
        reviewService.getAllFiveStarReviews().catch(() => []),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setBestSellingProducts(bestSellingData);
      setFiveStarReviews(reviewsData);
    } catch (err: any) {
      console.error('Error loading home data:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleSupportPress = () => {
    Alert.alert(
      'Hỗ trợ khách hàng',
      'Hotline: 094 888 3535 - 094 886 3535\nEmail: lanvugallery@gmail.com',
      [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Gọi ngay', onPress: () => Linking.openURL('tel:0948883535') },
      ]
    );
  };

  if (isLoading) return <Loading message="Đang tải bộ sưu tập..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => void loadData()} />;

  const latestProducts = [...products]
    .sort((a, b) => b.maTacPham - a.maTacPham)
    .slice(0, 6);
  const displayedBestSelling = bestSellingProducts.length
    ? bestSellingProducts
    : latestProducts.slice(0, 4);
  const cardWidth = Math.min(Math.max(width * 0.58, 188), 232);
  const reviewWidth = Math.max(width - 48, 280);
  const openProduct = (product: Product) => navigation.navigate('ProductDetail', { id: product.maTacPham });
  const openProducts = () => navigation.navigate('Products');

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.hero}>
          <Image source={require('../../assets/images/slide1.jpg')} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Ionicons name="sparkles" size={13} color="#fff7ed" />
              <Text style={styles.heroPillText}>NGHỆ THUẬT CHO MỌI KHÔNG GIAN</Text>
            </View>
            <Text style={styles.heroTitle}>Tìm tác phẩm{`\n`}kể câu chuyện của bạn</Text>
            <Text style={styles.heroSubtitle}>Tranh độc bản được tuyển chọn từ các họa sĩ Việt Nam.</Text>
            <TouchableOpacity style={styles.heroButton} onPress={openProducts} activeOpacity={0.85}>
              <Text style={styles.heroButtonText}>Khám phá bộ sưu tập</Text>
              <Ionicons name="arrow-forward" size={17} color="#9a3412" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#c2410c" />
            <Text style={styles.trustText}>Tác phẩm{`\n`}đã kiểm duyệt</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="cube-outline" size={22} color="#c2410c" />
            <Text style={styles.trustText}>Đóng gói{`\n`}an toàn</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="headset-outline" size={22} color="#c2410c" />
            <Text style={styles.trustText}>Tư vấn{`\n`}tận tâm</Text>
          </View>
        </View>

        <View style={styles.serviceSection}>
          <View style={styles.simpleHeadingRow}>
            <View>
              <Text style={styles.eyebrow}>DỊCH VỤ NGHỆ THUẬT</Text>
              <Text style={styles.sectionTitle}>Dành riêng cho bạn</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ArtServices')}>
              <Text style={styles.inlineLink}>Xem dịch vụ</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.serviceGrid}>
            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardWarm]} onPress={() => navigation.navigate('CustomArtIntro')}>
              <View style={styles.serviceIconWarm}>
                <Ionicons name="color-palette-outline" size={25} color="#c2410c" />
              </View>
              <Text style={styles.serviceTitle}>Vẽ theo yêu cầu</Text>
              <Text style={styles.serviceDescription}>Hiện thực hóa ý tưởng thành tác phẩm của riêng bạn.</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#c2410c" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardDark]} onPress={() => navigation.navigate('ConsultationIntro')}>
              <View style={styles.serviceIconDark}>
                <MaterialCommunityIcons name="sofa-outline" size={25} color="#f8fafc" />
              </View>
              <Text style={[styles.serviceTitle, styles.serviceTitleLight]}>Tư vấn không gian</Text>
              <Text style={[styles.serviceDescription, styles.serviceDescriptionLight]}>Chọn tranh phù hợp màu sắc, diện tích và phong cách.</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#fed7aa" />
            </TouchableOpacity>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.categorySection}>
            <View style={[styles.simpleHeadingRow, styles.categorySectionHeading]}>
              <Text style={styles.sectionTitle}>Khám phá theo danh mục</Text>
              <TouchableOpacity onPress={openProducts}><Text style={styles.inlineLink}>Tất cả</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              <TouchableOpacity style={[styles.categoryChip, styles.categoryChipActive]} onPress={openProducts}>
                <Ionicons name="grid-outline" size={17} color="#fff" />
                <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}>Tất cả</Text>
              </TouchableOpacity>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.maDanhMuc}
                  style={styles.categoryChip}
                  onPress={() => navigation.navigate('Products', { categoryId: category.maDanhMuc })}
                >
                  <MaterialCommunityIcons name="palette-outline" size={17} color="#9a3412" />
                  <Text style={styles.categoryChipText} numberOfLines={1}>
                    {category.tenDanhMuc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ProductRail
          title="Sản phẩm mới nhất"
          eyebrow="VỪA CẬP NHẬT"
          icon="sparkles-outline"
          iconColor="#c2410c"
          products={latestProducts}
          cardWidth={cardWidth}
          onProductPress={openProduct}
          onViewAll={openProducts}
        />

        <ProductRail
          title="Sản phẩm bán chạy"
          eyebrow="ĐƯỢC YÊU THÍCH"
          icon="flame-outline"
          iconColor="#b91c1c"
          products={displayedBestSelling}
          cardWidth={cardWidth}
          onProductPress={openProduct}
          onViewAll={openProducts}
        />

        <TouchableOpacity style={styles.consultBanner} onPress={() => navigation.navigate('ConsultationIntro')} activeOpacity={0.88}>
          <View style={styles.consultCopy}>
            <Text style={styles.consultEyebrow}>CHƯA BIẾT CHỌN TRANH NÀO?</Text>
            <Text style={styles.consultTitle}>Để chuyên gia giúp bạn hoàn thiện không gian</Text>
            <View style={styles.consultCta}>
              <Text style={styles.consultCtaText}>Đặt lịch tư vấn</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
          <MaterialCommunityIcons name="image-frame" size={72} color="rgba(255,255,255,.2)" />
        </TouchableOpacity>

        {fiveStarReviews.length > 0 && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeading}>
              <Text style={styles.eyebrow}>KHÁCH HÀNG NÓI GÌ</Text>
              <Text style={styles.sectionTitle}>Trải nghiệm cùng Lanvu</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewRail}>
              {fiveStarReviews.slice(0, 6).map(review => (
                <View key={review.maDanhGia} style={[styles.reviewCard, { width: reviewWidth }]}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(star => <Ionicons key={star} name="star" size={15} color="#f59e0b" />)}
                  </View>
                  <Text style={styles.reviewText} numberOfLines={5}>“{review.binhLuan || 'Một trải nghiệm nghệ thuật đáng nhớ.'}”</Text>
                  <View style={styles.reviewerRow}>
                    <View style={styles.reviewerAvatar}><Text style={styles.reviewerInitial}>{review.tenNguoiDung?.charAt(0).toUpperCase() || 'K'}</Text></View>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.tenNguoiDung || 'Khách hàng'}</Text>
                      {review.tenTacPham ? <Text style={styles.reviewProduct} numberOfLines={1}>{review.tenTacPham}</Text> : null}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Footer navigation={navigation} />
      </ScrollView>

      <TouchableOpacity style={styles.supportButton} onPress={handleSupportPress} activeOpacity={0.85} accessibilityLabel="Liên hệ hỗ trợ">
        <Ionicons name="headset" size={23} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  hero: { height: 330, backgroundColor: '#1c1917', position: 'relative', overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12, 10, 9, .58)' },
  heroContent: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 28, maxWidth: 430 },
  heroPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.35)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,.1)' },
  heroPillText: { color: '#fff7ed', fontSize: 10, fontWeight: '800', letterSpacing: .7 },
  heroTitle: { marginTop: 13, color: '#fff', fontSize: 30, lineHeight: 37, fontWeight: '900', letterSpacing: -.6 },
  heroSubtitle: { marginTop: 9, maxWidth: 330, color: '#e7e5e4', fontSize: 14, lineHeight: 21 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#fff7ed' },
  heroButtonText: { color: '#9a3412', fontSize: 13, fontWeight: '800' },
  trustStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 14, marginTop: -12, paddingVertical: 15, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#fff', elevation: 4, shadowColor: '#0f172a', shadowOpacity: .1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  trustItem: { flex: 1, alignItems: 'center', gap: 5 },
  trustText: { color: '#475569', fontSize: 10.5, lineHeight: 14, fontWeight: '700', textAlign: 'center' },
  trustDivider: { width: 1, height: 34, backgroundColor: '#e2e8f0' },
  serviceSection: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 12 },
  simpleHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 14 },
  eyebrow: { color: '#c2410c', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { marginTop: 4, color: '#172033', fontSize: 21, lineHeight: 27, fontWeight: '900', letterSpacing: -.35 },
  inlineLink: { color: '#c2410c', fontSize: 12.5, fontWeight: '800' },
  serviceGrid: { flexDirection: 'row', gap: 11 },
  serviceCard: { flex: 1, minHeight: 200, borderRadius: 18, padding: 15, justifyContent: 'space-between' },
  serviceCardWarm: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  serviceCardDark: { backgroundColor: '#292524' },
  serviceIconWarm: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#ffedd5' },
  serviceIconDark: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#44403c' },
  serviceTitle: { marginTop: 14, color: '#172033', fontSize: 15.5, lineHeight: 20, fontWeight: '900' },
  serviceTitleLight: { color: '#fff' },
  serviceDescription: { flex: 1, marginTop: 7, marginBottom: 12, color: '#64748b', fontSize: 12, lineHeight: 18 },
  serviceDescriptionLight: { color: '#d6d3d1' },
  categorySection: { paddingVertical: 22 },
  categorySectionHeading: { paddingHorizontal: 16 },
  categoryRail: { paddingHorizontal: 16, gap: 9 },
  categoryChip: { maxWidth: 170, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#fed7aa', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#fff' },
  categoryChipActive: { backgroundColor: '#c2410c', borderColor: '#c2410c' },
  categoryChipText: { flexShrink: 1, color: '#7c2d12', fontSize: 12.5, fontWeight: '700' },
  categoryChipTextActive: { color: '#fff' },
  section: { paddingVertical: 24, backgroundColor: '#fff', marginBottom: 10 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, marginBottom: 15 },
  sectionHeadingText: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  viewAllText: { color: '#c2410c', fontSize: 12, fontWeight: '800' },
  productRail: { paddingHorizontal: 16, gap: 12 },
  productRailItem: { paddingBottom: 2 },
  consultBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginVertical: 18, overflow: 'hidden', borderRadius: 20, padding: 20, backgroundColor: '#9a3412' },
  consultCopy: { flex: 1, paddingRight: 10 },
  consultEyebrow: { color: '#fed7aa', fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  consultTitle: { marginTop: 7, color: '#fff', fontSize: 19, lineHeight: 26, fontWeight: '900' },
  consultCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  consultCtaText: { color: '#fff', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  reviewSection: { paddingVertical: 28, backgroundColor: '#f1f5f9' },
  reviewHeading: { paddingHorizontal: 16, marginBottom: 14 },
  reviewRail: { paddingHorizontal: 16, gap: 12 },
  reviewCard: { minHeight: 190, justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 18, backgroundColor: '#fff' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { marginVertical: 14, color: '#334155', fontSize: 14.5, lineHeight: 23, fontStyle: 'italic' },
  reviewerRow: { flexDirection: 'row', alignItems: 'center' },
  reviewerAvatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#ffedd5' },
  reviewerInitial: { color: '#c2410c', fontSize: 15, fontWeight: '900' },
  reviewerInfo: { flex: 1, marginLeft: 10 },
  reviewerName: { color: '#172033', fontSize: 13.5, fontWeight: '800' },
  reviewProduct: { marginTop: 2, color: '#64748b', fontSize: 11.5 },
  supportButton: { position: 'absolute', right: 16, bottom: 18, width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 3, borderColor: '#fff', backgroundColor: '#c2410c', elevation: 8, shadowColor: '#0f172a', shadowOpacity: .25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
