import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
// For React Native, we need to import from the specific bundle
import 'firebase/auth/react-native';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBt9mU-j9vbXHJzfWfPhF96D6Q8eQHhItU",
  authDomain: "lifesync-42bfd.firebaseapp.com",
  projectId: "lifesync-42bfd",
  storageBucket: "lifesync-42bfd.firebasestorage.app",
  messagingSenderId: "878076493896",
  appId: "1:878076493896:web:38f8bbf2c6acf0d3b07fad"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Platform-specific Firebase initialization
let auth;

if (Platform.OS === 'web') {
  // Web Firebase SDK - use standard auth
  auth = getAuth(app);
  
  // For debugging in development
  if (__DEV__) {
    console.log('Firebase Web SDK initialized for Expo Web');
  }

} else {
  // React Native Firebase SDK - use auth with AsyncStorage persistence
  try {
    // Import AsyncStorage only for React Native
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app);
  }

  // For debugging in development
  if (__DEV__) {
    console.log('Firebase React Native SDK initialized for mobile');
  }
}

// Initialize other services (same for both platforms)
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };

export default firebaseConfig;