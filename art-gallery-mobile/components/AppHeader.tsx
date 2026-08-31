import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cartService } from '../services/cartService';

interface AppHeaderProps {
  navigation: any;
  cartCount?: number;
}

const { width } = Dimensions.get('window');

export default function AppHeader({ navigation, cartCount: propCartCount }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(propCartCount ?? 0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (propCartCount !== undefined) {
      setCartCount(propCartCount);
    } else if (user) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [user, propCartCount]);

  const loadCartCount = async () => {
    try {
      const cart = await cartService.getCart();
      const count = cart.danhSachSanPham?.reduce((sum, item) => sum + item.soLuong, 0) || 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setMenuVisible(false);
      navigation.navigate('Products', { search: searchQuery.trim() });
      setSearchQuery('');
    }
  };

  const handleNav = (screenName: string, params?: any) => {
    setMenuVisible(false);
    navigation.navigate(screenName, params);
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>

          {/* Logo Center */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <View style={styles.logoBox}>
              <View style={styles.roofIcon}>
                <View style={styles.roofLeft} />
              </View>
              <Text style={styles.logoTitle}>LANVU GALLERY</Text>
              <Text style={styles.logoSubtitle}>ART IS FOREVER</Text>
            </View>
          </TouchableOpacity>

          {/* Cart Bag Icon with Count */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <View style={styles.cartIconWrapper}>
              <View style={styles.cartHandle} />
              <View style={styles.cartBag}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Side Menu Drawer Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />

          <View style={styles.drawerContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
              {/* Search Bar */}
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}
                  activeOpacity={0.8}
                >
                  <Text style={styles.searchIconText}>🔍</Text>
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNav('Home')}
              >
                <Text style={styles.menuItemText}>TRANG CHỦ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => toggleSection('gioiThieu')}
              >
                <Text style={styles.menuItemText}>GIỚI THIỆU</Text>
                <Text style={styles.chevronText}>{expandedSections['gioiThieu'] ? '∧' : '∨'}</Text>
              </TouchableOpacity>
              {expandedSections['gioiThieu'] && (
                <View style={styles.subMenu}>
                  <TouchableOpacity
                    style={styles.subMenuItem}
                    onPress={() => handleNav('Home')}
                  >
                    <Text style={styles.subMenuItemText}>• Về LanVu Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subMenuItem}
                    onPress={() => handleNav('Home')}
                  >
                    <Text style={styles.subMenuItemText}>• Tầm nhìn & Sứ mệnh</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => handleNav('Products')}
              >
                <Text style={styles.menuItemText}>TÁC PHẨM</Text>
                <Text style={styles.chevronText}>∨</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => handleNav('Products')}
              >
                <Text style={styles.menuItemText}>HỌA SĨ</Text>
                <Text style={styles.chevronText}>∨</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => toggleSection('dichVu')}
              >
                <Text style={styles.menuItemText}>DỊCH VỤ</Text>
                <Text style={styles.chevronText}>{expandedSections['dichVu'] ? '∧' : '∨'}</Text>
              </TouchableOpacity>
              {expandedSections['dichVu'] && (
                <View style={styles.subMenu}>
                  <Text style={styles.subMenuItemText}>• Tư vấn không gian nghệ thuật</Text>
                  <Text style={styles.subMenuItemText}>• Đặt vẽ tranh theo yêu cầu</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => toggleSection('tinTuc')}
              >
                <Text style={styles.menuItemText}>TIN TỨC</Text>
                <Text style={styles.chevronText}>{expandedSections['tinTuc'] ? '∧' : '∨'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNav('Favorites')}
              >
                <Text style={styles.menuItemText}>YÊU THÍCH</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNav('Orders')}
              >
                <Text style={styles.menuItemText}>ĐƠN HÀNG CỦA TÔI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNav('Home')}
              >
                <Text style={styles.menuItemText}>LIÊN HỆ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNav('Home')}
              >
                <Text style={styles.menuItemText}>PHÒNG TRANH 3D</Text>
              </TouchableOpacity>

              {user ? (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNav('Profile')}
                  >
                    <Text style={[styles.menuItemText, { color: '#2563eb' }]}>
                      👤 {user.name || 'TÀI KHOẢN'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={async () => {
                      setMenuVisible(false);
                      await logout();
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>
                      ĐĂNG XUẤT
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNav('Login')}
                >
                  <Text style={[styles.menuItemText, { color: '#e65100', fontWeight: '700' }]}>
                    ĐĂNG NHẬP / ĐĂNG KÝ
                  </Text>
                </TouchableOpacity>
              )}

              {/* Social Media Footer in Drawer */}
              <View style={styles.drawerSocials}>
                <Text style={styles.socialIcon}>📷</Text>
                <Text style={styles.socialIcon}>🐦</Text>
                <Text style={styles.socialIcon}>✉️</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  hamburger: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2.2,
    backgroundColor: '#1e293b',
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    alignItems: 'center',
  },
  roofIcon: {
    width: 24,
    height: 10,
    alignItems: 'center',
    marginBottom: 2,
  },
  roofLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ea580c',
  },
  logoTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#0f172a',
  },
  logoSubtitle: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#ea580c',
    marginTop: -1,
  },
  cartButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cartIconWrapper: {
    alignItems: 'center',
  },
  cartHandle: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderColor: '#ea580c',
    marginBottom: -1,
  },
  cartBag: {
    width: 24,
    height: 22,
    borderWidth: 1.8,
    borderColor: '#ea580c',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
  },
  /* Modal Drawer */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
  },
  overlayBackground: {
    flex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.78,
    backgroundColor: '#ffffff',
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  drawerContent: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 20,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  searchButton: {
    width: 42,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 14,
    color: '#ffffff',
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#334155',
  },
  chevronText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  subMenu: {
    paddingLeft: 14,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 4,
  },
  subMenuItem: {
    paddingVertical: 6,
  },
  subMenuItemText: {
    fontSize: 12,
    color: '#64748b',
    paddingVertical: 3,
  },
  drawerSocials: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 12,
  },
});
