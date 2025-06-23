import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext-mongodb';
import { authService } from '../../services/auth.service';

export const VerifyOTPScreen: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { signInWithPhone } = useAuth();
  
  const phoneNumber = route.params?.phoneNumber || '';

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedCode.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last input or next empty input
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      // Auto submit if complete
      if (pastedCode.length === 6) {
        handleVerifyOTP(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all digits are entered
    if (index === 5 && value) {
      const otpCode = newOtp.join('');
      if (otpCode.length === 6) {
        handleVerifyOTP(otpCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    console.log('Verifying OTP:', code, 'for phone:', phoneNumber);

    try {
      setLoading(true);
      await signInWithPhone(phoneNumber, code);
      // Navigation will happen automatically via AuthContext
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      await authService.sendOTP(phoneNumber);
      
      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      
      Alert.alert('Success', 'A new OTP has been sent to your phone');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Display the full international number with proper formatting
    if (phone.startsWith('+91')) {
      // Indian number format: +91 12345-67890
      const withoutCode = phone.substring(3);
      if (withoutCode.length === 10) {
        return `+91 ${withoutCode.substring(0, 5)}-${withoutCode.substring(5)}`;
      }
    } else if (phone.startsWith('+1')) {
      // US/Canada format: +1 (123) 456-7890
      const withoutCode = phone.substring(2);
      if (withoutCode.length === 10) {
        return `+1 (${withoutCode.substring(0, 3)}) ${withoutCode.substring(3, 6)}-${withoutCode.substring(6)}`;
      }
    } else if (phone.startsWith('+44')) {
      // UK format: +44 1234 567890
      const withoutCode = phone.substring(3);
      return `+44 ${withoutCode.substring(0, 4)} ${withoutCode.substring(4)}`;
    }
    
    // For other countries or unknown formats, just display as is with spaces
    if (phone.startsWith('+')) {
      // Try to format as: +XX XXXXX XXXXX
      const match = phone.match(/^(\+\d{1,3})(\d{5})(\d+)$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    
    return phone; // Return as-is if no formatting rules match
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
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneNumber}>{formatPhoneDisplay(phoneNumber)}</Text>
          <Text style={styles.phoneNumberNote}>
            (Check SMS on this number)
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend || loading}
            >
              <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changeNumberButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.changeNumberText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  phoneNumberNote: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: '#6b7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#9ca3af',
  },
  changeNumberButton: {
    alignItems: 'center',
    padding: 12,
  },
  changeNumberText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
  },
});