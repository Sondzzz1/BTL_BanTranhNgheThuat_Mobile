import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroSubtitle}>Nhà sáng lập</Text>
          <Text style={styles.heroTitle}>Họa sĩ, Kiến trúc sư{'\n'}Lân Vũ</Text>
          <Text style={styles.heroDescription}>
            Người sáng lập và kiến tạo nên LanVu Gallery
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.section}>
        <Image
          source={{ uri: 'https://via.placeholder.com/400x500' }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Về Nhà Sáng Lập</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Họa sĩ, Kiến trúc sư Lân Vũ</Text> tên đầy đủ là Vũ Thành Lân, 
            sinh năm 1994, được biết đến là nhà sáng lập LanVu Gallery. Anh tốt nghiệp khoa Quy hoạch, 
            Đại học Kiến trúc Hà Nội.
          </Text>

          <Text style={styles.paragraph}>
            Sinh ra và lớn lên trong gia đình có nền tảng học vấn nghệ thuật tại vùng quê thuộc tỉnh 
            Ninh Bình, cha anh là một nhiếp ảnh gia – nghệ nhân cây cảnh, họa sĩ. Lân Vũ đến với hội 
            họa hoàn toàn do yêu thích, say mê đồng thời được truyền cảm hứng từ chính những bức ảnh 
            của cha mình.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Năm 2012</Text>, khi bước chân vào cổng trường đại học Lân Vũ 
            đã tiếp tục nuôi dưỡng đam mê vẽ của mình một cách nghiêm túc hơn. Ngoài thời gian học 
            trên lớp, hầu hết thời gian còn lại anh dành để vẽ.
          </Text>

          <Text style={styles.paragraph}>
            Đi học xa nhà, xa quê hương nên nỗi nhớ về nét đẹp bình dị nơi thôn quê đã là nguồn cảm 
            hứng sáng tác bất tận trong tranh của họa sĩ Lân Vũ.
          </Text>
        </View>
      </View>

      {/* Career Section */}
      <View style={[styles.section, styles.careerSection]}>
        <Text style={styles.sectionTitle}>Hành trình sự nghiệp</Text>
        
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Năm 2017</Text>, sau khi tốt nghiệp trường Đại học Kiến trúc Hà Nội, 
          họa sĩ Lân Vũ đã làm việc tại Viện Quy hoạch thành phố. Tuy nhiên, với niềm đam mê mãnh liệt 
          với nghệ thuật hội họa, anh đã không ngần ngại từ bỏ công việc, quyết định theo đuổi sự nghiệp 
          hội họa.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Năm 2020</Text>, họa sĩ Lân Vũ đã tham dự Triển lãm do Viet Art 
          Exchange tổ chức và đấu giá thành công tác phẩm mang tên "Xuân hồng" nhằm ủng hộ cho Quỹ 
          phòng chống dịch Covid-19.
        </Text>

        <View style={styles.quoteContainer}>
          <View style={styles.quoteLine} />
          <Text style={styles.quoteText}>
            "Sau những khoảng lặng ẩn mình đi tìm cái tôi của bản thân, tạo ra các tác phẩm riêng biệt 
            mang đậm dấu ấn cá nhân tôi nhận ra rằng: Một tác phẩm thực sự có giá trị lớn nhất khi người 
            họa sĩ hiểu được chính bản thân mình, hiểu sứ mệnh của mình, đó là sự cống hiến của tâm hồn 
            nghệ sĩ thành thật và đa cảm."
          </Text>
          <Text style={styles.quoteAuthor}>— Họa sĩ, Kiến trúc sư Lân Vũ</Text>
        </View>
      </View>

      {/* Activities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hoạt động nghệ thuật tiêu biểu</Text>
        
        <View style={styles.timeline}>
          {[
            { year: '2015', event: 'Triển lãm nghệ thuật sinh viên tại Hà Nội' },
            { year: '2016', event: 'Triển lãm mỹ thuật sinh viên tại Hà Nội' },
            { year: '2017', event: 'Triển lãm nhóm họa sĩ trẻ tại Hà Nội' },
            { year: '2018', event: 'Triển lãm mỹ thuật cá nhân "Giai điệu ngày mới" tại Hà Nội' },
            { year: '2019', event: 'Triển lãm nhóm Viet Art Exchange' },
            { year: '2020', event: 'Đấu giá thành công tác phẩm "Xuân hồng" ủng hộ Quỹ phòng chống dịch Covid-19' },
            { year: '2021', event: 'Triển lãm mỹ thuật cá nhân "Cảm xúc trở về" tại Hà Nội' },
          ].map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineYear}>{item.year}:</Text>
                <Text style={styles.timelineEvent}>{item.event}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Philosophy Section */}
      <View style={[styles.section, styles.philosophySection]}>
        <Text style={styles.sectionTitle}>Quan điểm nghệ thuật</Text>
        
        <View style={styles.quoteContainer}>
          <View style={styles.quoteLine} />
          <Text style={styles.quoteText}>
            "Hành trình nghệ thuật của tôi là chặng đường dài và quanh co, một quá trình tự thân tìm tòi, 
            vượt qua nhiều trắc trở và bộn bề của cuộc sống. Như câu châm ngôn: 'mỗi người mỗi vẻ', những 
            tác phẩm của tôi phản ánh kinh nghiệm sống của riêng tôi. Khi trải trên toan những giấc mơ, mỗi 
            nét cọ phác họa cái tôi cá nhân, những kỷ niệm, nỗi nhớ đều làm tôi cảm thấy tâm hồn thật thảnh 
            thơi để chìm đắm trong những sắc màu rực rỡ. Điều đó thật hạnh phúc!"
          </Text>
          <Text style={styles.quoteAuthor}>— Họa sĩ, Kiến trúc sư Lân Vũ</Text>
        </View>
      </View>

      {/* Vision Section */}
      <View style={[styles.section, styles.visionSection]}>
        <Text style={styles.sectionTitle}>Tầm nhìn và sứ mệnh</Text>
        
        <Text style={styles.paragraph}>
          Với tư cách là nhà sáng lập LanVu Gallery, họa sĩ Lân Vũ mong muốn tạo ra một không gian nghệ 
          thuật nơi mọi người có thể tìm thấy những tác phẩm tranh sơn dầu cao cấp, độc bản, mang đậm giá 
          trị nghệ thuật và văn hóa Việt Nam.
        </Text>

        <Text style={styles.paragraph}>
          LanVu Gallery không chỉ là nơi trưng bày và bán tranh, mà còn là nơi kết nối giữa nghệ thuật và 
          cuộc sống, giúp mọi người tìm thấy những tác phẩm phù hợp với không gian sống của mình, tạo nên 
          một môi trường sống đẹp và ý nghĩa hơn.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hero: {
    height: 250,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroOverlay: {
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: '#dbeafe',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  mainImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  content: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  careerSection: {
    backgroundColor: '#f9fafb',
  },
  quoteContainer: {
    marginTop: 20,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
  },
  quoteLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2563eb',
  },
  quoteText: {
    fontSize: 15,
    color: '#1e40af',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'right',
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    marginTop: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  timelineEvent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  philosophySection: {
    backgroundColor: '#fef3c7',
  },
  visionSection: {
    marginBottom: 40,
  },
});
