import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import ServiceTheme from '../../constants/serviceTheme';

const HERO_IMAGE = require('../../assets/images/slide1.jpg');

const consultationTopics = [
  ['home-outline', 'Theo không gian nội thất', 'Phòng khách, phòng ngủ, văn phòng hoặc không gian kinh doanh.'],
  ['color-palette-outline', 'Màu sắc & phong cách', 'Tìm bảng màu và ngôn ngữ thị giác hài hòa với tổng thể.'],
  ['resize-outline', 'Kích thước & bố cục', 'Cân đối tỷ lệ tác phẩm và gợi ý vị trí treo tranh phù hợp.'],
  ['heart-outline', 'Theo sở thích & nhu cầu', 'Lắng nghe câu chuyện, gu thẩm mỹ hoặc mong muốn tham khảo phong thủy.'],
];

const steps = [
  'Khách hàng gửi nhu cầu',
  'Cửa hàng tiếp nhận',
  'Trao đổi về không gian và sở thích',
  'Đề xuất tranh, kích thước và bố cục',
  'Thống nhất phương án phù hợp',
];

export default function ConsultationIntroScreen({ navigation }: any) {
  const { user } = useAuth();

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.eyebrowLight}>TƯ VẤN NGHỆ THUẬT & KHÔNG GIAN</Text>
              <Text style={styles.heroTitle}>Đưa nghệ thuật vào không gian sống</Text>
              <Text style={styles.heroDescription}>
                Tìm kiếm tác phẩm phù hợp với kiến trúc, màu sắc và phong cách nội thất của bạn, từ
                phòng khách, phòng ngủ đến văn phòng và không gian kinh doanh.
              </Text>
              <TouchableOpacity style={styles.heroButton} onPress={() => requireLoginThen('ConsultationBooking')}>
                <Text style={styles.heroButtonText}>Gửi yêu cầu tư vấn</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <View style={styles.section}>
            <Text style={styles.eyebrow}>NGHỆ THUẬT VÀ KHÔNG GIAN</Text>
            <Text style={styles.sectionTitle}>Mỗi căn phòng có một nhịp điệu riêng</Text>
            <Text style={styles.paragraph}>
              Diện tích, ánh sáng, màu sắc, kiến trúc và công năng đều ảnh hưởng đến cách một tác
              phẩm hiện diện trong không gian. Lựa chọn phù hợp giúp tạo điểm nhấn thẩm mỹ và thể
              hiện dấu ấn cá nhân.
            </Text>
            <Text style={styles.paragraph}>
              Dịch vụ tư vấn hỗ trợ bạn cân nhắc chủ đề, màu sắc, kích thước, chất liệu và vị trí
              treo tranh dựa trên thông tin thực tế bạn cung cấp.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.eyebrow}>NỘI DUNG TƯ VẤN</Text>
            <Text style={styles.sectionTitle}>Một góc nhìn tổng thể</Text>
            <View style={styles.topicGrid}>
              {consultationTopics.map(([icon, title, description], index) => (
                <View style={styles.topicCard} key={title}>
                  <View style={styles.topicTopRow}>
                    <View style={styles.topicIcon}>
                      <Ionicons name={icon as any} size={22} color={ServiceTheme.accentDark} />
                    </View>
                    <Text style={styles.topicIndex}>0{index + 1}</Text>
                  </View>
                  <Text style={styles.topicTitle}>{title}</Text>
                  <Text style={styles.topicDescription}>{description}</Text>
                </View>
              ))}
            </View>
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={20} color={ServiceTheme.accentDark} />
              <Text style={styles.disclaimerText}>
                Nội dung phong thủy chỉ mang tính tham khảo thẩm mỹ, không cam kết tài lộc hoặc kết quả cụ thể.
              </Text>
            </View>
          </View>

          <View style={styles.darkSection}>
            <Text style={styles.eyebrowOnDark}>HÌNH THỨC LINH HOẠT</Text>
            <Text style={styles.darkTitle}>Chọn cách trao đổi phù hợp</Text>
            <View style={styles.modeCard}>
              <Ionicons name="videocam-outline" size={28} color="#ddb77f" />
              <Text style={styles.modeTitle}>Tư vấn trực tuyến</Text>
              <Text style={styles.modeText}>
                Gửi thông tin nhu cầu và chuẩn bị ảnh không gian. Sau khi tiếp nhận, cửa hàng sẽ hướng
                dẫn kênh cung cấp ảnh vì API đặt lịch hiện tại chưa hỗ trợ tải ảnh.
              </Text>
            </View>
            <View style={styles.modeCard}>
              <Ionicons name="location-outline" size={28} color="#ddb77f" />
              <Text style={styles.modeTitle}>Tư vấn trực tiếp</Text>
              <Text style={styles.modeText}>
                Gửi thông tin và đề nghị khảo sát tại công trình. Lịch khảo sát chỉ được xác nhận sau
                khi cửa hàng kiểm tra lịch và phạm vi phục vụ.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.eyebrow}>DỰ ÁN & KHÔNG GIAN</Text>
            <Text style={styles.sectionTitle}>Những câu chuyện đã được sắp đặt</Text>
            <View style={styles.emptyGallery}>
              <View style={styles.emptyIcon}>
                <Ionicons name="images-outline" size={26} color={ServiceTheme.accentDark} />
              </View>
              <Text style={styles.emptyTitle}>Dự án công khai đang được cập nhật</Text>
              <Text style={styles.emptyText}>
                Chúng tôi chỉ giới thiệu dự án khi có dữ liệu và quyền trưng bày hợp lệ. Hiện chưa có
                nguồn dự án public trong API nên không sử dụng ảnh bên ngoài để gắn nhãn là công trình của cửa hàng.
              </Text>
            </View>
          </View>

          <View style={styles.processSection}>
            <Text style={styles.eyebrow}>QUY TRÌNH TƯ VẤN</Text>
            <Text style={styles.sectionTitle}>Rõ ràng trong từng bước</Text>
            <View style={styles.processList}>
              {steps.map((step, index) => (
                <View style={styles.processItem} key={step}>
                  <View style={styles.processNumber}><Text style={styles.processNumberText}>{index + 1}</Text></View>
                  <Text style={styles.processText}>{step}</Text>
                  {index < steps.length - 1 && <View style={styles.processLine} />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.apiNote}>
            <Ionicons name="shield-checkmark-outline" size={24} color={ServiceTheme.accentDark} />
            <View style={styles.apiNoteCopy}>
              <Text style={styles.apiNoteTitle}>Yêu cầu được lưu bằng API thật</Text>
              <Text style={styles.apiNoteText}>
                Ứng dụng chỉ báo đã tiếp nhận sau khi Backend trả về mã lịch tư vấn và trạng thái tương ứng.
              </Text>
            </View>
          </View>
        </ScrollView>

        <SafeAreaView style={styles.stickyBar} edges={['bottom']}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => requireLoginThen('ConsultationBooking')}>
            <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
            <Text style={styles.primaryCtaText}>Gửi yêu cầu tư vấn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryCta} onPress={() => requireLoginThen('ConsultationList')}>
            <Ionicons name="calendar-outline" size={18} color={ServiceTheme.accentDark} />
            <Text style={styles.secondaryCtaText}>Lịch của tôi</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ServiceTheme.background },
  screen: { flex: 1, backgroundColor: ServiceTheme.background },
  scrollContent: { paddingBottom: 116 },
  hero: { minHeight: 540, margin: 16, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 24 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 17, 14, 0.6)' },
  heroContent: { padding: 24, paddingBottom: 28 },
  eyebrowLight: { color: '#ecd4ae', fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 35, lineHeight: 41, fontWeight: '800', letterSpacing: -0.7, marginTop: 12 },
  heroDescription: { color: '#f3ece4', fontSize: 15, lineHeight: 23, marginTop: 14 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#a87539', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 21 },
  heroButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  section: { paddingHorizontal: 18, paddingVertical: 38 },
  eyebrow: { color: ServiceTheme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.35, marginBottom: 9 },
  sectionTitle: { color: ServiceTheme.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5 },
  paragraph: { color: ServiceTheme.muted, fontSize: 15, lineHeight: 24, marginTop: 14 },
  topicGrid: { marginTop: 20, gap: 12 },
  topicCard: { backgroundColor: ServiceTheme.surface, borderWidth: 1, borderColor: ServiceTheme.border, borderRadius: 16, padding: 18 },
  topicTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topicIcon: { width: 43, height: 43, borderRadius: 22, backgroundColor: ServiceTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  topicIndex: { color: '#b4a48f', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  topicTitle: { color: ServiceTheme.ink, fontSize: 17, fontWeight: '800', marginTop: 14 },
  topicDescription: { color: ServiceTheme.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#efe5d7', padding: 14, borderRadius: 13, marginTop: 14 },
  disclaimerText: { flex: 1, color: ServiceTheme.accentDark, fontSize: 12, lineHeight: 18 },
  darkSection: { backgroundColor: ServiceTheme.charcoal, paddingHorizontal: 18, paddingVertical: 40 },
  eyebrowOnDark: { color: '#d6ad75', fontSize: 11, fontWeight: '800', letterSpacing: 1.35 },
  darkTitle: { color: '#fff', fontSize: 27, fontWeight: '800', lineHeight: 34, marginTop: 9, marginBottom: 19 },
  modeCard: { borderWidth: 1, borderColor: '#5c554e', borderRadius: 17, padding: 18, marginBottom: 12, backgroundColor: '#35312d' },
  modeTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 13 },
  modeText: { color: '#d0c7bd', fontSize: 13, lineHeight: 21, marginTop: 7 },
  emptyGallery: { marginTop: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: ServiceTheme.border, borderRadius: 18, padding: 24, alignItems: 'center', backgroundColor: '#fbf7f0' },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: ServiceTheme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: ServiceTheme.ink, fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  emptyText: { color: ServiceTheme.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  processSection: { paddingHorizontal: 18, paddingVertical: 38 },
  processList: { marginTop: 22 },
  processItem: { minHeight: 69, flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  processNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: ServiceTheme.accentDark, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  processNumberText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  processText: { flex: 1, color: ServiceTheme.ink, fontSize: 15, fontWeight: '700', lineHeight: 21, paddingLeft: 13, paddingTop: 7 },
  processLine: { position: 'absolute', left: 17.5, top: 36, bottom: 0, width: 1, backgroundColor: ServiceTheme.border },
  apiNote: { marginHorizontal: 18, marginBottom: 34, borderRadius: 16, padding: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: ServiceTheme.accentSoft },
  apiNoteCopy: { flex: 1 },
  apiNoteTitle: { color: ServiceTheme.accentDark, fontSize: 14, fontWeight: '800' },
  apiNoteText: { color: '#705b43', fontSize: 12, lineHeight: 18, marginTop: 5 },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 9, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10, backgroundColor: 'rgba(255,253,249,0.98)', borderTopWidth: 1, borderTopColor: ServiceTheme.border },
  primaryCta: { flex: 1.25, minHeight: 50, backgroundColor: ServiceTheme.accentDark, borderRadius: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  primaryCtaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryCta: { flex: 0.8, minHeight: 50, borderWidth: 1, borderColor: ServiceTheme.accentDark, borderRadius: 12, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  secondaryCtaText: { color: ServiceTheme.accentDark, fontSize: 12, fontWeight: '800' },
});
