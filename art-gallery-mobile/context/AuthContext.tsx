import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedCallback } from '../services/api';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (tenDangNhap: string, matKhau: string) => Promise<void>;
  register: (
    tenDangNhap: string,
    matKhau: string,
    ten: string,
    dienThoai: string,
    email?: string,
    diaChi?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user từ AsyncStorage khi app khởi động và lắng nghe 401
  useEffect(() => {
    setUnauthorizedCallback(() => {
      setUser(null);
    });

    loadUser();

    return () => {
      setUnauthorizedCallback(null);
    };
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (tenDangNhap: string, matKhau: string) => {
    try {
      const loggedInUser = await authService.login(tenDangNhap, matKhau);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  const register = async (
    tenDangNhap: string,
    matKhau: string,
    ten: string,
    dienThoai: string,
    email?: string,
    diaChi?: string
  ) => {
    try {
      const registeredUser = await authService.register(
        tenDangNhap,
        matKhau,
        ten,
        dienThoai,
        email,
        diaChi
      );
      setUser(registeredUser);
    } catch (error) {
      console.error('Register error in context:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error in context:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook để sử dụng AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
