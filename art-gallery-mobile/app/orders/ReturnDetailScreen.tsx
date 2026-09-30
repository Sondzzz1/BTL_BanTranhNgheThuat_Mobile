import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import { returnService } from '../../services/returnService';

import {
  YeuCauHoanTraChiTiet,
  RETURN_STATUS_TEXT,
  RETURN_STATUS_COLOR,
  RETURN_STATUS_BG,
  RETURN_STATUS,
  RETURN_TIMELINE,
  RETURN_REASONS,
} from '../../types/return';

import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { API_BASE_URL } from '../../constants/api';
import { formatVnd } from '../../utils/currency';

interface ReturnDetailScreenProps {
  route: any;
  navigation: any;
}

type ImageSourceValue =
  | {
      uri: string;
      headers?: {
        Authorization: string;
      };
    }
  | null;

// Tránh render trực tiếp Base64 legacy quá lớn.
// Đây là giải pháp an toàn cho iOS/Hermes.
// 2.000.000 ký tự tương đương khoảng vài MB dữ liệu encoded.
const MAX_INLINE_BASE64_LENGTH = 2_000_000;

export default function ReturnDetailScreen({
  route,
  navigation,
}: ReturnDetailScreenProps) {
  const { returnId } = route.params as { returnId: number };

  const [detail, setDetail] =
    useState<YeuCauHoanTraChiTiet | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [authToken, setAuthToken] =
    useState<string | null>(null);

  /*
   * API_BASE_URL của bạn dạng:
   *
   * http://10.xxx.xxx.xxx:5273/api
   *
   * Ta cần origin:
   *
   * http://10.xxx.xxx.xxx:5273
   */
  const getApiOrigin = (): string => {
    return API_BASE_URL.replace(/\/api\/?$/i, '');
  };

  /*
   * Load token + chi tiết yêu cầu.
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        setAuthToken(token);

        await loadDetail();
      } catch (err) {
        console.log(
          'ReturnDetail initialize error:',
          err
        );
      }
    };

    initialize();
  }, [returnId]);

  /*
   * Load chi tiết yêu cầu hoàn trả.
   */
  const loadDetail = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const data =
        await returnService.getReturnDetail(returnId);

      /*
       * Debug ảnh.
       *
       * KHÔNG log toàn bộ Base64 vì console sẽ rất nặng.
       * Chỉ log type, length và prefix.
       */
      console.log(
        'RETURN DETAIL IMAGES:',
        Array.isArray(data?.hinhAnh)
          ? data.hinhAnh.map((item: any) => ({
              type: typeof item,
              length:
                typeof item === 'string'
                  ? item.length
                  : null,
              prefix:
                typeof item === 'string'
                  ? item.substring(0, 80)
                  : item,
            }))
          : data?.hinhAnh
      );

      setDetail(data);
    } catch (err: any) {
      console.log(
        'Load return detail error:',
        err
      );

      setError(
        err?.message ||
          'Không thể tải chi tiết yêu cầu hoàn trả'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Customer xác nhận đã gửi hàng.
   */
  const handleConfirmShipped = () => {
    Alert.alert(
      'Xác nhận gửi hàng',
      'Bạn xác nhận đã gửi sản phẩm về cửa hàng chúng tôi?\n\nSau khi xác nhận, trạng thái sẽ chuyển sang "Đang gửi hàng".',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận đã gửi',
          style: 'default',

          onPress: async () => {
            try {
              setIsConfirming(true);

              const result =
                await returnService.confirmProductReturned(
                  returnId
                );

              Alert.alert(
                'Thành công',
                result.message
              );

              await loadDetail();
            } catch (err: any) {
              Alert.alert(
                'Lỗi',
                err?.message ||
                  'Không thể xác nhận gửi hàng'
              );
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  /*
   * Customer hủy yêu cầu khi còn CHO_DUYET.
   */
  const handleCancel = () => {
    Alert.alert(
      'Hủy yêu cầu',
      'Bạn có chắc muốn hủy yêu cầu hoàn trả đang chờ duyệt?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy yêu cầu',
          style: 'destructive',

          onPress: async () => {
            try {
              setIsConfirming(true);

              const result =
                await returnService.cancelReturnRequest(
                  returnId
                );

              Alert.alert(
                'Thành công',
                result.message
              );

              await loadDetail();
            } catch (err: any) {
              Alert.alert(
                'Lỗi',
                err?.message ||
                  'Không thể hủy yêu cầu'
              );
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  };

  /*
   * Xử lý ảnh minh chứng hoàn trả.
   *
   * Có 3 trường hợp:
   *
   * 1. Legacy Base64:
   *    data:image/jpeg;base64,...
   *
   * 2. URL đầy đủ:
   *    http://...
   *    https://...
   *
   * 3. API path backend:
   *    /api/hoan-tra/1/tep/xxx.jpg
   */
  const getEvidenceSource = (
    value: unknown
  ): ImageSourceValue => {
    /*
     * Không phải string thì bỏ qua.
     */
    if (typeof value !== 'string') {
      return null;
    }

    const url = value.trim();

    /*
     * Chuỗi rỗng.
     */
    if (!url) {
      return null;
    }

    /*
     * ============================
     * LEGACY BASE64
     * ============================
     */
    if (/^data:image\//i.test(url)) {
      /*
       * Base64 quá lớn có thể làm React Native
       * iOS/Hermes/Fabric crash khi render.
       */
      if (
        url.length >
        MAX_INLINE_BASE64_LENGTH
      ) {
        console.warn(
          'Legacy return image too large:',
          {
            length: url.length,
            prefix: url.substring(0, 50),
          }
        );

        return null;
      }

      /*
       * Base64 phải dùng trực tiếp.
       *
       * TUYỆT ĐỐI không nối:
       *
       * /tep/data:image...
       */
      return {
        uri: url,
      };
    }

    /*
     * ============================
     * URL HTTP/HTTPS ĐẦY ĐỦ
     * ============================
     */
    if (/^https?:\/\//i.test(url)) {
      if (authToken) {
        return {
          uri: url,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        };
      }

      return {
        uri: url,
      };
    }

    /*
     * ============================
     * API PATH TƯƠNG ĐỐI
     * ============================
     *
     * Ví dụ:
     *
     * /api/hoan-tra/1/tep/image.jpg
     */
    if (url.startsWith('/')) {
      const fullUrl =
        `${getApiOrigin()}${url}`;

      if (authToken) {
        return {
          uri: fullUrl,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        };
      }

      return {
        uri: fullUrl,
      };
    }

    /*
     * ============================
     * FILE NAME THÔNG THƯỜNG
     * ============================
     *
     * Nếu backend vô tình trả:
     *
     * abc.jpg
     *
     * thay vì path đầy đủ thì không render trực tiếp,
     * vì màn hình không thể biết returnId/file route
     * chính xác nếu backend chưa map URL.
     */
    console.warn(
      'Invalid return image value:',
      url.substring(0, 100)
    );

    return null;
  };

  /*
   * Normalize ảnh sản phẩm.
   */
  const getProductImageUri = (
    value?: string | null
  ): string | null => {
    if (
      !value ||
      typeof value !== 'string'
    ) {
      return null;
    }

    const url = value.trim();

    if (!url) {
      return null;
    }

    /*
     * Base64.
     */
    if (/^data:image\//i.test(url)) {
      if (
        url.length >
        MAX_INLINE_BASE64_LENGTH
      ) {
        return null;
      }

      return url;
    }

    /*
     * URL hoàn chỉnh.
     */
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const origin = getApiOrigin();

    /*
     * Path bắt đầu bằng /
     */
    if (url.startsWith('/')) {
      return `${origin}${url}`;
    }

    /*
     * Path tương đối.
     */
    return `${origin}/${url}`;
  };

  /*
   * Format tiền.
   */
  const formatPrice = formatVnd;

  /*
   * Format ngày giờ.
   */
  const formatDate = (
    dateString?: string | null
  ): string => {
    if (!dateString) {
      return '---';
    }

    try {
      const date = new Date(dateString);

      if (Number.isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleString(
        'vi-VN',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return dateString;
    }
  };

  /*
   * Convert mã lý do thành label.
   */
  const getLyDoLabel = (
    lyDo?: string | null
  ): string => {
    if (!lyDo) {
      return 'Không xác định';
    }

    const found =
      RETURN_REASONS.find(
        (reason) =>
          reason.value === lyDo
      );

    return found
      ? found.label
      : lyDo;
  };

  /*
   * Tính vị trí hiện tại trên timeline.
   */
  const getCurrentTimelineIndex = (
    status: string
  ): number => {
    if (
      status ===
        RETURN_STATUS.TU_CHOI ||
      status ===
        RETURN_STATUS.DA_HUY
    ) {
      return -1;
    }

    const index =
      RETURN_TIMELINE.findIndex(
        (item) =>
          item.status === status
      );

    return index >= 0
      ? index
      : 0;
  };

  /*
   * ==============================
   * LOADING
   * ==============================
   */
  if (isLoading) {
    return (
      <Loading message="Đang tải chi tiết yêu cầu..." />
    );
  }

  /*
   * ==============================
   * ERROR
   * ==============================
   */
  if (error || !detail) {
    return (
      <ErrorMessage
        message={
          error ||
          'Không tìm thấy yêu cầu'
        }
        onRetry={loadDetail}
      />
    );
  }

  const currentTimelineIndex =
    getCurrentTimelineIndex(
      detail.trangThai
    );

  const statusColor =
    RETURN_STATUS_COLOR[
      detail.trangThai
    ] ?? '#6b7280';

  const statusBg =
    RETURN_STATUS_BG[
      detail.trangThai
    ] ?? '#f3f4f6';

  const productImageUri =
    getProductImageUri(
      detail.hinhAnhTacPham
    );

  /*
   * Chỉ nhận những phần tử string hợp lệ.
   */
  const evidenceImages =
    Array.isArray(detail.hinhAnh)
      ? detail.hinhAnh
      : [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text
              style={styles.returnCode}
            >
              Yêu cầu #{detail.maYeuCau}
            </Text>

            <Text
              style={styles.orderCode}
            >
              Đơn hàng #{detail.maDonHang}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusBg,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusColor,
                },
              ]}
            >
              {RETURN_STATUS_TEXT[
                detail.trangThai
              ] ??
                detail.trangThai}
            </Text>
          </View>
        </View>

        {/* =========================
            SẢN PHẨM
        ========================= */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Sản phẩm
          </Text>

          <View
            style={styles.productRow}
          >
            <View
              style={
                styles.productImageContainer
              }
            >
              {productImageUri ? (
                <Image
                  source={{
                    uri: productImageUri,
                  }}
                  style={
                    styles.productImage
                  }
                  resizeMode="cover"
                  onError={(event) => {
                    console.log(
                      'Product image error:',
                      {
                        uri:
                          productImageUri.substring(
                            0,
                            100
                          ),
                        error:
                          event
                            .nativeEvent,
                      }
                    );
                  }}
                />
              ) : (
                <View
                  style={
                    styles.productImagePlaceholder
                  }
                >
                  <Text
                    style={
                      styles.productImagePlaceholderIcon
                    }
                  >
                    🖼️
                  </Text>
                </View>
              )}
            </View>

            <View
              style={
                styles.productInfo
              }
            >
              <Text
                style={
                  styles.productName
                }
                numberOfLines={2}
              >
                {detail.tenTacPham ||
                  'Sản phẩm'}
              </Text>

              <Text
                style={
                  styles.productPrice
                }
              >
                {formatPrice(
                  detail.giaTacPham
                )}
              </Text>

              <Text
                style={
                  styles.productQty
                }
              >
                Số lượng:{' '}
                {detail.soLuong}
              </Text>
            </View>
          </View>
        </View>

        {/* =========================
            THÔNG TIN YÊU CẦU
        ========================= */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Thông tin yêu cầu
          </Text>

          <View style={styles.infoRow}>
            <Text
              style={styles.infoLabel}
            >
              Lý do:
            </Text>

            <Text
              style={styles.infoValue}
            >
              {getLyDoLabel(
                detail.lyDo
              )}
            </Text>
          </View>

          {!!detail.lyDoKhac && (
            <View
              style={styles.infoRow}
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Lý do cụ thể:
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {detail.lyDoKhac}
              </Text>
            </View>
          )}

          {!!detail.moTa && (
            <View
              style={styles.infoRow}
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                Mô tả:
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  styles.infoValueMultiline,
                ]}
              >
                {detail.moTa}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text
              style={styles.infoLabel}
            >
              Ngày gửi:
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                detail.ngayTao
              )}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text
              style={styles.infoLabel}
            >
              Cập nhật lần cuối:
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                detail.ngayCapNhat
              )}
            </Text>
          </View>
        </View>

        {/* =========================
            ẢNH MINH CHỨNG
        ========================= */}

        {evidenceImages.length >
          0 && (
          <View style={styles.section}>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Hình ảnh minh chứng
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.evidenceScroll
              }
            >
              {evidenceImages.map(
                (
                  imageValue: any,
                  index: number
                ) => {
                  const source =
                    getEvidenceSource(
                      imageValue
                    );

                  /*
                   * Không render dữ liệu lỗi.
                   */
                  if (!source) {
                    return (
                      <View
                        key={`invalid-${index}`}
                        style={
                          styles.evidenceFallback
                        }
                      >
                        <Text
                          style={
                            styles.evidenceFallbackIcon
                          }
                        >
                          🖼️
                        </Text>

                        <Text
                          style={
                            styles.evidenceFallbackText
                          }
                        >
                          Không thể hiển thị
                          ảnh
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <Image
                      key={`${detail.maYeuCau}-${index}`}
                      source={source}
                      style={
                        styles.evidenceImage
                      }
                      resizeMode="cover"
                      onError={(
                        event
                      ) => {
                        console.log(
                          'Return evidence image error:',
                          {
                            index,
                            value:
                              typeof imageValue ===
                              'string'
                                ? imageValue.substring(
                                    0,
                                    100
                                  )
                                : imageValue,
                            nativeEvent:
                              event
                                .nativeEvent,
                          }
                        );
                      }}
                    />
                  );
                }
              )}
            </ScrollView>
          </View>
        )}

        {/* =========================
            TỪ CHỐI
        ========================= */}

        {detail.trangThai ===
          RETURN_STATUS.TU_CHOI && (
          <View
            style={styles.rejectedBox}
          >
            <Text
              style={
                styles.rejectedTitle
              }
            >
              ❌ Yêu cầu bị từ chối
            </Text>

            <Text
              style={
                styles.rejectedLabel
              }
            >
              Lý do từ chối:
            </Text>

            <Text
              style={
                styles.rejectedReason
              }
            >
              {detail.lyDoTuChoi ||
                'Không có lý do cụ thể'}
            </Text>
          </View>
        )}

        {/* =========================
            ĐÃ HỦY
        ========================= */}

        {detail.trangThai ===
          RETURN_STATUS.DA_HUY && (
          <View
            style={
              styles.cancelledBox
            }
          >
            <Text
              style={
                styles.cancelledTitle
              }
            >
              Yêu cầu này đã được bạn
              hủy.
            </Text>
          </View>
        )}

        {/* =========================
            ĐÃ DUYỆT
        ========================= */}

        {detail.trangThai ===
          RETURN_STATUS.DA_DUYET && (
          <View
            style={
              styles.approvedBox
            }
          >
            <Text
              style={
                styles.approvedTitle
              }
            >
              ✅ Yêu cầu đã được duyệt!
            </Text>

            <Text
              style={
                styles.approvedInstructions
              }
            >
              Vui lòng gửi sản phẩm về
              địa chỉ của chúng tôi:
              {'\n\n'}
              📍{' '}
              <Text
                style={styles.bold}
              >
                LanVu Gallery
              </Text>
              {'\n'}
              123 Đường Nghệ Thuật,
              Quận 1, TP.HCM
              {'\n\n'}
              📞 Hotline: 1900 xxxx
              {'\n\n'}
              Sau khi gửi hàng, bấm
              nút bên dưới để xác nhận.
            </Text>
          </View>
        )}

        {/* =========================
            TIMELINE
        ========================= */}

        {detail.trangThai !==
          RETURN_STATUS.TU_CHOI &&
          detail.trangThai !==
            RETURN_STATUS.DA_HUY && (
            <View
              style={styles.section}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Tiến trình xử lý
              </Text>

              {RETURN_TIMELINE.map(
                (
                  step,
                  index
                ) => {
                  const isDone =
                    index <=
                    currentTimelineIndex;

                  const isCurrent =
                    index ===
                    currentTimelineIndex;

                  return (
                    <View
                      key={
                        step.status
                      }
                      style={
                        styles.timelineItem
                      }
                    >
                      {index <
                        RETURN_TIMELINE.length -
                          1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isDone &&
                              styles.timelineLineDone,
                          ]}
                        />
                      )}

                      <View
                        style={[
                          styles.timelineDot,
                          isDone &&
                            styles.timelineDotDone,
                          isCurrent &&
                            styles.timelineDotCurrent,
                        ]}
                      >
                        {isDone && (
                          <Text
                            style={
                              styles.timelineDotCheck
                            }
                          >
                            ✓
                          </Text>
                        )}
                      </View>

                      <View
                        style={
                          styles.timelineContent
                        }
                      >
                        <Text
                          style={[
                            styles.timelineLabel,
                            isDone &&
                              styles.timelineLabelDone,
                            isCurrent &&
                              styles.timelineLabelCurrent,
                          ]}
                        >
                          {
                            step.label
                          }
                        </Text>

                        {isCurrent && (
                          <Text
                            style={
                              styles.timelineDescription
                            }
                          >
                            {
                              step.description
                            }
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          )}

        <View
          style={{ height: 120 }}
        />
      </ScrollView>

      {/* =========================
          NÚT XÁC NHẬN ĐÃ GỬI
      ========================= */}

      {detail.trangThai ===
        RETURN_STATUS.DA_DUYET && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              isConfirming &&
                styles.confirmButtonDisabled,
            ]}
            onPress={
              handleConfirmShipped
            }
            disabled={isConfirming}
            activeOpacity={0.8}
          >
            {isConfirming ? (
              <View
                style={
                  styles.buttonLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.confirmButtonText
                  }
                >
                  Đang xử lý...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.confirmButtonText
                }
              >
                🚚 TÔI ĐÃ GỬI SẢN PHẨM
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* =========================
          HỦY YÊU CẦU
      ========================= */}

      {detail.trangThai ===
        RETURN_STATUS.CHO_DUYET && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.cancelRequestButton,
              isConfirming &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleCancel}
            disabled={isConfirming}
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.confirmButtonText
              }
            >
              {isConfirming
                ? 'Đang xử lý...'
                : 'HỦY YÊU CẦU'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f6f8',
    },

    scrollView: {
      flex: 1,
    },

    header: {
      backgroundColor: '#ffffff',
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#eeeeee',
    },

    headerInfo: {
      flex: 1,
      marginRight: 12,
    },

    returnCode: {
      fontSize: 19,
      fontWeight: '700',
      color: '#111827',
    },

    orderCode: {
      marginTop: 4,
      fontSize: 13,
      color: '#6b7280',
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      maxWidth: 150,
    },

    statusText: {
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },

    section: {
      backgroundColor: '#ffffff',
      marginHorizontal: 14,
      marginTop: 14,
      padding: 16,
      borderRadius: 14,

      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,

      elevation: 2,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 14,
    },

    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    productImageContainer: {
      width: 90,
      height: 90,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#f3f4f6',
    },

    productImage: {
      width: '100%',
      height: '100%',
    },

    productImagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f3f4f6',
    },

    productImagePlaceholderIcon: {
      fontSize: 32,
    },

    productInfo: {
      flex: 1,
      marginLeft: 14,
    },

    productName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      lineHeight: 22,
    },

    productPrice: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: '700',
      color: '#dc2626',
    },

    productQty: {
      marginTop: 6,
      fontSize: 13,
      color: '#6b7280',
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },

    infoLabel: {
      width: 135,
      fontSize: 14,
      color: '#6b7280',
      fontWeight: '600',
    },

    infoValue: {
      flex: 1,
      fontSize: 14,
      color: '#1f2937',
      lineHeight: 21,
    },

    infoValueMultiline: {
      textAlign: 'left',
    },

    evidenceScroll: {
      paddingRight: 4,
    },

    evidenceImage: {
      width: 150,
      height: 150,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      marginRight: 10,
    },

    evidenceFallback: {
      width: 150,
      height: 150,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },

    evidenceFallbackIcon: {
      fontSize: 28,
      marginBottom: 8,
    },

    evidenceFallbackText: {
      color: '#6b7280',
      fontSize: 12,
      textAlign: 'center',
    },

    rejectedBox: {
      marginHorizontal: 14,
      marginTop: 14,
      padding: 16,
      backgroundColor: '#fef2f2',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#fecaca',
    },

    rejectedTitle: {
      color: '#b91c1c',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },

    rejectedLabel: {
      fontSize: 13,
      color: '#7f1d1d',
      fontWeight: '600',
      marginBottom: 5,
    },

    rejectedReason: {
      fontSize: 14,
      color: '#991b1b',
      lineHeight: 21,
    },

    cancelledBox: {
      marginHorizontal: 14,
      marginTop: 14,
      padding: 16,
      backgroundColor: '#f3f4f6',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d1d5db',
    },

    cancelledTitle: {
      color: '#4b5563',
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },

    approvedBox: {
      marginHorizontal: 14,
      marginTop: 14,
      padding: 16,
      backgroundColor: '#ecfdf5',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },

    approvedTitle: {
      color: '#047857',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },

    approvedInstructions: {
      color: '#065f46',
      fontSize: 14,
      lineHeight: 22,
    },

    bold: {
      fontWeight: '700',
    },

    timelineItem: {
      minHeight: 70,
      flexDirection: 'row',
      position: 'relative',
    },

    timelineLine: {
      position: 'absolute',
      left: 11,
      top: 24,
      bottom: -4,
      width: 2,
      backgroundColor: '#e5e7eb',
    },

    timelineLineDone: {
      backgroundColor: '#22c55e',
    },

    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },

    timelineDotDone: {
      backgroundColor: '#22c55e',
    },

    timelineDotCurrent: {
      borderWidth: 3,
      borderColor: '#bbf7d0',
    },

    timelineDotCheck: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    timelineContent: {
      flex: 1,
      marginLeft: 14,
      paddingBottom: 20,
    },

    timelineLabel: {
      fontSize: 14,
      color: '#9ca3af',
      fontWeight: '600',
    },

    timelineLabelDone: {
      color: '#374151',
    },

    timelineLabelCurrent: {
      color: '#16a34a',
      fontWeight: '700',
    },

    timelineDescription: {
      marginTop: 5,
      color: '#6b7280',
      fontSize: 13,
      lineHeight: 19,
    },

    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 18,
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',

      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,

      elevation: 8,
    },

    confirmButton: {
      minHeight: 50,
      borderRadius: 12,
      backgroundColor: '#16a34a',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },

    cancelRequestButton: {
      minHeight: 50,
      borderRadius: 12,
      backgroundColor: '#dc2626',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },

    confirmButtonDisabled: {
      opacity: 0.6,
    },

    confirmButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
    },

    buttonLoading: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
  });