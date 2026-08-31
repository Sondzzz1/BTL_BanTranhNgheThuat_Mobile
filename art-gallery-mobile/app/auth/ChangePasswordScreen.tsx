import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { authService } from '../../services/authService';
import Colors from '../../constants/colors';

interface ChangePasswordScreenProps {
  navigation: any;
}

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ các trường thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu mới và mật khẩu xác nhận không trùng khớp');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.changePassword(oldPassword, newPassword);
      if (res.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Đổi mật khẩu</Text>
      <Text style={styles.subtitle}>
        Để bảo vệ tài khoản, vui lòng chọn mật khẩu mạnh và không chia sẻ cho người khác.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mật khẩu hiện tại</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Nhập mật khẩu hiện tại"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.white,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: Colors.backgroundLight,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
