// Context API - Quản lý state toàn cục với API Backend
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CartItem, Artwork } from '../types';
import { artworkService } from '../services/artworkService';
import { cartService } from '../services/cartService';

interface AppContextType {
  // User state
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  
  // Cart state
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  
  // Artworks state
  artworks: Artwork[];
  setArtworks: React.Dispatch<React.SetStateAction<Artwork[]>>;
  
  // Loading state
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Refresh artworks
  refreshArtworks: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load user từ localStorage ngay từ lần render đầu tiên
  // để tránh các trang layout/guard redirect nhầm khi user chưa kịp hydrate.
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser) as User;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Không cần useEffect hydrate user nữa (đã load ngay trong initial state).

  // Load artworks từ API khi app khởi động
  const refreshArtworks = async () => {
    setLoading(true);
    try {
      const data = await artworkService.getAllArtworks();
      setArtworks(data);
      console.log('✅ Đã load', data.length, 'tranh từ API');
    } catch (error) {
      console.error('❌ Lỗi khi load tranh từ API:', error);
      // Fallback: Load từ localStorage nếu API lỗi
      const savedArtworks = localStorage.getItem('admin_artworks');
      if (savedArtworks) {
        try {
          const parsedArtworks = JSON.parse(savedArtworks);
          // Hardcode tạm thời cho Sang Đông
          const hardcodedFallback = parsedArtworks.map((item: any) => 
            item.tenTranh === 'Sang Đông' 
              ? { ...item, anhTranh: '/assets/TrangNgoai/sangdong.webp' } 
              : item
          );
          setArtworks(hardcodedFallback);
          console.log('⚠️ Đã load tranh từ localStorage (fallback)');
        } catch (err) {
          console.error('Error loading artworks from localStorage:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshArtworks();
  }, []);

  // Load cart khi user thay đổi - Đồng bộ với Backend
  useEffect(() => {
    const loadCart = async () => {
      if (user && user.role !== 'admin' && user.role !== 'author') {
        try {
          const serverCart = await cartService.getGioHang();
          setCart(serverCart);
        } catch (error) {
          console.error('Lỗi khi load giỏ hàng từ server:', error);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    };

    loadCart();
  }, [user]);

  const value = {
    user,
    setUser,
    cart,
    setCart,
    artworks,
    setArtworks,
    loading,
    setLoading,
    refreshArtworks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
