import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function ContactScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = () => {
    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    const phonePattern = /^[0-9]{9,11}$/;
    if (!phonePattern.test(form.phone.trim())) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    // Success
    Alert.alert(
      'Thành công',
      'Cảm ơn bạn! Tin nhắn của bạn đã được ghi nhận, chúng tôi sẽ phản hồi sớm.',
      [{ text: 'OK', onPress: () => {
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }}]
    );
  };

  const openDialer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const openMaps = () => {
    const address = '56 Nguyễn Phong Sắc, Dịch Vọng, Cầu Giấy, Hà Nội';
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Ionicons name="mail" size={48} color="#fff" />
        <Text style={styles.heroTitle}>Liên Hệ Với Chúng Tôi</Text>
        <Text style={styles.heroSubtitle}>
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
        </Text>
      </View>

      {/* Contact Info Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông Tin Liên Hệ</Text>

        <TouchableOpacity style={styles.infoCard} onPress={openMaps}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="location" size={24} color="#dc2626" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Địa Chỉ</Text>
            <Text style={styles.infoText}>
              56 Nguyễn Phong Sắc{'\n'}Dịch Vọng, Cầu Giấy{'\n'}Hà Nội, Việt Nam
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={() => openDialer('0948883535')}>
          <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="call" size={24} color="#2563eb" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Điện Thoại</Text>
            <Text style={styles.infoText}>094 888 3535{'\n'}094 886 3535</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={() => openEmail('lanvugallery@gmail.com')}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="mail" size={24} color="#16a34a" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Email</Text>
            <Text style={styles.infoText}>
              lanvugallery@gmail.com{'\n'}support@lanvugallery.com
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time" size={24} color="#f59e0b" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Giờ Làm Việc</Text>
            <Text style={styles.infoText}>Thứ 2 - Chủ Nhật{'\n'}08:00 - 21:00</Text>
          </View>
        </View>
      </View>

      {/* Contact Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Gửi Tin Nhắn</Text>
        <Text style={styles.formDescription}>
          Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Họ và Tên <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên của bạn"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số Điện Thoại <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0948 88 35 35"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chủ Đề</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="bookmark-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <Picker
                selectedValue={form.subject}
                onValueChange={(value) => setForm({ ...form, subject: value })}
                style={styles.picker}
              >
                <Picker.Item label="Chọn chủ đề" value="" />
                <Picker.Item label="Tư vấn mua tranh" value="tuvan" />
                <Picker.Item label="Tư vấn thiết kế" value="thietke" />
                <Picker.Item label="Thông tin triển lãm" value="trienlam" />
                <Picker.Item label="Khác" value="khac" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tin Nhắn <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập tin nhắn của bạn..."
                value={form.message}
                onChangeText={(text) => setForm({ ...form, message: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Gửi Tin Nhắn</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Media */}
      <View style={styles.socialSection}>
        <Text style={styles.sectionTitle}>Theo Dõi Chúng Tôi</Text>
        <View style={styles.socialLinks}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1877f2' }]}>
            <MaterialCommunityIcons name="facebook" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#e4405f' }]}>
            <MaterialCommunityIcons name="instagram" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#ff0000' }]}>
            <MaterialCommunityIcons name="youtube" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#0088cc' }]}>
            <MaterialCommunityIcons name="chat" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    backgroundColor: '#2563eb',
    padding: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  formSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  form: {},
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#1f2937',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingLeft: 12,
  },
  picker: {
    flex: 1,
    height: 48,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  socialSection: {
    padding: 20,
    alignItems: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
