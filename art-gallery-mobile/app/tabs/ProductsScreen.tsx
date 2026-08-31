import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { productService } from '../../services/productService';
import { Product, Category } from '../../types/product';
import ProductCard from '../../components/ProductCard';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Footer from '../../components/Footer';

interface ProductsScreenProps {
  navigation: any;
  route: any;
}

export default function ProductsScreen({ navigation, route }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Handle category filter from navigation params
  useEffect(() => {
    if (route.params?.categoryId) {
      setSelectedCategory(route.params.categoryId);
    }
  }, [route.params?.categoryId]);

  // Filter products when search or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

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
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(p => p.tenDanhMuc && 
        categories.find(c => c.maDanhMuc === selectedCategory)?.tenDanhMuc === p.tenDanhMuc
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.tenTacPham.toLowerCase().includes(query) ||
        p.tenHoaSi.toLowerCase().includes(query) ||
        (p.tenDanhMuc && p.tenDanhMuc.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    // Navigate to Product Detail
    navigation.navigate('ProductDetail', { id: product.maTacPham });
  };

  const handleCategoryPress = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ maDanhMuc: null, tenDanhMuc: 'Tất cả' } as any, ...categories]}
        keyExtractor={(item) => item.maDanhMuc?.toString() || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              (item.maDanhMuc === selectedCategory || (item.maDanhMuc === null && selectedCategory === null)) &&
                styles.filterChipActive,
            ]}
            onPress={() => handleCategoryPress(item.maDanhMuc)}
          >
            <Text
              style={[
                styles.filterChipText,
                (item.maDanhMuc === selectedCategory || (item.maDanhMuc === null && selectedCategory === null)) &&
                  styles.filterChipTextActive,
              ]}
            >
              {item.tenDanhMuc}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  if (isLoading) {
    return <Loading message="Đang tải sản phẩm..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tranh, họa sĩ..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} sản phẩm
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.maTacPham.toString()}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <ProductCard product={item} onPress={() => handleProductPress(item)} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={<Footer navigation={navigation} />}
        ListEmptyComponent={
          <EmptyState
            message="Không tìm thấy sản phẩm"
            description="Thử tìm kiếm với từ khóa khác"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  productItem: {
    marginBottom: 8,
  },
});
