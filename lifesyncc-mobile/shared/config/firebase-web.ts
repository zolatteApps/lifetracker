// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;