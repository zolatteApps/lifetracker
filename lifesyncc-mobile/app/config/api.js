import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Your computer's IP address
  const YOUR_IP = '192.168.1.4';
  
  // For Expo Go, always use your computer's IP address
  if (__DEV__) {
    return `http://${YOUR_IP}:5000`;
  } else {
    // Production URL
    return 'https://your-production-api.com';
  }
};

export const API_URL = getApiUrl();
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    user: '/api/auth/user',
  },
};