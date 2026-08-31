import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { customerService, ProfileInfo } from '../../services/customerService';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import Footer from '../../components/Footer';
import AppHeader from '../../components/AppHeader';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    ten: '',
    email: '',
    dienThoai: '',
    diaChi: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile();
      } else {
        setIsLoading(false);
        setProfile(null);
      }
    }, [user])
  );

  const loadProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      const profileData = await customerService.getProfile();
      setProfile(profileData);
      setFormData({
        ten: profileData.ten || '',
        email: profileData.email || '',
        dienThoai: profileData.dienThoai || '',
        diaChi: profileData.diaChi || '',
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 401) {
        setProfile(null);
      } else {
        setError(err.message || 'Không thể tải thông tin cá nhân');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!profile) return;
    setFormData({
      ten: profile.ten || '',
      email: profile.email || '',
      dienThoai: profile.dienThoai || '',
      diaChi: profile.diaChi || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.ten.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    if (!formData.dienThoai.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    try {
      setIsSaving(true);
      await customerService.updateProfile({
        ten: formData.ten.trim(),
        email: formData.email.trim() || undefined,
        dienThoai: formData.dienThoai.trim(),
        diaChi: formData.diaChi.trim() || undefined,
      });
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      await loadProfile();
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể đăng xuất');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>👤</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' }}>
            Bạn chưa đăng nhập
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Đăng nhập ngay để quản lý thông tin cá nhân, xem lịch sử đơn hàng và lưu danh sách tác phẩm yêu thích.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#ea580c', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <Loading message="Đang tải thông tin..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <ErrorMessage message={error} onRetry={loadProfile} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.ten?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{profile?.ten || 'Người dùng'}</Text>
        <Text style={styles.userRole}>Khách hàng</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          {!isEditing && (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Họ tên */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.ten}
            onChangeText={(text) => setFormData({ ...formData, ten: text })}
            editable={isEditing}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={isEditing}
          />
        </View>

        {/* Số điện thoại */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={formData.dienThoai}
            onChangeText={(text) => setFormData({ ...formData, dienThoai: text })}
            keyboardType="phone-pad"
            editable={isEditing}
          />
        </View>

        {/* Địa chỉ */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              !isEditing && styles.inputDisabled,
            ]}
            value={formData.diaChi}
            onChangeText={(text) => setFormData({ ...formData, diaChi: text })}
            multiline
            numberOfLines={3}
            editable={isEditing}
          />
        </View>

        {/* Edit Actions */}
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tài khoản:</Text>
          <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vai trò:</Text>
          <Text style={styles.infoValue}>
            {user?.role === 'user' ? 'Khách hàng' : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Favorites')}>
          <Text style={styles.actionButtonText}>❤️ Tác phẩm yêu thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.actionButtonText}>📝 Đổi mật khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Trợ giúp', 'Liên hệ hotline: 0988 777 888 để được hỗ trợ')}>
          <Text style={styles.actionButtonText}>❓ Trợ giúp</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Footer navigation={navigation} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  logoutButton: {
    margin: 16,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 24,
  },
});
