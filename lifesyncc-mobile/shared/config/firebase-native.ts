import { initializeApp, getApps } from 'firebase/app';
// For React Native, we need to import from the specific bundle
import 'firebase/auth/react-native';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
  console.log('Firebase Auth already initialized, using existing instance');
}

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };

// For debugging in development
if (__DEV__) {
  console.log('Firebase React Native SDK initialized for development build');
  console.log('Project ID:', firebaseConfig.projectId);
}

export default firebaseConfig;