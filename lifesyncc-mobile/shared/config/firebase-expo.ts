import { initializeApp, getApps } from 'firebase/app';
// For React Native, we need to import from the specific bundle
import 'firebase/auth/react-native';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPuEAIEqZ8ZJ5GSrIwy50iYA4DEOqIG1l",
  authDomain: "lifesyncc-72def.firebaseapp.com",
  projectId: "lifesyncc-72def",
  storageBucket: "lifesyncc-72def.firebasestorage.app",
  messagingSenderId: "797639674322",
  appId: "1:797639674322:web:1fc0bf6113bed735cee00b"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
export const db = getFirestore(app);
export { auth };
export default app;