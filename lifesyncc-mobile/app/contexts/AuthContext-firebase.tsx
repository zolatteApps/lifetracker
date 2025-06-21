import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../shared/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastActive: Date;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user document
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          let userData: User;
          if (userDoc.exists()) {
            userData = { ...userDoc.data(), id: firebaseUser.uid } as User;
            // Update last active
            await setDoc(doc(db, 'users', firebaseUser.uid), 
              { ...userData, lastActive: new Date() }, 
              { merge: true }
            );
          } else {
            // Create new user document
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date(),
              lastActive: new Date(),
              role: 'user'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          }
          
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error handling user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by the auth state listener
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const userData: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: displayName,
        photoURL: undefined,
        createdAt: new Date(),
        lastActive: new Date(),
        role: 'user'
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // User state will be updated by the auth state listener
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be updated by the auth state listener
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Will implement later
    console.log('Reset password for:', email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};