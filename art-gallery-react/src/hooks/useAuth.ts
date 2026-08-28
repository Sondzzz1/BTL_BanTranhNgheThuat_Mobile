// Custom Hook cho Authentication - Kết nối với Backend API
import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, setUser } = useAppContext();

  // Login function - throw error để UI tự xử lý hiển thị
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await authService.login(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  }, [setUser]);

  // Logout function
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, [setUser]);

  // Register function - throw error để UI tự xử lý hiển thị
  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone: string,
    address?: string,
    vaiTro: number = 1
  ): Promise<boolean> => {
    const newUser = await authService.register(email, password, name, phone, address, vaiTro);
    setUser(newUser);
    return true;
  }, [setUser]);

  // Đổi mật khẩu
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      return authService.changePassword(currentPassword, newPassword);
    },
    []
  );

  return {
    user,
    setUser,
    login,
    logout,
    register,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAuthor: user?.role === 'author',
  };
};
