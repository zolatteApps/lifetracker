import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth.service';

const COUNTRY_CODES = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
];

export const PhoneLoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on selected country
    if (selectedCountry.code === '+91') {
      // Indian format: XXXXX-XXXXX
      if (cleaned.length <= 5) {
        return cleaned;
      } else {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`;
      }
    } else if (selectedCountry.code === '+1') {
      // US/Canada format: XXX-XXX-XXXX
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    } else {
      // For other countries, just limit to 10-15 digits without formatting
      return cleaned.slice(0, 15);
    }
  };

  const handleSendOTP = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!cleanedPhone || cleanedPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${cleanedPhone}`;

    console.log('Sending OTP to:', fullPhoneNumber);

    try {
      setLoading(true);
      await authService.sendOTP(fullPhoneNumber);
      
      // Navigate to OTP verification screen
      navigation.navigate('VerifyOTP', { phoneNumber: fullPhoneNumber });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Phone Login</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity 
                style={styles.countryCodeButton}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryCodeText}>{selectedCountry.flag} {selectedCountry.code}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="123-456-7890"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                editable={!loading}
                maxLength={12}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemText}>
                    {item.flag} {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  countryCodeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  emailButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  emailButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  linkText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  countryItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
});