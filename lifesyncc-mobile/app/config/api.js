import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment configuration
const USE_LOCAL_API = false; // Set to false to use production API
const LOCAL_IP = '192.168.66.119'; // Update with your computer's IP
const LOCAL_API_URL = `http://${LOCAL_IP}:5000`;
const PRODUCTION_API_URL = 'https://lifetracker-ten.vercel.app';

const getApiUrl = () => {
  if (__DEV__) {
    return USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;
  }
  return PRODUCTION_API_URL;
};

export const API_URL = getApiUrl();

export const ENVIRONMENT = {
  isLocal: USE_LOCAL_API && __DEV__,
  apiUrl: getApiUrl(),
};

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    user: '/api/auth/user',
    updateProfile: '/api/auth/update-profile',
    sendOTP: '/api/auth/send-otp',
    verifyOTP: '/api/auth/verify-otp',
  },
};