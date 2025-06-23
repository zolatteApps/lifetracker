import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApiUrl } from './environment';

export const API_URL = getApiUrl();
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    user: '/api/auth/user',
    sendOTP: '/api/auth/send-otp',
    verifyOTP: '/api/auth/verify-otp',
  },
};