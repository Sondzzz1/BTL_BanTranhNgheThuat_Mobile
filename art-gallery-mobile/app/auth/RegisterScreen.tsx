import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    tenDangNhap: '',
    matKhau: '',
    matKhauXacNhan: '',
    ten: '',
    email: '',
    dienThoai: '',
    diaChi: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.tenDangNhap.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập');
      return false;
    }

    if (formData.tenDangNhap.length < 3) {
      Alert.alert('Lỗi', 'Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }

    if (!formData.matKhau.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return false;
    }

    if (formData.matKhau.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.matKhau !== formData.matKhauXacNhan) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }

    if (!formData.ten.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return false;
    }

    if (!formData.dienThoai.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }

    // Validate phone number (simple check)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.dienThoai.trim())) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (10-11 số)');
      return false;
    }

    // Validate email if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert('Lỗi', 'Email không hợp lệ');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await register(
        formData.tenDangNhap.trim(),
        formData.matKhau,
        formData.ten.trim(),
        formData.dienThoai.trim(),
        formData.email.trim() || undefined,
        formData.diaChi.trim() || undefined
      );
      // Navigation sẽ tự động chuyển sang MainTabs do AuthContext
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert(
        'Đăng ký thất bại',
        error.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới để mua tranh</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Tên đăng nhập */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên đăng nhập *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên đăng nhập"
              value={formData.tenDangNhap}
              onChangeText={(value) => handleInputChange('tenDangNhap', value)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              value={formData.matKhau}
              onChangeText={(value) => handleInputChange('matKhau', value)}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Xác nhận mật khẩu */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Xác nhận mật khẩu *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu"
              value={formData.matKhauXacNhan}
              onChangeText={(value) => handleInputChange('matKhauXacNhan', value)}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Họ tên */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              value={formData.ten}
              onChangeText={(value) => handleInputChange('ten', value)}
              editable={!isLoading}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email (không bắt buộc)"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại (10-11 số)"
              value={formData.dienThoai}
              onChangeText={(value) => handleInputChange('dienThoai', value)}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          {/* Địa chỉ */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập địa chỉ (không bắt buộc)"
              value={formData.diaChi}
              onChangeText={(value) => handleInputChange('diaChi', value)}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  form: {
    marginBottom: 24,
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
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
});
