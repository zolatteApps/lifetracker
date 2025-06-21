import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../shared/config/firebase-native';

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up Firebase Auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'no user');
      
      if (firebaseUser) {
        try {
          // Get user document from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: userData.displayName,
              createdAt: userData.createdAt?.toDate() || new Date(),
              role: userData.role || 'user'
            };
            setUser(user);
            console.log('User loaded from Firestore:', user.email);
          } else {
            console.log('User document not found in Firestore');
            // Create a basic user object for display
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || undefined,
              createdAt: new Date(),
              role: 'user'
            };
            setUser(user);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Still set basic user data even if Firestore fails
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            createdAt: new Date(),
            role: 'user'
          };
          setUser(user);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      console.log('Attempting sign up for:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      try {
        const userDoc = {
          email: result.user.email,
          displayName: displayName || null,
          role: 'user',
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          deviceInfo: 'React Native Development Build'
        };

        await setDoc(doc(db, 'users', result.user.uid), userDoc);
        console.log('User document created in Firestore');
      } catch (firestoreError) {
        console.error('Error creating user document:', firestoreError);
        // Continue anyway - user is still created in Auth
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log('Sign out successful');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    console.log('Reset password requested for:', email);
    // Will implement later with sendPasswordResetEmail
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};