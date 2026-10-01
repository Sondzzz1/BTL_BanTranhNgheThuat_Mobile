import React, { useState } from 'react';
import {
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
import { useAuth } from '../../context/AuthContext';
import ServiceTheme from '../../constants/serviceTheme';

const HERO_IMAGE = require('../../assets/images/slide3.jpg');
const CATEGORY_IMAGES = [
  require('../../assets/images/slide2.webp'),
  require('../../assets/images/slide1.jpg'),
  require('../../assets/images/slide3.jpg'),
];

const categories = [
  { title: 'Tranh chân dung', image: CATEGORY_IMAGES[0] },
  { title: 'Tranh từ ảnh chụp', image: CATEGORY_IMAGES[1] },
  { title: 'Tranh phong cảnh', image: CATEGORY_IMAGES[2] },
  { title: 'Tranh trừu tượng', image: CATEGORY_IMAGES[0] },
  { title: 'Tranh trang trí nội thất', image: CATEGORY_IMAGES[1] },
  { title: 'Tranh theo ý tưởng riêng', image: CATEGORY_IMAGES[2] },
];

const steps = [
  ['01', 'Gửi yêu cầu', 'Mô tả ý tưởng và tải ảnh hoặc tài liệu tham khảo phù hợp.'],
  ['02', 'Admin tiếp nhận', 'Yêu cầu được kiểm tra thông tin và duyệt trước khi họa sĩ nhìn thấy.'],
  ['03', 'Họa sĩ nhận & báo giá', 'Họa sĩ nhận vẽ, gửi mức giá và thời gian hoàn thành dự kiến.'],
  ['04', 'Bạn chấp nhận báo giá', 'Xem đầy đủ thông tin báo giá và chủ động quyết định có chấp nhận hay không.'],
  ['05', 'Theo dõi tiến độ', 'Sau khi bắt đầu, họa sĩ đăng tiêu đề, mô tả và ảnh cập nhật tiến độ.'],
  ['06', 'Hoàn thiện tác phẩm', 'Ảnh thành phẩm và ghi chú hoàn thiện được hiển thị trong chi tiết yêu cầu.'],
];

const faqs = [
  ['Tôi có thể đặt vẽ từ ảnh chụp không?', 'Có. Bạn có thể chọn loại yêu cầu dùng ảnh hoặc tài liệu cá nhân và xác nhận quyền sử dụng trước khi gửi.'],
  ['Tôi có thể chọn kích thước và chất liệu không?', 'Có. Form hiện tại cho phép chọn kích thước, chất liệu, loại tranh, phong cách và màu sắc; mỗi mục đều có lựa chọn Khác.'],
  ['Họa sĩ báo giá như thế nào?', 'Sau khi Admin duyệt và họa sĩ nhận yêu cầu, họa sĩ gửi giá, ngày dự kiến hoàn thành và ghi chú. Giá có thể khác ngân sách tham khảo của bạn.'],
  ['Tôi có thể theo dõi quá trình vẽ không?', 'Có. Khi bạn đã chấp nhận báo giá và họa sĩ bắt đầu, các cập nhật tiến độ cùng hình ảnh sẽ xuất hiện theo dòng thời gian.'],
  ['Khi hoàn thành tôi xem thành phẩm ở đâu?', 'Bạn xem ảnh thành phẩm, ghi chú và toàn bộ dòng thời gian trong Chi tiết yêu cầu. Trạng thái COMPLETED không tự khẳng định việc bàn giao hay chuyển quyền sở hữu đã hoàn tất.'],
];

export default function CustomArtIntroScreen({ navigation }: any) {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const requireLoginThen = (screen: string) => {
    if (user) {
      navigation.navigate(screen);
      return;
    }
    navigation.navigate('Login', { returnTo: { screen } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrowLight}>VẼ TRANH THEO YÊU CẦU</Text>
              <Text style={styles.heroTitle}>Biến ý tưởng của bạn thành tác phẩm nghệ thuật</Text>
              <Text style={styles.heroText}>
                Chúng tôi đồng hành cùng bạn để lưu giữ những kỷ niệm, khoảnh khắc và cảm xúc thông
                qua những bức tranh được thực hiện theo mong muốn riêng.
              </Text>
              <TouchableOpacity style={styles.heroButton} onPress={() => requireLoginThen('CreateCustomArt')}>
                <Text style={styles.heroButtonText}>Đặt vẽ tranh ngay</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <Section heading="Một tác phẩm mang dấu ấn riêng" eyebrow="CÂU CHUYỆN CỦA BẠN">
            <Text style={styles.paragraph}>
              Dịch vụ vẽ theo yêu cầu giúp lưu giữ kỷ niệm và những khoảnh khắc đáng nhớ bằng ngôn
              ngữ hội họa. Bạn có thể bắt đầu từ ảnh chụp, một phong cảnh yêu thích hoặc ý tưởng hoàn
              toàn mới.
            </Text>
            <Text style={styles.paragraph}>
              Mỗi yêu cầu được tiếp nhận và duyệt trước khi đến với họa sĩ. Sau khi họa sĩ nhận vẽ,
              bạn sẽ xem báo giá và thời gian dự kiến rồi mới quyết định tiếp tục.
            </Text>
            <Text style={styles.paragraph}>
              Khi tác phẩm được thực hiện, các mốc tiến độ và ảnh quá trình được cập nhật để bạn dễ
              dàng theo dõi trong cùng một màn hình.
            </Text>
          </Section>

          <Section heading="Các thể loại nhận vẽ" eyebrow="KHÁM PHÁ KHẢ NĂNG SÁNG TẠO">
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <View style={styles.categoryCard} key={category.title}>
                  <ArtworkImage
                    source={category.image}
                    containerStyle={styles.categoryImage}
                    style={styles.categoryImage}
                    accessibilityLabel={`Ảnh minh họa ${category.title}`}
                  />
                  <View style={styles.categoryCopy}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.imageCaption}>Ảnh minh họa</Text>
                  </View>
                </View>
              ))}
            </View>
          </Section>

          <View style={styles.darkSection}>
            <Text style={styles.eyebrowOnDark}>QUY TRÌNH MINH BẠCH</Text>
            <Text style={styles.darkTitle}>Từ yêu cầu đến thành phẩm</Text>
            <View style={styles.timeline}>
              {steps.map(([number, title, description], index) => (
                <View style={styles.step} key={number}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
                    {index < steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>{title}</Text>
                    <Text style={styles.stepDescription}>{description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Section heading="Tác phẩm đã thực hiện" eyebrow="BỘ SƯU TẬP">
            <View style={styles.emptyGallery}>
              <View style={styles.emptyIcon}>
                <Ionicons name="lock-closed-outline" size={25} color={ServiceTheme.accentDark} />
              </View>
              <Text style={styles.emptyTitle}>Bộ sưu tập công khai đang được tuyển chọn</Text>
              <Text style={styles.emptyText}>
                Hệ thống hiện chưa có cơ chế ghi nhận sự đồng ý trưng bày của khách hàng. Vì vậy,
                ảnh thành phẩm riêng tư không được lấy từ dữ liệu Custom Art để hiển thị tại đây.
              </Text>
            </View>
          </Section>

          <Section heading="Câu hỏi thường gặp" eyebrow="THÔNG TIN HỮU ÍCH">
            <View style={styles.faqList}>
              {faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;
                return (
                  <TouchableOpacity
                    key={question}
                    style={styles.faqCard}
                    onPress={() => setOpenFaq(isOpen ? null : index)}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestion}>{question}</Text>
                      <Ionicons name={isOpen ? 'remove' : 'add'} size={21} color={ServiceTheme.accentDark} />
                    </View>
                    {isOpen && <Text style={styles.faqAnswer}>{answer}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>
        </ScrollView>

        <SafeAreaView style={styles.stickyBar} edges={['bottom']}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => requireLoginThen('CreateCustomArt')}>
            <Ionicons name="brush-outline" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>Đặt vẽ tranh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryCta} onPress={() => requireLoginThen('CustomArtList')}>
            <Ionicons name="albums-outline" size={18} color={ServiceTheme.accentDark} />
            <Text style={styles.secondaryCtaText}>Yêu cầu của tôi</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

function Section({ eyebrow, heading, children }: { eyebrow: string; heading: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{heading}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ServiceTheme.background },
  screen: { flex: 1, backgroundColor: ServiceTheme.background },
  scrollContent: { paddingBottom: 112 },
  hero: { minHeight: 545, margin: 16, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 24 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22, 17, 12, 0.62)' },
  heroContent: { padding: 24, paddingBottom: 28 },
  eyebrowLight: { color: '#ebd0a8', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '800', marginTop: 12, letterSpacing: -0.7 },
  heroText: { color: '#f2ece4', fontSize: 15, lineHeight: 23, marginTop: 14 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#a87539', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 21 },
  heroButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  section: { paddingHorizontal: 18, paddingVertical: 38 },
  eyebrow: { color: ServiceTheme.accent, fontSize: 11, letterSpacing: 1.35, fontWeight: '800', marginBottom: 9 },
  sectionTitle: { color: ServiceTheme.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5 },
  sectionBody: { marginTop: 18 },
  paragraph: { color: ServiceTheme.muted, fontSize: 15, lineHeight: 24, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13 },
  categoryCard: { width: '48.2%', backgroundColor: ServiceTheme.surface, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: ServiceTheme.border },
  categoryImage: { width: '100%', height: 125 },
  categoryCopy: { padding: 11 },
  categoryTitle: { color: ServiceTheme.ink, fontSize: 14, lineHeight: 19, fontWeight: '800', minHeight: 38 },
  imageCaption: { color: '#988a7b', fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  darkSection: { backgroundColor: ServiceTheme.charcoal, marginVertical: 10, paddingHorizontal: 20, paddingVertical: 40 },
  eyebrowOnDark: { color: '#d4ab73', fontSize: 11, fontWeight: '800', letterSpacing: 1.35 },
  darkTitle: { color: '#fff', fontSize: 27, lineHeight: 34, fontWeight: '800', marginTop: 9, marginBottom: 24 },
  timeline: { gap: 0 },
  step: { flexDirection: 'row', minHeight: 108 },
  stepRail: { width: 48, alignItems: 'center' },
  stepNumber: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#a87539', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepLine: { flex: 1, width: 1, backgroundColor: '#6c6258', marginVertical: 6 },
  stepCopy: { flex: 1, paddingLeft: 10, paddingBottom: 25 },
  stepTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  stepDescription: { color: '#cfc6bc', fontSize: 13, lineHeight: 20, marginTop: 6 },
  emptyGallery: { borderWidth: 1, borderColor: ServiceTheme.border, borderStyle: 'dashed', backgroundColor: '#fbf7f0', borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: ServiceTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: ServiceTheme.ink, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  emptyText: { color: ServiceTheme.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  faqList: { gap: 10 },
  faqCard: { backgroundColor: ServiceTheme.surface, borderRadius: 14, borderWidth: 1, borderColor: ServiceTheme.border, padding: 16 },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQuestion: { flex: 1, color: ServiceTheme.ink, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  faqAnswer: { color: ServiceTheme.muted, fontSize: 13, lineHeight: 21, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee6dc' },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 9, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10, backgroundColor: 'rgba(255,253,249,0.98)', borderTopWidth: 1, borderTopColor: ServiceTheme.border },
  primaryCta: { flex: 1, minHeight: 50, borderRadius: 12, backgroundColor: ServiceTheme.accentDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 9 },
  primaryCtaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryCta: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: ServiceTheme.accentDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 9 },
  secondaryCtaText: { color: ServiceTheme.accentDark, fontSize: 13, fontWeight: '800' },
});
