import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from './app/auth/LoginScreen';
import RegisterScreen from './app/auth/RegisterScreen';
import HomeScreen from './app/tabs/HomeScreen';
import ProductsScreen from './app/tabs/ProductsScreen';
import CartScreen from './app/tabs/CartScreen';
import OrdersScreen from './app/tabs/OrdersScreen';
import ProfileScreen from './app/tabs/ProfileScreen';
import ProductDetailScreen from './app/products/ProductDetailScreen';
import CheckoutScreen from './app/CheckoutScreen';
import OrderSuccessScreen from './app/OrderSuccessScreen';
import OrderDetailScreen from './app/orders/OrderDetailScreen';
import FavoritesScreen from './app/tabs/FavoritesScreen';
import ChangePasswordScreen from './app/auth/ChangePasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs - Màn hình chính
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ title: 'Sản phẩm' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Giỏ hàng' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ title: 'Đơn hàng' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator - Bao gồm cả tabs, login/register và detail screens
function MainStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainTabs">
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Đăng nhập' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Đăng ký tài khoản' }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Chi tiết sản phẩm' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Thanh toán' }}
      />
      <Stack.Screen 
        name="OrderSuccess" 
        component={OrderSuccessScreen}
        options={{ 
          title: 'Đặt hàng thành công',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Chi tiết đơn hàng' }}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ title: 'Tác phẩm yêu thích' }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ title: 'Đổi mật khẩu' }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator - Khởi chạy thẳng vào Trang chủ (MainTabs)
function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return <MainStackNavigator />;
}

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
