import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyAPuEAIEqZ8ZJ5GSrIwy50iYA4DEOqIG1l",
  authDomain: "lifesyncc-72def.firebaseapp.com", 
  projectId: "lifesyncc-72def",
  storageBucket: "lifesyncc-72def.firebasestorage.app",
  messagingSenderId: "797639674322",
  appId: "1:797639674322:web:1fc0bf6113bed735cee00b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;