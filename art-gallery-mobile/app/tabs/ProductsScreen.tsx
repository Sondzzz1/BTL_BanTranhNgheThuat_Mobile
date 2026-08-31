import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { productService } from '../../services/productService';
import { favoriteService } from '../../services/favoriteService';
import { useAuth } from '../../context/AuthContext';
import { Product, Category } from '../../types/product';
import ProductCard from '../../components/ProductCard';
import AppHeader from '../../components/AppHeader';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';

const { width } = Dimensions.get('window');
const COLUMN_SPACING = 12;
const CARD_WIDTH = (width - 32 - COLUMN_SPACING) / 2;

interface ProductsScreenProps {
  navigation: any;
  route: any;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export default function ProductsScreen({ navigation, route }: ProductsScreenProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'category' | 'artist' | 'size' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle route params
  useEffect(() => {
    if (route.params?.categoryId) {
      setSelectedCategory(route.params.categoryId);
    }
    if (route.params?.search) {
      // If search query is passed from AppHeader
      handleSearchParam(route.params.search);
    }
  }, [route.params?.categoryId, route.params?.search]);

  const handleSearchParam = (query: string) => {
    // handled in filtered list
  };

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories(),
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);

      if (user) {
        try {
          const favs = await favoriteService.getFavorites();
          const ids = new Set(favs.map(f => f.tacPham.maTacPham));
          setFavoriteIds(ids);
        } catch {
          // ignore favorite loading error
        }
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (product: Product) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    const isFav = favoriteIds.has(product.maTacPham);
    try {
      if (isFav) {
        await favoriteService.removeFavorite(product.maTacPham);
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(product.maTacPham);
          return next;
        });
      } else {
        await favoriteService.addFavorite(product.maTacPham);
        setFavoriteIds(prev => new Set(prev).add(product.maTacPham));
      }
    } catch (e: any) {
      console.warn('Favorite toggle error:', e.message);
    }
  };

  // Extract unique artists for filter
  const artists = useMemo(() => {
    const list: string[] = [];
    products.forEach(p => {
      if (p.tenHoaSi && !list.includes(p.tenHoaSi)) {
        list.push(p.tenHoaSi);
      }
    });
    return list;
  }, [products]);

  // Filter and Sort Products
  const displayedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory) {
      const catObj = categories.find(c => c.maDanhMuc === selectedCategory);
      if (catObj) {
        result = result.filter(p => p.tenDanhMuc === catObj.tenDanhMuc);
      }
    }

    // Filter by Artist
    if (selectedArtist) {
      result = result.filter(p => p.tenHoaSi === selectedArtist);
    }

    // Filter by Search Query from route
    if (route.params?.search) {
      const q = route.params.search.toLowerCase().trim();
      result = result.filter(
        p =>
          p.tenTacPham.toLowerCase().includes(q) ||
          p.tenHoaSi.toLowerCase().includes(q) ||
          (p.tenDanhMuc && p.tenDanhMuc.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => b.maTacPham - a.maTacPham);
        break;
      case 'price_asc':
        result.sort((a, b) => a.gia - b.gia);
        break;
      case 'price_desc':
        result.sort((a, b) => b.gia - a.gia);
        break;
      case 'name_asc':
        result.sort((a, b) => a.tenTacPham.localeCompare(b.tenTacPham));
        break;
    }

    return result;
  }, [products, categories, selectedCategory, selectedArtist, sortOption, route.params?.search]);

  // Recently viewed preview (first 3 artworks)
  const recentlyViewed = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Sắp xếp mới nhất';
      case 'price_asc': return 'Giá: Thấp đến cao';
      case 'price_desc': return 'Giá: Cao đến thấp';
      case 'name_asc': return 'Tên: A - Z';
      default: return 'Sắp xếp mới nhất';
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedArtist(null);
    setSelectedSize(null);
    setFilterModalVisible(false);
  };

  if (isLoading && !refreshing) {
    return <Loading message="Đang tải danh sách tác phẩm..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <View style={styles.container}>
      {/* 1. Header with Logo & Cart */}
      <AppHeader navigation={navigation} />

      {/* 2. Top Title & Filter / Sort Toolbar */}
      <View style={styles.topToolbarContainer}>
        <Text style={styles.pageTitle}>Tác phẩm</Text>

        <View style={styles.toolbarRow}>
          {/* LỌC Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterIconText}>🎛️</Text>
            <Text style={styles.filterButtonText}>LỌC</Text>
          </TouchableOpacity>

          {/* Sắp xếp Dropdown Trigger */}
          <TouchableOpacity
            style={styles.sortDropdownButton}
            onPress={() => setSortMenuVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.sortDropdownText} numberOfLines={1}>
              {getSortLabel()}
            </Text>
            <Text style={styles.sortDropdownChevron}>∨</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Products 2-Column Grid */}
      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.maTacPham.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { id: item.maTacPham })}
              isFavorite={favoriteIds.has(item.maTacPham)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          </View>
        )}
        ListFooterComponent={<Footer navigation={navigation} />}
        ListEmptyComponent={
          <EmptyState
            title="Không tìm thấy tác phẩm"
            message="Không có tác phẩm nào phù hợp với bộ lọc hiện tại."
            actionText="Xem tất cả"
            onAction={handleResetFilters}
          />
        }
      />

      {/* Sort Option Modal */}
      <Modal
        visible={sortMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.sortModalOverlay}
          activeOpacity={1}
          onPress={() => setSortMenuVisible(false)}
        >
          <View style={styles.sortModalBox}>
            <Text style={styles.sortModalTitle}>SẮP XẾP THEO</Text>
            <TouchableOpacity
              style={[styles.sortOptionItem, sortOption === 'newest' && styles.sortOptionItemActive]}
              onPress={() => { setSortOption('newest'); setSortMenuVisible(false); }}
            >
              <Text style={[styles.sortOptionText, sortOption === 'newest' && styles.sortOptionTextActive]}>
                • Sắp xếp mới nhất
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOptionItem, sortOption === 'price_asc' && styles.sortOptionItemActive]}
              onPress={() => { setSortOption('price_asc'); setSortMenuVisible(false); }}
            >
              <Text style={[styles.sortOptionText, sortOption === 'price_asc' && styles.sortOptionTextActive]}>
                • Giá: Thấp đến cao
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOptionItem, sortOption === 'price_desc' && styles.sortOptionItemActive]}
              onPress={() => { setSortOption('price_desc'); setSortMenuVisible(false); }}
            >
              <Text style={[styles.sortOptionText, sortOption === 'price_desc' && styles.sortOptionTextActive]}>
                • Giá: Cao đến thấp
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOptionItem, sortOption === 'name_asc' && styles.sortOptionItemActive]}
              onPress={() => { setSortOption('name_asc'); setSortMenuVisible(false); }}
            >
              <Text style={[styles.sortOptionText, sortOption === 'name_asc' && styles.sortOptionTextActive]}>
                • Tên tác phẩm: A - Z
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 4. Filter Drawer / Sidebar Modal (Matching Image 4) */}
      <Modal
        visible={filterModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity
            style={styles.filterOverlayBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />

          <View style={styles.filterDrawerContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.filterCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.filterCloseText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterDrawerScroll}>
              {/* Dropdown 1: Chuyên mục */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Chuyên mục</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {selectedCategory
                      ? categories.find(c => c.maDanhMuc === selectedCategory)?.tenDanhMuc
                      : '- Chọn Chuyên mục -'}
                  </Text>
                  <Text style={styles.selectBoxChevron}>∨</Text>
                </TouchableOpacity>

                {openDropdown === 'category' && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedCategory(null); setOpenDropdown(null); }}
                    >
                      <Text style={[styles.dropdownOptionText, !selectedCategory && styles.dropdownOptionSelected]}>
                        Tất cả chuyên mục
                      </Text>
                    </TouchableOpacity>
                    {categories.map(c => (
                      <TouchableOpacity
                        key={c.maDanhMuc}
                        style={styles.dropdownOption}
                        onPress={() => { setSelectedCategory(c.maDanhMuc); setOpenDropdown(null); }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedCategory === c.maDanhMuc && styles.dropdownOptionSelected,
                          ]}
                        >
                          {c.tenDanhMuc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Dropdown 2: Họa sĩ */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Họa sĩ</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setOpenDropdown(openDropdown === 'artist' ? null : 'artist')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {selectedArtist ? selectedArtist : '- Chọn Họa sĩ -'}
                  </Text>
                  <Text style={styles.selectBoxChevron}>∨</Text>
                </TouchableOpacity>

                {openDropdown === 'artist' && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedArtist(null); setOpenDropdown(null); }}
                    >
                      <Text style={[styles.dropdownOptionText, !selectedArtist && styles.dropdownOptionSelected]}>
                        Tất cả họa sĩ
                      </Text>
                    </TouchableOpacity>
                    {artists.map(name => (
                      <TouchableOpacity
                        key={name}
                        style={styles.dropdownOption}
                        onPress={() => { setSelectedArtist(name); setOpenDropdown(null); }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedArtist === name && styles.dropdownOptionSelected,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Dropdown 3: Kích thước */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Kích thước</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setOpenDropdown(openDropdown === 'size' ? null : 'size')}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {selectedSize ? selectedSize : '- Chọn Kích thước -'}
                  </Text>
                  <Text style={styles.selectBoxChevron}>∨</Text>
                </TouchableOpacity>

                {openDropdown === 'size' && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedSize(null); setOpenDropdown(null); }}
                    >
                      <Text style={styles.dropdownOptionText}>- Tất cả kích thước -</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedSize('Nhỏ (< 60cm)'); setOpenDropdown(null); }}
                    >
                      <Text style={styles.dropdownOptionText}>Nhỏ (&lt; 60cm)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedSize('Vừa (60 - 120cm)'); setOpenDropdown(null); }}
                    >
                      <Text style={styles.dropdownOptionText}>Vừa (60 - 120cm)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => { setSelectedSize('Lớn (> 120cm)'); setOpenDropdown(null); }}
                    >
                      <Text style={styles.dropdownOptionText}>Lớn (&gt; 120cm)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Section: SẢN PHẨM VỪA XEM */}
              <View style={styles.recentSection}>
                <Text style={styles.recentSectionTitle}>SẢN PHẨM VỪA XEM</Text>
                <View style={styles.recentSectionUnderline} />

                {recentlyViewed.map(item => (
                  <TouchableOpacity
                    key={item.maTacPham}
                    style={styles.recentItemRow}
                    onPress={() => {
                      setFilterModalVisible(false);
                      navigation.navigate('ProductDetail', { id: item.maTacPham });
                    }}
                  >
                    <View style={styles.recentThumbBox}>
                      {item.hinhAnh ? (
                        <Image source={{ uri: item.hinhAnh }} style={styles.recentThumb} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 18 }}>🖼️</Text>
                      )}
                    </View>
                    <Text style={styles.recentItemTitle} numberOfLines={2}>
                      {item.tenTacPham}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.filterActionRow}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetFilters}
                >
                  <Text style={styles.resetButtonText}>Đặt lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topToolbarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterIconText: {
    fontSize: 16,
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 1,
  },
  sortDropdownButton: {
    flex: 1,
    maxWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  sortDropdownText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    marginRight: 4,
  },
  sortDropdownChevron: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  /* Sort Modal Box */
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sortModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  sortOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sortOptionItemActive: {
    backgroundColor: '#fff7ed',
  },
  sortOptionText: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#ea580c',
    fontWeight: '700',
  },
  /* Filter Drawer */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
  },
  filterOverlayBackdrop: {
    flex: 1,
  },
  filterDrawerContainer: {
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
  filterCloseButton: {
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
  filterCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  filterDrawerScroll: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  filterGroup: {
    marginBottom: 18,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#ffffff',
  },
  selectBoxText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  selectBoxChevron: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionText: {
    fontSize: 12.5,
    color: '#334155',
  },
  dropdownOptionSelected: {
    color: '#ea580c',
    fontWeight: '700',
  },
  /* Recently Viewed Section */
  recentSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  recentSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#0f172a',
    marginBottom: 4,
  },
  recentSectionUnderline: {
    width: 30,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 12,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentThumbBox: {
    width: 46,
    height: 46,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  recentThumb: {
    width: '100%',
    height: '100%',
  },
  recentItemTitle: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#ea580c',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
});
