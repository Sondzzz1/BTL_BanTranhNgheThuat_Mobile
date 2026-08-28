// App.tsx - React Router và Layout chính
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ChangePassword from './pages/ChangePassword';
import TestPage from './pages/TestPage';
import ApiTest from './pages/ApiTest';
import TestAuth from './pages/TestAuth';
import News from './pages/News';
import Contact from './pages/Contact';
import About from './pages/About';
import Artworks from './pages/Artworks';
import ArtworkDetail from './pages/ArtworkDetail';
import Register from './pages/Register';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminHome from './pages/Admin/AdminHome';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminArt from './pages/Admin/AdminArt';
import AdminCustomers from './pages/Admin/AdminCustomers';
import AdminReport from './pages/Admin/AdminReport';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminContent from './pages/Admin/AdminContent';
import AdminAuthors from './pages/Admin/AdminAuthors';
import AdminProfile from './pages/Admin/AdminProfile';
import AdminArtworkDetails from './pages/Admin/AdminArtworkDetails';
import AdminArtistArtworks from './pages/Admin/AdminArtistArtworks';

import AdminAuthorRevenue from './pages/Admin/AdminAuthorRevenue';
import AdminApiTest from './pages/Admin/AdminApiTest';
import TestEditsAPI from './pages/Admin/TestEditsAPI';
import ArtistLayout from './pages/Artist/ArtistLayout';
import ArtistDashboard from './pages/Artist/ArtistDashboard';
import ArtistProfile from './pages/Artist/ArtistProfile';
import ArtistArtworks from './pages/Artist/ArtistArtworks';
import ArtistDeletedArtworks from './pages/Artist/ArtistDeletedArtworks';
import ArtworkDetailManagement from './pages/Artist/ArtworkDetailManagement';
import ArtworkDetailContent from './pages/Artist/ArtworkDetailContent';
import ArtistArticles from './pages/Artist/ArtistArticles';
import ArtistRevenue from './pages/Artist/ArtistRevenue';
import UserLayout from './pages/User/UserLayout';
import UserProfile from './pages/User/UserProfile';
import UserOrders from './pages/User/UserOrders';
import UserOrderDetail from './pages/User/UserOrderDetail';
import UserFavorites from './pages/User/UserFavorites';
import FavoriteTest from './pages/FavoriteTest';
import ScrollToTop from './components/ScrollToTop';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <Routes>
            {/* Test Route */}
            <Route path="/test" element={<TestPage />} />
            <Route path="/api-test" element={<ApiTest />} />
            <Route path="/test-auth" element={<TestAuth />} />
            <Route path="/favorite-test" element={<FavoriteTest />} />
            
            {/* Public Routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/artworks" element={<Layout><Artworks /></Layout>} />
            <Route path="/artworks/:id" element={<Layout><ArtworkDetail /></Layout>} />
            <Route path="/news" element={<Layout><News /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/change-password" element={<Layout><ChangePassword /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/checkout" element={<Layout><Checkout /></Layout>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="art" element={<AdminArt />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="report" element={<AdminReport />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="artwork-details" element={<AdminArtworkDetails />} />
              <Route path="authors" element={<AdminAuthors />} />
              <Route path="authors/:id/artworks" element={<AdminArtistArtworks />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="revenue" element={<AdminAuthorRevenue />} />
              <Route path="api-test" element={<AdminApiTest />} />
              <Route path="test-edits" element={<TestEditsAPI />} />
            </Route>

            {/* Artist Routes */}
            <Route path="/artist" element={<ArtistLayout />}>
              <Route index element={<ArtistDashboard />} />
              <Route path="profile" element={<ArtistProfile />} />
              <Route path="artworks" element={<ArtistArtworks />} />
              <Route path="artworks/deleted" element={<ArtistDeletedArtworks />} />
              <Route path="artworks/:id" element={<ArtworkDetailManagement />} />
              <Route path="artworks/:id/content" element={<ArtworkDetailContent />} />
              <Route path="articles" element={<ArtistArticles />} />
              <Route path="revenue" element={<ArtistRevenue />} />
              <Route path="sales" element={<PlaceholderPage title="Báo Cáo Bán Hàng" />} />
            </Route>

            {/* User Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserProfile />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="orders" element={<UserOrders />} />
              <Route path="orders/:id" element={<UserOrderDetail />} />
              <Route path="favorites" element={<UserFavorites />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
