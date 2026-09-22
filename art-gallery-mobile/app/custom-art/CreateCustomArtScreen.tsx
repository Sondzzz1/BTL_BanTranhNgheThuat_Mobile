import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const typeOptions = [
  'Tranh sơn dầu',
  'Tranh acrylic',
  'Tranh màu nước',
  'Tranh khảm',
  'Tranh hiện đại',
];

const sizeOptions = [
  '30x40 cm',
  '50x70 cm',
  '60x90 cm',
  '70x100 cm',
  '90x120 cm',
  '100x150 cm',
  'Khác',
];

const styleOptions = [
  'Hiện đại',
  'Cổ điển',
  'Minimal',
  'Abstract',
  'Nhiệt đới',
  'Sang trọng',
];

const materialOptions = [
  'Canvas',
  'Gỗ',
  'Vải',
  'Sơn dầu trên canvas',
  'Acrylic trên khung gỗ',
];

const artworkSourceOptions = [
  {
    value: 'Original',
    title: 'Tự sáng tác',
    description:
      'Họa sĩ sáng tạo một tác phẩm hoàn toàn mới theo ý tưởng của bạn.',
    icon: 'color-palette-outline' as const,
  },
  {
    value: 'BasedOnArtwork',
    title: 'Dựa trên tác phẩm có sẵn',
    description: 'Tạo tác phẩm mới dựa trên một tranh đã có.',
    icon: 'images-outline' as const,
  },
  {
    value: 'Reproduction',
    title: 'Tái tạo tác phẩm',
    description: 'Yêu cầu họa sĩ thực hiện lại một tác phẩm cụ thể.',
    icon: 'create-outline' as const,
  },
];

export default function CreateCustomArtScreen({ navigation }: any) {
  const [form, setForm] = useState({
    title: '',
    type: typeOptions[0],
    size: sizeOptions[4],
    style: styleOptions[0],
    color: 'Nâu, trắng',
    material: materialOptions[0],
    description: '',

    artworkSource: 'Original',

    referenceArtworkName: '',
    referenceArtistName: '',
    refImage: '',
  });

  const [openField, setOpenField] = useState<
    'type' | 'size' | 'style' | 'material' | null
  >(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isReferenceArtwork =
    form.artworkSource === 'BasedOnArtwork' ||
    form.artworkSource === 'Reproduction';

  const isFormValid =
    form.title.trim() !== '' &&
    form.type.trim() !== '' &&
    form.size.trim() !== '' &&
    form.style.trim() !== '' &&
    form.color.trim() !== '' &&
    form.material.trim() !== '' &&
    form.description.trim() !== '' &&
    (!isReferenceArtwork ||
      form.referenceArtworkName.trim() !== '');

  const submit = () => {
    if (!form.title.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập tên yêu cầu.'
      );
      return;
    }

    if (!form.description.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng mô tả ý tưởng tranh.'
      );
      return;
    }

    if (!form.color.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập màu sắc mong muốn.'
      );
      return;
    }

    if (
      !form.size.trim() ||
      !form.style.trim() ||
      !form.material.trim()
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng chọn đầy đủ thông tin về tranh.'
      );
      return;
    }

    if (
      isReferenceArtwork &&
      !form.referenceArtworkName.trim()
    ) {
      Alert.alert(
        'Thiếu tác phẩm tham chiếu',
        'Vui lòng nhập tên tác phẩm mà bạn muốn tham khảo.'
      );
      return;
    }

    const requestData = {
      title: form.title,
      type: form.type,
      size: form.size,
      style: form.style,
      color: form.color,
      material: form.material,
      description: form.description,

      artworkSource: form.artworkSource,

      referenceArtworkName:
        isReferenceArtwork
          ? form.referenceArtworkName
          : null,

      referenceArtistName:
        isReferenceArtwork
          ? form.referenceArtistName
          : null,

      referenceImageUrl:
        isReferenceArtwork && form.refImage
          ? form.refImage
          : null,
    };

    console.log('CUSTOM ART REQUEST:', requestData);

    Alert.alert(
      'Gửi yêu cầu thành công',
      'Yêu cầu của bạn đã được gửi. Họa sĩ sẽ xem và phản hồi sớm.',
      [
        {
          text: 'Đã hiểu',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const pickReferenceImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Quyền truy cập',
        'Bạn cần cho phép truy cập thư viện ảnh để chọn ảnh tham khảo.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

    if (
      !result.canceled &&
      result.assets &&
      result.assets.length > 0
    ) {
      setForm((prev) => ({
        ...prev,
        refImage: result.assets[0].uri,
      }));
    }
  };

  const renderSelect = (
    label: string,
    field:
      | 'type'
      | 'size'
      | 'style'
      | 'material',
    value: string,
    options: string[]
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() =>
          setOpenField(
            openField === field ? null : field
          )
        }
        activeOpacity={0.8}
      >
        <Text style={styles.selectText}>
          {value}
        </Text>

        <Ionicons
          name={
            openField === field
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color="#737373"
        />
      </TouchableOpacity>

      {openField === field && (
        <View style={styles.optionList}>
          {options.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionItem,
                value === item &&
                  styles.optionItemActive,
              ]}
              onPress={() => {
                updateField(field, item);
                setOpenField(null);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  value === item &&
                    styles.optionTextActive,
                ]}
              >
                {item}
              </Text>

              {value === item && (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#EA580C"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#171717"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Tạo yêu cầu
          </Text>

          <Text style={styles.headerSubtitle}>
            Vẽ một tác phẩm dành riêng cho bạn
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="color-palette-outline"
              size={23}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>
              Hãy kể cho chúng tôi ý tưởng của bạn
            </Text>

            <Text style={styles.introText}>
              Càng mô tả rõ, họa sĩ càng dễ hiểu và
              thực hiện đúng mong muốn của bạn.
            </Text>
          </View>
        </View>

        {/* SECTION 1 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                01
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Thông tin cơ bản
              </Text>

              <Text style={styles.sectionHint}>
                Đặt tên cho yêu cầu của bạn
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Tên yêu cầu
          </Text>

          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(v) =>
              updateField('title', v)
            }
            placeholder="VD: Tranh treo phòng khách"
            placeholderTextColor="#A3A3A3"
          />
        </View>

        {/* SECTION 2 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                02
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Đặc điểm tác phẩm
              </Text>

              <Text style={styles.sectionHint}>
                Chọn phong cách bạn mong muốn
              </Text>
            </View>
          </View>

          {renderSelect(
            'Loại tranh',
            'type',
            form.type,
            typeOptions
          )}

          {renderSelect(
            'Kích thước',
            'size',
            form.size,
            sizeOptions
          )}

          {renderSelect(
            'Phong cách',
            'style',
            form.style,
            styleOptions
          )}

          {renderSelect(
            'Chất liệu',
            'material',
            form.material,
            materialOptions
          )}

          <Text style={styles.label}>
            Màu sắc mong muốn
          </Text>

          <TextInput
            style={styles.input}
            value={form.color}
            onChangeText={(v) =>
              updateField('color', v)
            }
            placeholder="VD: Nâu, trắng, vàng"
            placeholderTextColor="#A3A3A3"
          />
        </View>

        {/* SECTION 3 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                03
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                Nguồn tham khảo
              </Text>

              <Text style={styles.sectionHint}>
                Cho biết bạn muốn tạo tranh theo cách nào
              </Text>
            </View>
          </View>

          <View style={styles.sourceList}>
            {artworkSourceOptions.map((item) => {
              const active =
                form.artworkSource === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.sourceCard,
                    active &&
                      styles.sourceCardActive,
                  ]}
                  onPress={() =>
                    updateField(
                      'artworkSource',
                      item.value
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.sourceIcon,
                      active &&
                        styles.sourceIconActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={
                        active
                          ? '#EA580C'
                          : '#737373'
                      }
                    />
                  </View>

                  <View style={styles.sourceContent}>
                    <Text
                      style={[
                        styles.sourceTitle,
                        active &&
                          styles.sourceTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={styles.sourceDescription}
                    >
                      {item.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      active &&
                        styles.radioActive,
                    ]}
                  >
                    {active && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* REFERENCE INFORMATION */}
          {isReferenceArtwork && (
            <View style={styles.referenceBox}>
              <View style={styles.referenceHeader}>
                <Ionicons
                  name="image-outline"
                  size={23}
                  color="#EA580C"
                  style={styles.referenceIcon}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.referenceTitle}>
                    Tác phẩm tham chiếu
                  </Text>

                  <Text style={styles.referenceHint}>
                    Nhập thông tin về tác phẩm bạn muốn
                    tham khảo.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>
                Tên tác phẩm
              </Text>

              <TextInput
                style={styles.input}
                value={form.referenceArtworkName}
                onChangeText={(v) =>
                  updateField(
                    'referenceArtworkName',
                    v
                  )
                }
                placeholder="VD: Mona Lisa"
                placeholderTextColor="#A3A3A3"
              />

              <Text style={styles.label}>
                Tác giả tác phẩm tham chiếu
              </Text>

              <TextInput
                style={styles.input}
                value={form.referenceArtistName}
                onChangeText={(v) =>
                  updateField(
                    'referenceArtistName',
                    v
                  )
                }
                placeholder="VD: Leonardo da Vinci"
                placeholderTextColor="#A3A3A3"
              />

              <Text style={styles.label}>
                Ảnh tham khảo
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickReferenceImage}
              >
                <View style={styles.uploadIcon}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={21}
                    color="#EA580C"
                  />
                </View>

                <View>
                  <Text style={styles.uploadTitle}>
                    Chọn ảnh từ điện thoại
                  </Text>

                  <Text style={styles.uploadHint}>
                    JPG, PNG · Ảnh rõ nét
                  </Text>
                </View>
              </TouchableOpacity>

              {form.refImage ? (
                <View style={styles.previewWrapper}>
                  <Image
                    source={{
                      uri: form.refImage,
                    }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() =>
                      updateField(
                        'refImage',
                        ''
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={21}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons
                    name="image-outline"
                    size={23}
                    color="#A3A3A3"
                    style={styles.placeholderIcon}
                  />

                  <Text style={styles.placeholderText}>
                    Chưa có ảnh tham khảo
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* SECTION 4 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>
                04
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Mô tả ý tưởng
              </Text>

              <Text style={styles.sectionHint}>
                Chia sẻ càng chi tiết càng tốt
              </Text>
            </View>
          </View>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            multiline
            value={form.description}
            onChangeText={(v) =>
              updateField(
                'description',
                v
              )
            }
            placeholder="Mô tả không gian, nội dung tranh, cảm xúc, bố cục, nhân vật..."
            placeholderTextColor="#A3A3A3"
            textAlignVertical="top"
          />

          <Text style={styles.characterHint}>
            Gợi ý: không gian treo tranh, chủ đề,
            màu sắc, nhân vật, cảm xúc...
          </Text>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Tóm tắt yêu cầu
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Loại tranh
            </Text>

            <Text style={styles.summaryValue}>
              {form.type}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Kích thước
            </Text>

            <Text style={styles.summaryValue}>
              {form.size}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Phong cách
            </Text>

            <Text style={styles.summaryValue}>
              {form.style}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Nguồn
            </Text>

            <Text
              style={[
                styles.summaryValue,
                styles.summarySource,
              ]}
            >
              {
                artworkSourceOptions.find(
                  (x) =>
                    x.value ===
                    form.artworkSource
                )?.title
              }
            </Text>
          </View>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid &&
              styles.submitButtonDisabled,
          ]}
          onPress={submit}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.submitText,
              !isFormValid &&
                styles.submitTextDisabled,
            ]}
          >
            Gửi yêu cầu vẽ tranh
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color={
              isFormValid
                ? '#FFFFFF'
                : '#737373'
            }
            style={styles.submitArrow}
          />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Bạn sẽ nhận được phản hồi và báo giá sau khi
          yêu cầu được tiếp nhận.
        </Text>

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

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#F7F7F5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    marginLeft: 12,
  },

  headerTitle: {
    color: '#171717',
    fontSize: 19,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#737373',
    fontSize: 11,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  /* INTRO */

  introCard: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    marginBottom: 25,
  },

  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  introContent: {
    flex: 1,
    marginLeft: 12,
  },

  introTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },

  introText: {
    color: '#A3A3A3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  /* SECTION */

  section: {
    marginBottom: 25,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  sectionNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  sectionTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '800',
  },

  sectionHint: {
    color: '#737373',
    fontSize: 11,
    marginTop: 3,
  },

  label: {
    color: '#404040',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: '#171717',
  },

  /* SELECT */

  fieldBlock: {
    marginBottom: 3,
  },

  selectBox: {
    minHeight: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    color: '#171717',
    fontSize: 13,
  },

  optionList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginTop: 5,
    overflow: 'hidden',
  },

  optionItem: {
    minHeight: 45,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  optionItemActive: {
    backgroundColor: '#FFF7ED',
  },

  optionText: {
    color: '#404040',
    fontSize: 13,
  },

  optionTextActive: {
    color: '#C2410C',
    fontWeight: '700',
  },

  /* SOURCE */

  sourceList: {
    gap: 9,
  },

  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sourceCardActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },

  sourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sourceIconActive: {
    backgroundColor: '#FFEDD5',
  },

  sourceContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  sourceTitle: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '800',
  },

  sourceTitleActive: {
    color: '#C2410C',
  },

  sourceDescription: {
    color: '#737373',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D4D4D4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioActive: {
    borderColor: '#EA580C',
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#EA580C',
  },

  /* REFERENCE */

  referenceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  referenceIcon: {
    marginRight: 10,
  },

  referenceTitle: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '800',
  },

  referenceHint: {
    color: '#737373',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },

  /* UPLOAD */

  uploadButton: {
    minHeight: 65,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D4D4D4',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  uploadIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  uploadTitle: {
    color: '#404040',
    fontSize: 12,
    fontWeight: '700',
  },

  uploadHint: {
    color: '#A3A3A3',
    fontSize: 9,
    marginTop: 3,
  },

  previewWrapper: {
    marginTop: 10,
    position: 'relative',
  },

  previewImage: {
    width: '100%',
    height: 210,
    borderRadius: 13,
    backgroundColor: '#E5E5E5',
  },

  removeImage: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderBox: {
    height: 100,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderIcon: {
    marginBottom: 4,
  },

  placeholderText: {
    color: '#A3A3A3',
    fontSize: 10,
  },

  /* DESCRIPTION */

  textArea: {
    minHeight: 130,
    paddingTop: 13,
    lineHeight: 19,
  },

  characterHint: {
    color: '#A3A3A3',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  /* SUMMARY */

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  summaryTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  summaryLabel: {
    color: '#737373',
    fontSize: 11,
  },

  summaryValue: {
    color: '#171717',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },

  summarySource: {
    color: '#C2410C',
  },

  /* SUBMIT */

  submitButton: {
    minHeight: 52,
    backgroundColor: '#EA580C',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#D4D4D4',
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  submitTextDisabled: {
    color: '#737373',
  },

  submitArrow: {
    marginLeft: 9,
  },

  footerNote: {
    color: '#A3A3A3',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 9,
  },

  bottomSpace: {
    height: 25,
  },
});