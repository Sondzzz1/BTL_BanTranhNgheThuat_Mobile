import React from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HERO_IMAGE = require('../assets/images/slide2.webp');
const STORY_IMAGE = require('../assets/images/slide1.jpg');
const TEAM_IMAGE = require('../assets/images/slide3.jpg');

const milestones = [
  {
    year: '2015',
    title: 'Khởi nguồn phòng tranh',
    description:
      'Ý tưởng về một phòng tranh riêng được hình thành khi họa sĩ Lân Vũ còn là sinh viên. Từ một xưởng tranh nhỏ với vài họa sĩ, Son Gallery bắt đầu cung cấp tác phẩm cho các gallery tại Hà Nội và nhiều tỉnh thành.',
  },
  {
    year: '2017',
    title: 'Bước chuyển mình số hóa',
    description:
      'Trong một thị trường nhiều cạnh tranh, thương hiệu chuyển sang số hóa sản phẩm và khai trương cơ sở đầu tiên; từ đó theo đuổi hướng đi riêng cho dòng tranh sơn dầu cao cấp.',
  },
];

export default function AboutScreen() {
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
            <Text style={styles.heroEyebrow}>SON GALLERY</Text>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Nghệ thuật cho{`\n`}không gian sống
            </Text>
            <Text style={styles.heroDescription}>
              Nơi những tác phẩm hội họa được chọn lựa để tạo nên dấu ấn riêng trong mỗi công trình.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.introSection}>
          <Text style={styles.eyebrow}>VỀ CHÚNG TÔI</Text>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Son Gallery kính chào Quý khách!
          </Text>
          <Text style={styles.bodyText}>
            Son Gallery là tâm huyết của họa sĩ, kiến trúc sư Lân Vũ trong lĩnh vực thiết kế, thi công,
            trang trí nội thất và sáng tác tranh sơn dầu cao cấp. Chúng tôi tin rằng một tác phẩm phù hợp
            có thể làm không gian sống trở nên giàu cảm hứng và dễ chịu hơn mỗi ngày.
          </Text>
          <Text style={styles.bodyText}>
            Lớn lên trong môi trường được tiếp cận nghệ thuật từ sớm và theo đuổi mỹ thuật ứng dụng,
            đội ngũ Son Gallery thấu hiểu vẻ đẹp cũng như ảnh hưởng của nghệ thuật tới cảm xúc, chất
            lượng sống và dấu ấn cá nhân của mỗi gia chủ.
          </Text>
        </View>

        <Image
          source={STORY_IMAGE}
          style={styles.featureImage}
          resizeMode="cover"
          accessibilityLabel="Không gian trưng bày tác phẩm của Son Gallery"
        />

        <View style={styles.section}>
          <Text style={styles.eyebrow}>HÀNH TRÌNH THƯƠNG HIỆU</Text>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Từ xưởng tranh nhỏ đến không gian nghệ thuật riêng
          </Text>
          <View style={styles.timeline}>
            {milestones.map((milestone, index) => (
              <View key={milestone.year} style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index < milestones.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineYear}>{milestone.year}</Text>
                  <Text style={styles.timelineTitle}>{milestone.title}</Text>
                  <Text style={styles.timelineDescription}>{milestone.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.awardCard}>
          <Text style={styles.awardKicker}>DẤU MỐC GHI NHẬN</Text>
          <Text style={styles.awardTitle}>Top 50 “Thương hiệu – Nhãn hiệu độc quyền, uy tín” năm 2020</Text>
          <Text style={styles.awardText}>
            Sự ghi nhận là động lực để Son Gallery tiếp tục theo đuổi chất lượng, bản sắc riêng và giá
            trị bền vững trong từng tác phẩm.
          </Text>
        </View>

        <Image
          source={TEAM_IMAGE}
          style={styles.teamImage}
          resizeMode="cover"
          accessibilityLabel="Tác phẩm nghệ thuật tại Son Gallery"
        />

        <View style={[styles.section, styles.teamSection]}>
          <Text style={styles.eyebrow}>CON NGƯỜI SON GALLERY</Text>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Về đội ngũ họa sĩ
          </Text>
          <Text style={styles.bodyText}>
            Son Gallery là nơi hội tụ những họa sĩ tài hoa trên khắp cả nước, thuộc nhiều độ tuổi và
            trường phái hội họa khác nhau. Mỗi người cùng sáng tác độc bản, độc quyền và đáp ứng những
            yêu cầu riêng của khách hàng.
          </Text>
          <Text style={styles.bodyText}>
            Đội ngũ họa sĩ giàu kinh nghiệm mang đến chiều sâu và cảm xúc; các họa sĩ trẻ góp thêm tư
            duy cởi mở, nhiệt huyết và những xu hướng mới. Tất cả cùng tạo nên một bản sắc riêng, hướng
            tới các giá trị nhân văn cốt lõi.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle} accessibilityRole="header">
            Đội ngũ tư vấn – thiết kế
          </Text>
          <Text style={styles.bodyText}>
            Chúng tôi coi con người là tài sản quý giá nhất. Đội ngũ tư vấn thiết kế được đào tạo bài
            bản về mỹ thuật, kết hợp kinh nghiệm, khả năng sáng tạo và chuyên môn kiến trúc – hội họa để
            giúp khách hàng chọn được tác phẩm hài hòa với không gian.
          </Text>
        </View>

        <View style={styles.missionCard}>
          <Text style={styles.missionEyebrow}>SỨ MỆNH</Text>
          <Text style={styles.missionTitle}>Làm đẹp thế giới, từ căn phòng ta sống mỗi ngày.</Text>
          <Text style={styles.missionText}>
            Son Gallery mong muốn đưa nghệ thuật hội họa sơn dầu cao cấp đến gần hơn với không gian
            sống của bạn. Mỗi tác phẩm được gửi gắm tâm hồn người nghệ sĩ, không chỉ để trang trí mà còn
            để nâng cao chất lượng cuộc sống và tạo nên sự khác biệt cho từng công trình.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    minHeight: 312,
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 24, 20, 0.58)',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 32,
  },
  heroEyebrow: {
    color: '#fed7aa',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 40,
  },
  heroDescription: {
    color: '#fff7ed',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 340,
  },
  introSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 18,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  eyebrow: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#1c1917',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 14,
  },
  bodyText: {
    color: '#57534e',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  featureImage: {
    width: '100%',
    height: 244,
  },
  timeline: {
    gap: 14,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineRail: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    backgroundColor: '#ea580c',
    borderColor: '#ffedd5',
    borderRadius: 8,
    borderWidth: 4,
    height: 16,
    marginTop: 18,
    width: 16,
  },
  timelineLine: {
    backgroundColor: '#fed7aa',
    flex: 1,
    marginBottom: -16,
    marginTop: 4,
    width: 2,
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderColor: '#fed7aa',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  timelineYear: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  timelineTitle: {
    color: '#292524',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 3,
  },
  timelineDescription: {
    color: '#57534e',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  awardCard: {
    backgroundColor: '#7c2d12',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 30,
    overflow: 'hidden',
    padding: 22,
  },
  awardKicker: {
    color: '#fed7aa',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  awardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    marginTop: 8,
  },
  awardText: {
    color: '#ffedd5',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  teamImage: {
    alignSelf: 'stretch',
    borderRadius: 18,
    height: 192,
    marginHorizontal: 20,
    marginTop: 30,
  },
  teamSection: {
    paddingBottom: 28,
  },
  divider: {
    backgroundColor: '#fed7aa',
    height: 1,
    marginBottom: 26,
    marginTop: 12,
  },
  missionCard: {
    backgroundColor: '#1c1917',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 24,
  },
  missionEyebrow: {
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  missionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: 10,
  },
  missionText: {
    color: '#e7e5e4',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
});
