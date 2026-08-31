import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import Colors from '../constants/colors';

interface FooterProps {
  navigation?: any;
  showReviews?: boolean;
}

export default function Footer({ navigation, showReviews = true }: FooterProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Thành công', 'Cảm ơn bạn đã đăng ký nhận thông tin khuyến mãi!');
      setEmail('');
    }, 600);
  };

  const handleNavigate = (screenName: string) => {
    if (navigation && screenName) {
      navigation.navigate(screenName);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  return (
    <View style={styles.footerContainer}>
      {/* 1. KHÁCH HÀNG NHẬN XÉT VỀ CHÚNG TÔI */}
      {showReviews && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>KHÁCH HÀNG NHẬN XÉT VỀ CHÚNG TÔI</Text>
          <View style={styles.reviewCard}>
            <Text style={styles.starsText}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.reviewText}>
              "Chất lượng tranh rất tốt, giao hàng nhanh!"
            </Text>
          </View>
        </View>
      )}

      {/* 2. ĐĂNG KÝ EMAIL & MAIN FOOTER */}
      <View style={styles.darkFooter}>
        {/* Newsletter Signup */}
        <View style={styles.newsletterSection}>
          <Text style={styles.newsletterTitle}>ĐĂNG KÝ EMAIL</Text>
          <Text style={styles.newsletterSubtitle}>
            Để nhận tin nhắn thông tin và khuyến mãi từ chúng tôi
          </Text>

          <View style={styles.emailInputRow}>
            <TextInput
              style={styles.emailInput}
              placeholder="Your Email (required)"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSubscribe}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Text style={styles.signUpButtonText}>
                {isSubmitting ? '...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer Columns */}
        <View style={styles.columnsContainer}>
          {/* Column 1: Brand Info */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>LANVU GALLERY</Text>
            <View style={styles.contactItem}>
              <Text style={styles.iconText}>📍</Text>
              <Text style={styles.infoText}>
                56 Nguyễn Phong Sắc, Dịch Vọng, Cầu Giấy, Hà Nội
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.iconText}>📞</Text>
              <Text style={styles.infoText}>094 888 3535 - 094 886 3535</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.iconText}>✉️</Text>
              <Text style={styles.infoText}>lanvugallery@gmail.com</Text>
            </View>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleOpenLink('https://facebook.com/lanvugallery123')}
            >
              <Text style={styles.iconText}>🌐</Text>
              <Text style={[styles.infoText, styles.linkText]}>
                facebook.com/lanvugallery123
              </Text>
            </TouchableOpacity>
          </View>

          {/* Column 2: HỖ TRỢ */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>HỖ TRỢ</Text>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleNavigate('Profile')}
            >
              <Text style={styles.linkItemText}>• Tài khoản</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleNavigate('Favorites')}
            >
              <Text style={styles.linkItemText}>• Sản phẩm yêu thích</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleNavigate('Cart')}
            >
              <Text style={styles.linkItemText}>• Giỏ hàng</Text>
            </TouchableOpacity>
          </View>

          {/* Column 3: HƯỚNG DẪN */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>HƯỚNG DẪN</Text>
            <Text style={styles.linkItemText}>• Mua hàng và thanh toán</Text>
            <Text style={styles.linkItemText}>• Chính sách đổi trả & lưu kho</Text>
            <Text style={styles.linkItemText}>• Điều khoản dịch vụ</Text>
            <Text style={styles.linkItemText}>• Chính sách giao hàng & vận chuyển</Text>
            <Text style={styles.linkItemText}>• Chính sách bảo hành</Text>
          </View>

          {/* Column 4: FANPAGE */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>FANPAGE</Text>
            <TouchableOpacity
              style={styles.fanpageCard}
              onPress={() => handleOpenLink('https://facebook.com/lanvugallery123')}
            >
              <Text style={styles.fanpageTitle}>LanVu Gallery</Text>
              <Text style={styles.fanpageSubtitle}>51,628 người theo dõi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.copyrightText}>
            © 2026 ART GALLERY / LANVU GALLERY. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    marginTop: 24,
  },
  /* Review Section */
  reviewSection: {
    backgroundColor: '#7c52b5',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  reviewTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  starsText: {
    fontSize: 16,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  /* Dark Footer Section */
  darkFooter: {
    backgroundColor: '#111827',
    paddingTop: 28,
    paddingBottom: 20,
  },
  newsletterSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  newsletterTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  newsletterSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  emailInputRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    height: 44,
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  signUpButton: {
    backgroundColor: '#ff7b00',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  /* Columns */
  columnsContainer: {
    paddingHorizontal: 20,
  },
  column: {
    marginBottom: 22,
  },
  columnTitle: {
    color: '#ff7b00',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 13,
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
  linkItem: {
    paddingVertical: 4,
  },
  linkItemText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 22,
  },
  fanpageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  fanpageTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  fanpageSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  bottomBar: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
});
