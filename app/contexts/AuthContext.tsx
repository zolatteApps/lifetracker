import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../shared/types';
import { AuthService } from '../../shared/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Listen to auth state changes
    const unsubscribe = AuthService.onAuthStateChange(async (user) => {
      setUser(user);
      
      // Store user data locally for offline access
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = await AuthService.signIn(email, password);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const user = await AuthService.signUp(email, password, displayName);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
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