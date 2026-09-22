import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const initialRequests = [
  {
    id: 101,
    title: 'Tranh treo phòng khách hiện đại',
    status: 'Đã nhận',
    artist: 'Họa sĩ Minh Anh',
    date: '10/09/2026',
    price: '8.500.000đ',
  },
  {
    id: 102,
    title: 'Tranh phong cách tối giản',
    status: 'Chờ báo giá',
    artist: 'Chưa giao',
    date: '12/09/2026',
    price: 'Chưa có',
  },
  {
    id: 103,
    title: 'Tranh gia đình nền nâu ấm',
    status: 'Hoàn thành',
    artist: 'Họa sĩ Lan Hương',
    date: '14/09/2026',
    price: '12.000.000đ',
  },
];

const serviceHighlights = [
  {
    icon: '🎨',
    title: 'Thiết kế riêng',
    text: 'Tranh được thực hiện theo ý tưởng và không gian của bạn.',
  },
  {
    icon: '🧭',
    title: 'Tư vấn 1:1',
    text: 'Được tư vấn về bố cục, màu sắc và kích thước.',
  },
  {
    icon: '📐',
    title: 'Báo giá rõ ràng',
    text: 'Chi phí dựa trên kích thước, chất liệu và yêu cầu.',
  },
  {
    icon: '🛠️',
    title: 'Theo dõi tiến độ',
    text: 'Theo dõi quá trình thực hiện và gửi phản hồi.',
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Gửi ý tưởng',
    text: 'Mô tả bức tranh bạn mong muốn.',
  },
  {
    number: '02',
    title: 'Tư vấn',
    text: 'Họa sĩ trao đổi và đề xuất phương án.',
  },
  {
    number: '03',
    title: 'Báo giá',
    text: 'Xác nhận thiết kế và chi phí.',
  },
  {
    number: '04',
    title: 'Hoàn thiện',
    text: 'Theo dõi tiến độ và nhận tranh.',
  },
];

const sampleImages = [
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
];

export default function CustomArtListScreen({ navigation }: any) {
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'active' | 'done'
  >('all');

  const filtered = useMemo(() => {
    if (filter === 'pending') {
      return initialRequests.filter(
        (x) => x.status === 'Chờ báo giá'
      );
    }

    if (filter === 'active') {
      return initialRequests.filter(
        (x) => x.status === 'Đã nhận'
      );
    }

    if (filter === 'done') {
      return initialRequests.filter(
        (x) => x.status === 'Hoàn thành'
      );
    }

    return initialRequests;
  }, [filter]);

  const handleOpen = (item: any) => {
    navigation.navigate('CustomArtDetail', { item });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Vẽ theo yêu cầu</Text>

          <TouchableOpacity
            style={styles.headerCreate}
            onPress={() => navigation.navigate('CreateCustomArt')}
          >
            <Text style={styles.headerCreateText}>+ Tạo</Text>
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>LANVU GALLERY</Text>
          </View>

          <Text style={styles.heroTitle}>
            Tạo một tác phẩm dành riêng cho bạn.
          </Text>

          <Text style={styles.heroDescription}>
            Từ ý tưởng, không gian đến phong cách yêu thích,
            hãy để họa sĩ biến mong muốn của bạn thành một
            tác phẩm riêng.
          </Text>

          <View style={styles.heroInfo}>
            <View style={styles.heroInfoItem}>
              <Text style={styles.heroInfoValue}>1:1</Text>
              <Text style={styles.heroInfoLabel}>Tư vấn</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroInfoItem}>
              <Text style={styles.heroInfoValue}>14+</Text>
              <Text style={styles.heroInfoLabel}>Ngày thực hiện</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroInfoItem}>
              <Text style={styles.heroInfoValue}>1000+</Text>
              <Text style={styles.heroInfoLabel}>Tác phẩm</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('CreateCustomArt')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>
              + Bắt đầu yêu cầu
            </Text>
          </TouchableOpacity>
        </View>

        {/* SERVICE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Dịch vụ của chúng tôi
            </Text>
            <Text style={styles.sectionSubtitle}>
              Những gì bạn nhận được
            </Text>
          </View>

          <View style={styles.serviceGrid}>
            {serviceHighlights.map((item) => (
              <View key={item.title} style={styles.serviceCard}>
                <View style={styles.serviceIconBox}>
                  <Text style={styles.serviceIcon}>
                    {item.icon}
                  </Text>
                </View>

                <Text style={styles.serviceTitle}>
                  {item.title}
                </Text>

                <Text style={styles.serviceText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* PROCESS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Quy trình thực hiện
            </Text>
            <Text style={styles.sectionSubtitle}>
              Đơn giản chỉ với 4 bước
            </Text>
          </View>

          <View style={styles.processCard}>
            {processSteps.map((item, index) => (
              <View
                key={item.number}
                style={[
                  styles.processRow,
                  index === processSteps.length - 1 &&
                    styles.processRowLast,
                ]}
              >
                <View style={styles.processNumber}>
                  <Text style={styles.processNumberText}>
                    {item.number}
                  </Text>
                </View>

                <View style={styles.processContent}>
                  <Text style={styles.processTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.processText}>
                    {item.text}
                  </Text>
                </View>

                {index !== processSteps.length - 1 && (
                  <View style={styles.processLine} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* SAMPLES */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Mẫu tham khảo
              </Text>
              <Text style={styles.sectionSubtitle}>
                Tối giản · Hiện đại · Nghệ thuật
              </Text>
            </View>

            <Text style={styles.sampleArrow}>›</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sampleScroll}
          >
            {sampleImages.map((image, index) => (
              <View key={image} style={styles.sampleCard}>
                <Image
                  source={{ uri: image }}
                  style={styles.sampleImage}
                />

                <View style={styles.sampleOverlay}>
                  <Text style={styles.sampleNumber}>
                    0{index + 1}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* REQUESTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Yêu cầu của bạn
            </Text>
            <Text style={styles.sectionSubtitle}>
              Theo dõi những yêu cầu đã gửi
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ báo giá' },
              { key: 'active', label: 'Đang xử lý' },
              { key: 'done', label: 'Hoàn thành' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterChip,
                  filter === item.key &&
                    styles.filterChipActive,
                ]}
                onPress={() => setFilter(item.key as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item.key &&
                      styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.requestList}>
            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎨</Text>
                <Text style={styles.emptyTitle}>
                  Chưa có yêu cầu
                </Text>
                <Text style={styles.emptyText}>
                  Hãy tạo một yêu cầu vẽ tranh đầu tiên của bạn.
                </Text>

                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() =>
                    navigation.navigate('CreateCustomArt')
                  }
                >
                  <Text style={styles.emptyButtonText}>
                    Tạo yêu cầu
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.requestCard}
                  onPress={() => handleOpen(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.requestIcon}>
                    <Text style={styles.requestIconText}>🎨</Text>
                  </View>

                  <View style={styles.requestContent}>
                    <View style={styles.requestTitleRow}>
                      <Text
                        style={styles.requestTitle}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'Hoàn thành'
                            ? styles.statusDone
                            : styles.statusProcessing,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status === 'Hoàn thành'
                              ? styles.statusDoneText
                              : styles.statusProcessingText,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.requestMeta}>
                      Họa sĩ: {item.artist}
                    </Text>

                    <Text style={styles.requestMeta}>
                      Ngày tạo: {item.date}
                    </Text>

                    <View style={styles.requestBottom}>
                      <Text style={styles.requestPrice}>
                        {item.price}
                      </Text>

                      <Text style={styles.requestArrow}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* HEADER */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: '#111827',
    marginTop: -2,
  },

  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#171717',
    marginLeft: 12,
  },

  headerCreate: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },

  headerCreateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* HERO */
  hero: {
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    overflow: 'hidden',
  },

  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },

  heroBadgeText: {
    color: '#FDBA74',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 12,
  },

  heroDescription: {
    color: '#D4D4D4',
    fontSize: 13,
    lineHeight: 21,
  },

  heroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },

  heroInfoItem: {
    flex: 1,
    alignItems: 'center',
  },

  heroInfoValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  heroInfoLabel: {
    color: '#A3A3A3',
    fontSize: 10,
    marginTop: 4,
  },

  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#404040',
  },

  heroButton: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* SECTION */
  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 13,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#171717',
    fontSize: 19,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#737373',
    fontSize: 12,
    marginTop: 4,
  },

  /* SERVICES */
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    minHeight: 145,
  },

  serviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  serviceIcon: {
    fontSize: 20,
  },

  serviceTitle: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  serviceText: {
    color: '#737373',
    fontSize: 11,
    lineHeight: 17,
  },

  /* PROCESS */
  processCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },

  processRow: {
    flexDirection: 'row',
    minHeight: 66,
    position: 'relative',
  },

  processRowLast: {
    minHeight: 52,
  },

  processNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  processNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  processContent: {
    flex: 1,
    marginLeft: 13,
    paddingTop: 2,
  },

  processTitle: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },

  processText: {
    color: '#737373',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  processLine: {
    position: 'absolute',
    left: 18,
    top: 38,
    width: 2,
    height: 35,
    backgroundColor: '#E5E5E5',
  },

  /* SAMPLES */
  sampleArrow: {
    fontSize: 27,
    color: '#737373',
  },

  sampleScroll: {
    paddingRight: 8,
  },

  sampleCard: {
    width: Math.min(width * 0.58, 230),
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#E5E5E5',
  },

  sampleImage: {
    width: '100%',
    height: '100%',
  },

  sampleOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sampleNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  /* FILTER */
  filterScroll: {
    paddingBottom: 4,
  },

  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  filterChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },

  filterText: {
    color: '#525252',
    fontSize: 12,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  /* REQUEST */
  requestList: {
    marginTop: 10,
  },

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 11,
    flexDirection: 'row',
  },

  requestIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  requestIconText: {
    fontSize: 23,
  },

  requestContent: {
    flex: 1,
  },

  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  requestTitle: {
    flex: 1,
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    marginRight: 7,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusProcessing: {
    backgroundColor: '#FFF7ED',
  },

  statusDone: {
    backgroundColor: '#ECFDF5',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  statusProcessingText: {
    color: '#C2410C',
  },

  statusDoneText: {
    color: '#15803D',
  },

  requestMeta: {
    color: '#737373',
    fontSize: 11,
    marginTop: 5,
  },

  requestBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
  },

  requestPrice: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '800',
  },

  requestArrow: {
    color: '#A3A3A3',
    fontSize: 23,
  },

  /* EMPTY */
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 8,
  },

  emptyTitle: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '800',
  },

  emptyText: {
    color: '#737373',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 5,
  },

  emptyButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 14,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 20,
  },
});