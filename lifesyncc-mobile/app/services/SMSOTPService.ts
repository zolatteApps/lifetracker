import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid, EmitterSubscription } from 'react-native';

interface OTPEvent {
  otp: string;
  sender: string;
  message: string;
}

class SMSOTPService {
  private nativeModule: any;
  private eventEmitter: NativeEventEmitter | null = null;
  private subscription: EmitterSubscription | null = null;

  constructor() {
    if (Platform.OS === 'android') {
      this.nativeModule = NativeModules.SMSOTPModule;
      if (this.nativeModule) {
        this.eventEmitter = new NativeEventEmitter(this.nativeModule);
      }
    }
  }

  async requestSMSPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);

      return (
        granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('SMS permission error:', err);
      return false;
    }
  }

  async startListening(onOTPReceived: (event: OTPEvent) => void): Promise<boolean> {
    console.log('[SMSOTPService] startListening called');
    
    if (Platform.OS !== 'android') {
      console.log('[SMSOTPService] Not Android platform');
      return false;
    }
    
    if (!this.nativeModule) {
      console.error('[SMSOTPService] Native module not found');
      return false;
    }

    try {
      console.log('[SMSOTPService] Calling native startListeningForOTP...');
      // Request permission and start listening
      const result = await this.nativeModule.startListeningForOTP();
      console.log('[SMSOTPService] Native module returned:', result);
      
      if (result && this.eventEmitter) {
        console.log('[SMSOTPService] Setting up event listener for onOTPReceived');
        // Remove any existing subscription
        if (this.subscription) {
          this.subscription.remove();
        }
        
        // Subscribe to OTP events
        this.subscription = this.eventEmitter.addListener('onOTPReceived', (event) => {
          console.log('[SMSOTPService] onOTPReceived event triggered:', event);
          onOTPReceived(event);
        });
        
        console.log('[SMSOTPService] Event listener set up successfully');
      } else {
        console.log('[SMSOTPService] Failed to set up event listener - result:', result, 'eventEmitter:', !!this.eventEmitter);
      }
      
      return result;
    } catch (error) {
      console.error('[SMSOTPService] Failed to start OTP listening:', error);
      return false;
    }
  }

  stopListening() {
    if (Platform.OS !== 'android' || !this.nativeModule) {
      return;
    }

    // Remove event subscription
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    // Stop native listener
    try {
      this.nativeModule.stopListeningForOTP();
    } catch (error) {
      console.error('Failed to stop OTP listening:', error);
    }
  }

  extractOTPFromMessage(message: string): string | null {
    // Common OTP patterns
    const patterns = [
      /\b\d{6}\b/,                    // 6 digits
      /OTP.*?(\d{6})/i,               // OTP: 123456
      /code.*?(\d{6})/i,              // code: 123456
      /verification.*?(\d{6})/i,      // verification code: 123456
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }
}

export default new SMSOTPService();