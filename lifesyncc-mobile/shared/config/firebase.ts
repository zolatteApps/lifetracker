import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPuEAIEqZ8ZJ5GSrIwy50iYA4DEOqIG1l",
  authDomain: "lifesyncc-72def.firebaseapp.com",
  projectId: "lifesyncc-72def",
  storageBucket: "lifesyncc-72def.firebasestorage.app",
  messagingSenderId: "797639674322",
  appId: "1:797639674322:web:1fc0bf6113bed735cee00b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;