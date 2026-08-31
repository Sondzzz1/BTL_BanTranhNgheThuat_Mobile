import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ImageBackground,
} from 'react-native';
import Colors from '../constants/colors';

interface FooterProps {
  navigation?: any;
}

export default function Footer({ navigation }: FooterProps) {
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
      {/* MAIN FOOTER WITH ART GALLERY BACKGROUND IMAGE */}
      <ImageBackground
        source={require('../assets/images/footer_bg.png')}
        style={styles.backgroundImageContainer}
        resizeMode="stretch"
      >
        <View style={styles.darkOverlay}>
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
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    marginTop: 24,
  },

  /* Background Image & Overlay */
  backgroundImageContainer: {
    width: '100%',
  },
  darkOverlay: {
    backgroundColor: 'rgba(10, 15, 30, 0.88)',
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
    color: '#cbd5e1',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    color: '#e2e8f0',
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
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 22,
  },
  fanpageCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fanpageTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  fanpageSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  bottomBar: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  copyrightText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});
