import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArtworkImage from '../../components/ArtworkImage';
import { productService } from '../../services/productService';
import { Product } from '../../types/product';
import { formatVnd } from '../../utils/currency';
import ServiceTheme from '../../constants/serviceTheme';

const HERO_IMAGE = require('../../assets/images/slide2.webp');
const CUSTOM_ART_IMAGE = require('../../assets/images/slide3.jpg');
const CONSULTATION_IMAGE = require('../../assets/images/slide1.jpg');

export default function ArtServicesScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setProducts(await productService.getAllProducts());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Không thể tải tác phẩm nổi bật lúc này.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const featured = useMemo(
    () => [...products].sort((a, b) => b.maTacPham - a.maTacPham).slice(0, 6),
    [products]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.eyebrowLight}>LANVU GALLERY · ART SERVICES</Text>
            <Text style={styles.heroTitle}>Dịch vụ nghệ thuật{`\n`}dành riêng cho bạn</Text>
            <Text style={styles.heroDescription}>
              Từ một ý tưởng cá nhân đến lựa chọn tác phẩm cho không gian, chúng tôi đồng hành bằng
              quy trình rõ ràng và sự chăm chút của người làm nghệ thuật.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>TRẢI NGHIỆM CÁ NHÂN HÓA</Text>
          <Text style={styles.sectionTitle}>Nghệ thuật bắt đầu từ câu chuyện của bạn</Text>
          <Text style={styles.bodyText}>
            Khám phá dịch vụ đặt vẽ theo mong muốn hoặc nhận tư vấn để tìm tác phẩm hài hòa với kiến
            trúc, màu sắc và nhịp sống trong không gian của bạn.
          </Text>
        </View>

        <View style={styles.servicesSection}>
          <ServiceCard
            image={CUSTOM_ART_IMAGE}
            icon="color-palette-outline"
            index="01"
            title="Vẽ tranh theo yêu cầu"
            description="Gửi ý tưởng, nhận báo giá từ họa sĩ và theo dõi từng dấu mốc thực hiện."
            action="Khám phá dịch vụ"
            onPress={() => navigation.navigate('CustomArtIntro')}
          />
          <ServiceCard
            image={CONSULTATION_IMAGE}
            icon="home-outline"
            index="02"
            title="Tư vấn nghệ thuật & không gian"
            description="Chọn chủ đề, màu sắc, kích thước và bố cục tranh phù hợp với không gian."
            action="Xem dịch vụ tư vấn"
            onPress={() => navigation.navigate('ConsultationIntro')}
          />
        </View>

        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.eyebrow}>TUYỂN CHỌN TỪ GALLERY</Text>
              <Text style={styles.sectionTitle}>Tác phẩm nổi bật</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.feedbackBox}>
              <ActivityIndicator color={ServiceTheme.accent} />
              <Text style={styles.feedbackText}>Đang tuyển chọn tác phẩm...</Text>
            </View>
          ) : error ? (
            <View style={styles.feedbackBox}>
              <Ionicons name="cloud-offline-outline" size={28} color={ServiceTheme.muted} />
              <Text style={styles.feedbackText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFeatured}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : featured.length === 0 ? (
            <View style={styles.feedbackBox}>
              <Ionicons name="images-outline" size={30} color={ServiceTheme.muted} />
              <Text style={styles.feedbackText}>Bộ sưu tập đang được cập nhật.</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => String(item.maTacPham)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              initialNumToRender={3}
              windowSize={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.artworkCard}
                  onPress={() => navigation.navigate('ProductDetail', { id: item.maTacPham })}
                  activeOpacity={0.86}
                >
                  <ArtworkImage
                    source={item.hinhAnh ? { uri: item.hinhAnh } : undefined}
                    containerStyle={styles.artworkImage}
                    style={styles.artworkImage}
                    accessibilityLabel={`Tác phẩm ${item.tenTacPham}`}
                  />
                  <View style={styles.artworkInfo}>
                    <Text style={styles.artworkTitle} numberOfLines={2}>{item.tenTacPham}</Text>
                    <Text style={styles.artworkArtist} numberOfLines={1}>{item.tenHoaSi || 'Lanvu Gallery'}</Text>
                    <Text style={styles.artworkPrice}>{formatVnd(item.gia)}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View style={styles.closingCard}>
          <Ionicons name="sparkles-outline" size={26} color="#d8b477" />
          <Text style={styles.closingTitle}>Bắt đầu hành trình nghệ thuật của bạn</Text>
          <Text style={styles.closingText}>
            Chọn dịch vụ phù hợp, tìm hiểu quy trình và gửi nhu cầu khi bạn đã sẵn sàng.
          </Text>
          <View style={styles.closingActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('CustomArtIntro')}>
              <Text style={styles.primaryButtonText}>Đặt vẽ tranh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('ConsultationIntro')}>
              <Text style={styles.outlineButtonText}>Nhận tư vấn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({ image, icon, index, title, description, action, onPress }: any) {
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.9}>
      <ArtworkImage source={image} containerStyle={styles.serviceImage} style={styles.serviceImage} />
      <View style={styles.serviceCopy}>
        <View style={styles.serviceMeta}>
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={21} color={ServiceTheme.accentDark} />
          </View>
          <Text style={styles.serviceIndex}>{index}</Text>
        </View>
        <Text style={styles.serviceTitle}>{title}</Text>
        <Text style={styles.serviceDescription}>{description}</Text>
        <View style={styles.serviceLinkRow}>
          <Text style={styles.serviceLink}>{action}</Text>
          <Ionicons name="arrow-forward" size={17} color={ServiceTheme.accentDark} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ServiceTheme.background },
  screen: { flex: 1, backgroundColor: ServiceTheme.background },
  content: { paddingBottom: 42 },
  hero: { minHeight: 470, justifyContent: 'flex-end', margin: 16, overflow: 'hidden', borderRadius: 24 },
  heroImage: { borderRadius: 24 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22, 18, 14, 0.57)' },
  heroContent: { padding: 24, paddingBottom: 30 },
  eyebrowLight: { color: '#ead3af', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  heroTitle: { color: '#fff', fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -0.7 },
  heroDescription: { color: '#f4eee5', fontSize: 15, lineHeight: 23, marginTop: 14, maxWidth: 520 },
  intro: { paddingHorizontal: 22, paddingVertical: 34 },
  eyebrow: { color: ServiceTheme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 9 },
  sectionTitle: { color: ServiceTheme.ink, fontSize: 26, lineHeight: 33, fontWeight: '800', letterSpacing: -0.4 },
  bodyText: { color: ServiceTheme.muted, fontSize: 15, lineHeight: 24, marginTop: 13 },
  servicesSection: { paddingHorizontal: 16, gap: 18 },
  serviceCard: { backgroundColor: ServiceTheme.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: ServiceTheme.border },
  serviceImage: { width: '100%', height: 210 },
  serviceCopy: { padding: 20 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: ServiceTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  serviceIndex: { color: '#b6a58e', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  serviceTitle: { color: ServiceTheme.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', marginTop: 16 },
  serviceDescription: { color: ServiceTheme.muted, fontSize: 14, lineHeight: 22, marginTop: 8 },
  serviceLinkRow: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 18 },
  serviceLink: { color: ServiceTheme.accentDark, fontSize: 14, fontWeight: '800' },
  featuredSection: { paddingTop: 42 },
  sectionHeader: { paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  sectionHeaderCopy: { flex: 1 },
  link: { color: ServiceTheme.accentDark, fontSize: 13, fontWeight: '800', paddingVertical: 7 },
  featuredList: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4, gap: 12 },
  artworkCard: { width: 210, backgroundColor: ServiceTheme.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: ServiceTheme.border },
  artworkImage: { width: 210, height: 230 },
  artworkInfo: { padding: 13 },
  artworkTitle: { color: ServiceTheme.ink, fontSize: 15, lineHeight: 20, fontWeight: '800', minHeight: 40 },
  artworkArtist: { color: ServiceTheme.muted, fontSize: 12, marginTop: 5 },
  artworkPrice: { color: ServiceTheme.accentDark, fontSize: 14, fontWeight: '800', marginTop: 8 },
  feedbackBox: { marginHorizontal: 16, marginTop: 18, minHeight: 155, borderWidth: 1, borderColor: ServiceTheme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 24 },
  feedbackText: { color: ServiceTheme.muted, fontSize: 14, textAlign: 'center', marginTop: 9, lineHeight: 20 },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: ServiceTheme.accentSoft },
  retryText: { color: ServiceTheme.accentDark, fontWeight: '800' },
  closingCard: { margin: 16, marginTop: 42, padding: 24, borderRadius: 22, backgroundColor: ServiceTheme.charcoal },
  closingTitle: { color: '#fff', fontSize: 24, lineHeight: 30, fontWeight: '800', marginTop: 14 },
  closingText: { color: '#d5cec5', fontSize: 14, lineHeight: 22, marginTop: 9 },
  closingActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primaryButton: { flex: 1, backgroundColor: '#b78345', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#8f867c', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  outlineButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
